import assert from 'node:assert/strict';
import { test } from 'node:test';
import DownloadCapture from '../js/downloadCapture.js';

function event() {
    const listeners = new Set();
    return {
        addListener: listener => listeners.add(listener),
        removeListener: listener => listeners.delete(listener),
        hasListener: listener => listeners.has(listener),
        emit: (...args) => [...listeners].forEach(listener => listener(...args)),
        get size() { return listeners.size; }
    };
}

function setup(minimum = 0, chromium = false) {
    globalThis.chrome = { runtime: { id: 'self' } };
    const downloads = { onCreated: event(), onChanged: event(), onErased: event() };
    if (chromium) downloads.onDeterminingFilename = event();
    const captured = [];
    const callback = (...args) => captured.push(args);
    const capture = new DownloadCapture(callback, () => minimum, downloads);
    capture.addListener();
    const item = { id: 1, url: 'https://example.com/file.zip', filename: '/tmp/file.zip',
        state: 'in_progress', fileSize: -1, totalBytes: -1 };
    return { downloads, capture, captured, item, callback };
}

test('Chromium retains the native filename event and suggest callback', () => {
    const { downloads, capture, captured, item, callback } = setup(0, true);
    const suggest = () => {};
    assert.equal(downloads.onDeterminingFilename.hasListener(callback), true);
    downloads.onDeterminingFilename.emit(item, suggest);
    assert.deepEqual(captured, [[item, suggest]]);
    assert.equal(downloads.onCreated.size, 0);
    capture.removeListener();
    assert.equal(capture.hasListener(), false);
});

test('Firefox captures unknown sizes without a size threshold and strips absolute paths', () => {
    const { downloads, captured, item } = setup();
    downloads.onCreated.emit({ ...item, filename: 'C:\\Users\\test\\file.zip' });
    assert.equal(captured.length, 1);
    assert.equal(captured[0][0].filename, 'file.zip');
    assert.equal(captured[0][0].fileSize, 0);
});

test('Firefox waits for size metadata and dispatches only once', () => {
    const { downloads, captured, item } = setup(10);
    downloads.onCreated.emit(item);
    assert.equal(captured.length, 0);
    downloads.onChanged.emit({ id: 1, totalBytes: { current: 20 * 1024 * 1024 } });
    downloads.onChanged.emit({ id: 1, filename: { current: '/tmp/renamed.zip' } });
    assert.equal(captured.length, 1);
    assert.equal(captured[0][0].fileSize, 20 * 1024 * 1024);
});

test('unknown-size downloads that finish stay in the browser', () => {
    const { downloads, capture, captured, item } = setup(10);
    downloads.onCreated.emit(item);
    downloads.onChanged.emit({ id: 1, state: { current: 'complete' }, fileSize: { current: 50_000_000 } });
    assert.equal(captured.length, 0);
    assert.equal(capture.pending.size, 0);
});

test('Firefox waits for filenames without dropping container and private context', () => {
    const { downloads, captured, item } = setup();
    downloads.onCreated.emit({ ...item, filename: '', cookieStoreId: 'firefox-container-2', incognito: true });
    downloads.onChanged.emit({ id: 1, filename: { current: '/tmp/actual.zip' } });
    assert.equal(captured[0][0].filename, 'actual.zip');
    assert.equal(captured[0][0].cookieStoreId, 'firefox-container-2');
    assert.equal(captured[0][0].incognito, true);
});

test('self downloads and non-network downloads are never captured', () => {
    const { downloads, capture, captured, item } = setup(10);
    downloads.onCreated.emit({ ...item, byExtensionId: 'self' });
    downloads.onCreated.emit({ ...item, url: 'blob:https://example.com/id' });
    assert.equal(captured.length, 0);
    assert.equal(capture.pending.size, 0);
});

test('Firefox discovers size metadata even when no change event is emitted', async () => {
    const { downloads, capture, captured, item } = setup(10);
    downloads.search = async () => [{ ...item, totalBytes: 20 * 1024 * 1024 }];
    downloads.onCreated.emit(item);
    await capture.pollMetadata();
    capture.removeListener();
    assert.equal(captured.length, 1);
    assert.equal(captured[0][0].fileSize, 20 * 1024 * 1024);
});

test('disabling capture while metadata is queried prevents late handoffs', async () => {
    const { downloads, capture, captured, item } = setup(10);
    let resolve;
    downloads.search = () => new Promise(done => { resolve = done; });
    downloads.onCreated.emit(item);
    const polling = capture.pollMetadata();
    capture.removeListener();
    resolve([{ ...item, totalBytes: 20 * 1024 * 1024 }]);
    await polling;
    assert.equal(captured.length, 0);
});

test('listener lifecycle is idempotent and clears deferred downloads', () => {
    const { downloads, capture, item } = setup(10);
    capture.addListener();
    assert.equal(downloads.onCreated.size, 1);
    downloads.onCreated.emit(item);
    downloads.onErased.emit(item.id);
    assert.equal(capture.pending.size, 0);
    downloads.onCreated.emit(item);
    capture.removeListener();
    assert.equal(capture.pending.size, 0);
    assert.equal(downloads.onChanged.size, 0);
    assert.equal(downloads.onErased.size, 0);
    assert.equal(capture.hasListener(), false);
});
