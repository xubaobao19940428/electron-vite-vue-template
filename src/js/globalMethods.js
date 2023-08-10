/**
 * 深拷贝
 * @param {*} source
 * @returns
 */

export const deepClone = function (source) {
	if (!source && typeof source !== 'object') {
		throw new Error('error arguments', 'shallowClone')
	}
	const targetObj = source.constructor === Array ? [] : {}
	Object.keys(source).forEach((keys) => {
		if (source[keys] && typeof source[keys] === 'object') {
			targetObj[keys] = deepClone(source[keys])
		} else {
			targetObj[keys] = source[keys]
		}
	})
	return targetObj
}
/**
 * 时间转换
 * @param {*} timestamp 
 * @param {*} type 
 * @returns 
 */
export const timestampToTime = (timestamp) => {
	var date = new Date(timestamp)
	var Y = date.getFullYear() + '-'
	var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
	var D = (date.getDate() + 1 <= 10 ? '0' + date.getDate() : date.getDate()) + ' '
	var h = (date.getHours() + 1 <= 10 ? '0' + date.getHours() : date.getHours()) + ':'
	var m = (date.getMinutes() + 1 <= 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':'
	var s = date.getSeconds() + 1 <= 10 ? '0' + date.getSeconds() : date.getSeconds()
	return Y + M + D + h + m + s
}