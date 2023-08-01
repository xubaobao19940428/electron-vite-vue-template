'use strict'
const { ipcMain: ipcMain$1, dialog, app: app$1 } = require('electron')
const fs = require('fs')
const path$1 = require('path')
const archiver = require('archiver')
const { spawn } = require('child_process')
async function saveRecording(recordings) {
	const outputFilePath = dialog.showSaveDialogSync({
		defaultPath: 'recordings.zip',
		filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
	})
	if (outputFilePath) {
		const output = fs.createWriteStream(outputFilePath)
		const archive = archiver('zip')
		let newArray = []
		archive.pipe(output)
		for (const recording of recordings) {
			const { name, buffer } = recording
			const webmFilePath = path$1.join(app$1.getPath('downloads'), `${name}.webm`)
			fs.writeFileSync(webmFilePath, Buffer.from(buffer))
			const flvFilePath = path$1.join(app$1.getPath('downloads'), `${name}.flv`)
			const ffmpeg = spawn('ffmpeg', ['-i', webmFilePath, '-c:v', 'copy', '-c:a', 'aac', '-ar', 44100, flvFilePath])
			ffmpeg.on('error', (err) => {
				console.error('Error converting video:', err)
			})
			ffmpeg.stderr.on('data', (data) => {
				console.error(`ffmpeg stderr: ${data}`)
			})
			ffmpeg.on('close', async (code) => {
				if (code === 0) {
					console.log(`Video ${name} converted to FLV successfully.`)
					archive.append(fs.createReadStream(flvFilePath), { name: `${name}.flv` })
					newArray.push({
						flvFilePath,
						webmFilePath,
					})
					if (newArray.length && newArray.length === recordings.length) {
						await archive.finalize()
						newArray.map((item) => {
							fs.unlinkSync(item.webmFilePath)
							fs.unlinkSync(item.flvFilePath)
						})
					}
				} else {
					console.error(`Video ${name} conversion failed with code: ${code}`)
				}
			})
		}
	}
}
const setIpc = {
	setDefaultIpcMain() {
		ipcMain$1.handle('save-data', (event, bufferList) => {
			const recordings = bufferList
			saveRecording(recordings)
		})
	},
}
const { app, BrowserWindow, systemPreferences, ipcMain } = require('electron')
const path = require('path')
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
	mainWindow.webContents.once('dom-ready', () => {
		if (process.platform === 'darwin') {
			let getMediaAccessStatus = systemPreferences.getMediaAccessStatus('microphone')
			if (getMediaAccessStatus !== 'granted') {
				systemPreferences.askForMediaAccess('microphone')
				systemPreferences.askForMediaAccess('camera')
			}
		}
	})
	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow == null ? void 0 : mainWindow.webContents.send('main-process-message', /* @__PURE__ */ new Date().toLocaleString())
	})
	if (process.env.NODE_ENV == 'development') {
		mainWindow.webContents.openDevTools()
	}
	if (VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(VITE_DEV_SERVER_URL)
	} else {
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
	createWindow()
})
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.commandLine.appendArgument('no-sandbox')
app.commandLine.appendArgument('disable-setuid-sandbox')
app.commandLine.appendArgument('disable-web-security')
app.commandLine.appendArgument('ignore-certificate-errors')
app.commandLine.appendSwitch('disable-site-isolation-trials')
app.commandLine.appendSwitch('enable-quic')
