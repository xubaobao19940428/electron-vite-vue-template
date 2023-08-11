<!--  -->
<template>
    <div class="app-container open-case-info">
        <el-page-header class="tz-detail-header" :content="'案件详情'" @back="$router.go(-1)">
            <template #content>
                <div>
                    <span> 案件详情 </span>
                </div>
            </template>
            <template #extra>
                <div>
                    <el-button type="primary" @click="startRecord()" v-if="!start">开庭录制</el-button>
                    <el-button type="danger" @click="stopRecord" v-else>停止录制</el-button>
                </div>
            </template>
        </el-page-header>
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <span>案件信息{{ distributionCaseId }}</span>
                </div>
            </template>
            <el-descriptions direction="vertical" :column="2" border>
                <el-descriptions-item label="案件编号：">{{ caseViewList.caseNo }}</el-descriptions-item>
                <el-descriptions-item label="省案件号：" v-if="caseViewList.outTzCase">{{ caseViewList.outTzCase.abb016
                }}</el-descriptions-item>
                <el-descriptions-item label="案件ID：">{{ caseViewList.distributionCaseId }}</el-descriptions-item>
                <el-descriptions-item label="案件名称：">{{ caseViewList.caseTitle }}</el-descriptions-item>
                <el-descriptions-item label="经办人员：">
                    <div v-for="(item, index) in caseHandlersList" :key="index" class="content-title">
                        <el-tag size="small">{{ item.name }}</el-tag>
                    </div>
                </el-descriptions-item>
                <el-descriptions-item label="首次开庭时间：">
                    <span v-if="caseViewList.caseCourtPlan">
                        {{ caseViewList.caseCourtPlan.planTime }}
                    </span>
                </el-descriptions-item>
                <el-descriptions-item label="所属仲裁庭：">
                    <span v-if="caseViewList.caseCourtPlan">
                        {{ caseViewList.caseCourtPlan.court.title }}
                    </span>
                </el-descriptions-item>
                <el-descriptions-item label="申请人：">
                    <div v-for="(item, index) in casePeopleList" :key="index + 'a'" class="content-title">
                        <el-tag size="small" v-if="item.roleType == 'ShenQingRen'"> {{ item.name }}</el-tag>
                    </div>
                    <div v-for="(item, index) in caseCompanyList" :key="index + 'a'" class="content-title">
                        <el-tag v-if="item.roleType == 'ShenQingCompany'" size="small"> {{ item.name }}</el-tag>
                    </div>
                </el-descriptions-item>
                <el-descriptions-item label="被申请人：">
                    <div v-for="(item, index) in casePeopleList" :key="index + 'a'" class="content-title">
                        <el-tag size="small" v-if="item.roleType == 'BeiShenQingRen'"> {{ item.name }}</el-tag>
                    </div>
                    <div v-for="(item, index) in caseCompanyList" :key="index + 'a'" class="content-title">
                        <el-tag v-if="item.roleType == 'BeiShenQingCompany'" size="small"> {{ item.name }}</el-tag>
                    </div>
                </el-descriptions-item>
                <el-descriptions-item label="案由：" :span="2">{{ caseViewList.caseOfAction }}</el-descriptions-item>
                <el-descriptions-item label="仲裁请求：" :span="2">{{ caseViewList.caseRequire }}</el-descriptions-item>
            </el-descriptions>
        </el-card>
        <div id="dashboard-video">

        </div>
    </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import ysFixWebmDuration from 'fix-webm-duration'
const options = { mimeType: 'video/webm; codecs=h264' }
export default {
    data () {
        return {
            distributionCaseId: '',
            caseViewList: {},
            videoDeviceList: [],
            currentDeviceId: '',
            streamList: [],
            videoElement: null,
            start: false,
            recordEnd: false,
            mediaRecorderList: [],
        };
    },

    components: {},

    computed: {
        casePeopleList () {
            let dataList = []
            if (this.caseViewList.casePeopleList) {
                dataList = this.caseViewList.casePeopleList.filter(item => {
                    return (item.roleType == "ShenQingRen" || item.roleType == 'BeiShenQingRen')
                })
            }
            return dataList
        },
        caseCompanyList () {
            let dataList = []
            if (this.caseViewList.caseCompanyList) {
                dataList = this.caseViewList.caseCompanyList.filter(item => {
                    return (item.roleType == "ShenQingCompany" || item.roleType == 'BeiShenQingCompany')
                })
            }
            return dataList
        },
        //仲裁员/书记员
        caseHandlersList () {
            let dataList = []
            if (this.caseViewList.casePeopleList) {
                dataList = this.caseViewList.casePeopleList.filter(item => {
                    return item.roleType == 'ZhongCaiYuan' || item.roleType == 'ShuJiYuan' || item.roleType == 'JianZhi'
                })
            }
            return dataList
        }
    },

    async mounted () {
        this.distributionCaseId = this.$route.query.distributionCaseId
        this.getCaseInfo()
        await this.getCamera()
    },

    methods: {
        /**
         * 得到案件信息
         */
        getCaseInfo () {
            ipcRenderer.invoke('search-splite3-case-info', this.distributionCaseId).then(response => {
                if (response) {

                    response[0].caseCompanyList = response[0].caseCompanyList ? JSON.parse(response[0].caseCompanyList) : null
                    response[0].casePeopleList = response[0].casePeopleList ? JSON.parse(response[0].casePeopleList) : null
                    response[0].caseCourtPlan = response[0].caseCourtPlan ? JSON.parse(response[0].caseCourtPlan) : null
                    this.caseViewList = response[0]
                }
            })
        },
        /**
         * 得到摄像头列表
         */
        async getCamera () {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter((device) => device.kind === 'videoinput' && device.label.includes('Webcam'));
            this.videoDeviceList = videoDevices
            console.log(this.videoDeviceList)
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
                    let startTime
                    let newIndex = index
                    const mediaRecorder = new MediaRecorder(stream, options);
                    let recordedChunks = [];

                    mediaRecorder.ondataavailable = (event) => {

                        if (event.data.size > 0) {
                            var duration = Date.now() - startTime;
                            recordedChunks.push(event.data);

                            _this.saveVideoChunks(recordedChunks, newIndex, _this.caseViewList.caseNo, duration);

                        }
                    };
                    mediaRecorder.onstop = () => {
                        var duration = Date.now() - startTime;
                        if (recordedChunks.length > 0) {
                            console.log('newIndex', newIndex)
                            _this.saveVideoChunks(recordedChunks, newIndex, _this.caseViewList.caseNo, duration);
                        }
                    };

                    mediaRecorder.start(5000);
                    startTime = Date.now()
                    return mediaRecorder;

                });
            } catch (error) {
                console.log(error);
            }
        },

        getTotalSize (chunks) {
            return chunks.reduce((totalSize, chunk) => totalSize + chunk.size, 0);
        },

        async saveVideoChunks (chunks, index, name, duration) {
            console.log(duration)
            try {
                const blob = new Blob(chunks, { type: "video/webm" })
                ysFixWebmDuration(blob, duration, async function (fixedBlob) {
                    // displayResult(fixedBlob);
                    const buffer = await fixedBlob.arrayBuffer();
                    ipcRenderer.invoke("save-data-flv", { name: name + '_' + index, buffer, parentDirName: name });
                });


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
.open-case-info {
    padding: 10px;
    box-sizing: border-box;

    .el-card {
        display: flex;
        flex-direction: column;

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        :deep().el-card__body {
            flex: 1;
            overflow: auto;
            display: flex;
            flex-direction: column;
            padding: 10px;

            .content-title {
                display: inline-block;
            }

            .content-title+.content-title {
                margin-left: 10px;
            }
        }
    }

    #dashboard-video {
        flex: 1;
    }
}
</style>