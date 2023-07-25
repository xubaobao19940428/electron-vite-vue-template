import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		electron([
			{
				// Main-Process entry file of the Electron App.
				entry: 'electron/main.js',
			},

		]),
		renderer(),
	],
    resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
})
