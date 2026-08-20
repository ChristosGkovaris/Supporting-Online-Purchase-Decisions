# Supporting Online Purchase Decisions

A Chrome Extension for importing Skroutz wishlist products and supporting budget-aware purchase prioritization through deterministic scoring, purchase planning, and explainable decision-support features.

## Overview

Supporting Online Purchase Decisions is a Manifest V3 Chrome Extension designed to help users evaluate and prioritize products saved in their Skroutz wishlist.

The application imports wishlist products directly from an open Skroutz Favorites page and evaluates them using deterministic, rule-based decision-support logic.

The system does not use artificial intelligence or machine learning. Product recommendations, prioritization, budget evaluation, seasonality classification, and purchase-plan generation are based on explicit scoring rules and user-defined preferences.

## Features

- Import products from a Skroutz Favorites page
- Automatic product price extraction
- Explicit out-of-stock detection
- Discount detection from percentages, previous prices, and monetary coupon values
- User-defined urgency ratings on a 1–5 scale
- Configurable urgency and discount importance weights
- Base budget and optional extra-budget allowance
- Effective-budget calculation
- Out-of-budget classification
- Seasonality filtering
- Deterministic product-category detection
- Value-for-money estimation within detected product groups
- Purchase Readiness percentage and labels
- Best Next Purchase recommendation
- Budget-constrained purchase-plan optimization
- Budget, Premium, and Deal Hunter plan presets
- Custom saved product lists
- Generic complementary product suggestions
- Persistent local user preferences and lists
- Explainable score breakdowns and budget-impact warnings

## How It Works

The extension follows four main stages:

1. **Product extraction**  
   A content script inspects the open Skroutz Favorites page and extracts valid product cards.

2. **Data normalization**  
   Product titles, URLs, prices, availability information, images, and raw card text are normalized before being stored.

3. **Decision scoring**  
   Products are evaluated using urgency, detected discount, budget fit, value for money, and budget-impact rules.

4. **Purchase planning**  
   Products selected by the user can be processed by a budget-constrained optimizer that chooses worthwhile products without exceeding the effective budget.

## Architecture

The application consists of two main JavaScript execution contexts:

- `content.js` — runs on Skroutz pages and extracts product information from the DOM.
- `popup.js` — manages storage, scoring, budgeting, purchase-plan generation, filtering, suggestions, and application state.

The interface is implemented with:

- `popup.html`
- `popup.css`

The extension configuration is defined in:

- `manifest.json`

Detailed architecture documentation is available in [`docs/architecture`](docs/architecture/).

## Scoring Model

The application uses a deterministic 1–5 rating system.

The user controls two primary preference weights:

- **Urgency Importance**
- **Discount Importance**

The weighted preference score is calculated as:

```text
Weighted Preference Score =
(Urgency Rating × Urgency Weight +
 Discount Rating × Discount Weight)
/
(Urgency Weight + Discount Weight)
```

A budget-impact adjustment is then applied to produce the final priority score.

Additional metrics such as Budget Fit and Value for Money are shown separately to improve explainability and are also used by specific purchase-plan strategies.

See [`docs/architecture/scoring-engine.md`](docs/architecture/scoring-engine.md) for details.

## Budget Model

Users define:

- a base budget;
- an optional Extra Budget percentage.

Available Extra Budget options are:

```text
0%, 10%, 30%, 50%, 100%
```

The effective budget is:

```text
Effective Budget =
Base Budget × (1 + Extra Budget / 100)
```

Monetary comparisons are performed using integer cents to reduce floating-point boundary errors.

## Purchase Plans

The extension provides:

### My Smart Plan

Uses the current user-defined urgency and discount weights.

### Budget Plan

Prioritizes budget fit, product priority, and value for money.

### Premium Plan

Favors relatively higher-priced products inside each product group while still respecting the available budget.

### Deal Hunter Plan

Prioritizes verified discount strength and product priority.

The optimizer respects the effective-budget constraint and avoids adding low-value products only to consume unused budget.

## Installation

This project is currently installed as an unpacked Chrome Extension.

1. Clone the repository:

```bash
git clone https://github.com/<YOUR-GITHUB-USERNAME>/Supporting-Online-Purchase-Decisions.git
```

2. Open Chrome and navigate to:

```text
chrome://extensions
```

3. Enable **Developer mode**.

4. Select **Load unpacked**.

5. Select the repository's:

```text
src/
```

directory.

6. Open a Skroutz Favorites page.

7. Open the extension and select **OPEN APP**.

8. Select **IMPORT ITEMS**.

## Usage

1. Open your Skroutz Favorites page.
2. Import wishlist items into the extension.
3. Enter a budget.
4. Optionally select an Extra Budget percentage.
5. Adjust urgency ratings for individual products.
6. Configure urgency and discount importance.
7. Review Priority Score and Purchase Readiness.
8. Add products to `MY SMART PLAN` or another custom list.
9. Review the generated purchase plan.
10. Use seasonality, out-of-stock, and out-of-budget views when needed.

## Data Storage

Application state is stored locally through the Chrome Storage API.

Stored data includes:

- imported product information;
- urgency ratings;
- scoring weights;
- budget configuration;
- Extra Budget configuration;
- user-created lists;
- saved generic product ideas.

The current implementation does not require a backend server or external database.

## Privacy

The extension requires access to Skroutz pages so that the content script can inspect the currently loaded Favorites page.

Product and preference data are processed locally by the extension.

See [`docs/architecture/privacy-and-security.md`](docs/architecture/privacy-and-security.md).

## Testing

The application has been manually validated against functional and edge-case scenarios covering:

- product extraction;
- false-positive DOM filtering;
- out-of-stock detection;
- discount detection;
- budget boundaries;
- zero and negative budgets;
- Extra Budget calculations;
- optimizer constraints;
- urgency sensitivity;
- weight sensitivity;
- state persistence.

See:

- [`tests/README.md`](tests/README.md)

![Tests](https://github.com/ChristosGkovaris/Supporting-Online-Purchase-Decisions/actions/workflows/tests.yml/badge.svg)

## Project Structure

```text
Supporting-Online-Purchase-Decisions/
│
├── src/
│   ├── content.js
│   ├── manifest.json
│   ├── popup.css
│   ├── popup.html
│   └── popup.js
│
├── docs/
│   ├── architecture/
│   │   ├── data-flow.md
│   │   ├── privacy-and-security.md
│   │   ├── scoring-engine.md
│   │   └── system-overview.md
│   │
│   ├── screenshots/
│   │
│   └── thesis/
│       └── project-summary.md
│
├── tests/
│   ├── manual-test-plan.md
│   └── test-results.md
│
├── .gitattributes
├── .gitignore
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## Technology Stack

- JavaScript
- HTML5
- CSS3
- Chrome Extensions Manifest V3
- Chrome Storage API
- Chrome Tabs API
- Chrome Scripting API
- DOM-based data extraction

## Academic Context

This repository contains the software implementation of an academic project focused on supporting online purchase decisions through explainable, deterministic decision-support techniques.

The application explores wishlist prioritization, budget-aware planning, product scoring, and consumer decision support without relying on artificial intelligence or machine learning.

## Limitations

- Product extraction depends on the current DOM structure of Skroutz and may require maintenance if the website changes.
- Product categories and seasonality are inferred through deterministic keyword rules.
- Value-for-money estimation is relative to other imported products in the detected group.
- Generic product suggestions do not assume or fabricate live Skroutz prices.
- The extension is not affiliated with or endorsed by Skroutz.

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE) for details.