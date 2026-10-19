import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'build' / 'aria2e-source.zip'
EXCLUDED_PARTS = {'.git', '__pycache__', 'node_modules', '.tmp', 'dist', 'build', 'web-ext-artifacts'}


def main():
    if not (ROOT / 'ui' / 'ariang' / 'index.html').is_file():
        raise SystemExit('Build AriaNg first with: python3 tools/build_ariang.py')

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUTPUT, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(ROOT.rglob('*')):
            if not path.is_file() or any(part in EXCLUDED_PARTS for part in path.relative_to(ROOT).parts):
                continue
            info = zipfile.ZipInfo(path.relative_to(ROOT).as_posix())
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes())
    print(OUTPUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
