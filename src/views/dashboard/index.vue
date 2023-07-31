<!--  -->
<template>
    <div class="dashboard">
        <el-button type="primary" @click="startRecord()" v-if="!start">开始录制</el-button>
        <el-button type="danger" @click="stopRecord" v-else>停止录制</el-button>
        <div id="dashboard-video">
            <!-- <video autoplay muted id="videoElement"></video> -->
        </div>
        <!-- <el-select v-model="currentDeviceId" placeholder="请选择" @change="changeCamera">
            <el-option v-for="item in videoDeviceList" :key="item.deviceId" :label="item.label" :value="item.deviceId">
            </el-option>
        </el-select> -->
    </div>
</template>

<script>
import { ipcRenderer } from 'electron';
const options = { mimeType: 'video/webm; codecs=h264' }
//主进程引入
export default {
    data () {
        return {
            videoDeviceList: [],
            currentDeviceId: '',
            streamList: [],
            videoElement: null,
            start: false,
            mediaRecorderList: [],
            chunksArray: []
        };
    },

    components: {},

    computed: {},

    async mounted () {
        let _this = this
        await _this.getCamera()
        // _this.videoElement = document.getElementById('videoElement')
        // 初始化页面时启动摄像头
        // navigator.mediaDevices.getUserMedia({ video: true, audio: true, }).then((stream) => {
        //     _this.videoElement.srcObject = stream;
        //     _this.stream = stream
        //     _this.currentDeviceId = _this.videoElement.srcObject?.getVideoTracks()[0]?.getSettings()?.deviceId;
        // }).catch((error) => {
        //     console.error('Error accessing camera:', error);
        // });
    },

    methods: {
        /**
         * 得到摄像头列表
         */
        async getCamera () {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter((device) => device.kind === 'videoinput');
            this.videoDeviceList = videoDevices
            this.setVideoAttch(this.videoDeviceList)
        },
        /**
         * 设置videoList的渲染
         * @param {*} videoDeviceList 
         */
        async setVideoAttch (videoDeviceList) {
            let _this = this
            let dashboardVideo = document.getElementById('dashboard-video')
            videoDeviceList.map(async item => {
                let videoBox = document.createElement('div')
                let videoElement = document.createElement('video')
                videoBox.setAttribute('class', 'video-box')
                videoElement.setAttribute('autoplay', true)
                videoElement.setAttribute('class', `${item.deviceId} video-box-child`)
                const constraints = {
                    audio: true,
                    video: {
                        deviceId: { exact: item.deviceId },
                        frameRate: 30, // 将帧率设置为 30 帧/秒
                    },
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                _this.streamList.push(stream)
                videoElement.srcObject = stream
                videoBox.append(videoElement)
                dashboardVideo.append(videoBox)
            })
        },
        // async changeCamera (data) {
        //     await this.startCamera(data)

        // },
        // async startCamera (deviceId) {
        //     let _this = this

        //     try {
        //         const constraints = {
        //             audio: true,
        //             video: {
        //                 deviceId: { exact: deviceId },
        //             },
        //         };
        //         const stream = await navigator.mediaDevices.getUserMedia(constraints);
        //         _this.videoElement.srcObject = stream;
        //         _this.stream = stream

        //     } catch (error) {
        //         console.error('Error accessing camera:', error);
        //     }
        // },
        /**
         * 开始录制
         */
        async startRecord () {
            let _this = this
            try {
                _this.start = true
                _this.mediaRecorderList = _this.streamList.map(stream => { return new MediaRecorder(stream, options) })
                Promise.all(
                    _this.mediaRecorderList.map((mediaRecorder, index) => {
                        return new Promise((resolve) => {
                            let startTime = null;
                            const chunks = [];

                            mediaRecorder.ondataavailable = (event) => {
                                if (event.data.size > 0) {
                                    chunks.push(event.data);
                                }
                            };
                            mediaRecorder.onstart = () => {
                                startTime = Date.now(); // 记录录制开始时间
                            };
                            mediaRecorder.onstop = () => {
                                const blob = new Blob(chunks, { type: "video/webm" });
                                //视频流读取传给ipcMain
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    // _this.videoDeviceList[index].label ||
                                    resolve({
                                        name:  `camera${index}`,
                                        buffer: reader.result,
                                    });
                                };
                                reader.readAsArrayBuffer(blob);
                            };
                            mediaRecorder.start();
                        });
                    })
                ).then((chunksArray) => {
                    console.log(chunksArray)
                    ipcRenderer.invoke("save-data", chunksArray)
                });

            } catch (error) {
                console.log(error)
            }
        },
        /**
         * 停止录制
         */
        stopRecord () {
            try {
                this.mediaRecorderList.map(mediaRecorder => {
                    mediaRecorder.stop()
                })
                this.start = false
            } catch (error) {

            }
        }
    }
}

</script>
<style lang='scss' scoped>
.dashboard {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    #dashboard-video {
        flex: 1;
        display: grid;
        grid-template-areas: 'a b';
        grid-gap: 16px;
        /* 为行和列都增加了16px的间隙。 */
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

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