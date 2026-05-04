import { purchaseUnitOptions, sizeUnitOptions } from "./gpPoliceConstants";
import { normalizeLooseText, roundTo, safeNumber } from "./gpPoliceHelpers";

export function cleanInvoiceOcrText(text: string): string {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[×✕]/g, "x")
    .replace(/\u00a0/g, " ")
    .replace(/[|¦]/g, " ")
    .replace(/[$＄]\s+/g, "$ ")
    .replace(/(\d),(\d{2})\b/g, "$1.$2")
    .replace(/(\d)\s+\.\s+(\d{1,2})\b/g, "$1.$2")
    .replace(/(\d)\s+\.\s*/g, "$1.")
    .replace(/\b([0-9]+)[oO](\d{1,2})\b/g, "$1.0$2")
    .replace(/\b([0-9]+)[oO]\b/g, "$1.00")
    .replace(/\b([A-Z0-9]{2,})\s*-\s*([A-Z0-9]{2,})\b/g, "$1-$2")
    .split("\n")
    .map((line) =>
      line
        .replace(/\s{2,}/g, " ")
        .replace(/\bQTY\b/gi, "Qty")
        .replace(/\bCTN\b/gi, "carton")
        .replace(/\bPK\b/gi, "pack")
        .replace(/\bEA\b/gi, "each")
        .replace(/\bL1\b/g, "11")
        .trim()
    )
    .filter(Boolean)
    .join("\n");
}

export function getInvoiceMoneyMatches(line: string) {
  const matches: Array<{ value: number; index: number; raw: string }> = [];
  const source = String(line || "");
  const moneyPattern = /(?:\$\s*)?(\d{1,6})(?:[.,]\s*|\s+)(\d{2})\b/g;
  let match: RegExpExecArray | null;

  while ((match = moneyPattern.exec(source)) !== null) {
    const value = safeNumber(`${match[1]}.${match[2]}`);
    if (value > 0) {
      matches.push({ value, index: match.index, raw: match[0] });
    }
  }

  return matches;
}

export function hasInvoiceMoneyValue(line: string) {
  return getInvoiceMoneyMatches(line).length > 0;
}

export function isInvoiceDocumentNoiseLine(line: string) {
  const value = String(line || "").replace(/\s+/g, " ").trim();
  const lower = value.toLowerCase();
  if (!value) return true;

  const noiseTerms = [
    "abn", "tax invoice", "invoice no", "invoice number", "account", "customer", "deliver to", "delivery address",
    "dispatch date", "order date", "payment", "remittance", "subtotal", "amount due", "balance due", "page",
    "phone", "email", "www", "@", "terms", "statement", "bank", "bsb", "royal agricultural", "exclusive suppliers",
    "jandakot", "perth metro", "biscayne way", "waroona hotel", "fouracre", "placing", "award", "awards"
  ];

  const matchedNoiseTerms = noiseTerms.filter((term) => lower.includes(term)).length;
  const hasProductHeader = /product\s+description\s+ord\s+del\s+unit\s+price\s+total/i.test(value);

  if (hasProductHeader) return false;
  if (matchedNoiseTerms >= 2 && value.length > 90) return true;
  if (matchedNoiseTerms >= 1 && !hasInvoiceMoneyValue(value) && value.length > 55) return true;
  if (/^[\d\s:/.,-]+$/.test(value)) return true;

  return false;
}

export function stripInvoiceDocumentNoisePrefix(line: string) {
  let value = String(line || "").replace(/\s+/g, " ").trim();

  value = value.replace(/^.*?PRODUCT\s+DESCRIPTION\s+ORD\s+DEL\s+UNIT\s+PRICE\s+TOTAL/i, "").trim();
  value = value.replace(/^.*?DESCRIPTION\s+ORD\s+DEL\s+UNIT\s+PRICE\s+TOTAL/i, "").trim();

  // Some OCR scans merge the entire supplier header into the first meat line.
  // If a product code appears after a long address/header block, keep the code onward.
  const productCodeMatch = value.match(/([A-Z]{1,4}\d{1,4}|B\d{2}|BEF?|P\d{2}|L\d{2})\s+[A-Z][A-Z0-9/#\s]{6,}/);
  if (productCodeMatch && productCodeMatch.index !== undefined && productCodeMatch.index > 20) {
    value = value.slice(productCodeMatch.index).trim();
  }

  return value;
}

export function isPlausibleInvoiceQuantity(quantity: any, unit: string) {
  const qty = safeNumber(quantity);
  const normalizedUnit = normalizeInvoiceUnit(unit);
  if (!Number.isFinite(qty) || qty <= 0) return false;
  if (["kg", "g", "l", "ml"].includes(normalizedUnit) && qty > 500) return false;
  if (["each", "pack", "box", "carton", "case", "bag", "bunch", "tray", "tub", "tin"].includes(normalizedUnit) && qty > 1000) return false;
  return true;
}

export function buildInvoiceCandidateLines(importText: string) {
  const rawLines = cleanInvoiceOcrText(importText)
    .split("\n")
    .map((line) => stripInvoiceDocumentNoisePrefix(line.replace(/\s+/g, " ").trim()))
    .filter(Boolean)
    .filter((line) => !isInvoiceDocumentNoiseLine(line));

  const candidates: string[] = [];
  let carry = "";

  rawLines.forEach((sourceLine) => {
    const line = stripInvoiceDocumentNoisePrefix(sourceLine);
    if (isInvoiceDocumentNoiseLine(line)) {
      carry = "";
      return;
    }

    const hasMoney = hasInvoiceMoneyValue(line);
    const hasLetters = /[a-zA-Z]/.test(line);
    const isObviousHeader = /\b(invoice|tax invoice|statement|customer|delivery address|account|abn|date|page|subtotal|amount due|balance due|payment|remittance|bank)\b/i.test(line);
    const isLikelyTotalOnly = /\b(subtotal|total|gst|amount due|balance due)\b/i.test(line) && !/\b(beef|pork|lamb|chicken|fish|fruit|veg|vegetable|dairy|cheese|bread|bun|milk|cream|tomato|potato|lettuce|onion|garlic|flour|rice|pasta|egg|butter)\b/i.test(line);

    if (isLikelyTotalOnly) {
      carry = "";
      return;
    }

    if (!hasMoney && hasLetters && !isObviousHeader) {
      carry = carry ? `${carry} ${line}` : line;
      return;
    }

    if (hasMoney) {
      candidates.push(carry ? `${carry} ${line}` : line);
      carry = "";
      return;
    }

    if (carry && !hasLetters) {
      candidates.push(`${carry} ${line}`);
      carry = "";
    }
  });

  return candidates.length > 0 ? candidates : rawLines;
}


export function applyInvoiceSupplierProfile(text: string, supplierName: string) {
  const supplier = normalizeLooseText(supplierName);
  let cleaned = String(text || "");

  const sharedReplacements: Array<[RegExp, string]> = [
    [/\bQTY\.?\b/gi, "Qty"],
    [/\bEXT\.?\b/gi, "Total"],
    [/\bU\/?P\b/gi, "Unit Price"],
    [/\bAMT\.?\b/gi, "Total"],
    [/\bSUPPLY\b/gi, "Qty"],
  ];

  sharedReplacements.forEach(([pattern, replacement]) => {
    cleaned = cleaned.replace(pattern, replacement);
  });

  if (/bidfood|pfd|mbl|fins|campbells|metcash|fruit|veg|produce|meat|butcher|seafood/.test(supplier)) {
    cleaned = cleaned
      .replace(/\bCART\.?\b/gi, "carton")
      .replace(/\bBCH\b/gi, "bunch")
      .replace(/\bKILO\b/gi, "kg")
      .replace(/\bNOS\b/gi, "each");
  }

  return cleaned;
}

export function getInvoiceOcrQualityWarning(rawText: string, parsedRows: any[]) {
  const text = String(rawText || "");
  const textLines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const moneyLineCount = textLines.filter(hasInvoiceMoneyValue).length;
  const parsedCount = Array.isArray(parsedRows) ? parsedRows.length : 0;

  if (!text.trim()) return "OCR failed — retake photo flatter, brighter, and fill the screen with the invoice.";
  if (parsedCount === 0 && moneyLineCount > 0) return "OCR found prices but GP Police could not confidently split ingredient rows. Use Fix Row or paste supplier text export.";
  if (parsedCount === 0) return "OCR found text but no clear invoice rows. Retake photo square-on, avoid shadows, or paste text.";
  if (moneyLineCount >= 4 && parsedCount < Math.ceil(moneyLineCount * 0.45)) return "Low scan confidence: many price lines were not converted into ingredients. Check raw lines before locking.";
  if (parsedRows.some((row: any) => String(row?.confidence || "").toLowerCase() === "low")) return "Some rows are low confidence. Fix or ignore them before locking.";
  return "";
}

export function normalizeInvoiceUnit(unit: string) {
  const lower = String(unit || "").toLowerCase().trim();
  if (lower === "ea" || lower === "unit" || lower === "units") return "each";
  if (lower === "ctn") return "carton";
  if (lower === "pk") return "pack";
  return lower || "each";
}

export function parseInvoiceMoneyMatches(line: string) {
  return getInvoiceMoneyMatches(line).map((match) => ({ 1: String(match.value), index: match.index, 0: match.raw } as any));
}

export function parseInvoicePackDetails(text: string) {
  const packMatch = String(text || "").match(/(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|each|ea|pack|box|carton|bottle|bag|bunch|tray|tub|jar|tin|case|pk)\b/i);
  const simpleSizeMatch = String(text || "").match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|each|ea)\b/i);

  if (packMatch) {
    const parsedUnit = normalizeInvoiceUnit(packMatch[3]);
    return {
      amountInPurchaseUnit: String(roundTo(parseLooseNumber(packMatch[1]), 2)),
      sizePerItem: String(roundTo(parseLooseNumber(packMatch[2]), 2)),
      sizeUnit: sizeUnitOptions.includes(parsedUnit) ? parsedUnit : "each",
    };
  }

  if (simpleSizeMatch) {
    const parsedUnit = normalizeInvoiceUnit(simpleSizeMatch[2]);
    return {
      amountInPurchaseUnit: "1",
      sizePerItem: String(roundTo(parseLooseNumber(simpleSizeMatch[1]), 2)),
      sizeUnit: sizeUnitOptions.includes(parsedUnit) ? parsedUnit : "each",
    };
  }

  return {
    amountInPurchaseUnit: "1",
    sizePerItem: "1",
    sizeUnit: "each",
  };
}


export const invoiceFoodWordSet = new Set([
  "beef", "pork", "lamb", "chicken", "duck", "turkey", "fish", "salmon", "tuna", "barramundi", "prawn", "prawns",
  "tomato", "tomatoes", "potato", "potatoes", "lettuce", "onion", "onions", "garlic", "mushroom", "mushrooms",
  "milk", "cream", "cheese", "butter", "yoghurt", "egg", "eggs", "oil", "vinegar", "sauce", "stock",
  "flour", "rice", "pasta", "bread", "bun", "buns", "roll", "rolls", "herbs", "parsley", "basil", "rocket",
  "carrot", "celery", "cabbage", "spinach", "beans", "peas", "corn", "avocado", "lemon", "lime", "orange", "apple",
  "zucchini", "capsicum", "cucumber", "pumpkin", "sweet", "broccoli", "broccolini", "cauliflower", "kale",
  "mince", "steak", "rib", "ribs", "brisket", "bacon", "ham", "prosciutto", "salami", "sausage", "sausages",
  "snapper", "cod", "squid", "octopus", "mussels", "oysters", "scallops", "crab", "lobster", "yogurt",
  "mozzarella", "parmesan", "ricotta", "feta", "halloumi", "mascarpone", "yolk", "mayonnaise", "mustard", "ketchup",
  "noodle", "noodles", "quinoa", "couscous", "polenta", "sugar", "salt", "pepper", "paprika", "cumin",
]);

export function isKnownFoodNameToken(token: string) {
  return invoiceFoodWordSet.has(String(token || "").toLowerCase().replace(/[^a-z]/g, ""));
}

export type InvoiceCogsType = "food_cogs" | "consumable_cogs" | "non_cogs" | "unknown";
export type InvoiceCogsCategory = "food" | "consumable" | "non_cogs" | "unknown";

type InvoiceCategoryResult = {
  cogsType: InvoiceCogsType;
  category: string;
  confidence: number;
  reason: string;
  cogsCategory: InvoiceCogsCategory;
  cogsCategoryConfidence: "low" | "medium" | "high" | "manual" | "learned";
  cogsCategoryReason: string;
};

function normalizeLegacyInvoiceCogsType(value: any): InvoiceCogsType {
  const normalized = String(value || "").trim().toLowerCase();
  if (["food", "food_cogs", "food cogs"].includes(normalized)) return "food_cogs";
  if (["consumable", "consumables", "consumable_cogs", "kitchen consumables", "packaging"].includes(normalized)) return "consumable_cogs";
  if (["non_cogs", "non-cogs", "non cogs", "cleaning", "equipment", "sundries"].includes(normalized)) return "non_cogs";
  return "unknown";
}

function legacyCategoryFromCogsType(cogsType: InvoiceCogsType): InvoiceCogsCategory {
  if (cogsType === "food_cogs") return "food";
  if (cogsType === "consumable_cogs") return "consumable";
  if (cogsType === "non_cogs") return "non_cogs";
  return "unknown";
}

function confidenceLabelFromNumber(confidence: number): "low" | "medium" | "high" {
  if (confidence >= 82) return "high";
  if (confidence >= 55) return "medium";
  return "low";
}

export function classifyInvoiceItemCategory(rowOrName: any): InvoiceCategoryResult {
  const rawName = typeof rowOrName === "string" ? rowOrName : String(rowOrName?.name || rowOrName?.description || rowOrName?.itemName || rowOrName?.productName || "");
  const rawLine = typeof rowOrName === "string" ? "" : String(rowOrName?.rawLine || rowOrName?.rawText || rowOrName?.line || "");
  const existingValue = typeof rowOrName === "string"
    ? ""
    : String(rowOrName?.cogsType || rowOrName?.cogsCategory || rowOrName?.matchedIngredient?.cogsType || rowOrName?.matchedIngredient?.cogsCategory || rowOrName?.matchedIngredient?.category || "");
  const manualOverride = typeof rowOrName !== "string" && Boolean(rowOrName?.cogsCategoryManualOverride || rowOrName?.cogsTypeManualOverride);

  const existingType = normalizeLegacyInvoiceCogsType(existingValue);
  if (existingType !== "unknown" || manualOverride) {
    const category = String(rowOrName?.category || legacyCategoryFromCogsType(existingType) || "unknown");
    const confidence = manualOverride ? 100 : 96;
    const reason = manualOverride ? "Manually reviewed in invoice intake." : "Existing category preserved.";
    return {
      cogsType: existingType,
      category,
      confidence,
      reason,
      cogsCategory: legacyCategoryFromCogsType(existingType),
      cogsCategoryConfidence: manualOverride ? "manual" : "high",
      cogsCategoryReason: reason,
    };
  }

  const text = normalizeIngredientName(`${rawName} ${rawLine}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const hasTerm = (terms: string[]) => terms.find((term) => {
    const cleaned = term.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    return cleaned ? new RegExp(`(^|\\s)${cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(text) : false;
  });

  const nonCogsTerms = [
    "detergent", "sanitizer", "sanitiser", "chemical", "bleach", "cleaner", "cleaning", "degreaser", "rinse aid",
    "dishwash", "dishwasher", "glasswash", "mop", "broom", "cloth", "sponge", "scourer", "soap", "hand wash",
    "toilet", "washroom", "pest", "repair", "equipment", "uniform", "apron", "hairnet", "rapidclean", "rapid clean"
  ];

  const consumableTerms = [
    "napkin", "napkins", "serviette", "serviettes", "container", "containers", "lid", "lids", "cup", "cups", "straw", "straws",
    "foil", "alfoil", "cling wrap", "cling", "baking paper", "greaseproof", "gloves", "glove", "nitrile", "latex", "vinyl",
    "bag", "bags", "bin liner", "bin liners", "garbage bag", "rubbish bag", "takeaway", "take away", "packaging", "label",
    "labels", "roll", "rolls", "docket", "docket roll", "blue roll", "paper towel", "towel", "skewer", "toothpick", "cutlery",
    "fork", "forks", "knife", "knives", "spoon", "spoons", "plate", "plates", "bowl", "bowls"
  ];

  const foodTerms = [
    "beef", "lamb", "pork", "chicken", "fish", "salmon", "tuna", "barramundi", "prawns", "prawn", "squid", "mussels", "oysters", "seafood",
    "fruit", "veg", "vegetable", "lettuce", "tomato", "tomatoes", "onion", "onions", "potato", "potatoes", "carrot", "broccoli", "broccolini",
    "herbs", "parsley", "basil", "rocket", "milk", "cream", "cheese", "butter", "dairy", "flour", "rice", "pasta", "oil", "vinegar",
    "sauce", "spices", "spice", "seasoning", "eggs", "egg", "bread", "buns", "bun", "frozen chips", "chips", "poultry", "meat",
    "bacon", "ham", "sausage", "sausages", "mince", "steak", "brisket", "mushroom", "mushrooms", "garlic", "avocado", "lemon", "lime",
    "sugar", "salt", "pepper", "mozzarella", "parmesan", "ricotta", "feta", "yoghurt", "yogurt", "mayonnaise", "mustard", "stock"
  ];

  const nonCogsMatch = hasTerm(nonCogsTerms);
  const consumableMatch = hasTerm(consumableTerms);
  const foodMatch = hasTerm(foodTerms) || text.split(/\s+/).some((token) => invoiceFoodWordSet.has(token));

  if (nonCogsMatch) {
    return {
      cogsType: "non_cogs",
      category: "Cleaning / equipment / sundries",
      confidence: 92,
      reason: `Matched non-COGS keyword: ${nonCogsMatch}`,
      cogsCategory: "non_cogs",
      cogsCategoryConfidence: "high",
      cogsCategoryReason: `Matched non-COGS keyword: ${nonCogsMatch}`,
    };
  }

  if (consumableMatch && !foodMatch) {
    return {
      cogsType: "consumable_cogs",
      category: "Kitchen consumables / packaging",
      confidence: 90,
      reason: `Matched consumable keyword: ${consumableMatch}`,
      cogsCategory: "consumable",
      cogsCategoryConfidence: "high",
      cogsCategoryReason: `Matched consumable keyword: ${consumableMatch}`,
    };
  }

  if (foodMatch && !consumableMatch) {
    return {
      cogsType: "food_cogs",
      category: "Food COGS",
      confidence: 88,
      reason: "Matched food / ingredient keyword.",
      cogsCategory: "food",
      cogsCategoryConfidence: "high",
      cogsCategoryReason: "Matched food / ingredient keyword.",
    };
  }

  if (foodMatch && consumableMatch) {
    const strongConsumableMatch = hasTerm(["takeaway", "take away", "container", "containers", "docket roll", "bin liner", "paper towel", "cling wrap", "baking paper", "napkin", "serviette"]);
    if (strongConsumableMatch) {
      return {
        cogsType: "consumable_cogs",
        category: "Kitchen consumables / packaging",
        confidence: 70,
        reason: `Mixed food/consumable language, but strong consumable phrase wins: ${strongConsumableMatch}`,
        cogsCategory: "consumable",
        cogsCategoryConfidence: "medium",
        cogsCategoryReason: `Mixed food/consumable language, but strong consumable phrase wins: ${strongConsumableMatch}`,
      };
    }

    return {
      cogsType: "unknown",
      category: "Needs review",
      confidence: 35,
      reason: "Matched both food and consumable keywords. Review before locking.",
      cogsCategory: "unknown",
      cogsCategoryConfidence: "low",
      cogsCategoryReason: "Matched both food and consumable keywords. Review before locking.",
    };
  }

  return {
    cogsType: "unknown",
    category: "Needs review",
    confidence: 25,
    reason: "No confident food, consumable, or non-COGS keyword match.",
    cogsCategory: "unknown",
    cogsCategoryConfidence: "low",
    cogsCategoryReason: "No confident food, consumable, or non-COGS keyword match.",
  };
}

export function classifyInvoiceCogsCategory(rowOrName: any): {
  cogsCategory: InvoiceCogsCategory;
  cogsCategoryConfidence: "low" | "medium" | "high" | "manual" | "learned";
  cogsCategoryReason: string;
} {
  const result = classifyInvoiceItemCategory(rowOrName);
  return {
    cogsCategory: result.cogsCategory,
    cogsCategoryConfidence: result.cogsCategoryConfidence || confidenceLabelFromNumber(result.confidence),
    cogsCategoryReason: result.cogsCategoryReason || result.reason,
  };
}

export function attachInvoiceCogsClassification(row: any) {
  const categoryResult = classifyInvoiceItemCategory(row);
  return {
    ...row,
    cogsType: row?.cogsType || categoryResult.cogsType,
    category: row?.category || categoryResult.category,
    categoryConfidence: row?.categoryConfidence ?? categoryResult.confidence,
    categoryReason: row?.categoryReason || categoryResult.reason,
    cogsCategory: row?.cogsCategory || categoryResult.cogsCategory,
    cogsCategoryConfidence: row?.cogsCategoryConfidence || categoryResult.cogsCategoryConfidence,
    cogsCategoryReason: row?.cogsCategoryReason || categoryResult.cogsCategoryReason,
  };
}


export function isLikelySupplierCodeToken(token: string) {
  const cleaned = String(token || "").replace(/[^a-z0-9/-]/gi, "").trim();
  if (!cleaned) return false;
  if (isKnownFoodNameToken(cleaned)) return false;
  if (/^\d{2,}[a-z0-9/-]*$/i.test(cleaned)) return true;
  if (/^[a-z]{1,3}\d[a-z0-9/-]*$/i.test(cleaned)) return true;
  if (/^[a-z0-9]+[-/][a-z0-9-]+$/i.test(cleaned) && cleaned.length >= 4) return true;
  if (/^[A-Z]{2,6}$/.test(cleaned) && cleaned.length <= 6) return true;
  return false;
}

export function removeLeadingInvoiceCodeTokens(value: string) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  const removed: string[] = [];

  while (words.length > 1 && isLikelySupplierCodeToken(words[0])) {
    removed.push(words.shift() || "");
  }

  return {
    code: removed.join(" ").trim(),
    text: words.join(" ").trim(),
  };
}

export function hasUsableInvoiceName(value: string) {
  const lettersOnly = String(value || "").replace(/[^a-z]/gi, "");
  const words = normalizeLooseText(value).split(" ").filter((word) => word.length > 2);
  return lettersOnly.length >= 3 && words.length >= 1;
}

export function cleanInvoiceItemName(rawName: string) {
  return String(rawName || "")
    // remove supplier codes at start
    .replace(/^[A-Z0-9\-.]{2,}\s+/, "")

    // remove pack expressions (6 x 1kg etc)
    .replace(/\b\d+\s*x\s*\d+\s*(kg|g|ml|l|each)?\b/gi, " ")

    // remove unit words
    .replace(/\b(kg|g|ml|l|each)\b/gi, " ")

    // remove trailing codes
    .replace(/\b[A-Z]{2,}\b$/g, " ")

    // remove numbers
    .replace(/\b\d+(\.\d+)?\b/g, " ")

    // clean spacing
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeIngredientName(name: string) {
  return String(name || "")
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleCaseIngredientName(name: string) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function smartCleanIngredientName(name: string) {
  let cleaned = String(name || "")
    .replace(/\([^)]*\d[^)]*\)/g, " ")
    .replace(/\bf\s*\/\s*l\b/gi, " fillet ");

  cleaned = normalizeIngredientName(cleaned);

  cleaned = cleaned
    .replace(/\bherbs\s+coriander\b/g, "coriander")
    .replace(/\bherbs\s+mint\b/g, "mint")
    .replace(/\bgarlic\s+chinese\s+peeled\b/g, "garlic chinese peeled")
    .replace(/\bpot\s+(royal|blue|peel|peeled)\b/g, "potato $1");

  const replacements: Record<string, string> = {
    broccolini: "broccolini",
    broc: "broccoli",
    brocc: "broccoli",
    broccoliini: "broccolini",
    bunges: "bunches",
    bunghes: "bunches",
    bunchs: "bunches",
    bun: "bunch",
    bch: "bunch",
    chkn: "chicken",
    chk: "chicken",
    chckn: "chicken",
    brst: "breast",
    brsts: "breast",
    flt: "fillet",
    flet: "fillet",
    tom: "tomato",
    pots: "potatoes",
    carr: "carrot",
    carots: "carrots",
    carrotts: "carrots",
    mush: "mushroom",
    mushrms: "mushrooms",
  };

  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, "g");
    cleaned = cleaned.replace(regex, value);
  });

  cleaned = cleaned
    .replace(/\b(kg|kgs|g|gm|ml|l|ltr|lt|each|ea|pkt|ctn|carton|box|case|pack|pk|bag|tray|tub|tin)\b/g, " ")
    .replace(/\b(fresh|frozen|whole|sliced|diced|chopped|premium|choice|grade|brand|approx|bulbs)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return titleCaseIngredientName(cleaned);
}

export function normalizeInvoiceMatchText(value: string) {
  return normalizeIngredientName(smartCleanIngredientName(value))
    .replace(/\b(fresh|frozen|whole|sliced|diced|chopped|peeled|premium|choice|grade|brand)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getInvoiceMatchTokens(value: string) {
  const stopWords = new Set([
    "and", "the", "for", "with", "from", "food", "foods", "fresh", "frozen", "whole", "sliced", "diced", "chopped",
    "peeled", "premium", "choice", "grade", "brand", "approx", "large", "small", "medium", "natural", "local", "imported",
    "kg", "kgs", "g", "gm", "gram", "grams", "ml", "l", "ltr", "lt", "litre", "litres", "each", "ea", "unit", "units",
    "pkt", "ctn", "carton", "box", "case", "pack", "pk", "bag", "bags", "tray", "tub", "tin", "bottle", "bunch", "inner"
  ]);

  return normalizeIngredientName(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

export function getMatchScore(a: string, b: string) {
  const aTokens = getInvoiceMatchTokens(a);
  const bTokens = getInvoiceMatchTokens(b);

  if (aTokens.length === 0 || bTokens.length === 0) return 0;

  const bSet = new Set(bTokens);
  const matchedTokens = aTokens.filter((token) => bSet.has(token));
  const coverageOfRow = matchedTokens.length / aTokens.length;
  const coverageOfIngredient = matchedTokens.length / bTokens.length;
  const overlap = matchedTokens.length / Math.max(aTokens.length, bTokens.length);

  // Weighted so short clean invoice names like "Broccoli" can still match
  // longer stored names like "Broccoli Bunch" without overmatching weak rows.
  return Math.max(overlap, Math.min(coverageOfRow, coverageOfIngredient), (coverageOfRow + coverageOfIngredient) / 2);
}


export type InvoiceMatchConfidence = "low" | "medium" | "high";

export function normalizeInvoiceIngredientMatchName(value: string) {
  return normalizeIngredientName(String(value || ""))
    .replace(/\b\d+(?:\.\d+)?\s*(?:x|×)\s*\d+(?:\.\d+)?\s*(?:kg|kgs|g|gm|ml|l|ltr|lt|each|ea|pkt|ctn|carton|box|case|pack|pk|bag|tray|tub|tin|bottle|bunch|inner)?\b/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:kg|kgs|g|gm|ml|l|ltr|lt|each|ea|pkt|ctn|carton|box|case|pack|pk|bag|tray|tub|tin|bottle|bunch|inner)\b/g, " ")
    .replace(/\b(?:kg|kgs|g|gm|gram|grams|ml|l|ltr|lt|litre|litres|each|ea|unit|units|pkt|ctn|carton|box|case|pack|pk|bag|bags|tray|tub|tin|bottle|bunch|inner)\b/g, " ")
    .replace(/\b(?:fresh|frozen|whole|sliced|diced|chopped|peeled|premium|choice|grade|brand|approx|large|small|medium|natural|local|imported|food|foods|mbl|pfd|bidfood|campbells|metcash|rapidclean|rapid|clean)\b/g, " ")
    .replace(/\b[a-z]{0,4}\d+[a-z0-9-]*\b/g, " ")
    .replace(/\b\d+(?:\.\d+)?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSupplierMatchKey(supplierName: string, invoiceItemName: string) {
  const supplierKey = normalizeIngredientName(String(supplierName || ""))
    .replace(/\b(?:pty|ltd|limited|food|foods|suppliers|supplier|wholesale|wholesalers|australia|wa|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "unknown_supplier";

  const itemKey = normalizeInvoiceIngredientMatchName(invoiceItemName)
    .replace(/\b(?:food|foods|mbl|pfd|bidfood|campbells|metcash|rapidclean|rapid|clean)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "unknown_item";

  return `${supplierKey}::${itemKey}`;
}

export function buildSupplierMatchMemoryKey(row: any, supplierName: string) {
  const rowSupplierName = String(supplierName || row?.supplierName || row?.supplier || "").trim();
  const rowItemName = String(row?.name || row?.description || row?.itemName || row?.productName || row?.rawLine || "").trim();

  return normalizeSupplierMatchKey(rowSupplierName, rowItemName);
}

export function getInvoiceIngredientMatchScore(rowName: string, ingredientName: string) {
  const normalizedRowName = normalizeInvoiceIngredientMatchName(rowName);
  const normalizedIngredientName = normalizeInvoiceIngredientMatchName(ingredientName);

  if (!normalizedRowName || !normalizedIngredientName) return 0;
  if (normalizedRowName === normalizedIngredientName) return 100;

  const rowTokens = getInvoiceMatchTokens(normalizedRowName);
  const ingredientTokens = getInvoiceMatchTokens(normalizedIngredientName);

  if (!rowTokens.length || !ingredientTokens.length) return 0;

  const ingredientWordSet = new Set(ingredientTokens);
  const matchedTokens = rowTokens.filter((token) => ingredientWordSet.has(token));
  const matchedCount = matchedTokens.length;
  const rowCoverage = matchedCount / rowTokens.length;
  const ingredientCoverage = matchedCount / ingredientTokens.length;
  const tokenScore = getMatchScore(normalizedRowName, normalizedIngredientName);

  // Exact first, contains second, word-overlap third. Reject single generic word matches
  // unless the cleaned names are genuinely short and specific.
  if (normalizedRowName === normalizedIngredientName) return 100;

  if (normalizedRowName.includes(normalizedIngredientName) || normalizedIngredientName.includes(normalizedRowName)) {
    if (Math.min(normalizedRowName.length, normalizedIngredientName.length) >= 5) return 91;
  }

  if (matchedCount >= 2 && tokenScore >= 0.75) return 86;
  if (matchedCount >= 2 && tokenScore >= 0.58) return 74;
  if (matchedCount >= 1 && rowTokens.length === 1 && ingredientTokens.length <= 2 && rowCoverage >= 1) return 72;
  if (matchedCount >= 2 && rowCoverage >= 0.5 && ingredientCoverage >= 0.4) return 66;

  return 0;
}

export function getInvoiceMatchDebugReason(rowName: string, ingredientName: string, score: number, rowCode?: string, ingredientCode?: string) {
  const normalizedRowName = normalizeInvoiceIngredientMatchName(rowName);
  const normalizedIngredientName = normalizeInvoiceIngredientMatchName(ingredientName);
  const normalizedRowCode = String(rowCode || "").trim().toLowerCase();
  const normalizedIngredientCode = String(ingredientCode || "").trim().toLowerCase();

  if (normalizedRowCode && normalizedIngredientCode && normalizedRowCode === normalizedIngredientCode) {
    return "Exact supplier code match.";
  }

  if (normalizedRowName && normalizedIngredientName && normalizedRowName === normalizedIngredientName) {
    return "Exact cleaned name match.";
  }

  if (normalizedRowName && normalizedIngredientName && (normalizedRowName.includes(normalizedIngredientName) || normalizedIngredientName.includes(normalizedRowName))) {
    return "Contains match between cleaned invoice name and ingredient name.";
  }

  if (score > 0) {
    return "Word overlap match between cleaned invoice name and ingredient name.";
  }

  return "No safe match found.";
}

export function matchInvoiceRowToIngredient(row: any, supplierIngredients: any[]) {
  const rowCogsType = normalizeLegacyInvoiceCogsType(row?.cogsType || row?.cogsCategory);
  const cleanedInvoiceName = normalizeInvoiceIngredientMatchName(row?.name || row?.description || row?.rawLine || "");

  if (rowCogsType !== "food_cogs") {
    return {
      matched: false,
      ingredientId: null,
      ingredientName: null,
      confidence: "low" as InvoiceMatchConfidence,
      cleanedInvoiceName,
      matchDebugReason: "Match not required because this row is not Food COGS.",
      matchDebugScore: 0,
      matchDebugCandidateCount: 0,
    };
  }

  const ingredients = Array.isArray(supplierIngredients) ? supplierIngredients : [];
  const rowName = cleanedInvoiceName;
  const rowCode = String(row?.code || row?.supplierCode || row?.productCode || "").trim().toLowerCase();

  if (!rowName || ingredients.length === 0) {
    return {
      matched: false,
      ingredientId: null,
      ingredientName: null,
      confidence: "low" as InvoiceMatchConfidence,
      cleanedInvoiceName,
      matchDebugReason: !rowName ? "No safe match found because the cleaned invoice name is blank." : "No safe match found because there are no ingredient candidates.",
      matchDebugScore: 0,
      matchDebugCandidateCount: 0,
    };
  }

  const comparedCandidates = ingredients
    .map((ingredient: any) => {
      const ingredientName = normalizeInvoiceIngredientMatchName(ingredient?.name || "");
      const ingredientCode = String(ingredient?.code || ingredient?.supplierCode || ingredient?.productCode || "").trim().toLowerCase();
      if (!ingredientName) {
        return { ingredient, ingredientName, ingredientCode, score: 0, reason: "No safe match found because ingredient name is blank." };
      }

      const score = rowCode && ingredientCode && rowCode === ingredientCode
        ? 100
        : getInvoiceIngredientMatchScore(rowName, ingredientName);

      return {
        ingredient,
        ingredientName,
        ingredientCode,
        score: Number.isFinite(score) ? score : 0,
        reason: getInvoiceMatchDebugReason(rowName, ingredientName, Number.isFinite(score) ? score : 0, rowCode, ingredientCode),
      };
    });

  const matchDebugCandidateCount = comparedCandidates.filter((item: any) => Boolean(item.ingredientName)).length;
  const scored = comparedCandidates
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score);

  const best = scored[0] || null;
  const second = scored[1] || null;

  if (!best) {
    return {
      matched: false,
      ingredientId: null,
      ingredientName: null,
      confidence: "low" as InvoiceMatchConfidence,
      cleanedInvoiceName,
      matchDebugReason: "No safe match found.",
      matchDebugScore: 0,
      matchDebugCandidateCount,
    };
  }

  const confidence: InvoiceMatchConfidence = best.score >= 90 ? "high" : best.score >= 72 ? "medium" : "low";
  const isAmbiguous = second && best.score < 90 && best.score - second.score < 12;

  if (isAmbiguous) {
    return {
      matched: false,
      ingredientId: null,
      ingredientName: null,
      confidence: "low" as InvoiceMatchConfidence,
      cleanedInvoiceName,
      matchDebugReason: `Match rejected because candidates were too close: ${String(best.ingredient?.name || "Best candidate")} (${best.score}) vs ${String(second.ingredient?.name || "Second candidate")} (${second.score}).`,
      matchDebugScore: best.score,
      matchDebugCandidateCount,
    };
  }

  if (confidence === "low") {
    return {
      matched: false,
      ingredientId: null,
      ingredientName: null,
      confidence: "low" as InvoiceMatchConfidence,
      cleanedInvoiceName,
      matchDebugReason: `No safe match found. Best candidate was too weak: ${String(best.ingredient?.name || "Unknown candidate")} (${best.score}).`,
      matchDebugScore: best.score,
      matchDebugCandidateCount,
    };
  }

  return {
    matched: true,
    ingredientId: String(best.ingredient?.id || ""),
    ingredientName: String(best.ingredient?.name || ""),
    confidence,
    cleanedInvoiceName,
    matchDebugReason: best.reason || getInvoiceMatchDebugReason(rowName, best.ingredientName, best.score, rowCode, best.ingredientCode),
    matchDebugScore: best.score,
    matchDebugCandidateCount,
  };
}

export function scoreInvoiceIngredientMatch(row: any, ingredient: any) {
  const rowName = normalizeInvoiceIngredientMatchName(row?.name || row?.description || row?.rawLine || "");
  const ingredientName = normalizeInvoiceIngredientMatchName(ingredient?.name || "");
  const rowCode = String(row?.code || row?.supplierCode || row?.productCode || "").trim().toLowerCase();
  const ingredientCode = String(ingredient?.code || ingredient?.supplierCode || ingredient?.productCode || "").trim().toLowerCase();

  if (!rowName || !ingredientName) return 0;
  if (rowCode && ingredientCode && rowCode === ingredientCode) return 100;

  return getInvoiceIngredientMatchScore(rowName, ingredientName);
}

export function findInvoiceIngredientMatch(row: any, supplierIngredients: any[], supplierName: string) {
  const supplierFilter = String(supplierName || "").trim().toLowerCase();
  const candidates = supplierIngredients
    .filter((ingredient: any) => {
      if (!supplierFilter) return true;
      const ingredientSupplier = String(ingredient?.supplierName || "").trim().toLowerCase();
      return !ingredientSupplier || ingredientSupplier === supplierFilter;
    })
    .map((ingredient: any) => ({ ingredient, score: scoreInvoiceIngredientMatch(row, ingredient) }))
    .filter((match: any) => match.score > 0)
    .sort((a: any, b: any) => b.score - a.score);

  const best = candidates[0] || null;
  const second = candidates[1] || null;

  if (!best) return null;
  if (best.score >= 90) return best.ingredient;
  if (best.score >= 72 && (!second || best.score - second.score >= 12)) return best.ingredient;

  return null;
}

export function getInvoiceRowConfidence(row: any, matchedIngredient: any) {
  const matchConfidence = String(row?.matchConfidence || "").toLowerCase();
  if (matchedIngredient && matchConfidence === "high" && safeNumber(row?.lineTotal) > 0 && String(row?.name || "").trim()) return "high";
  if (matchedIngredient && safeNumber(row?.lineTotal) > 0 && String(row?.name || "").trim()) return "medium";
  if (String(row?.name || "").trim() && safeNumber(row?.lineTotal) > 0) return "medium";
  return "low";
}

export function enhanceInvoiceReviewRows(rows: any[], supplierIngredients: any[], supplierName: string) {
  return rows.map((row: any) => {
    const cogsCategoryInfo = classifyInvoiceItemCategory(row);
    const rowWithCategory = {
      ...row,
      cogsType: row?.cogsType || cogsCategoryInfo.cogsType,
      category: row?.category || cogsCategoryInfo.category,
      categoryConfidence: row?.categoryConfidence ?? cogsCategoryInfo.confidence,
      categoryReason: row?.categoryReason || cogsCategoryInfo.reason,
      cogsCategory: row?.cogsCategory || cogsCategoryInfo.cogsCategory,
      cogsCategoryConfidence: row?.cogsCategoryConfidence || cogsCategoryInfo.cogsCategoryConfidence,
      cogsCategoryReason: row?.cogsCategoryReason || cogsCategoryInfo.cogsCategoryReason,
    };

    const matchResult = matchInvoiceRowToIngredient(rowWithCategory, supplierIngredients);
    const matchedIngredient = matchResult.matched
      ? (Array.isArray(supplierIngredients) ? supplierIngredients : []).find((ingredient: any) => String(ingredient?.id || "") === matchResult.ingredientId) || null
      : null;
    const linkedIngredientId = row?.linkedIngredientId || matchResult.ingredientId || "";
    const matchedIngredientName = row?.matchedIngredientName || matchResult.ingredientName || "";
    const matchConfidence = row?.matchConfidence || matchResult.confidence;
    const confidence = getInvoiceRowConfidence({ ...rowWithCategory, matchConfidence }, matchedIngredient);
    const existingStatus = row?.status;
    const status = existingStatus || (linkedIngredientId ? "matched" : rowWithCategory.cogsType === "food_cogs" ? "needs_match" : "reviewed");
    const supplierNameForLearning = String(supplierName || rowWithCategory?.supplierName || "").trim();
    const supplierMatchKey = buildSupplierMatchMemoryKey(rowWithCategory, supplierNameForLearning);
    const suggestedLearningLabel = linkedIngredientId
      ? `Remember ${String(rowWithCategory?.name || "invoice row")} as ${String(matchedIngredientName || "matched ingredient")}`
      : rowWithCategory.cogsType === "food_cogs"
        ? `No safe learning suggestion yet for ${String(rowWithCategory?.name || "invoice row")}`
        : "Learning not required for non-food row";

    return {
      ...rowWithCategory,
      confidence,
      status,
      linkedIngredientId,
      matchedIngredientName,
      matchConfidence,
      cleanedInvoiceName: row?.cleanedInvoiceName || matchResult.cleanedInvoiceName || normalizeInvoiceIngredientMatchName(rowWithCategory?.name || rowWithCategory?.description || rowWithCategory?.rawLine || ""),
      matchDebugReason: row?.matchDebugReason || matchResult.matchDebugReason || "No safe match found.",
      matchDebugScore: Number(row?.matchDebugScore ?? matchResult.matchDebugScore ?? 0) || 0,
      matchDebugCandidateCount: Number(row?.matchDebugCandidateCount ?? matchResult.matchDebugCandidateCount ?? 0) || 0,
      supplierMatchKey: row?.supplierMatchKey || supplierMatchKey,
      supplierNameForLearning: row?.supplierNameForLearning || supplierNameForLearning,
      suggestedLearningLabel: row?.suggestedLearningLabel || suggestedLearningLabel,
      code: row?.code || "",
      name: row?.name || "",
      qty: row?.qty ?? "",
      unit: row?.unit || "each",
      unitPrice: row?.unitPrice ?? "",
      lineTotal: row?.lineTotal ?? "",
      purchaseUnit: row?.purchaseUnit || "box",
      amountInPurchaseUnit: row?.amountInPurchaseUnit || "1",
      sizePerItem: row?.sizePerItem || "1",
      sizeUnit: row?.sizeUnit || "each",
    };
  });
}

export function normalizeDeliveryNoteUnit(unit: string) {
  const upper = String(unit || "").trim().toUpperCase();
  if (upper === "CTN" || upper === "CARTON") return "carton";
  if (upper === "BUNCH") return "bunch";
  if (upper === "KG") return "kg";
  if (upper === "EACH" || upper === "EA") return "each";
  if (upper === "BAG") return "bag";
  if (upper === "BOX") return "box";
  if (upper === "CASE") return "case";
  if (upper === "PACK" || upper === "PK") return "pack";
  if (upper === "L") return "l";
  if (upper === "ML") return "ml";
  if (upper === "G") return "g";
  return String(unit || "each").toLowerCase();
}

export function parseDeliveryNoteStyleRow(line: string, supplierName: string, index: number) {
  const cleanedLine = String(line || "").replace(/\s+/g, " ").trim();
  const tokens = cleanedLine.split(" ").filter(Boolean);
  const deliveryUnits = new Set(["CTN", "CARTON", "BUNCH", "KG", "EACH", "EA", "BAG", "BOX", "CASE", "PACK", "PK", "L", "ML", "G"]);

  if (tokens.length < 4) return null;

  const code = tokens[0];
  if (!/^[A-Z0-9]{2,10}$/i.test(code) || /^(code|date|page|notes?)$/i.test(code)) return null;

  const supplyIndex = [...tokens].reverse().findIndex((token) => /^\d+(?:\.\d{1,2})$/.test(token));
  if (supplyIndex < 0) return null;

  const lastSupplyIndex = tokens.length - 1 - supplyIndex;
  const supplyValue = safeNumber(tokens[lastSupplyIndex]);
  const beforeSupply = tokens.slice(1, lastSupplyIndex);
  if (beforeSupply.length < 2) return null;

  let unitIndex = -1;
  for (let i = beforeSupply.length - 1; i >= 0; i -= 1) {
    const normalized = beforeSupply[i].replace(/[^A-Z]/gi, "").toUpperCase();
    if (deliveryUnits.has(normalized)) {
      unitIndex = i;
      break;
    }
  }

  if (unitIndex <= 0) return null;

  const rawUnit = beforeSupply[unitIndex].replace(/[^A-Z]/gi, "").toUpperCase();
  const unit = normalizeDeliveryNoteUnit(rawUnit);
  const description = beforeSupply.slice(0, unitIndex).join(" ").trim();
  const cleanedName = smartCleanIngredientName(description);

  if (!hasUsableInvoiceName(cleanedName)) return null;

  const purchaseUnit = purchaseUnitOptions.includes(unit) ? unit : unit === "kg" || unit === "g" || unit === "l" || unit === "ml" ? "box" : "each";
  const sizeUnit = sizeUnitOptions.includes(unit) ? unit : "each";

  return {
    id: `invoice_row_${Date.now()}_${index}`,
    code,
    name: cleanedName,
    qty: supplyValue,
    unit,
    unitPrice: "",
    lineTotal: "",
    selected: true,
    rawLine: line,
    supplierName,
    purchasePrice: "",
    purchaseUnit,
    amountInPurchaseUnit: "1",
    sizePerItem: "1",
    sizeUnit,
    confidence: "medium",
    status: "needs_match",
    linkedIngredientId: "",
  };
}

export function isLikelyInvoiceItemLine(line: string) {
  const lower = String(line || "").toLowerCase();

  if (/\b(freight|delivery fee|fuel levy|surcharge|rounding|credit|deposit|gst only|admin fee)\b/i.test(lower)) {
    return false;
  }

  if (/^\s*[\d\s\-\/:.]+\s*$/.test(line)) {
    return false;
  }

  if (!/[a-zA-Z]/.test(line)) {
    return false;
  }

  return hasInvoiceMoneyValue(line) || /\b(carton|ctn|box|case|pack|pk|kg|g|l|ml|each|ea|bag|bunch|tray|tub|tin)\b/i.test(line);
}

export function parseSupplierInvoiceText(importText: string, supplierName: string) {
  const lines = buildInvoiceCandidateLines(applyInvoiceSupplierProfile(importText, supplierName));

  return lines
    .map((line, index) => {
      const deliveryNoteRow = parseDeliveryNoteStyleRow(line, supplierName, index);
      if (deliveryNoteRow && (safeNumber(deliveryNoteRow.lineTotal) > 0 || !hasInvoiceMoneyValue(line))) {
        return deliveryNoteRow;
      }

      if (!isLikelyInvoiceItemLine(line)) {
        return null;
      }

      const lowerLine = line.toLowerCase();
      const headerOrTotalLine = /\b(invoice|subtotal|total|gst|sale amount|amount due|balance due|tax invoice|statement|remittance|abn|account|customer|delivery address)\b/i.test(lowerLine);
      const likelyFoodLine = /\b(bread|meat|fruit|veg|vegetable|dairy|cheese|milk|cream|oil|sauce|bun|panini|produce|chicken|beef|lamb|pork|fish|salmon|barramundi|tomato|potato|lettuce|onion|garlic|flour|rice|pasta|egg|butter|avocado|mushroom|broccoli|broccolini|carrot|cabbage|spinach|beans|peas|corn|prawn|squid|bacon|ham|sausage)\b/i.test(lowerLine);
      const likelyFeeLine = /\b(freight|delivery fee|fuel levy|surcharge|rounding|credit|deposit|gst only|admin fee)\b/i.test(lowerLine);

      if (likelyFeeLine) return null;
      if (isInvoiceDocumentNoiseLine(line)) return null;
      if (line.length > 180 && /(abn|deliver to|delivery address|dispatch date|order date|invoice no|phone|email|perth metro|jandakot|waroona|awards?)/i.test(lowerLine)) return null;
      if (headerOrTotalLine && !likelyFoodLine) return null;

      const moneyMatches = getInvoiceMoneyMatches(line);
      if (moneyMatches.length === 0) return null;

      const lineTotalMatch = moneyMatches[moneyMatches.length - 1];
      const unitPriceMatch = moneyMatches.length > 1 ? moneyMatches[moneyMatches.length - 2] : lineTotalMatch;
      const lineTotal = safeNumber(lineTotalMatch.value);
      const unitPrice = safeNumber(unitPriceMatch.value);
      if (lineTotal <= 0 && unitPrice <= 0) return null;

      const beforeTotals = line.slice(0, lineTotalMatch.index).trim();
      const withoutLeadingCodes = removeLeadingInvoiceCodeTokens(beforeTotals);
      const code = withoutLeadingCodes.code;
      const rawNameArea = withoutLeadingCodes.text || beforeTotals;

      const packDetails = parseInvoicePackDetails(rawNameArea);
      const qtyUnitMatch = rawNameArea.match(/\b(\d+(?:\.\d+)?)\s*(carton|ctn|box|case|pack|pk|kg|g|l|ml|each|ea|unit|units|bag|bunch|tray|tub|tin)\b/i);
      const packQtyMatch = rawNameArea.match(/\b(\d+(?:\.\d+)?)\s*(?:x|×)\s*\d+(?:\.\d+)?\s*(kg|g|l|ml|each|ea|pack|box|carton|bottle|bag|bunch|tray|tub|jar|tin|case|pk)\b/i);
      const parsedQty = packQtyMatch ? safeNumber(packQtyMatch[1]) : qtyUnitMatch ? safeNumber(qtyUnitMatch[1]) : 1;
      const unit = normalizeInvoiceUnit(qtyUnitMatch?.[2] || (packQtyMatch ? "pack" : "each"));
      const qty = isPlausibleInvoiceQuantity(parsedQty, unit) ? parsedQty : 1;

      const cleanedName = smartCleanIngredientName(cleanInvoiceItemName(rawNameArea));
      if (!hasUsableInvoiceName(cleanedName)) return null;

      const purchaseUnit = ["each", "pack", "box", "carton", "bottle", "bag", "bunch", "tray", "tub", "jar", "tin", "case"].includes(unit)
        ? unit
        : packDetails.sizeUnit !== "each"
          ? "pack"
          : "box";

      return {
        id: `invoice_row_${Date.now()}_${index}`,
        code,
        name: cleanedName,
        qty,
        unit,
        unitPrice,
        lineTotal,
        selected: true,
        rawLine: line,
        supplierName,
        purchasePrice: String(lineTotal || unitPrice),
        purchaseUnit,
        amountInPurchaseUnit: packDetails.amountInPurchaseUnit,
        sizePerItem: packDetails.sizePerItem,
        sizeUnit: sizeUnitOptions.includes(packDetails.sizeUnit) ? packDetails.sizeUnit : "each",
        confidence: "low",
        status: "needs_match",
        linkedIngredientId: "",
      };
    })
    .filter(Boolean)
    .map((row: any) => attachInvoiceCogsClassification(row));
}


export function parseMblColumnInvoiceRows(importText: string, supplierName: string) {
  const supplier = normalizeLooseText(supplierName);
  const looksLikeMbl = /mbl|food packaging|packaging limited/.test(supplier) || /MBL Food|MBL FOOD|RAPIDCLEAN|Unit \$|Extended Total/i.test(importText);
  if (!looksLikeMbl) return [];

  const sourceLines = cleanInvoiceOcrText(importText)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const unitWords = "EA|EACH|BAG|PKT|PACK|CTN|CARTON|TIN|KG|G|L|ML|INNE|INNER|BOX|CASE|TUB|JAR|BOTTLE";
  const rows: any[] = [];

  sourceLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    if (/\b(stock code|description|order qty|suppl|customer|invoice to|ship to|account|salesperson|preferred|freight|delivery surcharge|card surcharge|terms|returns|email|address|phone|tax invoice|page)\b/i.test(lowerLine)) {
      return;
    }

    const moneyMatches = getInvoiceMoneyMatches(line);
    if (moneyMatches.length < 3) return;

    const lineTotalMatch = moneyMatches[moneyMatches.length - 1];
    const gstMatch = moneyMatches[moneyMatches.length - 2];
    const unitPriceMatch = moneyMatches[moneyMatches.length - 3];

    const lineTotal = safeNumber(lineTotalMatch.value);
    const gstAmount = safeNumber(gstMatch.value);
    const unitPrice = safeNumber(unitPriceMatch.value);
    if (lineTotal <= 0 || unitPrice <= 0) return;

    const afterUnitPrice = line.slice(unitPriceMatch.index + unitPriceMatch.raw.length);
    const unitMatch = afterUnitPrice.match(new RegExp(`^\\s*(${unitWords})\\b`, "i")) || afterUnitPrice.match(new RegExp(`\\b(${unitWords})\\b`, "i"));
    const unit = normalizeInvoiceUnit(unitMatch?.[1] || "each");

    const beforeUnitPrice = line.slice(0, unitPriceMatch.index).trim();
    let tokens = beforeUnitPrice.split(/\s+/).filter(Boolean);
    let code = "";

    if (/^\d{4,}$/.test(tokens[0] || "")) {
      code = tokens.shift() || "";
    } else if (/^[A-Z]{1,4}\d{2,}$/i.test(tokens[0] || "")) {
      code = tokens.shift() || "";
    }

    // Remove OCR fragments that are usually broken leading code/column noise.
    while (tokens.length > 1 && /^(eo|te|b|jee|eve|py|mbl|pr|wd|li|oi|l|o)$/i.test(tokens[0])) {
      tokens.shift();
    }

    // Drop quantity columns immediately before the unit price when OCR preserved them.
    while (tokens.length > 1 && /^\d+(?:\.\d+)?$/.test(tokens[tokens.length - 1])) {
      tokens.pop();
    }

    const rawName = tokens.join(" ").trim();
    const cleanedName = smartCleanIngredientName(cleanInvoiceItemName(rawName));
    if (!hasUsableInvoiceName(cleanedName)) return;

    const exGstTotal = Math.max(lineTotal - gstAmount, 0);
    const calculatedQty = unitPrice > 0 ? exGstTotal / unitPrice : 1;
    const qty = Number.isFinite(calculatedQty) && calculatedQty > 0
      ? roundTo(Math.abs(calculatedQty - Math.round(calculatedQty)) < 0.08 ? Math.round(calculatedQty) : calculatedQty, 2)
      : 1;

    const packDetails = parseInvoicePackDetails(rawName);
    const purchaseUnit = ["each", "pack", "box", "carton", "bottle", "bag", "bunch", "tray", "tub", "jar", "tin", "case"].includes(unit)
      ? unit
      : packDetails.sizeUnit !== "each"
        ? "pack"
        : "box";

    rows.push({
      id: `invoice_mbl_row_${Date.now()}_${index}`,
      code,
      name: cleanedName,
      qty,
      unit,
      unitPrice,
      lineTotal,
      gstAmount,
      selected: true,
      rawLine: line,
      supplierName,
      purchasePrice: String(lineTotal || unitPrice),
      purchaseUnit,
      amountInPurchaseUnit: packDetails.amountInPurchaseUnit,
      sizePerItem: packDetails.sizePerItem,
      sizeUnit: sizeUnitOptions.includes(packDetails.sizeUnit) ? packDetails.sizeUnit : "each",
      confidence: "medium",
      status: "needs_match",
      linkedIngredientId: "",
    });
  });

  return rows.map((row: any) => attachInvoiceCogsClassification(row));
}

export function parseSupplierInvoiceTextSmart(importText: string, supplierName: string) {
  const mblRows = parseMblColumnInvoiceRows(importText, supplierName);
  if (mblRows.length >= 3) {
    return mblRows;
  }

  return parseSupplierInvoiceText(importText, supplierName);
}

export function parseLooseNumber(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return 0;

  if (trimmed.includes("/")) {
    const [top, bottom] = trimmed.split("/");
    const numerator = parseFloat(top);
    const denominator = parseFloat(bottom);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  const parsed = parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}
