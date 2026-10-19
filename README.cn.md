# Aria2 Explorer <span style="float:right">[[返回]](README.md)</span>

**Aria2 Explorer** 是一款为 Chrome 定制的下载任务管理扩展，能够自动拦截或手动添加下载任务到 Aria2 来完成网络资源下载。同时，引入了 [AriaNG](https://www.github.com/mayswind/AriaNg/) 作为前端，方便用户对 Aria2 进行操作和管理。

## 📑 如何使用

1. Windows系统请下载 <span style="vertical-align:middle;">[![下载Aria2 Manager](https://img.shields.io/github/downloads/alexhua/aria2-manager/total?color=blue&label=Aria2%20Manager)](https://github.com/alexhua/aria2-manager/)</span>，其他系统请下载 Aria2 主程序：<span style="vertical-align:middle;">[![下载 Aria2](https://img.shields.io/github/downloads/aria2/aria2/total?color=blue&label=Aria2)](https://github.com/aria2/aria2/releases)</span>
2. Windows系统请运行 **Aria2Manager.exe** ，其他系统，请打开 **Terminal** 输入 `aria2c --enable-rpc`
3. 从[在线商店](#-安装地址)安装浏览器扩展
4. 在扩展选项中打开 `自动拦截下载`，并根据需求配置其他选项

完成后，既可在Chrome中享受高速下载体验。

## ⭐ 功能特性

1. 自动拦截浏览器下载任务

    - 拦截通知
    - 支持磁力链接
    - 快捷键开关自动拦截 (默认：<kbd>Alt</kbd>+<kbd>A</kbd>)
    - 下载前手动设置各种详细参数
    - 通过域名、扩展名或文件大小过滤下载任务
    > 过滤优先级：网站 > 扩展名 > 文件大小，优先处理白名单

2. 根据预设URL规则匹配下载URL来自动选择不同的 Aria2 RPC 服务端和下载目录

3. 内置 Aria2 前端：AriaNG **增强版**。多种呈现方式：弹窗，新标签，新窗口，侧边栏

4. 所有配置（扩展和AriaNG）云端同步

5. 中/日/韩/英/法/意/俄/乌/西班牙/捷克多语言支持

6. Aria2下载状态监测和任务状态通知

7. 右键菜单批量导出网页资源（图片·音频·视频·磁力链接）

8. 接受来自其他扩展的Aria2下载请求

9. 选项配置页面快捷键（保存：<kbd>Alt</kbd>+<kbd>S</kbd> 重置：<kbd>Alt</kbd>+<kbd>R</kbd> 下载：<kbd>Alt</kbd>+<kbd>J</kbd> 上传：<kbd>Alt</kbd>+<kbd>U</kbd>）

10. 支持当没有连接Aria2时，通过浏览器下载网络链接

## 🧩 外部调用

允許其他擴展使用這個擴展作為與 Aria2 的中介軟體來下載檔案。  

```js

const downloadItem = {
    url: "https://sample.com/image.jpg",
    filename: "image_from_sample.jpg",
    referrer: "https://sample.com",
    options: { 
        split: "10", // aria2 RPC options here
        xxxxx: "oooo"
    }
}

chrome.runtime.sendMessage(`Aria2-Explorer extension ID`, downloadItem)

```

## 🔀 流程图

![流程图](FlowChart-CN.SVG)

## 📥 安装地址

### Firefox

此分支新增桌面 Firefox 支持，要求 Firefox 140 或以上版本，包含当前 ESR。
本地安装时，打开 `about:debugging#/runtime/this-firefox`，点击“临时载入附加组件”，
选择本地构建中的 `build/firefox/manifest.json`。
构建方法见[开发说明](docs/development.md)。临时安装在 Firefox 退出后失效；
长期安装需要经过 Mozilla 签名的安装包。此分支尚未上架 AMO。

Firefox 使用原生侧栏，不支持阻止系统休眠。设置非零文件大小门槛后，
若下载完成前仍无法确定大小，则保留 Firefox 下载，不强制接管。

### 上游 Chromium 版本

以下商店链接安装的是上游项目，并非此 Firefox 分支。

[![Chrome Web Store](https://developer.chrome.com/static/docs/webstore/branding/image/UV4C4ybeBTsZt43U4xis.png)](https://chrome.google.com/webstore/detail/mpkodccbngfoacfalldjimigbofkhgjn "Aria2 Explorer")
[<img src="https://get.microsoft.com/images/en-us%20light.svg" height=58 >](https://microsoftedge.microsoft.com/addons/detail/ngojgbdekanmijaphecgpmfoegoanffi "Aria2 Explorer")


## 💡 常见问题

[https://github.com/alexhua/aria2-explorer/issues?q=label:faq](https://github.com/alexhua/aria2-explorer/issues?q=label%3AFAQ)

## 🔒 隐私政策

本扩展将下载地址、来源页面、文件名、User-Agent 和相关网站 Cookie
发送到用户配置的 aria2 服务端；RPC 请求还可能包含配置的 aria2 认证密钥。
请仅使用可信的服务端。设置保存在本地；用户可以选择上传至浏览器同步服务，
同步内容包含所配置的 RPC 连接信息和密钥。

内置前端还会从 `rec.aria2e.com` 请求公告，并可加载上游博客内容；
这些连接会向上游服务暴露普通网络请求信息。打开外部帮助链接也会访问相应网站。
Firefox 安装提示会声明下载集成所传输的数据类别。

## 📜 开源协议

![BSD](https://i0.wp.com/opensource.org/wp-content/uploads/2006/07/OSI_Approved_License.png?w=90&ssl=1)

Aria2-Explorer is licensed under [BSD 3-Clause License](https://opensource.org/license/bsd-3-clause/).
此分支基于 Alex Hua 的 Aria2 Explorer，保留了 [LICENSE](LICENSE) 中的原始版权声明及许可条款。
