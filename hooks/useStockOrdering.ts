"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { STOCK_MOVEMENTS_STORAGE_KEY } from "../lib/gpPoliceConstants";
import { groupOrderingRowsBySupplier, safeNumber } from "../lib/gpPoliceHelpers";
import { isValidArray, safeParse, safeSetLocalStorageValue } from "../lib/storageHelpers";

const STOCKTAKE_STORAGE_KEY = "gpPolice_stocktake_v1";

type StockMovementType = "invoice_in" | "recipe_out" | "manual_adjustment";

type StockMovementRecord = {
  id: string;
  ingredientId: string;
  type: StockMovementType;
  quantity: number;
  unit: string;
  createdAt: string;
  source: string;
};

type StockMovementBalanceRecord = {
  ingredientId: string;
  ingredientName: string;
  supplierName: string;
  purchaseUnit: string;
  startingOnHand: number;
  invoiceIn: number;
  recipeOut: number;
  manualAdjustments: number;
  calculatedOnHand: number;
  movementCount: number;
  lastMovementAt: string;
  hasUnitMismatch: boolean;
};

type UseStockOrderingArgs = {
  supplierIngredients: any[];
  orderingMeta: Record<string, any>;
  setOrderingMeta: Dispatch<SetStateAction<Record<string, any>>>;
  storageLoaded: boolean;
  failedStorageKeys: Set<string>;
  setFailedStorageKeys: Dispatch<SetStateAction<Set<string>>>;
  createEmergencyBackupSnapshot: (reason?: string) => any;
};

export function useStockOrdering({
  supplierIngredients,
  orderingMeta,
  setOrderingMeta,
  storageLoaded,
  failedStorageKeys,
  setFailedStorageKeys,
  createEmergencyBackupSnapshot,
}: UseStockOrderingArgs) {
  const [orderingSearchTerm, setOrderingSearchTerm] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [stocktakeRecords, setStocktakeRecords] = useState<any[]>([]);
  const [stocktakeMessage, setStocktakeMessage] = useState("");
  const [selectedStocktakeRecordId, setSelectedStocktakeRecordId] = useState<string | null>(null);

  useEffect(() => {
    const markStorageKeyFailed = (key: string) => {
      setFailedStorageKeys((previous) => {
        const next = new Set(previous);
        next.add(key);
        return next;
      });
    };

    const savedStockMovements = safeParse<any[]>(
      STOCK_MOVEMENTS_STORAGE_KEY,
      [],
      isValidArray,
      markStorageKeyFailed
    );

    if (Array.isArray(savedStockMovements)) {
      setStockMovements(savedStockMovements);
    }

    const savedStocktakeRecords = safeParse<any[]>(
      STOCKTAKE_STORAGE_KEY,
      [],
      isValidArray,
      markStorageKeyFailed
    );

    if (Array.isArray(savedStocktakeRecords)) {
      setStocktakeRecords(savedStocktakeRecords);
    }
  }, [setFailedStorageKeys]);

  useEffect(() => {
    if (!storageLoaded) return;
    if (failedStorageKeys.has(STOCK_MOVEMENTS_STORAGE_KEY)) return;
    safeSetLocalStorageValue(STOCK_MOVEMENTS_STORAGE_KEY, stockMovements);
  }, [storageLoaded, stockMovements, failedStorageKeys]);

  useEffect(() => {
    if (!storageLoaded) return;
    if (failedStorageKeys.has(STOCKTAKE_STORAGE_KEY)) return;
    safeSetLocalStorageValue(STOCKTAKE_STORAGE_KEY, stocktakeRecords);
  }, [storageLoaded, stocktakeRecords, failedStorageKeys]);

  const orderingRows = useMemo(() => {
    return supplierIngredients.map((ingredient: any) => {
      const meta = orderingMeta[ingredient.id] || {};
      const onHand = safeNumber(meta.onHand);
      const parLevel = safeNumber(meta.parLevel);
      const suggestedOrder = Math.max(parLevel - onHand, 0);
      const estimatedOrderCost = suggestedOrder * safeNumber(ingredient.purchasePrice);

      return {
        ingredientId: ingredient.id,
        ingredient,
        ingredientName: ingredient.name || "Unnamed ingredient",
        supplierName: String(ingredient.supplierName || meta.supplierName || "Unassigned Supplier").trim() || "Unassigned Supplier",
        onHand,
        parLevel,
        suggestedOrder,
        estimatedOrderCost,
        orderNote: meta.orderNote || "",
        purchaseUnit: ingredient.purchaseUnit || "unit",
        purchasePrice: safeNumber(ingredient.purchasePrice),
      };
    });
  }, [supplierIngredients, orderingMeta]);

  const filteredOrderingRows = useMemo(() => {
    const search = orderingSearchTerm.trim().toLowerCase();

    return orderingRows.filter((row: any) => {
      if (showLowStockOnly && row.suggestedOrder <= 0) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [row.ingredientName, row.supplierName, row.purchaseUnit, row.orderNote]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [orderingRows, orderingSearchTerm, showLowStockOnly]);

  const groupedOrderingRows = useMemo(() => groupOrderingRowsBySupplier(filteredOrderingRows), [filteredOrderingRows]);

  const stockMovementBalances = useMemo<StockMovementBalanceRecord[]>(() => {
    return supplierIngredients.map((ingredient: any) => {
      const ingredientId = String(ingredient.id || "").trim();
      const meta = orderingMeta[ingredientId] || {};
      const purchaseUnit = String(ingredient.purchaseUnit || "unit").trim() || "unit";
      const supplierName = String(ingredient.supplierName || meta.supplierName || "Unassigned Supplier").trim() || "Unassigned Supplier";
      const startingOnHand = safeNumber(meta.onHand);

      const movementsForIngredient = stockMovements.filter((movement: any) => String(movement?.ingredientId || "").trim() === ingredientId);

      const totals = movementsForIngredient.reduce(
        (accumulator: any, movement: any) => {
          const quantity = safeNumber(movement?.quantity);
          if (quantity <= 0) return accumulator;

          const movementUnit = String(movement?.unit || purchaseUnit).trim() || purchaseUnit;
          if (movementUnit !== purchaseUnit) {
            accumulator.hasUnitMismatch = true;
          }

          if (movement?.type === "invoice_in") {
            accumulator.invoiceIn += quantity;
          } else if (movement?.type === "recipe_out") {
            accumulator.recipeOut += quantity;
          } else if (movement?.type === "manual_adjustment") {
            accumulator.manualAdjustments += quantity;
          }

          const createdAt = String(movement?.createdAt || "");
          if (createdAt && (!accumulator.lastMovementAt || createdAt > accumulator.lastMovementAt)) {
            accumulator.lastMovementAt = createdAt;
          }

          accumulator.movementCount += 1;
          return accumulator;
        },
        {
          invoiceIn: 0,
          recipeOut: 0,
          manualAdjustments: 0,
          movementCount: 0,
          lastMovementAt: "",
          hasUnitMismatch: false,
        }
      );

      return {
        ingredientId,
        ingredientName: ingredient.name || "Unnamed ingredient",
        supplierName,
        purchaseUnit,
        startingOnHand,
        invoiceIn: totals.invoiceIn,
        recipeOut: totals.recipeOut,
        manualAdjustments: totals.manualAdjustments,
        calculatedOnHand: startingOnHand + totals.invoiceIn + totals.manualAdjustments - totals.recipeOut,
        movementCount: totals.movementCount,
        lastMovementAt: totals.lastMovementAt,
        hasUnitMismatch: totals.hasUnitMismatch,
      };
    });
  }, [orderingMeta, stockMovements, supplierIngredients]);

  const stockMovementBalanceLookup = useMemo(() => {
    return stockMovementBalances.reduce((accumulator: Record<string, StockMovementBalanceRecord>, balance) => {
      accumulator[balance.ingredientId] = balance;
      return accumulator;
    }, {});
  }, [stockMovementBalances]);

  const stockMovementSummary = useMemo(() => {
    return stockMovementBalances.reduce(
      (accumulator: any, balance) => {
        accumulator.totalCalculatedOnHand += safeNumber(balance.calculatedOnHand);
        accumulator.totalInvoiceIn += safeNumber(balance.invoiceIn);
        accumulator.totalRecipeOut += safeNumber(balance.recipeOut);
        accumulator.totalManualAdjustments += safeNumber(balance.manualAdjustments);
        accumulator.totalMovementLines += safeNumber(balance.movementCount);

        if (balance.hasUnitMismatch) {
          accumulator.unitMismatchCount += 1;
        }

        return accumulator;
      },
      {
        totalCalculatedOnHand: 0,
        totalInvoiceIn: 0,
        totalRecipeOut: 0,
        totalManualAdjustments: 0,
        totalMovementLines: 0,
        unitMismatchCount: 0,
      }
    );
  }, [stockMovementBalances]);

  const stockDamageReport = useMemo(() => {
    return stockMovementBalances
      .map((balance: any) => {
        const expectedUsage = safeNumber(balance.recipeOut);
        const manualDamage = Math.max(safeNumber(balance.manualAdjustments), 0);
        const actualUsage = expectedUsage + manualDamage;
        const variance = manualDamage;
        const loss = manualDamage;

        return {
          ingredientId: balance.ingredientId,
          ingredientName: balance.ingredientName || "Unnamed ingredient",
          supplierName: balance.supplierName || "Unassigned Supplier",
          purchaseUnit: balance.purchaseUnit || "unit",
          expectedUsage,
          actualUsage,
          variance,
          manualDamage,
          loss,
        };
      })
      .filter((item: any) => safeNumber(item.loss) > 0)
      .sort((a: any, b: any) => safeNumber(b.loss) - safeNumber(a.loss))
      .slice(0, 5);
  }, [stockMovementBalances]);

  const updateOrderingMetaField = (ingredientId: string, field: string, value: any) => {
    setOrderingMeta((previous: any) => ({
      ...previous,
      [ingredientId]: {
        ...(previous[ingredientId] || {}),
        [field]: value,
      },
    }));
  };

  const addStockMovement = (movement: Partial<StockMovementRecord>) => {
    const ingredientId = String(movement.ingredientId || "").trim();
    const quantity = safeNumber(movement.quantity);

    if (!ingredientId) {
      console.warn("GP Police blocked stock movement without ingredientId", movement);
      return null;
    }

    if (quantity <= 0) {
      console.warn("GP Police blocked stock movement with invalid quantity", movement);
      return null;
    }

    const movementType: StockMovementType =
      movement.type === "invoice_in" || movement.type === "recipe_out" || movement.type === "manual_adjustment"
        ? movement.type
        : "manual_adjustment";

    const payload: StockMovementRecord = {
      id: movement.id || `stock_movement_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ingredientId,
      type: movementType,
      quantity,
      unit: String(movement.unit || "unit").trim() || "unit",
      createdAt: movement.createdAt || new Date().toISOString(),
      source: String(movement.source || "manual").trim() || "manual",
    };

    setStockMovements((previous: any[]) => {
      const nextMovements = [payload, ...previous];

      try {
        safeSetLocalStorageValue(STOCK_MOVEMENTS_STORAGE_KEY, nextMovements);
      } catch (error) {
        console.warn("GP Police immediate stock movement save failed", error);
      }

      return nextMovements;
    });

    return payload;
  };

  const logManualStockAdjustment = (ingredientId: string, quantity: number, note?: string) => {
    const ingredient = supplierIngredients.find((item: any) => item.id === ingredientId);

    return addStockMovement({
      ingredientId,
      type: "manual_adjustment",
      quantity,
      unit: ingredient?.purchaseUnit || "unit",
      source: note || "manual",
    });
  };

  const handleSaveStocktakeSnapshot = () => {
    createEmergencyBackupSnapshot("save_stocktake_snapshot");

    const now = new Date().toISOString();
    const items = supplierIngredients.map((ingredient: any) => {
      const meta = orderingMeta[ingredient.id] || {};
      const supplierName = String(ingredient.supplierName || meta.supplierName || "Unassigned Supplier").trim() || "Unassigned Supplier";
      const purchaseUnit = ingredient.purchaseUnit || "unit";
      const onHand = safeNumber(meta.onHand);
      const parLevel = safeNumber(meta.parLevel);
      const purchasePrice = safeNumber(ingredient.purchasePrice);
      const estimatedValue = onHand * purchasePrice;

      return {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name || "Unnamed ingredient",
        supplierName,
        purchaseUnit,
        onHand,
        parLevel,
        purchasePrice,
        estimatedValue,
      };
    });

    const totalEstimatedValue = items.reduce((sum: number, item: any) => sum + safeNumber(item.estimatedValue), 0);

    const snapshot = {
      id: `stocktake_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      itemCount: items.length,
      totalEstimatedValue,
      items,
    };

    setStocktakeRecords((previous: any[]) => [snapshot, ...previous].slice(0, 25));
    setStocktakeMessage(`Stocktake snapshot saved. ${items.length} line${items.length === 1 ? "" : "s"} captured. No stock movements created.`);
  };

  return {
    orderingSearchTerm,
    setOrderingSearchTerm,
    showLowStockOnly,
    setShowLowStockOnly,
    orderingRows,
    filteredOrderingRows,
    groupedOrderingRows,
    stockMovements,
    setStockMovements,
    stockMovementBalances,
    stockMovementBalanceLookup,
    stockMovementSummary,
    stockDamageReport,
    stocktakeRecords,
    setStocktakeRecords,
    stocktakeMessage,
    selectedStocktakeRecordId,
    setSelectedStocktakeRecordId,
    updateOrderingMetaField,
    addStockMovement,
    logManualStockAdjustment,
    handleSaveStocktakeSnapshot,
  };
}
