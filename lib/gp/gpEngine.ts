import { safeNumber } from "@/lib/gpPoliceHelpers";

const normalizeText = (value: any) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatMoneyInline = (value: any) => `$${safeNumber(value).toFixed(2)}`;

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

const getAlertPriority = (level: string) => {
  if (level === "danger") return 3;
  if (level === "warning") return 2;
  return 1;
};

const uniqueAlerts = (alerts: any[]) => {
  const seen = new Set<string>();
  return alerts
    .filter((alert: any) => {
      const key = `${alert.level || "watch"}:${alert.title || ""}:${alert.detail || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a: any, b: any) => getAlertPriority(b.level) - getAlertPriority(a.level));
};

const buildDecisionActions = (affectedRecipes: any[], priceEvents: any[], totalWeeklyDamage: number) => {
  const actions: any[] = [];
  const worstRecipe = affectedRecipes[0];
  const worstIngredient = priceEvents[0];

  if (worstRecipe?.recipeName && safeNumber(worstRecipe.estimatedCostIncreasePerServe) > 0) {
    const suggestedPriceRise = Math.ceil(safeNumber(worstRecipe.estimatedCostIncreasePerServe) * 2) / 2;
    actions.push({
      level: safeNumber(worstRecipe.estimatedWeeklyDamage) >= 100 ? "danger" : "warning",
      title: `Fix ${worstRecipe.recipeName}`,
      action: `Review sell price or portion. Suggested minimum price lift: ${formatMoneyInline(suggestedPriceRise)}.`,
      reason: `${worstRecipe.ingredientName} is adding about ${formatMoneyInline(worstRecipe.estimatedCostIncreasePerServe)} per serve${safeNumber(worstRecipe.weeklySalesEstimate) > 0 ? ` and about ${formatMoneyInline(worstRecipe.estimatedWeeklyDamage)} per week.` : "."}`,
      recipeId: worstRecipe.recipeId,
    });
  }

  if (worstIngredient?.ingredientName) {
    actions.push({
      level: safeNumber(worstIngredient.percentIncrease) >= 25 ? "danger" : "warning",
      title: `Challenge ${worstIngredient.supplierName || "supplier"}`,
      action: `Check ${worstIngredient.ingredientName} invoice price before accepting the next order.`,
      reason: `${worstIngredient.ingredientName} is up ${Math.round(safeNumber(worstIngredient.percentIncrease))}% against known cost.`,
      ingredientId: worstIngredient.ingredientId,
    });
  }

  if (safeNumber(totalWeeklyDamage) > 0 && !affectedRecipes.some((recipe: any) => safeNumber(recipe.weeklySalesEstimate) > 0)) {
    actions.push({
      level: "watch",
      title: "Connect POS sales for sharper damage",
      action: "Upload POS sales so GP Police can convert per-serve leaks into weekly dollar damage.",
      reason: "Recipe impact exists, but weekly sales volume is missing or incomplete.",
    });
  }

  if (actions.length === 0) {
    actions.push({
      level: "watch",
      title: "No major GP attack detected yet",
      action: "Keep locking invoices and matching ingredients. The decision engine gets stronger with more locked invoice history.",
      reason: "No ingredient price events over the alert threshold were found.",
    });
  }

  return actions.slice(0, 6);
};

const buildDamageTrend = (lockedInvoiceHistory: any[], affectedRecipes: any[]) => {
  const weekTotals: Record<string, number> = {};

  (Array.isArray(lockedInvoiceHistory) ? lockedInvoiceHistory : []).forEach((invoice: any) => {
    const dateKey = String(invoice?.date || invoice?.invoiceDate || invoice?.createdAt || "").slice(0, 10);
    if (!dateKey) return;
    const weekKey = dateKey.slice(0, 7);
    const invoiceDamage = safeNumber(invoice?.totalDamage ?? invoice?.foodCogsTotal ?? 0);
    if (invoiceDamage > 0) {
      weekTotals[weekKey] = safeNumber(weekTotals[weekKey]) + invoiceDamage;
    }
  });

  const recipeDamage = affectedRecipes.reduce((sum: number, recipe: any) => sum + safeNumber(recipe.estimatedWeeklyDamage), 0);
  const weeks = Object.keys(weekTotals).sort().slice(-6).map((weekKey) => ({ weekKey, damage: weekTotals[weekKey] }));
  const last = weeks[weeks.length - 1]?.damage || 0;
  const previous = weeks[weeks.length - 2]?.damage || 0;
  const change = last - previous;

  const direction = change > 1 ? "rising" : change < -1 ? "improving" : "stable";
  const confidence = weeks.length >= 3 ? "high" : weeks.length >= 1 || recipeDamage > 0 ? "medium" : "low";

  return {
    weeks,
    latestDamage: last,
    previousDamage: previous,
    change,
    direction,
    confidence,
    proofLabel: direction === "improving" ? "Damage improving" : direction === "rising" ? "Damage rising" : "Damage stable",
  };
};

const buildRecentWins = (affectedRecipes: any[], priceEvents: any[], damageTrend: any) => {
  const wins: any[] = [];

  if (damageTrend.direction === "improving" && Math.abs(safeNumber(damageTrend.change)) > 0) {
    wins.push({
      title: "Damage reduced",
      detail: `Latest tracked damage is down ${formatMoneyInline(Math.abs(damageTrend.change))} from the previous period.`,
      value: Math.abs(safeNumber(damageTrend.change)),
      confidence: damageTrend.confidence,
    });
  }

  const linkedImpactCount = affectedRecipes.filter((recipe: any) => safeNumber(recipe.estimatedCostIncreasePerServe) > 0).length;
  if (linkedImpactCount > 0) {
    wins.push({
      title: "Menu impact mapped",
      detail: `${linkedImpactCount} affected dish${linkedImpactCount === 1 ? "" : "es"} now have supplier damage connected to menu GP.`,
      value: linkedImpactCount,
      confidence: "medium",
    });
  }

  const watchedIngredients = priceEvents.filter((event: any) => safeNumber(event.percentIncrease) >= 5).length;
  if (watchedIngredients > 0) {
    wins.push({
      title: "Supplier price watch active",
      detail: `${watchedIngredients} supplier item${watchedIngredients === 1 ? "" : "s"} flagged before the leak disappears into weekly GP.`,
      value: watchedIngredients,
      confidence: "medium",
    });
  }

  if (wins.length === 0) {
    wins.push({
      title: "Proof engine waiting for data",
      detail: "Lock a few invoices, link food rows, and upload POS sales to prove before-vs-after movement.",
      value: 0,
      confidence: "low",
    });
  }

  return wins.slice(0, 4);
};

const buildProofEngine = (affectedRecipes: any[], priceEvents: any[], damageTrend: any, hasPosSalesEstimate: boolean) => {
  const dataPoints = [
    affectedRecipes.length > 0,
    priceEvents.length > 0,
    hasPosSalesEstimate,
    Array.isArray(damageTrend.weeks) && damageTrend.weeks.length >= 2,
  ].filter(Boolean).length;

  const confidence = dataPoints >= 3 ? "high" : dataPoints >= 2 ? "medium" : dataPoints >= 1 ? "early" : "low";
  const headline = confidence === "high"
    ? "Strong proof forming"
    : confidence === "medium"
      ? "Proof engine active"
      : confidence === "early"
        ? "Early proof forming"
        : "Needs live data";

  const missing: string[] = [];
  if (affectedRecipes.length === 0) missing.push("linked recipe impacts");
  if (priceEvents.length === 0) missing.push("price movement events");
  if (!hasPosSalesEstimate) missing.push("POS sales volume");
  if (!Array.isArray(damageTrend.weeks) || damageTrend.weeks.length < 2) missing.push("multi-week history");

  return {
    confidence,
    headline,
    dataPoints,
    missing,
    trustMessage: missing.length
      ? `Add ${missing.slice(0, 2).join(" + ")} for stronger proof.`
      : "Enough data exists to show problem, action, and result movement.",
  };
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
      ingredientName: existing.ingredientName === impact.ingredientName ? existing.ingredientName : "Multiple ingredients",
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
  const hasPosSalesEstimate = affectedRecipes.some((recipe: any) => safeNumber(recipe.weeklySalesEstimate) > 0);

  const baseAlerts = [
    ...biggestIngredientRisks.slice(0, 5).map((event: any) => ({
      level: event.percentIncrease >= 25 ? "danger" : event.percentIncrease >= 15 ? "warning" : "watch",
      title: `${event.ingredientName} +${Math.round(event.percentIncrease)}%`,
      detail: `${event.supplierName || "Supplier"} invoice price is above known cost. Check affected recipes before the GP leaks.`,
      ingredientId: event.ingredientId,
      category: "price_spike",
    })),
    ...affectedRecipes.slice(0, 5).map((recipe: any) => ({
      level: recipe.estimatedWeeklyDamage > 100 ? "danger" : recipe.estimatedCostIncreasePerServe > 1 ? "warning" : "watch",
      title: `${recipe.recipeName} GP impact`,
      detail: `${recipe.ingredientName} is estimated to add ${formatMoneyInline(recipe.estimatedCostIncreasePerServe)} per serve${recipe.weeklySalesEstimate > 0 ? ` · about ${formatMoneyInline(recipe.estimatedWeeklyDamage)} weekly damage` : ""}.`,
      recipeId: recipe.recipeId,
      category: "recipe_damage",
    })),
  ];

  const totalDamageAlert = safeNumber(totalWeeklyDamage) >= 250
    ? [{
        level: "danger",
        title: `Weekly GP damage ${formatMoneyInline(totalWeeklyDamage)}`,
        detail: "Main Hideout should review affected dishes before the next service window.",
        category: "weekly_damage",
      }]
    : safeNumber(totalWeeklyDamage) > 0
      ? [{
          level: "warning",
          title: `Weekly GP leak ${formatMoneyInline(totalWeeklyDamage)}`,
          detail: "There is measurable menu damage from supplier price movement.",
          category: "weekly_damage",
        }]
      : [];

  const damageTrend = buildDamageTrend(lockedInvoiceHistory, affectedRecipes);
  const recentWins = buildRecentWins(affectedRecipes, biggestIngredientRisks, damageTrend);
  const proofEngine = buildProofEngine(affectedRecipes, biggestIngredientRisks, damageTrend, hasPosSalesEstimate);

  const alerts = uniqueAlerts([...totalDamageAlert, ...baseAlerts]).slice(0, 10);
  const recommendedActions = buildDecisionActions(affectedRecipes, biggestIngredientRisks, totalWeeklyDamage);
  const dangerAlertCount = alerts.filter((alert: any) => alert.level === "danger").length;
  const warningAlertCount = alerts.filter((alert: any) => alert.level === "warning").length;

  const decisionSummary = {
    status: dangerAlertCount > 0 ? "danger" : warningAlertCount > 0 ? "warning" : alerts.length > 0 ? "watch" : "quiet",
    headline: dangerAlertCount > 0
      ? "GP under attack"
      : warningAlertCount > 0
        ? "GP needs review"
        : alerts.length > 0
          ? "GP watchlist active"
          : "GP stable",
    topAction: recommendedActions[0]?.action || "Keep locking invoices and matching ingredients.",
    totalActionCount: recommendedActions.length,
  };

  return {
    affectedRecipes,
    biggestLosers: affectedRecipes.slice(0, 8),
    biggestIngredientRisks,
    alerts,
    recommendedActions,
    decisionSummary,
    dangerAlertCount,
    warningAlertCount,
    recentWins,
    damageTrend,
    proofEngine,
    totalWeeklyDamage,
    totalPerServeDamage,
    affectedRecipeCount: affectedRecipes.length,
    affectedIngredientCount: biggestIngredientRisks.length,
    hasPosSalesEstimate,
  };
}
