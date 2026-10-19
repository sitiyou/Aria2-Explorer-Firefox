import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

function background(firefox = true) {
    const calls = [];
    const Configs = {
        integration: true, fileSize: 10, allowedSites: [], blockedSites: [], allowedExts: [], blockedExts: [],
        rpcList: [{ url: 'http://localhost:6800/jsonrpc', location: '' }], webUIOpenStyle: 'sidePanel'
    };
    const chrome = {
        runtime: { id: 'self', getURL: path => `moz-extension://test/${path}` },
        extension: { inIncognitoContext: false },
        downloads: {
            cancel: async id => calls.push(['cancel', id]),
            erase: async query => calls.push(['erase', query]),
            download: async options => { calls.push(['browserDownload', options]); return 2; }
        },
        sidebarAction: {
            open: async () => calls.push(['openSidebar']),
            setPanel: async options => calls.push(['setPanel', options])
        },
        sidePanel: {
            open: async options => calls.push(['openSidePanel', options]),
            setOptions: async options => calls.push(['setOptions', options])
        },
        cookies: { getAll: async details => { calls.push(['cookies', details]); return []; } },
        tabs: { query: async () => [], create: async options => calls.push(['tab', options]) },
        windows: { getAll: async () => [{ id: 1, incognito: false, focused: true }, { id: 2, incognito: true }] },
        i18n: { getMessage: key => key }
    };
    const context = vm.createContext({
        chrome, Configs, URL, console, navigator: { userAgent: 'Firefox' },
        btoa: value => Buffer.from(value, 'binary').toString('base64'),
        Utils: { isFirefox: firefox, isLocalhost: url => url.includes('localhost') },
        DownloadCapture: class {}, AnimationController: class {}, ContextMenu: class {},
        setInterval, clearInterval
    });
    const source = readFileSync(new URL('../background.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?$/gm, '')
        .replace(/\(function main\(\) \{\s*init\(\);\s*registerAllListeners\(\);\s*\}\)\(\)/, '');
    vm.runInContext(source, context);
    return { context, chrome, Configs, calls };
}

test('size and exclusion filtering remains effective', () => {
    const { context, Configs } = background();
    const item = { url: 'https://example.com/file.zip', filename: 'file.zip', state: 'in_progress', fileSize: 1 };
    assert.equal(context.shouldCapture(item), false);
    assert.equal(context.shouldCapture({ ...item, fileSize: 11 * 1024 * 1024 }), true);
    Configs.blockedExts = ['zip'];
    assert.equal(context.shouldCapture({ ...item, fileSize: 11 * 1024 * 1024 }), false);
    Configs.allowedSites = ['example.com'];
    assert.equal(context.shouldCapture(item), true);
    assert.equal(context.shouldCapture({ ...item, byExtensionId: 'self' }), false);
});

test('cancellation completes before handing off and only Firefox erases captured history', async () => {
    for (const firefox of [true, false]) {
        const { context, calls } = background(firefox);
        context.download = async () => { calls.push(['handoff']); return true; };
        await context.captureDownload({ id: 1, url: 'https://example.com/file.zip', filename: 'file.zip',
            state: 'in_progress', fileSize: 20 * 1024 * 1024 });
        assert.deepEqual(calls.map(call => call[0]), firefox ? ['cancel', 'handoff', 'erase'] : ['cancel', 'handoff']);
    }
});

test('failed cancellation does not hand off or erase the download', async () => {
    const { context, chrome, calls } = background();
    context.console = { warn() {} };
    chrome.downloads.cancel = async () => { throw new Error('already complete'); };
    context.download = async () => { calls.push(['handoff']); return true; };
    await context.captureDownload({ id: 1, url: 'https://example.com/file.zip', filename: 'file.zip',
        state: 'in_progress', fileSize: 20 * 1024 * 1024 });
    assert.equal(calls.length, 0);
});

test('browser fallback preserves Firefox cookie store and private context', async () => {
    const { context, calls } = background();
    const result = await context.download({ type: 'DOWNLOAD_VIA_BROWSER', url: 'https://example.com/file.zip',
        filename: 'file.zip', incognito: true, cookieStoreId: 'firefox-private' });
    assert.equal(result, true);
    assert.equal(calls[0][1].cookieStoreId, 'firefox-private');
    assert.equal(calls[0][1].incognito, true);
});

test('Firefox cookies use the originating container and a scoped partition', async () => {
    const { context, calls } = background();
    await context.getCookies({ url: 'https://cdn.example.com/file.zip', referrer: 'https://example.com/page',
        cookieStoreId: 'firefox-container-2' });
    assert.equal(calls.length, 2);
    assert.equal(calls[0][1].storeId, 'firefox-container-2');
    assert.equal(calls[1][1].partitionKey.topLevelSite, 'https://example.com');
    assert.equal('firstPartyDomain' in calls[0][1], false);
});

test('first-party isolation is retried without querying unrelated first parties', async () => {
    const { context, chrome, calls } = background();
    chrome.cookies.getAll = async details => {
        calls.push(['cookies', details]);
        if (!details.firstPartyDomain) throw new Error('firstPartyDomain required');
        return [];
    };
    await context.getCookies({ url: 'https://example.com/file.zip', incognito: true });
    assert.equal(calls[1][1].storeId, 'firefox-private');
    assert.equal(calls[1][1].firstPartyDomain, 'example.com');
});

test('sidebars use the native API on each browser', async () => {
    for (const firefox of [true, false]) {
        const { context, calls } = background(firefox);
        await context.launchUI({ id: 3 });
        assert.deepEqual(calls.map(call => call[0]), firefox ? ['openSidebar', 'setPanel'] : ['openSidePanel', 'setOptions']);
        if (firefox) assert.equal(calls[1][1].tabId, 3);
    }
});

test('private UI requests do not reuse a normal browsing tab', async () => {
    const { context, chrome, Configs, calls } = background();
    Configs.webUIOpenStyle = 'tab';
    chrome.tabs.query = async () => [{ id: 7, windowId: 1, incognito: false }];
    await context.launchUI({ incognito: true });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls[0][0], 'tab');
    assert.equal(calls[0][1].windowId, 2);
});

test('Firefox sidebar requests without user activation fall back to a tab', async () => {
    const { context, chrome, calls } = background();
    chrome.sidebarAction.open = () => { throw new Error('user activation required'); };
    await context.launchUI('NID_TASK_STOPPED123');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls[0][0], 'tab');
    assert.equal(calls[0][1].url.endsWith('/task/detail/123'), true);
});
