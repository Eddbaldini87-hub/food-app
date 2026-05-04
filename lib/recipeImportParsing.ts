import { normalizeLooseText, roundTo } from "./gpPoliceHelpers";
import { parseLooseNumber } from "./invoiceParsing";

export function findBestLinkedIngredientId(rawName: string, supplierIngredients: any[]) {
  const normalizedTarget = normalizeLooseText(rawName);
  if (!normalizedTarget) return "";

  const exact = supplierIngredients.find((ingredient: any) => normalizeLooseText(ingredient.name) === normalizedTarget);
  if (exact) return exact.id;

  const targetTokens = normalizedTarget.split(" ").filter(Boolean);

  const partial = supplierIngredients.find((ingredient: any) => {
    const normalizedIngredient = normalizeLooseText(ingredient.name);
    return (
      normalizedIngredient.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedIngredient) ||
      targetTokens.every((token) => normalizedIngredient.includes(token))
    );
  });

  return partial ? partial.id : "";
}

export function extractDocxTextFallbackMessage(fileName: string) {
  return String(fileName || "Word recipe file") + " is a Word .docx file. This build has no docx reader package installed yet, so copy the recipe text from Word and paste it into the recipe import box instead.";
}

export function parseImportedRecipeText(importText: string, supplierIngredients: any[], recipeType: string) {
  const normalizedText = String(importText || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();

  if (!normalizedText) return null;

  const rawLines = normalizedText.split("\n").map((line) => line.replace(/\s+/g, " ").trim());
  const nonEmptyLines = rawLines.filter(Boolean);
  if (nonEmptyLines.length === 0) return null;

  const stripHeadingPunctuation = (value: string) => String(value || "").replace(/[：:;\-–—]+$/g, "").trim().toLowerCase();
  const sectionHeading = (value: string) => stripHeadingPunctuation(value);
  const isIngredientHeading = (value: string) => /^(ingredients?|ingredient list|components?)$/i.test(sectionHeading(value));
  const isMethodHeading = (value: string) => /^(method|methods|instructions?|directions?|prep|preparation|procedure|steps?|notes?|note)$/i.test(sectionHeading(value));
  const isYieldHeading = (value: string) => /^(yield|serves?|makes?|portions?)\b/i.test(sectionHeading(value));
  const isAnyHeading = (value: string) => isIngredientHeading(value) || isMethodHeading(value) || isYieldHeading(value);

  const titleLine = nonEmptyLines.find((line) => {
    const cleaned = stripHeadingPunctuation(line);
    return !isAnyHeading(cleaned) && !/^recipe\s*name\s*[:\-–—]/i.test(line) && line.length > 2;
  }) || "Imported Recipe";

  let recipeName = titleLine.replace(/^recipe\s*name\s*[:\-–—]\s*/i, "").trim() || "Imported Recipe";
  let yieldAmount = "";
  let yieldUnit = recipeType === "final dish" ? "serve" : "g";

  const yieldLine = nonEmptyLines.find((line) => /\b(yield|makes|serve|serves|portion|portions)\b/i.test(line));
  if (yieldLine) {
    const yieldMatch = yieldLine.match(/(\d+(?:\.\d+)?|\d+\/\d+)\s*(kg|g|l|ml|each|ea|serve|serves|portion|portions)?/i);
    if (yieldMatch) {
      yieldAmount = String(roundTo(parseLooseNumber(yieldMatch[1]), 2));
      const rawUnit = String(yieldMatch[2] || "").toLowerCase();
      if (rawUnit === "serves") yieldUnit = "serve";
      else if (rawUnit === "portions") yieldUnit = "portion";
      else if (rawUnit === "ea") yieldUnit = "each";
      else if (rawUnit) yieldUnit = rawUnit;
    }
  }

  let inIngredientSection = false;
  let inMethodSection = false;
  const ingredientLines: string[] = [];
  const methodLines: string[] = [];
  const looseNoteLines: string[] = [];
  const ingredientLikePattern = /^[-•*]?\s*(\d+(?:\.\d+)?|\d+\/\d+)\s*(?:x\s*)?(kg|g|l|ml|each|ea)?\b\s*(.+)?/i;

  rawLines.forEach((line) => {
    const trimmedLine = String(line || "").trim();
    if (!trimmedLine) {
      if (inMethodSection && methodLines.length > 0) methodLines.push("");
      return;
    }
    if (trimmedLine === titleLine || trimmedLine === recipeName) return;

    const inlineName = trimmedLine.match(/^recipe\s*name\s*[:\-–—]\s*(.+)$/i);
    if (inlineName && inlineName[1].trim()) {
      recipeName = inlineName[1].trim();
      return;
    }

    if (isIngredientHeading(trimmedLine)) {
      inIngredientSection = true;
      inMethodSection = false;
      return;
    }
    if (isMethodHeading(trimmedLine)) {
      inIngredientSection = false;
      inMethodSection = true;
      return;
    }

    const inlineIngredientHeading = trimmedLine.match(/^ingredients?\s*[:\-–—]\s*(.+)$/i);
    if (inlineIngredientHeading) {
      inIngredientSection = true;
      inMethodSection = false;
      if (inlineIngredientHeading[1].trim()) ingredientLines.push(inlineIngredientHeading[1].trim());
      return;
    }

    const inlineMethodHeading = trimmedLine.match(/^(method|methods|instructions?|directions?|prep|preparation|procedure|notes?)\s*[:\-–—]\s*(.+)$/i);
    if (inlineMethodHeading) {
      inIngredientSection = false;
      inMethodSection = true;
      if (inlineMethodHeading[2].trim()) methodLines.push(inlineMethodHeading[2].trim());
      return;
    }

    if (isYieldHeading(trimmedLine)) return;

    if (inIngredientSection) {
      ingredientLines.push(trimmedLine);
      return;
    }
    if (inMethodSection) {
      methodLines.push(trimmedLine);
      return;
    }
    if (ingredientLikePattern.test(trimmedLine)) {
      ingredientLines.push(trimmedLine.replace(/^[-•*]\s*/, ""));
      return;
    }
    looseNoteLines.push(trimmedLine);
  });

  const parsedComponents = ingredientLines.map((line, index) => {
    const cleaned = String(line || "").replace(/^[-•*]\s*/, "").trim();
    if (!cleaned) return null;
    const match = cleaned.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*(?:x\s*)?(kg|g|l|ml|each|ea)?\b\s*(.+)?$/i);
    if (!match) {
      const unmatchedName = cleaned.replace(/[.,;:]$/g, "").trim();
      return {
        id: "component_import_" + Date.now() + "_" + index,
        componentType: "supplier",
        linkedId: findBestLinkedIngredientId(unmatchedName, supplierIngredients),
        quantity: "",
        unit: "g",
        section: "Imported",
        importedName: unmatchedName,
        rawText: cleaned,
      };
    }

    const quantity = roundTo(parseLooseNumber(match[1]), 2);
    const rawUnit = String(match[2] || "").toLowerCase();
    const normalizedUnit = rawUnit === "ea" ? "each" : rawUnit || "g";
    const rawName = String(match[3] || "").replace(/^[x×]\s*/i, "").replace(/,.*$/, "").replace(/[.,;:]$/g, "").replace(/\s+/g, " ").trim();
    const linkedId = findBestLinkedIngredientId(rawName, supplierIngredients);

    return {
      id: "component_import_" + Date.now() + "_" + index,
      componentType: "supplier",
      linkedId,
      quantity: quantity > 0 ? String(quantity) : "",
      unit: ["g", "kg", "ml", "l", "each"].includes(normalizedUnit) ? normalizedUnit : "g",
      section: "Imported",
      importedName: rawName,
      rawText: cleaned,
    };
  }).filter(Boolean);

  const notesParts = [];
  if (methodLines.length > 0) notesParts.push(methodLines.join("\n").trim());
  if (looseNoteLines.length > 0) notesParts.push(looseNoteLines.join("\n").trim());

  return {
    name: recipeName,
    yieldAmount,
    yieldUnit,
    notes: notesParts.filter(Boolean).join("\n\n").trim(),
    components: parsedComponents,
  };
}


export const importedRecipeUnitOptions = ["g", "kg", "ml", "l", "litre", "litres", "each", "ea", "bunch", "tin", "tins", "can", "cans", "packet", "pack", "pkt", "carton", "ctn", "tbsp", "tsp", "to taste"];

export function normalizeImportedIngredientName(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b(kg|g|gm|ml|l|litre|litres|each|ea|pkt|pack|packet|ctn|carton|tin|tins|can|cans|bunch|tbsp|tsp|to taste)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeImportedRecipeType(value: string) {
  if (value === "ingredient_prep") return "ingredient prep";
  if (value === "batch_recipe") return "batch recipe";
  if (value === "final_dish") return "final dish";
  return value || "batch recipe";
}

export function denormalizeImportedRecipeType(value: string) {
  if (value === "ingredient prep") return "ingredient_prep";
  if (value === "batch recipe") return "batch_recipe";
  if (value === "final dish") return "final_dish";
  return "batch_recipe";
}

export function normalizeImportedUnitForComponent(unit: string) {
  const lower = String(unit || "").toLowerCase();
  if (lower === "litre" || lower === "litres") return "l";
  if (lower === "ea") return "each";
  if (["bunch", "tin", "tins", "can", "cans", "packet", "pack", "pkt", "carton", "ctn", "tbsp", "tsp"].includes(lower)) return "each";
  if (["g", "kg", "ml", "l", "each"].includes(lower)) return lower;
  return "each";
}

export function parseImportedIngredientLine(rawLine: string) {
  const rawText = String(rawLine || "").replace(/^[-•*]\s*/, "").trim();
  const lower = rawText.toLowerCase();

  if (!rawText) {
    return { rawText, ingredientName: "", quantity: "", unit: "g", status: "ignored" };
  }

  if (/\bto taste\b/i.test(rawText)) {
    const ingredientName = rawText.replace(/\bto taste\b/gi, "").replace(/[.,;:]$/g, "").trim();
    return { rawText, ingredientName, quantity: "", unit: "to taste", status: "needs_qty" };
  }

  const unitPattern = "(kg|g|gm|ml|l|litre|litres|each|ea|bunch|tin|tins|can|cans|packet|pack|pkt|carton|ctn|tbsp|tsp)";
  const leading = rawText.match(new RegExp("^\\s*(\\d+(?:\\.\\d+)?|\\d+\\/\\d+)\\s*(?:x\\s*)?"+unitPattern+"?\\b\\s*(.+)$", "i"));
  const trailing = rawText.match(new RegExp("^(.+?)\\s+(?:x\\s*)?(\\d+(?:\\.\\d+)?|\\d+\\/\\d+)\\s*"+unitPattern+"?\\b\\s*$", "i"));
  const stuckLeading = rawText.match(new RegExp("^\\s*(\\d+(?:\\.\\d+)?|\\d+\\/\\d+)\\s*"+unitPattern+"\\s+(.+)$", "i"));
  const stuckTrailing = rawText.match(new RegExp("^(.+?)\\s+(\\d+(?:\\.\\d+)?|\\d+\\/\\d+)\\s*"+unitPattern+"\\s*$", "i"));

  let quantity: any = "";
  let unit = "g";
  let ingredientName = rawText;

  if (stuckLeading) {
    quantity = roundTo(parseLooseNumber(stuckLeading[1]), 2);
    unit = String(stuckLeading[2] || "g").toLowerCase();
    ingredientName = stuckLeading[3] || "";
  } else if (stuckTrailing) {
    ingredientName = stuckTrailing[1] || "";
    quantity = roundTo(parseLooseNumber(stuckTrailing[2]), 2);
    unit = String(stuckTrailing[3] || "g").toLowerCase();
  } else if (leading) {
    quantity = roundTo(parseLooseNumber(leading[1]), 2);
    unit = String(leading[2] || "each").toLowerCase();
    ingredientName = leading[3] || "";
  } else if (trailing) {
    ingredientName = trailing[1] || "";
    quantity = roundTo(parseLooseNumber(trailing[2]), 2);
    unit = String(trailing[3] || "each").toLowerCase();
  }

  ingredientName = String(ingredientName || "")
    .replace(/\b(to taste)\b/gi, "")
    .replace(new RegExp("\\b"+unitPattern+"\\b", "gi"), " ")
    .replace(/\b\d+(?:\.\d+)?\b/g, " ")
    .replace(/[.,;:]$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!ingredientName) ingredientName = rawText;
  if (unit === "gm") unit = "g";
  if (unit === "litre" || unit === "litres") unit = "l";
  if (unit === "ea") unit = "each";

  return {
    rawText,
    ingredientName,
    quantity,
    unit,
    status: quantity === "" ? "needs_qty" : "needs_match",
  };
}

export function findImportedIngredientMatch(ingredientName: string, supplierIngredients: any[]) {
  const normalizedTarget = normalizeImportedIngredientName(ingredientName);
  if (!normalizedTarget) return null;

  const normalizedIngredients = supplierIngredients.map((ingredient: any) => ({
    ingredient,
    normalized: normalizeImportedIngredientName(ingredient.name),
    supplierCode: normalizeImportedIngredientName(ingredient.code || ingredient.supplierCode || ingredient.productCode || ""),
  }));

  const exact = normalizedIngredients.find((item: any) => item.normalized === normalizedTarget);
  if (exact) return exact.ingredient;

  const contains = normalizedIngredients.filter((item: any) => item.normalized.includes(normalizedTarget) || normalizedTarget.includes(item.normalized));
  if (contains.length === 1) return contains[0].ingredient;

  const codeMatch = normalizedIngredients.find((item: any) => item.supplierCode && item.supplierCode === normalizedTarget);
  if (codeMatch) return codeMatch.ingredient;

  return null;
}

export function buildImportedRecipeDraftFromText(importText: string, supplierIngredients: any[], recipeType: string) {
  const parsedRecipe = parseImportedRecipeText(importText, supplierIngredients, recipeType);
  if (!parsedRecipe) return null;

  const lines = (parsedRecipe.components || []).map((component: any, index: number) => {
    const rawText = component.rawText || component.importedName || "";
    const parsedLine = parseImportedIngredientLine(rawText || `${component.quantity || ""} ${component.unit || ""} ${component.importedName || ""}`.trim());
    const match = findImportedIngredientMatch(parsedLine.ingredientName || component.importedName || "", supplierIngredients);
    const quantity = parsedLine.quantity !== "" ? parsedLine.quantity : component.quantity || "";
    const unit = parsedLine.unit || component.unit || "g";
    const status = match ? "matched" : quantity === "" ? "needs_qty" : "needs_match";

    return {
      id: `import_review_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
      rawText: rawText || `${quantity} ${unit} ${parsedLine.ingredientName}`.trim(),
      ingredientName: parsedLine.ingredientName || component.importedName || "",
      matchedIngredientId: match ? match.id : null,
      matchedIngredientName: match ? match.name : null,
      quantity,
      unit,
      status,
    };
  });

  return {
    name: parsedRecipe.name || "Imported Recipe",
    type: denormalizeImportedRecipeType(recipeType),
    category: "",
    yieldAmount: parsedRecipe.yieldAmount || "",
    yieldUnit: parsedRecipe.yieldUnit || (recipeType === "final dish" ? "each" : "g"),
    method: parsedRecipe.notes || "",
    lines,
  };
}
