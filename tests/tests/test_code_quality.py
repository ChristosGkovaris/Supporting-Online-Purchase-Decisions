import re
import unittest
from pathlib import Path


class CodeQualityTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.root = Path(
            __file__
        ).resolve().parents[1]

        cls.popup_path = (
            cls.root /
            "src" /
            "popup.js"
        )

        cls.content_path = (
            cls.root /
            "src" /
            "content.js"
        )

        cls.popup_source = (
            cls.popup_path
            .read_text(
                encoding="utf-8"
            )
        )

        cls.content_source = (
            cls.content_path
            .read_text(
                encoding="utf-8"
            )
        )

    def test_41_no_duplicate_function_names_in_popup(self):
        names = re.findall(
            r"\bfunction\s+([A-Za-z_$][\w$]*)\s*\(",
            self.popup_source
        )

        duplicates = sorted(
            {
                name
                for name in names
                if names.count(name) > 1
            }
        )

        self.assertEqual(
            duplicates,
            [],
            msg=(
                "Duplicate function declarations "
                f"found in popup.js: {duplicates}"
            )
        )

    def test_42_no_duplicate_function_names_in_content(self):
        names = re.findall(
            r"\bfunction\s+([A-Za-z_$][\w$]*)\s*\(",
            self.content_source
        )

        duplicates = sorted(
            {
                name
                for name in names
                if names.count(name) > 1
            }
        )

        self.assertEqual(
            duplicates,
            [],
            msg=(
                "Duplicate function declarations "
                f"found in content.js: {duplicates}"
            )
        )

    def test_43_no_debugger_statements(self):
        combined = (
            self.popup_source +
            "\n" +
            self.content_source
        )

        self.assertNotRegex(
            combined,
            r"\bdebugger\s*;"
        )

    def test_44_no_alert_credentials_or_secrets(self):
        combined = (
            self.popup_source +
            "\n" +
            self.content_source
        )

        suspicious_patterns = [
            r"api[_-]?key\s*=",
            r"password\s*=",
            r"secret\s*=",
            r"access[_-]?token\s*="
        ]

        for pattern in suspicious_patterns:
            self.assertNotRegex(
                combined.lower(),
                pattern
            )

    def test_45_manifest_and_source_files_are_non_empty(self):
        required = [
            "manifest.json",
            "content.js",
            "popup.js",
            "popup.html",
            "popup.css"
        ]

        for filename in required:
            path = (
                self.root /
                "src" /
                filename
            )

            self.assertTrue(
                path.exists(),
                msg=f"{filename} is missing"
            )

            self.assertGreater(
                path.stat().st_size,
                0,
                msg=f"{filename} is empty"
            )


if __name__ == "__main__":
    unittest.main()