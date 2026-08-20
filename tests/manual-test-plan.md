# Manual Test Plan

## Purpose

This document defines the manual functional validation plan for the Supporting Online Purchase Decisions Chrome Extension.

## Test Environment

- Browser: Google Chrome
- Extension model: Manifest V3
- Installation: unpacked extension
- Data source: Skroutz Favorites page
- Test method: manual functional and boundary testing

## Test Cases

| ID | Area | Test | Expected Result |
|---|---|---|---|
| TC-01 | Import | Import products from an open Skroutz Favorites page | All valid wishlist products are imported |
| TC-02 | Availability | Import an explicitly unavailable product | Product appears in OUT OF STOCK |
| TC-03 | Availability | Product without an out-of-stock signal | Missing price alone must not automatically imply out of stock |
| TC-04 | Scraper | Compare imported count with actual Favorites count | Non-product DOM elements are rejected |
| TC-05 | Price | Compare imported prices with Skroutz | Product prices are extracted correctly |
| TC-06 | Deduplication | Inspect imported product list | No unintended duplicate product entries |
| TC-07 | Discount | Import product with old price/current price/coupon | Correct discount percentage and score are derived |
| TC-08 | Weights | Set both user weights to zero | Application remains stable and uses safe fallback behavior |
| TC-09 | Budget | Set Budget to 0 | Effective Budget is 0 and positive-price products are out of budget |
| TC-10 | Budget | Enter negative budget | Value is normalized/rejected rather than used as a negative budget |
| TC-11 | Budget | Leave budget empty | Application treats budget as not set |
| TC-12 | Budget | Enter very large budget | No valid product is incorrectly classified as out of budget |
| TC-13 | Extra Budget | Budget 300 €, Extra Budget 100% | Effective Budget is 600 € |
| TC-14 | Boundary | Product price exactly equals Effective Budget | Product is not out of budget |
| TC-15 | Boundary | Product price is €0.01 above Effective Budget | Product is out of budget |
| TC-16 | Budget validation | Re-test zero, negative, and empty budget after fixes | All three cases behave consistently |
| TC-17 | Optimizer | Add products with different priority levels | Optimizer does not add low-value products merely to consume budget |
| TC-18 | Optimizer | Reduce budget below expensive tracked products | Generated plan never exceeds Effective Budget |
| TC-19 | Extra Budget | Use base budget 20 € with 100% Extra Budget | Effective Budget becomes 40 € and affordability uses 40 € |
| TC-20 | Urgency | Increase one product's urgency from 3/5 to 5/5 | Priority and readiness react in the expected direction |
| TC-21 | Weighting | Increase Urgency Importance while keeping other inputs fixed | Product priority reacts to the weight change |
| TC-22 | Persistence | Refresh the extension application | Stored budget, weights, ratings, products, and list state persist |

## Pass Criteria

A test is considered passed when:

1. the observed application state matches the expected result;
2. no JavaScript error prevents operation;
3. no invalid budget or availability state bypasses the intended decision rules;
4. displayed explanations remain consistent with the underlying state.

## Regression Areas

After modifying the scraper, scoring engine, or budget model, the following tests should be repeated at minimum:

```text
TC-01
TC-02
TC-04
TC-07
TC-09
TC-14
TC-15
TC-17
TC-18
TC-22
```