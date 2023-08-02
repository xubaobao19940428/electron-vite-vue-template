"use strict";
const { ipcMain, dialog: dialog$1, app: app$1 } = require("electron");
const fs = require("fs");
const path$1 = require("path");
const archiver = require("archiver");
const { spawn } = require("child_process");
async function saveRecording(recordings) {
  return new Promise((resolve, reject) => {
    const outputFilePath = dialog$1.showSaveDialogSync({
      defaultPath: "recordings.zip",
      filters: [{ name: "ZIP Files", extensions: ["zip"] }]
    });
    if (outputFilePath) {
      const output = fs.createWriteStream(outputFilePath);
      const archive = archiver("zip");
      let newArray = [];
      archive.pipe(output);
      for (const recording of recordings) {
        const { name, buffer } = recording;
        const webmFilePath = path$1.join(app$1.getPath("downloads"), `${name}.webm`);
        fs.writeFileSync(webmFilePath, Buffer.from(buffer));
        const flvFilePath = path$1.join(app$1.getPath("downloads"), `${name}.flv`);
        const ffmpeg = spawn("ffmpeg", ["-i", webmFilePath, "-c:v", "copy", "-c:a", "aac", "-ar", 44100, flvFilePath]);
        ffmpeg.on("error", (err) => {
          console.error("Error converting video:", err);
        });
        ffmpeg.stderr.on("data", (data) => {
          console.error(`ffmpeg stderr: ${data}`);
        });
        ffmpeg.on("close", async (code) => {
          if (code === 0) {
            console.log(`Video ${name} converted to FLV successfully.`);
            archive.append(fs.createReadStream(flvFilePath), { name: `${name}.flv` });
            newArray.push({
              flvFilePath,
              webmFilePath
            });
            if (newArray.length && newArray.length === recordings.length) {
              await archive.finalize();
              newArray.map((item) => {
                fs.unlinkSync(item.webmFilePath);
                fs.unlinkSync(item.flvFilePath);
              });
              resolve(true);
            }
          } else {
            reject(false);
            console.error(`Video ${name} conversion failed with code: ${code}`);
          }
        });
      }
    }
  });
}
const setIpc = {
  setDefaultIpcMain() {
    ipcMain.handle("save-data", async (event, bufferList) => {
      const recordings = bufferList;
      await saveRecording(recordings);
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
