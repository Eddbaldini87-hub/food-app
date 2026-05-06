export function normalizeInvoiceIngredientMatchText(value: any) {
  return String(value || "")
    .toLowerCase()
    .replace(/\$?\d+(?:\.\d{2})?/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:x|kg|kgs|g|gm|gram|grams|l|lt|ltr|litre|litres|ml|ea|each|box|ctn|carton|bag|bunch|bun|pkt|pack|pc|pcs|unit|units|tray|tub|tin|bottle|case)\b/g, " ")
    .replace(/\b(?:kg|kgs|g|gm|gram|grams|l|lt|ltr|litre|litres|ml|ea|each|box|ctn|carton|bag|bunch|bun|pkt|pack|pc|pcs|unit|units|tray|tub|tin|bottle|case|fresh|frozen|chilled|whole|sliced|diced|chopped|peeled|premium|choice|grade|brand|approx|small|large|medium|ord|del|qty|supply|supplied|unit|price|total|gst|code|product|description)\b/g, " ")
    .replace(/\b[a-z]{0,3}\d+[a-z0-9-]*\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSupplierMatchText(value: any) {
  return normalizeInvoiceIngredientMatchText(value);
}

export function getInvoiceIngredientMatchTokens(value: any) {
  const weakWords = new Set([
    "fresh", "frozen", "chilled", "whole", "sliced", "diced", "shredded", "fillet", "fillets",
    "portion", "portions", "pack", "pkt", "box", "ctn", "carton", "bag", "kg", "kgs", "g", "gm",
    "l", "lt", "ml", "ea", "each", "unit", "units", "premium", "choice", "brand", "large", "small",
  ]);

  return normalizeInvoiceIngredientMatchText(value)
    .split(" ")
    .filter((token) => token.length >= 3 && !weakWords.has(token));
}

export function buildSupplierMatchMemoryKey(row: any, supplierName: string) {
  const normalizedSupplierName = normalizeSupplierMatchText(supplierName || row?.supplierNameForLearning || row?.supplierName || "Unknown Supplier");
  const normalizedCleanName = normalizeSupplierMatchText(
    [row?.cleanedInvoiceName, row?.name, row?.description, row?.itemName, row?.productName, row?.rawLine]
      .filter(Boolean)
      .join(" ")
  );

  if (!normalizedSupplierName || !normalizedCleanName) return "";
  return `${normalizedSupplierName}::${normalizedCleanName}`;
}

function getSupplierMatchMemoryEntry(row: any, supplierName: string, supplierMatchMemory: Record<string, any>) {
  const exactKey = buildSupplierMatchMemoryKey(row, supplierName);
  if (exactKey && supplierMatchMemory?.[exactKey] && typeof supplierMatchMemory[exactKey] === "object" && !Array.isArray(supplierMatchMemory[exactKey])) {
    return { ...supplierMatchMemory[exactKey], matchDebugReason: "Exact learned supplier match memory" };
  }

  const rowCleanName = normalizeSupplierMatchText(
    [row?.cleanedInvoiceName, row?.name, row?.description, row?.itemName, row?.productName, row?.rawLine]
      .filter(Boolean)
      .join(" ")
  );
  const supplierKey = normalizeSupplierMatchText(supplierName);

  if (!supplierKey || !rowCleanName) return null;

  const fallback = Object.entries(supplierMatchMemory || {})
    .map(([key, entry]: [string, any]) => {
      if (!key.startsWith(`${supplierKey}::`) || !entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const learnedName = key.split("::").slice(1).join("::");
      const learnedTokens = getInvoiceIngredientMatchTokens(learnedName);
      const rowTokens = getInvoiceIngredientMatchTokens(rowCleanName);
      const sharedTokens = learnedTokens.filter((token: string) => rowTokens.includes(token));
      const overlap = sharedTokens.length / Math.max(Math.min(learnedTokens.length, rowTokens.length), 1);
      const directContains = rowCleanName.includes(learnedName) || learnedName.includes(rowCleanName);
      const score = sharedTokens.length * 10 + (directContains ? 30 : 0) + Math.round(overlap * 15);
      return { entry, score, sharedTokenCount: sharedTokens.length };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score)[0] as any;

  if (!fallback || fallback.score < 24 || fallback.sharedTokenCount < 2) return null;
  return { ...fallback.entry, matchDebugReason: "Fuzzy learned supplier match memory" };
}

function scoreIngredientMatch(row: any, ingredient: any) {
  const rowName = normalizeInvoiceIngredientMatchText(
    [row?.cleanedInvoiceName, row?.name, row?.description, row?.itemName, row?.productName, row?.rawLine]
      .filter(Boolean)
      .join(" ")
  );
  const ingredientName = normalizeInvoiceIngredientMatchText(ingredient?.name || "");
  const rowTokens = getInvoiceIngredientMatchTokens(rowName);
  const ingredientTokens = getInvoiceIngredientMatchTokens(ingredientName);

  if (!rowName || !ingredientName || rowTokens.length === 0 || ingredientTokens.length === 0) return null;

  const rowContainsIngredient = rowName.includes(ingredientName) && ingredientName.length >= 4;
  const ingredientContainsRow = ingredientName.includes(rowName) && rowName.length >= 4;
  const sharedTokens = ingredientTokens.filter((token: string) => rowTokens.includes(token));
  const overlapOfIngredient = sharedTokens.length / Math.max(ingredientTokens.length, 1);
  const overlapOfRow = sharedTokens.length / Math.max(rowTokens.length, 1);
  const firstTokenBonus = rowTokens[0] && ingredientTokens[0] && rowTokens[0] === ingredientTokens[0] ? 14 : 0;
  const partialTokenBonus = ingredientTokens.reduce((sum: number, ingredientToken: string) => {
    const partial = rowTokens.some((rowToken: string) =>
      rowToken.length >= 5 && ingredientToken.length >= 5 && (rowToken.includes(ingredientToken) || ingredientToken.includes(rowToken))
    );
    return sum + (partial ? 4 : 0);
  }, 0);

  let score = sharedTokens.length * 12 + Math.round(overlapOfIngredient * 30) + Math.round(overlapOfRow * 18) + firstTokenBonus + partialTokenBonus;
  if (rowContainsIngredient || ingredientContainsRow) score += 38;

  let matchConfidence: "high" | "medium" | "low" = "low";
  if (score >= 70 || ((rowContainsIngredient || ingredientContainsRow) && sharedTokens.length >= 1)) matchConfidence = "high";
  else if (score >= 34 || (sharedTokens.length >= 2 && overlapOfIngredient >= 0.45)) matchConfidence = "medium";

  return {
    ingredient,
    matchConfidence,
    score,
    sharedTokenCount: sharedTokens.length,
    ingredientTokenCount: ingredientTokens.length,
    matchDebugReason: `${sharedTokens.length} shared token(s), score ${score}`,
  };
}

export function applyInvoiceIngredientIntelligence(args: {
  rows: any[];
  availableSupplierIngredients: any[];
  supplierName: string;
  supplierMatchMemory: Record<string, any>;
  getInvoiceRowConfidence: (row: any, ingredient: any) => string;
}) {
  const {
    rows,
    availableSupplierIngredients,
    supplierName,
    supplierMatchMemory,
    getInvoiceRowConfidence,
  } = args;

  return (Array.isArray(rows) ? rows : []).map((row: any) => {
    const supplierNameForLearning = String(row?.supplierNameForLearning || row?.supplierName || supplierName || "Unknown Supplier").trim() || "Unknown Supplier";
    const supplierMatchKey = buildSupplierMatchMemoryKey(row, supplierNameForLearning);
    const suggestedLearningLabel = normalizeSupplierMatchText(
      [row?.cleanedInvoiceName, row?.name, row?.description, row?.itemName, row?.productName, row?.rawLine]
        .filter(Boolean)
        .join(" ")
    );

    const rowWithLearningMeta = {
      ...row,
      supplierMatchKey,
      supplierNameForLearning,
      suggestedLearningLabel,
    };

    if (row?.linkedIngredientId || row?.invoiceMatchManualOverride) {
      return rowWithLearningMeta;
    }

    const memoryEntry = getSupplierMatchMemoryEntry(rowWithLearningMeta, supplierNameForLearning, supplierMatchMemory);
    const memoryIngredientId = String(memoryEntry?.linkedIngredientId || memoryEntry?.ingredientId || "").trim();
    const learnedIngredient = memoryIngredientId
      ? (availableSupplierIngredients || []).find((ingredient: any) => String(ingredient?.id || "") === memoryIngredientId)
      : null;

    if (learnedIngredient?.id) {
      return {
        ...rowWithLearningMeta,
        linkedIngredientId: learnedIngredient.id,
        matchedIngredientName: learnedIngredient.name || memoryEntry?.ingredientName || "",
        matchConfidence: "learned",
        matchDebugReason: memoryEntry?.matchDebugReason || "Learned supplier match memory",
        status: "matched",
        confidence: getInvoiceRowConfidence(rowWithLearningMeta, learnedIngredient),
      };
    }

    const bestMatch = (availableSupplierIngredients || [])
      .map((ingredient: any) => scoreIngredientMatch(rowWithLearningMeta, ingredient))
      .filter(Boolean)
      .filter((match: any) => match.matchConfidence === "high" || match.matchConfidence === "medium")
      .sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.sharedTokenCount !== a.sharedTokenCount) return b.sharedTokenCount - a.sharedTokenCount;
        return a.ingredientTokenCount - b.ingredientTokenCount;
      })[0] as any;

    if (!bestMatch?.ingredient?.id) return rowWithLearningMeta;

    return {
      ...rowWithLearningMeta,
      linkedIngredientId: bestMatch.ingredient.id,
      matchedIngredientName: bestMatch.ingredient.name || "",
      matchConfidence: bestMatch.matchConfidence,
      matchDebugReason: bestMatch.matchDebugReason,
      status: "matched",
      confidence: getInvoiceRowConfidence(rowWithLearningMeta, bestMatch.ingredient),
    };
  });
}
