import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('vendored AriaNg release is pinned and uses the extension storage format', async () => {
    const packageJson = JSON.parse(await read('vendor/ariang/package.json'));
    const sourceHtml = await read('vendor/ariang/src/index.html');
    const sourceConstants = await read('vendor/ariang/src/scripts/config/constants.js');
    const rpcService = await read('vendor/ariang/src/scripts/services/ariaNgSettingService.js');

    assert.equal(packageJson.version, '1.3.15');
    assert.match(sourceHtml, /ng-app="ariaNg" ng-csp/);
    assert.match(sourceConstants, /optionStorageKey: 'Options'/);
    assert.match(sourceConstants, /appPrefix: 'AriaNg'/);
    assert.match(rpcService, /extendRpcServers/);
});

test('bundled AriaNg contains no remote announcement or recommendation content', async () => {
    const manifest = JSON.parse(await read('manifest.json'));
    const index = await read('ui/ariang/index.html');
    const scripts = await readdir(new URL('ui/ariang/js/', root));
    const javascript = (await Promise.all(scripts.filter(file => file.endsWith('.js'))
        .map(file => read(`ui/ariang/js/${file}`)))).join('\n');

    assert.doesNotMatch(manifest.content_security_policy.extension_pages, /aria2e\.com/);
    assert.doesNotMatch(index, /rec\.aria2e\.com|recommend\.html|<iframe/i);
    assert.doesNotMatch(javascript, /rec\.aria2e\.com|aria2eRecService|recommend\.html/);
});


test('AriaNg trusts extension task links without trusting executable URLs', async () => {
    let whitelist;
    const module = { config(providers) {
        if (providers[0] === '$compileProvider') {
            providers.at(-1)({ aHrefSanitizationWhitelist(value) { whitelist = value; } });
        }
        return module;
    } };
    vm.runInNewContext(await read('vendor/ariang/src/scripts/config/configuration.js'), {
        angular: { module: () => module }
    });
    for (const url of ['moz-extension://test/index.html#!/task/detail/123',
        'chrome-extension://test/index.html#!/task/detail/123', 'https://example.org',
        'mailto:test@example.org']) {
        assert.equal(whitelist.test(url), true, url);
    }
    for (const url of ['javascript:alert(1)', 'data:text/html,test', 'vbscript:test']) {
        assert.equal(whitelist.test(url), false, url);
    }
});
