
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
tabs
scripting
```

It also requests host access to:

```text
https://www.skroutz.gr/*
https://skroutz.gr/*
```

The extension follows Manifest V3 and does not request the `unlimitedStorage` permission or unrestricted host access.

## Permission Rationale

### `storage`

Used to persist:

- imported products;
- urgency ratings;
- tracked product states;
- scoring weights;
- budget;
- Extra Budget percentage;
- custom lists;
- saved generic ideas.

The application uses `chrome.storage.local` to maintain this information between browser sessions.

### `tabs`

Used to locate an open Skroutz Favorites tab from which products can be imported.

The permission allows the extension to inspect tab metadata, including URLs and titles, when identifying the appropriate tab.

The application filters the available tabs and selects a matching Skroutz Favorites page for product extraction.

### `scripting`

Used as a fallback to inject the `wishlistScraper.js` content script into a Skroutz page when the expected message receiver is unavailable.

The injection targets the selected Skroutz tab and is limited by the extension's declared host permissions.

### Skroutz Host Permission

Required so that the content script can inspect the DOM of Skroutz pages used for product extraction.

The declared host patterns cover the HTTPS versions of `skroutz.gr` and `www.skroutz.gr`.

Although the content script can execute on pages matching these patterns, the import process specifically searches for an open Skroutz Favorites tab.

## Local Data Processing

Decision-support calculations are executed locally in the browser.

The current application does not transmit scoring preferences, wishlist state, budget values, or generated plans to an application-controlled server.

Product extraction, normalization, scoring, classification, and purchase-plan optimization are performed within the Chrome Extension environment.

The application uses local Chrome storage instead of an external database.

Product images may still be loaded from their original remote URLs, and opening Skroutz search links involves communication with the corresponding external website.

These browser requests are separate from the application's local decision-support calculations.

## Stored Information

The following categories may be stored locally:

- product titles;
- product URLs;
- product image URLs;
- product prices;
- availability state;
- raw product-card text;
- product import timestamps;
- urgency ratings;
- tracked product states;
- budget configuration;
- scoring weights;
- list membership;
- generic saved product ideas.

Imported product records may retain information extracted from the Skroutz page together with user-defined preferences.

The application does not maintain a separate remote database containing this information.

## Data Clearing

The user can use the application's `CLEAR` action to remove imported product data and reset product-list information handled by that operation.

The action:

- clears imported product records;
- removes saved generic product ideas;
- resets the list registry to the default `MY SMART PLAN` list;
- resets the active product view.

The `CLEAR` action does not remove the stored budget, Extra Budget percentage, or scoring weights.

These settings remain available for subsequent use.

Browser extension storage may also be removed by uninstalling the extension or clearing extension data through Chrome.

## DOM Safety

Scraped text is treated as external input.

Before product-controlled strings are inserted into generated HTML, the application uses the `escapeHtml()` function to escape HTML-sensitive characters.

The escaping process handles:

```text
&
<
>
"
'
```

This reduces the risk of interpreting scraped product text as executable markup.

The application also uses DOM text properties, such as `textContent`, where appropriate to display text without HTML interpretation.

HTML escaping is a protective measure and does not replace comprehensive input validation or security testing.

## Scope Restrictions

The content script is restricted by the manifest host patterns to Skroutz domains.

The application does not request host access to arbitrary websites or use unrestricted URL patterns such as `<all_urls>`.

Although the `tabs` permission provides visibility into browser tab metadata, the product extraction process targets Skroutz Favorites pages.

DOM access through the declared content script and scripting fallback remains restricted to the permitted hosts.

## Security Limitations

This is a client-side academic software project.

The extension depends on the correctness of the current Skroutz page structure and Chrome Extension APIs.

Changes to the external website may require maintenance of:

- DOM selectors;
- product-link rules;
- availability signals;
- price extraction.

Locally stored information is not additionally encrypted by the application.

The extension relies on the browser's storage mechanisms and the security of the user's local browser environment.

Because the `unlimitedStorage` permission is not requested, stored data remains subject to the standard `chrome.storage.local` storage quota.

The implementation includes basic input-handling and output-escaping protections but has not been established as a formally security-audited application.

## Third-Party Relationship

This project is an independent academic application.

It is not affiliated with, sponsored by, or endorsed by Skroutz.