# Privacy and Security

## Overview

Supporting Online Purchase Decisions is designed as a local-first Chrome Extension.

The current implementation does not require:

- user registration;
- a remote backend;
- a cloud database;
- payment information;
- banking credentials;
- external analytics services.

## Chrome Permissions

The extension currently requests:

```text
storage
unlimitedStorage
tabs
scripting
```

It also requests host access to:

```text
https://www.skroutz.gr/*
https://skroutz.gr/*
```

## Permission Rationale

### `storage`

Used to persist:

- imported products;
- urgency ratings;
- scoring weights;
- budget;
- Extra Budget percentage;
- custom lists;
- saved generic ideas.

### `unlimitedStorage`

Allows the extension to maintain locally imported wishlist state without relying on the default small storage quota.

### `tabs`

Used to locate an open Skroutz tab from which products can be imported.

### `scripting`

Used as a fallback to inject the content script into a Skroutz page when the expected message receiver is unavailable.

### Skroutz Host Permission

Required so that the content script can inspect the DOM of Skroutz pages used for product extraction.

## Local Data Processing

Decision-support calculations are executed locally in the browser.

The current application does not transmit scoring preferences, wishlist state, budget values, or generated plans to an application-controlled server.

## Stored Information

The following categories may be stored locally:

- product titles;
- product URLs;
- product images;
- product prices;
- availability state;
- raw product-card text;
- urgency ratings;
- budget configuration;
- scoring weights;
- list membership;
- generic saved product ideas.

## Data Clearing

The user can use the application's `CLEAR` action to remove imported product data and reset product-list information handled by that operation.

Browser extension storage may also be removed by uninstalling the extension or clearing extension data through Chrome.

## DOM Safety

Scraped text is treated as external input.

Before product-controlled strings are inserted into generated HTML, the application escapes HTML-sensitive characters.

This reduces the risk of interpreting scraped product text as executable markup.

## Scope Restrictions

The content script is restricted by the manifest host patterns to Skroutz domains.

The application does not require access to arbitrary websites.

## Security Limitations

This is a client-side academic software project.

The extension depends on the correctness of the current Skroutz page structure and Chrome Extension APIs.

Changes to the external website may require maintenance of:

- DOM selectors;
- product-link rules;
- availability signals;
- price extraction.

## Third-Party Relationship

This project is an independent academic application.

It is not affiliated with, sponsored by, or endorsed by Skroutz.
