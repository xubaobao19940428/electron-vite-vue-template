<template>
    <div class="login">
        <div class="login-title">欢迎使用劳动仲裁管理系统</div>
        <div class="content">
            <div class="left">
                <img src="@/assets/login/login-left.png" alt="" class="img-4">
            </div>
            <div class="right">
                <el-form class="form" ref="loginForm" :model="loginForm" :rules="loginRules" label-position="top">
                    <el-form-item label="账号" prop="username">
                        <el-input v-model="loginForm.username" autocomplete="on" placeholder="请输入账号"> </el-input>
                    </el-form-item>
                    <el-form-item label="密码" prop="password">
                        <el-input type="password" v-model="loginForm.password" autocomplete="on" placeholder="请输入密码"
                            @keyup.enter.native="handleLogin" show-password> </el-input>
                    </el-form-item>
                    <el-form-item class="center">
                        <el-button type="primary" :disabled="loading" @click.native.prevent="handleLogin">
                            <span class="btn-text">登 录</span>
                            <span class="icon" :class="loading ? 'el-icon-loading' : 'el-icon-right'"></span>
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>

<script>
import { loginIn } from '@/api/login.js'
import md5 from 'js-md5'
export default {
    data () {
        let validatePass = (rule, value, callback) => {
            if (value === "") {
                callback(new Error("请输入密码"));
            } else {
                //密码正则，最少8位，包括至少1个大写字母，1个小写字母，1个数字，1个特殊字符
                let reg = /^.*(?=.{8,})(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*? ]).*$/;
                if (!reg.test(value)) {
                    callback(
                        new Error("请输入8~20位,包括至少1个大写字母,1个小写字母,1个数字,1个特殊字符")
                    );
                }
                callback();
            }
        }
        return {
            loginForm: {
                username: '',
                password: '',
            },
            loginRules: {
                username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
                password: [
                    { required: true, trigger: "change", validator: validatePass },
                    { min: 12, message: '密码长度最少为12位', trigger: 'blur' },
                ],
            },
            passwordType: 'password',
            loading: false, // 登录中
        }
    },
    computed: {
        
    },
    mounted(){
        let name = localStorage.getItem('name')
        if(name){
            this.loginForm.username = name
            this.loginForm.password = localStorage.getItem('password')
        }
    },
    methods: {
        // 是否显示明文密码 
        showPassword () {
            this.passwordType === '' ? (this.passwordType = 'password') : (this.passwordType = '')
        },
        // 登录
        handleLogin () {
            this.$refs.loginForm.validate((valid) => {
                if (valid) {
                    (this.loading = true),
                        loginIn({
                            username: this.loginForm.username,
                            password: md5(this.loginForm.password + '31bb19f84c6789827588e68a2e940b0d'),
                        })
                            .then((response) => {
                                console.log(response)
                                this.$store.dispatch('setUserInfo', response)
                                this.$store.commit('SET_NAME', this.loginForm.username)
                                this.$store.commit('SET_PASSWORD', this.loginForm.password)
                            })
                            .finally(() => {
                                this.loading = false
                            })
                } else {
                    return false
                }
            })
        },
    },
}
</script>

<style lang="scss" scoped>
.login {

    height: 100%;
    min-height: 780px;
    min-width: 1280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-image: url('@/assets/login/login-bg.png');
    background-repeat: no-repeat;

    .login-title {

        font-size: 60px;
        font-weight: 500;
        font-family: YouSheBiaoTiHei;
        color: #FFFFFF;
        line-height: 82px;
        text-shadow: 0px 5px 5px rgba(218, 170, 17, 0.1), 0px 6px 29px rgba(33, 64, 152, 0.1);
        background: linear-gradient(270deg, #FFD296 0%, #FFFAEC 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: 18px;
        margin-bottom: 50px;
    }

    .content {
        width: 881px;
        height: 455px;
        display: flex;
        border-radius: 12px;
        background: linear-gradient(180deg, #FFFFFF, #FFFFFF, #CFEAFF);
        box-shadow: 0px 11px 38px 0px rgba(33, 64, 152, 0.25);
        overflow: hidden;

        .left {
            position: relative;
            flex: 1;
            height: 100%;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;

            .img-4 {
                height: 300px;
                transform: rotateY(-180deg);
            }
        }

        .right {
            flex: 1;
            height: 100%;
            // background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;

            .form {
                width: 420px;

                :deep(.el-input) {
                    --el-input-height: 40px;
                }

                :deep(.el-form-item__label) {
                    font-size: 16px;
                }

                .center {
                    display: flex;
                    justify-content: center;
                    margin-top: 40px;

                    :deep(.el-button) {
                        position: relative;
                        font-size: 16px;
                        height: 40px;
                        border-radius: 12px;
                        width: 100%;
                        height: 49px;
                        // background: linear-gradient(-90deg, #6299FF, #2968DD);
                        box-shadow: 2px 8px 18px 0px rgba(72, 141, 255, 0.32);
                        // line-height: 32px;
                        // box-shadow: 2px 12px 26px 0 rgba(55, 108, 187, 0.3);

                        .btn-text {
                            padding-right: 15px;
                        }

                        .icon {
                            position: absolute;
                            top: 12px;
                            right: 31px;
                            font-size: 24px;
                        }
                    }
                }
            }
        }
    }
}
</style>
