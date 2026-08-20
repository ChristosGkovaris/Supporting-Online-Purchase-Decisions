# System Overview

## Purpose

Supporting Online Purchase Decisions is a client-side Chrome Extension that assists users in prioritizing products from a Skroutz wishlist.

The system combines product extraction, deterministic scoring, budget constraints, user preferences, and explainable purchase-plan generation.

No backend service, external database, artificial intelligence model, or machine-learning model is required.

## Main Components

### Content Script

`src/content.js`

Responsibilities:

- execute on Skroutz pages;
- identify valid product cards;
- reject unrelated navigation or account elements;
- extract product title;
- extract product URL;
- extract product image;
- extract and normalize product price;
- detect product availability;
- preserve raw product-card text;
- generate stable product identifiers;
- return extracted products to the extension application.

### Application Controller and Decision Engine

`src/popup.js`

Responsibilities:

- manage application state;
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

### User Interface

`src/popup.html`

Defines the structure of:

- extension launcher;
- sidebar;
- budget controls;
- scoring-weight controls;
- pre-made plan controls;
- seasonality controls;
- product views;
- Smart Plan panel.

`src/popup.css`

Defines the visual presentation of the application.

### Extension Configuration

`src/manifest.json`

Defines:

- Manifest V3 configuration;
- Chrome permissions;
- Skroutz host permissions;
- extension popup;
- content-script registration.

## Execution Model

The extension contains two separate JavaScript contexts.

### Skroutz Page Context

The content script executes against the currently loaded Skroutz page.

Its job is strictly concerned with extracting and normalizing product data.

### Extension Context

The extension application receives extracted data and performs all decision-support processing.

The decision engine does not modify the Skroutz page.

## High-Level Flow

```text
Skroutz Favorites Page
        │
        ▼
content.js
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
popup.js
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
popup.html + popup.css
        │
        ▼
User-facing decision support
```

## Design Principles

### Determinism

The same inputs and configuration produce the same scoring results.

### Explainability

Important decisions are accompanied by visible information such as:

- score breakdowns;
- detected discounts;
- Purchase Readiness;
- decision reasons;
- budget-impact warnings.

### Local-First Processing

Imported products and user preferences are stored through Chrome's local extension storage.

### Constraint Safety

Purchase plans are constrained by the effective budget.

### Separation of Concerns

DOM extraction is separated from decision-support processing.

## Current Scope

The system is intended as a decision-support tool rather than an automated purchasing system.

It does not:

- purchase products;
- submit orders;
- access banking information;
- provide financial advice;
- communicate with a remote application backend.
