
import { createApp } from 'vue'

import App from './App.vue'

import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'

import router from '@/router/index.js' //路由

import store from '@/store/index.js' //状态管理器

import locale from 'element-plus/lib/locale/lang/zh-cn'

import './styles/index.scss'

import * as ElementPlusIconsVue from '@element-plus/icons-vue' //引elementPlus的icon
const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
	app.component(key, component)
}
app.use(router).use(store)

app.use(ElementPlus, { locale })

app.mount('#app')
