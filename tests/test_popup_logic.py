import unittest
from tests._node_harness import run_popup


class PopupLogicTests(unittest.TestCase):
    def test_11_discount_coupon_is_detected_as_15_percent(self):
        result = run_popup('''
          return analyzeDiscount({
            title: "ForAll 3hp Treadmill",
            price: 203.15,
            rawText: "239,00 € από 203,15 € -35,85€ κουπόνι"
          });
        ''')
        self.assertAlmostEqual(result["percent"], 15.0, places=1)
        self.assertEqual(result["score"], 2)

    def test_12_discount_rating_boundaries(self):
        result = run_popup('''
          return [
            discountPercentToRating(9.99),
            discountPercentToRating(10),
            discountPercentToRating(20),
            discountPercentToRating(35),
            discountPercentToRating(60)
          ];
        ''')
        self.assertEqual(result, [1, 2, 3, 4, 5])

    def test_13_zero_weights_use_neutral_fallback(self):
        result = run_popup('''
          return weightedAverageRating([
            { score: 5, weight: 0 },
            { score: 1, weight: 0 }
          ]);
        ''')
        self.assertEqual(result, 3)

    def test_14_effective_budget_300_plus_100_percent_is_600(self):
        result = run_popup('''
          elements = {
            budgetInput: { value: "300" },
            extraBudgetSlider: { value: "4" }
          };
          return getEffectiveBudget();
        ''')
        self.assertEqual(result, 600)

    def test_15_effective_budget_20_plus_100_percent_is_40(self):
        result = run_popup('''
          elements = {
            budgetInput: { value: "20" },
            extraBudgetSlider: { value: "4" }
          };
          return getEffectiveBudget();
        ''')
        self.assertEqual(result, 40)

    def test_16_zero_budget_is_real_zero(self):
        result = run_popup('''
          elements = {
            budgetInput: { value: "0" },
            extraBudgetSlider: { value: "0" }
          };
          return { base: getBaseBudgetCents(), effective: getEffectiveBudget() };
        ''')
        self.assertEqual(result["base"], 0)
        self.assertEqual(result["effective"], 0)

    def test_17_negative_budget_is_sanitized_to_zero(self):
        result = run_popup('''
          elements = {
            budgetInput: { value: "-100" },
            extraBudgetSlider: { value: "0" }
          };
          sanitizeBudgetInput();
          return { value: elements.budgetInput.value, effective: getEffectiveBudget() };
        ''')
        self.assertEqual(result["value"], "0")
        self.assertEqual(result["effective"], 0)

    def test_18_empty_budget_is_unset(self):
        result = run_popup('''
          elements = {
            budgetInput: { value: "" },
            extraBudgetSlider: { value: "0" }
          };
          return { base: getBaseBudgetCents(), effective: getEffectiveBudget() };
        ''')
        self.assertIsNone(result["base"])
        self.assertIsNone(result["effective"])

    def test_19_exact_cent_boundary_is_stable(self):
        result = run_popup('''
          return {
            product: toCents(0.67),
            exactBudget: toCents(0.67),
            lowerBudget: toCents(0.66)
          };
        ''')
        self.assertEqual(result["product"], result["exactBudget"])
        self.assertGreater(result["product"], result["lowerBudget"])

    def test_20_budget_fit_and_adjustment_boundaries(self):
        result = run_popup('''
          return {
            fit10: calculateBudgetFitScore(10, 100),
            fit25: calculateBudgetFitScore(25, 100),
            fit40: calculateBudgetFitScore(40, 100),
            fit60: calculateBudgetFitScore(60, 100),
            fit61: calculateBudgetFitScore(61, 100),
            adj5: calculateBudgetAdjustment(5, 100),
            adj10: calculateBudgetAdjustment(10, 100),
            adj40: calculateBudgetAdjustment(40, 100),
            adj60: calculateBudgetAdjustment(60, 100),
            adj80: calculateBudgetAdjustment(80, 100),
            adj100: calculateBudgetAdjustment(100, 100),
            adj101: calculateBudgetAdjustment(101, 100)
          };
        ''')
        self.assertEqual(result["fit10"], 5)
        self.assertEqual(result["fit25"], 4)
        self.assertEqual(result["fit40"], 3)
        self.assertEqual(result["fit60"], 2)
        self.assertEqual(result["fit61"], 1)
        self.assertEqual(result["adj5"], 0.5)
        self.assertEqual(result["adj10"], 0.25)
        self.assertEqual(result["adj40"], 0)
        self.assertEqual(result["adj60"], -0.5)
        self.assertEqual(result["adj80"], -1)
        self.assertEqual(result["adj100"], -1.5)
        self.assertEqual(result["adj101"], -2)

    def test_21_vfm_and_grouping_are_deterministic(self):
        result = run_popup('''
          const products = [
            { title: "Apple iPhone 15", price: 1000 },
            { title: "Apple iPhone 14", price: 800 }
          ];
          return {
            group: detectProductGroup("Apple iPhone 15"),
            expensive: calculateVfmScore(products[0], products),
            cheaper: calculateVfmScore(products[1], products)
          };
        ''')
        self.assertEqual(result["group"], "Phone")
        self.assertLessEqual(result["expensive"], result["cheaper"])

    def test_22_seasonality_neutral_and_winter(self):
        result = run_popup('''
          return {
            phone: detectProductSeasons({ title: "Apple iPhone 15", rawText: "" }),
            jacket: detectProductSeasons({ title: "Heavy jacket", rawText: "" })
          };
        ''')
        self.assertIn("all", result["phone"])
        self.assertIn("winter", result["jacket"])

    def test_23_purchase_readiness_special_cases(self):
        result = run_popup('''
          const base = {
            finalScore: 3,
            price: 50,
            availability: "available",
            scores: { budget: 3, vfm: 3 }
          };
          return {
            outOfStock: calculatePurchaseReadiness({ ...base, availability: "out-of-stock" }, 100),
            tooExpensive: calculatePurchaseReadiness({ ...base, price: 101 }, 100)
          };
        ''')
        self.assertEqual(result["outOfStock"], 0)
        self.assertEqual(result["tooExpensive"], 10)

    def test_24_optimizer_never_exceeds_budget(self):
        result = run_popup('''
          const entries = [
            {
              groupName: "Winter Clothing",
              products: [
                {
                  id: "brokers",
                  title: "Brokers Jeans Jacket",
                  price: 39.95,
                  finalScore: 2.6,
                  scores: { budget: 1, discount: 3, vfm: 4 }
                },
                {
                  id: "cheap",
                  title: "Cheap Jacket",
                  price: 7.42,
                  finalScore: 1.4,
                  scores: { budget: 4, discount: 1, vfm: 5 }
                }
              ]
            },
            {
              groupName: "Phone",
              products: [
                {
                  id: "phone",
                  title: "Samsung Phone",
                  price: 154.90,
                  finalScore: 1.4,
                  scores: { budget: 1, discount: 1, vfm: 5 }
                }
              ]
            }
          ];
          const selected = optimizePlanUnderBudget(entries, "custom", toCents(40));
          const total = selected.reduce((sum, p) => sum + toCents(p.price), 0);
          return { total, budget: toCents(40), ids: selected.map(p => p.id) };
        ''')
        self.assertLessEqual(result["total"], result["budget"])
        self.assertNotIn("phone", result["ids"])

    def test_25_merge_preserves_user_urgency_and_list(self):
        result = run_popup('''
          const existing = [{
            id: "old",
            title: "Product",
            url: "https://www.skroutz.gr/s/1/Product.html?foo=1",
            price: 10,
            urgencyScore: 5,
            urgencyScoreSource: "user",
            ratingScale: 5,
            isTracked: true,
            listName: "MY SMART PLAN"
          }];
          const incoming = [{
            id: "new",
            title: "Product",
            url: "https://www.skroutz.gr/s/1/Product.html?bar=2",
            price: 12,
            urgencyScore: 3,
            urgencyScoreSource: "default",
            ratingScale: 5,
            availability: "available"
          }];
          const all = mergeProducts(existing, incoming);
          const merged = all[0];
          return {
            count: all.length,
            urgencyScore: merged.urgencyScore,
            urgencyScoreSource: merged.urgencyScoreSource,
            isTracked: merged.isTracked,
            listName: merged.listName,
            price: merged.price
          };
        ''')
        self.assertEqual(result["count"], 1)
        self.assertEqual(result["urgencyScore"], 5)
        self.assertEqual(result["urgencyScoreSource"], "user")
        self.assertTrue(result["isTracked"])
        self.assertEqual(result["listName"], "MY SMART PLAN")
        self.assertEqual(result["price"], 12)


if __name__ == "__main__":
    unittest.main()
