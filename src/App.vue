<template>
    <router-view v-slot="{ Component, route }">
        <transition :name="transitionName" mode="out-in">
            <keep-alive :include="include" :max="10">
                <component :is="Component" v-if="route.meta.keepAlive" :key="getFirstLevelRoute(route).name" />
            </keep-alive>
        </transition>
        <transition :name="transitionName" mode="out-in">
            <component :is="Component" v-if="!route.meta.keepAlive && isRouterAlive" :key="getFirstLevelRoute(route).name">
            </component>
        </transition>
    </router-view>
</template>
<script>
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'App',
    provide () {
        //父组件中通过provide来提供变量，在子组件中通过inject来注入变量。
        return {
            reload: this.reload,
        }
    },
    data () {
        return {
            include: [''],
            isRouterAlive: true,
            transitionName: 'slide-left',
        }
    },
    watch: {
        $route (to, from) {
            // this.clearUploudedTrackData()
            //如果 要 to(进入) 的页面是需要 keepAlive 缓存的，把 name push 进 include数组
            if (to.meta.keepAlive) {
                !this.include.includes(to.name) && this.include.push(to.name)
            }
            //如果 要 form(离开) 的页面是 keepAlive缓存的，
            //再根据 deepth 来判断是前进还是后退
            //如果是后退
            if (from.meta.keepAlive && to.meta.deepth < from.meta.deepth) {
                var index = this.include.indexOf(from.name)
                index !== -1 && this.include.splice(index, 1)
            }
        },
    },
    mounted () {
    },
    methods: {

        reload () {
            this.isRouterAlive = false //先关闭，
            this.$nextTick(function () {
                this.isRouterAlive = true //再打开
            })
        },
        getFirstLevelRoute (route) {
            if (!Array.isArray(route.matched) || route.matched.length === 0) {
                return route
            }
            return route.matched[0]
        },
    },
})
</script>

<style lang="scss">
html,
body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
}

#app {
    width: 100%;
    height: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    scroll-behavior: smooth;
    display: flex;
    flex-direction: column;

    .slide-left-enter-from {
        // transform: translateX(20px);
        opacity: 0.5;
    }

    .slide-left-enter-to {
        transform: translateX(0px);
    }

    .slide-left-leave-from {
        transform: translateX(0);
    }

    .slide-left-leave-to {
        // transform: translateX(20px);
        opacity: 0.5;
    }

    .slide-left-enter-active,
    .slide-left-leave-active {
        transition: all 0.3s;
    }
}

/* @import url('element-plus/dist/index.css') */</style>
