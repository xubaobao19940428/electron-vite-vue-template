/*
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-08-04 09:35:33
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-04 09:37:46
 * @FilePath: /electron-trial/build/electron.build.config.js
 * @Description: 这是打包配置
 */
module.exports = {
	asar: false,
	extraFiles: [],
	extraResources: [{ from: './extraResources/', to: 'extraResources' }],//额外文件
	publish: [
		{
			provider: 'generic',
			url: 'http://127.0.0.1',
		},
	],
	productName: '庭审系统桌面端',
	appId: 'org.Sky.electron-trial',
	directories: {
		output: 'output',
	},
	files: ['dist-electron', 'dist'],
	dmg: {
		contents: [
			{
				x: 410,
				y: 150,
				type: 'link',
				path: '/Applications',
			},
			{
				x: 130,
				y: 150,
				type: 'file',
			},
		],
	},
	mac: {
		entitlements: 'entitlements.mac.plist',
		hardenedRuntime: true,
		extendInfo: {
			NSMicrophoneUsageDescription: '请允许本程序访问您的麦克风',
			NSCameraUsageDescription: '请允许本程序访问您的摄像头',
		},
		icon: 'build/icons/icon.icns',
		target: ['dmg'],
	},
	win: {
		icon: 'build/icons/icon.ico',
		target: [
			{
				target: 'nsis',
				arch: ['x64', 'ia32'],
			},
		],
	},
	linux: {
		target: 'deb',
		icon: 'build/icons/icon.png',
	},
}
