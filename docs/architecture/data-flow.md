
# Data Flow

## Overview

The application follows a local data pipeline from the Skroutz Favorites page to the Chrome Extension interface.

```text
Skroutz DOM
   │
   ▼
Candidate Product Cards
   │
   ▼
Card Validation
   │
   ▼
Product Extraction
   │
   ▼
Normalization
   │
   ▼
Message Response
   │
   ▼
Product Merge
   │
   ▼
Chrome Local Storage
   │
   ▼
Scoring and Classification
   │
   ▼
Budget-Constrained Planning
   │
   ▼
Rendered Decision Support
```

## 1. Product Discovery

The content script searches the main page region for elements that may represent saved products.

Candidate elements are validated before extraction.

A valid product card must contain product-like information including:

- usable text;
- an image;
- a valid Skroutz product link.

The scraper also removes duplicate candidate elements using their product links.

This validation reduces the risk of unrelated navigation, account, and footer elements being imported as products.

## 2. Product Extraction

For each valid product card, the scraper extracts or initializes the following fields:

```text
id
title
price
image
url
source
rawText
availability
urgencyScore
urgencyScoreSource
ratingScale
importedAt
```

The initial Urgency Rating is set to 3 on a 1–5 scale.

The raw product text is retained for subsequent discount analysis, availability processing, and seasonality detection.

## 3. Price Processing

Euro-denominated price candidates are extracted from the card.

The parser normalizes common European number formats such as:

```text
203,15 €
203.15 €
1.203,15 €
```

Auxiliary monetary values such as shipping or installment amounts are excluded where identifiable.

When multiple valid price candidates are detected, the parser selects the lowest positive candidate.

Discount percentages, previous prices, and coupon amounts are analyzed separately during scoring using the extracted product information.

Monetary values are later converted to integer cents for budget comparisons and purchase-plan calculations.

## 4. Availability Processing

Availability is not inferred exclusively from price.

Explicit text signals such as an unavailable or out-of-stock message take precedence over price-based inference.

Possible states are:

```text
available
out-of-stock
unknown
```

A positive parsed price normally indicates availability unless an explicit unavailability signal is detected.

When a product is explicitly classified as out of stock, its extracted price is set to zero.

A missing price without an explicit availability signal results in an unknown availability state.

This avoids treating every missing price as an out-of-stock product.

## 5. Import Message

The extension locates an open Skroutz Favorites tab and sends an extraction request to the content script through Chrome message passing.

The request uses the following message type:

```text
EXTRACT_SKROUTZ_PRODUCTS
```

The content script returns the extracted product array to the extension.

If the initial message fails, the extension attempts to inject the content script and repeat the extraction request.

## 6. Merge and Persistence

Newly extracted products are merged with existing locally stored products.

Product identity is determined primarily through normalized product URLs, with normalized titles used as a fallback.

URL normalization removes query parameters, fragments, and trailing slashes to reduce duplicate imports.

The merge process preserves user-specific state where applicable, including:

- user-assigned urgency rating;
- tracked state;
- selected list.

Existing user-assigned urgency ratings are preserved and normalized to the current 1–5 scale where necessary.

Products without a user-assigned urgency rating retain the default rating of 3.

The application uses Chrome local storage for persistence.

## 7. Scoring

Each imported product is processed by the scoring engine.

Calculated information includes:

- Urgency Rating;
- Discount Rating;
- Budget Fit;
- Value for Money;
- weighted base score;
- budget adjustment;
- final Priority Score;
- Purchase Readiness;
- explanatory tags.

The weighted base score combines Urgency Rating and Discount Rating using user-defined weights.

Budget Fit and Value for Money are calculated separately as supporting decision indicators.

A budget-dependent adjustment is applied to the weighted base score to produce the final Priority Score on a 1–5 scale.

Products with unavailable prices or explicit out-of-stock status receive a minimum Priority Score.

Purchase Readiness is calculated separately using priority, budget compatibility, value for money, seasonality, and availability.

The scoring process is deterministic and does not rely on AI or machine learning.

## 8. Filtering

Products may then be displayed through views including:

```text
ALL THE PRODUCTS
OUT OF STOCK
OUT OF BUDGET
MY SMART PLAN
custom lists
```

The default product view excludes products without a positive price and, when a budget is defined, products exceeding the effective budget.

The OUT OF STOCK view displays products explicitly classified as unavailable.

The OUT OF BUDGET view displays priced products exceeding the effective budget when a budget is defined.

Custom list views display tracked products assigned to the corresponding list.

Seasonality filtering is applied independently to the displayed product views using rule-based keyword detection.

The seasonality filter does not directly remove products from purchase-plan optimization.

## 9. Purchase Planning

Tracked products belonging to the active list are processed by the purchase-plan engine when a valid budget is defined.

The effective budget combines the base budget with the selected Extra Budget percentage.

The engine:

1. excludes products without a valid positive price and options exceeding the effective budget;
2. respects the effective budget as a hard constraint;
3. groups products into rule-based product categories;
4. calculates plan utility according to the selected purchase strategy;
5. searches candidate combinations with at most one product per detected category;
6. removes dominated states and candidates below the minimum utility threshold;
7. selects the highest-utility valid result, preferring lower cost when utility is equal.

The optimizer operates on integer-cent monetary values to avoid floating-point errors in budget comparisons.

The minimum utility threshold prevents the optimizer from adding low-value products merely to use the remaining budget.

The resulting plan contains the selected products, total purchase cost, and remaining budget.

## 10. Recommendation Output

The final interface may expose:

- Best Next Purchase;
- Useful Decision Tips;
- optimized purchase plan;
- remaining budget;
- budget-impact warnings;
- wishlist product suggestions;
- generic complementary product ideas.

The Best Next Purchase is selected from the optimized plan according to the active purchase strategy.

Wishlist suggestions are derived from imported products, while generic complementary ideas are generated from predefined rule-based categories.

Recommendation output depends on the active list, available products, selected purchase strategy, and remaining budget.

## Persistence

State persisted in Chrome local storage includes:

- products;
- weights;
- budget;
- Extra Budget percentage;
- list registry;
- generic ideas.

Stored product records also retain user-specific information such as urgency ratings, tracked states, and assigned lists.

A page refresh therefore does not normally reset the user's stored decision-support configuration.

The active seasonality filter and current purchase-strategy selection are interface state and are not persisted as separate storage settings.