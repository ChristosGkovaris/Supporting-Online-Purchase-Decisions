import json
import unittest
from pathlib import Path


class ManifestTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parents[1]
        cls.manifest_path = cls.root / "src" / "manifest.json"
        cls.manifest = json.loads(cls.manifest_path.read_text(encoding="utf-8"))

    def test_01_required_source_files_exist(self):
        src = self.root / "src"
        expected = {"manifest.json", "wishlistScraper.js", "decisionLogic.js", "dashboard.html", "dashboard.css"}
        missing = [name for name in expected if not (src / name).exists()]
        self.assertEqual(missing, [])

    def test_02_manifest_v3(self):
        self.assertEqual(self.manifest.get("manifest_version"), 3)

    def test_03_required_permissions_are_declared(self):
        permissions = set(self.manifest.get("permissions", []))
        for required in {"storage", "tabs", "scripting"}:
            self.assertIn(required, permissions)

    def test_04_skroutz_host_permissions_are_scoped(self):
        hosts = set(self.manifest.get("host_permissions", []))
        self.assertIn("https://www.skroutz.gr/*", hosts)
        self.assertIn("https://skroutz.gr/*", hosts)
        self.assertNotIn("<all_urls>", hosts)


if __name__ == "__main__":
    unittest.main()
