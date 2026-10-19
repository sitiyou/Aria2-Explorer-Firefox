import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

function utils(firefox) {
    const notifications = [];
    const chrome = {
        runtime: { id: 'self' },
        notifications: { create: async (...args) => notifications.push(args) }
    };
    const context = vm.createContext({
        chrome, console, navigator: { userAgent: 'Mozilla Firefox Linux' },
        browser: firefox ? { runtime: { getBrowserInfo() {} } } : undefined
    });
    const source = readFileSync(new URL('../js/utils.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?$/gm, '').replace('export default Utils;', 'globalThis.Utils = Utils;');
    vm.runInContext(source, context);
    return { Utils: context.Utils, notifications, context };
}

test('Firefox notifications retain details without unsupported options', () => {
    const { Utils, notifications } = utils(true);
    Utils.showNotification({ title: 'Download', message: 'Complete', contextMessage: 'file.zip',
        buttons: [{ title: 'Dismiss' }], silent: true, requireInteraction: true });
    const options = notifications[0][1];
    assert.equal(options.message, 'Complete\nfile.zip');
    for (const key of ['contextMessage', 'buttons', 'silent', 'requireInteraction']) {
        assert.equal(key in options, false);
    }
});

test('Chromium notification options are unchanged', () => {
    const { Utils, notifications } = utils(false);
    Utils.showNotification({ message: 'Complete', buttons: [{ title: 'Dismiss' }], silent: true });
    assert.equal(notifications[0][1].buttons.length, 1);
    assert.equal(notifications[0][1].silent, true);
});

test('platform detection works without userAgentData', () => {
    const { Utils, context } = utils(true);
    assert.equal(Utils.getPlatform(), 'Linux');
    context.navigator.userAgent = 'Mozilla Windows';
    assert.equal(Utils.getPlatform(), 'Windows');
    context.navigator.userAgent = 'Mozilla Macintosh';
    assert.equal(Utils.getPlatform(), 'macOS');
    context.navigator.userAgentData = { platform: 'Native platform' };
    assert.equal(Utils.getPlatform(), 'Native platform');
});

test('settings persistence excludes functions required only by the options UI', () => {
    const context = vm.createContext({
        Utils: {}, DefaultConfigs: {}, DefaultAriaNgOptions: {}, console,
        window: { matchMedia: () => ({}) },
        chrome: { i18n: { getMessage: key => key }, storage: { onChanged: { addListener() {} } } }
    });
    const source = readFileSync(new URL('../js/options.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?$/gm, '');
    vm.runInContext(source, context);
    vm.runInContext("Configs.rpcList = [{name: 'Test', url: 'http://localhost:6800/jsonrpc'}]; Configs.integration = true;", context);
    const snapshot = context.storedConfigs();
    assert.equal(snapshot.integration, true);
    assert.equal(snapshot.rpcList[0].name, 'Test');
    assert.equal(Object.values(snapshot).some(value => typeof value === 'function'), false);
    assert.doesNotThrow(() => structuredClone(snapshot));
});
