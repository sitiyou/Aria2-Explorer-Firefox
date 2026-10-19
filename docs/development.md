# Browser packages

Requirements: Python 3 and Node.js 22 or later. Building the AriaNg frontend uses npm 8.19.4 via npx and downloads the lockfile-pinned dependencies.

```sh
python3 tools/build_ariang.py
node --test tests/*.test.mjs
python3 tools/build.py
```

The build produces unpacked extensions in `build/chromium/` and `build/firefox/`,
and unsigned ZIP packages in `build/`. Only extension runtime files and license
notices are included. Repeated builds with the same inputs produce identical ZIPs.
The root manifest remains the Chromium manifest and can still be loaded directly.

For Firefox, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary
Add-on**, and select `build/firefox/manifest.json`. Temporary installations are
removed when Firefox exits. Normal installation on release Firefox requires
Mozilla signing; renaming an unsigned ZIP to XPI does not sign it.

To validate the Firefox package:

```sh
npx --yes web-ext@10.8.0 lint --source-dir build/firefox
```

The linter reports guarded Chromium-only APIs and warnings in bundled libraries.
Review the warnings; a lint pass is not an AMO approval or a replacement for
browser testing.

## Firefox behavior

- Desktop Firefox 140 or later is required, including current desktop ESR.
  Firefox 140 provides the built-in data-transmission consent used by this fork.
  Android is not a supported target.
- Firefox uses a module background event page, while Chromium keeps its module
  service worker. Both packages share the same application code.
- Firefox download capture uses download creation events. Deferred downloads are
  checked every 100 ms while filename or size metadata is unavailable, and are
  also updated from download change events. Only downloads seen after capture
  was enabled are considered.
- With a nonzero size threshold, unknown-size downloads remain in the browser
  until their size becomes available. Downloads that finish before a decision
  can be made stay in the browser. With a zero threshold, unknown size alone
  does not prevent capture. Other filters still apply.
- Only the basename of Firefox's absolute download path is sent to aria2.
  Browser cancellation is awaited before handoff. Successfully handed-off
  downloads are removed from Firefox's canceled download history.
- Cookie retrieval uses the originating Firefox cookie store. Partitioned
  cookies are scoped to the referring site rather than merged across all sites.
  Downloads, context-menu actions, and content-script requests preserve their
  container/private context where supplied by Firefox.
- Sidebars use Firefox's native `sidebarAction`. Task-specific panels are scoped
  to a tab or window, not globally. Requests lacking the user activation required
  to open a sidebar or popup fall back to a tab. Private UI requests do not reuse
  normal browsing tabs.
- Firefox does not provide the `power` API. The keep-awake option is disabled
  with an explanation. Firefox notifications have no action buttons; clicking
  the capture reminder opens settings, where the reminder can be disabled.
- The shortcuts button explains how to reach Firefox's shortcut manager.
- Firefox does not expose Chromium's window-bounds change event, so this version
  does not persist resized popup-window bounds on Firefox.

## Release identity and AMO submission

The build script defaults to development-only Firefox identity values. The
release workflow is configured with `Aria2 Explorer (sitiyou's fork)` and
`aria2-explorer@sitiyou`; confirm the ID is available in AMO before submission.
Generate the Firefox package and source archive with:

```sh
python3 tools/build.py firefox --name "Aria2 Explorer (sitiyou's fork)" --gecko-id 'aria2-explorer@sitiyou'
python3 tools/source_package.py
```

Keep that ID for subsequent versions. The tagged-release workflow builds both
browser ZIPs and a source archive, but does not sign or submit the Firefox
package. The Chromium CRX signing step still requires `CHROME_CRX_PRIVATE_KEY`.

The Firefox manifest declares transmission of authentication information,
browsing activity, website content, and website activity because the configured
RPC secret, download URLs, referrers, cookies, and related request information
are sent to the user's aria2 server. Do not declare `none`.
Retain the upstream BSD copyright, conditions, disclaimer, and all applicable
third-party license notices. List the fork maintainer separately from the
original author.

The extension vendors AriaNg 1.3.15 source in `vendor/ariang/`; run
`python3 tools/build_ariang.py` before packaging to reproduce the bundled
frontend. Source submission instructions and third-party library references
are in `docs/amo-source-submission.md`. The vendored frontend does not fetch
remote announcements or embed remote pages. Its help link opens the upstream
repository only after user activation. The build needs network access to npm
and the pinned Git dependency on its first run.

Official references:

- https://extensionworkshop.com/documentation/publish/add-on-policies/
- https://extensionworkshop.com/documentation/publish/source-code-submission/
- https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/downloads/DownloadItem
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/sidebarAction/setPanel
