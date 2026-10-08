
# Scoring Engine

## Overview

The scoring engine is deterministic and rule based.

Products use a 1–5 rating scale.

The main user-controlled preference dimensions are:

- Urgency
- Discount

Additional decision-support dimensions include:

- Budget Fit
- Value for Money
- Budget Impact
- Availability
- Seasonality

Urgency and Discount determine the weighted base score.

Budget Impact adjusts the final Priority Score, while Budget Fit, Value for Money, Availability, and Seasonality support additional decision indicators and purchase planning.

The scoring process does not use AI or machine learning.

## Urgency Rating

Each product has an urgency rating between:

```text
1 and 5
```

The default urgency value is:

```text
3
```

The user may modify the value directly through the interface.

User-assigned urgency ratings are preserved when products are re-imported.

## Preference Weights

The user controls:

```text
Urgency Importance: 0–5
Discount Importance: 0–5
```

The default preference weights are:

```text
Urgency Importance: 4
Discount Importance: 3
```

The weighted preference score is:

```text
Base Score =
(Urgency × Urgency Weight +
 Discount × Discount Weight)
/
(Urgency Weight + Discount Weight)
```

Only criteria with positive weights participate in the weighted average.

If all participating weights are zero, a neutral fallback value of 3 is used.

The resulting base score is constrained to the 1–5 rating scale.

## Discount Rating

Discounts may be detected from:

- an explicit percentage;
- an explicit monetary reduction;
- an old price and current price.

Explicit percentages take precedence over inferred discounts.

When an explicit monetary reduction is detected, the original price is estimated by adding the reduction to the current price.

If neither is available, the engine attempts to infer a discount from a higher previous price.

For example:

```text
Original price: 239.00 €
Current price: 203.15 €

Discount =
(239.00 - 203.15) / 239.00 × 100
≈ 15%
```

The current rating mapping is:

| Detected Discount | Rating |
|---|---:|
| < 10% | 1/5 |
| 10%–19.99% | 2/5 |
| 20%–34.99% | 3/5 |
| 35%–59.99% | 4/5 |
| ≥ 60% | 5/5 |

If promotional text is detected but the exact discount cannot be calculated, a neutral Discount Rating of 3/5 is assigned.

If no discount evidence is detected, the rating is 1/5.

The detected discount percentage is retained when a numerical estimate is available.

## Budget Fit

Budget Fit evaluates how large a product price is relative to the effective budget.

The effective budget includes the base budget and the selected Extra Budget percentage.

```text
Effective Budget =
Base Budget × (1 + Extra Budget % / 100)
```

Let:

```text
usage = product price / effective budget
```

The current mapping is:

| Budget Usage | Budget Fit |
|---|---:|
| ≤ 10% | 5/5 |
| ≤ 25% | 4/5 |
| ≤ 40% | 3/5 |
| ≤ 60% | 2/5 |
| > 60% | 1/5 |

When no budget has been defined, the engine uses a neutral Budget Fit rating of 3/5.

A zero or negative effective budget results in a Budget Fit rating of 1/5 for positive-priced products.

Products without a valid positive price also receive a minimum Budget Fit rating.

## Budget Adjustment

Budget Fit is shown as an explanatory metric.

Separately, a budget-impact adjustment affects the final Priority Score.

| Effective Budget Usage | Adjustment |
|---|---:|
| ≤ 5% | +0.50 |
| ≤ 10% | +0.25 |
| ≤ 40% | 0 |
| ≤ 60% | -0.50 |
| ≤ 80% | -1.00 |
| ≤ 100% | -1.50 |
| > 100% | -2.00 |

When no budget has been defined, the adjustment is zero.

A zero effective budget produces an adjustment of -2.00 for positive-priced products.

The final priority score is:

```text
Final Priority Score =
clamp(Base Score + Budget Adjustment, 1, 5)
```

The result is rounded to one decimal place.

Products explicitly classified as out of stock or without a positive price receive a final Priority Score of 1/5.

Products exceeding the effective budget receive the corresponding negative adjustment but are excluded from budget-constrained purchase planning.

## Value for Money

Value for Money is estimated relative to other imported products belonging to the same detected product group.

Product groups are identified through predefined keyword-based rules.

Let:

```text
ratio =
product price /
average comparable-group price
```

The mapping is:

| Price / Group Average | VFM |
|---|---:|
| ≤ 0.70 | 5/5 |
| ≤ 0.85 | 4/5 |
| ≤ 1.00 | 3/5 |
| ≤ 1.15 | 2/5 |
| > 1.15 | 1/5 |

If there are fewer than two comparable products, a neutral rating of 3/5 is used.

Products without a valid positive price receive a VFM rating of 1/5.

The VFM rating is a relative price-based heuristic rather than a direct measurement of product quality or performance.

It does not rely on external market averages or historical price databases.

## Purchase Readiness

Purchase Readiness is an additional percentage-based decision-support indicator.

It combines:

```text
40% final priority
25% budget component
15% value for money
10% season relevance
10% availability
```

The 1–5 ratings are converted into percentage components before calculating the weighted result.

Season relevance is determined by the active seasonality filter.

When all seasons are selected, the season component is set to 80%.

A matching seasonal product receives 100%, while a non-matching product receives 30%.

Special handling is applied when a product is:

- out of stock;
- unavailable or missing a valid price;
- more expensive than the effective budget.

Out-of-stock products and products without confirmed availability or a valid positive price receive 0% Purchase Readiness.

Products exceeding the effective budget receive 10% Purchase Readiness.

The user-facing readiness labels are:

```text
Strong Buy
Good Option
Maybe Later
Low Priority
Too Expensive
Out of Stock
Price Unavailable
```

The percentage-based classification is:

| Purchase Readiness | Label |
|---|---|
| ≥ 80% | Strong Buy |
| 65%–79% | Good Option |
| 45%–64% | Maybe Later |
| < 45% | Low Priority |

The special availability and budget labels take precedence over the percentage-based classification.

Purchase Readiness is calculated separately from the final Priority Score and does not directly determine purchase-plan utility.

## Purchase Plan Utility

The active plan determines how utility is calculated.

Selecting a predefined plan also applies the corresponding Urgency and Discount preference weights.

### My Smart Plan

Primarily uses final priority.

```text
Plan Utility = Final Priority Score
```

The user controls the Urgency and Discount weights directly.

### Budget Plan

```text
55% Budget Fit
30% Priority
15% Value for Money
```

The preset preference weights are:

```text
Urgency Importance: 2
Discount Importance: 4
```

### Premium Plan

```text
60% Relative Price Rating
40% Priority
```

The Relative Price Rating is calculated from the minimum and maximum positive prices within the detected product group.

Higher-priced products receive higher relative ratings.

This is a price-based premium heuristic rather than a direct assessment of quality.

The preset preference weights are:

```text
Urgency Importance: 5
Discount Importance: 1
```

### Deal Hunter Plan

```text
65% Discount
35% Priority
```

The preset preference weights are:

```text
Urgency Importance: 3
Discount Importance: 5
```

All plan utility calculations use values on the 1–5 rating scale.

## Budget-Constrained Optimization

The optimizer works across detected product groups.

It searches combinations while enforcing:

```text
Total Cost ≤ Effective Budget
```

The implementation also prevents selecting more than one product from the same detected group in a generated plan.

Only products with valid positive prices that individually fit the effective budget are considered.

Products are grouped using predefined keyword-based category detection.

The optimizer uses integer-cent monetary values to avoid floating-point errors during budget comparisons.

Dominated intermediate states are removed to reduce unnecessary search states.

A minimum utility threshold is used so that low-value products are not added solely to consume unused budget.

The current inclusion threshold is:

```text
Minimum Plan Utility: 2.5
```

A product must have utility greater than 2.5 to contribute positively to the optimized plan.

The optimizer evaluates combinations using utility above the inclusion threshold.

When combinations have equal utility, the lower-cost result is preferred.

The generated plan includes selected products, total purchase cost, and remaining budget.

A valid budget must be defined before the application generates a budget-aware purchase plan.

## Explainability

The application does not expose only a final number.

It also provides:

- component bars;
- detected discount percentage;
- tags;
- decision reasons;
- Purchase Readiness;
- budget warnings;
- plan explanations.

The component bars display Budget Fit, Urgency, Discount, and Value for Money separately.

Explanatory tags are generated from predefined rating thresholds and detected product information.

The interface distinguishes the final Priority Score from additional indicators used for purchase readiness and plan optimization.

This makes the decision process inspectable by the user.