import { safeNumber } from "@/lib/gpPoliceHelpers";

const normalizeText = (value: any) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getRowMoneyValue = (row: any) => {
  const value = safeNumber(row?.lineTotal ?? row?.total ?? row?.amount ?? row?.purchasePrice ?? row?.unitPrice);
  return Number.isFinite(value) ? value : 0;
};

const getRecipeSellPrice = (recipe: any) => safeNumber(recipe?.sellPrice ?? recipe?.price ?? recipe?.menuPrice);
const getRecipeCost = (recipe: any) => safeNumber(recipe?.costPerPortion ?? recipe?.totalCost ?? recipe?.plateCost);

const getRecipeIngredientIds = (recipe: any) => {
  const ids = new Set<string>();
  const components = Array.isArray(recipe?.components) ? recipe.components : [];
  const componentDetails = Array.isArray(recipe?.componentDetails) ? recipe.componentDetails : [];

  [...components, ...componentDetails].forEach((component: any) => {
    const directId = String(
      component?.linkedIngredientId ||
        component?.ingredientId ||
        component?.linkedId ||
        component?.id ||
        ""
    ).trim();

    const componentType = String(component?.componentType || component?.type || "").toLowerCase();
    if (directId && (componentType === "supplier" || componentType === "ingredient" || !componentType)) {
      ids.add(directId);
    }
  });

  return Array.from(ids);
};

const getRecipeIngredientNames = (recipe: any) => {
  const names = new Set<string>();
  const components = Array.isArray(recipe?.components) ? recipe.components : [];
  const componentDetails = Array.isArray(recipe?.componentDetails) ? recipe.componentDetails : [];

  [...components, ...componentDetails].forEach((component: any) => {
    const name = normalizeText(component?.linkedName || component?.ingredientName || component?.name || component?.componentName || "");
    if (name) names.add(name);
  });

  return Array.from(names);
};

const getAverageWeeklySalesForRecipe = (recipe: any, posSalesReport: any) => {
  const recipeName = normalizeText(recipe?.name || "");
  const recipeId = String(recipe?.id || "").trim();

  const possibleRows = [
    ...(Array.isArray(posSalesReport?.rows) ? posSalesReport.rows : []),
    ...(Array.isArray(posSalesReport?.matchedRows) ? posSalesReport.matchedRows : []),
    ...(Array.isArray(posSalesReport?.dishRows) ? posSalesReport.dishRows : []),
    ...(Array.isArray(posSalesReport?.items) ? posSalesReport.items : []),
  ];

  const matchedRows = possibleRows.filter((row: any) => {
    const rowRecipeId = String(row?.recipeId || row?.matchedRecipeId || row?.linkedRecipeId || "").trim();
    const rowName = normalizeText(row?.recipeName || row?.dishName || row?.name || row?.itemName || "");
    if (recipeId && rowRecipeId && rowRecipeId === recipeId) return true;
    if (recipeName && rowName && (rowName === recipeName || rowName.includes(recipeName) || recipeName.includes(rowName))) return true;
    return false;
  });

  const units = matchedRows.reduce((sum: number, row: any) => {
    return sum + safeNumber(row?.quantity ?? row?.qty ?? row?.unitsSold ?? row?.sold ?? row?.count);
  }, 0);

  return units > 0 ? units : safeNumber(recipe?.weeklySalesEstimate ?? recipe?.expectedWeeklySales ?? 0);
};

const buildIngredientPriceEvents = (lockedInvoiceHistory: any[], supplierIngredients: any[]) => {
  const ingredientLookup = new Map<string, any>();
  supplierIngredients.forEach((ingredient: any) => {
    const id = String(ingredient?.id || "").trim();
    if (id) ingredientLookup.set(id, ingredient);
  });

  return (Array.isArray(lockedInvoiceHistory) ? lockedInvoiceHistory : [])
    .flatMap((invoice: any) => {
      const invoiceRows = Array.isArray(invoice?.rows) ? invoice.rows : [];
      return invoiceRows.map((row: any) => {
        const linkedIngredientId = String(row?.linkedIngredientId || row?.ingredientId || "").trim();
        const linkedIngredient = linkedIngredientId ? ingredientLookup.get(linkedIngredientId) : null;
        const matchedName = String(row?.matchedIngredientName || linkedIngredient?.name || row?.name || "").trim();
        const knownPurchasePrice = safeNumber(linkedIngredient?.lastPurchasePrice ?? linkedIngredient?.previousPurchasePrice ?? linkedIngredient?.purchasePrice);
        const invoiceUnitPrice = safeNumber(row?.unitPrice);
        const invoiceLineTotal = safeNumber(row?.lineTotal || row?.purchasePrice || row?.amount);
        const invoiceQty = Math.max(safeNumber(row?.qty ?? row?.quantity), 1);
        const invoicePrice = invoiceUnitPrice > 0 ? invoiceUnitPrice : invoiceLineTotal > 0 ? invoiceLineTotal / invoiceQty : 0;
        const percentIncrease = knownPurchasePrice > 0 && invoicePrice > 0 ? ((invoicePrice - knownPurchasePrice) / knownPurchasePrice) * 100 : 0;

        return {
          ingredientId: linkedIngredientId,
          ingredientName: matchedName,
          supplierName: invoice?.supplierName || row?.supplierName || "Unknown supplier",
          invoiceNumber: invoice?.invoiceNumber || "",
          invoiceDate: invoice?.date || invoice?.invoiceDate || row?.date || "",
          knownPurchasePrice,
          invoicePrice,
          lineValue: getRowMoneyValue(row),
          percentIncrease: Number.isFinite(percentIncrease) ? percentIncrease : 0,
        };
      });
    })
    .filter((event: any) => event.ingredientName && event.invoicePrice > 0 && event.percentIncrease >= 5)
    .sort((a: any, b: any) => b.percentIncrease - a.percentIncrease);
};

export function buildGpImpactSummary(args: {
  supplierIngredients: any[];
  computedRecipes: any[];
  lockedInvoiceHistory: any[];
  posSalesReport?: any;
}) {
  const supplierIngredients = Array.isArray(args.supplierIngredients) ? args.supplierIngredients : [];
  const computedRecipes = Array.isArray(args.computedRecipes) ? args.computedRecipes : [];
  const lockedInvoiceHistory = Array.isArray(args.lockedInvoiceHistory) ? args.lockedInvoiceHistory : [];
  const finalDishes = computedRecipes.filter((recipe: any) => String(recipe?.recipeType || "").toLowerCase() === "final dish");
  const priceEvents = buildIngredientPriceEvents(lockedInvoiceHistory, supplierIngredients);

  const recipeImpacts = priceEvents.flatMap((event: any) => {
    const eventId = String(event.ingredientId || "").trim();
    const eventName = normalizeText(event.ingredientName);

    return finalDishes
      .filter((recipe: any) => {
        const ids = getRecipeIngredientIds(recipe);
        const names = getRecipeIngredientNames(recipe);
        if (eventId && ids.includes(eventId)) return true;
        return Boolean(eventName && names.some((name) => name === eventName || name.includes(eventName) || eventName.includes(name)));
      })
      .map((recipe: any) => {
        const sellPrice = getRecipeSellPrice(recipe);
        const currentCost = getRecipeCost(recipe);
        const estimatedPreviousCost = event.percentIncrease > 0 ? currentCost / (1 + event.percentIncrease / 100) : currentCost;
        const estimatedCostIncreasePerServe = Math.max(currentCost - estimatedPreviousCost, 0);
        const weeklySalesEstimate = getAverageWeeklySalesForRecipe(recipe, args.posSalesReport);
        const estimatedWeeklyDamage = estimatedCostIncreasePerServe * weeklySalesEstimate;
        const currentGpPercent = sellPrice > 0 ? ((sellPrice - currentCost) / sellPrice) * 100 : 0;
        const previousGpPercent = sellPrice > 0 ? ((sellPrice - estimatedPreviousCost) / sellPrice) * 100 : currentGpPercent;
        const gpDropPercent = Math.max(previousGpPercent - currentGpPercent, 0);

        return {
          recipeId: recipe?.id || "",
          recipeName: recipe?.name || "Unnamed dish",
          ingredientId: event.ingredientId,
          ingredientName: event.ingredientName,
          supplierName: event.supplierName,
          invoiceNumber: event.invoiceNumber,
          invoiceDate: event.invoiceDate,
          percentIncrease: event.percentIncrease,
          sellPrice,
          currentCost,
          estimatedPreviousCost,
          estimatedCostIncreasePerServe,
          currentGpPercent,
          previousGpPercent,
          gpDropPercent,
          weeklySalesEstimate,
          estimatedWeeklyDamage,
        };
      });
  });

  const affectedRecipeMap = new Map<string, any>();
  recipeImpacts.forEach((impact: any) => {
    const key = impact.recipeId || impact.recipeName;
    const existing = affectedRecipeMap.get(key);
    if (!existing) {
      affectedRecipeMap.set(key, impact);
      return;
    }

    affectedRecipeMap.set(key, {
      ...existing,
      estimatedCostIncreasePerServe: existing.estimatedCostIncreasePerServe + impact.estimatedCostIncreasePerServe,
      estimatedWeeklyDamage: existing.estimatedWeeklyDamage + impact.estimatedWeeklyDamage,
      gpDropPercent: existing.gpDropPercent + impact.gpDropPercent,
      percentIncrease: Math.max(existing.percentIncrease, impact.percentIncrease),
    });
  });

  const affectedRecipes = Array.from(affectedRecipeMap.values()).sort((a: any, b: any) => {
    if (b.estimatedWeeklyDamage !== a.estimatedWeeklyDamage) return b.estimatedWeeklyDamage - a.estimatedWeeklyDamage;
    return b.estimatedCostIncreasePerServe - a.estimatedCostIncreasePerServe;
  });

  const biggestIngredientRisks = priceEvents.slice(0, 8);
  const totalWeeklyDamage = affectedRecipes.reduce((sum: number, recipe: any) => sum + safeNumber(recipe.estimatedWeeklyDamage), 0);
  const totalPerServeDamage = affectedRecipes.reduce((sum: number, recipe: any) => sum + safeNumber(recipe.estimatedCostIncreasePerServe), 0);

  const alerts = [
    ...biggestIngredientRisks.slice(0, 3).map((event: any) => ({
      level: event.percentIncrease >= 25 ? "danger" : event.percentIncrease >= 15 ? "warning" : "watch",
      title: `${event.ingredientName} +${Math.round(event.percentIncrease)}%`,
      detail: `${event.supplierName || "Supplier"} invoice price is above known cost. Check affected recipes before the GP leaks.`,
      ingredientId: event.ingredientId,
    })),
    ...affectedRecipes.slice(0, 3).map((recipe: any) => ({
      level: recipe.estimatedWeeklyDamage > 100 ? "danger" : recipe.estimatedCostIncreasePerServe > 1 ? "warning" : "watch",
      title: `${recipe.recipeName} GP impact`,
      detail: `${recipe.ingredientName} is estimated to add $${recipe.estimatedCostIncreasePerServe.toFixed(2)} per serve${recipe.weeklySalesEstimate > 0 ? ` · about $${recipe.estimatedWeeklyDamage.toFixed(0)} weekly damage` : ""}.`,
      recipeId: recipe.recipeId,
    })),
  ];

  return {
    affectedRecipes,
    biggestLosers: affectedRecipes.slice(0, 8),
    biggestIngredientRisks,
    alerts,
    totalWeeklyDamage,
    totalPerServeDamage,
    affectedRecipeCount: affectedRecipes.length,
    affectedIngredientCount: biggestIngredientRisks.length,
    hasPosSalesEstimate: affectedRecipes.some((recipe: any) => safeNumber(recipe.weeklySalesEstimate) > 0),
  };
}
