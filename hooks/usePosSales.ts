import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../lib/gpPoliceConstants";
import { roundTo, safeNumber } from "../lib/gpPoliceHelpers";
import { parsePosSalesCsv } from "../lib/posCsvParsing";
import { isValidArray, isValidObject, safeParse, safeSetLocalStorageValue } from "../lib/storageHelpers";

type UsePosSalesArgs = {
  finalDishRecipes: any[];
  storageLoaded: boolean;
  failedStorageKeys: Set<string>;
  createEmergencyBackupSnapshot?: (reason?: string) => any;
};

export function usePosSales(args: UsePosSalesArgs) {
  const {
    finalDishRecipes,
    storageLoaded,
    failedStorageKeys,
    createEmergencyBackupSnapshot,
  } = args;

  const [posSales, setPosSales] = useState<any[]>([]);
  const [posDishMatches, setPosDishMatches] = useState<Record<string, string>>({});
  const [posSalesMessage, setPosSalesMessage] = useState("");

  useEffect(() => {
    const savedPosSales = safeParse<any[]>(STORAGE_KEYS.POS_SALES, [], isValidArray);
    if (Array.isArray(savedPosSales)) {
      setPosSales(savedPosSales);
    }

    const savedPosMatches = safeParse<Record<string, string>>(STORAGE_KEYS.POS_MATCHES, {}, isValidObject);
    if (savedPosMatches && typeof savedPosMatches === "object" && !Array.isArray(savedPosMatches)) {
      setPosDishMatches(savedPosMatches);
    }
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    if (failedStorageKeys.has(STORAGE_KEYS.POS_SALES)) return;
    safeSetLocalStorageValue(STORAGE_KEYS.POS_SALES, posSales);
  }, [storageLoaded, posSales, failedStorageKeys]);

  useEffect(() => {
    if (!storageLoaded) return;
    if (failedStorageKeys.has(STORAGE_KEYS.POS_MATCHES)) return;
    safeSetLocalStorageValue(STORAGE_KEYS.POS_MATCHES, posDishMatches);
  }, [storageLoaded, posDishMatches, failedStorageKeys]);

  const posSalesReport = useMemo(() => {
    const matchedRows = posSales
      .map((sale: any) => {
        const linkedRecipeId = posDishMatches[sale.posItemName] || "";
        const linkedRecipe = linkedRecipeId ? finalDishRecipes.find((recipe: any) => recipe.id === linkedRecipeId) : null;
        if (!linkedRecipe) {
          return {
            ...sale,
            linkedRecipe: null,
            recipeCostPerDish: 0,
            dishCostTotal: 0,
            profitTotal: 0,
            gpPercent: 0,
            averageSalePrice: safeNumber(sale.quantitySold) > 0 ? safeNumber(sale.totalSales) / safeNumber(sale.quantitySold) : 0,
          };
        }

        const quantitySold = safeNumber(sale.quantitySold);
        const totalSales = safeNumber(sale.totalSales);
        const recipeCostPerDish = safeNumber(linkedRecipe.costPerPortion || linkedRecipe.totalCost);
        const dishCostTotal = recipeCostPerDish * quantitySold;
        const profitTotal = totalSales - dishCostTotal;
        const gpPercent = totalSales > 0 ? (profitTotal / totalSales) * 100 : 0;
        const averageSalePrice = quantitySold > 0 ? totalSales / quantitySold : 0;

        return {
          ...sale,
          linkedRecipe,
          recipeCostPerDish,
          dishCostTotal,
          profitTotal,
          gpPercent,
          averageSalePrice,
        };
      });

    const matched = matchedRows.filter((row: any) => row.linkedRecipe);
    const unmatched = matchedRows.filter((row: any) => !row.linkedRecipe);
    const totalPosSales = posSales.reduce((sum: number, sale: any) => sum + safeNumber(sale.totalSales), 0);
    const matchedSales = matched.reduce((sum: number, row: any) => sum + safeNumber(row.totalSales), 0);
    const estimatedGrossProfit = matched.reduce((sum: number, row: any) => sum + safeNumber(row.profitTotal), 0);
    const averageGpPercent = matchedSales > 0 ? (estimatedGrossProfit / matchedSales) * 100 : 0;
    const winners = matched.filter((row: any) => row.gpPercent >= 70);
    const warnings = matched.filter((row: any) => row.gpPercent >= 60 && row.gpPercent < 70);
    const redFlags = matched.filter((row: any) => row.gpPercent < 60);

    const topRedFlag = redFlags
      .slice()
      .sort((a: any, b: any) => safeNumber(b.quantitySold) - safeNumber(a.quantitySold))[0];
    const topWarning = warnings
      .slice()
      .sort((a: any, b: any) => safeNumber(b.totalSales) - safeNumber(a.totalSales))[0];
    const topWinner = winners
      .slice()
      .sort((a: any, b: any) => safeNumber(b.profitTotal) - safeNumber(a.profitTotal))[0];

    const summaryCallouts = matched.length === 0
      ? ["Upload sales and match dishes first — GP Police can’t arrest ghosts."]
      : [
          topRedFlag
            ? `${topRedFlag.posItemName} sold ${roundTo(topRedFlag.quantitySold, 0)} times and is only running at ${roundTo(topRedFlag.gpPercent, 1)}% GP.`
            : null,
          topWarning
            ? `${topWarning.posItemName} is borderline at ${roundTo(topWarning.gpPercent, 1)}% GP.`
            : null,
          topWinner
            ? `${topWinner.posItemName} is carrying the kitchen at ${roundTo(topWinner.gpPercent, 1)}% GP.`
            : null,
        ].filter(Boolean).slice(0, 3);

    const damageReport = matched
      .map((row: any) => {
        const targetProfit = safeNumber(row.totalSales) * 0.7;
        const actualProfit = safeNumber(row.totalSales) - safeNumber(row.dishCostTotal);
        const lostOpportunity = targetProfit - actualProfit;
        return {
          ...row,
          targetProfit,
          actualProfit,
          lostOpportunity,
        };
      })
      .filter((row: any) => safeNumber(row.lostOpportunity) > 0)
      .sort((a: any, b: any) => safeNumber(b.lostOpportunity) - safeNumber(a.lostOpportunity))
      .slice(0, 5);

    const fixSuggestions = redFlags.map((row: any) => {
      const priceNeededFor70 = safeNumber(row.recipeCostPerDish) > 0 ? safeNumber(row.recipeCostPerDish) / 0.3 : 0;
      const targetCostAtCurrentPrice = safeNumber(row.averageSalePrice) * 0.3;
      const costReductionNeeded = safeNumber(row.recipeCostPerDish) - targetCostAtCurrentPrice;

      return {
        ...row,
        priceNeededFor70,
        targetCostAtCurrentPrice,
        costReductionNeeded,
      };
    });

    return {
      matchedRows,
      matched,
      unmatched,
      totalPosSales,
      matchedSales,
      estimatedGrossProfit,
      averageGpPercent,
      winners,
      warnings,
      redFlags,
      summaryCallouts,
      damageReport,
      fixSuggestions,
    };
  }, [finalDishRecipes, posDishMatches, posSales]);

  const handlePosSalesCsvUpload = (file: File | null) => {
    if (!file) return;

    const fileName = String(file.name || "").toLowerCase();
    if (!fileName.endsWith(".csv")) {
      setPosSalesMessage("Upload a CSV file only. GP Police is not reading mystery paperwork here.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = parsePosSalesCsv(String(reader.result || ""));
      if (result.warning) {
        setPosSalesMessage(result.warning);
      }
      if (result.sales.length > 0) {
        createEmergencyBackupSnapshot?.("import_pos_sales");
        setPosSales(result.sales as any[]);
        setPosSalesMessage(`Imported ${result.sales.length} POS item${result.sales.length === 1 ? "" : "s"}. Match them once and GP Police starts calling out the margin.`);
      }
    };
    reader.onerror = () => setPosSalesMessage("Could not read that CSV. Export it again and try one more time.");
    reader.readAsText(file);
  };

  const updatePosDishMatch = (posItemName: string, recipeId: string) => {
    setPosDishMatches((previous: any) => ({
      ...previous,
      [posItemName]: recipeId,
    }));
  };

  const clearPosSales = () => {
    const confirmed = window.confirm("Clear uploaded POS sales? Recipe matches stay saved, but the current sales upload gets wiped.");
    if (!confirmed) return;
    createEmergencyBackupSnapshot?.("manual_backup");
    setPosSales([]);
    setPosSalesMessage("POS sales cleared. Upload the next CSV when service has finished robbing the till.");
  };

  return {
    posSales,
    setPosSales,
    posDishMatches,
    setPosDishMatches,
    posSalesMessage,
    setPosSalesMessage,
    posSalesReport,
    handlePosSalesCsvUpload,
    updatePosDishMatch,
    clearPosSales,
  };
}
