/*
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-08-10 17:51:11
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-10 17:51:47
 * @FilePath: /electron-vite-vue-template/src/api/case.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from './request.js'
/**
 * @description 其他的案件列表
 * @param {*} data
 * @returns
 */
export const otherCaseList = function (data) {
	return request({
		url: '/case/page',
		method: 'get',
		params: data,
	})
}
/**
 * @description 同步视频至庭
 * @param {*} data
 * @returns
 */
export const syncVideoToTrial = function (data) {
	return request({
		url: '/srs/uploadFlv',
		method: 'post',
		data: data,
        $header:{
            'Content-Type': 'multipart/form-data',
        }
	})
}
