console.log("Smart Wishlist content script loaded on Skroutz Favorites.");

const DEFAULT_URGENCY_SCORE = 3;
const RATING_SCALE = 5;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_SKROUTZ_PRODUCTS") {
    const products = extractSkroutzProducts();
    sendResponse({ products });
  }

  return true;
});

function extractSkroutzProducts() {
  const productCards = findProductCards();

  return productCards
    .map(extractProductFromCard)
    .filter((product) => product.title && product.url);
}

function findProductCards() {
  const candidates = [];
  const mainArea = document.querySelector("main") || document;

  mainArea
    .querySelectorAll("li, article, .card, [data-testid='favorite-item']")
    .forEach((element) => {
      if (
        element.closest("nav") ||
        element.closest("header") ||
        element.closest("aside")
      ) {
        return;
      }

      // const text = cleanText(element.innerText);

      if (looksLikeProductCard(element)) {
        candidates.push(element);
      }
    });

  return removeDuplicateElements(candidates);
}

function extractProductFromCard(card) {
  const linkElement = findBestLink(card);
  const imageElement = card.querySelector("img");

  const titleElement =
    card.querySelector(
      "a[title], h2, h3, h4, [data-testid*='title'], .title"
    ) || linkElement;

  let title = titleElement
    ? titleElement.getAttribute("title") || titleElement.innerText
    : "";

  title = cleanText(title) || "Unknown product";

  const rawText = cleanText(card.innerText);
  const priceText = findBestPriceText(card) || rawText;
  const parsedPrice = parseGreekPrice(priceText);
  const availability = detectAvailability(rawText, parsedPrice);
  const price = availability === "out-of-stock" ? 0 : parsedPrice;

  const url = linkElement?.href || window.location.href;
  const image = imageElement?.src || "";

  return {
    id: createId(title, url),
    title,
    price,
    image,
    url,
    source: "Skroutz",
    rawText,
    availability,

    urgencyScore: DEFAULT_URGENCY_SCORE,
    urgencyScoreSource: "default",
    ratingScale: RATING_SCALE,

    importedAt: new Date().toISOString()
  };
}

function detectAvailability(rawText, parsedPrice = 0) {
  const text = cleanText(rawText).toLowerCase();

  const unavailableSignals = [
    "δεν είναι διαθέσιμο",
    "δεν ειναι διαθεσιμο",
    "μη διαθέσιμο",
    "μη διαθεσιμο",
    "εξαντλήθηκε",
    "εξαντληθηκε",
    "εξαντλημένο",
    "εξαντλημενο",
    "out of stock",
    "unavailable"
  ];

  if (unavailableSignals.some((signal) => text.includes(signal))) {
    return "out-of-stock";
  }

  const availableSignals = [
    "άμεσα διαθέσιμο",
    "αμεσα διαθεσιμο",
    "διαθέσιμο",
    "διαθεσιμο",
    "σε απόθεμα",
    "σε αποθεμα",
    "in stock"
  ];

  if (
    Number.isFinite(Number(parsedPrice)) &&
    Number(parsedPrice) > 0
  ) {
    return "available";
  }

  return availableSignals.some((signal) => text.includes(signal))
    ? "available"
    : "unknown";
}

function findBestPriceText(card) {
  const selectors = [
    "[data-testid*='price']",
    "[class*='price']",
    "[class*='Price']"
  ];

  const candidates = [];

  for (const selector of selectors) {
    const elements = Array.from(card.querySelectorAll(selector));

    elements.forEach((element) => {
      const text = cleanText(element.textContent);

      if (!text.includes("€")) {
        return;
      }

      const price = parseGreekPrice(text);

      if (Number.isFinite(price) && price > 0) {
        candidates.push({
          text,
          price
        });
      }
    });
  }

  if (candidates.length === 0) {
    return "";
  }

  candidates.sort(
    (a, b) => a.price - b.price
  );

  return candidates[0].text;
}

function findBestLink(root) {
  const links = Array.from(
    root.querySelectorAll("a[href]")
  );

  const productLinks = links.filter((link) => {
    try {
      const url = new URL(link.href);

      const validHost =
        url.hostname === "skroutz.gr" ||
        url.hostname.endsWith(".skroutz.gr");

      if (!validHost) {
        return false;
      }

      const path = url.pathname.toLowerCase();

      return (
        /^\/s\/\d+/.test(path) ||
        path.includes("/product/")
      );
    } catch {
      return false;
    }
  });

  return productLinks[0] || null;
}

function parseGreekPrice(text) {
  if (!text) return 0;

  const source = String(text);
  const candidates = extractEuroPriceCandidates(source);

  if (candidates.length === 0) {
    return 0;
  }

  const primaryCandidates = candidates.filter(
    (candidate) => !isAuxiliaryPriceCandidate(source, candidate)
  );

  // Never treat instalments, shipping or other auxiliary amounts as the
  // product's purchase price. If no primary price exists, return 0/unknown.
  const usableCandidates = primaryCandidates;

  const normalizedPrices = usableCandidates
    .map((candidate) => candidate.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  if (normalizedPrices.length === 0) {
    return 0;
  }

  return roundMoney(Math.min(...normalizedPrices));
}

function extractEuroPriceCandidates(text) {
  const source = String(text || "");

  const euroPricePattern =
    /(?:\d{1,3}(?:[.\s]\d{3})+(?:,\d{1,2})?|\d{1,3}(?:[,\s]\d{3})+(?:\.\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*€/g;

  return Array.from(source.matchAll(euroPricePattern))
    .map((match) => ({
      raw: match[0],
      index: match.index ?? 0,
      price: normalizePriceString(match[0])
    }))
    .filter((candidate) => Number.isFinite(candidate.price));
}

function isAuxiliaryPriceCandidate(source, candidate) {
  const before = source
    .slice(Math.max(0, candidate.index - 32), candidate.index)
    .toLowerCase();

  const afterStart = candidate.index + candidate.raw.length;

  const after = source
    .slice(afterStart, afterStart + 40)
    .toLowerCase();

  const auxiliaryBefore =
    /(?:installment|monthly|per month|δόση|δόσεις|μηνιαία|ανά μήνα|μεταφορικά|shipping|delivery)\s*[:\-]?\s*$/i;

  const auxiliaryAfter =
    /^\s*(?:\/\s*)?(?:month|mo\b|μήνα|μηνα|μήνας|μηνας|μήνες|μηνες)\b|^\s*(?:per month|ανά μήνα|το μήνα|τον μήνα|μεταφορικά|shipping|delivery)\b/i;

  return (
    (!before.includes("€") && auxiliaryBefore.test(before)) ||
    auxiliaryAfter.test(after)
  );
}

function normalizePriceString(priceText) {
  let value = String(priceText)
    .replace(/€/g, "")
    .replace(/\s/g, "")
    .trim();

  if (!value) return NaN;

  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      value = value
        .replace(/\./g, "")
        .replace(",", ".");
    } else {
      value = value.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    const commaCount = (value.match(/,/g) || []).length;
    const decimalDigits = value.length - lastComma - 1;

    if (
      commaCount === 1 &&
      (decimalDigits === 1 || decimalDigits === 2)
    ) {
      value = value.replace(",", ".");
    } else {
      value = value.replace(/,/g, "");
    }
  } else if (lastDot !== -1) {
    const dotCount = (value.match(/\./g) || []).length;
    const decimalDigits = value.length - lastDot - 1;

    if (
      dotCount === 1 &&
      (decimalDigits === 1 || decimalDigits === 2)
    ) {
      // Already valid decimal notation.
    } else {
      value = value.replace(/\./g, "");
    }
  }

  return Number(value);
}

function looksLikeProductCard(element) {
  if (!element) {
    return false;
  }

  const text =
    cleanText(element.innerText);

  if (
    !text ||
    text.length < 10 ||
    text.length > 3000
  ) {
    return false;
  }

  const image =
    element.querySelector("img");

  if (!image) {
    return false;
  }

  const productLink =
    findBestLink(element);

  if (!productLink) {
    return false;
  }

  return true;
}

function removeDuplicateElements(elements) {
  const unique = [];
  const seen = new Set();

  elements.forEach((element) => {
    const link = findBestLink(element);

    const key = link
      ? link.href.split("?")[0]
      : cleanText(element.innerText);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(element);
    }
  });

  return unique;
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function roundMoney(value) {
  return (
    Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100
  );
}

function createId(title, url) {
  const value = `${title}-${url}`;

  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return `product-${(hash >>> 0).toString(16)}`;
}