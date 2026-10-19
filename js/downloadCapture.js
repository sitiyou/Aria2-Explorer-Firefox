export default class DownloadCapture {
    constructor(onDownload, getMinimumSize, downloads = chrome.downloads) {
        this.downloads = downloads;
        this.onDownload = onDownload;
        this.getMinimumSize = getMinimumSize;
        this.event = downloads.onDeterminingFilename || downloads.onCreated;
        this.pending = new Map();
        this.pollTimer = null;
        this.listener = downloads.onDeterminingFilename ? onDownload : item => this.capture(item);
        this.onChanged = delta => {
            const item = this.pending.get(delta.id);
            if (!item) return;
            for (const [key, value] of Object.entries(delta)) {
                if (key !== 'id') item[key] = value.current;
            }
            this.capture(item);
        };
        this.onErased = id => this.pending.delete(id);
    }

    hasListener() {
        return this.event.hasListener(this.listener);
    }

    addListener() {
        if (this.hasListener()) return;
        if (!this.downloads.onDeterminingFilename) {
            this.downloads.onChanged.addListener(this.onChanged);
            this.downloads.onErased.addListener(this.onErased);
        }
        this.event.addListener(this.listener);
    }

    removeListener() {
        this.event.removeListener(this.listener);
        if (!this.downloads.onDeterminingFilename) {
            this.downloads.onChanged.removeListener(this.onChanged);
            this.downloads.onErased.removeListener(this.onErased);
            this.pending.clear();
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
    }

    scheduleMetadataPoll() {
        if (this.pollTimer !== null || !this.pending.size) return;
        this.pollTimer = setTimeout(() => this.pollMetadata(), 100);
    }

    async pollMetadata() {
        this.pollTimer = null;
        if (!this.pending.size || !this.hasListener()) return;
        try {
            const items = await this.downloads.search({ state: 'in_progress' });
            if (!this.hasListener()) return;
            const active = new Map(items.map(item => [item.id, item]));
            for (const id of this.pending.keys()) {
                if (active.has(id)) this.capture(active.get(id));
                else this.pending.delete(id);
            }
        } catch (error) {
            console.warn('Download metadata lookup failed:', error);
        }
        this.scheduleMetadataPoll();
    }

    capture(item) {
        if (item.state !== 'in_progress' || item.error || item.byExtensionId === chrome.runtime.id ||
            !/^(https?|s?ftp):/i.test(item.url)) {
            this.pending.delete(item.id);
            return;
        }
        const fileSize = item.fileSize >= 0 ? item.fileSize : item.totalBytes;
        if (!item.filename || (this.getMinimumSize() > 0 && !(fileSize >= 0))) {
            this.pending.set(item.id, { ...item });
            this.scheduleMetadataPoll();
            return;
        }
        this.pending.delete(item.id);
        const downloadItem = {
            ...item,
            filename: item.filename.split(/[\\/]/).pop(),
            fileSize: fileSize >= 0 ? fileSize : 0
        };
        Promise.resolve(this.onDownload(downloadItem)).catch(error => console.warn('Download capture failed:', error));
    }
}
