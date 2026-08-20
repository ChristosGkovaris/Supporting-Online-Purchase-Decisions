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

## Preference Weights

The user controls:

```text
Urgency Importance: 0–5
Discount Importance: 0–5
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

If all participating weights are zero, a neutral fallback value is used.

## Discount Rating

Discounts may be detected from:

- an explicit percentage;
- an explicit monetary reduction;
- an old price and current price.

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

## Budget Fit

Budget Fit evaluates how large a product price is relative to the effective budget.

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

When no usable budget is available, the engine uses neutral handling rather than fabricating affordability.

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

The final priority score is:

```text
Final Priority Score =
clamp(Base Score + Budget Adjustment, 1, 5)
```

## Value for Money

Value for Money is estimated relative to other imported products belonging to the same detected product group.

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

If there are fewer than two comparable products, a neutral rating is used.

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

Special handling is applied when a product is:

- out of stock;
- more expensive than the effective budget.

The user-facing readiness labels are:

```text
Strong Buy
Good Option
Maybe Later
Low Priority
Too Expensive
Out of Stock
```

## Purchase Plan Utility

The active plan determines how utility is calculated.

### My Smart Plan

Primarily uses final priority.

### Budget Plan

```text
55% Budget Fit
30% Priority
15% Value for Money
```

### Premium Plan

```text
60% Relative Price Rating
40% Priority
```

### Deal Hunter Plan

```text
65% Discount
35% Priority
```

## Budget-Constrained Optimization

The optimizer works across detected product groups.

It searches combinations while enforcing:

```text
Total Cost ≤ Effective Budget
```

The implementation also prevents selecting more than one product from the same detected group in a generated plan.

Dominated intermediate states are removed to reduce unnecessary search states.

A minimum utility threshold is used so that low-value products are not added solely to consume unused budget.

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

This makes the decision process inspectable by the user.
