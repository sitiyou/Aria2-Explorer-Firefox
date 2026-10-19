import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'vendor' / 'ariang'
DESTINATION = ROOT / 'ui' / 'ariang'
NPM = ('npx', '--yes', 'npm@8.19.4')
EXPECTED_VERSION = '1.3.15'


def run(*args):
    subprocess.run([*NPM, *args], cwd=SOURCE, check=True)


def main():
    package = json.loads((SOURCE / 'package.json').read_text())
    if package['version'] != EXPECTED_VERSION:
        raise SystemExit(f'Expected AriaNg {EXPECTED_VERSION}, found {package["version"]}')

    run('ci', '--ignore-scripts', '--no-audit', '--no-fund')
    run('run', 'build')
    generated = SOURCE / 'dist'
    if any(token in path.read_text(errors='ignore')
           for path in generated.rglob('*.js')
           for token in ('rec.aria2e.com', 'aria2eRecService', 'recommend.html')):
        raise SystemExit('Generated AriaNg contains remote recommendation code')
    shutil.rmtree(DESTINATION, ignore_errors=True)
    shutil.copytree(generated, DESTINATION)


if __name__ == '__main__':
    main()
