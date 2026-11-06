"""Merge translation batches (batches/*.json: {key: [en, nl]}) into src/i18n/en.ts + nl.ts."""
import json, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[2]
store = root / "scripts/i18n/strings.json"
data = json.loads(store.read_text()) if store.exists() else {}
for f in sys.argv[1:]:
    data.update(json.loads(pathlib.Path(f).read_text()))
store.write_text(json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True))
def emit(name, idx, typed):
    lines = [f"// Generated from scripts/i18n/strings.json by scripts/i18n/build.py — edit there.\n"]
    if typed: lines.append('import type { en } from "./en";\n\nexport const nl: Record<keyof typeof en, string> = {\n')
    else: lines.append("export const en = {\n")
    for k in sorted(data):
        lines.append(f"  {json.dumps(k)}: {json.dumps(data[k][idx], ensure_ascii=False)},\n")
    lines.append("};\n" if typed else "} as const;\n")
    (root / f"src/i18n/{name}.ts").write_text("".join(lines))
emit("en", 0, False); emit("nl", 1, True)
print(len(data), "keys")
