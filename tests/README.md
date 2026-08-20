# TESTING

The project uses a combination of **automated testing** and **manual regression testing** to validate the Chrome Extension's core decision-support logic, scraping rules, budget handling, and browser-facing behavior.

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
python run_tests.py
```

The runner automatically discovers all files matching:

```text
tests/test_*.py
```

A successful run produces a summary similar to:

```text
Automated Test Suite
──────────────────────────────
Tests:    40
Passed:   40
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

## Manual Regression Testing

Automated tests cannot fully reproduce interactions with an authenticated, live Skroutz Favorites page. Browser-level behavior is therefore also validated manually.

### Test Environment

- **Browser:** Google Chrome
- **Extension model:** Manifest V3
- **Installation:** Unpacked extension
- **Data source:** Skroutz Favorites
- **Method:** Functional, boundary, and regression testing

### Manual Test Cases

| ID | Area | Test | Expected Result |
|---|---|---|---|
| TC-01 | Import | Import products from an open Skroutz Favorites page | All valid wishlist products are imported |
| TC-02 | Availability | Import an explicitly unavailable product | Product appears in `OUT OF STOCK` |
| TC-03 | Availability | Import a product without an explicit out-of-stock signal | Missing price alone does not imply out-of-stock status |
| TC-04 | Scraper | Compare imported count with the actual Favorites count | Non-product DOM elements are rejected |
| TC-05 | Price | Compare imported prices with Skroutz | Product prices are extracted correctly |
| TC-06 | Deduplication | Inspect the imported product collection | No unintended duplicate products are created |
| TC-07 | Discount | Import a product containing old price, current price, or coupon data | Correct discount percentage and rating are derived |
| TC-08 | Weights | Set both configurable scoring weights to zero | Application remains stable and uses the defined fallback |
| TC-09 | Budget | Set Budget to `0` | Effective Budget is zero and positive-price products are out of budget |
| TC-10 | Budget | Enter a negative budget | Input is normalized rather than used as a negative budget |
| TC-11 | Budget | Leave Budget empty | Budget is treated as unset |
| TC-12 | Budget | Enter a very large budget | Valid products are not incorrectly classified as out of budget |
| TC-13 | Extra Budget | Set Budget to `300 €` and Extra Budget to `100%` | Effective Budget is `600 €` |
| TC-14 | Boundary | Set Effective Budget equal to the product price | Product remains within budget |
| TC-15 | Boundary | Set Effective Budget `€0.01` below the product price | Product is classified as out of budget |
| TC-16 | Budget validation | Re-test zero, negative, and empty budget states | All states behave consistently |
| TC-17 | Optimizer | Provide products with different utility levels | Low-value products are not added merely to consume remaining budget |
| TC-18 | Optimizer | Reduce budget below expensive tracked products | Generated plan never exceeds Effective Budget |
| TC-19 | Extra Budget | Set Budget to `20 €` and Extra Budget to `100%` | Effective Budget becomes `40 €` and affordability uses that value |
| TC-20 | Urgency | Increase a product's urgency from `3/5` to `5/5` | Priority and readiness respond accordingly |
| TC-21 | Weighting | Increase Urgency Importance while keeping other inputs fixed | Priority Score responds to the weight change |
| TC-22 | Persistence | Reload the extension application | Stored products, ratings, weights, budget, and list state persist |

### Manual Test Result

```text
22 / 22 test scenarios passed
```

All identified defects in the tested scenarios were corrected and re-tested.

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

For this reason, live wishlist counts and end-to-end import behavior remain manual regression checks.

Changes to the Skroutz DOM should be followed by re-running both the automated suite and the relevant manual scraper tests.