import zipfile, os

root = r'c:\dev\AI4Consulting - Elio scaffold'
out = os.path.join(root, 'elio-scaffold-v6.zip')

items = ['back','front','scripts','.vscode','.github',
         'BACKLOG.md','PRODUCT.md','README.md','SUBMISSION.md','VIBE-CODING-GUIDE.md']

skip_dirs = {'__pycache__','node_modules','dist','.venv','.pytest_cache','.mypy_cache'}
skip_files = {'settings.local.json', '.env'}

if os.path.exists(out):
    os.remove(out)

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for item in items:
        src = os.path.join(root, item)
        if not os.path.exists(src):
            print(f'SKIP (not found): {item}')
            continue
        if os.path.isdir(src):
            for dirpath, dirnames, filenames in os.walk(src):
                dirnames[:] = [d for d in dirnames if d not in skip_dirs]
                for f in filenames:
                    if f in skip_files or f.endswith('.pyc'):
                        continue
                    full = os.path.join(dirpath, f)
                    arcname = os.path.relpath(full, root)
                    zf.write(full, arcname)
        else:
            zf.write(src, item)

    input_readme = os.path.join(root, 'Input', 'README.md')
    if os.path.exists(input_readme):
        zf.write(input_readme, 'Input/README.md')

size = os.path.getsize(out) / 1024
with zipfile.ZipFile(out) as zf_check:
    entries = len(zf_check.namelist())
print(f'Done: {out} ({size:.1f} KB, {entries} entries)')
