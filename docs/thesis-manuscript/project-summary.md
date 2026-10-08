
# Project Summary

## Supporting Online Purchase Decisions

This project investigates the design and implementation of a browser-based decision-support application for online purchasing.

The implemented system is a Chrome Extension that operates alongside the Skroutz wishlist environment and assists users in transforming a collection of saved products into a structured and explainable purchase-prioritization process.

The application operates locally without requiring a backend service or external database.

## Problem

Online wishlists are effective for storing products but provide limited support when users must decide:

- what should be purchased first;
- what fits within a specific budget;
- which items offer stronger value;
- which products are temporarily less relevant;
- how multiple products can be combined into a realistic purchase plan.

As the number of saved products increases, the wishlist itself can become a prioritization problem.

## Proposed Solution

The extension introduces a deterministic decision-support layer over wishlist data.

The user can:

- import saved products from Skroutz Favorites;
- define a base budget;
- optionally allow additional budget flexibility;
- rate product urgency on a 1–5 scale;
- configure urgency and discount preference weights;
- inspect product-level scoring and explanations;
- filter products by seasonality;
- identify out-of-stock and out-of-budget items;
- create and manage custom product lists;
- select predefined purchase strategies;
- generate optimized purchase plans;
- receive explainable wishlist and complementary product suggestions.

The application also preserves user-defined ratings, tracked product states, and list assignments when existing products are re-imported.

## Design Approach

The system deliberately avoids artificial intelligence and machine learning.

Instead, it uses explicit rule-based mechanisms, including:

- weighted scoring;
- deterministic discount detection;
- budget-fit classification;
- budget-impact adjustments;
- relative value-for-money estimation;
- keyword-based product grouping;
- keyword-based seasonality classification;
- constrained purchase-plan optimization;
- rule-based recommendation generation.

Product prioritization is based primarily on user-defined urgency and discount weights, with additional budget-dependent adjustments.

The effective budget is calculated from the base budget and the selected Extra Budget percentage.

Purchase-plan optimization respects this budget as a hard constraint and applies category-diversity rules and a minimum utility threshold to avoid selecting low-value products solely to consume the remaining budget.

Value for Money is estimated relative to imported products in the same detected group rather than through external market-price or product-quality analysis.

This approach keeps the decision process transparent, reproducible, and directly interpretable by the user.

## Implementation

The application is implemented as a Manifest V3 Chrome Extension using:

- JavaScript;
- HTML;
- CSS;
- Chrome Storage API;
- Chrome Tabs API;
- Chrome Scripting API;
- DOM-based product extraction.

The content script, `wishlistScraper.js`, extracts product information from an open Skroutz Favorites page.

The application controller, `decisionLogic.js`, manages product persistence, scoring, budgeting, classification, purchase-plan optimization, and recommendation generation.

The interface is implemented through `dashboard.html` and `dashboard.css`.

The extension uses a popup launcher that opens the main decision-support application in a dedicated browser tab.

Extracted products and user preferences are stored through `chrome.storage.local`.

Monetary comparisons are performed using integer-cent values to reduce floating-point precision errors.

Product information is processed locally by the extension without requiring a remote application backend.

## Decision-Support Output

The application provides:

- Priority Score;
- Budget Fit;
- Urgency Rating;
- Discount Rating;
- Value for Money;
- Purchase Readiness;
- explanatory tags and score breakdowns;
- budget-impact warnings;
- Best Next Purchase;
- optimized purchase plans;
- total purchase cost;
- remaining budget;
- wishlist product suggestions;
- generic complementary product ideas.

Purchase Readiness is presented as a percentage-based indicator that combines product priority, budget compatibility, relative value, seasonality, and availability.

The application also provides multiple purchase strategies, including My Smart Plan, Budget Plan, Premium Plan, and Deal Hunter Plan.

The generated recommendations are based on explicit deterministic rules rather than predictive AI models.

## Validation

The implementation was validated through both automated testing and manual browser-level regression checks.

The automated test suite uses Python's `unittest` framework and a Node.js test harness to execute and validate the application's JavaScript logic.

The automated tests cover deterministic application behavior, including:

- extension configuration;
- availability detection;
- price parsing;
- discount calculation;
- budget handling;
- scoring behavior;
- product grouping;
- seasonality;
- Purchase Readiness;
- purchase-plan optimization;
- product identity and duplicate prevention;
- product re-import and preservation of user-specific state;
- integer-cent monetary calculations.

Additional automated checks examine selected code-quality constraints and required extension files.

Manual validation was used for browser-level and live Skroutz integration scenarios, including:

- wishlist product import;
- rejection of unrelated DOM elements;
- live product-count verification;
- out-of-stock classification;
- budget-boundary behavior;
- Extra Budget behavior;
- urgency and weight sensitivity;
- purchase-plan budget compliance;
- state persistence after reload.

The automated tests use mocked browser interfaces and do not reproduce the complete live Skroutz environment.

The associated automated validation documentation and test implementation are available in the repository's `tests/` directory.

The test suite can be executed from the repository root using:

```text
python scripts/run_tests.py
```

## Result

The resulting application demonstrates how deterministic decision-support methods can extend a conventional online wishlist into an interactive purchase-prioritization system while preserving explainability, budget awareness, and user control.

The implemented system integrates product extraction, configurable scoring, local persistence, budget-constrained optimization, and explainable recommendations within a single Chrome Extension.

The project provides a functional implementation of rule-based online purchase decision support. Its validation establishes tested functional behavior but does not constitute a formal user study measuring improvements in purchasing decisions.