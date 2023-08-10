/*
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-08-10 10:40:21
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-10 10:40:41
 * @FilePath: /electron-vite-vue-template/src/api/login.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from './request.js'
/**
 * 用户登录
 * @param {*} data 
 * @returns 
 */
export const loginIn = function (data) {
	return request({
		url: '/user/login',
		method: 'post',
		data: data,
	})
}