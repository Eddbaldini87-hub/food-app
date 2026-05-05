import { useMemo } from "react";
import { buildGpImpactSummary } from "@/lib/gp/gpEngine";

export function useGpEngine(args: {
  supplierIngredients: any[];
  computedRecipes: any[];
  lockedInvoiceHistory: any[];
  posSalesReport?: any;
}) {
  return useMemo(
    () => buildGpImpactSummary(args),
    [args.supplierIngredients, args.computedRecipes, args.lockedInvoiceHistory, args.posSalesReport]
  );
}
