import ast
import os

files = []
for root, dirs, fnames in os.walk("app"):
    for f in fnames:
        if f.endswith(".py"):
            files.append(os.path.join(root, f))

errors = []
ok = 0
for fp in files:
    try:
        with open(fp, "r", encoding="utf-8") as fh:
            src = fh.read()
        ast.parse(src)
        ok += 1
    except SyntaxError as e:
        errors.append(f"SYNTAX ERROR: {fp}: {e}")
    except Exception as e:
        errors.append(f"READ ERROR: {fp}: {e}")

print(f"Checked {len(files)} files, {ok} OK")
if errors:
    for e in errors:
        print(e)
else:
    print("All files parse successfully!")
