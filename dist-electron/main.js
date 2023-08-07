"use strict";
const { ipcMain, dialog: dialog$1, app: app$1, BrowserWindow: BrowserWindow$1 } = require("electron");
const fs = require("fs");
const path$1 = require("path");
require("archiver");
const { spawn } = require("child_process");
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
        console.log("正在保存视频");
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
        const durationProcess = spawn("ffprobe", ["-i", filePath, "-show_entries", "format=duration", "-v", "error", "-of", "csv=p=0"], { stdio: "pipe" });
        const startTimeProcess = spawn("ffprobe", ["-i", filePath, "-show_entries", "format_tags=creation_time", "-v", "error", "-of", "csv=p=0"], { stdio: "pipe" });
        let duration = null;
        let startTime = null;
        durationProcess.stdout.on("data", (data) => {
          duration = parseFloat(data.toString().trim());
        });
        startTimeProcess.stdout.on("data", (data) => {
          startTime = new Date(data.toString().trim()).getTime() / 1e3;
        });
        return new Promise((resolve, reject) => {
          durationProcess.on("close", (durationCode) => {
            startTimeProcess.on("close", (startTimeCode) => {
              if (durationCode === 0 && startTimeCode === 0 && duration !== null && startTime !== null) {
                const endTime = startTime + duration;
                const fileInfo = {
                  duration,
                  // 时长（秒）
                  startTime,
                  // 开始时间（秒）
                  endTime
                  // 结束时间（秒）
                };
                resolve(fileInfo);
              } else {
                console.error("FFmpeg获取FLV文件信息出错", durationCode, startTimeCode);
                reject(new Error("FFmpeg获取FLV文件信息出错"));
              }
            });
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
    width: 1280,
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
