from __future__ import annotations

import sys
import time
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent
TESTS_DIRECTORY = PROJECT_ROOT / "tests"
TEST_PATTERN = "test_*.py"


class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


class MinimalTestResult(unittest.TextTestResult):
    """Collect test results without printing unittest's default progress dots."""

    def addSuccess(self, test: unittest.TestCase) -> None:
        super().addSuccess(test)

    def addFailure(
        self,
        test: unittest.TestCase,
        err: tuple[type[BaseException], BaseException, object],
    ) -> None:
        super().addFailure(test, err)

    def addError(
        self,
        test: unittest.TestCase,
        err: tuple[type[BaseException], BaseException, object],
    ) -> None:
        super().addError(test, err)


class MinimalTestRunner(unittest.TextTestRunner):
    resultclass = MinimalTestResult


def discover_tests() -> unittest.TestSuite:
    """Discover all automated tests in the repository test directory."""
    if not TESTS_DIRECTORY.is_dir():
        raise FileNotFoundError(
            f"Test directory not found: {TESTS_DIRECTORY}"
        )

    loader = unittest.TestLoader()

    return loader.discover(
        start_dir=str(TESTS_DIRECTORY),
        pattern=TEST_PATTERN,
        top_level_dir=str(PROJECT_ROOT),
    )


def print_summary(
    result: unittest.TestResult,
    duration: float,
) -> None:
    """Print a concise, CI-friendly test summary."""
    failures = len(result.failures)
    errors = len(result.errors)
    skipped = len(result.skipped)
    total = result.testsRun

    failed = failures + errors
    passed = total - failed - skipped

    print()
    print("Automated Test Suite")
    print("─" * 30)
    print(f"Tests:    {total}")
    print(f"Passed:   {passed}")

    if skipped:
        print(f"Skipped:  {skipped}")

    print(f"Duration: {duration:.2f}s")

    if result.wasSuccessful():
        print(
            f"Status:   "
            f"{Colors.BOLD}{Colors.GREEN}"
            f"ALL TESTS PASSED"
            f"{Colors.RESET}"
        )
    else:
        print(f"Failed:   {failed}")
        print(
            f"Status:   "
            f"{Colors.BOLD}{Colors.RED}"
            f"TESTS FAILED"
            f"{Colors.RESET}"
        )


def main() -> int:
    suite = discover_tests()

    runner = MinimalTestRunner(
        stream=sys.stderr,
        verbosity=0,
    )

    start_time = time.perf_counter()

    result = runner.run(suite)

    duration = time.perf_counter() - start_time

    print_summary(
        result=result,
        duration=duration,
    )

    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())