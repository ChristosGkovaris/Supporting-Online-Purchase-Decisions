# Manual Test Results

## Summary

The current implementation was manually validated using the scenarios defined in `manual-test-plan.md`.

Final regression result:

```text
22 / 22 test scenarios passed
```

Several defects were identified during the validation process, corrected, and subsequently re-tested.

## Results

| ID | Result | Notes |
|---|---|---|
| TC-01 | PASS | Wishlist import completed successfully |
| TC-02 | PASS | Explicitly unavailable products correctly classified as out of stock |
| TC-03 | PASS | Availability separated from missing-price handling |
| TC-04 | PASS | False-positive page elements removed from scraper results |
| TC-05 | PASS | Imported prices matched observed product prices |
| TC-06 | PASS | No unintended product duplicates observed |
| TC-07 | PASS | Monetary coupon/old-price discount correctly produced approximately 15% and 2/5 |
| TC-08 | PASS | Zero-weight configuration remained stable |
| TC-09 | PASS after fix | Zero-budget behavior corrected |
| TC-10 | PASS after fix | Negative-budget handling corrected |
| TC-11 | PASS after fix | Empty budget treated as unset |
| TC-12 | PASS | Large-budget boundary handled correctly |
| TC-13 | PASS | 300 € + 100% Extra Budget produced 600 € Effective Budget |
| TC-14 | PASS | Product exactly equal to budget remained affordable |
| TC-15 | PASS | Product €0.01 above budget classified as out of budget |
| TC-16 | PASS | Budget edge cases passed regression testing |
| TC-17 | PASS | Optimizer excluded low-value additions |
| TC-18 | PASS | Purchase plan did not exceed the available budget |
| TC-19 | PASS | Extra Budget correctly changed affordability boundary |
| TC-20 | PASS | Increasing urgency increased relevant product metrics |
| TC-21 | PASS | Increased Urgency Importance affected Priority Score |
| TC-22 | PASS | Application state persisted after page refresh |

## Defects Identified During Validation

### Availability inferred from missing price

Earlier behavior risked treating a missing price as an out-of-stock product.

**Resolution:** Availability was separated from price parsing and explicit availability signals are used.

### Discount represented as monetary coupon

A product displaying:

```text
239.00 € → 203.15 € → -35.85 € coupon
```

was initially assigned a 1/5 Discount Rating.

**Resolution:** Discount analysis was extended to infer the percentage from monetary reductions and old/current prices.

### False-positive DOM imports

Non-product Skroutz interface elements were initially imported alongside wishlist products.

**Resolution:** Product-card validation was strengthened to require product-like structure and a valid Skroutz product link.

### Budget edge cases

Zero, negative, and empty budget values initially had ambiguous behavior.

**Resolution:** Budget-state handling was separated into valid zero, normalized negative input, and unset budget states.

### Optimizer budget consumption

The purchase optimizer could favor adding additional positive-utility products simply because budget remained available.

**Resolution:** A minimum inclusion threshold was introduced so that low-value products are not selected merely to consume budget.

## Final Status

The tested version satisfied the defined manual functional and boundary scenarios.

This validation does not claim exhaustive verification against every future Skroutz DOM structure. Since the extension relies on an external website, scraper behavior should be regression-tested whenever the external page structure changes.
