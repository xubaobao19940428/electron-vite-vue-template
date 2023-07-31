/*
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-07-24 09:32:29
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-07-31 09:47:09
 * @FilePath: /electron-vite-vue-template/src/main.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import 'element-plus/dist/index.css'
// import '@/js/requestConfig.js' //引入的request url的配置 暂时保留
import ElementPlus from 'element-plus'
import router from '@/router/index.js' //路由


import zhCn from 'element-plus/lib/locale/lang/zh-cn'
import './styles/index.scss'

import * as ElementPlusIconsVue from '@element-plus/icons-vue' //引elementPlus的icon
const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
	app.component(key, component)
}
app.use(router)
app.use(ElementPlus, { zhCn })
app.mount('#app')
