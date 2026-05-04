import { useEffect, useRef, useState } from "react";

export function InvoiceIntakeView(props: any) {
  const {
    styles,
    invoiceIntakeMeta,
    setInvoiceIntakeMeta,
    handleSupplierInvoiceFileUpload,
    invoiceCameraInputRef,
    supplierInvoicePhotoName,
    supplierInvoicePhotoPreviewUrl,
    supplierInvoiceText,
    setSupplierInvoiceText,
    parseInvoiceForSelectedSupplier,
    handleSaveInvoiceDraft,
    handleLoadInvoiceDraft,
    handleDeleteInvoiceDraft,
    setSupplierInvoiceRows,
    setSupplierInvoiceMessage,
    setInvoiceQualityWarning,
    setInvoiceFixingRowId,
    setInvoiceDraftMessage,
    setSupplierInvoicePhotoName,
    setSupplierInvoicePhotoPreviewUrl,
    supplierInvoiceMessage,
    invoiceQualityWarning,
    invoiceDraftMessage,
    invoiceDraft,
    invoiceLockSuccessReport,
    lockedInvoiceHistory,
    formatCurrency,
    supplierInvoiceRows,
    invoiceLockSummary,
    invoiceWeeklySummary,
    damageHistory,
    setAllSupplierInvoiceRowsSelected,
    updateSupplierInvoiceRow,
    setSupplierInvoiceRowStatus,
    invoiceFixingRowId,
    sizeUnitOptions,
    componentUnitOptions,
    purchaseUnitOptions,
    supplierIngredients,
    setSupplierIngredients,
    selectedSupplier,
    orderingMeta,
    getInvoiceStatusBadgeStyle,
    getInvoiceStatusLabel,
    getInvoiceConfidenceBadgeStyle,
    handleCreateIngredientFromInvoiceRow,
    handleLockInvoiceIntoStock,
    handleSaveSupplierMatchMemory
  } = props;

  const [invoiceReviewFilter, setInvoiceReviewFilter] = useState("all");
  const [invoiceReviewSearchTerm, setInvoiceReviewSearchTerm] = useState("");
  const [invoiceReviewSortKey, setInvoiceReviewSortKey] = useState("original");
  const [invoiceReviewMode, setInvoiceReviewMode] = useState<"normal" | "compact">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return "compact";
    return "normal";
  });
  const [showInvoiceMatchDebug, setShowInvoiceMatchDebug] = useState(false);
  const [savedSupplierMatchRows, setSavedSupplierMatchRows] = useState<Record<string, boolean>>({});
  const [trialModeNotes, setTrialModeNotes] = useState("");
  const invoiceReviewPanelRef = useRef<HTMLDivElement | null>(null);
  const lastInvoiceRowCountRef = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setInvoiceReviewMode("compact");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mobileCompactCardStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: 8,
    marginTop: 10,
  };

  const warningActionCardStyle = {
    ...styles.infoCard,
    cursor: "pointer",
    border: "1px solid rgba(245, 158, 11, 0.42)",
  };

  const getInvoiceRowCogsType = (row: any) => {
    const rawType = String(row?.cogsType || row?.cogsCategory || "unknown").toLowerCase();
    if (rawType === "food" || rawType === "food_cogs") return "food_cogs";
    if (rawType === "consumable" || rawType === "consumables" || rawType === "consumable_cogs") return "consumable_cogs";
    if (rawType === "non_cogs" || rawType === "non-cogs" || rawType === "non cogs") return "non_cogs";
    return "unknown";
  };

  const getInvoiceCogsCategoryLabel = (row: any) => {
    const cogsType = getInvoiceRowCogsType(row);

    if (cogsType === "food_cogs") return "Food COGS";
    if (cogsType === "consumable_cogs") return "Consumable COGS";
    if (cogsType === "non_cogs") return "Non-COGS";

    return "Unknown / Needs Review";
  };

  const getInvoiceCogsCategoryBadgeStyle = (row: any): any => {
    const cogsType = getInvoiceRowCogsType(row);

    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "6px 10px",
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: "0.02em",
      border: "1px solid rgba(255, 255, 255, 0.16)",
      whiteSpace: "nowrap",
    };

    if (cogsType === "food_cogs") {
      return {
        ...baseStyle,
        background: "rgba(34, 197, 94, 0.14)",
        color: "#bbf7d0",
        borderColor: "rgba(34, 197, 94, 0.38)",
      };
    }

    if (cogsType === "consumable_cogs") {
      return {
        ...baseStyle,
        background: "rgba(59, 130, 246, 0.14)",
        color: "#bfdbfe",
        borderColor: "rgba(59, 130, 246, 0.38)",
      };
    }

    if (cogsType === "non_cogs") {
      return {
        ...baseStyle,
        background: "rgba(148, 163, 184, 0.14)",
        color: "#e2e8f0",
        borderColor: "rgba(148, 163, 184, 0.42)",
      };
    }

    return {
      ...baseStyle,
      background: "rgba(245, 158, 11, 0.14)",
      color: "#fde68a",
      borderColor: "rgba(245, 158, 11, 0.42)",
    };
  };

  const getInvoiceCogsCategoryHelpText = (row: any) => {
    const cogsType = getInvoiceRowCogsType(row);
    const confidence = String(row?.categoryConfidence || row?.cogsCategoryConfidence || "").toLowerCase();
    const reason = String(row?.cogsCategoryReason || "").trim();

    if (reason) {
      return `${confidence ? `${confidence.toUpperCase()} confidence · ` : ""}${reason}`;
    }

    if (cogsType === "food_cogs") return "This line is being treated as kitchen food cost.";
    if (cogsType === "consumable_cogs") return "This line is being treated as kitchen consumable cost.";
    if (cogsType === "non_cogs") return "This line is flagged as non-COGS and will not touch food GP.";

    return "GP Police could not confidently decide the COGS file yet. Review before locking.";
  };


  const getInvoiceDebugCleanName = (row: any) => {
    return String(row?.name || row?.description || row?.rawLine || "")
      .toLowerCase()
      .replace(/\b\d+(?:\.\d+)?\s*(?:x|kg|kgs|g|gm|ml|l|ltr|lt|each|ea|pkt|ctn|carton|box|case|pack|pk|bag|tray|tub|tin|bottle|bunch)\b/g, " ")
      .replace(/\b(?:kg|kgs|g|gm|ml|l|ltr|lt|each|ea|pkt|ctn|carton|box|case|pack|pk|bag|tray|tub|tin|bottle|bunch|fresh|frozen|whole|sliced|diced|chopped|peeled|premium|choice|grade|brand|approx)\b/g, " ")
      .replace(/\b[a-z]{0,3}\d+[a-z0-9-]*\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "No clean name found";
  };


  const getInvoiceRowMoneyValue = (row: any) => {
    const value = Number(row?.lineTotal ?? row?.total ?? row?.amount ?? row?.purchasePrice ?? row?.unitPrice ?? 0);
    return Number.isFinite(value) ? value : 0;
  };

  const getInvoiceRowDamageFlags = (row: any) => {
    const flags: string[] = [];
    const cogsType = getInvoiceRowCogsType(row);

    // Stage 5.17 safety rule:
    // Price-rise warnings are FOOD COGS only. Consumables, non-COGS, and unknown
    // rows must never trigger food GP ingredient price intelligence.
    if (cogsType !== "food_cogs") {
      return flags;
    }

    const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
    const matchedIngredientName = String(row?.matchedIngredientName || "").trim().toLowerCase();

    const matchedIngredient = (Array.isArray(supplierIngredients) ? supplierIngredients : []).find((ingredient: any) => {
      if (linkedIngredientId && String(ingredient?.id || "") === linkedIngredientId) return true;
      if (matchedIngredientName && String(ingredient?.name || "").trim().toLowerCase() === matchedIngredientName) return true;
      return false;
    });

    if (!matchedIngredient) {
      flags.push("⚠️ No ingredient match yet");
      return flags;
    }

    const invoiceUnitPrice = Number(row?.unitPrice ?? 0);
    const invoiceLineTotal = Number(row?.lineTotal ?? row?.purchasePrice ?? 0);
    const knownPurchasePrice = Number(matchedIngredient?.purchasePrice ?? matchedIngredient?.lastPurchasePrice ?? 0);

    const invoicePrice = Number.isFinite(invoiceUnitPrice) && invoiceUnitPrice > 0
      ? invoiceUnitPrice
      : Number.isFinite(invoiceLineTotal) && invoiceLineTotal > 0
        ? invoiceLineTotal
        : 0;

    if (!knownPurchasePrice || !invoicePrice || !Number.isFinite(knownPurchasePrice) || !Number.isFinite(invoicePrice)) {
      flags.push("⚠️ No price history to compare yet");
      return flags;
    }

    const percentChange = ((invoicePrice - knownPurchasePrice) / knownPurchasePrice) * 100;

    if (percentChange >= 25) {
      flags.push(`💀 Margin killer: +${Math.round(percentChange)}% vs known cost`);
    } else if (percentChange >= 15) {
      flags.push(`🚨 Price spike: +${Math.round(percentChange)}% vs known cost`);
    } else if (percentChange >= 8) {
      flags.push(`⚠️ Price rise: +${Math.round(percentChange)}% vs known cost`);
    }

    return flags;
  };

  const getInvoicePriceUpdateSuggestion = (row: any) => {
    const cogsType = getInvoiceRowCogsType(row);

    // Stage 5.17 safety rule:
    // Only matched food COGS rows can suggest ingredient price updates.
    // Consumables, non-COGS, and unknown rows are deliberately blocked.
    if (cogsType !== "food_cogs") {
      return null;
    }

    const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
    const matchedIngredientName = String(row?.matchedIngredientName || "").trim().toLowerCase();

    if (!linkedIngredientId && !matchedIngredientName) return null;

    const matchedIngredient = (Array.isArray(supplierIngredients) ? supplierIngredients : []).find((ingredient: any) => {
      if (linkedIngredientId && String(ingredient?.id || "") === linkedIngredientId) return true;
      if (matchedIngredientName && String(ingredient?.name || "").trim().toLowerCase() === matchedIngredientName) return true;
      return false;
    });

    if (!matchedIngredient) return null;

    const invoiceUnitPrice = Number(row?.unitPrice ?? 0);
    const invoiceLineTotal = Number(row?.lineTotal ?? row?.purchasePrice ?? 0);
    const knownPurchasePrice = Number(matchedIngredient?.purchasePrice ?? matchedIngredient?.lastPurchasePrice ?? 0);

    const invoicePrice = Number.isFinite(invoiceUnitPrice) && invoiceUnitPrice > 0
      ? invoiceUnitPrice
      : Number.isFinite(invoiceLineTotal) && invoiceLineTotal > 0
        ? invoiceLineTotal
        : 0;

    if (!knownPurchasePrice || !invoicePrice || !Number.isFinite(knownPurchasePrice) || !Number.isFinite(invoicePrice)) return null;
    if (invoicePrice <= knownPurchasePrice) return null;

    const percentIncrease = ((invoicePrice - knownPurchasePrice) / knownPurchasePrice) * 100;

    return {
      ingredientName: String(matchedIngredient?.name || row?.matchedIngredientName || row?.name || "Linked ingredient"),
      currentIngredientPrice: knownPurchasePrice,
      invoicePrice,
      percentIncrease,
    };
  };


  const handleUpdateIngredientPriceFromInvoiceRow = (row: any) => {
    const cogsType = getInvoiceRowCogsType(row);

    if (cogsType !== "food_cogs") {
      setSupplierInvoiceMessage("Only food COGS rows can update ingredient prices. Consumables and non-COGS stay out of food GP.");
      return;
    }

    const suggestion = getInvoicePriceUpdateSuggestion(row);
    const linkedIngredientId = String(row?.linkedIngredientId || "").trim();

    if (!suggestion || !linkedIngredientId) {
      setSupplierInvoiceMessage("No linked ingredient price update available for this row.");
      return;
    }

    if (typeof setSupplierIngredients !== "function") {
      setSupplierInvoiceMessage("Ingredient price update is not connected on this screen yet.");
      return;
    }

    const confirmed = window.confirm(
      `Update this FOOD ingredient price from ${formatCurrency(suggestion.currentIngredientPrice)} → ${formatCurrency(suggestion.invoicePrice)}? This only changes the linked ingredient after your approval.`
    );

    if (!confirmed) return;

    setSupplierIngredients((previous: any[]) =>
      (Array.isArray(previous) ? previous : []).map((ingredient: any) =>
        String(ingredient?.id || "") === linkedIngredientId
          ? {
              ...ingredient,
              purchasePrice: suggestion.invoicePrice,
              lastPurchasePrice: suggestion.invoicePrice,
            }
          : ingredient
      )
    );

    setSupplierInvoiceMessage("Ingredient price updated after manual approval. Recipes were not changed directly.");
  };


  const invoiceCogsCategoryTotals = (Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).reduce(
    (totals: any, row: any) => {
      if (!row?.selected) return totals;

      const cogsType = getInvoiceRowCogsType(row);
      const lineValue = getInvoiceRowMoneyValue(row);

      if (cogsType === "food_cogs") {
        totals.food += lineValue;
      } else if (cogsType === "consumable_cogs") {
        totals.consumable += lineValue;
      } else if (cogsType === "non_cogs") {
        totals.nonCogs += lineValue;
      } else {
        totals.unknown += lineValue;
      }

      return totals;
    },
    { food: 0, consumable: 0, nonCogs: 0, unknown: 0 }
  );

  const getLockedInvoiceCogsTotals = (invoice: any) => {
    const rows = Array.isArray(invoice?.rows) ? invoice.rows : [];

    return rows.reduce(
      (totals: any, row: any) => {
        const cogsType = getInvoiceRowCogsType(row);
        const lineValue = getInvoiceRowMoneyValue(row);

        if (cogsType === "food_cogs") {
          totals.food += lineValue;
        } else if (cogsType === "consumable_cogs") {
          totals.consumable += lineValue;
        } else if (cogsType === "non_cogs") {
          totals.nonCogs += lineValue;
        } else {
          totals.unknown += lineValue;
        }

        return totals;
      },
      { food: 0, consumable: 0, nonCogs: 0, unknown: 0 }
    );
  };


  const invoicePreflightSummary = (Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).reduce(
    (summary: any, row: any) => {
      if (!row?.selected) return summary;

      const cogsType = getInvoiceRowCogsType(row);
      const status = String(row?.status || "").toLowerCase();
      const isLinked = Boolean(String(row?.linkedIngredientId || "").trim());
      const lineValue = getInvoiceRowMoneyValue(row);

      summary.selectedRowCount += 1;

      if (cogsType === "food_cogs") {
        summary.foodRowsCount += 1;
        summary.estimatedFoodCogsTotal += lineValue;
        if (!isLinked && status !== "create_new") {
          summary.unlinkedFoodRowsCount += 1;
        }
      } else if (cogsType === "consumable_cogs") {
        summary.consumableRowsCount += 1;
        summary.estimatedConsumablesTotal += lineValue;
      } else if (cogsType === "non_cogs") {
        summary.nonCogsRowsCount += 1;
        summary.estimatedNonCogsTotal += lineValue;
      } else {
        summary.unknownRowsCount += 1;
      }

      if (isLinked) {
        summary.linkedIngredientCount += 1;
      } else {
        summary.notLinkedCount += 1;
      }

      if (status === "create_new") {
        summary.createNewCount += 1;
      }

      return summary;
    },
    {
      selectedRowCount: 0,
      foodRowsCount: 0,
      consumableRowsCount: 0,
      unknownRowsCount: 0,
      nonCogsRowsCount: 0,
      linkedIngredientCount: 0,
      notLinkedCount: 0,
      createNewCount: 0,
      unlinkedFoodRowsCount: 0,
      estimatedFoodCogsTotal: 0,
      estimatedConsumablesTotal: 0,
      estimatedNonCogsTotal: 0,
    }
  );

  const invoiceGpDamageSummary = (Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).reduce(
    (summary: any, row: any) => {
      const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
      const matchedIngredientName = String(row?.matchedIngredientName || "").trim().toLowerCase();

      if (!linkedIngredientId && !matchedIngredientName) return summary;

      const matchedIngredient = (Array.isArray(supplierIngredients) ? supplierIngredients : []).find((ingredient: any) => {
        if (linkedIngredientId && String(ingredient?.id || "") === linkedIngredientId) return true;
        if (matchedIngredientName && String(ingredient?.name || "").trim().toLowerCase() === matchedIngredientName) return true;
        return false;
      });

      if (!matchedIngredient) return summary;

      const invoiceUnitPrice = Number(row?.unitPrice ?? 0);
      const invoiceLineTotal = Number(row?.lineTotal ?? row?.purchasePrice ?? 0);
      const knownPurchasePrice = Number(matchedIngredient?.purchasePrice ?? matchedIngredient?.lastPurchasePrice ?? 0);

      const invoicePrice = Number.isFinite(invoiceUnitPrice) && invoiceUnitPrice > 0
        ? invoiceUnitPrice
        : Number.isFinite(invoiceLineTotal) && invoiceLineTotal > 0
          ? invoiceLineTotal
          : 0;

      if (!knownPurchasePrice || !invoicePrice || !Number.isFinite(knownPurchasePrice) || !Number.isFinite(invoicePrice)) return summary;

      const percentIncrease = ((invoicePrice - knownPurchasePrice) / knownPurchasePrice) * 100;
      const lineValue = getInvoiceRowMoneyValue(row);

      if (percentIncrease >= 25) {
        summary.marginKillerTotal += lineValue;
        summary.marginKillerCount += 1;
      } else if (percentIncrease >= 15) {
        summary.priceSpikeTotal += lineValue;
        summary.priceSpikeCount += 1;
      } else if (percentIncrease >= 8) {
        summary.priceRiseTotal += lineValue;
        summary.priceRiseCount += 1;
      }

      summary.totalDamage = summary.marginKillerTotal + summary.priceSpikeTotal + summary.priceRiseTotal;

      return summary;
    },
    {
      marginKillerTotal: 0,
      priceSpikeTotal: 0,
      priceRiseTotal: 0,
      totalDamage: 0,
      marginKillerCount: 0,
      priceSpikeCount: 0,
      priceRiseCount: 0,
    }
  );




  const getInvoiceRowReviewState = (row: any): any => {
    const cogsType = getInvoiceRowCogsType(row);
    const categoryConfidence = String(row?.categoryConfidence || row?.cogsCategoryConfidence || row?.confidence || "low").toLowerCase();
    const matchConfidence = String(row?.matchConfidence || "").toLowerCase();
    const linkedIngredientId = String(row?.linkedIngredientId || "").trim();

    if (cogsType === "unknown" || (cogsType === "food_cogs" && !linkedIngredientId)) {
      return {
        level: "low",
        label: "Fix",
        helper: cogsType === "unknown" ? "Category needs review" : "Food row not linked",
      };
    }

    if (cogsType === "consumable_cogs" || cogsType === "non_cogs") {
      return {
        level: categoryConfidence === "low" ? "medium" : "high",
        label: cogsType === "consumable_cogs" ? "Separated" : "Excluded",
        helper: cogsType === "consumable_cogs" ? "Consumable will stay out of food COGS" : "Non-COGS will not touch food GP",
      };
    }

    if ((categoryConfidence === "high" || categoryConfidence === "learned") && (matchConfidence === "high" || matchConfidence === "learned")) {
      return {
        level: "high",
        label: "Safe",
        helper: "Category and ingredient match look solid",
      };
    }

    if (categoryConfidence === "medium" || matchConfidence === "medium") {
      return {
        level: "medium",
        label: "Check",
        helper: "Review this before locking",
      };
    }

    return {
      level: "medium",
      label: "Check",
      helper: "Matched, but confidence is not fully proven yet",
    };
  };

  const getInvoiceRowReviewCardStyle = (row: any): any => {
    const reviewState = getInvoiceRowReviewState(row);
    const baseStyle = {
      ...styles.infoCard,
      border: "1px solid rgba(255, 255, 255, 0.14)",
    };

    if (reviewState.level === "high") {
      return {
        ...baseStyle,
        borderColor: "rgba(34, 197, 94, 0.45)",
        background: "linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(10, 10, 12, 0.94))",
      };
    }

    if (reviewState.level === "low") {
      return {
        ...baseStyle,
        borderColor: "rgba(248, 113, 113, 0.5)",
        background: "linear-gradient(135deg, rgba(248, 113, 113, 0.13), rgba(10, 10, 12, 0.94))",
      };
    }

    return {
      ...baseStyle,
      borderColor: "rgba(245, 158, 11, 0.48)",
      background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(10, 10, 12, 0.94))",
    };
  };

  const getInvoiceReviewBadgeStyle = (row: any): any => {
    const reviewState = getInvoiceRowReviewState(row);
    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "6px 10px",
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: "0.03em",
      border: "1px solid rgba(255, 255, 255, 0.16)",
      whiteSpace: "nowrap",
      textTransform: "uppercase" as const,
    };

    if (reviewState.level === "high") {
      return {
        ...baseStyle,
        background: "rgba(34, 197, 94, 0.18)",
        color: "#bbf7d0",
        borderColor: "rgba(34, 197, 94, 0.45)",
      };
    }

    if (reviewState.level === "low") {
      return {
        ...baseStyle,
        background: "rgba(248, 113, 113, 0.18)",
        color: "#fecaca",
        borderColor: "rgba(248, 113, 113, 0.5)",
      };
    }

    return {
      ...baseStyle,
      background: "rgba(245, 158, 11, 0.18)",
      color: "#fde68a",
      borderColor: "rgba(245, 158, 11, 0.48)",
    };
  };


  const getInvoiceMatchConfidenceBadgeStyle = (row: any): any => {
    const confidence = String(row?.matchConfidence || "low").toLowerCase();
    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "6px 10px",
      fontSize: 12,
      fontWeight: 800,
      border: "1px solid rgba(255, 255, 255, 0.16)",
      whiteSpace: "nowrap",
      textTransform: "uppercase" as const,
    };

    if (confidence === "high") {
      return {
        ...baseStyle,
        background: "rgba(34, 197, 94, 0.14)",
        color: "#bbf7d0",
        borderColor: "rgba(34, 197, 94, 0.38)",
      };
    }

    if (confidence === "medium") {
      return {
        ...baseStyle,
        background: "rgba(245, 158, 11, 0.14)",
        color: "#fde68a",
        borderColor: "rgba(245, 158, 11, 0.42)",
      };
    }

    return {
      ...baseStyle,
      background: "rgba(248, 113, 113, 0.14)",
      color: "#fecaca",
      borderColor: "rgba(248, 113, 113, 0.42)",
    };
  };

  const getInvoiceMatchLabel = (row: any) => {
    const cogsType = getInvoiceRowCogsType(row);
    const matchedName = String(row?.matchedIngredientName || "").trim();

    if (cogsType !== "food_cogs") return "Match not required";
    if (matchedName) return `Matched: ${matchedName}`;
    return "No match found";
  };

  const getInvoiceMatchBadgeStyle = (row: any): any => {
    const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "6px 10px",
      fontSize: 12,
      fontWeight: 800,
      border: "1px solid rgba(255, 255, 255, 0.16)",
      whiteSpace: "nowrap",
    };

    if (linkedIngredientId) {
      return {
        ...baseStyle,
        background: "rgba(34, 197, 94, 0.14)",
        color: "#bbf7d0",
        borderColor: "rgba(34, 197, 94, 0.38)",
      };
    }

    return {
      ...baseStyle,
      background: "rgba(248, 113, 113, 0.14)",
      color: "#fecaca",
      borderColor: "rgba(248, 113, 113, 0.42)",
    };
  };

  const getDamageHistoryWeekKey = (value: any) => {
    const date = new Date(String(value || ""));
    if (Number.isNaN(date.getTime())) return "";
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + diffToMonday);
    return date.toISOString().slice(0, 10);
  };

  const weeklyDamageSummary = (() => {
    const today = new Date();
    const thisWeekKey = getDamageHistoryWeekKey(today.toISOString());
    const lastWeekDate = new Date(today);
    lastWeekDate.setDate(today.getDate() - 7);
    const lastWeekKey = getDamageHistoryWeekKey(lastWeekDate.toISOString());

    const history = Array.isArray(damageHistory) ? damageHistory : [];
    const thisWeekTotal = history.reduce((sum: number, entry: any) => {
      return getDamageHistoryWeekKey(entry?.date) === thisWeekKey ? sum + Number(entry?.totalDamage || 0) : sum;
    }, 0);
    const lastWeekTotal = history.reduce((sum: number, entry: any) => {
      return getDamageHistoryWeekKey(entry?.date) === lastWeekKey ? sum + Number(entry?.totalDamage || 0) : sum;
    }, 0);
    const change = thisWeekTotal - lastWeekTotal;
    const percentChange = lastWeekTotal > 0 ? (change / lastWeekTotal) * 100 : thisWeekTotal > 0 ? 100 : 0;

    let label = "Damage stable";
    let tone = "stable";

    if (change > 1) {
      label = "Damage rising";
      tone = "rising";
    } else if (change < -1) {
      label = "Damage improving";
      tone = "improving";
    }

    return {
      thisWeekTotal,
      lastWeekTotal,
      percentChange: Number.isFinite(percentChange) ? percentChange : 0,
      label,
      tone,
    };
  })();

  const getWeeklyDamageBadgeStyle = (): any => {
    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "6px 10px",
      fontSize: 12,
      fontWeight: 900,
      border: "1px solid rgba(255, 255, 255, 0.16)",
      whiteSpace: "nowrap",
    };

    if (weeklyDamageSummary.tone === "rising") {
      return {
        ...baseStyle,
        background: "rgba(248, 113, 113, 0.16)",
        color: "#fecaca",
        borderColor: "rgba(248, 113, 113, 0.48)",
      };
    }

    if (weeklyDamageSummary.tone === "improving") {
      return {
        ...baseStyle,
        background: "rgba(34, 197, 94, 0.14)",
        color: "#bbf7d0",
        borderColor: "rgba(34, 197, 94, 0.38)",
      };
    }

    return {
      ...baseStyle,
      background: "rgba(245, 158, 11, 0.14)",
      color: "#fde68a",
      borderColor: "rgba(245, 158, 11, 0.42)",
    };
  };

  const invoiceWeeklySpendInsight = (() => {
    const thisWeekSpend = Number(invoiceWeeklySummary?.thisWeekSpend ?? 0);
    const lastWeekSpend = Number(invoiceWeeklySummary?.lastWeekSpend ?? 0);
    const weeklyChange = Number(invoiceWeeklySummary?.weeklyChange ?? thisWeekSpend - lastWeekSpend);
    const percentChange = lastWeekSpend > 0 ? (weeklyChange / lastWeekSpend) * 100 : thisWeekSpend > 0 ? 100 : 0;

    let tone = "good";
    let label = "✅ Spend holding steady";

    if (lastWeekSpend <= 0 && thisWeekSpend > 0) {
      tone = "watch";
      label = "⚠️ First week tracked — build history before judging it";
    } else if (percentChange > 15) {
      tone = "danger";
      label = `🚨 Weekly spend up ${Math.round(percentChange)}%`;
    } else if (percentChange > 8) {
      tone = "watch";
      label = `⚠️ Weekly spend up ${Math.round(percentChange)}%`;
    } else if (percentChange < 0) {
      tone = "good";
      label = `✅ Weekly spend down ${Math.abs(Math.round(percentChange))}%`;
    }

    return {
      thisWeekSpend: Number.isFinite(thisWeekSpend) ? thisWeekSpend : 0,
      lastWeekSpend: Number.isFinite(lastWeekSpend) ? lastWeekSpend : 0,
      weeklyChange: Number.isFinite(weeklyChange) ? weeklyChange : 0,
      percentChange: Number.isFinite(percentChange) ? percentChange : 0,
      tone,
      label,
    };
  })();

  const getInvoiceWeeklySpendBadgeStyle = (): any => {
    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "6px 10px",
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: "0.02em",
      border: "1px solid rgba(255, 255, 255, 0.16)",
      whiteSpace: "nowrap",
    };

    if (invoiceWeeklySpendInsight.tone === "danger") {
      return {
        ...baseStyle,
        background: "rgba(248, 113, 113, 0.14)",
        color: "#fecaca",
        borderColor: "rgba(248, 113, 113, 0.42)",
      };
    }

    if (invoiceWeeklySpendInsight.tone === "watch") {
      return {
        ...baseStyle,
        background: "rgba(245, 158, 11, 0.14)",
        color: "#fde68a",
        borderColor: "rgba(245, 158, 11, 0.42)",
      };
    }

    return {
      ...baseStyle,
      background: "rgba(34, 197, 94, 0.14)",
      color: "#bbf7d0",
      borderColor: "rgba(34, 197, 94, 0.38)",
    };
  };

  const invoiceReviewFilterOptions = [
    { key: "all", label: "All" },
    { key: "food_cogs", label: "Food COGS" },
    { key: "consumable_cogs", label: "Consumables" },
    { key: "non_cogs", label: "Non-COGS" },
    { key: "unknown", label: "Unknown" },
    { key: "needs_fix", label: "Fix Only" },
    { key: "unmatched_food", label: "Unmatched Food" },
    { key: "price_warnings", label: "Price Warnings" },
  ];

  const getInvoiceReviewFilterMatches = (row: any, filterKey: string) => {
    const cogsType = getInvoiceRowCogsType(row);
    const reviewState = getInvoiceRowReviewState(row);
    const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
    const status = String(row?.status || "").toLowerCase();
    const hasPriceWarning = getInvoiceRowDamageFlags(row).some((flag: string) =>
      flag.includes("Price rise") || flag.includes("Price spike") || flag.includes("Margin killer")
    );

    if (filterKey === "all") return true;
    if (filterKey === "food_cogs") return cogsType === "food_cogs";
    if (filterKey === "consumable_cogs") return cogsType === "consumable_cogs";
    if (filterKey === "non_cogs") return cogsType === "non_cogs";
    if (filterKey === "unknown") return cogsType === "unknown";
    if (filterKey === "needs_fix") return reviewState.level === "low" || cogsType === "unknown";
    if (filterKey === "unmatched_food") return cogsType === "food_cogs" && !linkedIngredientId && status !== "create_new";
    if (filterKey === "price_warnings") return hasPriceWarning;

    return true;
  };

  const getInvoiceReviewSearchMatches = (row: any) => {
    const search = invoiceReviewSearchTerm.trim().toLowerCase();
    if (!search) return true;

    const searchableText = [
      row?.name,
      row?.code,
      row?.rawLine,
      getInvoiceCogsCategoryLabel(row),
      row?.cogsType,
      row?.cogsCategory,
      row?.category,
      row?.matchedIngredientName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  };

  const invoiceReviewSortOptions = [
    { key: "original", label: "Original order" },
    { key: "needs_fix_first", label: "Needs fix first" },
    { key: "highest_line_total", label: "Highest line total" },
    { key: "food_first", label: "Food first" },
    { key: "consumables_first", label: "Consumables first" },
    { key: "unknown_first", label: "Unknown first" },
    { key: "price_warnings_first", label: "Price warnings first" },
  ];

  const getInvoiceReviewSortScore = (row: any, sortKey: string) => {
    const cogsType = getInvoiceRowCogsType(row);
    const reviewState = getInvoiceRowReviewState(row);
    const hasPriceWarning = getInvoiceRowDamageFlags(row).some((flag: string) =>
      flag.includes("Price rise") || flag.includes("Price spike") || flag.includes("Margin killer")
    );

    if (sortKey === "needs_fix_first") return reviewState.level === "low" || cogsType === "unknown" ? 0 : 1;
    if (sortKey === "food_first") return cogsType === "food_cogs" ? 0 : 1;
    if (sortKey === "consumables_first") return cogsType === "consumable_cogs" ? 0 : 1;
    if (sortKey === "unknown_first") return cogsType === "unknown" ? 0 : 1;
    if (sortKey === "price_warnings_first") return hasPriceWarning ? 0 : 1;

    return 0;
  };

  const sortInvoiceReviewRows = (rows: any[]) => {
    if (invoiceReviewSortKey === "original") return rows;

    return rows
      .map((row: any, index: number) => ({ row, index }))
      .sort((a: any, b: any) => {
        if (invoiceReviewSortKey === "highest_line_total") {
          const totalDifference = getInvoiceRowMoneyValue(b.row) - getInvoiceRowMoneyValue(a.row);
          return totalDifference !== 0 ? totalDifference : a.index - b.index;
        }

        const scoreDifference =
          getInvoiceReviewSortScore(a.row, invoiceReviewSortKey) - getInvoiceReviewSortScore(b.row, invoiceReviewSortKey);

        return scoreDifference !== 0 ? scoreDifference : a.index - b.index;
      })
      .map((item: any) => item.row);
  };

  const displayedSupplierInvoiceRows = sortInvoiceReviewRows(
    (Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).filter((row: any) =>
      getInvoiceReviewFilterMatches(row, invoiceReviewFilter) && getInvoiceReviewSearchMatches(row)
    )
  );

  const getInvoiceReviewFilterCount = (filterKey: string) => {
    return (Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).filter((row: any) =>
      getInvoiceReviewFilterMatches(row, filterKey) && getInvoiceReviewSearchMatches(row)
    ).length;
  };


  const invoiceReviewVisibilitySummary = (() => {
    const allRows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];
    const displayedRows = Array.isArray(displayedSupplierInvoiceRows) ? displayedSupplierInvoiceRows : [];

    return {
      totalRows: allRows.length,
      displayedRows: displayedRows.length,
      selectedDisplayedRows: displayedRows.filter((row: any) => Boolean(row?.selected)).length,
      hiddenRows: Math.max(allRows.length - displayedRows.length, 0),
    };
  })();

  const invoiceReviewWarningSummary = (() => {
    const rows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];

    return rows.reduce(
      (summary: any, row: any) => {
        const cogsType = getInvoiceRowCogsType(row);
        const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
        const status = String(row?.status || "").toLowerCase();
        const hasPriceWarning = getInvoiceRowDamageFlags(row).some((flag: string) =>
          flag.includes("Price rise") || flag.includes("Price spike") || flag.includes("Margin killer")
        );

        if (cogsType === "unknown") summary.unknownRowsCount += 1;
        if (cogsType === "food_cogs" && !linkedIngredientId && status !== "create_new" && status !== "ignore") {
          summary.unmatchedFoodCount += 1;
        }
        if (hasPriceWarning) summary.priceWarningCount += 1;

        return summary;
      },
      {
        unknownRowsCount: 0,
        unmatchedFoodCount: 0,
        priceWarningCount: 0,
      }
    );
  })();

  const invoiceReviewReadinessSummary = (() => {
    const rows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];

    return rows.reduce(
      (summary: any, row: any) => {
        const reviewState = getInvoiceRowReviewState(row);
        const cogsType = getInvoiceRowCogsType(row);
        const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
        const status = String(row?.status || "").toLowerCase();
        const hasPriceWarning = getInvoiceRowDamageFlags(row).some((flag: string) =>
          flag.includes("Price rise") || flag.includes("Price spike") || flag.includes("Margin killer")
        );

        if (reviewState.level === "low" || cogsType === "unknown" || (cogsType === "food_cogs" && !linkedIngredientId && status !== "create_new" && status !== "ignore")) {
          summary.needsFixRowsCount += 1;
        } else {
          summary.readyRowsCount += 1;
        }

        if (cogsType === "unknown") summary.unknownRowsCount += 1;
        if (cogsType === "food_cogs" && !linkedIngredientId && status !== "create_new" && status !== "ignore") {
          summary.unmatchedFoodCount += 1;
        }
        if (hasPriceWarning) summary.priceWarningCount += 1;

        return summary;
      },
      {
        readyRowsCount: 0,
        needsFixRowsCount: 0,
        unknownRowsCount: 0,
        unmatchedFoodCount: 0,
        priceWarningCount: 0,
      }
    );
  })();

  const invoiceSafeToLockTone = invoiceReviewReadinessSummary.unknownRowsCount === 0 && invoiceReviewReadinessSummary.unmatchedFoodCount === 0 ? "safe" : "warning";

  const handleLearnSupplierMatchFromRow = (row: any) => {
    const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
    const supplierMatchKey = String(row?.supplierMatchKey || "").trim();

    if (!linkedIngredientId || !supplierMatchKey) {
      setSupplierInvoiceMessage("Link this food row to an ingredient before saving match learning.");
      return;
    }

    if (typeof handleSaveSupplierMatchMemory !== "function") {
      setSupplierInvoiceMessage("Supplier match learning is not connected yet. Recheck page.tsx props.");
      return;
    }

    handleSaveSupplierMatchMemory(row, linkedIngredientId);
    setSavedSupplierMatchRows((previous: Record<string, boolean>) => ({
      ...previous,
      [String(row?.id || supplierMatchKey)]: true,
    }));
  };

  const updateDisplayedInvoiceRowsSelected = (selected: boolean) => {
    displayedSupplierInvoiceRows.forEach((row: any) => {
      updateSupplierInvoiceRow(row.id, "selected", selected);
    });
  };

  const markDisplayedInvoiceRowsCogsCategory = (nextCogsCategory: "unknown" | "consumable_cogs" | "non_cogs") => {
    if (!displayedSupplierInvoiceRows.length) {
      setSupplierInvoiceMessage("No displayed rows to update. Change the search/filter first.");
      return;
    }

    const label =
      nextCogsCategory === "consumable_cogs"
        ? "Consumable COGS"
        : nextCogsCategory === "non_cogs"
          ? "Non-COGS"
          : "Unknown";

    const confirmed = window.confirm(
      `Mark ${displayedSupplierInvoiceRows.length} currently displayed invoice row(s) as ${label}? Hidden rows will not be changed.`
    );

    if (!confirmed) return;

    displayedSupplierInvoiceRows.forEach((row: any) => {
      updateSupplierInvoiceRow(row.id, "cogsCategory", nextCogsCategory);
    });

    setSupplierInvoiceMessage(`Updated ${displayedSupplierInvoiceRows.length} displayed row(s) to ${label}. Hidden rows were not changed.`);
  };

  const resetInvoiceReviewControls = (control: "search" | "filter" | "sort") => {
    if (control === "search") {
      setInvoiceReviewSearchTerm("");
      return;
    }

    if (control === "filter") {
      setInvoiceReviewFilter("all");
      return;
    }

    setInvoiceReviewSortKey("original");
  };

  const invoiceLockBlockingSummary = (() => {
    const rows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];
    const selectedRows = rows.filter((row: any) => row?.selected !== false && String(row?.status || "").toLowerCase() !== "ignore");

    return selectedRows.reduce(
      (summary: any, row: any) => {
        const cogsType = getInvoiceRowCogsType(row);
        const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
        const status = String(row?.status || "").toLowerCase();
        const name = String(row?.name || "").trim();
        const lineValue = getInvoiceRowMoneyValue(row);

        if (cogsType === "unknown") summary.unknownRowsCount += 1;
        if (cogsType === "food_cogs" && !linkedIngredientId && status !== "create_new") summary.unlinkedFoodRowsCount += 1;
        if (!name) summary.missingNameRowsCount += 1;
        if (lineValue <= 0) summary.missingValueRowsCount += 1;

        summary.selectedRowsCount += 1;
        return summary;
      },
      {
        selectedRowsCount: 0,
        unknownRowsCount: 0,
        unlinkedFoodRowsCount: 0,
        missingNameRowsCount: 0,
        missingValueRowsCount: 0,
      }
    );
  })();

  const invoiceCanLockSafely =
    !invoiceLockSummary?.isLocked &&
    invoiceLockBlockingSummary.selectedRowsCount > 0 &&
    invoiceLockBlockingSummary.unknownRowsCount === 0 &&
    invoiceLockBlockingSummary.unlinkedFoodRowsCount === 0 &&
    invoiceLockBlockingSummary.missingNameRowsCount === 0 &&
    invoiceLockBlockingSummary.missingValueRowsCount === 0;

  const invoiceFlowSummary = (() => {
    const rows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];
    const hasPhoto = Boolean(String(supplierInvoicePhotoName || "").trim() || supplierInvoicePhotoPreviewUrl);
    const hasText = Boolean(String(supplierInvoiceText || "").trim());
    const rowsDetected = rows.length;
    const needsFixCount = invoiceReviewReadinessSummary.needsFixRowsCount;
    const readyRowsCount = invoiceReviewReadinessSummary.readyRowsCount;

    let statusLabel = "Scan your first invoice to begin";
    let statusTone = "idle";
    let lockLabel = "Scan invoice first";

    if (invoiceLockSummary?.isLocked) {
      statusLabel = "Invoice already locked";
      statusTone = "locked";
      lockLabel = "Invoice already locked";
    } else if (rowsDetected <= 0 && (hasPhoto || hasText)) {
      statusLabel = "Scan the invoice text to build review rows";
      statusTone = "scan";
      lockLabel = "Scan invoice first";
    } else if (rowsDetected > 0 && invoiceCanLockSafely) {
      statusLabel = "Clean and ready to lock";
      statusTone = "ready";
      lockLabel = "🚔 Lock clean invoice";
    } else if (rowsDetected > 0 && needsFixCount > 0) {
      statusLabel = `Fix ${needsFixCount} row(s) before locking`;
      statusTone = "danger";
      lockLabel = "🚧 Fix this before it costs you";
    } else if (rowsDetected > 0) {
      statusLabel = "Quick review recommended";
      statusTone = "review";
      lockLabel = "⚠️ Review before locking";
    }

    return {
      hasPhoto,
      hasText,
      rowsDetected,
      needsFixCount,
      readyRowsCount,
      statusLabel,
      statusTone,
      lockLabel,
    };
  })();


  const trialGuardrailSummary = (() => {
    const hasSupplier = Boolean(String(selectedSupplier?.name || "").trim());
    const hasInvoiceDate = Boolean(String(invoiceIntakeMeta?.invoiceDate || "").trim());
    const hasInvoiceNumber = Boolean(String(invoiceIntakeMeta?.invoiceNumber || "").trim());
    const hasRows = invoiceFlowSummary.rowsDetected > 0;
    const hasReviewedRows = hasRows && invoiceReviewReadinessSummary.needsFixRowsCount === 0;
    const hasFoodOrConsumables = invoicePreflightSummary.foodRowsCount > 0 || invoicePreflightSummary.consumableRowsCount > 0 || invoicePreflightSummary.nonCogsRowsCount > 0;
    const backupReminder = invoiceLockSummary?.isLocked ? "Download backup after lock" : "Download backup before lock";

    const checklist = [
      {
        key: "supplier",
        label: "Supplier selected",
        done: hasSupplier,
        helper: hasSupplier ? String(selectedSupplier?.name || "Supplier ready") : "Open from a supplier before invoice trial.",
      },
      {
        key: "invoiceDate",
        label: "Invoice date entered",
        done: hasInvoiceDate,
        helper: hasInvoiceDate ? String(invoiceIntakeMeta?.invoiceDate || "Date ready") : "Add invoice date before locking.",
      },
      {
        key: "rows",
        label: "Rows scanned",
        done: hasRows,
        helper: hasRows ? `${invoiceFlowSummary.rowsDetected} row(s) detected` : "Scan or paste invoice text first.",
      },
      {
        key: "review",
        label: "Risk rows fixed",
        done: hasReviewedRows,
        helper: hasReviewedRows ? "No unknown or unmatched food blockers" : `${invoiceReviewReadinessSummary.needsFixRowsCount} row(s) still need review`,
      },
      {
        key: "cogs",
        label: "COGS split checked",
        done: hasFoodOrConsumables,
        helper: `${invoicePreflightSummary.foodRowsCount} food · ${invoicePreflightSummary.consumableRowsCount} consumable · ${invoicePreflightSummary.nonCogsRowsCount} non-COGS`,
      },
      {
        key: "backup",
        label: backupReminder,
        done: Boolean(invoiceLockSummary?.isLocked),
        helper: invoiceLockSummary?.isLocked ? "Now download a fresh venue backup." : "Take a backup before trial locking real data.",
      },
    ];

    const doneCount = checklist.filter((item) => item.done).length;

    return {
      checklist,
      doneCount,
      totalCount: checklist.length,
      isTrialReady: invoiceCanLockSafely && hasSupplier && hasRows && hasInvoiceDate,
      hasInvoiceNumber,
    };
  })();

  const getTrialChecklistItemStyle = (done: boolean): any => ({
    ...styles.infoCard,
    border: done ? "1px solid rgba(34, 197, 94, 0.36)" : "1px solid rgba(245, 158, 11, 0.36)",
    background: done ? "rgba(34, 197, 94, 0.08)" : "rgba(245, 158, 11, 0.08)",
  });

  const getInvoiceFlowStatusStyle = (): any => {
    const baseStyle = {
      ...styles.infoCard,
      border: "1px solid rgba(255, 255, 255, 0.16)",
      marginTop: 12,
    };

    if (invoiceFlowSummary.statusTone === "ready") {
      return { ...baseStyle, borderColor: "rgba(34, 197, 94, 0.48)", background: "rgba(34, 197, 94, 0.10)" };
    }

    if (invoiceFlowSummary.statusTone === "danger") {
      return { ...baseStyle, borderColor: "rgba(248, 113, 113, 0.48)", background: "rgba(127, 29, 29, 0.14)" };
    }

    if (invoiceFlowSummary.statusTone === "review" || invoiceFlowSummary.statusTone === "scan") {
      return { ...baseStyle, borderColor: "rgba(245, 158, 11, 0.42)", background: "rgba(245, 158, 11, 0.08)" };
    }

    return baseStyle;
  };

  const scrollToInvoiceReviewPanel = () => {
    invoiceReviewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const jumpToInvoiceProblemFilter = (filterKey: string, sortKey = "needs_fix_first") => {
    setInvoiceReviewSearchTerm("");
    setInvoiceReviewFilter(filterKey);
    setInvoiceReviewSortKey(sortKey);
    window.setTimeout(() => {
      invoiceReviewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  useEffect(() => {
    const rows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];
    const rowCount = rows.length;

    if (rowCount > 0 && invoiceReviewReadinessSummary.needsFixRowsCount > 0 && invoiceReviewFilter === "all") {
      setInvoiceReviewFilter("needs_fix");
      setInvoiceReviewSortKey("needs_fix_first");
    }

    if (rowCount > 0 && rowCount !== lastInvoiceRowCountRef.current && invoiceReviewReadinessSummary.needsFixRowsCount > 0) {
      window.setTimeout(() => {
        invoiceReviewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }

    lastInvoiceRowCountRef.current = rowCount;
  }, [supplierInvoiceRows, invoiceReviewReadinessSummary.needsFixRowsCount, invoiceReviewFilter]);

  const showOnlyInvoiceRowsNeedingFix = () => {
    setInvoiceReviewSearchTerm("");
    setInvoiceReviewFilter("needs_fix");
    setInvoiceReviewSortKey("needs_fix_first");
    setSupplierInvoiceMessage("Showing only the rows that need your attention.");
  };

  const autoApproveHighConfidenceInvoiceRows = () => {
    const rows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];
    const rowsToApprove = rows.filter((row: any) => {
      const cogsType = getInvoiceRowCogsType(row);
      const reviewState = getInvoiceRowReviewState(row);
      const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
      const status = String(row?.status || "").toLowerCase();
      const hasName = String(row?.name || "").trim().length > 0;
      const hasValue = getInvoiceRowMoneyValue(row) > 0;

      if (!hasName || !hasValue) return false;
      if (status === "ignore" || status === "create_new") return false;
      if (cogsType === "unknown") return false;
      if (cogsType === "food_cogs" && !linkedIngredientId) return false;

      return reviewState.level === "high" || String(row?.matchConfidence || "").toLowerCase() === "learned";
    });

    if (!rowsToApprove.length) {
      setSupplierInvoiceMessage("Nothing clean enough for auto approve yet. Fix the risky rows first.");
      return;
    }

    rowsToApprove.forEach((row: any) => {
      updateSupplierInvoiceRow(row.id, "selected", true);
      if (getInvoiceRowCogsType(row) === "food_cogs") {
        updateSupplierInvoiceRow(row.id, "status", "matched");
      }
    });

    setInvoiceReviewFilter("needs_fix");
    setInvoiceReviewSortKey("needs_fix_first");
    setSupplierInvoiceMessage(`Marked clean ${rowsToApprove.length} high-confidence row(s). Fix Only is showing what still needs attention.`);
  };

  const handleSafeLockInvoiceClick = () => {
    if (!invoiceCanLockSafely) {
      const blockers = [
        invoiceLockBlockingSummary.selectedRowsCount <= 0 ? "no selected rows" : null,
        invoiceLockBlockingSummary.unknownRowsCount > 0 ? `${invoiceLockBlockingSummary.unknownRowsCount} unknown row(s)` : null,
        invoiceLockBlockingSummary.unlinkedFoodRowsCount > 0 ? `${invoiceLockBlockingSummary.unlinkedFoodRowsCount} unlinked food row(s)` : null,
        invoiceLockBlockingSummary.missingNameRowsCount > 0 ? `${invoiceLockBlockingSummary.missingNameRowsCount} row(s) missing a name` : null,
        invoiceLockBlockingSummary.missingValueRowsCount > 0 ? `${invoiceLockBlockingSummary.missingValueRowsCount} row(s) missing a total` : null,
      ].filter(Boolean);

      setSupplierInvoiceMessage(`Lock blocked. Fix first: ${blockers.join(" · ")}.`);
      setInvoiceReviewFilter("needs_fix");
      setInvoiceReviewSortKey("needs_fix_first");
      return;
    }

    const confirmed = window.confirm(
      "Trial safety check: have you downloaded a venue backup before locking this real invoice? Click OK only if yes, or Cancel and back up first."
    );

    if (!confirmed) {
      setSupplierInvoiceMessage("Lock paused. Download a venue backup first, then come back and lock the clean invoice.");
      return;
    }

    handleLockInvoiceIntoStock();
  };

  return (
              <div id="supplier-invoice-import" style={styles.cardInset}>
                <div style={styles.sectionGroupHeaderRow}>
                  <div>
                    <h3 style={styles.sectionGroupTitle}>Invoice Fast Lane</h3>
                    <div style={styles.infoCardSubtext}>Scan the bill, fix the risky rows, then lock clean stock into the system.</div>
                  </div>
                </div>

                <div style={getInvoiceFlowStatusStyle()}>
                  <div style={styles.sectionGroupHeaderRow}>
                    <div>
                      <div style={styles.infoCardTitle}>Invoice Run Sheet</div>
                      <div style={styles.infoCardText}>{invoiceFlowSummary.statusLabel}</div>
                      <div style={styles.infoCardSubtext}>Scan it. Fix the troublemakers. Lock it clean.</div>
                    </div>
                  </div>
                  <div style={{ ...styles.formGrid, marginTop: 12 }}>
                    <div style={styles.infoCard}>
                      <div style={styles.infoCardTitle}>📸 Photo</div>
                      <div style={styles.infoCardText}>{invoiceFlowSummary.hasPhoto ? "Loaded" : "Not loaded"}</div>
                    </div>
                    <div style={styles.infoCard}>
                      <div style={styles.infoCardTitle}>📄 Rows Detected</div>
                      <div style={styles.infoCardText}>{invoiceFlowSummary.rowsDetected}</div>
                    </div>
                    <div style={styles.infoCard}>
                      <div style={styles.infoCardTitle}>⚠️ Needs Fix</div>
                      <div style={{ ...styles.infoCardText, color: invoiceFlowSummary.needsFixCount > 0 ? "#fecaca" : undefined }}>{invoiceFlowSummary.needsFixCount}</div>
                    </div>
                    <div style={styles.infoCard}>
                      <div style={styles.infoCardTitle}>✅ Ready Rows</div>
                      <div style={{ ...styles.infoCardText, color: invoiceFlowSummary.readyRowsCount > 0 ? "#bbf7d0" : undefined }}>{invoiceFlowSummary.readyRowsCount}</div>
                    </div>
                  </div>
                  <div style={{ ...styles.buttonRow, marginTop: 12 }}>
                    <button type="button" style={styles.primaryButton} onClick={() => invoiceCameraInputRef.current?.click()}>📷 Take Invoice Photo</button>
                    <button type="button" style={styles.secondaryButton} onClick={parseInvoiceForSelectedSupplier}>Scan Invoice</button>
                    {invoiceFlowSummary.rowsDetected > 0 ? (
                      <button type="button" style={styles.secondaryButton} onClick={scrollToInvoiceReviewPanel}>Jump To Fix Rows</button>
                    ) : null}
                  </div>
                </div>

                <div style={{ ...styles.infoCard, marginTop: 12, border: trialGuardrailSummary.isTrialReady ? "1px solid rgba(34, 197, 94, 0.42)" : "1px solid rgba(245, 158, 11, 0.42)", background: trialGuardrailSummary.isTrialReady ? "rgba(34, 197, 94, 0.08)" : "rgba(245, 158, 11, 0.08)" }}>
                  <div style={styles.sectionGroupHeaderRow}>
                    <div>
                      <div style={styles.infoCardTitle}>Level 8 Trial Guardrails</div>
                      <div style={styles.infoCardSubtext}>Use this as the kitchen trial checklist before any real invoice touches stock.</div>
                    </div>
                    <div style={trialGuardrailSummary.isTrialReady ? getInvoiceReviewBadgeStyle({ matchConfidence: "high", cogsCategory: "food_cogs", linkedIngredientId: "ready" }) : getInvoiceWeeklySpendBadgeStyle()}>
                      {trialGuardrailSummary.doneCount}/{trialGuardrailSummary.totalCount} checked
                    </div>
                  </div>
                  <div style={{ ...styles.formGrid, marginTop: 12 }}>
                    {trialGuardrailSummary.checklist.map((item: any) => (
                      <div key={item.key} style={getTrialChecklistItemStyle(item.done)}>
                        <div style={styles.infoCardTitle}>{item.done ? "✅" : "⚠️"} {item.label}</div>
                        <div style={styles.infoCardSubtext}>{item.helper}</div>
                      </div>
                    ))}
                  </div>
                  {!trialGuardrailSummary.hasInvoiceNumber ? (
                    <div style={{ ...styles.infoCardSubtext, marginTop: 10, color: "#fde68a" }}>
                      Invoice number is optional for build safety, but add it during trial so history is easy to trace.
                    </div>
                  ) : null}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Trial Notes</label>
                    <textarea
                      value={trialModeNotes}
                      onChange={(event: any) => setTrialModeNotes(event.target.value)}
                      style={styles.textarea}
                      placeholder="Write what went wrong, supplier quirks, missing rows, weird OCR reads, or what needs fixing after trial."
                    />
                  </div>
                </div>

                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Invoice Number</label>
                    <input
                      type="text"
                      value={invoiceIntakeMeta.invoiceNumber}
                      onChange={(event: any) => setInvoiceIntakeMeta((previous: any) => ({ ...previous, invoiceNumber: event.target.value }))}
                      style={styles.input}
                      placeholder="e.g. INV-10234"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Invoice Date</label>
                    <input
                      type="date"
                      value={invoiceIntakeMeta.invoiceDate}
                      onChange={(event: any) => setInvoiceIntakeMeta((previous: any) => ({ ...previous, invoiceDate: event.target.value }))}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Upload Text / CSV Export or Invoice Photo</label>
                  <input type="file" accept=".txt,.csv,text/plain,text/csv,image/*" onChange={(event: any) => handleSupplierInvoiceFileUpload(event.target.files?.[0] || null)} style={styles.input} />
                  <input
                    ref={invoiceCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={(event: any) => {
                      const file = event.target.files?.[0] || null;
                      handleSupplierInvoiceFileUpload(file);
                      event.target.value = "";
                    }}
                  />
                  <div style={styles.buttonRow}>
                    <button type="button" style={styles.secondaryButton} onClick={() => invoiceCameraInputRef.current?.click()}>
                      📷 Take Invoice Photo
                    </button>
                  </div>
                </div>

                {supplierInvoicePhotoName ? (
                  <div style={styles.infoCard}>
                    <div style={styles.infoCardTitle}>Photo uploaded</div>
                    <div style={styles.infoCardText}>{supplierInvoicePhotoName}</div>
                    {supplierInvoicePhotoPreviewUrl ? <img src={supplierInvoicePhotoPreviewUrl} alt="Uploaded invoice preview" style={{ width: "100%", maxWidth: 320, borderRadius: 12, marginTop: 10 }} /> : null}
                    <div style={styles.infoCardSubtext}>Scan the bill, fix the risky rows, then lock clean stock into the system.</div>
                  </div>
                ) : null}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Paste Invoice Text</label>
                  <textarea value={supplierInvoiceText} onChange={(event: any) => setSupplierInvoiceText(event.target.value)} style={styles.textarea} placeholder="Paste supplier invoice text here. Example: Tomato Polpa 2 x 5kg $38.50" />
                </div>

                <div style={styles.buttonRow}>
                  <button type="button" style={styles.primaryButton} onClick={parseInvoiceForSelectedSupplier}>Scan Invoice</button>
                  <button type="button" style={styles.secondaryButton} onClick={handleSaveInvoiceDraft}>Save Draft</button>
                  <button type="button" style={styles.secondaryButton} onClick={handleLoadInvoiceDraft}>Load Draft</button>
                  <button type="button" style={styles.secondaryButton} onClick={handleDeleteInvoiceDraft}>Delete Draft</button>
                  <button type="button" style={styles.secondaryButton} onClick={() => { setSupplierInvoiceText(""); setSupplierInvoiceRows([]); setSupplierInvoiceMessage(""); setInvoiceQualityWarning(""); setInvoiceFixingRowId(null); setInvoiceDraftMessage(""); setSupplierInvoicePhotoName(""); if (supplierInvoicePhotoPreviewUrl) { URL.revokeObjectURL(supplierInvoicePhotoPreviewUrl); setSupplierInvoicePhotoPreviewUrl(""); } }}>Clear Invoice</button>
                </div>

                {supplierInvoiceMessage ? <div style={styles.infoCardText}>{supplierInvoiceMessage}</div> : null}
                {invoiceQualityWarning ? <div style={{ ...styles.infoCardText, color: "#fef08a" }}>⚠️ {invoiceQualityWarning}</div> : null}
                {invoiceDraftMessage ? <div style={styles.infoCardText}>{invoiceDraftMessage}</div> : null}
                {invoiceDraft ? <div style={styles.infoCardSubtext}>Draft status: {String(invoiceDraft.status || "draft")} · Saved: {String(invoiceDraft.updatedAt || invoiceDraft.createdAt || "")}</div> : null}

                {invoiceLockSuccessReport ? (
                  <div style={{ ...styles.infoCard, border: "1px solid rgba(34, 197, 94, 0.45)", background: "rgba(34, 197, 94, 0.10)" }}>
                    <div style={styles.infoCardTitle}>✅ Invoice Lock Success Report</div>
                    <div style={styles.infoCardSubtext}>Clean commit summary. Food, consumables, and non-COGS were separated before posting.</div>
                    <div style={{ ...styles.infoCard, marginTop: 10, border: "1px solid rgba(96, 165, 250, 0.42)", background: "rgba(59, 130, 246, 0.10)" }}>
                      <div style={styles.infoCardTitle}>🛟 Trial Backup Reminder</div>
                      <div style={styles.infoCardSubtext}>Invoice is locked. Download a fresh venue backup from Main Hideout Control before doing another risky action.</div>
                    </div>
                    <div style={{ ...styles.formGrid, marginTop: 12 }}>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Invoice</div>
                        <div style={styles.infoCardText}>{String(invoiceLockSuccessReport.invoiceNumber || "No invoice #")}</div>
                        <div style={styles.infoCardSubtext}>{String(invoiceLockSuccessReport.supplierName || "Unknown supplier")}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Lock Date</div>
                        <div style={styles.infoCardText}>{String(invoiceLockSuccessReport.lockDate || "").slice(0, 10)}</div>
                        <div style={styles.infoCardSubtext}>Invoice date: {String(invoiceLockSuccessReport.invoiceDate || "")}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Selected Rows</div>
                        <div style={styles.infoCardText}>{Number(invoiceLockSuccessReport.selectedRowCount || 0)}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Stock Movements</div>
                        <div style={styles.infoCardText}>{Number(invoiceLockSuccessReport.stockMovementsCreatedCount || 0)}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Food COGS</div>
                        <div style={styles.infoCardText}>{formatCurrency(invoiceLockSuccessReport.foodCogsTotal || 0)}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Consumables</div>
                        <div style={styles.infoCardText}>{formatCurrency(invoiceLockSuccessReport.consumablesTotal || 0)}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Non-COGS</div>
                        <div style={styles.infoCardText}>{formatCurrency(invoiceLockSuccessReport.nonCogsTotal || 0)}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Unknown</div>
                        <div style={styles.infoCardText}>{formatCurrency(invoiceLockSuccessReport.unknownTotal || 0)}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Matched Food Rows</div>
                        <div style={styles.infoCardText}>{Number(invoiceLockSuccessReport.matchedFoodRows || 0)}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Create-New Food Rows</div>
                        <div style={styles.infoCardText}>{Number(invoiceLockSuccessReport.createNewFoodRows || 0)}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Ignored Rows</div>
                        <div style={styles.infoCardText}>{Number(invoiceLockSuccessReport.ignoredRows || 0)}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div style={styles.infoCard}>
                  <div style={styles.infoCardTitle}>Weekly Spend Intelligence</div>
                  <div style={{ ...styles.buttonRow, alignItems: "center" }}>
                    <span style={getInvoiceWeeklySpendBadgeStyle()}>{invoiceWeeklySpendInsight.label}</span>
                    <span style={styles.infoCardSubtext}>Change: {formatCurrency(invoiceWeeklySpendInsight.weeklyChange)}</span>
                  </div>
                  <div style={{ ...styles.formGrid, marginTop: 12 }}>
                    <div style={styles.infoCard}>
                      <div style={styles.infoCardTitle}>This Week</div>
                      <div style={styles.infoCardText}>{formatCurrency(invoiceWeeklySpendInsight.thisWeekSpend)}</div>
                    </div>
                    <div style={styles.infoCard}>
                      <div style={styles.infoCardTitle}>Last Week</div>
                      <div style={styles.infoCardText}>{formatCurrency(invoiceWeeklySpendInsight.lastWeekSpend)}</div>
                    </div>
                    <div style={styles.infoCard}>
                      <div style={styles.infoCardTitle}>Change %</div>
                      <div style={styles.infoCardText}>{Math.round(invoiceWeeklySpendInsight.percentChange)}%</div>
                    </div>
                  </div>
                  <div style={styles.infoCardSubtext}>Based on invoice spend records already tracked in GP Police.</div>
                </div>

                <div style={styles.infoCard}>
                  <div style={styles.infoCardTitle}>Weekly GP Damage Tracking</div>
                  <div style={{ ...styles.buttonRow, alignItems: "center" }}>
                    <span style={getWeeklyDamageBadgeStyle()}>{weeklyDamageSummary.label}</span>
                    <span style={styles.infoCardSubtext}>Change: {Math.round(weeklyDamageSummary.percentChange)}%</span>
                  </div>
                  <div style={{ ...styles.formGrid, marginTop: 12 }}>
                    <div style={styles.infoCard}>
                      <div style={styles.infoCardTitle}>This Week Damage</div>
                      <div style={styles.infoCardText}>{formatCurrency(weeklyDamageSummary.thisWeekTotal)}</div>
                    </div>
                    <div style={styles.infoCard}>
                      <div style={styles.infoCardTitle}>Last Week Damage</div>
                      <div style={styles.infoCardText}>{formatCurrency(weeklyDamageSummary.lastWeekTotal)}</div>
                    </div>
                    <div style={styles.infoCard}>
                      <div style={styles.infoCardTitle}>Trend</div>
                      <div style={styles.infoCardText}>{weeklyDamageSummary.label}</div>
                    </div>
                  </div>
                  <div style={styles.infoCardSubtext}>Based on damage snapshots saved when invoices are locked.</div>
                </div>

                {Array.isArray(lockedInvoiceHistory) && lockedInvoiceHistory.length > 0 ? (
                  <div style={styles.infoCard}>
                    <div style={styles.infoCardTitle}>Locked Invoice History</div>
                    {(Array.isArray(lockedInvoiceHistory) ? lockedInvoiceHistory : []).slice(0, 5).map((invoice: any) => {
                      const lockedCogsTotals = getLockedInvoiceCogsTotals(invoice);

                      return (
                        <details key={invoice.id} style={{ marginTop: 8 }}>
                          <summary style={styles.infoCardText}>{invoice.date} · {invoice.supplierName} · {invoice.invoiceNumber || "No invoice #"} · {formatCurrency(invoice.totalCost)} · {invoice.rowCount || invoice.rows?.length || 0} rows</summary>
                          <div style={{ ...styles.formGrid, marginTop: 8 }}>
                            <div style={styles.infoCard}>
                              <div style={styles.infoCardTitle}>Food COGS</div>
                              <div style={styles.infoCardText}>{formatCurrency(lockedCogsTotals.food)}</div>
                            </div>
                            <div style={styles.infoCard}>
                              <div style={styles.infoCardTitle}>Kitchen Consumables</div>
                              <div style={styles.infoCardText}>{formatCurrency(lockedCogsTotals.consumable)}</div>
                            </div>
                            <div style={styles.infoCard}>
                              <div style={styles.infoCardTitle}>Unknown / Needs Review</div>
                              <div style={styles.infoCardText}>{formatCurrency(lockedCogsTotals.unknown)}</div>
                            </div>
                          </div>
                          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                            {(invoice.rows || []).slice(0, 12).map((row: any) => (
                              <div key={row.id} style={styles.infoCardSubtext}>{row.name} · {row.qty} {row.unit} · {formatCurrency(row.lineTotal)}{row.rawLine ? ` · raw: ${row.rawLine}` : ""}</div>
                            ))}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                ) : null}

                {Array.isArray(supplierInvoiceRows) && supplierInvoiceRows.length > 0 ? (
                  <div style={styles.infoCard}>
                    <div style={styles.infoCardText}>Invoice Lock Status: {invoiceLockSummary.isLocked ? "Locked Into Stock" : "Draft"}</div>
                    <div style={styles.infoCardSubtext}>
                      Selected: {invoiceLockSummary.selectedCount} · Matched: {invoiceLockSummary.matchedCount} · Create new: {invoiceLockSummary.createNewCount} · Ignored: {invoiceLockSummary.ignoredCount} · Needs attention: {invoiceLockSummary.needsAttentionCount} · Total: {formatCurrency(invoiceLockSummary.estimatedTotal)}
                    </div>
                    <div style={{ ...styles.formGrid, marginTop: 12 }}>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Food COGS</div>
                        <div style={styles.infoCardText}>{formatCurrency(invoiceCogsCategoryTotals.food)}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Kitchen Consumables</div>
                        <div style={styles.infoCardText}>{formatCurrency(invoiceCogsCategoryTotals.consumable)}</div>
                      </div>
                      <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>Unknown / Needs Review</div>
                        <div style={styles.infoCardText}>{formatCurrency(invoiceCogsCategoryTotals.unknown)}</div>
                      </div>
                    </div>
                    <div style={{ ...styles.infoCard, marginTop: 12 }}>
                      <div style={styles.infoCardTitle}>Final Lock Check</div>
                      <div style={styles.infoCardSubtext}>Last check before the numbers hit stock and GP.</div>
                      <div style={{ ...styles.formGrid, marginTop: 12 }}>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Selected Rows</div>
                          <div style={styles.infoCardText}>{invoicePreflightSummary.selectedRowCount}</div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Food Rows</div>
                          <div style={styles.infoCardText}>{invoicePreflightSummary.foodRowsCount}</div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Consumable Rows</div>
                          <div style={styles.infoCardText}>{invoicePreflightSummary.consumableRowsCount}</div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Unknown Rows</div>
                          <div style={styles.infoCardText}>{invoicePreflightSummary.unknownRowsCount}</div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Linked</div>
                          <div style={styles.infoCardText}>{invoicePreflightSummary.linkedIngredientCount}</div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Not Linked</div>
                          <div style={styles.infoCardText}>{invoicePreflightSummary.notLinkedCount}</div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Create New</div>
                          <div style={styles.infoCardText}>{invoicePreflightSummary.createNewCount}</div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Food COGS Total</div>
                          <div style={styles.infoCardText}>{formatCurrency(invoicePreflightSummary.estimatedFoodCogsTotal)}</div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Consumables Total</div>
                          <div style={styles.infoCardText}>{formatCurrency(invoicePreflightSummary.estimatedConsumablesTotal)}</div>
                        </div>
                      </div>
                      {invoicePreflightSummary.unknownRowsCount > 0 ? (
                        <div style={{ ...styles.infoCardText, color: "#fca5a5", marginTop: 10 }}>
                          ⚠️ We don’t know what some rows are — fix them before locking.
                        </div>
                      ) : null}
                      {invoicePreflightSummary.unlinkedFoodRowsCount > 0 ? (
                        <div style={{ ...styles.infoCardText, color: "#fca5a5", marginTop: 6 }}>
                          ⚠️ Food rows are not linked — link them or mark Create New.
                        </div>
                      ) : null}
                      {!invoiceCanLockSafely ? (
                        <div style={{ ...styles.infoCard, marginTop: 12, border: "1px solid rgba(248, 113, 113, 0.45)", background: "rgba(127, 29, 29, 0.14)" }}>
                          <div style={{ ...styles.infoCardTitle, color: "#fecaca" }}>🚧 Not Clean Yet</div>
                          <div style={styles.infoCardSubtext}>Fix the blockers before this invoice can touch stock.</div>
                          <div style={{ ...styles.infoCardSubtext, marginTop: 8 }}>
                            Unknown: {invoiceLockBlockingSummary.unknownRowsCount} · Unlinked food: {invoiceLockBlockingSummary.unlinkedFoodRowsCount} · Missing names: {invoiceLockBlockingSummary.missingNameRowsCount} · Missing totals: {invoiceLockBlockingSummary.missingValueRowsCount}
                          </div>
                        </div>
                      ) : (
                        <div style={{ ...styles.infoCard, marginTop: 12, border: "1px solid rgba(34, 197, 94, 0.45)", background: "rgba(34, 197, 94, 0.10)" }}>
                          <div style={{ ...styles.infoCardTitle, color: "#bbf7d0" }}>✅ Clean To Lock</div>
                          <div style={styles.infoCardSubtext}>Rows are named, valued, categorised, and ready for stock.</div>
                        </div>
                      )}
                    </div>

                    <div style={styles.buttonRow}>
                      <button type="button" style={invoiceCanLockSafely ? styles.primaryButton : styles.secondaryButton} onClick={handleSafeLockInvoiceClick} disabled={invoiceLockSummary.isLocked}>
                        {invoiceLockSummary.isLocked ? "Invoice Already Locked" : invoiceFlowSummary.lockLabel}
                      </button>
                      {!invoiceCanLockSafely ? (
                        <button type="button" style={styles.secondaryButton} onClick={showOnlyInvoiceRowsNeedingFix}>Show Fix Only</button>
                      ) : null}
                      <button type="button" style={styles.secondaryButton} onClick={autoApproveHighConfidenceInvoiceRows}>Auto Approve High Confidence</button>
                    </div>
                  </div>
                ) : null}

                {Array.isArray(supplierInvoiceRows) && supplierInvoiceRows.length > 0 ? (
                  <div ref={invoiceReviewPanelRef} style={styles.cardInset}>
                    <h3 style={styles.sectionGroupTitle}>Fix & Review Lines</h3>
                    <div style={styles.infoCardSubtext}>Only risky rows should slow you down. Clean rows can move fast.</div>
                    <div style={{ ...styles.infoCard, marginTop: 10, border: "1px solid rgba(245, 158, 11, 0.36)", background: "rgba(245, 158, 11, 0.08)" }}>
                      <div style={styles.infoCardTitle}>Trouble Spots</div>
                      <div style={{ ...styles.formGrid, marginTop: 10 }}>
                        <button type="button" style={warningActionCardStyle} onClick={() => jumpToInvoiceProblemFilter("unknown", "unknown_first")}>
                          <div style={styles.infoCardTitle}>Unknown Rows</div>
                          <div style={{ ...styles.infoCardText, color: invoiceReviewWarningSummary.unknownRowsCount > 0 ? "#fde68a" : undefined }}>
                            {invoiceReviewWarningSummary.unknownRowsCount}
                          </div>
                          <div style={styles.infoCardSubtext}>Tap to show only unknown rows.</div>
                        </button>
                        <button type="button" style={warningActionCardStyle} onClick={() => jumpToInvoiceProblemFilter("unmatched_food", "needs_fix_first")}>
                          <div style={styles.infoCardTitle}>Unmatched Food</div>
                          <div style={{ ...styles.infoCardText, color: invoiceReviewWarningSummary.unmatchedFoodCount > 0 ? "#fecaca" : undefined }}>
                            {invoiceReviewWarningSummary.unmatchedFoodCount}
                          </div>
                          <div style={styles.infoCardSubtext}>Tap to link or create food rows.</div>
                        </button>
                        <button type="button" style={warningActionCardStyle} onClick={() => jumpToInvoiceProblemFilter("price_warnings", "price_warnings_first")}>
                          <div style={styles.infoCardTitle}>Price Warnings</div>
                          <div style={{ ...styles.infoCardText, color: invoiceReviewWarningSummary.priceWarningCount > 0 ? "#fca5a5" : undefined }}>
                            {invoiceReviewWarningSummary.priceWarningCount}
                          </div>
                          <div style={styles.infoCardSubtext}>Tap to check price spikes.</div>
                        </button>
                      </div>
                      <div style={{ ...styles.buttonRow, marginTop: 10 }}>
                        <button type="button" style={styles.primaryButton} onClick={showOnlyInvoiceRowsNeedingFix}>Fix Next Problem</button>
                        <button type="button" style={styles.secondaryButton} onClick={() => jumpToInvoiceProblemFilter("all", "needs_fix_first")}>Show All Review Rows</button>
                      </div>
                      <div style={styles.infoCardSubtext}>Tap a warning card to jump straight to the problem instead of scrolling through the whole invoice.</div>
                    </div>

                    <div style={{ ...styles.infoCard, marginTop: 10, border: "1px solid rgba(34, 197, 94, 0.28)", background: "rgba(34, 197, 94, 0.07)" }}>
                      <div style={styles.infoCardTitle}>Lock Readiness</div>
                      <div style={{ ...styles.formGrid, marginTop: 10 }}>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Ready Rows</div>
                          <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.readyRowsCount > 0 ? "#bbf7d0" : undefined }}>
                            {invoiceReviewReadinessSummary.readyRowsCount}
                          </div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Needs Fix</div>
                          <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.needsFixRowsCount > 0 ? "#fecaca" : undefined }}>
                            {invoiceReviewReadinessSummary.needsFixRowsCount}
                          </div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Unknown</div>
                          <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.unknownRowsCount > 0 ? "#fde68a" : undefined }}>
                            {invoiceReviewReadinessSummary.unknownRowsCount}
                          </div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Unmatched Food</div>
                          <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.unmatchedFoodCount > 0 ? "#fecaca" : undefined }}>
                            {invoiceReviewReadinessSummary.unmatchedFoodCount}
                          </div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Price Warnings</div>
                          <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.priceWarningCount > 0 ? "#fca5a5" : undefined }}>
                            {invoiceReviewReadinessSummary.priceWarningCount}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        ...styles.infoCard,
                        marginTop: 10,
                        border: invoiceSafeToLockTone === "safe" ? "1px solid rgba(34, 197, 94, 0.42)" : "1px solid rgba(245, 158, 11, 0.44)",
                        background: invoiceSafeToLockTone === "safe" ? "rgba(34, 197, 94, 0.10)" : "rgba(245, 158, 11, 0.10)",
                      }}
                    >
                      <div style={styles.infoCardTitle}>{invoiceSafeToLockTone === "safe" ? "✅ Safe To Lock Check" : "⚠️ Lock Review Needed"}</div>
                      <div style={styles.infoCardSubtext}>Stage 3 helper. Dirty rows are blocked before commit.</div>
                      <div style={styles.infoCardText}>
                        {invoiceSafeToLockTone === "safe"
                          ? "No unknown rows or unmatched food rows found. Still check price warnings before locking."
                          : `Review needed: ${invoiceReviewReadinessSummary.unknownRowsCount} unknown row(s), ${invoiceReviewReadinessSummary.unmatchedFoodCount} unmatched food row(s).`}
                      </div>
                    </div>

                    <div style={{ ...styles.infoCard, marginTop: 10 }}>
                      <div style={styles.infoCardTitle}>Quick Review Checklist</div>
                      <div style={styles.infoCardText}>✅ Scan rows parsed: {(Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).length}</div>
                      <div style={styles.infoCardText}>{invoiceReviewReadinessSummary.unknownRowsCount === 0 ? "✅" : "⚠️"} Review unknown rows</div>
                      <div style={styles.infoCardText}>{invoiceReviewReadinessSummary.unmatchedFoodCount === 0 ? "✅" : "⚠️"} Link unmatched food rows</div>
                      <div style={styles.infoCardText}>{invoiceReviewReadinessSummary.priceWarningCount === 0 ? "✅" : "⚠️"} Check price warnings</div>
                      <div style={styles.infoCardText}>🚔 Lock invoice only after review</div>
                    </div>
                    <div style={{ ...styles.buttonRow, position: "sticky", top: 0, zIndex: 5, background: "rgba(10, 10, 12, 0.94)", padding: "10px 0" }}>
                      <button type="button" style={styles.secondaryButton} onClick={() => setAllSupplierInvoiceRowsSelected(true)}>Select All</button>
                      <button type="button" style={styles.secondaryButton} onClick={() => setAllSupplierInvoiceRowsSelected(false)}>Deselect All</button>
                      <div style={styles.infoCardSubtext}>Selected rows: {invoiceLockSummary.selectedCount} · Total: {formatCurrency(invoiceLockSummary.estimatedTotal)}</div>
                      <div style={styles.infoCardSubtext}>Food: {formatCurrency(invoiceCogsCategoryTotals.food)} · Consumables: {formatCurrency(invoiceCogsCategoryTotals.consumable)} · Unknown: {formatCurrency(invoiceCogsCategoryTotals.unknown)}</div>
                      <button type="button" style={invoiceReviewMode === "normal" ? styles.primaryButton : styles.secondaryButton} onClick={() => setInvoiceReviewMode("normal")}>Normal View</button>
                      <button type="button" style={invoiceReviewMode === "compact" ? styles.primaryButton : styles.secondaryButton} onClick={() => setInvoiceReviewMode("compact")}>Compact View</button>
                      <button type="button" style={showInvoiceMatchDebug ? styles.primaryButton : styles.secondaryButton} onClick={() => setShowInvoiceMatchDebug((previous) => !previous)}>
                        {showInvoiceMatchDebug ? "Hide Match Debug" : "Show Match Debug"}
                      </button>
                    </div>
                    <div style={{ ...styles.infoCard, marginTop: 10 }}>
                      <label style={styles.label}>Search invoice rows</label>
                      <input
                        type="text"
                        value={invoiceReviewSearchTerm}
                        onChange={(event: any) => setInvoiceReviewSearchTerm(event.target.value)}
                        style={styles.input}
                        placeholder="Search item name, code, raw OCR line, COGS category, or matched ingredient"
                      />
                      <div style={styles.infoCardSubtext}>Showing {displayedSupplierInvoiceRows.length} of {(Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).length} invoice rows.</div>
                    </div>
                    <div style={{ ...styles.formGroup, marginTop: 10 }}>
                      <label style={styles.label}>Sort invoice rows</label>
                      <select
                        value={invoiceReviewSortKey}
                        onChange={(event: any) => setInvoiceReviewSortKey(event.target.value)}
                        style={styles.input}
                      >
                        {invoiceReviewSortOptions.map((option: any) => (
                          <option key={option.key} value={option.key}>{option.label}</option>
                        ))}
                      </select>
                      <div style={styles.infoCardSubtext}>Sorting only changes the display order. It does not alter invoice row data or lock behaviour.</div>
                    </div>
                    <div style={{ ...styles.infoCard, marginTop: 10 }}>
                      <div style={styles.infoCardTitle}>Review Controls</div>
                      <div style={styles.infoCardSubtext}>Bulk actions only affect the currently displayed rows after search, filter, and sort.</div>
                      <div style={{ ...styles.formGrid, marginTop: 12 }}>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Total Rows</div>
                          <div style={styles.infoCardText}>{invoiceReviewVisibilitySummary.totalRows}</div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Displayed</div>
                          <div style={styles.infoCardText}>{invoiceReviewVisibilitySummary.displayedRows}</div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Selected Displayed</div>
                          <div style={styles.infoCardText}>{invoiceReviewVisibilitySummary.selectedDisplayedRows}</div>
                        </div>
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>Hidden Rows</div>
                          <div style={styles.infoCardText}>{invoiceReviewVisibilitySummary.hiddenRows}</div>
                        </div>
                      </div>
                      <div style={{ ...styles.buttonRow, marginTop: 12 }}>
                        <button type="button" style={styles.secondaryButton} onClick={() => updateDisplayedInvoiceRowsSelected(true)}>Select Displayed</button>
                        <button type="button" style={styles.secondaryButton} onClick={() => updateDisplayedInvoiceRowsSelected(false)}>Deselect Displayed</button>
                        <button type="button" style={styles.primaryButton} onClick={autoApproveHighConfidenceInvoiceRows}>Auto Approve High Confidence</button>
                        <button type="button" style={styles.secondaryButton} onClick={showOnlyInvoiceRowsNeedingFix}>Show Fix Only</button>
                        <button type="button" style={styles.secondaryButton} onClick={() => markDisplayedInvoiceRowsCogsCategory("unknown")}>Mark Displayed Unknown</button>
                        <button type="button" style={styles.secondaryButton} onClick={() => markDisplayedInvoiceRowsCogsCategory("consumable_cogs")}>Mark Displayed Consumable</button>
                        <button type="button" style={styles.secondaryButton} onClick={() => markDisplayedInvoiceRowsCogsCategory("non_cogs")}>Mark Displayed Non-COGS</button>
                      </div>
                      <div style={{ ...styles.buttonRow, marginTop: 10 }}>
                        <button type="button" style={styles.secondaryButton} onClick={() => resetInvoiceReviewControls("search")}>Clear Search</button>
                        <button type="button" style={styles.secondaryButton} onClick={() => resetInvoiceReviewControls("filter")}>Reset Filter</button>
                        <button type="button" style={styles.secondaryButton} onClick={() => resetInvoiceReviewControls("sort")}>Reset Sort</button>
                      </div>
                    </div>
                    <div style={{ ...styles.buttonRow, marginTop: 10, alignItems: "center" }}>
                      <div style={styles.infoCardSubtext}>Filter rows:</div>
                      {invoiceReviewFilterOptions.map((option: any) => (
                        <button
                          key={option.key}
                          type="button"
                          style={invoiceReviewFilter === option.key ? styles.primaryButton : styles.secondaryButton}
                          onClick={() => setInvoiceReviewFilter(option.key)}
                        >
                          {option.label} ({getInvoiceReviewFilterCount(option.key)})
                        </button>
                      ))}
                      <div style={styles.infoCardSubtext}>Showing {displayedSupplierInvoiceRows.length} of {(Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).length}</div>
                    </div>
                    {invoiceGpDamageSummary.totalDamage > 0 ? (
                      <div style={{ ...styles.infoCard, marginTop: 12, border: "1px solid rgba(248, 113, 113, 0.42)", background: "rgba(127, 29, 29, 0.16)" }}>
                        <div style={styles.infoCardTitle}>💀 GP Damage Report</div>
                        <div style={styles.infoCardSubtext}>Potential supplier price damage from matched invoice rows. Display only — no prices or stock are changed.</div>
                        <div style={{ ...styles.formGrid, marginTop: 12 }}>
                          <div style={{ ...styles.infoCard, border: "1px solid rgba(248, 113, 113, 0.42)", background: "rgba(248, 113, 113, 0.10)" }}>
                            <div style={styles.infoCardTitle}>Margin Killers</div>
                            <div style={{ ...styles.infoCardText, color: "#fca5a5" }}>{formatCurrency(invoiceGpDamageSummary.marginKillerTotal)}</div>
                            <div style={styles.infoCardSubtext}>{invoiceGpDamageSummary.marginKillerCount} row(s) at +25% or more</div>
                          </div>
                          <div style={{ ...styles.infoCard, border: "1px solid rgba(251, 146, 60, 0.42)", background: "rgba(251, 146, 60, 0.10)" }}>
                            <div style={styles.infoCardTitle}>Price Spikes</div>
                            <div style={{ ...styles.infoCardText, color: "#fed7aa" }}>{formatCurrency(invoiceGpDamageSummary.priceSpikeTotal)}</div>
                            <div style={styles.infoCardSubtext}>{invoiceGpDamageSummary.priceSpikeCount} row(s) at +15% or more</div>
                          </div>
                          <div style={{ ...styles.infoCard, border: "1px solid rgba(245, 158, 11, 0.42)", background: "rgba(245, 158, 11, 0.10)" }}>
                            <div style={styles.infoCardTitle}>Price Rises</div>
                            <div style={{ ...styles.infoCardText, color: "#fde68a" }}>{formatCurrency(invoiceGpDamageSummary.priceRiseTotal)}</div>
                            <div style={styles.infoCardSubtext}>{invoiceGpDamageSummary.priceRiseCount} row(s) at +8% or more</div>
                          </div>
                          <div style={{ ...styles.infoCard, border: "1px solid rgba(248, 113, 113, 0.55)", background: "rgba(248, 113, 113, 0.14)" }}>
                            <div style={styles.infoCardTitle}>Total Potential Damage</div>
                            <div style={{ ...styles.infoCardText, color: "#fecaca", fontWeight: 900 }}>{formatCurrency(invoiceGpDamageSummary.totalDamage)}</div>
                            <div style={styles.infoCardSubtext}>Sum of flagged invoice line totals</div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                      {displayedSupplierInvoiceRows.length === 0 ? (
                        <div style={styles.infoCard}>
                          <div style={styles.infoCardTitle}>No rows match this search/filter</div>
                          <div style={styles.infoCardSubtext}>Clear the search, reset the filter, or change the sort controls to see more invoice lines. No data has been changed.</div>
                        </div>
                      ) : null}
                      {displayedSupplierInvoiceRows.map((row: any) => {
                        const reviewState = getInvoiceRowReviewState(row);
                        const isLinked = !!String(row?.linkedIngredientId || "").trim();
                        const priceUpdateSuggestion = getInvoicePriceUpdateSuggestion(row);
                        const isCompactReviewMode = invoiceReviewMode === "compact";
                        const isFixPanelOpen = invoiceFixingRowId === row.id;
                        const canLearnSupplierMatch = Boolean(String(row?.linkedIngredientId || "").trim()) && Boolean(String(row?.supplierMatchKey || "").trim());
                        const supplierMatchLearningSaved = Boolean(savedSupplierMatchRows[String(row?.id || row?.supplierMatchKey || "")]);

                        return (
                          <div key={row.id} style={getInvoiceRowReviewCardStyle(row)}>
                            <div style={{ ...styles.buttonRow, alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                <span style={getInvoiceReviewBadgeStyle(row)}>{reviewState.label}</span>
                                <span style={getInvoiceCogsCategoryBadgeStyle(row)}>{getInvoiceCogsCategoryLabel(row)}</span>
                                <span style={getInvoiceMatchBadgeStyle(row)}>{isLinked ? "Matched" : "Not Linked"}</span>
                                {String(row?.matchConfidence || "").toLowerCase() === "learned" ? (
                                  <span style={getInvoiceMatchConfidenceBadgeStyle(row)}>🧠 Learned match</span>
                                ) : null}
                                {supplierMatchLearningSaved ? (
                                  <span style={styles.infoCardSubtext}>Saved for next invoices</span>
                                ) : null}
                              </div>
                              {!isCompactReviewMode ? (
                                <span style={styles.infoCardSubtext}>{reviewState.helper}</span>
                              ) : null}
                            </div>
                            {!isCompactReviewMode ? (
                              <div style={styles.infoCardSubtext}>Raw line: {String(row.rawLine || "")}</div>
                            ) : null}
                            <div style={{ ...styles.buttonRow, alignItems: "center" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {!isCompactReviewMode ? (
                                  <span style={styles.infoCardSubtext}>{getInvoiceCogsCategoryHelpText(row)}</span>
                                ) : null}
                              {getInvoiceRowDamageFlags(row).map((flag: string, index: number) => (
                                <span
                                  key={`${row.id}_damage_flag_${index}`}
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: flag.includes("💀") || flag.includes("🚨") ? "#fca5a5" : "#fde68a",
                                  }}
                                >
                                  {flag}
                                </span>
                              ))}
                              {priceUpdateSuggestion ? (
                                <div style={{
                                  border: "1px solid rgba(245, 158, 11, 0.35)",
                                  background: "rgba(245, 158, 11, 0.10)",
                                  borderRadius: 12,
                                  padding: "8px 10px",
                                  marginTop: 4,
                                }}>
                                  <div style={{ ...styles.infoCardText, color: "#fde68a", fontWeight: 900 }}>
                                    Price update suggested
                                  </div>
                                  <div style={styles.infoCardSubtext}>
                                    Current ingredient price: {formatCurrency(priceUpdateSuggestion.currentIngredientPrice || 0)} · Invoice price: {formatCurrency(priceUpdateSuggestion.invoicePrice || 0)} · Increase: {Math.round(priceUpdateSuggestion.percentIncrease || 0)}%
                                  </div>
                                  <button
                                    type="button"
                                    style={{ ...styles.secondaryButton, marginTop: 8 }}
                                    onClick={() => handleUpdateIngredientPriceFromInvoiceRow(row)}
                                  >
                                    Update Ingredient Price
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div style={styles.buttonRow}>
                            <button type="button" style={row.status === "matched" ? styles.primaryButton : styles.secondaryButton} onClick={() => setSupplierInvoiceRowStatus(row.id, "matched")}>Matched</button>
                            <button type="button" style={row.status === "create_new" ? styles.primaryButton : styles.secondaryButton} onClick={() => setSupplierInvoiceRowStatus(row.id, "create_new")}>Create New</button>
                            <button type="button" style={row.status === "ignore" ? styles.primaryButton : styles.secondaryButton} onClick={() => setSupplierInvoiceRowStatus(row.id, "ignore")}>Ignore Line</button>
                            {canLearnSupplierMatch ? (
                              <button type="button" style={supplierMatchLearningSaved ? styles.primaryButton : styles.secondaryButton} onClick={() => handleLearnSupplierMatchFromRow(row)}>
                                {supplierMatchLearningSaved ? "Saved ✓" : "Learn Match"}
                              </button>
                            ) : null}
                            <button type="button" style={isFixPanelOpen ? styles.primaryButton : styles.secondaryButton} onClick={() => setInvoiceFixingRowId(isFixPanelOpen ? null : row.id)}>{isFixPanelOpen ? "Close Fix Panel" : "Expand Fix Panel"}</button>
                          </div>
                          {isFixPanelOpen ? (
                            <div style={{ ...styles.infoCard, border: "1px solid rgba(245, 158, 11, 0.42)", background: "rgba(245, 158, 11, 0.08)" }}>
                              <div style={styles.infoCardTitle}>Fix Panel Open — Selected Row Only</div>
                              <div style={styles.infoCardSubtext}>Edit the OCR and pack details for this row. Other rows stay closed.</div>
                              <label style={styles.label}>Raw OCR Line</label>
                              <textarea value={row.rawLine || ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "rawLine", event.target.value)} style={styles.textarea} />
                              <div style={styles.formGrid}>
                                <div style={styles.formGroup}><label style={styles.label}>Amount In Pack</label><input value={row.amountInPurchaseUnit || "1"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "amountInPurchaseUnit", event.target.value)} style={styles.input} /></div>
                                <div style={styles.formGroup}><label style={styles.label}>Size Per Item</label><input value={row.sizePerItem || "1"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "sizePerItem", event.target.value)} style={styles.input} /></div>
                                <div style={styles.formGroup}><label style={styles.label}>Size Unit</label><select value={row.sizeUnit || "each"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "sizeUnit", event.target.value)} style={styles.input}>{sizeUnitOptions.map((unit: string) => <option key={unit} value={unit}>{unit}</option>)}</select></div>
                              </div>
                            </div>
                          ) : null}
                          <div style={styles.buttonRow}>
                            <span style={getInvoiceStatusBadgeStyle(row)}>{getInvoiceStatusLabel(row)}</span>
                            {!isCompactReviewMode ? (
                              <span style={getInvoiceConfidenceBadgeStyle(row.confidence || "low")}>{String(row.confidence || "low").toUpperCase()}</span>
                            ) : null}
                            <span style={getInvoiceMatchBadgeStyle(row)}>{getInvoiceMatchLabel(row)}</span>
                            {!isCompactReviewMode && getInvoiceRowCogsType(row) === "food_cogs" ? (
                              <span style={getInvoiceMatchConfidenceBadgeStyle(row)}>Match {String(row.matchConfidence || "low")}</span>
                            ) : null}
                          </div>
                          {showInvoiceMatchDebug ? (
                            <div
                              style={{
                                ...styles.infoCard,
                                marginTop: 10,
                                border: "1px dashed rgba(59, 130, 246, 0.45)",
                                background: "rgba(59, 130, 246, 0.08)",
                              }}
                            >
                              <div style={styles.infoCardTitle}>Match Debug</div>
                              <div style={styles.infoCardSubtext}>Read-only. Shows why this row did or did not match after parsing.</div>
                              <div style={{ ...styles.formGrid, marginTop: 10 }}>
                                <div style={styles.formGroup}>
                                  <label style={styles.label}>Cleaned Invoice Row Name</label>
                                  <input value={getInvoiceDebugCleanName(row)} readOnly style={styles.input} />
                                </div>
                                <div style={styles.formGroup}>
                                  <label style={styles.label}>Matched Ingredient Name</label>
                                  <input value={String(row?.matchedIngredientName || "No matched ingredient")} readOnly style={styles.input} />
                                </div>
                                <div style={styles.formGroup}>
                                  <label style={styles.label}>Match Confidence</label>
                                  <input value={String(row?.matchConfidence || "low")} readOnly style={styles.input} />
                                </div>
                                <div style={styles.formGroup}>
                                  <label style={styles.label}>Linked Ingredient ID</label>
                                  <input value={String(row?.linkedIngredientId || "Not linked")} readOnly style={styles.input} />
                                </div>
                                <div style={styles.formGroup}>
                                  <label style={styles.label}>Status</label>
                                  <input value={String(row?.status || "needs_match")} readOnly style={styles.input} />
                                </div>
                                <div style={styles.formGroup}>
                                  <label style={styles.label}>COGS Type / Category</label>
                                  <input value={`${getInvoiceRowCogsType(row)} / ${String(row?.cogsCategory || row?.category || "unknown")}`} readOnly style={styles.input} />
                                </div>
                              </div>
                              <div style={styles.infoCardSubtext}>Cleaned Name: {String(row.cleanedInvoiceName || getInvoiceDebugCleanName(row) || "")}</div>
                              <div style={styles.infoCardSubtext}>Match Reason: {String(row.matchDebugReason || "No debug reason")}</div>
                              <div style={styles.infoCardSubtext}>Match Score: {String(row.matchDebugScore ?? "0")}</div>
                              <div style={styles.infoCardSubtext}>Candidates Checked: {String(row.matchDebugCandidateCount ?? "0")}</div>
                              <div style={styles.infoCardSubtext}>Supplier Match Key: {String(row.supplierMatchKey || "Not prepared")}</div>
                              <div style={styles.infoCardSubtext}>Supplier For Learning: {String(row.supplierNameForLearning || selectedSupplier?.name || "Unknown supplier")}</div>
                              <div style={styles.infoCardSubtext}>Suggested Learning Label: {String(row.suggestedLearningLabel || "No learning label prepared")}</div>
                              <div style={styles.infoCardSubtext}>Learning is prepared only — nothing is saved yet.</div>
                            </div>
                          ) : null}

                          <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="checkbox" checked={!!row.selected} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "selected", event.target.checked)} />
                            Use this line for review
                          </label>
                          <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Item Name</label>
                              <input value={row.name || ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "name", event.target.value)} style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Code</label>
                              <input value={row.code || ""} readOnly style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Qty</label>
                              <input value={row.qty ?? ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "qty", event.target.value)} style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Unit</label>
                              <select value={row.unit || "each"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "unit", event.target.value)} style={styles.input}>
                                {[...new Set([...componentUnitOptions, ...purchaseUnitOptions])].map((unit: string) => <option key={unit} value={unit}>{unit}</option>)}
                              </select>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Unit Price</label>
                              <input value={row.unitPrice ?? ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "unitPrice", event.target.value)} style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Line Total</label>
                              <input value={row.lineTotal ?? ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "lineTotal", event.target.value)} style={styles.input} />
                            </div>
                            {!isCompactReviewMode ? (
                              <>
                                <div style={styles.formGroup}>
                                  <label style={styles.label}>Pack Size</label>
                                  <input value={`${row.amountInPurchaseUnit || "1"} x ${row.sizePerItem || "1"} ${row.sizeUnit || "each"}`} readOnly style={styles.input} />
                                </div>
                                <div style={styles.formGroup}>
                                  <label style={styles.label}>Confidence</label>
                                  <input value={row.confidence || "low"} readOnly style={styles.input} />
                                </div>
                              </>
                            ) : null}
                            <div style={styles.formGroup}>
                              <label style={styles.label}>COGS Category</label>
                              <select
                                value={getInvoiceRowCogsType(row)}
                                onChange={(event: any) => updateSupplierInvoiceRow(row.id, "cogsCategory", event.target.value)}
                                style={styles.input}
                              >
                                <option value="food_cogs">Food COGS</option>
                                <option value="consumable_cogs">Consumable COGS</option>
                                <option value="non_cogs">Non-COGS / Cleaning / Sundries</option>
                                <option value="unknown">Unknown / Needs Review</option>
                              </select>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Match Ingredient</label>
                              <select value={row.linkedIngredientId || ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "linkedIngredientId", event.target.value)} style={styles.input}>
                                <option value="">Needs match</option>
                                {(Array.isArray(supplierIngredients) ? supplierIngredients : [])
                                  .filter((ingredient: any) => !selectedSupplier?.name || String(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim() === selectedSupplier.name)
                                  .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")))
                                  .map((ingredient: any) => (
                                    <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                                  ))}
                              </select>
                            </div>
                            {row.status === "create_new" ? (
                              <div style={styles.formGroup}>
                                <label style={styles.label}>New Ingredient Preview</label>
                                <div style={styles.infoCardSubtext}>
                                  {String(row.name || "Unnamed item")} · {formatCurrency(row.purchasePrice || row.lineTotal || row.unitPrice)} · {String(row.purchaseUnit || "box")} · {String(row.amountInPurchaseUnit || "1")} x {String(row.sizePerItem || "1")} {String(row.sizeUnit || "each")}
                                </div>
                                {getInvoiceRowCogsType(row) === "food_cogs" ? (
                                  <button type="button" style={styles.primaryButton} onClick={() => handleCreateIngredientFromInvoiceRow(row.id)}>Create Ingredient From Row</button>
                                ) : (
                                  <div style={styles.infoCardSubtext}>Consumables and unknown rows do not create recipe ingredients. Change this row to Food COGS first if it belongs in recipes.</div>
                                )}
                              </div>
                            ) : null}
                          </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={styles.buttonRow}>
                      <button type="button" style={invoiceCanLockSafely ? styles.primaryButton : styles.secondaryButton} onClick={handleSafeLockInvoiceClick}>{invoiceFlowSummary.lockLabel}</button>
                      <button type="button" style={styles.secondaryButton} onClick={showOnlyInvoiceRowsNeedingFix}>Show Fix Only</button>
                      <button type="button" style={styles.secondaryButton} onClick={autoApproveHighConfidenceInvoiceRows}>Auto Approve High Confidence</button>
                      <button type="button" style={styles.secondaryButton} onClick={handleSaveInvoiceDraft}>Save Review Draft</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...styles.infoCard, marginTop: 12, border: "1px solid rgba(245, 158, 11, 0.32)", background: "rgba(245, 158, 11, 0.07)" }}>
                    <div style={styles.infoCardTitle}>No invoice rows yet</div>
                    <div style={styles.infoCardSubtext}>Scan your first invoice to begin. GP Police will read it, split the rows, then show only what needs fixing.</div>
                    <div style={{ ...styles.buttonRow, marginTop: 12 }}>
                      <button type="button" style={styles.primaryButton} onClick={() => invoiceCameraInputRef.current?.click()}>📷 Take Invoice Photo</button>
                      <button type="button" style={styles.secondaryButton} onClick={parseInvoiceForSelectedSupplier}>Scan Invoice</button>
                    </div>
                  </div>
                )}
              </div>
  );
}
