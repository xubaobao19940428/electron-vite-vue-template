<!--
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-08-08 14:11:38
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-08 14:56:57
 * @FilePath: /electron-vite-vue-template/src/views/dashboard/index1.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!--  -->
<template>
    <div class="dashboard">
        <div class="dashboard_header">
            <el-button :type="recordingAll ? 'danger' : 'primary'" @click="toggleRecordingAll">
                {{ recordingAll ? '停止录制' : '开始录制' }}
            </el-button>
        </div>
        <div id="dashboard-video">

        </div>
    </div>
</template>

<script>
import { ipcRenderer } from 'electron';
export default {
    data () {
        return {
            videoDeviceList: [],
            recordingAll: false,
        };
    },

    components: {},

    computed: {},

    async mounted () {
        this.getCamera()
    },

    methods: {
        /**
         * 得到时间
         * @param {*} timestamp 
         * @param {*} type 
         */
        timestampToTime (timestamp, type) {
            var date = new Date(timestamp)
            var Y = date.getFullYear() + '-'
            var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
            var D = (date.getDate() + 1 <= 10 ? '0' + date.getDate() : date.getDate()) + (type ? ' ' : '')
            var h = (date.getHours() + 1 <= 10 ? '0' + date.getHours() : date.getHours()) + ':'
            var m = (date.getMinutes() + 1 <= 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':'
            var s = date.getSeconds() + 1 <= 10 ? '0' + date.getSeconds() : date.getSeconds()
            return Y + M + D + h + m + s
        },
        toggleRecordingAll () {
            if (!this.recordingAll) {
                let newTime = this.timestampToTime(new Date().getTime())
                ipcRenderer.send('start-recording', JSON.stringify(this.videoDeviceList), newTime);

                // ipcRenderer.on('record-success-all', (event, outputPath) => {
                //     console.log('所有摄像头录制成功，保存路径：', outputPath);
                //     this.recordingAll = false;
                // });

                // ipcRenderer.on('record-error-all', (event, code) => {
                //     console.error('所有摄像头录制出错，错误码：', code);
                //     this.recordingAll = false;
                // });

                this.recordingAll = true;
            } else {
                ipcRenderer.send('stop-recording');
                this.recordingAll = false;
            }
        },
        /**
        * 得到摄像头列表
        */
        async getCamera () {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.videoDeviceList = devices.filter((device) => device.kind === 'videoinput');
            console.log(this.videoDeviceList)
        },
    }
}

</script>
<style lang='scss' scoped>
.dashboard {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 10px 0;
    box-sizing: border-box;
    overflow: hidden;

    .dashboard_header {
        display: flex;
        margin-bottom: 10px;
        padding: 0 10px;
        box-sizing: border-box;
    }

    #dashboard-video {
        flex: 1;
        display: grid;
        grid-template-areas: 'a b';
        grid-gap: 16px;
        /* 为行和列都增加了16px的间隙。 */
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        box-sizing: border-box;


        :deep().video-box {
            background-color: #111111;

            .video-box-child {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
        }
    }


}
</style>