
# TESTING

The project uses **automated testing** to validate the Chrome Extension's core decision-support logic, scraping rules, budget handling, and selected browser-facing behavior.

The automated suite executes the application's actual JavaScript source using mocked browser interfaces rather than a complete Chrome environment.

## Automated Test Suite

Automated tests are implemented with Python's built-in `unittest` framework.

The JavaScript application logic in `src/wishlistScraper.js` and `src/decisionLogic.js` is executed through Node.js using a lightweight test harness that provides mocked browser and Chrome Extension APIs.

The test harness is implemented in `tests/_node_harness.py`.

No external Python testing packages or npm dependencies are required.

### Requirements

- Python 3.10+
- Node.js 18+ recommended

Verify the environment:

```powershell
python --version
node --version
```

Both Python and Node.js must be available in the system PATH.

### Running the Tests

From the repository root:

```powershell
python scripts/run_tests.py
```

The runner automatically discovers all files matching:

```text
tests/test_*.py
```

The current test suite is organized into:

```text
tests/
├── _node_harness.py
├── test_manifest.py
├── test_content_logic.py
├── test_popup_logic.py
├── test_regressions.py
└── test_code_quality.py
```

The Python runner discovers and executes the test cases, while the Node.js harness loads the actual JavaScript source files and evaluates the targeted functions.

For the supplied repository version, all 45 automated tests passed.

A successful run produces a summary similar to:

```text
Automated Test Suite
──────────────────────────────
Tests:    45
Passed:   45
Duration: X.XXs
Status:   ALL TESTS PASSED
```

The test count and execution duration may change as tests are added, removed, or modified.

The runner returns a nonzero exit code when tests fail, allowing failures to be detected by automated workflows.

### Automated Coverage

The automated suite covers the following areas:

| Area | Coverage |
|---|---|
| Extension configuration | Manifest V3, required source files, permissions, Skroutz host scope |
| Availability | Explicit out-of-stock detection, missing-price handling, available products |
| Product extraction | Euro price parsing, product-card validation, false-positive rejection |
| Discounts | Coupon detection, percentage calculation, rating boundaries |
| Budgeting | Zero, negative and unset budgets, Extra Budget, cent-level boundaries |
| Scoring | Zero-weight fallback, Budget Fit, budget adjustments, Value for Money |
| Classification | Product grouping, seasonality, substring false-positive prevention |
| Purchase Readiness | Out-of-stock, over-budget and exact-budget behavior |
| Product identity | URL canonicalization, query/hash removal, invalid URLs, normalized-title fallback |
| State preservation | Product re-import merging while preserving user urgency, tracked state, and list assignment |
| Purchase planning | Budget-safe optimization, plan threshold validation, group diversity |
| Recommendations | Plan-dependent Best Next Purchase selection |
| Monetary calculations | Integer-cent conversion and round-trip consistency |

The test harness executes the actual JavaScript source while providing minimal mocks for:

- DOM access;
- Chrome runtime messaging;
- Chrome local storage;
- Chrome tabs;
- Chrome scripting APIs;
- selected browser globals.

Each JavaScript test invocation runs through a temporary Node.js script containing the relevant application source and test code.

Test results are returned to Python through structured JSON output.

These tests validate specific functions and controlled scenarios without requiring an active Chrome browser or authenticated Skroutz session.

## Code Quality Checks

Additional static checks validate repository-level implementation constraints, including:

- duplicate named JavaScript function declarations;
- accidental `debugger` statements;
- simple hard-coded credential or secret assignment patterns;
- existence and non-empty state of required extension source files.

The duplicate-function checks examine named function declarations in `decisionLogic.js` and `wishlistScraper.js`.

The credential checks search for predefined suspicious assignment patterns, including API keys, passwords, secrets, and access tokens.

These checks complement the functional suite; they are not a replacement for comprehensive linting, dependency auditing, or security analysis.

They do not establish that the application is free from all code-quality or security vulnerabilities.

## Regression Fixes Validated

The test suite includes regression cases covering several previously encountered implementation issues:

- **Availability handling:** missing price is no longer sufficient to classify a product as out of stock.
- **Discount extraction:** monetary coupons and old/current price combinations can be converted into percentage-based discount ratings.
- **DOM filtering:** unrelated Skroutz interface elements are rejected in controlled product-card validation scenarios.
- **Budget validation:** zero, negative, empty, exact-boundary, and over-boundary values are handled consistently in the tested scenarios.
- **Product identity:** canonical product URLs prevent query parameters or URL fragments from creating duplicate identities.
- **Invalid URLs:** malformed product URLs are rejected during URL canonicalization.
- **State preservation:** product re-importing retains user-assigned urgency ratings, tracked states, and list assignments.
- **Classification:** keyword matching avoids known substring false positives in product grouping.
- **Purchase Readiness:** explicitly unavailable products receive zero readiness, while over-budget products receive the appropriate classification.
- **Purchase planning:** tested plans respect the Effective Budget and avoid selecting multiple products from the same detected group.
- **Plan thresholds:** inclusion thresholds are checked for consistency with the 1–5 rating scale.
- **Recommendation selection:** Best Next Purchase selection responds to the active purchase strategy.
- **Monetary precision:** integer-cent conversion preserves tested monetary values through conversion and restoration.

The purchase-plan engine also implements a minimum utility threshold intended to prevent low-value products from being selected solely to consume unused budget.

The automated suite checks the threshold range and selected optimization scenarios, but it does not exhaustively verify every possible purchase combination.

## Testing Limitations

The automated suite validates deterministic application logic but does not emulate a complete Chrome browser environment or the live Skroutz website.

The use of mocked browser APIs means that successful automated tests do not independently establish correct behavior across all browser versions or future Skroutz page layouts.

In particular, the exact number of products available in a private Skroutz Favorites page cannot be treated as a reproducible unit-test assertion because it depends on:

- the authenticated user's current wishlist;
- the live Skroutz DOM;
- changes to the external website.

The automated tests also do not provide complete end-to-end verification of:

- real Chrome Extension installation and interaction;
- live Skroutz authentication and product extraction;
- every possible external DOM structure;
- visual rendering and responsive layout;
- persistence across actual browser restarts;
- browser-specific permission and messaging failures;
- performance under large real-world wishlists.

The test suite is designed to verify the implemented rules and representative regression cases rather than provide exhaustive formal verification.

## Continuous Integration

The repository includes a GitHub Actions workflow at:

```text
.github/workflows/tests.yml
```

The workflow automatically executes the automated test suite on:

- pushes to the `main` branch;
- pull requests targeting the `main` branch.

The workflow uses:

```text
Python 3.12
Node.js 20
```

It executes the same test runner used for local validation:

```powershell
python scripts/run_tests.py
```

A failing test run causes the workflow step to fail.

This provides automated regression checking for changes submitted to the repository.

## Manual Validation

Manual browser-level regression testing complements the automated suite.

Manual validation focuses on interactions that depend on the real Chrome Extension environment and the live Skroutz Favorites page.

Relevant scenarios include:

- installing and opening the extension;
- launching the full-tab application;
- importing products from a live Skroutz Favorites page;
- verifying the imported product count;
- checking the rejection of unrelated DOM elements;
- verifying out-of-stock and missing-price behavior;
- changing urgency ratings and preference weights;
- configuring the base budget and Extra Budget percentage;
- verifying exact-budget and over-budget classification;
- generating budget-constrained purchase plans;
- checking product-list assignments;
- verifying persistence after reloading the application;
- confirming that repeated imports do not create duplicate products.

Manual testing is necessary because mocked automated tests cannot fully reproduce the current external website or all browser interactions.

The automated and manual validation approaches therefore address different aspects of the application.

Passing automated tests demonstrates successful execution of the covered functional checks, while live browser validation is required to assess compatibility with the current Skroutz environment.