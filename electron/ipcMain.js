/*
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-07-27 16:15:21
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-08 17:54:13
 * @FilePath: /electron-vite-vue-template/electron/ipcMain.js
 * @Description: 这里是所有的ipcMain注册事件
 *  */
const { ipcMain, dialog, app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const { spawn } = require('child_process')
const fluentFfmpeg = require('fluent-ffmpeg')
// 定义一个数组来存储正在录制的摄像头
// const recordingProcesses = []
const recordingProcesses = {}
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

/**
 * 文件上传
 */
async function uploadChunk(filePath, chunkNumber, chunkData) {
	const response = await fetch('http://your-server/upload', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/octet-stream',
			'X-Chunk-Number': chunkNumber,
			'X-File-Path': filePath,
		},
		body: chunkData,
	})

	const result = await response.json()
	console.log('Chunk upload result:', result)
}

function loadUploadStatus(filePath) {
	const statusFilePath = path.join(app.getPath('download'), filePath, `${filePath}.status.json`)
	if (fs.existsSync(statusFilePath)) {
		const statusData = fs.readFileSync(statusFilePath, 'utf-8')
		return JSON.parse(statusData)
	}
	return null
}

function saveUploadStatus(filePath, status) {
	const statusFilePath = path.join(app.getPath('downloads'), filePath, `${filePath}.status.json`)
	fs.writeFileSync(statusFilePath, JSON.stringify(status))
}
export default {
	setDefaultIpcMain() {
		//注释掉的这一段代码是用来将录屏问件保存为zip作准备
		// 	ipcMain.handle('save-data', async (event, bufferList) => {
		// 		const recordings = bufferList
		// 		await saveRecording(recordings)
		// 		// })
		// 		// return new Promise((resolve, reject) => {
		// 		// 	dialog
		// 		// 		.showSaveDialog({ defaultPath: 'recorded-video.flv' })
		// 		// 		.then(async (result) => {
		// 		// 			if (!result.canceled && result.filePath) {
		// 		// 				// const arrayBuffer = await blob.arrayBuffer();
		// 		// 				fs.writeFile(result.filePath, Buffer.from(arrayBuffer), (err) => {
		// 		// 					if (err) {
		// 		// 						console.error('Error saving video:', err)
		// 		// 						reject(`视频保存错误：${err}`)
		// 		// 					} else {
		// 		// 						console.log('Video saved successfully.')
		// 		// 						resolve()
		// 		// 					}
		// 		// 				})
		// 		// 			}
		// 		// 		})
		// 		// 		.catch((error) => {
		// 		// 			reject('取消保存')
		// 		// 		})
		// 		// })
		// 	})
		/**
		 * 录制视频保存到本地
		 */
		ipcMain.handle('save-data-flv', async (event, { name, buffer, parentDirName }) => {
			try {
				const outputDir = path.join(app.getPath('downloads'), 'videos', `${parentDirName}`)
				const tempWebMPath = path.join(outputDir, `${name}.mp4`)
				const outputVideoPath = path.join(outputDir, `${name}.flv`) // 使用视频保存路径
				try {
					await fs.promises.access(outputDir)
				} catch (error) {
					await fs.promises.mkdir(outputDir, { recursive: true })
				}

				// 保存文件有的话就替换，没有的话就替换
				await fs.promises.writeFile(tempWebMPath, Buffer.from(buffer))

				console.log('WebM 文件已保存，路径：', tempWebMPath) // 添加此行来确认临时文件的路径
				// 'libx264'将视频编码格式保存为h264不然会导致视频只有音频没有视频
				// 使用FFmpeg进行格式转换
				const ffmpegProcess = spawn('ffmpeg', ['-y', '-i', tempWebMPath, '-c:v', 'libx264', '-c:a', 'aac', '-ar', 44100, '-r', '30', '-strict', 'experimental', outputVideoPath])
				ffmpegProcess.on('error', (err) => {
					console.error('Error converting video:', err)
				})
				ffmpegProcess.stderr.on('data', (data) => {
					console.error(`ffmpeg stderr: ${data}`)
				})
				return new Promise((resolve, reject) => {
					ffmpegProcess.on('close', (code) => {
						if (code === 0) {
							console.log('FLV格式视频保存成功')
							// 删除临时的WebM文件
							fs.promises.unlink(tempWebMPath).catch((err) => {
								console.error('删除临时WebM文件时出错:', err)
							})

							resolve()
						} else {
							console.error('FFmpeg转换出错', code)
							reject(new Error(`FFmpeg转换出错，错误码：${code}`))
						}
					})
				})
			} catch (error) {
				console.error('Error saving video:', error)
			}
		})
		/**
		 * 得到vide内的文件列表
		 */
		ipcMain.handle('get-file-list', async (event) => {
			try {
				const videosDir = path.join(app.getPath('downloads'), 'videos')
				const files = await fs.promises.readdir(videosDir)
				const filesList = files.filter((file) => !file.startsWith('.DS_Store'))
				return filesList
			} catch (error) {
				console.error('Error getting file list:', error)
				throw error
			}
		})
		/**
		 * 得到视频列表
		 */
		ipcMain.handle('get-video-files', async (event, folder) => {
			try {
				const folderPath = path.join(app.getPath('downloads'), 'videos', folder)
				const files = await fs.promises.readdir(folderPath)
				return files
			} catch (error) {
				console.error('Error getting video files:', error)
				throw error
			}
		})
		/**
		 * 得到视频具体信息
		 */
		ipcMain.handle('get-video-file-info', async (event, filePath) => {
			try {
				// 使用FFmpeg获取FLV文件信息
				return new Promise((resolve, reject) => {
					fluentFfmpeg.ffprobe(filePath, (err, metadata) => {
						if (err) {
							console.error('Error getting media info:', err)
							reject(err)
						}

						// 从 metadata 中获取开始时间、结束时间和时长
						const startTime = metadata.format.start_time
						const endTime = startTime + metadata.format.duration
						const duration = metadata.format.duration
						resolve({ startTime, duration, endTime, ...metadata.format })
					})
				})
			} catch (error) {
				console.error('Error getting video file info:', error)
				throw error
			}
		})
		/**
		 * 观看视频
		 */
		ipcMain.handle('open-window', (event, args) => {
			const ChildWin = new BrowserWindow({
				title: args.name,
			})
			// 开发模式下自动开启devtools
			ChildWin.loadFile(args.path)
			ChildWin.once('ready-to-show', () => {
				ChildWin.show()
			})
			// 渲染进程显示时触发
			ChildWin.once('show', () => {
				// ChildWin.webContents.send('send-data-test', args.sendData)
			})
		})
		/**
		 * 文件上传
		 */
		ipcMain.handle('start-upload', async (event, { filePath, chunkSize }) => {
			try {
				const fileSize = fs.statSync(filePath).size
				const totalChunks = Math.ceil(fileSize / chunkSize)

				let uploadedChunks = 0
				let status = loadUploadStatus(filePath)

				if (status) {
					uploadedChunks = status.uploadedChunks || 0
				}

				for (let i = uploadedChunks; i < totalChunks; i++) {
					const start = i * chunkSize
					const end = Math.min(start + chunkSize, fileSize)

					const chunkData = fs.readFileSync(filePath, { start, end })
					await uploadChunk(filePath, i, chunkData)

					status = {
						uploadedChunks: i + 1,
						totalChunks,
					}
					saveUploadStatus(filePath, status)

					if (i === totalChunks - 1) {
						dialog.showMessageBox({
							message: '文件上传完成！',
							type: 'info',
						})
					}
				}
			} catch (error) {
				console.error('Error uploading file:', error)
			}
		}) /
			//////////////////////
			// 在主进程中启动录制
			ipcMain.on('start-recording', (event, cameraList, dirName) => {
				let newCameraList = JSON.parse(cameraList)
				newCameraList.forEach(async (camera, index) => {
					const outputDir = path.join(app.getPath('downloads'), 'videos', `${dirName}`)
					try {
						await fs.promises.access(outputDir)
					} catch (error) {
						await fs.promises.mkdir(outputDir, { recursive: true })
					}
					const outputPath = path.join(outputDir, `${dirName}_${index}.flv`) // 生成路径文件
					const ffmpegProcess = spawn('ffmpeg', [
						'-f',
						'avfoundation',
						'-framerate',
						'30',
						'-video_size',
						'640x480',
						'-i',
						`${index}:0`,
						'-c:v',
						'libx264',
						'-c:a',
						'aac',
						'-b:a',
						'256k', // 设置音频比特率
						'-ar',
						44100, // 设置音频采样率
						// '-af', 'aresample=async=1,highpass=f=200,lowpass=f=3000', // 降噪和滤波
                        '-strict','experimental',
						outputPath,
					])

					recordingProcesses[index] = ffmpegProcess

					ffmpegProcess.on('close', (code) => {
						if (code === 0) {
							console.log(`摄像头 ${camera.label} 录制完成`)
						} else {
							console.error(`摄像头 ${camera.label} 录制出错，错误码：`, code)
						}
						delete recordingProcesses[index]
					})
				})
			})
		// 监听停止录制事件
		ipcMain.on('stop-recording', () => {
			console.log('Stopping recording for all cameras')
			for (const index in recordingProcesses) {
				recordingProcesses[index].kill()
				delete recordingProcesses[index]
			}
		})
	},
}
