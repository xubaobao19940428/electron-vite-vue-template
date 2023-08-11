"use strict";
const { ipcMain, dialog: dialog$1, app: app$1, BrowserWindow: BrowserWindow$1 } = require("electron");
const fs = require("fs");
const path$1 = require("path");
require("archiver");
const { spawn } = require("child_process");
const fluentFfmpeg = require("fluent-ffmpeg");
const sqlite3 = require("better-sqlite3");
const recordingProcesses = {};
async function uploadChunk(filePath, chunkNumber, chunkData) {
  const response = await fetch("http://your-server/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Chunk-Number": chunkNumber,
      "X-File-Path": filePath
    },
    body: chunkData
  });
  const result = await response.json();
  console.log("Chunk upload result:", result);
}
function loadUploadStatus(filePath) {
  const statusFilePath = path$1.join(app$1.getPath("download"), filePath, `${filePath}.status.json`);
  if (fs.existsSync(statusFilePath)) {
    const statusData = fs.readFileSync(statusFilePath, "utf-8");
    return JSON.parse(statusData);
  }
  return null;
}
function saveUploadStatus(filePath, status) {
  const statusFilePath = path$1.join(app$1.getPath("downloads"), filePath, `${filePath}.status.json`);
  fs.writeFileSync(statusFilePath, JSON.stringify(status));
}
const setIpc = {
  setDefaultIpcMain() {
    ipcMain.handle("save-data-flv", async (event, { name, buffer, parentDirName }) => {
      try {
        const outputDir = path$1.join(app$1.getPath("downloads"), "videos", `${parentDirName}`);
        const tempWebMPath = path$1.join(outputDir, `${name}.webm`);
        const outputVideoPath = path$1.join(outputDir, `${name}.flv`);
        try {
          await fs.promises.access(outputDir);
        } catch (error) {
          await fs.promises.mkdir(outputDir, { recursive: true });
        }
        await fs.promises.writeFile(tempWebMPath, Buffer.from(buffer));
        console.log("WebM 文件已保存，路径：", tempWebMPath);
        const ffmpegProcess = spawn("ffmpeg", ["-y", "-i", tempWebMPath, "-c:v", "libx264", "-c:a", "aac", "-ar", 44100, "-r", "30", "-strict", "experimental", outputVideoPath]);
        ffmpegProcess.on("error", (err) => {
          console.error("Error converting video:", err);
        });
        ffmpegProcess.stderr.on("data", (data) => {
          console.error(`ffmpeg stderr: ${data}`);
        });
        return new Promise((resolve, reject) => {
          ffmpegProcess.on("close", (code) => {
            if (code === 0) {
              console.log("FLV格式视频保存成功");
              fs.promises.unlink(tempWebMPath).catch((err) => {
                console.error("删除临时WebM文件时出错:", err);
              });
              resolve();
            } else {
              console.error("FFmpeg转换出错", code);
              reject(new Error(`FFmpeg转换出错，错误码：${code}`));
            }
          });
        });
      } catch (error) {
        console.error("Error saving video:", error);
      }
    });
    ipcMain.handle("get-file-list", async (event) => {
      try {
        const videosDir = path$1.join(app$1.getPath("downloads"), "videos");
        const files = await fs.promises.readdir(videosDir);
        const filesList = files.filter((file) => !file.startsWith(".DS_Store"));
        return filesList;
      } catch (error) {
        console.error("Error getting file list:", error);
        throw error;
      }
    });
    ipcMain.handle("get-video-files", async (event, folder) => {
      try {
        const folderPath = path$1.join(app$1.getPath("downloads"), "videos", folder);
        const files = await fs.promises.readdir(folderPath);
        return files;
      } catch (error) {
        console.error("Error getting video files:", error);
        throw error;
      }
    });
    ipcMain.handle("get-video-file-info", async (event, filePath) => {
      try {
        return new Promise((resolve, reject) => {
          fluentFfmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
              console.error("Error getting media info:", err);
              reject(err);
            }
            const startTime = metadata.format.start_time;
            const endTime = startTime + metadata.format.duration;
            const duration = metadata.format.duration;
            resolve({ startTime, duration, endTime, ...metadata.format });
          });
        });
      } catch (error) {
        console.error("Error getting video file info:", error);
        throw error;
      }
    });
    ipcMain.handle("open-window", (event, args) => {
      const ChildWin = new BrowserWindow$1({
        title: args.name
      });
      ChildWin.loadFile(args.path);
      ChildWin.once("ready-to-show", () => {
        ChildWin.show();
      });
      ChildWin.once("show", () => {
      });
    });
    ipcMain.handle("start-upload", async (event, { filePath, chunkSize }) => {
      try {
        const fileSize = fs.statSync(filePath).size;
        const totalChunks = Math.ceil(fileSize / chunkSize);
        let uploadedChunks = 0;
        let status = loadUploadStatus(filePath);
        if (status) {
          uploadedChunks = status.uploadedChunks || 0;
        }
        for (let i = uploadedChunks; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, fileSize);
          const chunkData = fs.readFileSync(filePath, { start, end });
          await uploadChunk(filePath, i, chunkData);
          status = {
            uploadedChunks: i + 1,
            totalChunks
          };
          saveUploadStatus(filePath, status);
          if (i === totalChunks - 1) {
            dialog$1.showMessageBox({
              message: "文件上传完成！",
              type: "info"
            });
          }
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }) / //////////////////////
    // 在主进程中启动录制
    ipcMain.on("start-recording", (event, cameraList, dirName) => {
      let newCameraList = JSON.parse(cameraList);
      newCameraList.forEach(async (camera, index) => {
        const outputDir = path$1.join(app$1.getPath("downloads"), "videos", `${dirName}`);
        try {
          await fs.promises.access(outputDir);
        } catch (error) {
          await fs.promises.mkdir(outputDir, { recursive: true });
        }
        const outputPath = path$1.join(outputDir, `${dirName}_${index}.flv`);
        const ffmpegProcess = spawn("ffmpeg", [
          "-f",
          "avfoundation",
          "-framerate",
          "30",
          "-video_size",
          "640x480",
          "-i",
          `${index}:0`,
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
          "-b:a",
          "256k",
          // 设置音频比特率
          "-ar",
          44100,
          // 设置音频采样率
          // '-af', 'aresample=async=1,highpass=f=200,lowpass=f=3000', // 降噪和滤波
          "-strict",
          "experimental",
          outputPath
        ]);
        recordingProcesses[index] = ffmpegProcess;
        ffmpegProcess.on("close", (code) => {
          if (code === 0) {
            console.log(`摄像头 ${camera.label} 录制完成`);
          } else {
            console.error(`摄像头 ${camera.label} 录制出错，错误码：`, code);
          }
          delete recordingProcesses[index];
        });
      });
    });
    ipcMain.on("stop-recording", () => {
      console.log("Stopping recording for all cameras");
      for (const index in recordingProcesses) {
        recordingProcesses[index].kill();
        delete recordingProcesses[index];
      }
    });
    ipcMain.handle("search-splite3", (event, params) => {
      let serachParmas = JSON.parse(params);
      return new Promise((resolve, reject) => {
        let select = null;
        const db = new sqlite3(path$1.join(app$1.getPath("userData"), "mydb.db"));
        db.exec(`CREATE TABLE IF NOT EXISTS cases (
                    id INTEGER PRIMARY KEY,
                    caseNo TEXT UNIQUE,  -- 设置caseNo字段为唯一键
                    caseViewId TEXT,
                    distributionCaseId TEXT,
                    distributionOrganId TEXT,
                    planTime TEXT,
                    state TEXT,
                    caseOfAction TEXT,
                    caseCompanyList TEXT,
                    caseCourtPlan TEXT,
                    casePeopleList TEXT,
                    caseRequire TEXT,
                    caseTitle TEXT,
                    org TEXT,
                    outTzCase TEXT,
                    syncTime TEXT
                )`);
        if (serachParmas.caseNo) {
          select = db.prepare(`SELECT * FROM cases WHERE caseNo LIKE '%${serachParmas.caseNo}%'`);
        } else {
          select = db.prepare(`SELECT * FROM cases`);
        }
        const caseList = select.all();
        resolve(caseList);
        db.close();
      });
    });
    ipcMain.handle("inset-splite3", (event, params) => {
      return new Promise((resolve, reject) => {
        let newData = JSON.parse(params);
        const db = new sqlite3(path$1.join(app$1.getPath("userData"), "mydb.db"));
        db.exec(`CREATE TABLE IF NOT EXISTS cases (
                id INTEGER PRIMARY KEY,
                caseNo TEXT UNIQUE,  -- 设置caseNo字段为唯一键
                caseViewId TEXT,
                distributionCaseId TEXT,
                distributionOrganId TEXT,
                planTime TEXT,
                state TEXT,
                caseOfAction TEXT,
                caseCompanyList TEXT,
                caseCourtPlan TEXT,
                casePeopleList TEXT,
                caseRequire TEXT,
                caseTitle TEXT,
                org TEXT,
                outTzCase TEXT,
                syncTime TEXT
            )`);
        const insert = db.prepare("INSERT OR REPLACE INTO cases (caseNo,caseViewId,distributionCaseId,distributionOrganId,planTime,state,caseOfAction,caseCompanyList,caseCourtPlan,casePeopleList,caseRequire,caseTitle,org,outTzCase,syncTime) VALUES (@caseNo,@caseViewId,@distributionCaseId,@distributionOrganId,@planTime,@state,@caseOfAction,@caseCompanyList,@caseCourtPlan,@casePeopleList,@caseRequire,@caseTitle,@org,@outTzCase,@syncTime)");
        const insertMany = db.transaction((cats) => {
          cats.forEach((item) => {
            item.caseCompanyList = item.caseCompanyList && item.caseCompanyList.length ? JSON.stringify(item.caseCompanyList) : null;
            item.casePeopleList = item.casePeopleList && item.casePeopleList.length ? JSON.stringify(item.casePeopleList) : null;
            item.caseCourtPlan = item.caseCourtPlan ? JSON.stringify(item.caseCourtPlan) : null;
            insert.run(item);
          });
        });
        insertMany(newData);
        db.close();
        resolve(true);
      });
    });
    ipcMain.handle("search-splite3-case-info", (event, distributionCaseId) => {
      return new Promise((resolve, reject) => {
        let select = null;
        const db = new sqlite3(path$1.join(app$1.getPath("userData"), "mydb.db"));
        select = db.prepare(`SELECT * FROM cases WHERE distributionCaseId = ?`);
        const caseInfo = select.all(distributionCaseId);
        console.log(caseInfo);
        resolve(caseInfo);
        db.close();
      });
    });
  }
};
const { dialog } = require("electron");
const os = require("os");
const version = require("../package.json").version;
const menu = [
  {
    label: "设置",
    submenu: [
      {
        label: "切换到开发者模式",
        accelerator: "CmdOrCtrl+I",
        role: "toggledevtools"
      },
      {
        label: "快速重启",
        accelerator: "F5",
        role: "reload"
      },
      {
        label: "退出",
        accelerator: "CmdOrCtrl+F4",
        role: "close"
      }
    ]
  },
  {
    label: "编辑",
    submenu: [
      {
        label: "撤销",
        accelerator: "CmdOrCtrl+Z",
        role: "undo"
      },
      {
        label: "重做",
        accelerator: "Shift+CmdOrCtrl+Z",
        role: "redo"
      },
      {
        label: "剪切",
        accelerator: "CmdOrCtrl+X",
        role: "cut"
      },
      {
        label: "复制",
        accelerator: "CmdOrCtrl+C",
        role: "copy"
      },
      {
        label: "粘贴",
        accelerator: "CmdOrCtrl+V",
        role: "paste"
      }
    ]
  },
  {
    label: "帮助",
    submenu: [
      {
        label: "关于",
        click: () => {
          info();
        }
      }
    ]
  }
];
function info() {
  dialog.showMessageBox({
    title: "关于",
    type: "info",
    message: "庭审系统录制软件",
    detail: `版本信息：${version}
引擎版本：${process.versions.v8}
当前系统：${os.type()} ${os.arch()} ${os.release()}`,
    noLink: true
    // buttons: ['查看github', '确定'],
  });
}
const { app, BrowserWindow, systemPreferences, Menu } = require("electron");
const path = require("path");
process.env.DIST = path.join(__dirname, "../dist");
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
let mainWindow;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
setIpc.setDefaultIpcMain();
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 780,
    icon: path.join(process.env.PUBLIC, "vite.svg"),
    webPreferences: {
      plugins: true,
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
      enableRemoteModule: true,
      // 如果是开发模式可以使用devTools
      devTools: true
      //   preload: path.join(__dirname, 'preload.js'),
    }
  });
  const menu$1 = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(menu$1);
  mainWindow.webContents.once("dom-ready", () => {
    if (process.platform === "darwin") {
      let getMediaAccessStatus = systemPreferences.getMediaAccessStatus("microphone");
      if (getMediaAccessStatus !== "granted") {
        systemPreferences.askForMediaAccess("microphone");
        systemPreferences.askForMediaAccess("camera");
      }
    }
  });
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow == null ? void 0 : mainWindow.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (process.env.NODE_ENV == "development") {
    mainWindow.webContents.openDevTools();
  }
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(process.env.DIST, "index.html"));
  }
  require("@electron/remote/main").initialize();
  require("@electron/remote/main").enable(mainWindow.webContents);
}
app.on("window-all-closed", () => {
  mainWindow = null;
  app.quit();
});
app.whenReady().then(() => {
  createWindow();
});
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
app.commandLine.appendArgument("no-sandbox");
app.commandLine.appendArgument("disable-setuid-sandbox");
app.commandLine.appendArgument("disable-web-security");
app.commandLine.appendArgument("ignore-certificate-errors");
app.commandLine.appendSwitch("disable-site-isolation-trials");
app.commandLine.appendSwitch("enable-quic");
