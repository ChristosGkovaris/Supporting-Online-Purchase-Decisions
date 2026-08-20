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

This validation prevents unrelated navigation, account, and footer elements from being imported as products.

## 2. Product Extraction

For each valid product card, the scraper attempts to extract:

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

## 3. Price Processing

Euro-denominated price candidates are extracted from the card.

The parser normalizes common European number formats such as:

```text
203,15 €
203.15 €
1.203,15 €
```

Auxiliary monetary values such as shipping or installment amounts are excluded where identifiable.

Monetary values are later converted to integer cents for budget comparisons.

## 4. Availability Processing

Availability is not inferred exclusively from price.

Explicit text signals such as an unavailable or out-of-stock message are used to classify the product.

Possible states are:

```text
available
out-of-stock
unknown
```

This avoids treating every missing price as an out-of-stock product.

## 5. Import Message

The content script returns the extracted product array to the extension through Chrome message passing.

## 6. Merge and Persistence

Newly extracted products are merged with existing locally stored products.

The merge process preserves user-specific state where applicable, including:

- urgency rating;
- tracked state;
- selected list.

The application uses Chrome local storage for persistence.

## 7. Scoring

Each valid product is processed by the scoring engine.

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

## 8. Filtering

Products may then be displayed through views including:

```text
ALL THE PRODUCTS
OUT OF STOCK
OUT OF BUDGET
MY SMART PLAN
custom lists
```

Seasonality filtering is applied independently.

## 9. Purchase Planning

Tracked products belonging to the active list are processed by the purchase-plan engine.

The engine:

1. removes invalid or unavailable options;
2. respects the effective budget;
3. groups products into product categories;
4. calculates plan utility;
5. searches candidate combinations;
6. removes dominated states;
7. selects the highest-utility valid result.

## 10. Recommendation Output

The final interface may expose:

- Best Next Purchase;
- Useful Decision Tips;
- optimized purchase plan;
- remaining budget;
- budget-impact warnings;
- wishlist product suggestions;
- generic complementary product ideas.

## Persistence

State persisted in Chrome local storage includes:

- products;
- weights;
- budget;
- Extra Budget percentage;
- list registry;
- generic ideas.

A page refresh therefore does not normally reset the user's decision-support configuration.
