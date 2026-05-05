import {
  isValidObject,
  safeParse,
  safeSetLocalStorageValue,
  SUPPLIER_COGS_MEMORY_STORAGE_KEY,
} from "./invoiceStorage";

export function normalizeSupplierCogsMemoryKey(value: any) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSupplierCogsMemoryRowKey(row: any) {
  const code = normalizeSupplierCogsMemoryKey(row?.code || row?.itemCode || row?.productCode || "");
  const name = normalizeSupplierCogsMemoryKey(row?.name || row?.description || row?.itemName || row?.productName || row?.rawLine || "");
  return [code, name].filter(Boolean).join(" :: ");
}

export function loadSupplierCogsMemory() {
  return safeParse<Record<string, any>>(
    SUPPLIER_COGS_MEMORY_STORAGE_KEY,
    {},
    isValidObject
  );
}

export function normalizeInvoiceCogsTypeForApp(value: any) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["food", "food_cogs", "food cogs"].includes(normalized)) return "food_cogs";
  if (["consumable", "consumables", "consumable_cogs", "consumable cogs", "kitchen consumables"].includes(normalized)) return "consumable_cogs";
  if (["non_cogs", "non-cogs", "non cogs", "cleaning", "equipment", "sundries"].includes(normalized)) return "non_cogs";
  return "unknown";
}

export function legacyInvoiceCogsCategoryForApp(value: any) {
  const cogsType = normalizeInvoiceCogsTypeForApp(value);
  if (cogsType === "food_cogs") return "food";
  if (cogsType === "consumable_cogs") return "consumable";
  if (cogsType === "non_cogs") return "non_cogs";
  return "unknown";
}

export function getInvoiceRowCogsTypeForApp(row: any) {
  return normalizeInvoiceCogsTypeForApp(row?.cogsType || row?.cogsCategory || "unknown");
}

export function getSupplierCogsMemoryMatch(row: any, supplierName: string) {
  const supplierKey = normalizeSupplierCogsMemoryKey(supplierName);
  const rowKey = getSupplierCogsMemoryRowKey(row);

  if (!supplierKey || !rowKey) return null;

  const memory = loadSupplierCogsMemory();
  const supplierMemory = memory?.[supplierKey];
  const learned = supplierMemory?.[rowKey];

  if (!learned?.cogsCategory) return null;

  const learnedType = normalizeInvoiceCogsTypeForApp(learned.cogsType || learned.cogsCategory);

  return {
    cogsType: learnedType,
    category: learned.category || (learnedType === "food_cogs" ? "Food COGS" : learnedType === "consumable_cogs" ? "Kitchen consumables / packaging" : learnedType === "non_cogs" ? "Cleaning / equipment / sundries" : "Needs review"),
    categoryConfidence: 100,
    categoryReason: "Learned from previous review",
    cogsCategory: legacyInvoiceCogsCategoryForApp(learned.cogsType || learned.cogsCategory),
    cogsCategoryConfidence: "learned",
    cogsCategoryReason: "Learned from previous review",
  };
}

export function saveSupplierCogsMemory(row: any, supplierName: string, cogsCategory: any) {
  const category = legacyInvoiceCogsCategoryForApp(cogsCategory);
  const supplierKey = normalizeSupplierCogsMemoryKey(supplierName);
  const rowKey = getSupplierCogsMemoryRowKey(row);

  if (!supplierKey || !rowKey || !category) return;
  if (!["food", "consumable", "non_cogs", "unknown"].includes(category)) return;

  const memory = loadSupplierCogsMemory();
  const supplierMemory = isValidObject(memory?.[supplierKey]) ? memory[supplierKey] : {};
  const normalizedType = normalizeInvoiceCogsTypeForApp(category);

  const nextMemory = {
    ...memory,
    [supplierKey]: {
      ...supplierMemory,
      [rowKey]: {
        cogsType: normalizedType,
        category: normalizedType === "food_cogs" ? "Food COGS" : normalizedType === "consumable_cogs" ? "Kitchen consumables / packaging" : normalizedType === "non_cogs" ? "Cleaning / equipment / sundries" : "Needs review",
        cogsCategory: category,
        cogsCategoryConfidence: "learned",
        cogsCategoryReason: "Learned from previous review",
        updatedAt: new Date().toISOString(),
      },
    },
  };

  try {
    safeSetLocalStorageValue(SUPPLIER_COGS_MEMORY_STORAGE_KEY, nextMemory);
  } catch (error) {
    console.warn("GP Police supplier COGS memory save failed", error);
  }
}

export function getInvoiceCategorySearchText(row: any, supplierName: string) {
  return [
    supplierName,
    row?.name,
    row?.code,
    row?.description,
    row?.itemName,
    row?.productName,
    row?.rawLine,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasInvoiceCategoryTerm(text: string, terms: string[]) {
  return terms.find((term) => {
    const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    if (!normalizedTerm) return false;
    return new RegExp(`(^|\\s)${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(text);
  });
}

export function classifyInvoiceCogsCategory(row: any, supplierName: string) {
  const existingType = getInvoiceRowCogsTypeForApp(row);

  if (existingType !== "unknown" && (row?.cogsCategoryManualOverride || row?.cogsTypeManualOverride)) {
    return {
      cogsType: existingType,
      category: row?.category || (existingType === "food_cogs" ? "Food COGS" : existingType === "consumable_cogs" ? "Kitchen consumables / packaging" : "Cleaning / equipment / sundries"),
      categoryConfidence: 100,
      categoryReason: row?.categoryReason || "Manually reviewed in invoice intake.",
      cogsCategory: legacyInvoiceCogsCategoryForApp(existingType),
      cogsCategoryConfidence: row?.cogsCategoryConfidence || "manual",
      cogsCategoryReason: row?.cogsCategoryReason || "Existing category preserved.",
    };
  }

  const searchText = getInvoiceCategorySearchText(row, supplierName);

  const nonCogsTerms = [
    "detergent", "sanitizer", "sanitiser", "chemical", "bleach", "cleaner", "cleaning", "degreaser", "rinse aid", "dishwash", "dishwasher", "mop", "broom", "cloth", "sponge", "soap", "hand wash", "toilet", "pest", "repair", "equipment", "uniform",
  ];

  const consumableTerms = [
    "napkin", "serviette", "glove", "gloves", "foil", "cling", "cling wrap", "paper towel", "towel", "detergent", "chemical", "sanitiser", "sanitizer", "cleaner", "scourer", "sponge", "garbage bag", "bin liner", "takeaway", "container", "lid", "cup", "straw", "docket", "docket roll", "blue roll", "chux", "wipe", "wipes", "baking paper",
  ];

  const foodTerms = [
    "beef", "chicken", "pork", "lamb", "fish", "prawn", "squid", "cheese", "milk", "cream", "butter", "yoghurt", "egg", "flour", "sugar", "rice", "pasta", "oil", "vinegar", "tomato", "lettuce", "carrot", "onion", "potato", "herb", "spice", "sauce", "stock", "bread", "bun", "roll", "bacon", "ham", "salami",
  ];

  const nonCogsMatch = hasInvoiceCategoryTerm(searchText, nonCogsTerms);
  const foodMatch = hasInvoiceCategoryTerm(searchText, foodTerms);
  const consumableMatch = hasInvoiceCategoryTerm(searchText, consumableTerms);

  if (nonCogsMatch) {
    return {
      cogsType: "non_cogs",
      category: "Cleaning / equipment / sundries",
      categoryConfidence: 92,
      categoryReason: `Matched non-COGS keyword: ${nonCogsMatch}`,
      cogsCategory: "non_cogs",
      cogsCategoryConfidence: "high",
      cogsCategoryReason: `Matched non-COGS keyword: ${nonCogsMatch}`,
    };
  }

  if (consumableMatch && !foodMatch) {
    return {
      cogsType: "consumable_cogs",
      category: "Kitchen consumables / packaging",
      categoryConfidence: 90,
      categoryReason: `Matched consumable keyword: ${consumableMatch}`,
      cogsCategory: "consumable",
      cogsCategoryConfidence: "high",
      cogsCategoryReason: `Matched consumable keyword: ${consumableMatch}`,
    };
  }

  if (foodMatch && !consumableMatch) {
    return {
      cogsType: "food_cogs",
      category: "Food COGS",
      categoryConfidence: 90,
      categoryReason: `Matched food keyword: ${foodMatch}`,
      cogsCategory: "food",
      cogsCategoryConfidence: "high",
      cogsCategoryReason: `Matched food keyword: ${foodMatch}`,
    };
  }

  if (consumableMatch && foodMatch) {
    const strongConsumableMatch = hasInvoiceCategoryTerm(searchText, [
      "paper towel", "docket roll", "blue roll", "cling wrap", "garbage bag", "bin liner", "baking paper", "takeaway", "container",
    ]);

    if (strongConsumableMatch) {
      return {
        cogsType: "consumable_cogs",
        category: "Kitchen consumables / packaging",
        categoryConfidence: 70,
        categoryReason: `Matched strong consumable phrase: ${strongConsumableMatch}`,
        cogsCategory: "consumable",
        cogsCategoryConfidence: "medium",
        cogsCategoryReason: `Matched strong consumable phrase: ${strongConsumableMatch}`,
      };
    }

    return {
      cogsType: "unknown",
      category: "Needs review",
      categoryConfidence: 35,
      categoryReason: `Matched both food and consumable keywords (${foodMatch}, ${consumableMatch}). Review before locking.`,
      cogsCategory: "unknown",
      cogsCategoryConfidence: "low",
      cogsCategoryReason: `Matched both food and consumable keywords (${foodMatch}, ${consumableMatch}). Review before locking.`,
    };
  }

  return {
    cogsType: "unknown",
    category: "Needs review",
    categoryConfidence: 25,
    categoryReason: "No confident food or consumable keyword found. Review before locking.",
    cogsCategory: "unknown",
    cogsCategoryConfidence: "low",
    cogsCategoryReason: "No confident food or consumable keyword found. Review before locking.",
  };
}

export function applyInvoiceCogsCategoryDetection(rows: any[], supplierName: string) {
  return rows.map((row: any) => {
    const existingType = getInvoiceRowCogsTypeForApp(row);
    const existingCategory = legacyInvoiceCogsCategoryForApp(existingType);
    const existingConfidence = String(row?.categoryConfidence || row?.cogsCategoryConfidence || "").trim();
    const existingReason = String(row?.categoryReason || row?.cogsCategoryReason || "").trim();

    if (row?.cogsCategoryManualOverride) {
      return row;
    }

    const learnedCategory = getSupplierCogsMemoryMatch(row, supplierName);
    if (learnedCategory) {
      return {
        ...row,
        ...learnedCategory,
      };
    }

    if (existingType !== "unknown") {
      return {
        ...row,
        cogsType: row?.cogsType || existingType,
        cogsCategory: row?.cogsCategory || existingCategory,
      };
    }

    if (existingCategory.toLowerCase() === "unknown" && (existingConfidence || existingReason)) {
      return row;
    }

    const categoryResult = classifyInvoiceCogsCategory(row, supplierName);
    return {
      ...row,
      ...categoryResult,
    };
  });
}
