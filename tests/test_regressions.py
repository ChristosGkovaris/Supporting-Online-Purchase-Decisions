import unittest
from tests._node_harness import run_popup


class RegressionTests(unittest.TestCase):

    def test_26_product_url_query_parameters_are_removed(self):
        result = run_popup(r'''
          return canonicalizeProductUrl(
            "https://www.skroutz.gr/s/123/Test.html?foo=1&bar=2"
          );
        ''')

        self.assertEqual(
            result,
            "https://www.skroutz.gr/s/123/Test.html"
        )

    def test_27_product_url_hash_is_removed(self):
        result = run_popup(r'''
          return canonicalizeProductUrl(
            "https://www.skroutz.gr/s/123/Test.html#reviews"
          );
        ''')

        self.assertEqual(
            result,
            "https://www.skroutz.gr/s/123/Test.html"
        )

    def test_28_invalid_product_url_returns_empty_string(self):
        result = run_popup(r'''
          return canonicalizeProductUrl(
            "not-a-valid-url"
          );
        ''')

        self.assertEqual(result, "")

    def test_29_identity_uses_canonical_url(self):
        result = run_popup(r'''
          const a = getProductIdentityKey({
            title: "Product",
            url: "https://www.skroutz.gr/s/123/Test.html?foo=1"
          });

          const b = getProductIdentityKey({
            title: "Product",
            url: "https://www.skroutz.gr/s/123/Test.html?bar=2"
          });

          return {
            same: a === b,
            a,
            b
          };
        ''')

        self.assertTrue(result["same"])

    def test_30_identity_falls_back_to_normalized_title(self):
        result = run_popup(r'''
          return getProductIdentityKey({
            title: "  Example Product  ",
            url: ""
          });
        ''')

        self.assertEqual(
            result,
            "example product"
        )

    def test_31_macbook_is_not_classified_as_study(self):
        result = run_popup(r'''
          return detectProductGroup(
            "Apple MacBook Pro 14"
          );
        ''')

        self.assertEqual(
            result,
            "Computer"
        )

    def test_32_pan_substring_does_not_create_false_kitchen_match(self):
        result = run_popup(r'''
          return {
            japan: detectProductGroup(
              "Japan Limited Edition Poster"
            ),
            pan: detectProductGroup(
              "Stainless Steel Pan"
            )
          };
        ''')

        self.assertNotEqual(
            result["japan"],
            "Kitchen"
        )

        self.assertEqual(
            result["pan"],
            "Kitchen"
        )

    def test_33_book_substring_does_not_match_unrelated_word(self):
        result = run_popup(r'''
          return {
            facebook: detectProductGroup(
              "Facebook Portal Device"
            ),
            notebook: detectProductGroup(
              "Student Notebook"
            )
          };
        ''')

        self.assertNotEqual(
            result["facebook"],
            "Study"
        )

        self.assertEqual(
            result["notebook"],
            "Study"
        )

    def test_34_out_of_stock_product_has_zero_readiness(self):
        result = run_popup(r'''
          return calculatePurchaseReadiness(
            {
              price: 100,
              availability: "out-of-stock",
              finalScore: 5,
              scores: {
                budget: 5,
                vfm: 5
              }
            },
            500
          );
        ''')

        self.assertEqual(
            result,
            0
        )

    def test_35_product_above_budget_is_too_expensive(self):
        result = run_popup(r'''
          const product = {
            price: 101,
            availability: "available",
            finalScore: 5,
            scores: {
              budget: 1,
              vfm: 5
            }
          };

          return {
            readiness:
              calculatePurchaseReadiness(
                product,
                100
              ),

            label:
              getPurchaseReadinessLabel(
                product,
                100
              )
          };
        ''')

        self.assertEqual(
            result["readiness"],
            10
        )

        self.assertEqual(
            result["label"],
            "Too Expensive"
        )

    def test_36_exact_budget_boundary_is_not_too_expensive(self):
        result = run_popup(r'''
          const product = {
            price: 100,
            availability: "available",
            finalScore: 3,
            scores: {
              budget: 1,
              vfm: 3
            }
          };

          return getPurchaseReadinessLabel(
            product,
            100
          );
        ''')

        self.assertNotEqual(
            result,
            "Too Expensive"
        )

    def test_37_plan_threshold_is_consistent(self):
        result = run_popup(r'''
          return {
            custom:
              getPlanInclusionThreshold(
                "custom"
              ),

            budget:
              getPlanInclusionThreshold(
                "budget"
              ),

            premium:
              getPlanInclusionThreshold(
                "premium"
              ),

            deal:
              getPlanInclusionThreshold(
                "deal"
              )
          };
        ''')

        for value in result.values():
            self.assertGreaterEqual(
                value,
                1
            )

            self.assertLessEqual(
                value,
                5
            )

    def test_38_best_next_purchase_uses_plan_utility(self):
        result = run_popup(r'''
          const products = [
            {
              id: "a",
              title: "Product A",
              price: 30,
              finalScore: 4,
              scores: {
                budget: 3,
                discount: 1,
                vfm: 3
              }
            },

            {
              id: "b",
              title: "Product B",
              price: 20,
              finalScore: 3,
              scores: {
                budget: 5,
                discount: 5,
                vfm: 5
              }
            }
          ];

          return {
            custom:
              selectBestNextPurchase(
                products,
                "custom"
              ).id,

            deal:
              selectBestNextPurchase(
                products,
                "deal"
              ).id
          };
        ''')

        self.assertEqual(
            result["custom"],
            "a"
        )

        self.assertEqual(
            result["deal"],
            "b"
        )

    def test_39_optimizer_never_selects_more_than_one_per_group(self):
        result = run_popup(r'''
          const entries = [
            {
              groupName:
                "Phone",

              products: [
                {
                  id: "phone-a",
                  title: "Phone A",
                  price: 20,
                  finalScore: 5,
                  scores: {
                    budget: 5,
                    discount: 5,
                    vfm: 5
                  }
                },

                {
                  id: "phone-b",
                  title: "Phone B",
                  price: 25,
                  finalScore: 4.5,
                  scores: {
                    budget: 5,
                    discount: 5,
                    vfm: 5
                  }
                }
              ]
            }
          ];

          const selected =
            optimizePlanUnderBudget(
              entries,
              "custom",
              toCents(100)
            );

          return {
            count:
              selected.length,

            ids:
              selected.map(
                product =>
                  product.id
              )
          };
        ''')

        self.assertLessEqual(
            result["count"],
            1
        )

    def test_40_money_conversion_round_trip(self):
        result = run_popup(r'''
          const values = [
            0.01,
            0.67,
            19.99,
            203.15,
            1000.01
          ];

          return values.map(
            value => ({
              original: value,
              restored:
                fromCents(
                  toCents(
                    value
                  )
                )
            })
          );
        ''')

        for item in result:
            self.assertAlmostEqual(
                item["original"],
                item["restored"],
                places=2
            )


if __name__ == "__main__":
    unittest.main()