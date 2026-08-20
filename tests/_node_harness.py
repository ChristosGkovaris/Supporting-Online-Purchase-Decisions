from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

NODE = shutil.which("node")
if NODE is None:
    raise RuntimeError(
        "Node.js was not found in PATH. Install Node.js LTS first, then rerun the tests."
    )

BOOTSTRAP = r'''
globalThis.window = { CSS: { escape: (value) => String(value) } };
globalThis.document = {
  addEventListener: () => {},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};
globalThis.alert = () => {};
globalThis.prompt = () => null;
const __storage = Object.create(null);
globalThis.chrome = {
  runtime: {
    onMessage: { addListener: () => {} },
    lastError: null,
    getURL: (path) => `chrome-extension://test/${path}`
  },
  storage: {
    local: {
      async get(key) {
        if (key == null) return { ...__storage };
        if (Array.isArray(key)) {
          const out = {};
          for (const k of key) out[k] = __storage[k];
          return out;
        }
        if (typeof key === "string") return { [key]: __storage[key] };
        const out = {};
        for (const [k, fallback] of Object.entries(key)) {
          out[k] = Object.prototype.hasOwnProperty.call(__storage, k) ? __storage[k] : fallback;
        }
        return out;
      },
      async set(values) { Object.assign(__storage, values); },
      async clear() { for (const key of Object.keys(__storage)) delete __storage[key]; }
    }
  },
  tabs: {
    async query() { return []; },
    create() {},
    sendMessage() {}
  },
  scripting: { async executeScript() {} }
};
'''


def _run(source_file: str, test_code: str):
    source_path = SRC / source_file
    if not source_path.exists():
        raise AssertionError(f"Missing source file: {source_path}")

    source = source_path.read_text(encoding="utf-8")

    script = (
        BOOTSTRAP
        + "\n"
        + source
        + "\n"
        + "async function __runTest() {\n"
        + test_code
        + "\n}\n"
        + r'''
(async () => {
  try {
    const result = await __runTest();
    process.stdout.write(JSON.stringify({ ok: true, result }));
  } catch (error) {
    process.stdout.write(JSON.stringify({
      ok: false,
      name: error?.name || "Error",
      message: error?.message || String(error),
      stack: error?.stack || ""
    }));
    process.exitCode = 1;
  }
})();
'''
    )

    import tempfile
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as tmp:
        tmp.write(script)
        tmp_path = tmp.name

    try:
        completed = subprocess.run(
            [NODE, tmp_path],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    stdout = completed.stdout.strip()
    if not stdout:
        raise AssertionError(f"Node produced no JSON output.\nSTDERR:\n{completed.stderr}")

    json_line = stdout.splitlines()[-1] if stdout else ""
    try:
        payload = json.loads(json_line)
    except json.JSONDecodeError as exc:
        raise AssertionError(
            "Could not decode Node test output as JSON.\n"
            f"STDOUT:\n{completed.stdout}\nSTDERR:\n{completed.stderr}"
        ) from exc

    if not payload.get("ok"):
        raise AssertionError(
            f"{payload.get('name')}: {payload.get('message')}\n{payload.get('stack', '')}"
        )

    return payload.get("result")


def run_popup(test_code: str):
    return _run("popup.js", test_code)


def run_content(test_code: str):
    return _run("content.js", test_code)
