
# Changelog

All notable changes to this project are documented in this file.

The project follows Semantic Versioning.

## [1.3.2] - 2026-08-20

### Added

- Explicit product availability states
- Robust monetary discount detection
- Discount inference from previous and current prices
- Product-card validation for Skroutz imports
- Budget edge-case handling
- Low-value inclusion threshold for purchase-plan optimization
- Improved Best Next Purchase selection
- Improved persistence and product merge handling

### Fixed

- Missing price incorrectly implying out-of-stock status
- False-positive imports from unrelated Skroutz page elements
- Monetary coupon discounts not affecting Discount Rating
- Zero-budget classification
- Negative-budget handling
- Empty-budget ambiguity
- Product boundary behavior around Effective Budget
- Optimizer tendency to add low-value products only because budget remained

### Validated

- Skroutz wishlist import using a 42-product test case
- Extraction without a hard-coded product-count limit
- Out-of-stock classification
- Discount detection
- Budget boundaries
- Extra Budget behavior
- Optimizer constraints
- Urgency sensitivity
- Weight sensitivity
- State persistence

The 42-product import was a representative validation case, not a restriction on the number of supported products. The scraper does not impose a fixed product-count limit and processes valid product cards found in the loaded Skroutz Favorites page.