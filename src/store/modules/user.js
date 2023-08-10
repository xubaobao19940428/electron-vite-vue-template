/*
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-08-10 10:09:11
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-10 16:15:45
 * @FilePath: /electron-vite-vue-template/src/store/modules/user.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import router from '@/router/index.js'
const user = {
	state: {
		token: '',
		name: localStorage.getItem('name') || '',
        password: localStorage.getItem('password') || '',
	},
	mutations: {
		SET_TOKEN: (state, token) => {
			state.token = token
			localStorage.setItem('xToken', token)
		},

		SET_NAME: (state, name) => {
			state.name = name
			localStorage.setItem('name', name)
		},
        SET_PASSWORD:(state,password)=>{
            state.password = password
			localStorage.setItem('password', password)
        }
	},
	actions: {
		setUserInfo({ commit }, userInfo) {
			commit('SET_TOKEN', userInfo.token)

			router.push({ path: '/' })
		},
		LogOut({ commit }) {
			return new Promise((resolve, reject) => {
				localStorage.removeItem('xToken')
				router
					.replace({ name: 'login' })
					.then((res) => {
						resolve()
					})
					.catch((error) => {})
			})
		},
	},
}
export default user
