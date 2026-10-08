
# System Overview

## Purpose

Supporting Online Purchase Decisions is a client-side Chrome Extension that assists users in prioritizing products from a Skroutz wishlist.

The system combines product extraction, deterministic scoring, budget constraints, user preferences, and explainable purchase-plan generation.

No backend service, external database, artificial intelligence model, or machine-learning model is required.

## Main Components

### Content Script

`src/wishlistScraper.js`

Responsibilities:

- execute on supported Skroutz pages;
- identify valid product cards;
- reject unrelated navigation or account elements;
- remove duplicate product-card candidates;
- extract product title;
- extract product URL;
- extract product image;
- extract and normalize product price;
- detect product availability;
- preserve raw product-card text;
- generate deterministic product identifiers;
- return extracted products to the extension application.

The content script responds to extraction requests through Chrome message passing.

### Application Controller and Decision Engine

`src/decisionLogic.js`

Responsibilities:

- manage the popup launcher and full-tab application;
- locate an open Skroutz Favorites tab;
- request product extraction through Chrome message passing;
- manage application state;
- merge imported products and prevent duplicates;
- store and retrieve products;
- manage budgets;
- manage Extra Budget configuration;
- maintain urgency ratings;
- maintain scoring weights;
- calculate product scores;
- detect discounts;
- estimate value for money;
- classify seasonality;
- classify product groups;
- generate explanations;
- calculate Purchase Readiness;
- generate Best Next Purchase;
- optimize purchase plans;
- manage custom lists;
- generate complementary product suggestions.

The controller uses `chrome.storage.local` to persist products, user preferences, and application configuration.

### User Interface

`src/dashboard.html`

Defines the structure of:

- extension launcher;
- full-tab application;
- sidebar;
- budget controls;
- scoring-weight controls;
- pre-made plan controls;
- seasonality controls;
- product views;
- Smart Plan panel.

The same HTML file supports two display modes.

The extension popup initially displays a launcher containing the `OPEN APP` button.

Selecting this button opens the full application in a separate browser tab using `dashboard.html?tab=true`.

`src/dashboard.css`

Defines the visual presentation of the launcher and full-tab application.

The stylesheet includes the layout, product cards, sidebar, controls, responsive behavior, and decision-support indicators.

### Extension Configuration

`src/manifest.json`

Defines:

- Manifest V3 configuration;
- Chrome permissions;
- Skroutz host permissions;
- extension popup;
- content-script registration.

The extension requests the `storage`, `tabs`, and `scripting` permissions.

Host permissions are limited to the declared Skroutz HTTPS domains.

The manifest registers `dashboard.html` as the default popup and `wishlistScraper.js` as the content script.

## Execution Model

The extension uses two primary JavaScript execution contexts.

### Skroutz Page Context

The content script executes in Chrome's isolated content-script environment on supported Skroutz pages.

It can inspect the DOM of the currently loaded page without executing as part of the website's own JavaScript environment.

When an extraction request is received, the content script identifies valid product cards and extracts their information.

Its job is strictly concerned with extracting and normalizing product data.

The content script does not calculate product priority scores or generate purchase plans.

### Extension Context

The extension application executes within its own browser extension pages.

The popup acts as a launcher, while the full-tab application provides the decision-support interface.

Both modes use `dashboard.html` and `decisionLogic.js`.

The full-tab application searches for an open Skroutz Favorites tab and requests product extraction through Chrome message passing.

If the expected content-script message receiver is unavailable, the application attempts to inject `wishlistScraper.js` into the selected tab and repeat the request.

The extension application receives extracted data, merges the imported products with existing records, and performs all decision-support processing.

The decision engine does not modify the Skroutz page.

## High-Level Flow

```text
Skroutz Favorites Page
        │
        ▼
wishlistScraper.js
        │
        ├── Product-card validation
        ├── Price extraction
        ├── Availability detection
        └── Product normalization
        │
        ▼
Chrome message passing
        │
        ▼
decisionLogic.js
        │
        ├── Product merge
        ├── Chrome local storage
        ├── Scoring
        ├── Budget analysis
        ├── Classification
        ├── Purchase planning
        └── Recommendations
        │
        ▼
dashboard.html + dashboard.css
        │
        ▼
User-facing decision support
```

The extraction process is initiated by the user through the full-tab application's `IMPORT ITEMS` action.

The extracted products are returned to the application through Chrome message passing.

The application then updates the locally stored products and renders the corresponding decision-support results.

## Design Principles

### Determinism

The same inputs and configuration produce the same scoring results.

The application uses predefined rules, weighted calculations, and explicit thresholds rather than AI or machine-learning predictions.

### Explainability

Important decisions are accompanied by visible information such as:

- score breakdowns;
- detected discounts;
- Purchase Readiness;
- decision reasons;
- budget-impact warnings;
- purchase-plan explanations.

These indicators help users understand the factors influencing product prioritization and purchase recommendations.

### Local-First Processing

Imported products and user preferences are stored through Chrome's local extension storage.

Product scoring, classification, and purchase-plan optimization are performed locally without an application-controlled backend.

### Constraint Safety

Purchase plans are constrained by the effective budget.

The effective budget combines the base budget with the selected Extra Budget percentage.

Monetary comparisons use integer-cent values to reduce floating-point precision errors.

The optimizer prevents multiple products from the same detected category from being selected in a generated plan.

A minimum utility threshold prevents low-value products from being included solely to consume the remaining budget.

### Separation of Concerns

DOM extraction is separated from decision-support processing.

The content script handles product discovery and extraction.

The extension application handles persistence, scoring, classification, optimization, and interface rendering.

This separation allows the extraction and decision-support logic to be maintained independently.

## Current Scope

The system is intended as a decision-support tool rather than an automated purchasing system.

It does not:

- purchase products;
- submit orders;
- access banking information;
- provide financial advice;
- communicate with a remote application backend.

The current implementation supports product extraction from Skroutz Favorites pages.

It does not provide automatic synchronization with external shopping services or continuous background price monitoring.

The application relies on the current structure of Skroutz pages, and changes to the website may require updates to the extraction logic.