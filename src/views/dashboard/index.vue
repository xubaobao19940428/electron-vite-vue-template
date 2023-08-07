<!--  -->
<template>
    <div class="dashboard">
        <div class="dashboard_header">
            <el-button type="primary" @click="startRecord()" v-if="!start">开始录制</el-button>
            <el-button type="danger" @click="stopRecord" v-else>停止录制</el-button>
            <!-- <el-button type="success" v-if="recordEnd" @click="saveVideo">保存视频</el-button> -->
        </div>
        <div class="file-content">
            <!-- <el-row>
                <el-col :span="8" v-for="(videoFile, index) in videoFiles">
                    <el-card :body-style="{ padding: '0px' }">
                        <video :src="videoFile.path" controls></video>
                        <div style="padding: 14px;">
                            <span>好吃的汉堡</span>
                            <div class="bottom">
                                <time class="time">{{ currentDate }}</time>
                                <el-button type="text" class="button">操作按钮</el-button>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row> -->
            <el-table :data="videoFiles" style="width: 100%;height:100%" :header-cell-style="{
                height: '44px',
                color: '#2C3034',
                'font-size': '14px',
                'font-weight': '500',
                background: '#f5f7fa'
            }
                ">
                <el-table-column prop="name" label="视频名称" align="center"> </el-table-column>
                <el-table-column prop="format" label="格式" align="center"> </el-table-column>
                <el-table-column prop="path" label="目录" align="center"> </el-table-column>

                <el-table-column label="操作" align="center" width="200">
                    <template #default="scope">
                        <el-button size="small" type="primary" @click="viewVideo(scope.row)">查看</el-button>
                    </template>
                </el-table-column>
                <template #empty>
                    <div class="empty-box">
                        <img src="@/assets/pic_taost_03.png" alt="" class="img" />
                        <div class="text">暂无视频数据～</div>
                    </div>
                </template>
            </el-table>
        </div>

        <div id="dashboard-video">

        </div>
        <!-- <el-select v-model="currentDeviceId" placeholder="请选择" @change="changeCamera">
            <el-option v-for="item in videoDeviceList" :key="item.deviceId" :label="item.label" :value="item.deviceId">
            </el-option>
        </el-select> -->
    </div>
</template>

<script>
import { ipcRenderer } from 'electron';
const path = require('path')
import { desktopCapturer, app } from '@electron/remote';
const options = { mimeType: 'video/webm; codecs=h264' }
//主进程引入
export default {
    data () {
        return {
            recordEnd: false,
            videoDeviceList: [],
            currentDeviceId: '',
            streamList: [],
            videoElement: null,
            start: false,
            mediaRecorderList: [],
            chunksArray: [],
            tableData: [],
            folderList: [],
            videoFiles: []
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
        // await _this.startScreenRecording()
        // navigator.mediaDevices.addEventListener('devicechange', async (event) => {
        //    await this.getCamera();
        //     // updateCameraList(newCameraList);
        // });
        _this.fetchFileList()
    },

    methods: {
        async fetchFileList () {
            try {
                const folderList = await ipcRenderer.invoke('get-file-list');
                this.folderList = folderList
                await this.fetchVideoFiles();
                console.log(this.videoFiles)
            } catch (error) {
                console.error('Error fetching file list:', error);
            }
        },
        async fetchVideoFiles () {
            try {
                for (const folder of this.folderList) {
                    const videoFiles = await ipcRenderer.invoke('get-video-files', folder);
                    const filteredVideoFiles = videoFiles.filter(file => !file.startsWith('.DS_Store'));

                    const videoFileList = [];
                    for (const file of filteredVideoFiles) {
                        const filePath = path.join(app.getPath('downloads'), 'videos', folder, file);
                        const fileInfo = await this.fetchVideoFileInfo(filePath);
                        videoFileList.push({
                            name: file,
                            path: filePath,
                            ...fileInfo
                        });
                    }
                    this.videoFiles = [...videoFileList, ...this.videoFiles]
                    console.log('', this.videoFiles)
                    // this.$set(this.videoFiles, folder, videoFileList);
                }
            } catch (error) {
                console.error('Error fetching video files:', error);
            }
        },
        async fetchVideoFileInfo (filePath) {
            try {
                const fileInfo = await ipcRenderer.invoke('get-video-file-info', filePath);
                return fileInfo;
            } catch (error) {
                console.error('Error fetching video file info:', error);
                throw error;
            }
        },
        /**
         * 查看视频
         * @param {*} data 
         */
        viewVideo (data) {
            let newData = JSON.parse(JSON.stringify(data))
            ipcRenderer.invoke('open-window', newData)
        },
        timestampToTime (timestamp) {
            var date = new Date(timestamp)
            var Y = date.getFullYear() + '-'
            var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
            var D = (date.getDate() + 1 <= 10 ? '0' + date.getDate() : date.getDate()) + ''
            var h = (date.getHours() + 1 <= 10 ? '0' + date.getHours() : date.getHours()) + ':'
            var m = (date.getMinutes() + 1 <= 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':'
            var s = date.getSeconds() + 1 <= 10 ? '0' + date.getSeconds() : date.getSeconds()
            return Y + M + D + h + m + s
        },
        // 屏幕录制函数
        async startScreenRecording () {
            try {
                const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
                console.log(sources); // 添加这行代码，查看 sources 是否包含您要录制的窗口
                const source = sources.find((source) => source.name === '案件录制'); // 替换成要录制的窗口的名称
                if (!source) {
                    throw new Error('找不到指定名称的窗口');
                }
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: source.id,
                        },
                    },
                });
                this.streamList.push(stream);
            } catch (error) {
                console.error('屏幕录制失败: ', error);
            }
        },
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
        /**
         * 开始录制
         */
        async startRecord () {
            let _this = this;
            try {
                _this.start = true;
                // console.log(_this.streamList)
                _this.mediaRecorderList = _this.streamList.map((stream, index) => {
                    let newIndex = index
                    let newTime = _this.timestampToTime(new Date().getTime())
                    const mediaRecorder = new MediaRecorder(stream, options);
                    let recordedChunks = [];

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            recordedChunks.push(event.data);
                            _this.saveVideoChunks(recordedChunks, newIndex, newTime);

                        }
                    };
                    mediaRecorder.onstop = () => {
                        if (recordedChunks.length > 0) {
                            console.log('newIndex', newIndex)
                            _this.saveVideoChunks(recordedChunks, newIndex, newTime);
                        }
                    };

                    mediaRecorder.start(5000);
                    return mediaRecorder;
                });
            } catch (error) {
                console.log(error);
            }
        },

        getTotalSize (chunks) {
            return chunks.reduce((totalSize, chunk) => totalSize + chunk.size, 0);
        },

        async saveVideoChunks (chunks, index, name) {
            try {
                const blob = new Blob(chunks, { type: "video/webm" });
                const buffer = await blob.arrayBuffer();
                ipcRenderer.invoke("save-data-flv", { name: name + '_' + index, buffer, parentDirName: name });
            } catch (error) {
                console.error("Error saving video chunks:", error);
            }
        },
        /**
         * 停止录制 在 stopRecord 函数中等待所有录制源结束后再进行保存和转码操作
         */
        // 
        async stopRecord () {
            try {
                const promises = this.mediaRecorderList.map(mediaRecorder => {
                    return new Promise(resolve => {
                        mediaRecorder.onstop = () => {
                            console.log(mediaRecorder)
                            resolve();
                        };
                        mediaRecorder.stop();
                    });
                });

                await Promise.all(promises);
                this.start = false;
                this.recordEnd = true;
            } catch (error) {
                console.error(error);
            }
        },
        /**
         * 视频保存
         */
        saveVideo () {
            // ipcRenderer.invoke("save-data", this.chunksArray)
        },
        /**
         * 停止
         * @param {*} stream 
         */
        stopMediaStream (stream) {
            const tracks = stream.getTracks();
            for (const track of tracks) {
                track.stop();
            }
        }

    },
    beforeUnmount () {
        this.streamList.map(stream => {
            this.stopMediaStream(stream)
        })
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

    .file-content {
        flex: 1;
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

    .empty-box {

        padding: 160px 0 0 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .img {
            display: inline-block;
            width: 160px;
            max-width: 100%;
            margin-bottom: 20px;
        }

        .text {
            font-size: 12px;
            font-weight: 400;
            color: #000000;
            line-height: 12px;
        }
    }
}
</style>