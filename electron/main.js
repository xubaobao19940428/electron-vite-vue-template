/*
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-07-27 16:12:58
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-02 11:00:23
 * @FilePath: /electron-vite-vue-template/electron/main.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const { app, BrowserWindow, systemPreferences, Menu } = require('electron')
const path = require('path')
import setIpc from './ipcMain.js'
import menuconfig from './menu'
// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let mainWindow

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

setIpc.setDefaultIpcMain()
function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 780,
		icon: path.join(process.env.PUBLIC, 'vite.svg'),
		webPreferences: {
			plugins: true,
			contextIsolation: false,
			nodeIntegration: true,
			webSecurity: false,
			enableRemoteModule: true,
			// 如果是开发模式可以使用devTools
			devTools: true,
			//   preload: path.join(__dirname, 'preload.js'),
		},
	})
	// 载入菜单
	const menu = Menu.buildFromTemplate(menuconfig)
	Menu.setApplicationMenu(menu)
	mainWindow.webContents.once('dom-ready', () => {
		if (process.platform === 'darwin') {
			let getMediaAccessStatus = systemPreferences.getMediaAccessStatus('microphone')
			if (getMediaAccessStatus !== 'granted') {
				//请求麦克风、摄像头权限
				systemPreferences.askForMediaAccess('microphone')
				systemPreferences.askForMediaAccess('camera')
			}
		}
	})

	// Test active push message to Renderer-process.
	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow?.webContents.send('main-process-message', new Date().toLocaleString())
	})
	if (process.env.NODE_ENV == 'development') {
		mainWindow.webContents.openDevTools()
	}

	if (VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(VITE_DEV_SERVER_URL)
	} else {
		// win.loadFile('dist/index.html')
		mainWindow.loadFile(path.join(process.env.DIST, 'index.html'))
	}

	require('@electron/remote/main').initialize()
	require('@electron/remote/main').enable(mainWindow.webContents)
}

app.on('window-all-closed', () => {
	mainWindow = null
	app.quit()
})

app.whenReady().then(() => {
	// ipcMain.on('REMOTE_BROWSER_GET_BUILTIN', (event, args) => {
	// 	// 在这里处理同步消息并返回响应
	// 	const response = '这是主进程返回的响应'
	// 	event.returnValue = response
	// })
	createWindow()
})
// 解决9.x跨域异常问题
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

app.commandLine.appendArgument('no-sandbox')
app.commandLine.appendArgument('disable-setuid-sandbox')
app.commandLine.appendArgument('disable-web-security')
app.commandLine.appendArgument('ignore-certificate-errors')

app.commandLine.appendSwitch('disable-site-isolation-trials')
app.commandLine.appendSwitch('enable-quic')
