/*
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-07-27 16:15:21
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-02 10:47:10
 * @FilePath: /electron-vite-vue-template/electron/ipcMain.js
 * @Description: 这里是所有的ipcMain注册事件
 *  */
const { ipcMain, dialog, app } = require('electron')
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const { spawn } = require('child_process')

async function saveRecording(recordings) {
	return new Promise((resolve, reject) => {
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
				// archive.append(Buffer.from(recording.buffer), { name: `${recording.name}.webm` })
				const { name, buffer } = recording
				const webmFilePath = path.join(app.getPath('downloads'), `${name}.webm`)
				fs.writeFileSync(webmFilePath, Buffer.from(buffer))

				const flvFilePath = path.join(app.getPath('downloads'), `${name}.flv`)
				//利用ffmpeg 方法转码
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
							flvFilePath: flvFilePath,
							webmFilePath: webmFilePath,
						})
						if (newArray.length && newArray.length === recordings.length) {
							//这个因为是个异步的方法，所以要写在这里面，然后再去进行删除
							await archive.finalize()

							//删除临时文件
							newArray.map((item) => {
								fs.unlinkSync(item.webmFilePath)
								fs.unlinkSync(item.flvFilePath)
							})
							resolve(true)
						}
					} else {
						reject(false)
						console.error(`Video ${name} conversion failed with code: ${code}`)
					}
				})
			}
		}
	})
}
export default {
	setDefaultIpcMain() {
		ipcMain.handle('save-data', async (event, bufferList) => {
			const recordings = bufferList
			await saveRecording(recordings)
			// })
			// return new Promise((resolve, reject) => {
			// 	dialog
			// 		.showSaveDialog({ defaultPath: 'recorded-video.flv' })
			// 		.then(async (result) => {
			// 			if (!result.canceled && result.filePath) {
			// 				// const arrayBuffer = await blob.arrayBuffer();
			// 				fs.writeFile(result.filePath, Buffer.from(arrayBuffer), (err) => {
			// 					if (err) {
			// 						console.error('Error saving video:', err)
			// 						reject(`视频保存错误：${err}`)
			// 					} else {
			// 						console.log('Video saved successfully.')
			// 						resolve()
			// 					}
			// 				})
			// 			}
			// 		})
			// 		.catch((error) => {
			// 			reject('取消保存')
			// 		})
			// })
		})
	},
}
