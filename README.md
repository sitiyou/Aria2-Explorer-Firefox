# Aria2 Explorer <span style="float:right">[[中文]](README.cn.md)</span>

**Aria2 Explorer** is an extension that could export URLs to Aria2 to complete downloads and imports [AriaNG](https://www.github.com/mayswind/AriaNg/) as a built-in management frontend.

## 📑How to use

Procedures:

1. For Windows, please download <span style="vertical-align:middle;">[![Download Aria2 Manager](https://img.shields.io/github/downloads/alexhua/aria2-manager/total?color=blue&label=Aria2%20Manager)](https://github.com/alexhua/aria2-manager/)</span>. Other platform, please download Aria2 utility: <span style="vertical-align:middle;">[![Download Aria2](https://img.shields.io/github/downloads/aria2/aria2/total?color=blue&label=Aria2)](https://github.com/aria2/aria2/releases)</span>
2. For Windows, please run **Aria2Manager.exe**. Other platform, please run Aria2 in the **Terminal** with typing `aria2c --enable-rpc`.
3. Install extension from [web store](#-installation).
4. Enable `auto-capture` on the extension options page and configure others as you need.

After completing these steps, the extension will take over the download process, leading you to a high-speed download experience.

## ⭐ Features

1. Auto capture browser download tasks
    - Capture notification
    - Support magnet links
    - Toggle auto-capture by shortcut (Default: <kbd>Alt</kbd>+<kbd>A</kbd>)
    - Configure each Aria2 option manually before download
    - Filter intercepted task by the domain, file extensions or file sizes
    > Filter priority: domain > file-ext > file-size, white-list > black-list
2. Auto-select Aria2 RPC server and download location by matching downloading URL with preset URL pattern

3. Built-in Aria2 frontend: AriaNG **Enhanced Version**. Multiple present styles: popup, new tab, new window, side panel

4. Synchronize and store all the settings (extension and AriaNG) on the cloud

5. Support for zh-CN/zh-TW/en/fr/ja/ko/it/ru/uk/cs/es languages

6. Monitor Aria2 download status via extension badge icon

7. Batch export webpage resources (Image·Audio·Video·Magnet) links from context menu

8. Receive Aria2 download requests from other extensions

9. Support shortcuts in the options page (Save:<kbd>Alt</kbd>+<kbd>S</kbd> Reset:<kbd>Alt</kbd>+<kbd>R</kbd> Download:<kbd>Alt</kbd>+<kbd>J</kbd> Upload:<kbd>Alt</kbd>+<kbd>U</kbd>)

10. Support downloading URLs via browser automatically if aria2 is disconnected

## 🧩 Integration

Allow other extensions to use this extension as middleware to download files with Aria2.

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
## 🔀 Flow Chart

![Flow Chart](FlowChart-EN.SVG)

## 📥 Installation

### Firefox

This fork adds desktop Firefox support (Firefox 140 or later, including current ESR).
For a local installation, open `about:debugging#/runtime/this-firefox`, choose
**Load Temporary Add-on**, and select `build/firefox/manifest.json` from a local
build. See [development instructions](docs/development.md) to create the package.
Temporary installations last until Firefox exits; permanent installation requires
a Mozilla-signed package. This fork is not yet published on AMO.

Firefox supports the native sidebar. System keep-awake is unavailable, and
unknown-size downloads stay in Firefox when a nonzero size threshold cannot be
resolved before the download completes.

### Upstream Chromium releases

The following store links install the upstream project, not this Firefox fork.

[![Chrome Web Store](https://developer.chrome.com/static/docs/webstore/branding/image/UV4C4ybeBTsZt43U4xis.png)](https://chrome.google.com/webstore/detail/mpkodccbngfoacfalldjimigbofkhgjn "Aria2 Explorer")
[<img src="https://get.microsoft.com/images/zh-cn%20light.svg" height=58 >](https://microsoftedge.microsoft.com/addons/detail/ngojgbdekanmijaphecgpmfoegoanffi "Aria2 Explorer")


## 💡 Tips & FAQs

[https://github.com/alexhua/aria2-explorer/issues?q=label:faq](https://github.com/alexhua/aria2-explorer/issues?q=label%3AFAQ)

## 🔒 Privacy policy

This extension sends download URLs, referrers, filenames, user-agent information,
and relevant website cookies to the aria2 server you configure. RPC requests may
also include your configured aria2 authentication secret. Only use servers you
trust. Settings are stored locally; uploading settings to browser sync is
optional and includes configured RPC connection information and secrets.

The bundled AriaNg frontend does not fetch remote announcements or embed
remote pages. Its Help link opens the upstream AriaNg repository only when you
select it. The Firefox installation prompt declares the data types transmitted
for download integration.

## 📜 License

![BSD](https://i0.wp.com/opensource.org/wp-content/uploads/2006/07/OSI_Approved_License.png?w=90&ssl=1)

Aria2-Explorer is licensed under [BSD 3-Clause License](https://opensource.org/license/bsd-3-clause/).
This fork is based on Alex Hua's Aria2 Explorer; the original copyright and
license are retained in [LICENSE](LICENSE).
