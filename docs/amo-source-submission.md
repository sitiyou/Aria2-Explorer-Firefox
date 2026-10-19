# AMO source submission

The Firefox package embeds AriaNg 1.3.15 from the upstream source release at
https://github.com/mayswind/AriaNg/tree/1.3.15. Its source, MIT license,
`package.json`, and lockfile are included in `vendor/ariang/`. The source
changes add AngularJS's `ng-csp` directive and use a fixed build identifier so
the output is reproducible without Git metadata. The AngularJS link whitelist
also permits Firefox and Chromium extension URLs for task navigation. The Firefox extension settings
integration uses AriaNg's existing `AriaNg.Options` local-storage key and
`extendRpcServers` option format.

The upstream AriaNg build bundles third-party dependencies declared in its
`package.json` and pinned by `package-lock.json`. Their original sources can be
retrieved from the npm registry or the pinned Git commit in the lockfile. The
build retains upstream license notices and includes AriaNg's MIT license in the
extension package.

## Build environment

- Linux, macOS, or Windows with Python 3 and Node.js 22 or later.
- `npx` available with Node.js.
- The build invokes npm 8.19.4 through npx and installs exact dependencies from
  `vendor/ariang/package-lock.json`. Network access to npm and the pinned Git
  dependency is required on the first build.
- No global Gulp installation is required.

From the repository root:

```sh
python3 tools/build_ariang.py
node --test tests/*.test.mjs
python3 tools/build.py firefox --name "Aria2 Explorer (sitiyou's fork)" --gecko-id 'aria2-explorer@sitiyou'
npx --yes web-ext@10.8.0 lint --source-dir build/firefox
python3 tools/source_package.py
```

`build_ariang.py` installs the locked dependencies, runs the upstream Gulp
build, and copies its output to `ui/ariang/`. `build.py` packages the selected
Firefox browser manifest and extension files. `source_package.py` creates
`build/aria2e-source.zip`, including readable project and AriaNg sources,
build scripts, lockfiles, license notices, and the generated extension files
for comparison. It excludes Git metadata, dependencies, and intermediate build
folders.

AriaNg's original external announcements and remote recommendation pages are
not part of the vendored 1.3.15 source. The extension CSP also permits frames
only from the extension itself and the aria2 UI protocol. The AriaNg help link
opens the upstream source repository only when the user explicitly activates
it; it does not load remote content into the extension.

## Third-party library sources

AriaNg's package manifest and lockfile identify bundled libraries and exact
versions. The upstream AriaNg source repository contains the original build
manifest and source inputs. Important direct dependency source links include:

- AriaNg 1.3.15: https://github.com/mayswind/AriaNg/tree/1.3.15
- AngularJS: https://github.com/angular/angular.js/tree/v1.6.10
- Bootstrap: https://github.com/twbs/bootstrap/tree/v3.4.1
- jQuery: https://github.com/jquery/jquery/tree/3.4.1
- ECharts: https://github.com/apache/echarts/tree/3.8.5
- Moment.js: https://github.com/moment/moment/tree/2.29.4
- AdminLTE: https://github.com/ColorlibHQ/AdminLTE/tree/v2.4.18
- Font Awesome: https://github.com/FortAwesome/Font-Awesome/tree/v4.7.0

The exact dependency list and pinned versions are in
`vendor/ariang/package.json` and `vendor/ariang/package-lock.json`; consult
those files for all transitive and Git dependencies.
