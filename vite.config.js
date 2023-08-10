/*
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-07-24 09:32:29
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-10 15:53:05
 * @FilePath: /electron-trial/vite.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
export default defineConfig({
	base: './',
	server: {
		proxy: {
			// 选项写法
			'/api/': {
				// target: 'https://192.168.0.87:30066/trailv2',
				target: 'https://192.168.0.87:30061/trailv2',
				// target: 'http://192.168.0.71:8060/trailv2',
				// target: 'http://192.168.0.203:8060/trailv2',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/api/, '/api'),
			},
			// 正则表达式写法
			// '^/fallback/.*': {
			// 	target: 'http://jsonplaceholder.typicode.com',
			// 	changeOrigin: true,
			// 	rewrite: (path) => path.replace(/^\/fallback/, ''),
			// },
		},
        port: 9000,
		host: '0.0.0.0',
		open: true,
		https: false,
		cors: true,
		hmr: true,
	},
	plugins: [
		vue(),
		electron([
			{
				// Main-Process entry file of the Electron App.
				entry: 'electron/main.js',
			},
			{
				entry: 'electron/preload.js',
				onstart(options) {
					// Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
					// instead of restarting the entire Electron App.
					options.reload()
				},
			},
		]),
		renderer(),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
    css: {
		preprocessorOptions: {
			scss: {
				additionalData: '@import "@/styles/main.scss";',
			},
		},
	},
})
