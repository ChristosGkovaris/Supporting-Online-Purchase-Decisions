import unittest
from tests._node_harness import run_content


class ContentScriptLogicTests(unittest.TestCase):
    def test_05_explicit_out_of_stock_is_detected(self):
        result = run_content('''
          return detectAvailability("Thunder treadmill Δεν είναι διαθέσιμο", 0);
        ''')
        self.assertEqual(result, "out-of-stock")

    def test_06_missing_price_alone_is_not_out_of_stock(self):
        result = run_content('''
          return detectAvailability("Product with no explicit availability signal", 0);
        ''')
        self.assertEqual(result, "unknown")

    def test_07_positive_price_is_available(self):
        result = run_content('''
          return detectAvailability("Normal product", 49.99);
        ''')
        self.assertEqual(result, "available")

    def test_08_greek_price_parsing(self):
        result = run_content('''
          return {
            comma: parseGreekPrice("203,15 €"),
            dot: parseGreekPrice("203.15 €"),
            thousands: parseGreekPrice("1.203,15 €")
          };
        ''')
        self.assertAlmostEqual(result["comma"], 203.15, places=2)
        self.assertAlmostEqual(result["dot"], 203.15, places=2)
        self.assertAlmostEqual(result["thousands"], 1203.15, places=2)

    def test_09_false_positive_navigation_card_is_rejected(self):
        result = run_content('''
          const fakeLink = { href: "https://www.skroutz.gr/account" };
          const fakeElement = {
            innerText: "Skroutz Wallet Account Settings",
            querySelector(selector) {
              if (selector === "img") return { src: "x.png" };
              return null;
            },
            querySelectorAll(selector) {
              if (selector === "a[href]") return [fakeLink];
              return [];
            }
          };
          return looksLikeProductCard(fakeElement);
        ''')
        self.assertFalse(result)

    def test_10_real_product_like_card_is_accepted(self):
        result = run_content('''
          const fakeLink = { href: "https://www.skroutz.gr/s/123456/Test-Product.html" };
          const fakeElement = {
            innerText: "Test Product 99,90 €",
            querySelector(selector) {
              if (selector === "img") return { src: "x.png" };
              return null;
            },
            querySelectorAll(selector) {
              if (selector === "a[href]") return [fakeLink];
              return [];
            }
          };
          return looksLikeProductCard(fakeElement);
        ''')
        self.assertTrue(result)


if __name__ == "__main__":
    unittest.main()
