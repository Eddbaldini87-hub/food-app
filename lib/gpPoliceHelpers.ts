import {
  sizeUnitOptions
} from "./gpPoliceConstants";

export function getVenueDisplayName(venue: any, fallback = "Mother Base") {
  const rawName = String(venue?.name || fallback).trim();
  if (!rawName || rawName === "Demo Venue") return "Mother Base";
  return rawName;
}

export function safeNumber(value: any) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundTo(value: any, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round((safeNumber(value) + Number.EPSILON) * factor) / factor;
}

export function formatCurrency(value: any) {
  return `$${safeNumber(value).toFixed(2)}`;
}

export function formatCurrencyInputDisplay(value: any) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return "";
  return `$${parsed.toFixed(2)}`;
}

export function getInvoiceRecordDateValue(record: any) {
  return String(record?.date || record?.invoiceDate || record?.createdAt || "").trim();
}

export function getInvoiceRecordSupplierName(record: any) {
  return String(record?.supplierName || record?.supplier || record?.name || "Unknown Supplier").trim() || "Unknown Supplier";
}

export function getInvoiceRecordTotal(record: any) {
  return safeNumber(record?.totalCost ?? record?.total ?? record?.amount ?? record?.invoiceTotal);
}

export function getMondayWeekStart(dateInput: any) {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = localDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  localDate.setDate(localDate.getDate() + diff);
  return localDate.toISOString().slice(0, 10);
}

export function getPreviousMondayWeekStart(dateInput: any) {
  const weekStart = getMondayWeekStart(dateInput);
  if (!weekStart) return "";
  const previous = new Date(weekStart + "T00:00:00");
  previous.setDate(previous.getDate() - 7);
  return previous.toISOString().slice(0, 10);
}

export function formatRawNumericInput(value: any) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return "";
  return String(value);
}

export function unitCategory(unit: string) {
  if (unit === "g" || unit === "kg") return "weight";
  if (unit === "ml" || unit === "l") return "liquid";
  return "count";
}

export function unitTypeFromUnit(unit: string) {
  const category = unitCategory(unit);
  if (category === "weight") return "weight";
  if (category === "liquid") return "liquid";
  return "count";
}

export function toBaseUnit(value: any, unit: string) {
  const numeric = safeNumber(value);
  if (unit === "kg") return numeric * 1000;
  if (unit === "g") return numeric;
  if (unit === "l") return numeric * 1000;
  if (unit === "ml") return numeric;
  return numeric;
}

export function baseUnitFromSizeUnit(sizeUnit: string) {
  if (sizeUnit === "g" || sizeUnit === "kg") return "g";
  if (sizeUnit === "ml" || sizeUnit === "l") return "ml";
  return "each";
}

export function normalizeRecipeYieldUnitForMath(unit: string) {
  if (unit === "serve" || unit === "portion") return "each";
  return unit;
}

export function areUnitsCompatible(baseUnit: string, requestedUnit: string) {
  if (!baseUnit || !requestedUnit) return false;
  const normalizedRequested = normalizeRecipeYieldUnitForMath(requestedUnit);
  return unitCategory(baseUnit) === unitCategory(normalizedRequested);
}

export function formatChefFriendlyDisplayQuantity(totalQuantity: any, baseUnit: string) {
  const quantity = safeNumber(totalQuantity);

  if (baseUnit === "g") {
    return `${roundTo(quantity / 1000, 3)} kg`;
  }

  if (baseUnit === "ml") {
    return `${roundTo(quantity / 1000, 3)} L`;
  }

  return `${roundTo(quantity, 2)} each`;
}

export function getChefFriendlyCostLabel(baseUnit: string) {
  if (baseUnit === "g") return "Cost Per kg";
  if (baseUnit === "ml") return "Cost Per L";
  return "Cost Each";
}

export function formatDisplayCostPerUnit(baseUnit: string, costPerBaseUnit: any) {
  const cost = safeNumber(costPerBaseUnit);

  if (baseUnit === "g") {
    return `${formatCurrency(cost * 1000)} / kg`;
  }

  if (baseUnit === "ml") {
    return `${formatCurrency(cost * 1000)} / L`;
  }

  return `${formatCurrency(cost)} / each`;
}

export function getIngredientDerivedValues(ingredient: any) {
  const purchasePrice = safeNumber(ingredient.supplierUnitCost || ingredient.purchasePrice);
  const amountInPurchaseUnit = safeNumber(ingredient.amountInPurchaseUnit);
  const sizePerItem = safeNumber(ingredient.sizePerItem);
  const baseUnit = baseUnitFromSizeUnit(ingredient.sizeUnit);
  const computedBaseQuantity = toBaseUnit(amountInPurchaseUnit * sizePerItem, ingredient.sizeUnit);
  const totalQuantity = safeNumber(ingredient.baseQuantity) > 0 ? safeNumber(ingredient.baseQuantity) : computedBaseQuantity;
  const costPerBaseUnit = totalQuantity > 0 ? purchasePrice / totalQuantity : 0;

  return {
    baseUnit,
    totalQuantity,
    costPerBaseUnit,
    unitType: ingredient.unitType || unitTypeFromUnit(ingredient.sizeUnit),
  };
}

export function getIngredientSummaryDisplay(ingredient: any) {
  const derived = getIngredientDerivedValues(ingredient);

  return {
    ...derived,
    visibleQuantity: formatChefFriendlyDisplayQuantity(derived.totalQuantity, derived.baseUnit),
    displayCostLabel: getChefFriendlyCostLabel(derived.baseUnit),
    visibleCost: formatDisplayCostPerUnit(derived.baseUnit, derived.costPerBaseUnit),
  };
}

export function getRecipeCostPerBaseUnit(recipe: any) {
  const totalCost = safeNumber(recipe.totalCost);
  const normalizedYieldUnit = normalizeRecipeYieldUnitForMath(recipe.yieldUnit);
  const yieldBaseAmount = toBaseUnit(recipe.yieldAmount, normalizedYieldUnit);
  const baseUnit = baseUnitFromSizeUnit(normalizedYieldUnit);

  if (yieldBaseAmount <= 0) {
    return {
      baseUnit,
      costPerBaseUnit: 0,
    };
  }

  return {
    baseUnit,
    costPerBaseUnit: totalCost / yieldBaseAmount,
  };
}

export function getCompatibleUnitsForBase(baseUnit: string) {
  if (baseUnit === "g") return ["g", "kg"];
  if (baseUnit === "ml") return ["ml", "l"];
  return ["each"];
}

export function getCostingSourceForComponent(component: any, ingredientLookup: any, recipeLookup: any) {
  if (component.componentType === "supplier") {
    return ingredientLookup[component.linkedId] || null;
  }

  return recipeLookup[component.linkedId] || null;
}

export function buildComponentDetail(component: any, ingredientLookup: any, recipeLookup: any) {
  const quantity = safeNumber(component.quantity);
  const requestedUnit = component.unit;
  const costingSource = getCostingSourceForComponent(component, ingredientLookup, recipeLookup);

  if (!costingSource) {
    return {
      ...component,
      linkedName: component.componentType === "supplier" ? "Missing ingredient" : "Missing recipe",
      lineCost: 0,
      quantityInBase: 0,
      isCompatible: false,
    };
  }

  if (!areUnitsCompatible(costingSource.baseUnit, requestedUnit)) {
    return {
      ...component,
      linkedName: costingSource.name,
      lineCost: 0,
      quantityInBase: 0,
      isCompatible: false,
    };
  }

  const quantityInBase = toBaseUnit(quantity, requestedUnit);

  return {
    ...component,
    linkedName: costingSource.name,
    lineCost: quantityInBase * safeNumber(costingSource.costPerBaseUnit),
    quantityInBase,
    isCompatible: true,
  };
}

export function groupOrderingRowsBySupplier(rows: any[]) {
  const grouped = rows.reduce((accumulator: any, row: any) => {
    const supplierName = String(row.supplierName || "Unassigned Supplier").trim() || "Unassigned Supplier";
    if (!accumulator[supplierName]) {
      accumulator[supplierName] = [];
    }
    accumulator[supplierName].push(row);
    return accumulator;
  }, {});

  return Object.entries(grouped).map(([supplierName, items]) => ({
    supplierName,
    items,
    supplierTotal: (items as any[]).reduce((sum: number, item: any) => sum + safeNumber(item.estimatedOrderCost), 0),
  }));
}

export function normalizeLooseText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(of|and|the|fresh|dried|to|taste|for|into|plus|optional)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
