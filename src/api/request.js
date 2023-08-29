/*
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-08-10 10:03:50
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-10 14:38:23
 * @FilePath: /electron-vite-vue-template/src/api/request.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

const fs = require('fs')
const path = require('path')

import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import store from '@/store'
import { deepClone } from '@/js/globalMethods.js'
let BASE = ''
const getBaseUrl = function () {
	let configFilePath = ''
	if (process.env.NODE_ENV === 'development') {
		configFilePath = process.cwd() + '/extraResources/configSetting.json'
	} else {
		// const appPath = app.isPackaged ? app.getAppPath() : app.getPath('exe')
		configFilePath = path.join(process.resourcesPath, 'extraResources/configSetting.json')
	}

	const configData = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'))

	console.log('configData', configData)
	return configData
}
BASE = getBaseUrl().baseUrl + '/api'

// 创建 axios 实例
const httpService = axios.create({
	timeout: 45000,
})

/**
 * 发起网络请求
 * @param {string} url 接口地址
 * @param {string} method 请求方法，默认为 'post'
 * @param {*} data 请求数据，用于 post 请求
 * @param {*} $header 额外请求头
 * @param {*} baseUrl 请求地址
 * @param {*} params 请求参数，用于 get 请求
 * @returns {Promise} 返回 Promise 对象
 */
function request({ url, method, data, $header, baseUrl, params }) {
	const headersConfig = {
		'X-Token': localStorage.getItem('xToken') || '',
	}
	if (!headersConfig['X-Token']) {
		delete headersConfig['X-Token']
	}

	return new Promise((resolve, reject) => {
		httpService({
			baseURL: baseUrl ? baseUrl : `${BASE}${url}`, // 设置请求的基础路径
			method: method || 'post', // 设置请求方法，默认为 'post'
			data: data, // 设置请求数据，用于 post 请求
			params: params, // 设置请求参数，用于 get 请求
			headers: Object.assign(headersConfig, $header), // 合并请求头配置
		})
			.then((res) => {
				if (res.status !== 200) {
					const err = new Error('服务器异常')
					throw err
				}
				let result = res.data
				if (result.code == '200' || result.code == '201') {
					resolve(result.data)
				} else {
					if (result.message) {
						ElMessage.error(`错误信息: ${result.message}`)
					}

					reject(result)
				}
			})
			.catch((err) => {
				reject(err.response)
				let errResponseData = {}
				if (err) errResponseData = deepClone(err.response)
				if (errResponseData.status === 401) {
					ElMessageBox.confirm('令牌状态已过期，请点击重新登录', '系统提示', {
						confirmButtonText: '重新登录',
						cancelButtonText: '取消',
						type: 'warning',
					})
						.then(() => {
							store.dispatch('LogOut').then(() => {
								// 刷新登录页面，避免多次弹框
								window.location.reload()
							})
						})
						.catch(() => {})
					return
				} else {
					ElMessage.error(`错误信息: ${errResponseData.data ? errResponseData.data.message : err.message}, 错误码: ${errResponseData.data ? errResponseData.data.code : err.response.status}`)
				}
			})
	})
}

export default request
