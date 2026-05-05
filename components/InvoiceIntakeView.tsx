import { useEffect, useMemo, useRef, useState } from "react";
import { buildInvoiceCandidateLines, cleanInvoiceOcrText, parseSupplierInvoiceText, parseSupplierInvoiceTextSmart, scoreInvoiceParserCandidate } from "../lib/invoiceParsing";
import { InvoiceTrialNotesPanel } from "./invoice/InvoiceTrialNotesPanel";
import { InvoiceUploadPanel } from "./invoice/InvoiceUploadPanel";
import { InvoiceAccuracyLabPanel } from "./invoice/InvoiceAccuracyLabPanel";
import { InvoiceLockHistoryPanel } from "./invoice/InvoiceLockHistoryPanel";
import { InvoicePreflightPanel } from "./invoice/InvoicePreflightPanel";
import { InvoiceReviewToolbar } from "./invoice/InvoiceReviewToolbar";

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
  const [invoiceReviewMode, setInvoiceReviewMode] = useState<"normal" | "compact">(() =>
    typeof window !== "undefined" && window.innerWidth <= 820 ? "compact" : "normal"
  );
  const [showInvoiceMatchDebug, setShowInvoiceMatchDebug] = useState(false);
  const [showInvoiceAccuracyLab, setShowInvoiceAccuracyLab] = useState(false);
  const [savedSupplierMatchRows, setSavedSupplierMatchRows] = useState<Record<string, boolean>>({});
  const [trialModeNotes, setTrialModeNotes] = useState("");
  const invoiceReviewPanelRef = useRef<HTMLDivElement | null>(null);
  const lastInvoiceRowCountRef = useRef(0);

  useEffect(() => {
    const syncInvoiceMobileMode = () => {
      if (window.innerWidth <= 820) {
        setInvoiceReviewMode("compact");
      }
    };

    syncInvoiceMobileMode();
    window.addEventListener("resize", syncInvoiceMobileMode);
    return () => window.removeEventListener("resize", syncInvoiceMobileMode);
  }, []);


  const selectedSupplierName = String(selectedSupplier?.name || invoiceIntakeMeta?.supplierName || "Unknown supplier").trim() || "Unknown supplier";

  const getInvoiceAccuracyMoneyCount = (value: string) => {
    const matches = String(value || "").match(/(?:\$\s*)?\d{1,6}(?:[.,]\d{2})\b/g);
    return matches ? matches.length : 0;
  };

  const buildInvoicePriceAnchorRebuiltText = (value: string) => {
    const sourceLines = cleanInvoiceOcrText(String(value || ""))
      .split("\n")
      .map((line: string) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const rebuiltLines: string[] = [];
    const pricePattern = /(?:\$\s*)?\d{1,6}[.,]\d{2}\b/g;

    sourceLines.forEach((line: string) => {
      const matches = Array.from(line.matchAll(pricePattern));

      if (matches.length <= 1) {
        rebuiltLines.push(line);
        return;
      }

      let cursor = 0;
      matches.forEach((match: RegExpMatchArray) => {
        const matchIndex = typeof match.index === "number" ? match.index : -1;
        const rawMatch = match[0] || "";
        if (matchIndex < 0 || !rawMatch) return;

        const endIndex = matchIndex + rawMatch.length;
        const segment = line.slice(cursor, endIndex).replace(/\s+/g, " ").trim();
        if (segment) rebuiltLines.push(segment);
        cursor = endIndex;
      });

      const tail = line.slice(cursor).replace(/\s+/g, " ").trim();
      if (tail) {
        const lastLine = rebuiltLines.pop() || "";
        rebuiltLines.push(`${lastLine} ${tail}`.replace(/\s+/g, " ").trim());
      }
    });

    return rebuiltLines.join("\n");
  };

  const getInvoiceAccuracyRowValue = (row: any) => {
    const value = Number(row?.lineTotal ?? row?.total ?? row?.amount ?? row?.purchasePrice ?? row?.unitPrice ?? 0);
    return Number.isFinite(value) ? value : 0;
  };

  const getInvoiceAccuracyConfidenceLabel = (row: any) => {
    return String(row?.confidence || row?.rowConfidence || row?.categoryConfidence || row?.cogsCategoryConfidence || "low").toLowerCase();
  };

  const getInvoiceAccuracyCogsType = (row: any) => {
    const rawType = String(row?.cogsType || row?.cogsCategory || row?.category || "unknown").toLowerCase();
    if (rawType === "food" || rawType === "food_cogs") return "food_cogs";
    if (rawType === "consumable" || rawType === "consumables" || rawType === "consumable_cogs") return "consumable_cogs";
    if (rawType === "non_cogs" || rawType === "non-cogs" || rawType === "non cogs") return "non_cogs";
    return "unknown";
  };

  const buildInvoiceAccuracyCandidateSummary = (candidateName: string, candidateText: string, parserMode: "standard" | "smart") => {
    let rows: any[] = [];

    try {
      rows = parserMode === "smart"
        ? parseSupplierInvoiceTextSmart(candidateText, selectedSupplierName)
        : parseSupplierInvoiceText(candidateText, selectedSupplierName);
    } catch (error) {
      rows = [];
    }

    const rowCount = rows.length;
    const rowsWithPrice = rows.filter((row: any) => getInvoiceAccuracyRowValue(row) > 0).length;
    const rowsWithCategory = rows.filter((row: any) => getInvoiceAccuracyCogsType(row) !== "unknown").length;
    const foodRows = rows.filter((row: any) => getInvoiceAccuracyCogsType(row) === "food_cogs").length;
    const consumableRows = rows.filter((row: any) => getInvoiceAccuracyCogsType(row) === "consumable_cogs").length;
    const unknownRows = rows.filter((row: any) => getInvoiceAccuracyCogsType(row) === "unknown").length;
    const lowConfidenceRows = rows.filter((row: any) => getInvoiceAccuracyConfidenceLabel(row) === "low").length;
    const estimatedTotal = rows.reduce((sum: number, row: any) => sum + getInvoiceAccuracyRowValue(row), 0);
    const priceAnchorCount = getInvoiceAccuracyMoneyCount(candidateText);
    const parserScore = scoreInvoiceParserCandidate(rows, candidateName);
    const score = Math.round(parserScore.score + priceAnchorCount * 4);

    return {
      candidateName,
      parserMode,
      rowCount,
      rowsWithPrice,
      rowsWithCategory,
      foodRows,
      consumableRows,
      unknownRows,
      lowConfidenceRows,
      estimatedTotal,
      priceAnchorCount,
      score,
      scoreReasons: parserScore.scoreReasons || [],
      candidateStats: parserScore,
      rows,
    };
  };

  const invoiceAccuracyDiagnostics = useMemo(() => {
    const rawText = String(supplierInvoiceText || "");
    const cleanedText = cleanInvoiceOcrText(rawText);
    const softLineText = buildInvoiceCandidateLines(rawText).join("\n");
    const priceAnchorText = buildInvoicePriceAnchorRebuiltText(rawText);

    const candidates = [
      buildInvoiceAccuracyCandidateSummary("Original text", rawText, "standard"),
      buildInvoiceAccuracyCandidateSummary("Cleaned OCR text", cleanedText, "standard"),
      buildInvoiceAccuracyCandidateSummary("Soft line recovery", softLineText, "standard"),
      buildInvoiceAccuracyCandidateSummary("Price-anchor rebuilt", priceAnchorText, "standard"),
      buildInvoiceAccuracyCandidateSummary("Smart parser final", rawText, "smart"),
    ].sort((a: any, b: any) => b.score - a.score);

    const chosenCandidate = candidates[0] || null;
    const currentRows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];
    const currentRowSources = Array.from(
      new Set(
        currentRows
          .map((row: any) => String(row?.recoverySource || row?.parserSource || row?.source || "").trim())
          .filter(Boolean)
      )
    );
    const finalParserSource = currentRowSources.length ? currentRowSources.join(", ") : String(chosenCandidate?.candidateName || "Not enough data yet");

    const chosenReasons: string[] = [];
    if (chosenCandidate) {
      chosenReasons.push(`${chosenCandidate.rowCount} rows found`);
      chosenReasons.push(`${chosenCandidate.rowsWithPrice} rows with prices`);
      chosenReasons.push(`${chosenCandidate.rowsWithCategory} categorised rows`);
      if (chosenCandidate.unknownRows > 0) chosenReasons.push(`${chosenCandidate.unknownRows} unknown rows still need eyes`);
      if (chosenCandidate.estimatedTotal > 0) chosenReasons.push(`${formatCurrency(chosenCandidate.estimatedTotal)} estimated total`);
    }

    return {
      rawText,
      cleanedText,
      softLineText,
      priceAnchorText,
      candidates,
      chosenCandidate,
      finalParserSource,
      chosenReasons,
    };
  }, [supplierInvoiceText, supplierInvoiceRows, selectedSupplierName]);

  const copyInvoiceAccuracyDebugPack = async () => {
    const rows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];
    const candidateSummary = invoiceAccuracyDiagnostics.candidates.map((candidate: any) => ({
      candidateName: candidate.candidateName,
      parserMode: candidate.parserMode,
      rowCount: candidate.rowCount,
      rowsWithPrice: candidate.rowsWithPrice,
      rowsWithCategory: candidate.rowsWithCategory,
      foodRows: candidate.foodRows,
      consumableRows: candidate.consumableRows,
      unknownRows: candidate.unknownRows,
      lowConfidenceRows: candidate.lowConfidenceRows,
      estimatedTotal: candidate.estimatedTotal,
      priceAnchorCount: candidate.priceAnchorCount,
      score: candidate.score,
      scoreReasons: candidate.scoreReasons || [],
    }));

    const parsedRows = rows.map((row: any) => ({
      id: row?.id,
      name: row?.name || row?.description || row?.itemName || "",
      rawLine: row?.rawLine || "",
      quantity: row?.quantity || row?.qty || "",
      unit: row?.unit || row?.purchaseUnit || "",
      unitPrice: row?.unitPrice || "",
      lineTotal: row?.lineTotal || row?.purchasePrice || "",
      cogsType: getInvoiceRowCogsType(row),
      cogsCategory: row?.cogsCategory || row?.category || "",
      cogsCategoryReason: row?.cogsCategoryReason || "",
      confidence: row?.confidence || "",
      matchConfidence: row?.matchConfidence || "",
      matchedIngredientName: row?.matchedIngredientName || "",
      linkedIngredientId: row?.linkedIngredientId || "",
      supplierMatchKey: row?.supplierMatchKey || "",
      recoverySource: row?.recoverySource || row?.parserSource || "",
      rowShape: row?.rowShape || "",
      rowShapeConfidence: row?.rowShapeConfidence || "",
      rowShapeReason: row?.rowShapeReason || "",
      suspectedMergedRow: Boolean(row?.suspectedMergedRow),
      parserScoreContribution: row?.parserScoreContribution ?? "",
      parserScoreReasons: row?.parserScoreReasons || [],
      status: row?.status || "",
    }));

    const debugPack = [
      "GP POLICE INVOICE DEBUG PACK",
      `Supplier: ${selectedSupplierName}`,
      `Invoice number: ${String(invoiceIntakeMeta?.invoiceNumber || "")}`,
      `Invoice date: ${String(invoiceIntakeMeta?.invoiceDate || "")}`,
      `Row count: ${rows.length}`,
      `Chosen parser source: ${invoiceAccuracyDiagnostics.finalParserSource}`,
      `Warning message: ${String(invoiceQualityWarning || "")}`,
      `Failed invoice notes: ${trialModeNotes}`,
      "",
      "CANDIDATE SUMMARY",
      JSON.stringify(candidateSummary, null, 2),
      "",
      "RAW OCR TEXT",
      invoiceAccuracyDiagnostics.rawText,
      "",
      "CLEANED OCR TEXT",
      invoiceAccuracyDiagnostics.cleanedText,
      "",
      "SOFT LINE TEXT",
      invoiceAccuracyDiagnostics.softLineText,
      "",
      "PRICE-ANCHOR REBUILT TEXT",
      invoiceAccuracyDiagnostics.priceAnchorText,
      "",
      "PARSED ROWS",
      JSON.stringify(parsedRows, null, 2),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(debugPack);
      setSupplierInvoiceMessage("Invoice debug pack copied. Paste it into the next build/debug chat when an invoice fails.");
    } catch (error) {
      setSupplierInvoiceMessage("Could not copy debug pack automatically. Open the Accuracy Lab and copy the visible text manually.");
    }
  };

  const getInvoiceAccuracyTextPreview = (value: string) => {
    const text = String(value || "").trim();
    return text || "No text available yet.";
  };

  const getInvoiceRowMergedWarning = (row: any) => {
    const rawLine = String(row?.rawLine || row?.name || "");
    const moneyCount = getInvoiceAccuracyMoneyCount(rawLine);
    const wordCount = rawLine.split(/\s+/).filter(Boolean).length;
    return moneyCount >= 2 || wordCount > 18;
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


  const getInvoiceRowHasPriceWarning = (row: any) => {
    const warningType = String(row?.warningType || row?.warning || row?.warningLabel || "").toLowerCase();
    if (Boolean(row?.priceWarning || row?.hasPriceWarning)) return true;
    if (warningType.includes("price")) return true;
    return getInvoiceRowDamageFlags(row).some((flag: string) =>
      flag.includes("Price rise") || flag.includes("Price spike") || flag.includes("Margin killer")
    );
  };

  const getInvoiceRowHasDuplicateWarning = (row: any) => {
    const warningType = String(row?.warningType || row?.warning || row?.warningLabel || row?.duplicateReason || "").toLowerCase();
    const status = String(row?.status || row?.reviewStatus || "").toLowerCase();
    return Boolean(row?.duplicateWarning || row?.isDuplicate || row?.possibleDuplicate || row?.duplicateInvoiceRow) || warningType.includes("duplicate") || status.includes("duplicate");
  };

  const getInvoiceRowHasMatchedIngredient = (row: any) => {
    return Boolean(String(row?.linkedIngredientId || row?.matchedIngredientId || row?.ingredientId || "").trim() || String(row?.matchedIngredientName || "").trim());
  };

  const getInvoiceRowOutcome = (row: any) => {
    const cogsType = getInvoiceRowCogsType(row);
    const status = String(row?.status || row?.reviewStatus || "").toLowerCase();
    const hasMatch = getInvoiceRowHasMatchedIngredient(row);

    if (getInvoiceRowHasDuplicateWarning(row)) {
      return { key: "duplicates", label: "DUPLICATE WARNING", tone: "danger" };
    }

    if (getInvoiceRowHasPriceWarning(row)) {
      return { key: "price_warnings", label: "PRICE WARNING", tone: "danger" };
    }

    if (cogsType === "unknown" || status === "unknown" || status === "needs_fix" || (cogsType === "food_cogs" && !hasMatch && status !== "create_new" && status !== "ignore")) {
      return { key: "needs_fix", label: "NEEDS FIX", tone: "warning" };
    }

    if (cogsType === "consumable_cogs") {
      return { key: "consumable_cogs", label: "CONSUMABLE", tone: "info" };
    }

    if (cogsType === "food_cogs") {
      return { key: "food_cogs", label: "FOOD COGS", tone: "success" };
    }

    if (cogsType === "non_cogs") {
      return { key: "non_cogs", label: "NON-COGS", tone: "muted" };
    }

    return { key: "needs_fix", label: "NEEDS FIX", tone: "warning" };
  };

  const getInvoiceOutcomeBadgeStyle = (row: any): any => {
    const outcome = getInvoiceRowOutcome(row);
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

    if (outcome.tone === "danger") {
      return { ...baseStyle, background: "rgba(248, 113, 113, 0.18)", color: "#fecaca", borderColor: "rgba(248, 113, 113, 0.52)" };
    }

    if (outcome.tone === "warning") {
      return { ...baseStyle, background: "rgba(245, 158, 11, 0.18)", color: "#fde68a", borderColor: "rgba(245, 158, 11, 0.48)" };
    }

    if (outcome.tone === "info") {
      return { ...baseStyle, background: "rgba(59, 130, 246, 0.16)", color: "#bfdbfe", borderColor: "rgba(59, 130, 246, 0.42)" };
    }

    if (outcome.tone === "muted") {
      return { ...baseStyle, background: "rgba(148, 163, 184, 0.14)", color: "#e2e8f0", borderColor: "rgba(148, 163, 184, 0.42)" };
    }

    return { ...baseStyle, background: "rgba(34, 197, 94, 0.16)", color: "#bbf7d0", borderColor: "rgba(34, 197, 94, 0.42)" };
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
    { key: "food_cogs", label: "Food" },
    { key: "consumable_cogs", label: "Consumables" },
    { key: "needs_fix", label: "Needs Fix" },
    { key: "price_warnings", label: "Price Warnings" },
    { key: "duplicates", label: "Duplicates" },
    { key: "non_cogs", label: "Non-COGS" },
    { key: "unknown", label: "Unknown" },
    { key: "unmatched_food", label: "Unmatched Food" },
  ];

  const getInvoiceReviewFilterMatches = (row: any, filterKey: string) => {
    const cogsType = getInvoiceRowCogsType(row);
    const reviewState = getInvoiceRowReviewState(row);
    const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
    const status = String(row?.status || "").toLowerCase();
    const hasPriceWarning = getInvoiceRowHasPriceWarning(row);
    const hasDuplicateWarning = getInvoiceRowHasDuplicateWarning(row);

    if (filterKey === "all") return true;
    if (filterKey === "food_cogs") return cogsType === "food_cogs";
    if (filterKey === "consumable_cogs") return cogsType === "consumable_cogs";
    if (filterKey === "non_cogs") return cogsType === "non_cogs";
    if (filterKey === "unknown") return cogsType === "unknown";
    if (filterKey === "needs_fix") return reviewState.level === "low" || cogsType === "unknown";
    if (filterKey === "unmatched_food") return cogsType === "food_cogs" && !linkedIngredientId && status !== "create_new";
    if (filterKey === "price_warnings") return hasPriceWarning;
    if (filterKey === "duplicates") return hasDuplicateWarning;

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
    { key: "duplicates_first", label: "Duplicates first" },
  ];

  const getInvoiceReviewSortScore = (row: any, sortKey: string) => {
    const cogsType = getInvoiceRowCogsType(row);
    const reviewState = getInvoiceRowReviewState(row);
    const hasPriceWarning = getInvoiceRowHasPriceWarning(row);
    const hasDuplicateWarning = getInvoiceRowHasDuplicateWarning(row);

    if (sortKey === "needs_fix_first") return reviewState.level === "low" || cogsType === "unknown" ? 0 : 1;
    if (sortKey === "food_first") return cogsType === "food_cogs" ? 0 : 1;
    if (sortKey === "consumables_first") return cogsType === "consumable_cogs" ? 0 : 1;
    if (sortKey === "unknown_first") return cogsType === "unknown" ? 0 : 1;
    if (sortKey === "price_warnings_first") return hasPriceWarning ? 0 : 1;
    if (sortKey === "duplicates_first") return getInvoiceRowHasDuplicateWarning(row) ? 0 : 1;

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


  const invoiceReviewOutcomeSummary = (() => {
    const rows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];

    return rows.reduce(
      (summary: any, row: any) => {
        const outcome = getInvoiceRowOutcome(row);
        const cogsType = getInvoiceRowCogsType(row);

        summary.totalReviewRows += 1;
        if (cogsType === "food_cogs") summary.matchedFoodCount += 1;
        if (cogsType === "consumable_cogs") summary.matchedConsumableCount += 1;
        if (outcome.key === "needs_fix") summary.unknownCount += 1;
        if (outcome.key === "price_warnings") summary.priceWarningCount += 1;
        if (outcome.key === "duplicates") summary.duplicateWarningCount += 1;

        return summary;
      },
      {
        totalReviewRows: 0,
        matchedFoodCount: 0,
        matchedConsumableCount: 0,
        unknownCount: 0,
        priceWarningCount: 0,
        duplicateWarningCount: 0,
      }
    );
  })();

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
        const hasPriceWarning = getInvoiceRowHasPriceWarning(row);

        if (cogsType === "unknown") summary.unknownRowsCount += 1;
        if (cogsType === "food_cogs" && !linkedIngredientId && status !== "create_new" && status !== "ignore") {
          summary.unmatchedFoodCount += 1;
        }
        if (hasPriceWarning) summary.priceWarningCount += 1;
        if (getInvoiceRowHasDuplicateWarning(row)) summary.duplicateWarningCount += 1;

        return summary;
      },
      {
        unknownRowsCount: 0,
        unmatchedFoodCount: 0,
        priceWarningCount: 0,
        duplicateWarningCount: 0,
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
        const hasPriceWarning = getInvoiceRowHasPriceWarning(row);

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

  const handleJumpToInvoiceFilter = (filterKey: string) => {
    setInvoiceReviewSearchTerm("");
    setInvoiceReviewFilter(filterKey);

    if (filterKey === "unknown") {
      setInvoiceReviewSortKey("unknown_first");
    } else if (filterKey === "unmatched_food" || filterKey === "needs_fix") {
      setInvoiceReviewSortKey("needs_fix_first");
    } else if (filterKey === "price_warnings") {
      setInvoiceReviewSortKey("price_warnings_first");
    } else if (filterKey === "duplicates") {
      setInvoiceReviewSortKey("duplicates_first");
    }

    window.setTimeout(() => {
      invoiceReviewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const getFirstInvoiceProblemRow = () => {
    const rows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];

    return rows.find((row: any) => {
      const cogsType = getInvoiceRowCogsType(row);
      const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
      const status = String(row?.status || "").toLowerCase();
      const hasPriceWarning = getInvoiceRowHasPriceWarning(row);

      return (
        cogsType === "unknown" ||
        (cogsType === "food_cogs" && !linkedIngredientId && status !== "create_new" && status !== "ignore") ||
        hasPriceWarning
      );
    }) || null;
  };

  const handleFixNextInvoiceProblem = () => {
    const problemRow = getFirstInvoiceProblemRow();

    if (!problemRow) {
      setSupplierInvoiceMessage("No obvious invoice problems left. Do one final review, then lock it clean.");
      setInvoiceReviewFilter("all");
      return;
    }

    const cogsType = getInvoiceRowCogsType(problemRow);
    const linkedIngredientId = String(problemRow?.linkedIngredientId || "").trim();
    const status = String(problemRow?.status || "").toLowerCase();
    const hasPriceWarning = getInvoiceRowHasPriceWarning(problemRow);

    if (cogsType === "unknown") {
      setInvoiceReviewFilter("unknown");
      setInvoiceReviewSortKey("unknown_first");
    } else if (cogsType === "food_cogs" && !linkedIngredientId && status !== "create_new" && status !== "ignore") {
      setInvoiceReviewFilter("unmatched_food");
      setInvoiceReviewSortKey("needs_fix_first");
    } else if (hasPriceWarning) {
      setInvoiceReviewFilter("price_warnings");
      setInvoiceReviewSortKey("price_warnings_first");
    } else {
      setInvoiceReviewFilter("needs_fix");
      setInvoiceReviewSortKey("needs_fix_first");
    }

    setInvoiceFixingRowId(problemRow.id);
    window.setTimeout(() => {
      const rowElement = document.getElementById(`invoice-row-${problemRow.id}`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        invoiceReviewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
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

  const invoiceComponentProps = {
    ...props,
    invoiceFlowSummary,
    invoiceReviewPanelRef,
    trialGuardrailSummary,
    trialModeNotes,
    setTrialModeNotes,
    getInvoiceFlowStatusStyle,
    getTrialChecklistItemStyle,
    getInvoiceReviewBadgeStyle,
    getInvoiceWeeklySpendBadgeStyle,
    scrollToInvoiceReviewPanel,
    showInvoiceAccuracyLab,
    setShowInvoiceAccuracyLab,
    invoiceAccuracyDiagnostics,
    getInvoiceAccuracyMoneyCount,
    getInvoiceAccuracyTextPreview,
    copyInvoiceAccuracyDebugPack,
    showInvoiceMatchDebug,
    setShowInvoiceMatchDebug,
    getLockedInvoiceCogsTotals,
    invoiceWeeklySpendInsight,
    weeklyDamageSummary,
    getWeeklyDamageBadgeStyle,
    invoiceCogsCategoryTotals,
    invoicePreflightSummary,
    invoiceCanLockSafely,
    invoiceLockBlockingSummary,
    handleSafeLockInvoiceClick,
    showOnlyInvoiceRowsNeedingFix,
    autoApproveHighConfidenceInvoiceRows,
    handleFixNextInvoiceProblem,
    handleJumpToInvoiceFilter,
    invoiceReviewReadinessSummary,
    invoiceReviewOutcomeSummary,
    invoiceReviewWarningSummary,
    invoiceSafeToLockTone,
    invoiceReviewMode,
    setInvoiceReviewMode,
    invoiceReviewSearchTerm,
    setInvoiceReviewSearchTerm,
    displayedSupplierInvoiceRows,
    invoiceReviewSortKey,
    setInvoiceReviewSortKey,
    invoiceReviewSortOptions,
    invoiceReviewVisibilitySummary,
    updateDisplayedInvoiceRowsSelected,
    markDisplayedInvoiceRowsCogsCategory,
    resetInvoiceReviewControls,
    invoiceReviewFilterOptions,
    invoiceReviewFilter,
    setInvoiceReviewFilter,
    getInvoiceReviewFilterCount,
    invoiceGpDamageSummary,
    getInvoiceRowReviewState,
    getInvoiceRowCogsType,
    getInvoicePriceUpdateSuggestion,
    savedSupplierMatchRows,
    getInvoiceRowReviewCardStyle,
    getInvoiceOutcomeBadgeStyle,
    getInvoiceRowOutcome,
    getInvoiceCogsCategoryBadgeStyle,
    getInvoiceCogsCategoryLabel,
    getInvoiceMatchBadgeStyle,
    getInvoiceMatchConfidenceBadgeStyle,
    getInvoiceCogsCategoryHelpText,
    getInvoiceRowDamageFlags,
    getInvoiceRowMergedWarning,
    getInvoiceMatchLabel,
    getInvoiceDebugCleanName,
    handleLearnSupplierMatchFromRow,
    handleUpdateIngredientPriceFromInvoiceRow,
  };

  return (
              <div id="supplier-invoice-import" style={styles.cardInset}>
                <div style={styles.sectionGroupHeaderRow}>
                  <div>
                    <h3 style={styles.sectionGroupTitle}>Invoice Fast Lane</h3>
                    <div style={styles.infoCardSubtext}>Scan the bill, fix the risky rows, then lock clean stock into the system.</div>
                  </div>
                </div>

                <InvoiceTrialNotesPanel {...invoiceComponentProps} />
                <InvoiceUploadPanel {...invoiceComponentProps} />
                <InvoiceAccuracyLabPanel {...invoiceComponentProps} />
                <InvoiceLockHistoryPanel {...invoiceComponentProps} />
                <InvoicePreflightPanel {...invoiceComponentProps} />
                <InvoiceReviewToolbar {...invoiceComponentProps} />
              </div>
  );
}
