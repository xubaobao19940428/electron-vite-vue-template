# Electron-Vite-Vue-template

## 打包 Electron-builder 自行配置

package.json 里面有一个基本配置

## 如何安装

```bash
yarn 或 yarn install

# 启动之后，会在9080端口监听
yarn dev

# build命令在不同系统环境中，需要的的不一样，需要自己根据自身环境进行配置
yarn build

```

---

## 2023-07-25

    增加路由vue-router

## 2023-08-01

    增加了摄像头录制以及屏幕录制的功能，利用ffmpeg给输出视频转码

## 2023-09-01
package.json 文件中的build的files中有一段代码,是为了在国产麒麟系统上使用
```bash
   better-sqlite3数据库，在mac 上可以注释掉不影响使用，
    {
        "from": "./extraResources/better-sqlite3.node",
        "to": "./"
    }
```
