# TESTING

The project uses **automated testing** to validate the Chrome Extension's core decision-support logic, scraping rules, budget handling, and browser-facing behavior.

## Automated Test Suite

Automated tests are implemented with Python's built-in `unittest` framework.

The JavaScript application logic in `src/content.js` and `src/popup.js` is executed through Node.js using a lightweight test harness that provides mocked browser and Chrome Extension APIs. No external Python testing packages are required.

### Requirements

- Python 3.10+
- Node.js 18+ recommended

Verify the environment:

```powershell
python --version
node --version
```

### Running the Tests

From the repository root:

```powershell
python scripts/run_tests.py
```

The runner automatically discovers all files matching:

```text
tests/test_*.py
```

A successful run produces a summary similar to:

```text
Automated Test Suite
──────────────────────────────
Tests:    45
Passed:   45
Duration: X.XXs
Status:   ALL TESTS PASSED
```

### Automated Coverage

The automated suite covers the following areas:

| Area | Coverage |
|---|---|
| Extension configuration | Manifest V3, required source files, permissions, Skroutz host scope |
| Availability | Explicit out-of-stock detection, missing-price handling, available products |
| Product extraction | Euro price parsing, valid product-card detection, false-positive rejection |
| Discounts | Coupon detection, percentage calculation, rating boundaries |
| Budgeting | Zero, negative and unset budgets, Extra Budget, cent-level boundaries |
| Scoring | Zero-weight fallback, Budget Fit, budget adjustments, Value for Money |
| Classification | Product grouping, seasonality, substring false-positive prevention |
| Purchase Readiness | Out-of-stock, over-budget and exact-budget behavior |
| Product identity | URL canonicalization, query/hash removal, normalized-title fallback |
| Persistence | Product re-import merging while preserving user urgency and list state |
| Purchase planning | Budget-safe optimization, plan thresholds, group diversity |
| Recommendations | Plan-dependent Best Next Purchase selection |
| Monetary calculations | Integer-cent conversion and round-trip consistency |

The test harness executes the actual JavaScript source while providing minimal mocks for the DOM, Chrome runtime, local storage, tabs, and scripting APIs.

## Code Quality Checks

Additional static checks validate repository-level implementation constraints, including:

- duplicate JavaScript function declarations;
- accidental `debugger` statements;
- obvious hard-coded credential or secret patterns;
- existence and non-empty state of required extension source files.

These checks complement the functional suite; they are not a replacement for linting or security analysis.

## Regression Fixes Validated

The test process identified and validated fixes for several implementation issues:

- **Availability handling:** missing price is no longer sufficient to classify a product as out of stock.
- **Discount extraction:** monetary coupons and old/current price combinations can be converted into percentage-based discount ratings.
- **DOM filtering:** unrelated Skroutz interface elements are rejected during product extraction.
- **Budget validation:** zero, negative, empty, exact-boundary, and over-boundary values are handled consistently.
- **Product identity:** canonical product URLs prevent query parameters or URL fragments from creating duplicate identities.
- **Classification:** keyword matching avoids known substring false positives in product grouping.
- **Purchase planning:** generated plans respect the Effective Budget and avoid selecting multiple products from the same detected group.
- **Optimizer quality:** low-utility products are not selected solely to consume unused budget.

## Testing Limitations

The automated suite validates deterministic application logic but does not emulate a complete Chrome browser environment or the live Skroutz website.

In particular, the exact number of products available in a private Skroutz Favorites page cannot be treated as a reproducible unit-test assertion because it depends on:

- the authenticated user's current wishlist;
- the live Skroutz DOM;
- changes to the external website.