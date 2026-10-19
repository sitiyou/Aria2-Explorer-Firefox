import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJSON = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const build = () => execFileSync('python3', ['tools/build.py'], { cwd: root });
const checksum = path => createHash('sha256').update(readFileSync(new URL('../' + path, import.meta.url))).digest('hex');

test('browser packages preserve Chromium and supply a separate Firefox manifest', () => {
    build();
    assert.deepEqual(readJSON('build/chromium/manifest.json'), readJSON('manifest.json'));
    const firefox = readJSON('build/firefox/manifest.json');
    assert.deepEqual(firefox.background, { scripts: ['background.js'], type: 'module' });
    assert.equal(firefox.incognito, 'spanning');
    assert.equal(firefox.sidebar_action.default_panel, 'ui/ariang/index.html');
    for (const key of ['minimum_chrome_version', 'side_panel', 'externally_connectable']) {
        assert.equal(key in firefox, false);
    }
    assert.equal(firefox.permissions.includes('power'), false);
    assert.equal(firefox.permissions.includes('sidePanel'), false);
    assert.equal(firefox.browser_specific_settings.gecko.strict_min_version, '140.0');
    assert.equal(firefox.browser_specific_settings.gecko.data_collection_permissions.required.includes('authenticationInfo'), true);
    assert.notEqual(readJSON('build/firefox/_locales/en/messages.json').appName.message,
        readJSON('_locales/en/messages.json').appName.message);
    assert.equal(checksum('build/firefox/LICENSE'), checksum('LICENSE'));
});

test('ZIP output is reproducible and contains no development or git files', () => {
    build();
    const version = readJSON('manifest.json').version;
    const archives = ['chromium', 'firefox'].map(browser => `build/aria2e-${browser}-${version}.zip`);
    const hashes = archives.map(checksum);
    build();
    assert.deepEqual(archives.map(checksum), hashes);
    for (const archive of archives) {
        const entries = JSON.parse(execFileSync('python3', ['-c',
            'import json,sys,zipfile; print(json.dumps(zipfile.ZipFile(sys.argv[1]).namelist()))', archive],
            { cwd: root, encoding: 'utf8' }));
        assert.equal(entries.includes('manifest.json'), true);
        assert.equal(entries.includes('LICENSE'), true);
        assert.equal(entries.some(entry => /^(\.git|tests\/|tools\/|docs\/|build\/)/.test(entry)), false);
    }
});
