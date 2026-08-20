# Automated Test Suite

These tests exercise the actual JavaScript logic in `src/content.js` and `src/popup.js` from Python.

They use Python's standard `unittest` framework and execute the JavaScript through Node.js, so no Python packages are required.

## Requirements

- Python 3.10+
- Node.js 18+ recommended

Check:

```powershell
python --version
node --version
```

## Run

From the repository root:

```powershell
python -m unittest discover -s tests -p "test_*.py" -v
```

Expected result:

```text
OK
```

## Automated coverage

- Manifest V3 and required permissions
- availability classification
- missing-price handling
- Greek/euro price parsing
- false-positive product-card rejection
- discount detection and rating thresholds
- zero-weight fallback
- zero, negative, empty, and Extra Budget behavior
- cent-level budget boundaries
- Budget Fit and budget adjustment thresholds
- VFM and category grouping
- seasonality
- Purchase Readiness special cases
- optimizer budget safety
- product re-import merge/persistence behavior

## Live integration limitation

A reproducible unit test cannot prove that a private/live Skroutz Favorites page currently contains exactly 42 products, because that depends on the authenticated account and Skroutz's live DOM. The suite tests the extraction/filtering rules themselves; the live 42-item count remains a manual regression check.
