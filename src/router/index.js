import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
	{
		path: '/',
		redirect: '/dashboard/home',
	},
	{
		path: '/dashboard/home',
		name: 'dashboard',
		component: () => import('@/views//dashboard/index.vue'),
		meta: {
			key: 'MENU_UPGRADE',
			title: '首页',
			noPermission: true,
		},
	},
	{
		path: '/404',
		name: '404',
		component: () => import('@/views/404.vue'),
		meta: {
			key: 'MENU_UPGRADE',
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
