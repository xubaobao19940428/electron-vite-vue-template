import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'element-plus/dist/index.css'
// import '@/js/requestConfig.js' //引入的request url的配置 暂时保留
import ElementPlus from 'element-plus'
import router from '@/router/index.js' //路由

import zhCn from 'element-plus/lib/locale/lang/zh-cn'

import * as ElementPlusIconsVue from '@element-plus/icons-vue' //引elementPlus的icon
const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
	app.component(key, component)
}
app.use(router)
app.use(ElementPlus, { zhCn })
app.mount('#app')
