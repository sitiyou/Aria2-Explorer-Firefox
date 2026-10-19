import argparse
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXTENSION_FILES = (
    'manifest.json', 'background.js', 'aria2.html', 'options.html',
    'js', 'css', 'images', '_locales', 'ui', 'LICENSE', 'acknowledgment.txt',
)


def build(browser, gecko_id, name):
    destination = ROOT / 'build' / browser
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    for entry in EXTENSION_FILES:
        source = ROOT / entry
        target = destination / entry
        if source.is_dir():
            shutil.copytree(source, target)
        else:
            shutil.copyfile(source, target)

    manifest_path = destination / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    if browser == 'firefox':
        for key in ('minimum_chrome_version', 'side_panel', 'externally_connectable'):
            manifest.pop(key, None)
        manifest['permissions'] = [permission for permission in manifest['permissions']
                                   if permission not in ('sidePanel', 'power')]
        manifest['background'] = {'scripts': ['background.js'], 'type': 'module'}
        manifest['incognito'] = 'spanning'
        manifest['sidebar_action'] = {
            'default_panel': 'ui/ariang/index.html',
            'default_title': name,
            'default_icon': 'images/logo32.png',
            'open_at_install': False,
        }
        manifest['browser_specific_settings'] = {
            'gecko': {
                'id': gecko_id,
                'strict_min_version': '140.0',
                'data_collection_permissions': {
                    'required': ['authenticationInfo', 'browsingActivity', 'websiteContent', 'websiteActivity'],
                },
            },
        }
        for locale in (destination / '_locales').iterdir():
            messages_path = locale / 'messages.json'
            messages = json.loads(messages_path.read_text())
            messages['appName']['message'] = name
            messages_path.write_text(json.dumps(messages, ensure_ascii=False, indent=3) + '\n')
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=3) + '\n')

    archive_path = ROOT / 'build' / f'aria2e-{browser}-{manifest["version"]}.zip'
    with zipfile.ZipFile(archive_path, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(destination.rglob('*')):
            if path.is_file():
                info = zipfile.ZipInfo(path.relative_to(destination).as_posix())
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, path.read_bytes())
    print(archive_path.relative_to(ROOT))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('browser', choices=['chromium', 'firefox', 'all'], nargs='?', default='all')
    parser.add_argument('--gecko-id', default='aria2-explorer-firefox-fork@local.invalid')
    parser.add_argument('--name', default='Aria2 Explorer Fork (Development)')
    arguments = parser.parse_args()
    browsers = ('chromium', 'firefox') if arguments.browser == 'all' else (arguments.browser,)
    for browser in browsers:
        build(browser, arguments.gecko_id, arguments.name)
