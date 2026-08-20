# Project Summary

## Supporting Online Purchase Decisions

This project investigates the design and implementation of a browser-based decision-support application for online purchasing.

The implemented system is a Chrome Extension that operates alongside the Skroutz wishlist environment and assists users in transforming a collection of saved products into a structured and explainable purchase-prioritization process.

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

- import saved products;
- define a budget;
- optionally allow additional budget flexibility;
- rate product urgency;
- configure preference weights;
- inspect product-level scoring;
- filter products by seasonality;
- identify out-of-stock and out-of-budget items;
- create product lists;
- generate optimized purchase plans;
- receive explainable complementary suggestions.

## Design Approach

The system deliberately avoids artificial intelligence and machine learning.

Instead, it uses explicit rule-based mechanisms, including:

- weighted scoring;
- deterministic discount detection;
- budget-fit classification;
- relative value-for-money estimation;
- keyword-based product grouping;
- keyword-based seasonality classification;
- constrained purchase-plan optimization.

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

Product information is extracted from an open Skroutz Favorites page and processed locally by the extension.

## Decision-Support Output

The application provides:

- Priority Score;
- Budget Fit;
- Urgency;
- Discount Rating;
- Value for Money;
- Purchase Readiness;
- explanatory tags;
- budget-impact warnings;
- Best Next Purchase;
- optimized purchase plans;
- remaining budget;
- complementary product suggestions.

## Validation

The implementation was validated through both automated testing and manual regression testing.

The automated test suite covers deterministic application logic, including:

- availability detection;
- price parsing;
- discount calculation;
- budget handling;
- scoring behavior;
- product grouping;
- seasonality;
- Purchase Readiness;
- purchase-plan optimization;
- persistence and product re-import behavior.

Manual validation was used for browser-level and live Skroutz integration scenarios, including:

- wishlist product import;
- rejection of unrelated DOM elements;
- live product-count verification;
- out-of-stock classification;
- budget-boundary behavior;
- Extra Budget behavior;
- urgency and weight sensitivity;
- state persistence after reload.

The associated validation documentation is available in the repository's `tests/` directory.

## Result

The resulting application demonstrates how deterministic decision-support methods can extend a conventional online wishlist into an interactive purchase-prioritization system while preserving explainability, budget awareness, and user control.