<!--
 * @Author: qiancheng 915775317@qq.com
 * @Date: 2023-08-10 16:21:53
 * @LastEditors: qiancheng 915775317@qq.com
 * @LastEditTime: 2023-08-10 18:35:58
 * @FilePath: /electron-vite-vue-template/src/views/dashboard/index2.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!--  -->
<template>
    <div class="app-container case-list">

        <div class="main-content-wrapper">
            <div class="main-content-header">
                <el-form :inline="true" :model="queryData" class="demo-form-inline">
                    <el-form-item label="案件编号：">
                        <el-input v-model="queryData.caseNo" placeholder="请输入案件编号" clearable></el-input>
                    </el-form-item>
                    <el-form-item label="案件名称：">
                        <el-input v-model="queryData.caseName" placeholder="请输入案件名称" clearable></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="getList(1)">查 询</el-button>
                        <el-button type="primary" @click="getOtherList(1)">刷 新</el-button>
                        <!-- <el-button @click="clearSearch('stateList')">重 置</el-button> -->
                    </el-form-item>
                </el-form>
            </div>
            <el-table :data="tableData" style="width: 100%" :header-cell-style="{
                height: '44px',
                color: '#2C3034',
                'font-size': '14px',
                'font-weight': '500',
            }">
                <el-table-column prop="distributionCaseId" label="案件id" align="center" width="250"></el-table-column>
                <el-table-column prop="caseNo" label="案件编号" align="center" width="200"></el-table-column>
                <!--人员根据roleType判断身份 1仲裁员 2书记员 3申请人 4被申请人-->
                <el-table-column prop="casePeopleList" label="仲裁员" align="center">
                    <template #default="scope">
                        <div v-for="(item, index) in scope.row.casePeopleList || []" :key="index">
                            <span v-if="item.roleType == 'ZhongCaiYuan'"> {{ item.name }} </span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="casePeopleList" label="书记员" align="center">
                    <template #default="scope">
                        <div v-for="(item, index) in scope.row.casePeopleList || []" :key="index + 'a'">
                            <span v-if="item.roleType == 'ShuJiYuan'"> {{ item.name }} </span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="casePeopleList" label="申请人" align="center">
                    <template #default="scope">
                        <!-- 申请人 -->
                        <div v-for="(item, index) in scope.row.casePeopleList || []" :key="index + 'b'">
                            <span v-if="item.roleType == 'ShenQingRen'"> {{ item.name }} </span>
                        </div>
                        <!-- 申请人公司 -->
                        <div v-for="(item, index) in scope.row.caseCompanyList || []" :key="index + 'c'">
                            <span v-if="item.roleType == 'ShenQingCompany'"> {{ item.name }} </span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="casePeopleList" label="被申请人" align="center">
                    <template #default="scope">
                        <div v-for="(item, index) in scope.row.casePeopleList || []" :key="index + 'd'">
                            <span v-if="item.roleType == 'BeiShenQingRen'"> {{ item.name }} </span>
                        </div>
                        <!-- 被申请人公司 -->
                        <div v-for="(item, index) in scope.row.caseCompanyList || []" :key="index + 'e'">
                            <span v-if="item.roleType == 'BeiShenQingCompany'">
                                {{ item.name }}
                            </span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="caseCourtPlan.court.title" label="地点" align="center" width="200">
                </el-table-column>
                <el-table-column prop="caseCourtPlan.planTime" label="排期时间" align="center" width="200">
                </el-table-column>
                <el-table-column fixed="right" prop="state" label="状态" align="center" width="100">
                    <template #default="scope">
                        <el-tag v-if="scope.row.state == 'WaitPlan'" type="danger"> 待排期 </el-tag>
                        <el-tag v-if="scope.row.state == 'Planed'" type="primary"> 已排期 </el-tag>
                        <el-tag v-if="scope.row.state == 'Trailing'" type="success"> 开庭中 </el-tag>
                        <el-tag v-if="scope.row.state == 'Suspend'" type="warning"> 休庭中 </el-tag>
                        <el-tag v-if="scope.row.state == 'End'" type="info"> 闭庭 </el-tag>
                    </template>
                </el-table-column>
                <el-table-column fixed="right" label="开庭操作" width="300" align="center">
                    <template #default="scope">
                        <el-button type="text" @click="open(scope.row)"> 查看 </el-button>
                        <el-button v-if="scope.row.state == 'End'" type="text" @click="reopen(scope.row)">
                            再排期
                        </el-button>
                        <el-button type="text" v-if="scope.row.state == 'Trailing'" @click="send(scope.row)">
                            发送开庭通知
                        </el-button>
                        <!-- <el-button type="text" @click="caseModelInfo(scope.row)">模版下载</el-button> -->
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
    </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import { otherCaseList } from '@/api/case.js'
export default {
    data () {
        return {
            // 搜索条件
            queryData: {
                caseNo: "",
                caseName: "",
                state: "All",
            },
            pageSize: 100,
            pageNum: 1,
            caseList: []
        };
    },

    components: {},

    computed: {},

    mounted () {
        this.getCaseList()
    },

    methods: {
        getCaseList () {
            ipcRenderer.invoke('search-splite3').then(response => {
                if (response) {
                    console.log(response)
                }
            })
        },
        /**
         * 得到案件列表
         */
        getOtherList (type) {
            if (type == 1) {
                this.caseList = []
                this.pageNum = 1
            }
            let params = {
                state: 'All',
                pageSize: this.pageSize,
                pageNum: this.pageNum++
            }
            otherCaseList(params).then(response => {
                if (response) {
                    this.caseList = [...response.data, ...this.caseList]
                    if (response.data.length) {
                        this.getOtherList()
                    } else {
                        // ipcRenderer.invoke('inset-splite3', JSON.stringify(this.caseList))
                        console.log(this.caseList)
                    }
                }
            }).catch(error => {

            })
        }

    }
}

</script>
<style lang='scss' scoped>
// 空数据
.empty-box {
    padding: 30px 0 0 0;
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
</style>