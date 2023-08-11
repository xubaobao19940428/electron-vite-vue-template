/*
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-07-25 10:54:57
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-10 17:37:46
 * @FilePath: /electron-vite-vue-template/src/router/index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
	{
		path: '/',
		redirect: '/dashboard/home2',
	},
	{
		path: '/dashboard/home2',
		name: 'dashboard2',
		component: () => import('@/views/dashboard/index2.vue'),
		meta: {
			title: '首页',
			noPermission: true,
		},
	},
	{
		path: '/dashboard/openCaseInfo',
		name: 'openCaseInfo',
		component: () => import('@/views/dashboard/openCaseInfo.vue'),
		meta: {
			title: '案件详情信息',
			noPermission: true,
		},
	},
	{
		path: '/dashboard/home',
		name: 'dashboard',
		component: () => import('@/views/dashboard/index.vue'),
		meta: {
			title: '首页',
			noPermission: true,
		},
	},
	{
		path: '/dashboard/home1',
		name: 'dashboard1',
		component: () => import('@/views/dashboard/index1.vue'),
		meta: {
			title: '首页',
			noPermission: true,
		},
	},
	{
		path: '/login',
		name: 'login',
		component: () => import('@/views/login/index.vue'),
		meta: {
			title: '登录页',
			noPermission: true,
		},
	},
	{
		path: '/404',
		name: '404',
		component: () => import('@/views/404.vue'),
		meta: {
			title: '404',
			noPermission: true,
		},
	},
]
const router = createRouter({
	history: createWebHashHistory(),
	routes,
	scrollBehavior(to, from, savedPosition) {
		if (savedPosition) {
			return savedPosition
		} else {
			return { x: 0, y: 0 }
		}
	},
})
export default router
