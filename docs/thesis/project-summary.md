# Project Summary

## Supporting Online Purchase Decisions

This project investigates the design and implementation of a browser-based decision-support application for online purchasing.

The implemented system is a Chrome Extension that operates alongside the Skroutz wishlist environment and assists users in transforming a collection of saved products into a structured and explainable purchase-prioritization process.

## Problem

Online wishlists are effective for storing products but provide limited assistance when users must decide:

- what should be purchased first;
- what fits within a specific budget;
- which items represent stronger value;
- which products are temporarily irrelevant;
- how multiple products can be combined into a realistic purchase plan.

A large wishlist therefore creates a prioritization problem rather than solving one.

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

Instead, it uses explicit rule-based mechanisms such as:

- weighted scoring;
- deterministic discount detection;
- budget-fit classification;
- relative value-for-money estimation;
- keyword-based product grouping;
- keyword-based seasonality classification;
- constrained purchase-plan optimization.

This makes the decision process transparent and reproducible.

## Implementation

The application is implemented as a Manifest V3 Chrome Extension using:

- JavaScript;
- HTML;
- CSS;
- Chrome Storage API;
- Chrome Tabs API;
- Chrome Scripting API;
- DOM extraction.

Product information is extracted from a currently open Skroutz Favorites page and processed locally by the extension.

## Decision-Support Output

The application presents:

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

The implementation was manually validated through functional and edge-case scenarios.

The validation covered areas including:

- correct wishlist import;
- rejection of unrelated DOM elements;
- out-of-stock detection;
- discount calculation;
- budget boundary handling;
- zero and negative budget behavior;
- Extra Budget calculations;
- optimizer budget safety;
- urgency sensitivity;
- weight sensitivity;
- persistence after reload.

The associated validation documentation is available in the repository's `tests/` directory.

## Result

The resulting application demonstrates how deterministic decision-support methods can extend a traditional online wishlist into an interactive purchase-prioritization system while retaining explainability and user control.
