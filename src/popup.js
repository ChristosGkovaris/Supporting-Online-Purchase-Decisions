const STORAGE_KEYS = {
    products: "smartWishlistProducts",
    weights: "smartWishlistWeights",
    budget: "smartWishlistBudget",
    extraBudgetPercent: "smartWishlistExtraBudgetPercent",
    lists: "smartWishlistLists",
    genericIdeas: "smartWishlistGenericIdeas"
};

const SCORE_MIN = 1;
const SCORE_MAX = 5;
const DEFAULT_URGENCY_SCORE = 3;
const RATING_SCALE = 5;

const DEFAULT_WEIGHTS = Object.freeze({
    urgency: 4,
    discount: 3
});

let elements = {};
let currentView = "all";
let currentPlanType = "custom";
let currentSeasonFilter = "all";
let showProductSuggestions = false;

document.addEventListener("DOMContentLoaded", async () => {
    elements = {
        importBtn: document.getElementById("importCurrentPageBtn"),
        clearBtn: document.getElementById("clearBtn"),
        status: document.getElementById("status"),
        productsList: document.getElementById("productsList"),
        smartWishlistList: document.getElementById("smartWishlistList"),
        wishlistTitle: document.getElementById("wishlistTitle"),
        suggestProductsBtn: document.getElementById("suggestProductsBtn"),
        plansList: document.getElementById("plansList"),
        openAppBtn: document.getElementById("openAppBtn"),
        budgetInput: document.getElementById("budgetInput"),
        extraBudgetSlider: document.getElementById("extraBudgetSlider"),
        extraBudgetValue: document.getElementById("extraBudgetValue"),
        effectiveBudgetValue: document.getElementById("effectiveBudgetValue"),
        budgetPlanBtn: document.getElementById("budgetPlanBtn"),
        premiumPlanBtn: document.getElementById("premiumPlanBtn"),
        dealPlanBtn: document.getElementById("dealPlanBtn"),
        allSeasonsBtn: document.getElementById("allSeasonsBtn"),
        winterBtn: document.getElementById("winterBtn"),
        springBtn: document.getElementById("springBtn"),
        summerBtn: document.getElementById("summerBtn"),
        autumnBtn: document.getElementById("autumnBtn"),
        viewTabsContainer: document.getElementById("viewTabsContainer"),
        urgencyWeight: document.getElementById("urgencyWeight"),
        discountWeight: document.getElementById("discountWeight"),
        urgencyWeightValue: document.getElementById("urgencyWeightValue"),
        discountWeightValue: document.getElementById("discountWeightValue")
    };

    const isFullTab = window.location.search.includes("tab=true");
    const popupMode = document.getElementById("popupMode");
    const fullAppMode = document.getElementById("fullAppMode");

    if (!isFullTab) {
        popupMode.style.display = "block";
        fullAppMode.style.display = "none";

        elements.openAppBtn.addEventListener("click", async () => {
            const [currentTab] = await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

            chrome.tabs.create({
                url: chrome.runtime.getURL("popup.html?tab=true"),
                index: currentTab
                    ? currentTab.index + 1
                    : undefined
            });
        });

        return;
    }

    popupMode.style.display = "none";
    fullAppMode.style.display = "flex";

    await loadBudget();
    await loadWeights();
    await loadExtraBudgetPercent();
    await initializeListRegistry();

    updateEffectiveBudgetLabel();

    elements.budgetInput.addEventListener("input", async () => {
        sanitizeBudgetInput();

        await saveBudget(elements.budgetInput.value);
        updateEffectiveBudgetLabel();
        await renderProducts();
        await renderSmartWishlist();
    });

    elements.extraBudgetSlider.addEventListener("input", async () => {
        updateExtraBudgetLabel();
        updateEffectiveBudgetLabel();

        await saveExtraBudgetPercent(
            getExtraBudgetPercent()
        );

        await renderProducts();
        await renderSmartWishlist();
    });

    elements.importBtn.addEventListener(
        "click",
        importFromSkroutzTab
    );

    elements.clearBtn.addEventListener(
        "click",
        clearProducts
    );

    elements.suggestProductsBtn.addEventListener(
        "click",
        async () => {
            showProductSuggestions =
                !showProductSuggestions;

            await renderSmartWishlist();
        }
    );

    elements.budgetPlanBtn.addEventListener(
        "click",
        async () => {
            currentPlanType = "budget";
            await applyPlanPresetAndRender("budget");
        }
    );

    elements.premiumPlanBtn.addEventListener(
        "click",
        async () => {
            currentPlanType = "premium";
            await applyPlanPresetAndRender("premium");
        }
    );

    elements.dealPlanBtn.addEventListener(
        "click",
        async () => {
            currentPlanType = "deal";
            await applyPlanPresetAndRender("deal");
        }
    );

    elements.allSeasonsBtn.addEventListener(
        "click",
        async () => {
            setSeasonFilter("all");
            await renderProducts();
            await renderSmartWishlist();
        }
    );

    elements.winterBtn.addEventListener(
        "click",
        async () => {
            setSeasonFilter("winter");
            await renderProducts();
            await renderSmartWishlist();
        }
    );

    elements.springBtn.addEventListener(
        "click",
        async () => {
            setSeasonFilter("spring");
            await renderProducts();
            await renderSmartWishlist();
        }
    );

    elements.summerBtn.addEventListener(
        "click",
        async () => {
            setSeasonFilter("summer");
            await renderProducts();
            await renderSmartWishlist();
        }
    );

    elements.autumnBtn.addEventListener(
        "click",
        async () => {
            setSeasonFilter("autumn");
            await renderProducts();
            await renderSmartWishlist();
        }
    );

    [
        "urgencyWeight",
        "discountWeight"
    ].forEach((id) => {
        elements[id].addEventListener(
            "input",
            async () => {
                currentPlanType = "custom";
                updateWeightLabels();

                await saveWeights(
                    getWeightsFromInputs()
                );

                await renderProducts();
                await renderSmartWishlist();
            }
        );
    });

    await renderProducts();
    await renderSmartWishlist();
});

function getWeightsFromInputs() {
    return {
        urgency: clampNumber(
            Number(elements.urgencyWeight.value),
            0,
            5
        ),

        discount: clampNumber(
            Number(elements.discountWeight.value),
            0,
            5
        )
    };
}

function updateWeightLabels() {
    elements.urgencyWeightValue.textContent =
        elements.urgencyWeight.value;

    elements.discountWeightValue.textContent =
        elements.discountWeight.value;
}

async function loadWeights() {
    const result =
        await chrome.storage.local.get(
            STORAGE_KEYS.weights
        );

    const saved =
        result[STORAGE_KEYS.weights];

    const savedUrgencyWeight =
        Number.isFinite(
            Number(saved?.urgency)
        )
            ? Number(saved.urgency)
            : Number.isFinite(
                Number(saved?.need)
            )
                ? Number(saved.need)
                : DEFAULT_WEIGHTS.urgency;

    const weights = {
        urgency: clampNumber(
            savedUrgencyWeight,
            0,
            5
        ),

        discount:
            Number.isFinite(
                Number(saved?.discount)
            )
                ? clampNumber(
                    Number(saved.discount),
                    0,
                    5
                )
                : DEFAULT_WEIGHTS.discount
    };

    elements.urgencyWeight.value =
        weights.urgency;

    elements.discountWeight.value =
        weights.discount;

    updateWeightLabels();

    await saveWeights(weights);
}

async function saveWeights(weights) {
    await chrome.storage.local.set({
        [STORAGE_KEYS.weights]: weights
    });
}

async function getProducts() {
    const result =
        await chrome.storage.local.get(
            STORAGE_KEYS.products
        );

    return (
        result[STORAGE_KEYS.products] ||
        []
    );
}

async function saveProducts(products) {
    await chrome.storage.local.set({
        [STORAGE_KEYS.products]: products
    });
}

async function getGenericIdeas() {
    const result =
        await chrome.storage.local.get(
            STORAGE_KEYS.genericIdeas
        );

    return Array.isArray(
        result[STORAGE_KEYS.genericIdeas]
    )
        ? result[STORAGE_KEYS.genericIdeas]
        : [];
}

async function saveGenericIdeas(ideas) {
    await chrome.storage.local.set({
        [STORAGE_KEYS.genericIdeas]:
            ideas
    });
}

async function addGenericSuggestionToList(
    suggestionName,
    targetListName
) {
    const listName =
        await ensureListName(
            targetListName ||
            getActivePlanListName()
        );

    const ideas =
        await getGenericIdeas();

    const alreadyExists =
        ideas.some(
            (idea) =>
                String(
                    idea.name
                ).toLowerCase() ===
                    String(
                        suggestionName
                    ).toLowerCase() &&
                String(
                    idea.listName
                ).toLowerCase() ===
                    String(
                        listName
                    ).toLowerCase()
        );

    if (!alreadyExists) {
        ideas.push({
            id:
                `idea-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`,

            name:
                suggestionName,

            listName,

            createdAt:
                new Date()
                    .toISOString()
        });

        await saveGenericIdeas(
            ideas
        );
    }

    currentView =
        listName;

    showProductSuggestions =
        false;

    await renderProducts();
    await renderSmartWishlist();
}

async function getListNames() {
    const result =
        await chrome.storage.local.get(
            STORAGE_KEYS.lists
        );

    const storedLists =
        Array.isArray(
            result[STORAGE_KEYS.lists]
        )
            ? result[STORAGE_KEYS.lists]
            : [];

    return normalizeListNames(
        storedLists
    );
}

async function saveListNames(listNames) {
    const normalized =
        normalizeListNames(
            listNames
        );

    await chrome.storage.local.set({
        [STORAGE_KEYS.lists]:
            normalized
    });

    return normalized;
}

function normalizeListNames(listNames) {
    const unique = [];
    const seen = new Set();

    [
        "MY SMART PLAN",
        ...(listNames || [])
    ].forEach((name) => {
        const cleanName =
            String(
                name || ""
            ).trim();

        if (!cleanName) {
            return;
        }

        const key =
            cleanName.toLowerCase();

        if (!seen.has(key)) {
            seen.add(key);
            unique.push(cleanName);
        }
    });

    return unique;
}

async function initializeListRegistry() {
    const products =
        await getProducts();

    let productsChanged = false;

    const migratedProducts =
        products.map((product) => {
            const normalizedAvailability =
                product.availability === "out-of-stock" ||
                product.availability === "available" ||
                product.availability === "unknown"
                    ? product.availability
                    : Number(product.price) > 0
                        ? "available"
                        : "unknown";

            if (product.availability !== normalizedAvailability) {
                productsChanged = true;
                product = { ...product, availability: normalizedAvailability };
            }
            if (
                product.isTracked === true &&
                !String(
                    product.listName || ""
                ).trim()
            ) {
                productsChanged = true;

                return {
                    ...product,
                    listName: "MY SMART PLAN"
                };
            }

            return product;
        });

    if (productsChanged) {
        await saveProducts(
            migratedProducts
        );
    }

    const storedLists =
        await getListNames();

    const productLists =
        migratedProducts
            .map(
                (product) =>
                    product.listName
            )
            .filter(Boolean);

    await saveListNames([
        ...storedLists,
        ...productLists
    ]);
}

async function ensureListName(name) {
    const requestedName =
        String(
            name || ""
        ).trim() ||
        "MY SMART PLAN";

    const listNames =
        await getListNames();

    const existingName =
        listNames.find(
            (listName) =>
                listName.toLowerCase() ===
                requestedName.toLowerCase()
        );

    if (existingName) {
        return existingName;
    }

    await saveListNames([
        ...listNames,
        requestedName
    ]);

    return requestedName;
}

async function deleteEmptyList(listName) {
    if (
        !listName ||
        listName.toLowerCase() ===
            "my smart plan"
    ) {
        return false;
    }

    const products =
        await getProducts();

    const hasTrackedProducts =
        products.some(
            (product) =>
                product.isTracked === true &&
                product.listName === listName
        );

    if (hasTrackedProducts) {
        alert(
            `The list "${listName}" still contains products. Remove its products first before deleting the list.`
        );

        return false;
    }

    const answer =
        prompt(
            `The list "${listName}" is empty.\n\nType KEEP to keep it or DELETE to delete it:`,
            "KEEP"
        );

    if (
        !answer ||
        answer
            .trim()
            .toUpperCase() !==
            "DELETE"
    ) {
        return false;
    }

    const listNames =
        await getListNames();

    await saveListNames(
        listNames.filter(
            (name) =>
                name.toLowerCase() !==
                listName.toLowerCase()
        )
    );

    if (currentView === listName) {
        currentView =
            "MY SMART PLAN";
    }

    await renderProducts();
    await renderSmartWishlist();

    return true;
}

function getActivePlanListName() {
    const systemViews =
        new Set([
            "all",
            "outOfStock",
            "outOfBudget"
        ]);

    return systemViews.has(
        currentView
    )
        ? "MY SMART PLAN"
        : currentView;
}

function getTrackedProducts(products) {
    return products.filter(
        (product) =>
            product.isTracked === true
    );
}

async function updateProductUrgencyScore(
    productId,
    value
) {
    const urgencyScore =
        normalizeRating5(
            value,
            DEFAULT_URGENCY_SCORE
        );

    const products =
        await getProducts();

    const updatedProducts =
        products.map((product) => {
            if (
                product.id !==
                productId
            ) {
                return product;
            }

            return {
                ...product,
                urgencyScore,
                urgencyScoreSource:
                    "user",
                ratingScale:
                    RATING_SCALE
            };
        });

    await saveProducts(
        updatedProducts
    );

    await renderProducts();
    await renderSmartWishlist();
}

async function toggleProductTracking(
    productId
) {
    const products =
        await getProducts();

    const productIndex =
        products.findIndex(
            (product) =>
                product.id ===
                productId
        );

    if (productIndex < 0) {
        return;
    }

    const product =
        products[productIndex];

    if (
        product.isTracked ===
        true
    ) {
        products[productIndex] = {
            ...product,
            isTracked: false
        };

        await saveProducts(
            products
        );

        await renderProducts();
        await renderSmartWishlist();

        return;
    }

    const defaultListName =
        product.listName ||
        getActivePlanListName();

    const requestedListName =
        prompt(
            "Where do you want to add this item?\n\nType the list name below:",
            defaultListName
        );

    if (
        requestedListName === null
    ) {
        return;
    }

    const listName =
        await ensureListName(
            requestedListName
        );

    products[productIndex] = {
        ...product,
        isTracked: true,
        listName
    };

    currentView =
        listName;

    await saveProducts(
        products
    );

    await renderProducts();
    await renderSmartWishlist();
}

async function importFromSkroutzTab() {
    elements.status.textContent =
        "Searching for your Skroutz Favorites tab...";

    const tabs =
        await chrome.tabs.query({});

    const skroutzTabs =
        tabs.filter(
            (tab) =>
                isSkroutzTab(tab)
        );

    const skroutzTab =
        skroutzTabs.find(
            (tab) =>
                isLikelyFavoritesTab(tab)
        ) ||
        skroutzTabs.find(
            (tab) =>
                tab.active
        ) ||
        skroutzTabs[0];

    if (
        !skroutzTab ||
        !skroutzTab.id
    ) {
        elements.status.textContent =
            "No Skroutz tab found. Open your Skroutz Favorites page and try again.";

        return;
    }

    try {
        let response;

        try {
            response =
                await sendExtractionMessage(
                    skroutzTab.id
                );
        } catch (firstError) {
            await chrome.scripting.executeScript({
                target: {
                    tabId:
                        skroutzTab.id
                },

                files: [
                    "content.js"
                ]
            });

            await wait(100);

            response =
                await sendExtractionMessage(
                    skroutzTab.id
                );
        }

        if (
            !response ||
            !Array.isArray(
                response.products
            )
        ) {
            throw new Error(
                "The Skroutz page did not return a valid product list."
            );
        }

        const existingProducts =
            await getProducts();

        const mergedProducts =
            mergeProducts(
                existingProducts,
                response.products
            );

        await saveProducts(
            mergedProducts
        );

        await initializeListRegistry();

        elements.status.textContent =
            `Imported ${response.products.length} product(s) from Skroutz.`;

        await renderProducts();
        await renderSmartWishlist();
    } catch (error) {
        console.error(
            "Skroutz import failed:",
            error
        );

        elements.status.textContent =
            "Could not import products. Keep the Skroutz Favorites tab open, reload that page once, and try again.";
    }
}

function isSkroutzTab(tab) {
    if (
        !tab ||
        !tab.url
    ) {
        return false;
    }

    try {
        const url =
            new URL(tab.url);

        return (
            url.hostname ===
                "skroutz.gr" ||
            url.hostname.endsWith(
                ".skroutz.gr"
            )
        );
    } catch {
        return false;
    }
}

function isLikelyFavoritesTab(tab) {
    const urlText =
        String(
            tab?.url || ""
        ).toLowerCase();

    const titleText =
        String(
            tab?.title || ""
        ).toLowerCase();

    return (
        urlText.includes(
            "favorite"
        ) ||
        urlText.includes(
            "wishlist"
        ) ||
        titleText.includes(
            "favorite"
        ) ||
        titleText.includes(
            "wishlist"
        ) ||
        titleText.includes(
            "αγαπη"
        )
    );
}

function sendExtractionMessage(tabId) {
    return new Promise(
        (resolve, reject) => {
            chrome.tabs.sendMessage(
                tabId,
                {
                    type:
                        "EXTRACT_SKROUTZ_PRODUCTS"
                },
                (response) => {
                    const error =
                        chrome.runtime.lastError;

                    if (error) {
                        reject(
                            new Error(
                                error.message
                            )
                        );

                        return;
                    }

                    resolve(response);
                }
            );
        }
    );
}

function wait(milliseconds) {
    return new Promise(
        (resolve) => {
            setTimeout(
                resolve,
                milliseconds
            );
        }
    );
}

function mergeProducts(
    existingProducts,
    newProducts
) {
    const productMap =
        new Map();

    const inferredUnmarkedScale =
        inferUnmarkedRatingScale(
            existingProducts
        );

    existingProducts.forEach(
        (product) => {
            const key =
                getProductIdentityKey(
                    product
                );

            const hasUserUrgencyScore =
                product
                    .urgencyScoreSource ===
                "user";

            productMap.set(key, {
                ...product,

                isTracked:
                    product.isTracked ===
                    true,

                urgencyScore:
                    hasUserUrgencyScore
                        ? normalizeStoredUrgencyScore(
                            product,
                            inferredUnmarkedScale
                        )
                        : DEFAULT_URGENCY_SCORE,

                urgencyScoreSource:
                    hasUserUrgencyScore
                        ? "user"
                        : "default",

                ratingScale:
                    RATING_SCALE
            });
        }
    );

    newProducts.forEach(
        (product) => {
            const key =
                getProductIdentityKey(
                    product
                );

            const existing =
                productMap.get(key);

            const hasUserUrgencyScore =
                existing
                    ?.urgencyScoreSource ===
                "user";

            productMap.set(key, {
                ...product,

                isTracked:
                    existing?.isTracked ===
                    true,

                listName:
                    existing?.listName,

                urgencyScore:
                    hasUserUrgencyScore
                        ? normalizeStoredUrgencyScore(
                            existing,
                            RATING_SCALE
                        )
                        : DEFAULT_URGENCY_SCORE,

                urgencyScoreSource:
                    hasUserUrgencyScore
                        ? "user"
                        : "default",

                ratingScale:
                    RATING_SCALE
            });
        }
    );

    return Array.from(
        productMap.values()
    );
}

function canonicalizeProductUrl(
    value
) {
    try {
        const url =
            new URL(
                String(
                    value || ""
                )
            );

        url.hash = "";
        url.search = "";

        return (
            url.origin +
            url.pathname.replace(
                /\/$/,
                ""
            )
        );
    } catch {
        return "";
    }
}

function getProductIdentityKey(
    product
) {
    const canonicalUrl =
        canonicalizeProductUrl(
            product?.url
        );

    if (canonicalUrl) {
        return canonicalUrl;
    }

    return String(
        product?.title ||
        ""
    )
        .trim()
        .toLowerCase();
}

function inferUnmarkedRatingScale(
    products
) {
    const unmarkedUserRatings =
        products
            .filter(
                (product) =>
                    product
                        ?.urgencyScoreSource ===
                    "user" &&
                    ![5, 10].includes(
                        Number(
                            product?.ratingScale
                        )
                    )
            )
            .map(
                (product) =>
                    Number(
                        product.urgencyScore
                    )
            )
            .filter(
                (value) =>
                    Number.isFinite(
                        value
                    )
            );

    return unmarkedUserRatings.some(
        (value) =>
            value > 5
    )
        ? 10
        : 5;
}

function normalizeStoredUrgencyScore(
    product,
    unmarkedScale = 5
) {
    const value =
        Number(
            product?.urgencyScore
        );

    if (
        !Number.isFinite(
            value
        )
    ) {
        return DEFAULT_URGENCY_SCORE;
    }

    const explicitScale =
        Number(
            product?.ratingScale
        );

    const sourceScale =
        explicitScale === 10 ||
        explicitScale === 5
            ? explicitScale
            : unmarkedScale;

    if (sourceScale === 10) {
        return clampNumber(
            value / 2,
            SCORE_MIN,
            SCORE_MAX
        );
    }

    return clampNumber(
        value,
        SCORE_MIN,
        SCORE_MAX
    );
}

async function clearProducts() {
    await saveProducts([]);

    await saveGenericIdeas([]);

    await saveListNames([
        "MY SMART PLAN"
    ]);

    elements.status.textContent =
        "Products cleared.";

    elements.productsList.innerHTML =
        "";

    elements.smartWishlistList.innerHTML =
        "";

    if (elements.plansList) {
        elements.plansList.innerHTML =
            "";
    }

    if (
        elements.viewTabsContainer
    ) {
        elements.viewTabsContainer.innerHTML =
            "";
    }

    currentView = "all";
    showProductSuggestions = false;

    await renderProducts();
    await renderSmartWishlist();
}

async function loadBudget() {
    const result =
        await chrome.storage.local.get(
            STORAGE_KEYS.budget
        );

    const storedValue =
        result[
            STORAGE_KEYS.budget
        ];

    const savedBudget =
        Number(storedValue);

    elements.budgetInput.value =
        storedValue !== null &&
        storedValue !== undefined &&
        storedValue !== "" &&
        Number.isFinite(savedBudget) &&
        savedBudget >= 0
            ? roundMoney(savedBudget)
            : "";
}

function sanitizeBudgetInput() {
    const rawValue =
        String(
            elements.budgetInput.value ?? ""
        ).trim();

    if (rawValue === "") {
        return;
    }

    const budget =
        Number(rawValue);

    if (!Number.isFinite(budget)) {
        elements.budgetInput.value = "";
        return;
    }

    if (budget < 0) {
        elements.budgetInput.value = "0";
    }
}

async function saveBudget(value) {
    const rawValue =
        String(value ?? "").trim();

    if (rawValue === "") {
        await chrome.storage.local.set({
            [STORAGE_KEYS.budget]:
                null
        });

        return;
    }

    const budget =
        Number(rawValue);

    const normalizedBudget =
        Number.isFinite(budget)
            ? Math.max(
                0,
                roundMoney(budget)
            )
            : null;

    await chrome.storage.local.set({
        [STORAGE_KEYS.budget]:
            normalizedBudget
    });
}

function getExtraBudgetPercent() {
    const options = [
        0,
        10,
        30,
        50,
        100
    ];

    const index =
        Number(
            elements
                .extraBudgetSlider
                .value
        );

    return (
        options[index] ??
        0
    );
}

function getBaseBudgetCents() {
    const rawValue =
        String(
            elements
                .budgetInput
                .value ?? ""
        ).trim();

    if (rawValue === "") {
        return null;
    }

    const budget =
        Number(rawValue);

    if (
        !Number.isFinite(
            budget
        )
    ) {
        return null;
    }

    return toCents(
        Math.max(
            0,
            budget
        )
    );
}

function getEffectiveBudgetCents() {
    const baseBudgetCents =
        getBaseBudgetCents();

    if (
        baseBudgetCents ===
        null
    ) {
        return null;
    }

    const extraPercent =
        getExtraBudgetPercent();

    return Math.round(
        (
            baseBudgetCents *
            (
                100 +
                extraPercent
            )
        ) /
        100
    );
}

function getEffectiveBudget() {
    const cents =
        getEffectiveBudgetCents();

    return cents === null
        ? null
        : fromCents(cents);
}

function updateExtraBudgetLabel() {
    elements
        .extraBudgetValue
        .textContent =
        `${getExtraBudgetPercent()}%`;
}

function updateEffectiveBudgetLabel() {
    const effectiveBudget =
        getEffectiveBudget();

    elements
        .effectiveBudgetValue
        .textContent =
        effectiveBudget === null
            ? "Not set"
            : `${formatMoney(
                effectiveBudget
            )} €`;
}

async function loadExtraBudgetPercent() {
    const result =
        await chrome.storage.local.get(
            STORAGE_KEYS
                .extraBudgetPercent
        );

    const savedPercent =
        Number(
            result[
                STORAGE_KEYS
                    .extraBudgetPercent
            ]
        );

    const options = [
        0,
        10,
        30,
        50,
        100
    ];

    const savedIndex =
        options.indexOf(
            savedPercent
        );

    elements
        .extraBudgetSlider
        .value =
        savedIndex >= 0
            ? savedIndex
            : 0;

    updateExtraBudgetLabel();
}

async function saveExtraBudgetPercent(
    percent
) {
    await chrome.storage.local.set({
        [STORAGE_KEYS.extraBudgetPercent]:
            percent
    });
}

function setSeasonFilter(season) {
    currentSeasonFilter =
        season;

    const buttons = [
        elements.allSeasonsBtn,
        elements.winterBtn,
        elements.springBtn,
        elements.summerBtn,
        elements.autumnBtn
    ];

    buttons.forEach(
        (button) => {
            if (button) {
                button.classList.remove(
                    "active"
                );
            }
        }
    );

    const buttonMap = {
        all:
            elements.allSeasonsBtn,

        winter:
            elements.winterBtn,

        spring:
            elements.springBtn,

        summer:
            elements.summerBtn,

        autumn:
            elements.autumnBtn
    };

    buttonMap[
        season
    ]?.classList.add(
        "active"
    );
}

function productMatchesSeason(
    product,
    season
) {
    if (season === "all") {
        return true;
    }

    return detectProductSeasons(
        product
    ).includes(
        season
    );
}

function detectProductSeasons(
    product
) {
    const text =
        `${product.title || ""} ${product.rawText || ""}`
            .toLowerCase();

    const seasons =
        new Set();

    const hasAny =
        (keywords) =>
            keywords.some(
                (keyword) =>
                    text.includes(
                        keyword
                    )
            );

    const winterKeywords = [
        "heavy jacket",
        "puffer",
        "parka",
        "coat",
        "winter coat",
        "thermal",
        "fleece",
        "scarf",
        "gloves",
        "beanie",
        "snow",
        "boots",
        "heater",
        "blanket",
        "μπουφάν",
        "χοντρό μπουφάν",
        "παλτό",
        "θερμικό",
        "θερμαντικό",
        "κασκόλ",
        "γάντια",
        "σκούφος",
        "κουβέρτα",
        "μπότες"
    ];

    const autumnKeywords = [
        "light jacket",
        "raincoat",
        "trench",
        "cardigan",
        "hoodie",
        "sweatshirt",
        "umbrella",
        "windbreaker",
        "light coat",
        "ankle boots",
        "λεπτό μπουφάν",
        "ελαφρύ μπουφάν",
        "αδιάβροχο",
        "ζακέτα",
        "φούτερ",
        "ομπρέλα",
        "αντιανεμικό",
        "μποτάκια"
    ];

    const springKeywords = [
        "spring jacket",
        "sneakers",
        "running shoes",
        "light sweater",
        "garden",
        "picnic",
        "allergy",
        "floral",
        "λεπτή ζακέτα",
        "ανοιξιάτικο",
        "αθλητικά παπούτσια",
        "κήπος",
        "πικνίκ",
        "αλλεργία",
        "λουλουδάτο"
    ];

    const summerKeywords = [
        "shorts",
        "t-shirt",
        "swimsuit",
        "bikini",
        "sunglasses",
        "sandals",
        "flip flops",
        "beach",
        "sunscreen",
        "sun cream",
        "fan",
        "air conditioner",
        "cooler",
        "καλοκαιρινό",
        "σορτς",
        "κοντομάνικο",
        "μαγιό",
        "γυαλιά ηλίου",
        "σανδάλια",
        "σαγιονάρες",
        "παραλία",
        "αντηλιακό",
        "ανεμιστήρας",
        "κλιματιστικό"
    ];

    if (
        hasAny(
            winterKeywords
        )
    ) {
        seasons.add(
            "winter"
        );
    }

    if (
        hasAny(
            autumnKeywords
        )
    ) {
        seasons.add(
            "autumn"
        );
    }

    if (
        hasAny(
            springKeywords
        )
    ) {
        seasons.add(
            "spring"
        );
    }

    if (
        hasAny(
            summerKeywords
        )
    ) {
        seasons.add(
            "summer"
        );
    }

    if (
        seasons.size === 0
    ) {
        seasons.add(
            "all"
        );
    }

    return Array.from(
        seasons
    );
}

function getSeasonLabel(product) {
    const seasons =
        detectProductSeasons(
            product
        ).filter(
            (season) =>
                season !== "all"
        );

    if (
        seasons.length === 0
    ) {
        return "All Seasons";
    }

    return seasons
        .map(
            (season) =>
                season
                    .charAt(0)
                    .toUpperCase() +
                season.slice(1)
        )
        .join(", ");
}

function renderViewTabs(
    products,
    listNames
) {
    if (
        !elements.viewTabsContainer
    ) {
        return;
    }

    const normalizedLists =
        normalizeListNames(
            listNames
        );

    const trackedCounts =
        new Map(
            normalizedLists.map(
                (listName) => [
                    listName,

                    products.filter(
                        (product) =>
                            product.isTracked ===
                            true &&
                            product.listName ===
                            listName
                    ).length
                ]
            )
        );

    let html = `
        <button
          data-view="all"
          class="tab-btn ${currentView === "all" ? "active" : ""}"
        >
          ALL THE PRODUCTS
        </button>

        <button
          data-view="outOfStock"
          class="tab-btn ${currentView === "outOfStock" ? "active" : ""}"
        >
          OUT OF STOCK
        </button>

        <button
          data-view="outOfBudget"
          class="tab-btn ${currentView === "outOfBudget" ? "active" : ""}"
        >
          OUT OF BUDGET
        </button>
    `;

    normalizedLists.forEach(
        (listName) => {
            const count =
                trackedCounts.get(
                    listName
                ) || 0;

            html += `
                <button
                  data-view="${escapeHtml(listName)}"
                  data-list-name="${escapeHtml(listName)}"
                  class="tab-btn custom-list-btn ${count === 0 ? "empty-list" : ""} ${
                    currentView === listName
                        ? "active"
                        : ""
                  }"
                  title="${
                    count === 0 &&
                    listName !== "MY SMART PLAN"
                        ? "Empty list — right-click to keep or delete"
                        : `${count} product(s)`
                  }"
                >
                  ${escapeHtml(listName).toUpperCase()}
                </button>
            `;
        }
    );

    elements
        .viewTabsContainer
        .innerHTML =
        html;

    elements
        .viewTabsContainer
        .querySelectorAll(
            ".tab-btn"
        )
        .forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        currentView =
                            button
                                .dataset
                                .view;

                        await renderProducts();
                        await renderSmartWishlist();
                    }
                );
            }
        );

    elements
        .viewTabsContainer
        .querySelectorAll(
            ".custom-list-btn"
        )
        .forEach(
            (button) => {
                button.addEventListener(
                    "contextmenu",
                    async (event) => {
                        event.preventDefault();

                        const listName =
                            button
                                .dataset
                                .listName;

                        if (
                            !listName ||
                            listName ===
                                "MY SMART PLAN"
                        ) {
                            return;
                        }

                        const count =
                            trackedCounts.get(
                                listName
                            ) || 0;

                        if (count > 0) {
                            alert(
                                `The list "${listName}" still contains ${count} product(s). Remove them first before deleting the list.`
                            );

                            return;
                        }

                        await deleteEmptyList(
                            listName
                        );
                    }
                );
            }
        );
}

async function renderProducts() {
    const products =
        await getProducts();

    const listNames =
        await getListNames();

    const weights =
        getWeightsFromInputs();

    const currentBudget =
        getEffectiveBudget();

    if (
        currentView !== "all" &&
        currentView !== "outOfStock" &&
        currentView !== "outOfBudget" &&
        !listNames.includes(
            currentView
        )
    ) {
        currentView =
            "MY SMART PLAN";
    }

    renderViewTabs(
        products,
        listNames
    );

    if (
        products.length === 0
    ) {
        elements.productsList.innerHTML =
            "";

        elements.status.textContent =
            "No products imported yet.";

        return;
    }

    const scoredProducts =
        getScoredProducts(
            products,
            weights,
            currentBudget,
            products
        );

    let displayProducts =
        scoredProducts;

    if (
        currentView ===
        "outOfStock"
    ) {
        displayProducts =
            scoredProducts.filter(
                (product) =>
                    product.availability ===
                    "out-of-stock"
            );
    } else if (
        currentView ===
        "outOfBudget"
    ) {
        displayProducts =
            scoredProducts.filter(
                (product) => {
                    const price =
                        Number(
                            product.price
                        ) || 0;

                    return (
                        price > 0 &&
                        Number.isFinite(
                            currentBudget
                        ) &&
                        toCents(price) >
                            toCents(
                                currentBudget
                            )
                    );
                }
            );
    } else if (
        listNames.includes(
            currentView
        )
    ) {
        displayProducts =
            scoredProducts.filter(
                (product) =>
                    product.isTracked ===
                    true &&
                    product.listName ===
                    currentView
            );
    } else {
        displayProducts =
            scoredProducts.filter(
                (product) => {
                    const price =
                        Number(
                            product.price
                        ) || 0;

                    if (
                        price <= 0
                    ) {
                        return false;
                    }

                    if (
                        !Number.isFinite(
                            currentBudget
                        )
                    ) {
                        return true;
                    }

                    return (
                        toCents(price) <=
                        toCents(
                            currentBudget
                        )
                    );
                }
            );
    }

    displayProducts =
        displayProducts.filter(
            (product) =>
                productMatchesSeason(
                    product,
                    currentSeasonFilter
                )
        );

    elements.productsList.innerHTML =
        displayProducts.length > 0
            ? displayProducts
                .map(
                    createProductCardHtml
                )
                .join("")
            : '<div class="wishlist-empty">This view currently has no products.</div>';

    attachProductListeners();
}

function attachProductListeners() {
    document
        .querySelectorAll(
            ".track-toggle-button"
        )
        .forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        await toggleProductTracking(
                            button
                                .dataset
                                .productId
                        );
                    }
                );
            }
        );

    document
        .querySelectorAll(
            ".urgency-rating-slider"
        )
        .forEach(
            (slider) => {
                slider.addEventListener(
                    "input",
                    () => {
                        const label =
                            document.querySelector(
                                `[data-urgency-value-for="${cssEscape(
                                    slider
                                        .dataset
                                        .productId
                                )}"]`
                            );

                        if (label) {
                            label.textContent =
                                `${slider.value}/5`;
                        }
                    }
                );

                slider.addEventListener(
                    "change",
                    async () => {
                        await updateProductUrgencyScore(
                            slider
                                .dataset
                                .productId,
                            slider.value
                        );
                    }
                );
            }
        );
}

function getScoredProducts(
    products,
    weights,
    currentBudget,
    referenceProducts
) {
    const reference =
        referenceProducts ||
        products;

    return products
        .map(
            (product) =>
                scoreProduct(
                    product,
                    weights,
                    currentBudget,
                    reference
                )
        )
        .sort(
            (a, b) =>
                b.finalScore -
                a.finalScore
        );
}

function scoreProduct(
    product,
    weights,
    currentBudget,
    allProducts
) {
    const price =
        Number(
            product.price
        ) || 0;

    if (
        product.availability === "out-of-stock" ||
        price <= 0
    ) {
        return {
            ...product,

            scores: {
                budget: 1,

                urgency:
                    normalizeRating5(
                        product
                            .urgencyScore,
                        DEFAULT_URGENCY_SCORE
                    ),

                discount: 1,
                vfm: 1
            },

            baseScore: 1,
            budgetAdjustment: 0,
            finalScore: 1,
            discountPercent: null,

            tags: [
                product.availability === "out-of-stock"
                    ? "Out of Stock"
                    : "Price Unavailable"
            ]
        };
    }

    const urgencyScore =
        normalizeRating5(
            product
                .urgencyScore,
            DEFAULT_URGENCY_SCORE
        );

    const discountAnalysis =
        analyzeDiscount(
            product
        );

    const discountScore =
        discountAnalysis
            .score;

    const budgetScore =
        calculateBudgetFitScore(
            price,
            currentBudget
        );

    const vfmScore =
        calculateVfmScore(
            product,
            allProducts
        );

    const baseScore =
        weightedAverageRating([
            {
                score:
                    urgencyScore,

                weight:
                    weights.urgency
            },

            {
                score:
                    discountScore,

                weight:
                    weights.discount
            }
        ]);

    const budgetAdjustment =
        calculateBudgetAdjustment(
            price,
            currentBudget
        );

    const finalScore =
        clampNumber(
            baseScore +
                budgetAdjustment,
            SCORE_MIN,
            SCORE_MAX
        );

    return {
        ...product,

        urgencyScore,

        scores: {
            budget:
                roundOne(
                    budgetScore
                ),

            urgency:
                roundOne(
                    urgencyScore
                ),

            discount:
                roundOne(
                    discountScore
                ),

            vfm:
                roundOne(
                    vfmScore
                )
        },

        baseScore:
            roundOne(
                baseScore
            ),

        budgetAdjustment:
            roundOne(
                budgetAdjustment
            ),

        finalScore:
            roundOne(
                finalScore
            ),

        discountPercent:
            discountAnalysis
                .percent,

        tags:
            generateTags(
                budgetScore,
                urgencyScore,
                discountScore,
                vfmScore,
                finalScore,
                discountAnalysis
                    .percent
            )
    };
}

function weightedAverageRating(
    criteria
) {
    const validCriteria =
        criteria.filter(
            ({
                score,
                weight
            }) =>
                Number.isFinite(
                    Number(score)
                ) &&
                Number.isFinite(
                    Number(weight)
                ) &&
                Number(weight) > 0
        );

    const totalWeight =
        validCriteria.reduce(
            (
                sum,
                criterion
            ) =>
                sum +
                Number(
                    criterion.weight
                ),
            0
        );

    if (
        totalWeight <= 0
    ) {
        return 3;
    }

    const weightedSum =
        validCriteria.reduce(
            (
                sum,
                criterion
            ) =>
                sum +
                Number(
                    criterion.score
                ) *
                Number(
                    criterion.weight
                ),
            0
        );

    return clampNumber(
        weightedSum /
            totalWeight,
        SCORE_MIN,
        SCORE_MAX
    );
}

function calculateBudgetFitScore(
    price,
    currentBudget
) {
    if (
        !Number.isFinite(
            price
        ) ||
        price <= 0
    ) {
        return 1;
    }

    if (
        currentBudget === null ||
        !Number.isFinite(
            currentBudget
        )
    ) {
        return 3;
    }

    if (
        currentBudget <= 0
    ) {
        return 1;
    }

    const usage =
        price /
        currentBudget;

    if (
        usage <= 0.1
    ) {
        return 5;
    }

    if (
        usage <= 0.25
    ) {
        return 4;
    }

    if (
        usage <= 0.4
    ) {
        return 3;
    }

    if (
        usage <= 0.6
    ) {
        return 2;
    }

    return 1;
}

function calculateBudgetAdjustment(
    price,
    currentBudget
) {
    if (
        !Number.isFinite(
            price
        ) ||
        price <= 0 ||
        currentBudget === null ||
        !Number.isFinite(
            currentBudget
        )
    ) {
        return 0;
    }

    if (
        currentBudget <= 0
    ) {
        return -2;
    }

    const usagePercent =
        (
            price /
            currentBudget
        ) *
        100;

    if (
        usagePercent <= 5
    ) {
        return 0.5;
    }

    if (
        usagePercent <= 10
    ) {
        return 0.25;
    }

    if (
        usagePercent <= 40
    ) {
        return 0;
    }

    if (
        usagePercent <= 60
    ) {
        return -0.5;
    }

    if (
        usagePercent <= 80
    ) {
        return -1;
    }

    if (
        usagePercent <= 100
    ) {
        return -1.5;
    }

    return -2;
}

function analyzeDiscount(product) {
    const rawText =
        `${product.title || ""} ${product.rawText || ""}`;

    const text =
        normalizeDiscountText(rawText);

    const currentPrice =
        Number(product.price) || 0;

    const detectedPercentages = [];

    /*
     * CASE 1:
     * Explicit percentage:
     * -15%
     * 15% off
     * έκπτωση 15%
     */
    const percentagePatterns = [
        /(?:έκπτωση|εκπτωση|discount|προσφορά|προσφορα|deal|save|saving)\s*(?:έως|εως|μέχρι|μεχρι|up to|of)?\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%/gi,

        /(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:off|discount|έκπτωση|εκπτωση)/gi,

        /(?:^|\s)-\s*(\d{1,3}(?:[.,]\d+)?)\s*%/gi
    ];

    for (const pattern of percentagePatterns) {
        for (const match of text.matchAll(pattern)) {
            const percentage =
                parseLocalizedNumber(
                    match[1]
                );

            if (
                Number.isFinite(percentage) &&
                percentage > 0 &&
                percentage <= 100
            ) {
                detectedPercentages.push(
                    percentage
                );
            }
        }
    }

    /*
     * If Skroutz explicitly gives us a percentage,
     * this is the strongest evidence.
     */
    if (detectedPercentages.length > 0) {
        const percent =
            roundOne(
                Math.max(
                    ...detectedPercentages
                )
            );

        return {
            percent,
            score:
                discountPercentToRating(
                    percent
                )
        };
    }

    /*
     * CASE 2:
     * Extract every euro amount appearing in the card.
     *
     * Example:
     * 239,00 €
     * από 203,15 €
     * -35,85 € κουπόνι
     */
    const euroAmounts =
        extractDiscountEuroAmounts(
            text
        );

    /*
     * CASE 2A:
     * Explicit monetary discount/coupon.
     */
    const discountAmountPatterns = [
        /-\s*(\d+(?:[.,]\d{1,2})?)\s*€/gi,

        /(?:κουπόνι|κουπονι|coupon|έκπτωση|εκπτωση|discount|save|saving)\s*[:\-]?\s*(\d+(?:[.,]\d{1,2})?)\s*€/gi,

        /(\d+(?:[.,]\d{1,2})?)\s*€\s*(?:κουπόνι|κουπονι|coupon|έκπτωση|εκπτωση|discount)/gi
    ];

    const discountAmounts = [];

    for (
        const pattern of
        discountAmountPatterns
    ) {
        for (
            const match of
            text.matchAll(pattern)
        ) {
            const amount =
                parseLocalizedNumber(
                    match[1]
                );

            if (
                Number.isFinite(amount) &&
                amount > 0
            ) {
                discountAmounts.push(
                    amount
                );
            }
        }
    }

    /*
     * If:
     *
     * current = 203.15
     * discount = 35.85
     *
     * original = 239
     *
     * percentage =
     * 35.85 / 239 * 100
     */
    if (
        currentPrice > 0 &&
        discountAmounts.length > 0
    ) {
        const discountAmount =
            Math.max(
                ...discountAmounts
            );

        const originalPrice =
            currentPrice +
            discountAmount;

        if (
            originalPrice >
            currentPrice
        ) {
            const inferredPercent =
                (
                    discountAmount /
                    originalPrice
                ) *
                100;

            if (
                inferredPercent > 0 &&
                inferredPercent <= 100
            ) {
                const percent =
                    roundOne(
                        inferredPercent
                    );

                return {
                    percent,
                    score:
                        discountPercentToRating(
                            percent
                        )
                };
            }
        }
    }

    /*
     * CASE 3:
     * No explicit coupon amount was recognised,
     * but the card contains an older price which is
     * larger than the current product.price.
     *
     * Example:
     *
     * old price = 239
     * current price = 203.15
     */
    if (
        currentPrice > 0 &&
        euroAmounts.length >= 2
    ) {
        const possibleOriginalPrices =
            euroAmounts.filter(
                (amount) =>
                    amount >
                    currentPrice +
                    0.01
            );

        if (
            possibleOriginalPrices.length > 0
        ) {
            /*
             * Prefer the smallest price that is
             * still larger than the current price.
             *
             * This reduces the chance of accidentally
             * selecting an unrelated large amount.
             */
            const originalPrice =
                Math.min(
                    ...possibleOriginalPrices
                );

            const inferredPercent =
                (
                    (
                        originalPrice -
                        currentPrice
                    ) /
                    originalPrice
                ) *
                100;

            /*
             * Sanity bounds.
             * Ignore tiny differences and absurd values.
             */
            if (
                inferredPercent >= 1 &&
                inferredPercent <= 90
            ) {
                const percent =
                    roundOne(
                        inferredPercent
                    );

                return {
                    percent,
                    score:
                        discountPercentToRating(
                            percent
                        )
                };
            }
        }
    }

    /*
     * Promotion text exists, but we cannot calculate
     * its exact value safely.
     */
    const hasDiscountSignal =
        /έκπτωση|εκπτωση|discount|\boff\b|προσφορά|προσφορα|deal|save|saving|κουπόνι|κουπονι|coupon/i
            .test(text);

    if (hasDiscountSignal) {
        return {
            percent: null,
            score: 3
        };
    }

    return {
        percent: null,
        score: 1
    };
}

function normalizeDiscountText(value) {
    return String(value || "")
        /*
         * Convert Unicode dashes/minus signs
         * used by websites into normal "-".
         */
        .replace(
            /[\u2010\u2011\u2012\u2013\u2014\u2212]/g,
            "-"
        )
        .replace(
            /\u00A0/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .toLowerCase()
        .trim();
}

function parseLocalizedNumber(value) {
    let text =
        String(value || "")
            .trim()
            .replace(/\s/g, "");

    if (!text) {
        return NaN;
    }

    const lastComma =
        text.lastIndexOf(",");

    const lastDot =
        text.lastIndexOf(".");

    if (
        lastComma !== -1 &&
        lastDot !== -1
    ) {
        if (
            lastComma >
            lastDot
        ) {
            text =
                text
                    .replace(/\./g, "")
                    .replace(",", ".");
        } else {
            text =
                text.replace(/,/g, "");
        }
    } else if (
        lastComma !== -1
    ) {
        const decimalDigits =
            text.length -
            lastComma -
            1;

        if (
            decimalDigits === 1 ||
            decimalDigits === 2
        ) {
            text =
                text.replace(
                    ",",
                    "."
                );
        } else {
            text =
                text.replace(
                    /,/g,
                    ""
                );
        }
    }

    const number =
        Number(text);

    return Number.isFinite(number)
        ? number
        : NaN;
}

function extractDiscountEuroAmounts(
    text
) {
    const amounts = [];

    const pattern =
        /(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*€/g;

    for (
        const match of
        String(text || "")
            .matchAll(pattern)
    ) {
        const amount =
            parseLocalizedNumber(
                match[1]
            );

        if (
            Number.isFinite(amount) &&
            amount > 0
        ) {
            amounts.push(
                amount
            );
        }
    }

    return amounts;
}

function discountPercentToRating(
    percent
) {
    if (
        percent >= 60
    ) {
        return 5;
    }

    if (
        percent >= 35
    ) {
        return 4;
    }

    if (
        percent >= 20
    ) {
        return 3;
    }

    if (
        percent >= 10
    ) {
        return 2;
    }

    return 1;
}

function calculateVfmScore(
    product,
    allProducts
) {
    const price =
        Number(
            product.price
        ) || 0;

    if (
        price <= 0
    ) {
        return 1;
    }

    const group =
        detectProductGroup(
            product.title
        );

    const comparablePrices =
        allProducts
            .filter(
                (candidate) =>
                    detectProductGroup(
                        candidate.title
                    ) === group
            )
            .map(
                (candidate) =>
                    Number(
                        candidate.price
                    ) || 0
            )
            .filter(
                (candidatePrice) =>
                    candidatePrice > 0
            );

    if (
        comparablePrices.length <
        2
    ) {
        return 3;
    }

    const averagePrice =
        comparablePrices.reduce(
            (
                sum,
                value
            ) =>
                sum +
                value,
            0
        ) /
        comparablePrices.length;

    if (
        averagePrice <= 0
    ) {
        return 3;
    }

    const ratio =
        price /
        averagePrice;

    if (
        ratio <= 0.7
    ) {
        return 5;
    }

    if (
        ratio <= 0.85
    ) {
        return 4;
    }

    if (
        ratio <= 1
    ) {
        return 3;
    }

    if (
        ratio <= 1.15
    ) {
        return 2;
    }

    return 1;
}

function generateTags(
    budgetScore,
    urgencyScore,
    discountScore,
    vfmScore,
    finalScore,
    discountPercent
) {
    const tags = [];

    if (
        finalScore >= 4
    ) {
        tags.push(
            "Top Priority"
        );
    }

    if (
        budgetScore >= 4
    ) {
        tags.push(
            "Budget Friendly"
        );
    }

    if (
        urgencyScore >= 4
    ) {
        tags.push(
            "High Urgency"
        );
    }

    if (
        discountScore >= 4
    ) {
        tags.push(
            Number.isFinite(
                discountPercent
            )
                ? `${discountPercent}% Discount`
                : "Good Deal"
        );
    }

    if (
        vfmScore >= 4
    ) {
        tags.push(
            "Strong VFM"
        );
    }

    return tags.length === 0
        ? [
            "Lower Priority"
        ]
        : tags;
}

async function applyPlanPresetAndRender(
    planType
) {
    const presetWeights =
        getPlanPresetWeights(
            planType
        );

    elements
        .urgencyWeight
        .value =
        presetWeights
            .urgency;

    elements
        .discountWeight
        .value =
        presetWeights
            .discount;

    updateWeightLabels();

    await saveWeights(
        presetWeights
    );

    await renderProducts();
    await renderSmartWishlist();
}

function getPlanPresetWeights(
    planType
) {
    const presets = {
        budget: {
            urgency: 2,
            discount: 4
        },

        premium: {
            urgency: 5,
            discount: 1
        },

        deal: {
            urgency: 3,
            discount: 5
        }
    };

    return (
        presets[planType] ||
        DEFAULT_WEIGHTS
    );
}

async function renderSmartWishlist() {
    const products =
        await getProducts();

    const listNames =
        await getListNames();

    const weights =
        getWeightsFromInputs();

    const currentBudget =
        getEffectiveBudget();

    if (
        !elements.smartWishlistList
    ) {
        return;
    }

    const activeListName =
        listNames.includes(
            getActivePlanListName()
        )
            ? getActivePlanListName()
            : "MY SMART PLAN";

    if (elements.wishlistTitle) {
        elements.wishlistTitle.textContent =
            activeListName.toUpperCase();
    }

    const allGenericIdeas =
      await getGenericIdeas();

    const activeGenericIdeas =
      allGenericIdeas.filter(
          (idea) =>
              idea.listName ===
              activeListName
      );

    const savedGenericIdeasHtml =
      createSavedGenericIdeasHtml(
          activeGenericIdeas
      );

    const scoredProducts =
        getScoredProducts(
            products,
            weights,
            currentBudget,
            products
        );

    const listProducts =
        scoredProducts.filter(
            (product) =>
                product.isTracked ===
                true &&
                product.listName ===
                activeListName
        );

    if (
        currentBudget === null
    ) {
        setSuggestProductsButtonState(
            false
        );

        elements.smartWishlistList.innerHTML = `
            ${savedGenericIdeasHtml}

            <div class="wishlist-empty">
                ${
                    listProducts.length > 0
                        ? "Set a budget to generate a budget-aware purchase plan for this list."
                        : `The list "${escapeHtml(
                            activeListName
                        )}" is empty. Add products from the left side.`
                }
            </div>
        `;

        return;
    }

    const affordableProducts =
        listProducts.filter(
            (product) => {
                const price =
                    Number(
                        product.price
                    ) || 0;

                if (
                    price <= 0
                ) {
                    return false;
                }

                if (
                    !Number.isFinite(
                        currentBudget
                    )
                ) {
                    return true;
                }

                return (
                    toCents(price) <=
                    toCents(
                        currentBudget
                    )
                );
            }
        );

    if (
        listProducts.length === 0
    ) {
        setSuggestProductsButtonState(
            false
        );

        elements.smartWishlistList.innerHTML = `
            ${
                savedGenericIdeasHtml
            }

            <div class="wishlist-empty">
                ${
                    activeGenericIdeas.length > 0
                        ? "This list currently contains only saved product ideas. Add a real priced product to generate an optimized purchase plan."
                        : `The list "${escapeHtml(
                            activeListName
                        )}" is empty. Add products from the left side. The list itself will remain saved.`
                }
            </div>
        `;

        return;
    }

    if (
        affordableProducts.length ===
        0
    ) {
        setSuggestProductsButtonState(
            false
        );

        elements.smartWishlistList.innerHTML =
            `<div class="wishlist-empty">No products in "${escapeHtml(
                activeListName
            )}" fit your current effective budget.</div>`;

        return;
    }

    const plan =
        generatePurchasePlan(
            groupProducts(
                affordableProducts
            ),
            currentPlanType,
            currentBudget
        );

    if (
        !plan.products ||
        plan.products.length ===
        0
    ) {
        setSuggestProductsButtonState(
            false
        );

        elements.smartWishlistList.innerHTML =
            '<div class="wishlist-empty">No valid combination fits your current budget.</div>';

        return;
    }

    plan.title =
        currentPlanType ===
        "custom"
            ? activeListName
            : `${activeListName} — ${getPlanTitle(
                currentPlanType
            )}`;

    const bestNextPurchase =
        selectBestNextPurchase(
            plan.products,
            currentPlanType
        );

    const canSuggest =
        Number.isFinite(
            currentBudget
        ) &&
        currentBudget > 0 &&
        Number.isFinite(
            plan.remainingBudget
        ) &&
        plan.remainingBudget > 0;

    setSuggestProductsButtonState(
        canSuggest
    );

    const suggestionsHtml =
        showProductSuggestions &&
        canSuggest
            ? createProductSuggestionsHtml(
                plan.products,
                scoredProducts,
                plan.remainingBudget,
                activeListName
            )
            : "";

    elements.smartWishlistList.innerHTML = `
        ${createBestNextPurchaseHtml(
            bestNextPurchase,
            currentBudget,
            activeListName
        )}

        ${createConsumerTipsHtml(
            plan.products,
            currentBudget,
            plan.remainingBudget
        )}

        ${suggestionsHtml}

        ${savedGenericIdeasHtml}

        ${createPurchasePlanHtml(
            plan,
            currentBudget
        )}
    `;

    attachSuggestionListeners();
}

function createSavedGenericIdeasHtml(
    ideas
) {
    if (
        !ideas ||
        ideas.length === 0
    ) {
        return "";
    }

    return `
        <section class="product-suggestions-card">

            <div class="product-suggestions-title">
                SAVED PRODUCT IDEAS
            </div>

            <div class="product-suggestions-description">
                These are generic ideas saved to this list. They are not included in the budget total because their real prices are unknown.
            </div>

            ${ideas
                .map(
                    (idea) => `
                        <div class="suggestion-item">

                            <div class="suggestion-item-top">

                                <div class="suggestion-item-title">
                                    ${escapeHtml(
                                        idea.name
                                    )}
                                </div>

                                <span class="suggestion-badge suggestion-badge-generic">
                                    SAVED IDEA
                                </span>

                            </div>

                        </div>
                    `
                )
                .join("")}

        </section>
    `;
}

function setSuggestProductsButtonState(
    enabled
) {
    if (
        !elements.suggestProductsBtn
    ) {
        return;
    }

    elements.suggestProductsBtn.disabled =
        !enabled;

    elements.suggestProductsBtn.classList.toggle(
        "active",
        showProductSuggestions &&
        enabled
    );

    elements.suggestProductsBtn.textContent =
        showProductSuggestions &&
        enabled
            ? "HIDE SUGGESTIONS"
            : "SUGGEST PRODUCTS";

    if (!enabled) {
        showProductSuggestions =
            false;
    }
}

function createProductSuggestionsHtml(
    selectedProducts,
    scoredProducts,
    remainingBudget,
    activeListName
) {
    const wishlistSuggestions =
        getWishlistProductSuggestions(
            selectedProducts,
            scoredProducts,
            remainingBudget
        );

    const genericSuggestions =
        getGenericProductSuggestions(
            selectedProducts,
            scoredProducts,
            remainingBudget
        );

    const hasAnySuggestion =
        wishlistSuggestions.length > 0 ||
        genericSuggestions.length > 0;

    if (!hasAnySuggestion) {
        return `
            <section class="product-suggestions-card">
                <div class="product-suggestions-header">
                    <div class="product-suggestions-title">
                        PRODUCT SUGGESTIONS
                    </div>

                    <div class="product-suggestions-budget">
                        Remaining:
                        ${formatMoney(
                            remainingBudget
                        )} €
                    </div>
                </div>

                <div class="suggestion-empty">
                    No additional budget-safe suggestions were found for "${escapeHtml(
                        activeListName
                    )}".
                </div>
            </section>
        `;
    }

    const wishlistHtml =
        wishlistSuggestions.length >
        0
            ? `
                <div class="suggestion-section-title">
                    From your Skroutz wishlist
                </div>

                ${wishlistSuggestions
                    .map(
                        (suggestion) =>
                            createWishlistSuggestionHtml(
                                suggestion,
                                remainingBudget,
                                selectedProducts,
                                activeListName
                            )
                    )
                    .join("")}
            `
            : "";

    const genericHtml =
        genericSuggestions.length >
        0
            ? `
                <div class="suggestion-section-title">
                    Related product ideas
                </div>

                ${genericSuggestions
                    .map(
                        (suggestion) =>
                            createGenericSuggestionHtml(
                                suggestion,
                                remainingBudget,
                                selectedProducts,
                                activeListName
                            )
                    )
                    .join("")}
            `
            : "";

    return `
        <section class="product-suggestions-card">
            <div class="product-suggestions-header">
                <div class="product-suggestions-title">
                    PRODUCT SUGGESTIONS
                </div>

                <div class="product-suggestions-budget">
                    Remaining:
                    ${formatMoney(
                        remainingBudget
                    )} €
                </div>
            </div>

            <div class="product-suggestions-description">
                Deterministic suggestions based on the selected list, urgency ratings, season filter, related product themes, and remaining budget.
            </div>

            ${wishlistHtml}
            ${genericHtml}
        </section>
    `;
}

function getWishlistProductSuggestions(
    selectedProducts,
    scoredProducts,
    remainingBudget
) {
    const selectedIds =
        new Set(
            selectedProducts.map(
                (product) =>
                    product.id
            )
        );

    return scoredProducts
        .filter(
            (product) => {
                const price =
                    Number(
                        product.price
                    ) || 0;

                return (
                    !selectedIds.has(
                        product.id
                    ) &&
                    product.isTracked !==
                        true &&
                    product.availability ===
                        "available" &&
                    price > 0 &&
                    toCents(price) <=
                        toCents(
                            remainingBudget
                        )
                );
            }
        )
        .map(
            (product) => ({
                product,

                recommendationScore:
                    calculateRecommendationScore(
                        product,
                        selectedProducts
                    )
            })
        )
        .sort(
            (a, b) => {
                const difference =
                    b.recommendationScore -
                    a.recommendationScore;

                if (
                    Math.abs(
                        difference
                    ) >
                    1e-9
                ) {
                    return difference;
                }

                return (
                    Number(
                        a.product.price
                    ) -
                    Number(
                        b.product.price
                    )
                );
            }
        )
        .slice(
            0,
            4
        );
}

function calculateRecommendationScore(
    product,
    selectedProducts
) {
    const urgency =
        normalizeRating5(
            product
                .scores
                ?.urgency ??
            product
                .urgencyScore,
            DEFAULT_URGENCY_SCORE
        );

    const priority =
        normalizeRating5(
            product.finalScore,
            3
        );

    const compatibility =
        getRecommendationCompatibilityScore(
            product,
            selectedProducts
        );

    const season =
        getRecommendationSeasonScore(
            product
        );

    const discount =
        normalizeRating5(
            product
                .scores
                ?.discount,
            1
        );

    return (
        urgency * 0.35 +
        priority * 0.25 +
        compatibility * 0.25 +
        season * 0.1 +
        discount * 0.05
    );
}

function getRecommendationCompatibilityScore(
    product,
    selectedProducts
) {
    const selectedThemes =
        new Set(
            selectedProducts.flatMap(
                (selectedProduct) =>
                    detectRecommendationThemes(
                        selectedProduct
                    )
            )
        );

    const productThemes =
        detectRecommendationThemes(
            product
        );

    if (
        productThemes.some(
            (theme) =>
                selectedThemes.has(
                    theme
                )
        )
    ) {
        return 5;
    }

    if (
        productThemes.length > 0 &&
        selectedThemes.size > 0
    ) {
        return 3;
    }

    return 2;
}

function getRecommendationSeasonScore(
    product
) {
    const seasons =
        detectProductSeasons(
            product
        );

    if (
        currentSeasonFilter ===
        "all"
    ) {
        return seasons.includes(
            "all"
        )
            ? 3
            : 4;
    }

    if (
        seasons.includes(
            currentSeasonFilter
        )
    ) {
        return 5;
    }

    if (
        seasons.includes(
            "all"
        )
    ) {
        return 3;
    }

    return 1;
}

function buildWishlistSuggestionReason(
    product,
    selectedProducts
) {
    const reasons = [];

    if (
        normalizeRating5(
            product
                .scores
                ?.urgency ??
            product
                .urgencyScore,
            DEFAULT_URGENCY_SCORE
        ) >= 4
    ) {
        reasons.push(
            "high urgency"
        );
    }

    if (
        getRecommendationCompatibilityScore(
            product,
            selectedProducts
        ) >= 5
    ) {
        reasons.push(
            "complements products already in your plan"
        );
    }

    if (
        getRecommendationSeasonScore(
            product
        ) >= 5
    ) {
        reasons.push(
            `matches your ${currentSeasonFilter} filter`
        );
    }

    if (
        normalizeRating5(
            product
                .scores
                ?.discount,
            1
        ) >= 4
    ) {
        reasons.push(
            "strong discount"
        );
    }

    if (
        reasons.length === 0
    ) {
        return "Fits your remaining budget and has a competitive current priority score.";
    }

    return `Suggested because it has ${reasons.join(
        ", "
    )}.`;
}

function createWishlistSuggestionHtml(
    suggestion,
    remainingBudget,
    selectedProducts,
    activeListName
) {
    const product =
        suggestion.product;

    return `
        <div class="suggestion-item">
            <div class="suggestion-item-top">
                <div class="suggestion-item-title">
                    ${escapeHtml(
                        product.title
                    )}
                </div>

                <span class="suggestion-badge suggestion-badge-wishlist">
                    WISHLIST MATCH
                </span>
            </div>

            <div class="suggestion-item-meta">
                ${formatMoney(
                    product.price
                )} €
                · Urgency
                ${formatRating(
                    product
                        .scores
                        ?.urgency ??
                    product
                        .urgencyScore
                )}/5
                · Score
                ${formatRating(
                    product.finalScore
                )}/5
            </div>

            <div class="suggestion-item-reason">
                ${escapeHtml(
                    buildWishlistSuggestionReason(
                        product,
                        selectedProducts
                    )
                )}
            </div>

            <button
                class="suggestion-add-button"
                data-suggestion-product-id="${escapeHtml(
                    product.id
                )}"
                data-target-list="${escapeHtml(
                    activeListName
                )}"
                type="button"
            >
                ADD TO ${escapeHtml(
                    activeListName
                ).toUpperCase()}
            </button>
        </div>
    `;
}

function getGenericProductSuggestions(
    selectedProducts,
    scoredProducts,
    remainingBudget
) {
    const selectedThemes =
        new Set(
            selectedProducts.flatMap(
                (product) =>
                    detectRecommendationThemes(
                        product
                    )
            )
        );

    const allExistingText =
        scoredProducts
            .map(
                (product) =>
                    `${product.title || ""} ${product.rawText || ""}`
                        .toLowerCase()
            )
            .join(" ");

    const ranked =
        getGenericSuggestionCatalog()
            .filter(
                (item) =>
                    !item.keywords.some(
                        (keyword) =>
                            allExistingText.includes(
                                keyword
                            )
                    )
            )
            .map(
                (item) => {
                    const themeMatch =
                        item.themes.some(
                            (theme) =>
                                selectedThemes.has(
                                    theme
                                )
                        );

                    const seasonMatch =
                        currentSeasonFilter !==
                            "all" &&
                        item.seasons.includes(
                            currentSeasonFilter
                        );

                    const allSeason =
                        item.seasons.includes(
                            "all"
                        );

                    let score = 0;

                    if (
                        themeMatch
                    ) {
                        score += 5;
                    }

                    if (
                        seasonMatch
                    ) {
                        score += 3;
                    } else if (
                        currentSeasonFilter ===
                            "all"
                    ) {
                        score += 1;
                    } else if (
                        allSeason
                    ) {
                        score += 1;
                    }

                    return {
                        ...item,
                        score
                    };
                }
            )
            .filter(
                (item) =>
                    item.score > 0
            )
            .sort(
                (a, b) =>
                    b.score -
                        a.score ||
                    a.name.localeCompare(
                        b.name
                    )
            )
            .slice(
                0,
                4
            );

    const budgetCeiling =
        ranked.length > 0
            ? Math.max(
                0,
                roundMoney(
                    remainingBudget /
                    ranked.length
                )
            )
            : 0;

    return ranked.map(
        (item) => ({
            ...item,
            budgetCeiling
        })
    );
}

function createGenericSuggestionHtml(
    suggestion,
    remainingBudget,
    selectedProducts,
    activeListName
) {
    const selectedThemes =
        new Set(
            selectedProducts.flatMap(
                (product) =>
                    detectRecommendationThemes(
                        product
                    )
            )
        );

    const reasonParts = [];

    if (
        suggestion.themes.some(
            (theme) =>
                selectedThemes.has(
                    theme
                )
        )
    ) {
        reasonParts.push(
            "complements the products already in your plan"
        );
    }

    if (
        currentSeasonFilter !==
            "all" &&
        suggestion.seasons.includes(
            currentSeasonFilter
        )
    ) {
        reasonParts.push(
            `fits your ${currentSeasonFilter} filter`
        );
    }

    const reason =
        reasonParts.length > 0
            ? `Suggested because it ${reasonParts.join(
                " and "
            )}.`
            : "Suggested as a related product type for your current list.";

    return `
        <div class="suggestion-item">

            <div class="suggestion-item-top">

                <div class="suggestion-item-title">
                    ${escapeHtml(
                        suggestion.name
                    )}
                </div>

                <span class="suggestion-badge suggestion-badge-generic">
                    PRODUCT IDEA
                </span>

            </div>

            <div class="suggestion-item-meta">
                Suggested budget ceiling:
                up to
                ${formatMoney(
                    Math.min(
                        suggestion.budgetCeiling,
                        remainingBudget
                    )
                )} €
            </div>

            <div class="suggestion-item-reason">
                ${escapeHtml(
                    reason
                )}
                This is a generic product type only. No real Skroutz price is assumed.
            </div>

            <div class="suggestion-action-row">

                <a
                    href="https://www.skroutz.gr/search?keyphrase=${encodeURIComponent(
                        suggestion.name
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="suggestion-action-button"
                >
                    SEARCH ON SKROUTZ
                </a>

                <button
                    type="button"
                    class="suggestion-action-button generic-suggestion-add-button"
                    data-generic-name="${escapeHtml(
                        suggestion.name
                    )}"
                    data-target-list="${escapeHtml(
                        activeListName
                    )}"
                >
                    ADD TO ${escapeHtml(
                        activeListName
                    ).toUpperCase()}
                </button>

            </div>

        </div>
    `;
}

function detectRecommendationThemes(
    product
) {
    const text =
        `${product.title || ""} ${product.rawText || ""}`
            .toLowerCase();

    const themes =
        new Set();

    const hasAny =
        (keywords) =>
            keywords.some(
                (keyword) =>
                    containsSearchTerm(
                        text,
                        keyword
                    )
            );

    if (
        hasAny([
            "swimsuit",
            "swimwear",
            "bikini",
            "flip flop",
            "flip-flop",
            "sandals",
            "beach",
            "sunscreen",
            "sun cream",
            "sunglasses",
            "μαγιό",
            "σαγιονάρ",
            "παραλία",
            "αντηλιακό",
            "γυαλιά ηλίου"
        ])
    ) {
        themes.add(
            "beach"
        );
    }

    if (
        hasAny([
            "jacket",
            "coat",
            "parka",
            "puffer",
            "scarf",
            "gloves",
            "beanie",
            "thermal",
            "boots",
            "μπουφάν",
            "παλτό",
            "κασκόλ",
            "γάντια",
            "σκούφος",
            "θερμικό",
            "μπότες"
        ])
    ) {
        themes.add(
            "winter"
        );
    }

    if (
        hasAny([
            "iphone",
            "galaxy",
            "smartphone",
            "phone",
            "κινητό",
            "θήκη",
            "case",
            "screen protector",
            "charger",
            "φορτιστής",
            "power bank"
        ])
    ) {
        themes.add(
            "phone"
        );
    }

    if (
        hasAny([
            "laptop",
            "monitor",
            "keyboard",
            "mouse",
            "usb-c",
            "usb c",
            "hub",
            "laptop stand",
            "laptop sleeve",
            "οθόνη",
            "πληκτρολόγιο",
            "ποντίκι"
        ])
    ) {
        themes.add(
            "computer"
        );
    }

    if (
        hasAny([
            "headphones",
            "earbuds",
            "airpods",
            "speaker",
            "audio",
            "ακουστικά",
            "ηχείο"
        ])
    ) {
        themes.add(
            "audio"
        );
    }

    if (
        hasAny([
            "gym",
            "fitness",
            "dumbbell",
            "workout",
            "resistance band",
            "βαράκια",
            "γυμναστήριο"
        ])
    ) {
        themes.add(
            "fitness"
        );
    }

    if (
        hasAny([
            "backpack",
            "suitcase",
            "travel",
            "luggage",
            "βαλίτσα",
            "ταξίδι",
            "τσάντα ταξιδίου"
        ])
    ) {
        themes.add(
            "travel"
        );
    }

    if (
        hasAny([
            "pan",
            "pot",
            "blender",
            "knife",
            "cutting board",
            "kitchen",
            "τηγάνι",
            "κατσαρόλα",
            "μπλέντερ",
            "μαχαίρι"
        ])
    ) {
        themes.add(
            "kitchen"
        );
    }

    if (
        hasAny([
            "book",
            "notebook",
            "pen",
            "study",
            "βιβλίο",
            "τετράδιο",
            "στυλό"
        ])
    ) {
        themes.add(
            "study"
        );
    }

    if (
        hasAny([
            "desk",
            "office chair",
            "desk lamp",
            "home office",
            "γραφείο",
            "καρέκλα γραφείου",
            "λάμπα γραφείου"
        ])
    ) {
        themes.add(
            "home-office"
        );
    }

    return Array.from(
        themes
    );
}

function getGenericSuggestionCatalog() {
    return [
        {
            name: "Sunscreen",
            themes: ["beach"],
            seasons: ["summer"],
            keywords: [
                "sunscreen",
                "sun cream",
                "αντηλιακό"
            ]
        },

        {
            name: "Sunglasses",
            themes: ["beach"],
            seasons: ["summer"],
            keywords: [
                "sunglasses",
                "γυαλιά ηλίου"
            ]
        },

        {
            name: "Beach Towel",
            themes: ["beach"],
            seasons: ["summer"],
            keywords: [
                "beach towel",
                "πετσέτα παραλίας"
            ]
        },

        {
            name: "Beach Bag",
            themes: [
                "beach",
                "travel"
            ],
            seasons: ["summer"],
            keywords: [
                "beach bag",
                "τσάντα παραλίας"
            ]
        },

        {
            name: "Scarf",
            themes: ["winter"],
            seasons: ["winter"],
            keywords: [
                "scarf",
                "κασκόλ"
            ]
        },

        {
            name: "Gloves",
            themes: ["winter"],
            seasons: ["winter"],
            keywords: [
                "gloves",
                "γάντια"
            ]
        },

        {
            name: "Beanie",
            themes: ["winter"],
            seasons: ["winter"],
            keywords: [
                "beanie",
                "σκούφος"
            ]
        },

        {
            name: "Thermal Socks",
            themes: ["winter"],
            seasons: ["winter"],
            keywords: [
                "thermal socks",
                "θερμικές κάλτσες"
            ]
        },

        {
            name: "Phone Case",
            themes: ["phone"],
            seasons: ["all"],
            keywords: [
                "phone case",
                "θήκη κινητού"
            ]
        },

        {
            name: "Screen Protector",
            themes: ["phone"],
            seasons: ["all"],
            keywords: [
                "screen protector",
                "προστατευτικό οθόνης"
            ]
        },

        {
            name: "Power Bank",
            themes: [
                "phone",
                "travel"
            ],
            seasons: ["all"],
            keywords: [
                "power bank"
            ]
        },

        {
            name: "Fast Charger",
            themes: [
                "phone",
                "computer"
            ],
            seasons: ["all"],
            keywords: [
                "fast charger",
                "ταχυφορτιστής"
            ]
        },

        {
            name: "Laptop Stand",
            themes: [
                "computer",
                "home-office"
            ],
            seasons: ["all"],
            keywords: [
                "laptop stand",
                "βάση laptop"
            ]
        },

        {
            name: "Wireless Mouse",
            themes: [
                "computer",
                "home-office"
            ],
            seasons: ["all"],
            keywords: [
                "wireless mouse",
                "ασύρματο ποντίκι"
            ]
        },

        {
            name: "USB-C Hub",
            themes: [
                "computer",
                "travel"
            ],
            seasons: ["all"],
            keywords: [
                "usb-c hub",
                "usb c hub"
            ]
        },

        {
            name: "Laptop Sleeve",
            themes: [
                "computer",
                "travel"
            ],
            seasons: ["all"],
            keywords: [
                "laptop sleeve",
                "θήκη laptop"
            ]
        },

        {
            name: "Headphone Case",
            themes: [
                "audio",
                "travel"
            ],
            seasons: ["all"],
            keywords: [
                "headphone case",
                "θήκη ακουστικών"
            ]
        },

        {
            name: "Audio Adapter",
            themes: [
                "audio",
                "phone",
                "computer"
            ],
            seasons: ["all"],
            keywords: [
                "audio adapter",
                "αντάπτορας ήχου"
            ]
        },

        {
            name: "Gym Water Bottle",
            themes: ["fitness"],
            seasons: ["all"],
            keywords: [
                "gym water bottle",
                "μπουκάλι γυμναστηρίου"
            ]
        },

        {
            name: "Gym Bag",
            themes: [
                "fitness",
                "travel"
            ],
            seasons: ["all"],
            keywords: [
                "gym bag",
                "τσάντα γυμναστηρίου"
            ]
        },

        {
            name: "Resistance Bands",
            themes: ["fitness"],
            seasons: ["all"],
            keywords: [
                "resistance bands",
                "λάστιχα αντίστασης"
            ]
        },

        {
            name: "Travel Adapter",
            themes: ["travel"],
            seasons: ["all"],
            keywords: [
                "travel adapter",
                "αντάπτορας ταξιδιού"
            ]
        },

        {
            name: "Luggage Organizer",
            themes: ["travel"],
            seasons: ["all"],
            keywords: [
                "luggage organizer",
                "packing cubes"
            ]
        },

        {
            name: "Neck Pillow",
            themes: ["travel"],
            seasons: ["all"],
            keywords: [
                "neck pillow",
                "μαξιλάρι ταξιδιού"
            ]
        },

        {
            name: "Cutting Board",
            themes: ["kitchen"],
            seasons: ["all"],
            keywords: [
                "cutting board",
                "επιφάνεια κοπής"
            ]
        },

        {
            name: "Kitchen Scale",
            themes: ["kitchen"],
            seasons: ["all"],
            keywords: [
                "kitchen scale",
                "ζυγαριά κουζίνας"
            ]
        },

        {
            name: "Food Containers",
            themes: ["kitchen"],
            seasons: ["all"],
            keywords: [
                "food containers",
                "δοχεία φαγητού"
            ]
        },

        {
            name: "Desk Lamp",
            themes: [
                "study",
                "home-office"
            ],
            seasons: ["all"],
            keywords: [
                "desk lamp",
                "λάμπα γραφείου"
            ]
        },

        {
            name: "Pen Set",
            themes: ["study"],
            seasons: ["all"],
            keywords: [
                "pen set",
                "σετ στυλό"
            ]
        }
    ];
}

function attachSuggestionListeners() {
    document
        .querySelectorAll(
            ".suggestion-add-button"
        )
        .forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        await addSuggestedWishlistProduct(
                            button
                                .dataset
                                .suggestionProductId,
                            button
                                .dataset
                                .targetList
                        );
                    }
                );
            }
        );

    document
        .querySelectorAll(
            ".generic-suggestion-add-button"
        )
        .forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        await addGenericSuggestionToList(
                            button
                                .dataset
                                .genericName,
                            button
                                .dataset
                                .targetList
                        );
                    }
                );
            }
        );
}

async function addSuggestedWishlistProduct(
    productId,
    targetListName
) {
    const products =
        await getProducts();

    const weights =
        getWeightsFromInputs();

    const currentBudget =
        getEffectiveBudget();

    if (
        !Number.isFinite(
            currentBudget
        ) ||
        currentBudget <= 0
    ) {
        alert(
            "Enter a valid budget before adding a suggested product."
        );

        return;
    }

    const listName =
        await ensureListName(
            targetListName ||
            getActivePlanListName()
        );

    const scoredProducts =
        getScoredProducts(
            products,
            weights,
            currentBudget,
            products
        );

    const currentListProducts =
        scoredProducts.filter(
            (product) =>
                product.isTracked === true &&
                product.listName ===
                    listName &&
                Number(
                    product.price
                ) > 0 &&
                toCents(
                    product.price
                ) <=
                toCents(
                    currentBudget
                )
        );

    const currentPlan =
        generatePurchasePlan(
            groupProducts(
                currentListProducts
            ),
            currentPlanType,
            currentBudget
        );

    const targetProduct =
        scoredProducts.find(
            (product) =>
                product.id ===
                productId
        );

    if (!targetProduct) {
        return;
    }

    const targetPrice =
        Number(
            targetProduct.price
        ) || 0;

    if (
        targetPrice <= 0 ||
        toCents(
            targetPrice
        ) >
        toCents(
            currentPlan
                .remainingBudget
        )
    ) {
        alert(
            "This product no longer fits the remaining budget of the selected list."
        );

        await renderSmartWishlist();

        return;
    }

    const updatedProducts =
        products.map(
            (product) => {
                if (
                    product.id !==
                    productId
                ) {
                    return product;
                }

                return {
                    ...product,

                    isTracked:
                        true,

                    listName
                };
            }
        );

    currentView =
        listName;

    await saveProducts(
        updatedProducts
    );

    await renderProducts();
    await renderSmartWishlist();
}

function selectBestNextPurchase(
    products,
    planType
) {
    if (
        !Array.isArray(products) ||
        products.length === 0
    ) {
        return null;
    }

    const grouped =
        new Map();

    products.forEach(
        (product) => {
            const groupName =
                product.groupName ||
                detectProductGroup(
                    product.title
                );

            if (
                !grouped.has(
                    groupName
                )
            ) {
                grouped.set(
                    groupName,
                    []
                );
            }

            grouped
                .get(
                    groupName
                )
                .push(
                    product
                );
        }
    );

    return [
        ...products
    ].sort(
        (a, b) => {
            const aGroup =
                grouped.get(
                    a.groupName ||
                    detectProductGroup(
                        a.title
                    )
                ) || [
                    a
                ];

            const bGroup =
                grouped.get(
                    b.groupName ||
                    detectProductGroup(
                        b.title
                    )
                ) || [
                    b
                ];

            const difference =
                getPlanUtility(
                    b,
                    planType,
                    bGroup
                ) -
                getPlanUtility(
                    a,
                    planType,
                    aGroup
                );

            if (
                Math.abs(
                    difference
                ) >
                1e-9
            ) {
                return difference;
            }

            return (
                Number(
                    b.finalScore
                ) -
                Number(
                    a.finalScore
                )
            );
        }
    )[0];
}

function createBestNextPurchaseHtml(
    product,
    currentBudget,
    activeListName =
        "MY SMART PLAN"
) {
    if (!product) {
        return "";
    }

    const risk =
        getProductRiskWarning(
            product,
            currentBudget
        );

    return `
        <details
            class="best-next-card"
            open
        >
            <summary
                class="best-next-label card-summary"
            >
                BEST NEXT PURCHASE
            </summary>

            <div class="card-content">
                <div class="best-next-title">
                    ${escapeHtml(
                        product.title
                    )}
                </div>

                <div class="best-next-meta">
                    ${formatMoney(
                        product.price
                    )} €
                    · Score
                    ${formatRating(
                        product.finalScore
                    )}/5
                </div>

                ${createPurchaseReadinessHtml(
                    product,
                    currentBudget
                )}

                <div class="decision-reason">
                    Reason: Strongest next-purchase utility within the optimized "${escapeHtml(
                        activeListName
                    )}" plan under the current plan rules and effective budget.
                </div>

                ${
                    risk
                        ? `<div class="risk-warning">${escapeHtml(
                            risk
                        )}</div>`
                        : ""
                }
            </div>
        </details>
    `;
}

function createConsumerTipsHtml(
    selectedProducts,
    currentBudget,
    remainingBudget
) {
    if (
        !selectedProducts ||
        selectedProducts.length ===
            0
    ) {
        return "";
    }

    const totalSpentCents =
        selectedProducts.reduce(
            (
                sum,
                product
            ) =>
                sum +
                toCents(
                    product.price
                ),
            0
        );

    const budgetUsage =
        Number.isFinite(
            currentBudget
        ) &&
        currentBudget > 0
            ? (
                totalSpentCents /
                toCents(
                    currentBudget
                )
            ) *
            100
            : 0;

    const mostExpensiveProduct =
        [
            ...selectedProducts
        ].sort(
            (a, b) =>
                Number(
                    b.price || 0
                ) -
                Number(
                    a.price || 0
                )
        )[0];

    const bestValueProduct =
        [
            ...selectedProducts
        ].sort(
            (a, b) => {
                const difference =
                    Number(
                        b.scores?.vfm ||
                        0
                    ) -
                    Number(
                        a.scores?.vfm ||
                        0
                    );

                if (
                    difference !== 0
                ) {
                    return difference;
                }

                return (
                    Number(
                        b.finalScore ||
                        0
                    ) -
                    Number(
                        a.finalScore ||
                        0
                    )
                );
            }
        )[0];

    const averageReadiness =
        selectedProducts.reduce(
            (
                sum,
                product
            ) =>
                sum +
                calculatePurchaseReadiness(
                    product,
                    currentBudget
                ),
            0
        ) /
        selectedProducts.length;

    const tips = [];

    tips.push(
        `Average purchase readiness: ${Math.round(
            averageReadiness
        )}%.`
    );

    if (
        averageReadiness >= 80
    ) {
        tips.push(
            "This wishlist has strong overall purchase readiness."
        );
    } else if (
        averageReadiness >= 65
    ) {
        tips.push(
            "This wishlist is reasonable, but some products may need review."
        );
    } else {
        tips.push(
            "This wishlist has weak purchase readiness. Review expensive or low-score items."
        );
    }

    if (
        Number.isFinite(
            currentBudget
        )
    ) {
        if (
            budgetUsage >= 90
        ) {
            tips.push(
                "Your wishlist uses almost all of your effective budget. Consider removing one low-priority item."
            );
        } else if (
            budgetUsage <= 60
        ) {
            tips.push(
                "You still have enough budget flexibility. You can safely add another useful item."
            );
        } else {
            tips.push(
                "Your wishlist has a balanced budget usage."
            );
        }
    }

    if (
        mostExpensiveProduct
    ) {
        tips.push(
            `Most expensive selected item: ${mostExpensiveProduct.title}.`
        );
    }

    if (
        bestValueProduct
    ) {
        tips.push(
            `Best value-for-money item within its detected category: ${bestValueProduct.title}.`
        );
    }

    if (
        remainingBudget > 0 &&
        Number.isFinite(
            remainingBudget
        )
    ) {
        tips.push(
            `Remaining budget available: ${formatMoney(
                remainingBudget
            )} €.`
        );
    }

    return `
        <details
            class="consumer-tips-card"
            open
        >
            <summary
                class="consumer-tips-title card-summary"
            >
                Useful Decision Tips
            </summary>

            <div class="card-content">
                ${tips
                    .map(
                        (tip) =>
                            `<div class="consumer-tip">• ${escapeHtml(
                                tip
                            )}</div>`
                    )
                    .join("")}
            </div>
        </details>
    `;
}

function groupProducts(products) {
    const groups = {};

    products.forEach(
        (product) => {
            const group =
                detectProductGroup(
                    product.title
                );

            if (
                !groups[group]
            ) {
                groups[group] =
                    [];
            }

            groups[group].push(
                product
            );
        }
    );

    return groups;
}

function containsSearchTerm(
    text,
    term
) {
    const source =
        String(
            text || ""
        ).toLowerCase();

    const keyword =
        String(
            term || ""
        ).toLowerCase();

    if (!keyword) {
        return false;
    }

    if (
        /^[a-z0-9]+(?:[ -][a-z0-9]+)*$/.test(
            keyword
        )
    ) {
        const escaped =
            keyword.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

        const pattern =
            new RegExp(
                `(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`,
                "i"
            );

        return pattern.test(
            source
        );
    }

    return source.includes(
        keyword
    );
}

function detectProductGroup(title) {
    const text =
        String(
            title || ""
        ).toLowerCase();

    const hasAny =
        (terms) =>
            terms.some(
                (term) =>
                    containsSearchTerm(
                        text,
                        term
                    )
            );

    if (
        hasAny([
            "airpods",
            "earbud",
            "earbuds",
            "headphone",
            "headphones",
            "ακουστικά"
        ])
    ) {
        return "Audio";
    }

    if (
        hasAny([
            "φορτιστής",
            "charger",
            "cable",
            "power bank"
        ])
    ) {
        return "Charging Accessory";
    }

    if (
        hasAny([
            "θήκη",
            "case",
            "cover",
            "σιλικόνης"
        ])
    ) {
        return "Case";
    }

    if (
        hasAny([
            "iphone",
            "galaxy",
            "smartphone",
            "κινητό"
        ])
    ) {
        return "Phone";
    }

    if (
        hasAny([
            "macbook",
            "laptop",
            "monitor",
            "keyboard",
            "οθόνη"
        ])
    ) {
        return "Computer";
    }

    if (
        hasAny([
            "jacket",
            "coat",
            "μπουφάν",
            "παλτό"
        ])
    ) {
        return "Winter Clothing";
    }

    if (
        hasAny([
            "pan",
            "pot",
            "blender",
            "κατσαρόλα",
            "τηγάνι"
        ])
    ) {
        return "Kitchen";
    }

    if (
        hasAny([
            "book",
            "notebook",
            "βιβλίο",
            "τετράδιο"
        ])
    ) {
        return "Study";
    }

    if (
        hasAny([
            "gym",
            "fitness",
            "dumbbell",
            "βαράκια"
        ])
    ) {
        return "Fitness";
    }

    if (
        hasAny([
            "desk",
            "chair",
            "γραφείο",
            "καρέκλα"
        ])
    ) {
        return "Home Office";
    }

    if (
        hasAny([
            "backpack",
            "suitcase",
            "βαλίτσα",
            "τσάντα"
        ])
    ) {
        return "Travel";
    }

    return "Other";
}

function generatePurchasePlan(
    groupedProducts,
    planType,
    maxBudget = Infinity
) {
    const desiredGroups = [
        "Phone",
        "Case",
        "Charging Accessory",
        "Audio",
        "Computer",
        "Winter Clothing",
        "Kitchen",
        "Study",
        "Fitness",
        "Home Office",
        "Travel",
        "Other"
    ];

    const groupEntries =
        desiredGroups
            .map(
                (groupName) => ({
                    groupName,

                    products:
                        (
                            groupedProducts[
                                groupName
                            ] ||
                            []
                        ).filter(
                            (product) =>
                                Number(
                                    product.price
                                ) > 0
                        )
                })
            )
            .filter(
                (entry) =>
                    entry.products
                        .length >
                    0
            );

    if (
        groupEntries.length ===
        0
    ) {
        return emptyPlan(
            planType,
            maxBudget
        );
    }

    let selectedProducts;

    if (
        !Number.isFinite(
            maxBudget
        )
    ) {
        selectedProducts =
            groupEntries
                .map(
                    ({
                        groupName,
                        products
                    }) => {
                        const selected =
                            [
                                ...products
                            ].sort(
                                (a, b) =>
                                    getPlanUtility(
                                        b,
                                        planType,
                                        products
                                    ) -
                                    getPlanUtility(
                                        a,
                                        planType,
                                        products
                                    )
                            )[0];

                        if (!selected) {
                            return null;
                        }

                        const utility =
                            getPlanUtility(
                                selected,
                                planType,
                                products
                            );

                        if (
                            utility <=
                            getPlanInclusionThreshold(
                                planType
                            )
                        ) {
                            return null;
                        }

                        return {
                            groupName,
                            ...selected
                        };
                    }
                )
                .filter(
                    Boolean
                );
    } else {
        selectedProducts =
            optimizePlanUnderBudget(
                groupEntries,
                planType,
                toCents(
                    maxBudget
                )
            );
    }

    const totalCents =
        selectedProducts.reduce(
            (
                sum,
                product
            ) =>
                sum +
                toCents(
                    product.price
                ),
            0
        );

    const remainingBudget =
        Number.isFinite(
            maxBudget
        )
            ? fromCents(
                Math.max(
                    0,
                    toCents(
                        maxBudget
                    ) -
                    totalCents
                )
            )
            : Infinity;

    return {
        type:
            planType,

        title:
            getPlanTitle(
                planType
            ),

        description:
            getPlanDescription(
                planType
            ),

        products:
            selectedProducts,

        totalPrice:
            fromCents(
                totalCents
            ),

        remainingBudget
    };
}

function optimizePlanUnderBudget(
    groupEntries,
    planType,
    budgetCents
) {
    let states = [
        {
            costCents: 0,
            utility: 0,
            products: []
        }
    ];

    for (
        const {
            groupName,
            products
        } of groupEntries
    ) {
        const nextByCost =
            new Map();

        for (
            const state of
            states
        ) {
            keepBetterState(
                nextByCost,
                state
            );
        }

        for (
            const state of
            states
        ) {
            for (
                const product of
                products
            ) {
                const productCost =
                    toCents(
                        product.price
                    );

                const newCost =
                    state.costCents +
                    productCost;

                if (
                    productCost <= 0 ||
                    newCost >
                        budgetCents
                ) {
                    continue;
                }

                const utility =
                    getPlanUtility(
                        product,
                        planType,
                        products
                    );

                const marginalUtility =
                    utility -
                    getPlanInclusionThreshold(
                        planType
                    );

                if (
                    marginalUtility <=
                    0
                ) {
                    continue;
                }

                keepBetterState(
                    nextByCost,
                    {
                        costCents:
                            newCost,

                        utility:
                            state.utility +
                            marginalUtility,

                        products: [
                            ...state.products,

                            {
                                groupName,
                                ...product
                            }
                        ]
                    }
                );
            }
        }

        states =
            pruneDominatedStates(
                Array.from(
                    nextByCost.values()
                )
            );
    }

    const bestState =
        states.sort(
            (a, b) => {
                const difference =
                    b.utility -
                    a.utility;

                if (
                    Math.abs(
                        difference
                    ) >
                    1e-9
                ) {
                    return difference;
                }

                return (
                    a.costCents -
                    b.costCents
                );
            }
        )[0];

    return (
        bestState
            ?.products ||
        []
    );
}

function keepBetterState(
    map,
    state
) {
    const existing =
        map.get(
            state.costCents
        );

    if (
        !existing ||
        state.utility >
            existing.utility
    ) {
        map.set(
            state.costCents,
            state
        );
    }
}

function pruneDominatedStates(
    states
) {
    const sorted =
        [
            ...states
        ].sort(
            (a, b) =>
                a.costCents -
                b.costCents
        );

    const frontier = [];

    let bestUtilitySoFar =
        -Infinity;

    for (
        const state of
        sorted
    ) {
        if (
            state.utility >
            bestUtilitySoFar +
                1e-9
        ) {
            frontier.push(
                state
            );

            bestUtilitySoFar =
                state.utility;
        }
    }

    return frontier;
}

function getPlanInclusionThreshold(
    planType
) {
    if (
        planType ===
        "premium"
    ) {
        return 2.5;
    }

    if (
        planType ===
        "deal"
    ) {
        return 2.5;
    }

    if (
        planType ===
        "budget"
    ) {
        return 2.5;
    }

    return 2.5;
}

function getPlanUtility(
    product,
    planType,
    groupProducts
) {
    const priority =
        normalizeRating5(
            product.finalScore,
            3
        );

    const discount =
        normalizeRating5(
            product
                .scores
                ?.discount,
            1
        );

    const budgetFit =
        normalizeRating5(
            product
                .scores
                ?.budget,
            3
        );

    const vfm =
        normalizeRating5(
            product
                .scores
                ?.vfm,
            3
        );

    if (
        planType ===
        "budget"
    ) {
        return (
            budgetFit *
                0.55 +
            priority *
                0.3 +
            vfm *
                0.15
        );
    }

    if (
        planType ===
        "premium"
    ) {
        const premiumPriceScore =
            calculateRelativePriceRating(
                product,
                groupProducts
            );

        return (
            premiumPriceScore *
                0.6 +
            priority *
                0.4
        );
    }

    if (
        planType ===
        "deal"
    ) {
        return (
            discount *
                0.65 +
            priority *
                0.35
        );
    }

    return priority;
}

function calculateRelativePriceRating(
    product,
    groupProducts
) {
    const prices =
        groupProducts
            .map(
                (candidate) =>
                    Number(
                        candidate.price
                    ) || 0
            )
            .filter(
                (price) =>
                    price > 0
            );

    const price =
        Number(
            product.price
        ) || 0;

    if (
        prices.length < 2 ||
        price <= 0
    ) {
        return 3;
    }

    const min =
        Math.min(
            ...prices
        );

    const max =
        Math.max(
            ...prices
        );

    if (
        min === max
    ) {
        return 3;
    }

    return clampNumber(
        1 +
            (
                (
                    price -
                    min
                ) /
                (
                    max -
                    min
                )
            ) *
            4,
        SCORE_MIN,
        SCORE_MAX
    );
}

function emptyPlan(
    planType,
    maxBudget
) {
    return {
        type:
            planType,

        title:
            getPlanTitle(
                planType
            ),

        description:
            getPlanDescription(
                planType
            ),

        products: [],

        totalPrice: 0,

        remainingBudget:
            Number.isFinite(
                maxBudget
            )
                ? maxBudget
                : Infinity
    };
}

function getPlanTitle(
    planType
) {
    if (
        planType ===
        "budget"
    ) {
        return "Budget Plan";
    }

    if (
        planType ===
        "premium"
    ) {
        return "Premium Plan";
    }

    if (
        planType ===
        "deal"
    ) {
        return "Deal Hunter Plan";
    }

    return "My Smart Plan";
}

function getPlanDescription(
    planType
) {
    if (
        planType ===
        "budget"
    ) {
        return "Optimizes budget fit, priority and value for money.";
    }

    if (
        planType ===
        "premium"
    ) {
        return "Prioritizes higher-priced options while respecting priority and budget.";
    }

    if (
        planType ===
        "deal"
    ) {
        return "Optimizes discount strength and final priority.";
    }

    return "Selects worthwhile high-priority purchases under your effective budget without adding low-value items just to use more budget.";
}

function createPurchasePlanHtml(
    plan,
    currentBudget
) {
    if (
        !plan.products ||
        plan.products.length ===
            0
    ) {
        return `
            <article class="plan-card">
                <div class="plan-title">
                    ${escapeHtml(
                        plan.title
                    )}
                </div>

                <div class="plan-description">
                    No valid combination fits your current budget.
                </div>
            </article>
        `;
    }

    const explanation =
        getPlanExplanation(
            plan.type
        );

    const risk =
        getPlanRiskWarning(
            plan.totalPrice,
            currentBudget,
            plan.remainingBudget
        );

    const remainingBudgetText =
        Number.isFinite(
            plan.remainingBudget
        )
            ? `${formatMoney(
                plan.remainingBudget
            )} €`
            : "Not limited";

    return `
        <article class="plan-card">
            <div class="plan-title">
                ${escapeHtml(
                    plan.title
                )}
            </div>

            <div class="plan-description">
                ${escapeHtml(
                    plan.description
                )}
            </div>

            <div class="decision-box">
                <div class="decision-box-title">
                    Why this plan?
                </div>

                <div>
                    ${escapeHtml(
                        explanation
                    )}
                </div>
            </div>

            <div class="plan-total">
                Total:
                ${formatMoney(
                    plan.totalPrice
                )} €
            </div>

            <div class="plan-description">
                Remaining budget:
                ${remainingBudgetText}
            </div>

            ${
                risk
                    ? `<div class="risk-warning">${escapeHtml(
                        risk
                    )}</div>`
                    : ""
            }

            ${plan.products
                .map(
                    (product) =>
                        createPlanItemHtml(
                            product,
                            currentBudget
                        )
                )
                .join("")}
        </article>
    `;
}

function createPlanItemHtml(
    product,
    currentBudget
) {
    const reason =
        getProductDecisionReason(
            product
        );

    const risk =
        getProductRiskWarning(
            product,
            currentBudget
        );

    return `
        <div class="plan-item">
            <div class="plan-item-title">
                ${
                    product.listName
                        ? `
                            <span class="tag">
                                ${escapeHtml(
                                    product.listName
                                )}
                            </span>
                        `
                        : ""
                }

                ${escapeHtml(
                    product.groupName
                )}:

                ${escapeHtml(
                    product.title
                )}
            </div>

            <div class="plan-item-meta">
                ${formatMoney(
                    product.price
                )} €
                · Score
                ${formatRating(
                    product.finalScore
                )}/5
            </div>

            ${createPurchaseReadinessHtml(
                product,
                currentBudget
            )}

            <div class="decision-reason">
                ${escapeHtml(
                    reason
                )}
            </div>

            ${
                risk
                    ? `<div class="risk-warning">${escapeHtml(
                        risk
                    )}</div>`
                    : ""
            }
        </div>
    `;
}

function createProductCardHtml(
    product
) {
    const isTracked =
        product.isTracked ===
        true;

    const isOutOfStock =
        product.availability ===
        "out-of-stock";

    const hasKnownPrice =
        Number(product.price) > 0;

    const currentBudget =
        getEffectiveBudget();

    const reason =
        getProductDecisionReason(
            product
        );

    const risk =
        currentView ===
        "outOfBudget"
            ? ""
            : getProductRiskWarning(
                product,
                currentBudget
            );

    const buttonText =
        isTracked
            ? `✓ ADDED TO ${escapeHtml(
                product.listName ||
                "MY SMART PLAN"
            ).toUpperCase()}`
            : "+ ADD";

    const tagsHtml =
        (
            product.tags ||
            []
        )
            .map(
                (tag) =>
                    `<span class="tag">${escapeHtml(
                        tag
                    )}</span>`
            )
            .join("");

    const discountDetails =
        Number.isFinite(
            product
                .discountPercent
        )
            ? ` (${product.discountPercent}%)`
            : "";

    return `
        <article
            class="product-card ${
                isTracked
                    ? "tracked"
                    : "untracked"
            }"
        >
            <div class="product-top">
                <img
                    class="product-image"
                    src="${escapeHtml(
                        product.image ||
                        ""
                    )}"
                    alt=""
                />

                <div class="product-info">
                    <div
                        class="product-title ${
                            isOutOfStock
                                ? "out-of-stock"
                                : ""
                        }"
                    >
                        ${escapeHtml(
                            product.title
                        )}
                    </div>

                    <div class="product-price">
                        ${hasKnownPrice
                            ? `${formatMoney(product.price)} €`
                            : isOutOfStock
                                ? "Out of stock"
                                : "Price unavailable"}
                    </div>

                    <div class="season-label">
                        Season:
                        ${escapeHtml(
                            getSeasonLabel(
                                product
                            )
                        )}
                    </div>

                    <div class="score">
                        Priority Score:
                        ${formatRating(
                            product.finalScore
                        )}/5
                    </div>
                </div>
            </div>

            <div class="urgency-rating-control">
                <div class="urgency-rating-header">
                    <span>
                        Urgency Rating
                    </span>

                    <strong
                        data-urgency-value-for="${escapeHtml(
                            product.id
                        )}"
                    >
                        ${formatRating(
                            product
                                .scores
                                .urgency
                        )}/5
                    </strong>
                </div>

                <input
                    class="urgency-rating-slider"
                    data-product-id="${escapeHtml(
                        product.id
                    )}"
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value="${Math.round(
                        product
                            .scores
                            .urgency
                    )}"
                    ${
                        isOutOfStock
                            ? "disabled"
                            : ""
                    }
                />
            </div>

            <button
                class="track-toggle-button"
                data-product-id="${escapeHtml(
                    product.id
                )}"
                style="${
                    isTracked
                        ? "background-color: #15803d;"
                        : ""
                }"
            >
                ${buttonText}
            </button>

            ${createPurchaseReadinessHtml(
                product,
                currentBudget
            )}

            <div class="decision-reason">
                ${escapeHtml(
                    reason
                )}
            </div>

            ${
                risk
                    ? `<div class="risk-warning">${escapeHtml(
                        risk
                    )}</div>`
                    : ""
            }

            <div class="tags">
                ${tagsHtml}
            </div>

            <div class="breakdown">
                ${createBarRow(
                    "Budget Fit",
                    product
                        .scores
                        .budget
                )}

                ${createBarRow(
                    "Urgency",
                    product
                        .scores
                        .urgency
                )}

                ${createBarRow(
                    `Discount${discountDetails}`,
                    product
                        .scores
                        .discount
                )}

                ${createBarRow(
                    "VFM",
                    product
                        .scores
                        .vfm
                )}
            </div>
        </article>
    `;
}

function getPlanExplanation(
    planType
) {
    if (
        planType ===
        "budget"
    ) {
        return "The optimizer searches for the combination with the strongest budget fit, priority and value for money, with at most one item from each detected product group and without exceeding your effective budget.";
    }

    if (
        planType ===
        "premium"
    ) {
        return "The optimizer favors higher-priced options as a simple premium proxy, while still considering priority and never exceeding your effective budget.";
    }

    if (
        planType ===
        "deal"
    ) {
        return "The optimizer gives the greatest utility to verified discount strength, then final priority, while respecting your effective budget.";
    }

    return "The optimizer selects only products whose plan utility clears the inclusion threshold, with at most one item from each detected group and without exceeding your effective budget.";
}

function getProductDecisionReason(
    product
) {
    const parts = [];

    if (
        product
            .scores
            .urgency >= 4
    ) {
        parts.push(
            "high urgency rating"
        );
    }

    if (
        product
            .scores
            .discount >= 4
    ) {
        parts.push(
            Number.isFinite(
                product
                    .discountPercent
            )
                ? `${product.discountPercent}% detected discount`
                : "strong discount signal"
        );
    }

    if (
        product
            .scores
            .budget >= 4
    ) {
        parts.push(
            "good budget fit"
        );
    }

    if (
        product
            .scores
            .vfm >= 4
    ) {
        parts.push(
            "strong value for money"
        );
    }

    if (
        product
            .budgetAdjustment >
        0
    ) {
        parts.push(
            "low budget impact bonus"
        );
    } else if (
        product
            .budgetAdjustment <
        0
    ) {
        parts.push(
            "budget-impact penalty"
        );
    }

    if (
        parts.length ===
        0
    ) {
        return "Selected according to the current weighted preference score and budget rules.";
    }

    return `Selected because it has ${parts.join(
        ", "
    )}.`;
}

function getProductRiskWarning(
    product,
    currentBudget
) {
    const price =
        Number(
            product.price
        ) || 0;

    if (
        !Number.isFinite(
            currentBudget
        ) ||
        currentBudget <= 0 ||
        price <= 0
    ) {
        return "";
    }

    const usage =
        (
            price /
            currentBudget
        ) *
        100;

    if (
        usage >= 80
    ) {
        return `High budget impact: this product uses ${roundOne(
            usage
        )}% of your effective budget.`;
    }

    if (
        usage >= 50
    ) {
        return `Budget note: this product uses ${roundOne(
            usage
        )}% of your effective budget.`;
    }

    return "";
}

function getPlanRiskWarning(
    totalPrice,
    currentBudget,
    remainingBudget
) {
    if (
        !Number.isFinite(
            currentBudget
        ) ||
        currentBudget <= 0
    ) {
        return "";
    }

    const usage =
        (
            totalPrice /
            currentBudget
        ) *
        100;

    const remainingPercent =
        (
            remainingBudget /
            currentBudget
        ) *
        100;

    if (
        remainingPercent <=
        5
    ) {
        return "High budget impact: this plan leaves almost no remaining budget.";
    }

    if (
        usage >= 90
    ) {
        return `Budget note: this plan uses ${roundOne(
            usage
        )}% of your effective budget.`;
    }

    if (
        remainingPercent <=
        10
    ) {
        return "Budget note: this plan leaves less than 10% of your budget unused.";
    }

    return "";
}

function calculatePurchaseReadiness(
    product,
    currentBudget
) {
    const price =
        Number(
            product.price
        ) || 0;

    if (
        product.availability ===
        "out-of-stock"
    ) {
        return 0;
    }

    if (
        product.availability !==
            "available" ||
        price <= 0
    ) {
        return 0;
    }

    if (
        currentBudget !== null &&
        Number.isFinite(
            currentBudget
        ) &&
        currentBudget >= 0 &&
        toCents(price) >
            toCents(
                currentBudget
            )
    ) {
        return 10;
    }

    const priorityComponent =
        rating5ToPercent(
            product.finalScore
        );

    const budgetComponent =
        rating5ToPercent(
            product
                .scores
                ?.budget ??
            3
        );

    const vfmComponent =
        rating5ToPercent(
            product
                .scores
                ?.vfm ??
            3
        );

    const seasonComponent =
        currentSeasonFilter ===
        "all"
            ? 80
            : productMatchesSeason(
                product,
                currentSeasonFilter
            )
                ? 100
                : 30;

    const availabilityComponent =
        product.availability ===
        "out-of-stock"
            ? 0
            : 100;

    const readiness =
        priorityComponent *
            0.4 +
        budgetComponent *
            0.25 +
        vfmComponent *
            0.15 +
        seasonComponent *
            0.1 +
        availabilityComponent *
            0.1;

    return Math.round(
        clampNumber(
            readiness,
            0,
            100
        )
    );
}

function getPurchaseReadinessLabel(
    product,
    currentBudget
) {
    const price =
        Number(
            product.price
        ) || 0;

    if (
        product.availability ===
        "out-of-stock"
    ) {
        return "Out of Stock";
    }

    if (
        product.availability !==
            "available" ||
        price <= 0
    ) {
        return "Price Unavailable";
    }

    if (
        currentBudget !== null &&
        Number.isFinite(
            currentBudget
        ) &&
        currentBudget >= 0 &&
        toCents(price) >
            toCents(
                currentBudget
            )
    ) {
        return "Too Expensive";
    }

    const readiness =
        calculatePurchaseReadiness(
            product,
            currentBudget
        );

    if (
        readiness >= 80
    ) {
        return "Strong Buy";
    }

    if (
        readiness >= 65
    ) {
        return "Good Option";
    }

    if (
        readiness >= 45
    ) {
        return "Maybe Later";
    }

    return "Low Priority";
}

function getReadinessClass(
    label
) {
    if (
        label ===
        "Strong Buy"
    ) {
        return "readiness-strong";
    }

    if (
        label ===
        "Good Option"
    ) {
        return "readiness-good";
    }

    if (
        label ===
        "Maybe Later"
    ) {
        return "readiness-maybe";
    }

    if (
        label ===
        "Too Expensive"
    ) {
        return "readiness-expensive";
    }

    if (
        label ===
        "Out of Stock" ||
        label ===
        "Price Unavailable"
    ) {
        return "readiness-stock";
    }

    return "readiness-low";
}

function createPurchaseReadinessHtml(
    product,
    currentBudget
) {
    const readinessPercent =
        calculatePurchaseReadiness(
            product,
            currentBudget
        );

    const readinessLabel =
        getPurchaseReadinessLabel(
            product,
            currentBudget
        );

    const readinessClass =
        getReadinessClass(
            readinessLabel
        );

    return `
        <div class="confidence-box">
            <div class="confidence-main">
                Purchase Readiness:
                <strong>
                    ${readinessPercent}%
                </strong>
            </div>

            <div
                class="readiness-label ${readinessClass}"
            >
                ${escapeHtml(
                    readinessLabel
                )}
            </div>
        </div>
    `;
}

function createBarRow(
    label,
    value
) {
    const rating =
        normalizeRating5(
            value,
            1
        );

    const width =
        (
            rating /
            SCORE_MAX
        ) *
        100;

    return `
        <div class="bar-row">
            <span>
                ${escapeHtml(
                    label
                )}
            </span>

            <div class="bar">
                <div
                    class="bar-fill"
                    style="width:${clampNumber(
                        width,
                        0,
                        100
                    )}%"
                ></div>
            </div>

            <span>
                ${formatRating(
                    rating
                )}/5
            </span>
        </div>
    `;
}

function rating5ToPercent(value) {
    const rating =
        normalizeRating5(
            value,
            1
        );

    return (
        rating /
        SCORE_MAX
    ) *
    100;
}

function normalizeRating5(
    value,
    fallback = 3
) {
    const numericValue =
        Number(value);

    if (
        !Number.isFinite(
            numericValue
        )
    ) {
        return clampNumber(
            fallback,
            SCORE_MIN,
            SCORE_MAX
        );
    }

    return clampNumber(
        numericValue,
        SCORE_MIN,
        SCORE_MAX
    );
}

function formatRating(value) {
    const rounded =
        roundOne(
            Number(value)
        );

    return Number.isInteger(
        rounded
    )
        ? String(rounded)
        : rounded.toFixed(1);
}

function toCents(value) {
    const number =
        Number(value);

    if (
        !Number.isFinite(
            number
        )
    ) {
        return 0;
    }

    return Math.round(
        (
            number +
            Number.EPSILON
        ) *
        100
    );
}

function fromCents(cents) {
    return roundMoney(
        Number(cents) /
        100
    );
}

function roundMoney(value) {
    return (
        Math.round(
            (
                Number(value) +
                Number.EPSILON
            ) *
            100
        ) /
        100
    );
}

function formatMoney(value) {
    const amount =
        Number(value);

    if (
        !Number.isFinite(
            amount
        )
    ) {
        return "-";
    }

    return roundMoney(
        amount
    )
        .toFixed(2)
        .replace(
            /\.00$/,
            ""
        );
}

function roundOne(value) {
    return (
        Math.round(
            (
                Number(value) +
                Number.EPSILON
            ) *
            10
        ) /
        10
    );
}

function clampNumber(
    value,
    min,
    max
) {
    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}

function cssEscape(value) {
    if (
        window.CSS &&
        typeof window.CSS.escape ===
            "function"
    ) {
        return window.CSS.escape(
            String(value)
        );
    }

    return String(
        value
    ).replace(
        /(["\\])/g,
        "\\$1"
    );
}

function escapeHtml(value) {
    return String(
        value ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}