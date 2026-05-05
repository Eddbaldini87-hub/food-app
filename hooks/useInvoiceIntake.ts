import { useEffect, useMemo, useState } from "react";
import { INVOICE_INTAKE_DRAFT_KEY, STORAGE_KEYS, sizeUnitOptions } from "../lib/gpPoliceConstants";
import { DAMAGE_HISTORY_STORAGE_KEY, safeParse, safeSetLocalStorageValue } from "../lib/invoice/invoiceStorage";
import {
  applyInvoiceCogsCategoryDetection,
  getInvoiceRowCogsTypeForApp,
  legacyInvoiceCogsCategoryForApp,
  normalizeInvoiceCogsTypeForApp,
  saveSupplierCogsMemory,
} from "../lib/invoice/invoiceCogs";
import { applyInvoiceIngredientIntelligence } from "../lib/invoice/invoiceMatching";
import {
  safeNumber,
  normalizeLooseText,
  toBaseUnit,
  baseUnitFromSizeUnit,
  unitTypeFromUnit,
} from "../lib/gpPoliceHelpers";
import {
  cleanInvoiceOcrText,
  getInvoiceOcrQualityWarning,
  getInvoiceRowConfidence,
  enhanceInvoiceReviewRows,
  parseSupplierInvoiceTextSmart,
  getInvoiceRowRecoveryPriceAnchorCount,
  rebuildInvoiceTextFromPriceAnchors,
  splitInvoiceTextWithSoftLineBreaks,
} from "../lib/invoiceParsing";

type UseInvoiceIntakeArgs = {
  selectedSupplier: any;
  supplierIngredients: any[];
  setSupplierIngredients: (value: any) => void;
  orderingMeta: Record<string, any>;
  setOrderingMeta: (value: any) => void;
  invoiceSpendForm: any;
  setInvoiceSpendForm: (value: any) => void;
  invoiceSpendRecords: any[];
  setInvoiceSpendRecords: (value: any) => void;
  setInvoiceSpendMessage: (value: any) => void;
  supplierMatchMemory: Record<string, any>;
  setSupplierMatchMemory: (value: any) => void;
  stockMovements: any[];
  setStockMovements: (value: any) => void;
  lockedInvoiceHistory: any[];
  setLockedInvoiceHistory: (value: any) => void;
  setDamageHistory: (value: any) => void;
  createEmergencyBackupSnapshot: (reason?: string) => void;
  preprocessInvoiceImageForOCR: (file: File) => Promise<Blob | File>;
};

export function useInvoiceIntake(args: UseInvoiceIntakeArgs) {
  const {
    selectedSupplier,
    supplierIngredients,
    setSupplierIngredients,
    orderingMeta,
    setOrderingMeta,
    invoiceSpendForm,
    invoiceSpendRecords,
    setInvoiceSpendForm,
    setInvoiceSpendRecords,
    setInvoiceSpendMessage,
    supplierMatchMemory,
    setSupplierMatchMemory,
    stockMovements,
    setStockMovements,
    lockedInvoiceHistory,
    setLockedInvoiceHistory,
    setDamageHistory,
    createEmergencyBackupSnapshot,
    preprocessInvoiceImageForOCR,
  } = args;

  const [supplierInvoiceText, setSupplierInvoiceText] = useState("");
  const [supplierInvoiceRows, setSupplierInvoiceRows] = useState<any[]>([]);
  const [invoiceDraft, setInvoiceDraft] = useState<any>(null);
  const [invoiceDraftMessage, setInvoiceDraftMessage] = useState("");
  const [invoiceLockSuccessReport, setInvoiceLockSuccessReport] = useState<any>(null);
  const [invoiceIntakeMeta, setInvoiceIntakeMeta] = useState<any>({ invoiceNumber: "", invoiceDate: new Date().toISOString().slice(0, 10) });
  const [supplierInvoiceMessage, setSupplierInvoiceMessage] = useState("");
  const [supplierInvoicePhotoName, setSupplierInvoicePhotoName] = useState("");
  const [supplierInvoicePhotoPreviewUrl, setSupplierInvoicePhotoPreviewUrl] = useState("");
  const [supplierInvoiceViewOpen, setSupplierInvoiceViewOpen] = useState(false);
  const [invoiceQualityWarning, setInvoiceQualityWarning] = useState("");
  const [invoiceFixingRowId, setInvoiceFixingRowId] = useState<string | null>(null);

  useEffect(() => {
    const savedInvoiceDraft = safeParse<any>(
      INVOICE_INTAKE_DRAFT_KEY,
      null,
      (value) => !value || (typeof value === "object" && !Array.isArray(value))
    );

    if (!savedInvoiceDraft) return;

    setInvoiceDraft(savedInvoiceDraft);
    setSupplierInvoiceText(String(savedInvoiceDraft.rawText || ""));
    setSupplierInvoiceRows(Array.isArray(savedInvoiceDraft.rows) ? savedInvoiceDraft.rows : []);
    setInvoiceIntakeMeta({
      invoiceNumber: String(savedInvoiceDraft.invoiceNumber || ""),
      invoiceDate: String(savedInvoiceDraft.invoiceDate || new Date().toISOString().slice(0, 10)),
    });
    setInvoiceDraftMessage("Latest invoice draft loaded from this device.");
  }, []);

  useEffect(() => {
    return () => {
      if (supplierInvoicePhotoPreviewUrl) {
        URL.revokeObjectURL(supplierInvoicePhotoPreviewUrl);
      }
    };
  }, [supplierInvoicePhotoPreviewUrl]);

  const normalizeInvoiceIngredientMatchText = (value: any) => {
    return String(value || "")
      .toLowerCase()
      .replace(/\b\d+(?:\.\d+)?\s*(kg|kgs|g|gm|gram|grams|l|lt|ltr|litre|litres|ml|ea|each|box|ctn|carton|bag|bunch|pkt|pack|pc|pcs|unit|units)\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const getInvoiceIngredientMatchTokens = (value: any) => {
    const weakWords = new Set([
      "fresh",
      "frozen",
      "chilled",
      "whole",
      "sliced",
      "diced",
      "shredded",
      "fillet",
      "fillets",
      "portion",
      "portions",
      "pack",
      "pkt",
      "box",
      "ctn",
      "carton",
      "bag",
      "kg",
      "kgs",
      "g",
      "gm",
      "l",
      "lt",
      "ml",
      "ea",
      "each",
      "unit",
      "units",
    ]);

    return normalizeInvoiceIngredientMatchText(value)
      .split(" ")
      .filter((token) => token.length >= 3 && !weakWords.has(token));
  };

  const normalizeSupplierMatchText = (value: any) => {
    return String(value || "")
      .toLowerCase()
      .replace(/\$?\d+(?:\.\d{2})?/g, " ")
      .replace(/\b\d+(?:\.\d+)?\s*(?:x|kg|kgs|g|gm|gram|grams|l|lt|ltr|litre|litres|ml|ea|each|box|ctn|carton|bag|bunch|bun|pkt|pack|pc|pcs|unit|units|tray|tub|tin|bottle|case)\b/g, " ")
      .replace(/\b(?:kg|kgs|g|gm|gram|grams|l|lt|ltr|litre|litres|ml|ea|each|box|ctn|carton|bag|bunch|bun|pkt|pack|pc|pcs|unit|units|tray|tub|tin|bottle|case|fresh|frozen|whole|sliced|diced|chopped|peeled|premium|choice|grade|brand|approx)\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const buildSupplierMatchMemoryKey = (row: any, supplierName: string) => {
    const normalizedSupplierName = normalizeSupplierMatchText(supplierName || row?.supplierNameForLearning || row?.supplierName || selectedSupplier?.name || invoiceSpendForm.supplierName || "Unknown Supplier");
    const normalizedCleanName = normalizeSupplierMatchText(
      [row?.cleanedInvoiceName, row?.name, row?.description, row?.itemName, row?.productName, row?.rawLine]
        .filter(Boolean)
        .join(" ")
    );

    if (!normalizedSupplierName || !normalizedCleanName) {
      return "";
    }

    return `${normalizedSupplierName}::${normalizedCleanName}`;
  };

  const getSupplierMatchMemoryEntry = (row: any, supplierName: string) => {
    const supplierMatchKey = buildSupplierMatchMemoryKey(row, supplierName);
    if (!supplierMatchKey) return null;

    const memoryEntry = supplierMatchMemory?.[supplierMatchKey];
    if (!memoryEntry || typeof memoryEntry !== "object" || Array.isArray(memoryEntry)) return null;

    return memoryEntry;
  };

  const autoMatchInvoiceRowToIngredient = (row: any, availableSupplierIngredients: any[]) => {
    if (row?.linkedIngredientId || row?.invoiceMatchManualOverride) {
      return null;
    }

    const rowName = normalizeInvoiceIngredientMatchText(
      [row?.name, row?.description, row?.itemName, row?.productName, row?.rawLine]
        .filter(Boolean)
        .join(" ")
    );
    const rowTokens = getInvoiceIngredientMatchTokens(rowName);

    if (!rowName || rowTokens.length === 0) {
      return null;
    }

    const matches = (availableSupplierIngredients || [])
      .map((ingredient: any) => {
        const ingredientName = normalizeInvoiceIngredientMatchText(ingredient?.name || "");
        const ingredientTokens = getInvoiceIngredientMatchTokens(ingredientName);

        if (!ingredientName || ingredientTokens.length === 0) {
          return null;
        }

        const rowContainsIngredient = rowName.includes(ingredientName) && ingredientName.length >= 4;
        const ingredientContainsRow = ingredientName.includes(rowName) && rowName.length >= 4;
        const sharedTokens = ingredientTokens.filter((token: string) => rowTokens.includes(token));
        const overlapRatio = sharedTokens.length / Math.max(ingredientTokens.length, 1);

        let matchConfidence: "high" | "medium" | "low" = "low";
        let score = sharedTokens.length;

        if ((rowContainsIngredient || ingredientContainsRow) && sharedTokens.length >= 1) {
          matchConfidence = sharedTokens.length >= 2 || ingredientTokens.length <= 2 ? "high" : "medium";
          score += 20;
        } else if (sharedTokens.length >= 2 && overlapRatio >= 0.67) {
          matchConfidence = "medium";
          score += 10;
        } else if (sharedTokens.length >= 3 && overlapRatio >= 0.5) {
          matchConfidence = "medium";
          score += 8;
        }

        return {
          ingredient,
          matchConfidence,
          score,
          sharedTokenCount: sharedTokens.length,
          ingredientTokenCount: ingredientTokens.length,
        };
      })
      .filter(Boolean)
      .filter((match: any) => match.matchConfidence === "high" || match.matchConfidence === "medium")
      .sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.sharedTokenCount !== a.sharedTokenCount) return b.sharedTokenCount - a.sharedTokenCount;
        return a.ingredientTokenCount - b.ingredientTokenCount;
      });

    const bestMatch = matches[0] as any;
    if (!bestMatch?.ingredient?.id) {
      return null;
    }

    return {
      linkedIngredientId: bestMatch.ingredient.id,
      matchedIngredientName: bestMatch.ingredient.name || "",
      matchConfidence: bestMatch.matchConfidence,
      status: "matched",
      confidence: getInvoiceRowConfidence(row, bestMatch.ingredient),
    };
  };

  const applyInvoiceIngredientAutoMatching = (rows: any[], availableSupplierIngredients: any[]) => {
    return applyInvoiceIngredientIntelligence({
      rows,
      availableSupplierIngredients,
      supplierName: String(selectedSupplier?.name || invoiceSpendForm.supplierName || "Unknown Supplier"),
      supplierMatchMemory,
      getInvoiceRowConfidence,
    });
  };

  const buildInvoiceRowsFromTextCandidate = (text: string, supplierName: string, recoverySource: string) => {
    const parsed = parseSupplierInvoiceTextSmart(text, supplierName);
    const enhanced = enhanceInvoiceReviewRows(parsed, supplierIngredients, supplierName).map((row: any) => ({
      ...row,
      invoiceRowRecoverySource: recoverySource,
    }));

    return applyInvoiceIngredientAutoMatching(
      applyInvoiceCogsCategoryDetection(enhanced, supplierName),
      supplierIngredients
    );
  };

  const chooseBestInvoiceRowsFromText = (text: string, supplierName: string) => {
    const cleanedText = cleanInvoiceOcrText(text);
    const priceAnchorCount = getInvoiceRowRecoveryPriceAnchorCount(cleanedText);
    const candidates: any[] = [];

    const addCandidate = (label: string, candidateText: string) => {
      const trimmedText = String(candidateText || "").trim();
      if (!trimmedText) return;

      try {
        const rows = buildInvoiceRowsFromTextCandidate(trimmedText, supplierName, label);
        const meaningfulRows = rows.filter((row: any) => String(row?.name || row?.description || row?.rawLine || "").trim());
        const selectedRows = meaningfulRows.filter((row: any) => row?.selected !== false);
        const matchedRows = meaningfulRows.filter((row: any) => String(row?.linkedIngredientId || "").trim());
        const pricedRows = meaningfulRows.filter((row: any) => safeNumber(row?.lineTotal ?? row?.total ?? row?.amount ?? row?.purchasePrice ?? row?.unitPrice) > 0);

        candidates.push({
          label,
          rows,
          meaningfulCount: meaningfulRows.length,
          selectedCount: selectedRows.length,
          matchedCount: matchedRows.length,
          pricedCount: pricedRows.length,
          score: meaningfulRows.length * 10 + pricedRows.length * 3 + matchedRows.length * 2 + selectedRows.length,
        });
      } catch (error) {
        console.warn(`GP Police invoice row recovery candidate failed: ${label}`, error);
      }
    };

    addCandidate("primary_smart_parser", cleanedText);
    addCandidate("soft_line_break_recovery", splitInvoiceTextWithSoftLineBreaks(cleanedText));
    addCandidate("price_anchor_recovery", rebuildInvoiceTextFromPriceAnchors(cleanedText));

    const bestCandidate = candidates
      .filter((candidate) => Array.isArray(candidate.rows))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.meaningfulCount !== a.meaningfulCount) return b.meaningfulCount - a.meaningfulCount;
        return b.pricedCount - a.pricedCount;
      })[0];

    const fallbackRows = bestCandidate?.rows || [];
    const recoveryUsed = Boolean(bestCandidate && bestCandidate.label !== "primary_smart_parser");
    const expectedRowsFromPrices = Math.max(priceAnchorCount - 2, 0);
    const looksShort = expectedRowsFromPrices >= 8 && fallbackRows.length > 0 && fallbackRows.length < Math.ceil(expectedRowsFromPrices * 0.55);

    const recoveryWarning = looksShort
      ? `GP Police found ${priceAnchorCount} price-like numbers but only built ${fallbackRows.length} rows. Review carefully — this invoice may still be missing merged lines.`
      : recoveryUsed
        ? `Row recovery used ${bestCandidate.label.replace(/_/g, " ")}. Review before locking.`
        : "";

    return {
      rows: fallbackRows,
      recoveryUsed,
      recoveryWarning,
      priceAnchorCount,
      recoverySource: bestCandidate?.label || "primary_smart_parser",
    };
  };

  const runInvoiceOCR = async (file: File) => {
    try {
      const supplierName = selectedSupplier?.name || invoiceSpendForm.supplierName || "Unknown Supplier";

      setSupplierInvoiceRows([]);
      setSupplierInvoiceMessage("Reading invoice…");

      const ocrImage = await preprocessInvoiceImageForOCR(file);
      // @ts-ignore - dynamic browser OCR dependency is loaded at runtime.
      const TesseractModule = await import("tesseract.js");
      const TesseractWorker = (TesseractModule as any).default || TesseractModule;

      const result = await TesseractWorker.recognize(ocrImage, "eng", {
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: "4",
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$.,-/ xX()&%",
        logger: (message: any) => {
          if (message?.status === "recognizing text") {
            setSupplierInvoiceMessage(`Reading invoice… ${Math.round((message.progress || 0) * 100)}%`);
          }
        },
      } as any);

      const extractedText = cleanInvoiceOcrText(result?.data?.text || "");

      if (!extractedText) {
        setSupplierInvoiceText("");
        setSupplierInvoiceRows([]);
        setSupplierInvoiceMessage("No clear invoice rows detected — try a flatter photo or paste text.");
        return;
      }

      setSupplierInvoiceText(extractedText);

      const invoiceRowRecovery = chooseBestInvoiceRowsFromText(extractedText, supplierName);
      const parsedRows = applyInvoiceAutopilotSelection(invoiceRowRecovery.rows);
      setSupplierInvoiceRows(parsedRows as any[]);
      const qualityWarning = [getInvoiceOcrQualityWarning(extractedText, parsedRows), invoiceRowRecovery.recoveryWarning]
        .filter(Boolean)
        .join(" ");
      setInvoiceQualityWarning(qualityWarning);

      if (!parsedRows.length) {
        setSupplierInvoiceMessage(qualityWarning || "Invoice text found, but no clear invoice rows detected — try a flatter photo or paste text.");
        return;
      }

      const autopilotSummary = buildInvoiceAutopilotSummary(parsedRows);
      setSupplierInvoiceMessage(`Invoice text found. ${parsedRows.length} row${parsedRows.length === 1 ? "" : "s"} detected. Auto-selected ${autopilotSummary.selectedRows} safe row(s), left ${autopilotSummary.fixRows} for review.`);
    } catch (err) {
      console.error("GP Police OCR failed", err);
      setSupplierInvoiceRows([]);
      setInvoiceQualityWarning("OCR failed — try a brighter, flatter photo or paste supplier text export.");
      setSupplierInvoiceMessage("OCR failed. Try again with a clearer photo or upload a text/CSV export.");
    }
  };

  const parseInvoiceForSelectedSupplier = () => {
    if (!selectedSupplier?.name) {
      setSupplierInvoiceMessage("Pick a supplier first. GP Police needs to know whose invoice this is.");
      return;
    }
    const invoiceRowRecovery = chooseBestInvoiceRowsFromText(supplierInvoiceText, selectedSupplier.name);
    const rows = applyInvoiceAutopilotSelection(invoiceRowRecovery.rows);
    setSupplierInvoiceRows(rows as any[]);
    const qualityWarning = [getInvoiceOcrQualityWarning(supplierInvoiceText, rows), invoiceRowRecovery.recoveryWarning]
      .filter(Boolean)
      .join(" ");
    setInvoiceQualityWarning(qualityWarning);
    const autopilotSummary = buildInvoiceAutopilotSummary(rows);
    setSupplierInvoiceMessage(rows.length > 0 ? `Invoice text found. ${rows.length} row${rows.length === 1 ? "" : "s"} detected. Auto-selected ${autopilotSummary.selectedRows} safe row(s), left ${autopilotSummary.fixRows} for review.${invoiceRowRecovery.recoveryUsed ? " Row recovery was used." : ""}` : qualityWarning || "No clear invoice rows detected — try a flatter photo or paste text.");
  };

  const refreshInvoiceRowIntelligence = () => {
    const rows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];
    const supplierName = String(selectedSupplier?.name || invoiceSpendForm.supplierName || rows[0]?.supplierName || "Unknown Supplier").trim() || "Unknown Supplier";

    if (!rows.length) {
      setSupplierInvoiceMessage("No invoice rows to re-check yet. Scan or paste an invoice first.");
      return;
    }

    const refreshedRows = applyInvoiceAutopilotSelection(
      applyInvoiceIngredientAutoMatching(
        applyInvoiceCogsCategoryDetection(rows, supplierName),
        supplierIngredients
      )
    );

    const beforeReadyCount = rows.filter((row: any) => {
      const cogsType = getInvoiceRowCogsTypeForApp(row);
      const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
      const status = String(row?.status || "").toLowerCase();
      return cogsType !== "unknown" && (cogsType !== "food_cogs" || linkedIngredientId || status === "create_new" || status === "ignore");
    }).length;

    const afterReadyCount = refreshedRows.filter((row: any) => {
      const cogsType = getInvoiceRowCogsTypeForApp(row);
      const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
      const status = String(row?.status || "").toLowerCase();
      return cogsType !== "unknown" && (cogsType !== "food_cogs" || linkedIngredientId || status === "create_new" || status === "ignore");
    }).length;

    const autopilotSummary = buildInvoiceAutopilotSummary(refreshedRows);

    setSupplierInvoiceRows(refreshedRows as any[]);
    setSupplierInvoiceMessage(
      afterReadyCount > beforeReadyCount
        ? `Re-checked invoice rows. ${afterReadyCount - beforeReadyCount} extra row(s) now look ready. Auto-selected ${autopilotSummary.selectedRows} safe row(s), left ${autopilotSummary.fixRows} for review.`
        : `Re-checked invoice rows with current supplier, COGS, and match memory. Auto-selected ${autopilotSummary.selectedRows} safe row(s), left ${autopilotSummary.fixRows} for review.`
    );
  };

  const handleSupplierInvoiceFileUpload = async (file: File | null) => {
    if (!file) {
      alert("No file selected");
      return;
    }

    if (file.type.startsWith("image/")) {
      if (supplierInvoicePhotoPreviewUrl) {
        URL.revokeObjectURL(supplierInvoicePhotoPreviewUrl);
      }

      setSupplierInvoicePhotoName(file.name || "Invoice photo");
      setSupplierInvoicePhotoPreviewUrl(URL.createObjectURL(file));
      await runInvoiceOCR(file);
      return;
    }

    setSupplierInvoicePhotoName("");
    if (supplierInvoicePhotoPreviewUrl) {
      URL.revokeObjectURL(supplierInvoicePhotoPreviewUrl);
      setSupplierInvoicePhotoPreviewUrl("");
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSupplierInvoiceText(cleanInvoiceOcrText(String(reader.result || "")));
      setSupplierInvoiceRows([]);
      setInvoiceQualityWarning("");
      setSupplierInvoiceMessage("Invoice text found. Hit Scan Invoice Text to detect rows before locking into ingredients.");
    };
    reader.onerror = () => setSupplierInvoiceMessage("Could not read that file. Try pasted invoice text instead.");
    reader.readAsText(file);
  };

  const updateSupplierInvoiceRow = (rowId: string, field: string, value: any) => {
    setSupplierInvoiceRows((previous: any) =>
      previous.map((row: any) => {
        if (row.id !== rowId) return row;

        if (field === "linkedIngredientId") {
          const matchedIngredient = supplierIngredients.find((ingredient: any) => ingredient.id === value);
          if (value && matchedIngredient) {
            learnSupplierMatchFromReviewedRow(row, value);
          }

          return {
            ...row,
            linkedIngredientId: value,
            matchedIngredientName: matchedIngredient?.name || "",
            matchConfidence: value ? "manual" : "",
            invoiceMatchManualOverride: true,
            status: value ? "matched" : "needs_match",
            selected: value ? true : false,
            autopilotSafe: Boolean(value),
            autopilotReason: value ? "Manually linked and learned for next invoice." : "Unlinked manually; review before locking.",
            confidence: value ? getInvoiceRowConfidence(row, matchedIngredient) : row.confidence || "medium",
          };
        }

        const nextRow = { ...row, [field]: value };

        if (field === "cogsCategory" || field === "cogsType") {
          const supplierNameForMemory = String(selectedSupplier?.name || row?.supplierName || invoiceSpendForm.supplierName || "").trim();
          const normalizedType = normalizeInvoiceCogsTypeForApp(value);
          const normalizedCategory = legacyInvoiceCogsCategoryForApp(normalizedType);

          nextRow.cogsType = normalizedType;
          nextRow.category = normalizedType === "food_cogs" ? "Food COGS" : normalizedType === "consumable_cogs" ? "Kitchen consumables / packaging" : normalizedType === "non_cogs" ? "Cleaning / equipment / sundries" : "Needs review";
          nextRow.categoryConfidence = normalizedType === "unknown" ? 25 : 100;
          nextRow.categoryReason = normalizedType === "unknown" ? "Manually marked as needs review." : "Manually reviewed in invoice intake.";
          nextRow.cogsCategory = normalizedCategory;
          nextRow.cogsCategoryManualOverride = true;
          nextRow.cogsCategoryConfidence = normalizedCategory ? "manual" : "";
          nextRow.cogsCategoryReason = normalizedCategory ? "Manually reviewed in invoice intake." : "";

          if (normalizedCategory) {
            saveSupplierCogsMemory(nextRow, supplierNameForMemory, normalizedCategory);
          }

          const safeAfterCategoryReview = getInvoiceRowIsSafeForAutopilot(nextRow);
          nextRow.autopilotSafe = safeAfterCategoryReview;
          nextRow.autopilotReason = safeAfterCategoryReview
            ? "Category reviewed and row is safe enough for auto-selection."
            : "Category reviewed, but row still needs a match, price, or name before locking.";
          nextRow.selected = safeAfterCategoryReview;
        }

        if (["name", "qty", "unitPrice", "lineTotal", "linkedIngredientId"].includes(field)) {
          const matchedIngredient = nextRow.linkedIngredientId ? supplierIngredients.find((ingredient: any) => ingredient.id === nextRow.linkedIngredientId) : null;
          nextRow.confidence = getInvoiceRowConfidence(nextRow, matchedIngredient);
          if (field === "name" && !nextRow.linkedIngredientId && nextRow.status === "matched") nextRow.status = "needs_match";
        }
        return nextRow;
      })
    );
  };

  const handleSaveSupplierMatchMemory = (row: any, ingredientId: string) => {
    const selectedIngredientId = String(ingredientId || "").trim();

    if (!selectedIngredientId) {
      setSupplierInvoiceMessage("Pick a linked ingredient before saving supplier match memory.");
      return;
    }

    const matchedIngredient = supplierIngredients.find((ingredient: any) => String(ingredient?.id || "") === selectedIngredientId);

    if (!matchedIngredient) {
      setSupplierInvoiceMessage("Could not find that ingredient. Check the linked ingredient and try again.");
      return;
    }

    const supplierName = String(row?.supplierNameForLearning || row?.supplierName || selectedSupplier?.name || invoiceSpendForm.supplierName || "Unknown Supplier").trim() || "Unknown Supplier";
    const key = buildSupplierMatchMemoryKey(row, supplierName);

    if (!key) {
      setSupplierInvoiceMessage("No supplier match key found for this row yet. Re-scan the invoice before saving match memory.");
      return;
    }

    const learnedFrom = String(row?.cleanedInvoiceName || row?.name || row?.description || row?.rawLine || "").trim();

    const memoryRecord = {
      linkedIngredientId: selectedIngredientId,
      ingredientName: String(matchedIngredient?.name || ""),
      supplierName,
      learnedFrom,
      learnedAt: new Date().toISOString(),
    };

    setSupplierMatchMemory((previous: Record<string, any>) => ({
      ...(previous && typeof previous === "object" && !Array.isArray(previous) ? previous : {}),
      [key]: memoryRecord,
    }));

    setSupplierInvoiceMessage("Supplier match learned. GP Police will auto-match this item next time.");
  };

  const setSupplierInvoiceRowStatus = (rowId: string, status: "needs_match" | "matched" | "create_new" | "ignore") => {
    setSupplierInvoiceRows((previous: any[]) =>
      previous.map((row: any) => {
        if (row.id !== rowId) return row;
        const createNewIngredient = status === "create_new";
        return {
          ...row,
          status,
          createNewIngredient,
          selected: status !== "ignore",
        };
      })
    );
  };

  const handleSaveInvoiceDraft = () => {
    const now = new Date().toISOString();
    const draft = {
      id: invoiceDraft?.id || `invoice_draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      supplierName: selectedSupplier?.name || supplierInvoiceRows[0]?.supplierName || "",
      invoiceNumber: String(invoiceIntakeMeta.invoiceNumber || "").trim(),
      invoiceDate: String(invoiceIntakeMeta.invoiceDate || new Date().toISOString().slice(0, 10)),
      rawText: supplierInvoiceText,
      rows: supplierInvoiceRows,
      status: "draft",
      createdAt: invoiceDraft?.createdAt || now,
      updatedAt: now,
    };

    safeSetLocalStorageValue(INVOICE_INTAKE_DRAFT_KEY, draft);
    setInvoiceDraft(draft);
    setInvoiceDraftMessage("Invoice draft saved. Review survives refresh.");
  };

  const handleLoadInvoiceDraft = () => {
    const savedDraft = safeParse<any>(
      INVOICE_INTAKE_DRAFT_KEY,
      null,
      (value) => !value || (typeof value === "object" && !Array.isArray(value))
    );

    if (!savedDraft) {
      setInvoiceDraftMessage("No invoice draft found on this device.");
      return;
    }

    setInvoiceDraft(savedDraft);
    setSupplierInvoiceText(String(savedDraft.rawText || ""));
    setSupplierInvoiceRows(Array.isArray(savedDraft.rows) ? savedDraft.rows : []);
    setInvoiceIntakeMeta({
      invoiceNumber: String(savedDraft.invoiceNumber || ""),
      invoiceDate: String(savedDraft.invoiceDate || new Date().toISOString().slice(0, 10)),
    });
    setInvoiceDraftMessage("Latest invoice draft loaded.");
  };

  const handleDeleteInvoiceDraft = () => {
    localStorage.removeItem(INVOICE_INTAKE_DRAFT_KEY);
    setInvoiceDraft(null);
    setInvoiceDraftMessage("Invoice draft deleted.");
  };

  const handleSaveInvoiceSpend = () => {
    const supplierName = String(invoiceSpendForm.supplierName || selectedSupplier?.name || "").trim();
    const date = String(invoiceSpendForm.date || "").trim();
    const totalCost = safeNumber(invoiceSpendForm.totalCost);

    if (!supplierName) {
      setSupplierInvoiceMessage("Add the supplier name first before saving the invoice spend.");
      setInvoiceSpendMessage("Add the supplier name first before saving the invoice spend.");
      return;
    }

    if (!date) {
      setSupplierInvoiceMessage("Add the invoice date first.");
      setInvoiceSpendMessage("Add the invoice date first.");
      return;
    }

    if (totalCost <= 0) {
      setSupplierInvoiceMessage("Add a real invoice total before saving the spend.");
      setInvoiceSpendMessage("Add a real invoice total before saving the spend.");
      return;
    }

    const payload = {
      id: `invoice_spend_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      supplierName,
      date,
      totalCost,
      notes: String(invoiceSpendForm.notes || "").trim(),
      createdAt: new Date().toISOString(),
    };

    createEmergencyBackupSnapshot("save_invoice_spend");

    setInvoiceSpendRecords((previous: any[]) => [...previous, payload]);
    setInvoiceSpendForm({
      supplierName: selectedSupplier?.name || "",
      date: new Date().toISOString().slice(0, 10),
      totalCost: "",
      notes: "",
    });
    setSupplierInvoiceMessage("Invoice spend saved. Weekly damage updated.");
    setInvoiceSpendMessage("Invoice spend saved. Weekly damage updated.");
  };

  const deleteInvoiceSpendRecord = (invoiceId: string) => {
    const confirmed = window.confirm("Delete this invoice spend record?");
    if (!confirmed) return;
    createEmergencyBackupSnapshot("delete_invoice_spend");

    setInvoiceSpendRecords((previous: any[]) => previous.filter((record: any) => record.id !== invoiceId));
    setInvoiceSpendMessage("Invoice record deleted.");
  };

  const buildSupplierIngredientFromInvoiceRow = (row: any, supplierName: string) => {
    const name = String(row?.name || "").trim();
    const purchasePrice = safeNumber(row?.purchasePrice || row?.lineTotal || row?.unitPrice);

    if (!name || purchasePrice <= 0) {
      return null;
    }

    const purchaseUnit = String(row?.purchaseUnit || "box").trim() || "box";
    const amountInPurchaseUnit = String(row?.amountInPurchaseUnit || "1").trim() || "1";
    const sizePerItem = String(row?.sizePerItem || "1").trim() || "1";
    const sizeUnit = sizeUnitOptions.includes(String(row?.sizeUnit || "")) ? String(row.sizeUnit) : "each";
    const baseQuantity = toBaseUnit(safeNumber(amountInPurchaseUnit) * safeNumber(sizePerItem), sizeUnit);
    const baseUnit = baseUnitFromSizeUnit(sizeUnit);
    const now = new Date().toISOString();

    return {
      id: `ingredient_invoice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      purchasePrice: String(purchasePrice),
      purchaseUnit,
      amountInPurchaseUnit,
      sizePerItem,
      sizeUnit,
      supplierName,
      supplierUnitCost: String(purchasePrice),
      supplierPackSize: `${amountInPurchaseUnit} x ${sizePerItem} ${sizeUnit}`,
      baseQuantity,
      baseUnit,
      unitType: unitTypeFromUnit(sizeUnit),
      createdAt: now,
      updatedAt: now,
    };
  };



  const getInvoiceRowPurchasePrice = (row: any) => {
    const qty = Math.max(safeNumber(row?.qty), 1);
    const unitPrice = safeNumber(row?.unitPrice);
    const lineTotal = safeNumber(row?.lineTotal || row?.purchasePrice);

    if (unitPrice > 0) return unitPrice;
    if (lineTotal > 0 && qty > 0) return lineTotal / qty;
    return lineTotal;
  };

  const getInvoiceRowLineTotal = (row: any) => {
    const qty = Math.max(safeNumber(row?.qty), 1);
    const lineTotal = safeNumber(row?.lineTotal || row?.purchasePrice);
    const unitPrice = safeNumber(row?.unitPrice);

    if (lineTotal > 0) return lineTotal;
    if (unitPrice > 0) return unitPrice * qty;
    return 0;
  };



  const getInvoiceRowIsSafeForAutopilot = (row: any) => {
    const cogsType = getInvoiceRowCogsTypeForApp(row);
    const status = String(row?.status || "").trim().toLowerCase();
    const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
    const matchConfidence = String(row?.matchConfidence || row?.confidence || row?.cogsCategoryConfidence || "").trim().toLowerCase();
    const lineTotal = getInvoiceRowLineTotal(row);

    if (status === "ignore") return false;
    if (!String(row?.name || row?.description || row?.rawLine || "").trim()) return false;
    if (lineTotal <= 0) return false;
    if (!cogsType || cogsType === "unknown") return false;

    if (cogsType === "food_cogs") {
      if (!linkedIngredientId && status !== "create_new") return false;
      return ["high", "learned", "manual"].includes(matchConfidence) || Boolean(linkedIngredientId);
    }

    if (cogsType === "consumable_cogs" || cogsType === "non_cogs") {
      return true;
    }

    return false;
  };

  const applyInvoiceAutopilotSelection = (rows: any[]) => {
    return (Array.isArray(rows) ? rows : []).map((row: any) => {
      const safeForAutopilot = getInvoiceRowIsSafeForAutopilot(row);
      const status = String(row?.status || "").trim().toLowerCase();

      return {
        ...row,
        selected: status === "ignore" ? false : safeForAutopilot,
        autopilotSafe: safeForAutopilot,
        autopilotReason: safeForAutopilot
          ? "Auto-selected because category, price, and matching are safe enough."
          : "Left unselected for review before locking.",
      };
    });
  };

  const buildInvoiceAutopilotSummary = (rows: any[]) => {
    return (Array.isArray(rows) ? rows : []).reduce(
      (summary: any, row: any) => {
        const cogsType = getInvoiceRowCogsTypeForApp(row);
        const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
        const status = String(row?.status || "").trim().toLowerCase();
        const safeForAutopilot = Boolean(row?.autopilotSafe || getInvoiceRowIsSafeForAutopilot(row));

        summary.totalRows += 1;
        if (safeForAutopilot) summary.safeRows += 1;
        if (!safeForAutopilot) summary.fixRows += 1;
        if (cogsType === "unknown") summary.unknownRows += 1;
        if (cogsType === "food_cogs" && !linkedIngredientId && status !== "create_new" && status !== "ignore") summary.unmatchedFoodRows += 1;
        if (row?.selected) summary.selectedRows += 1;
        return summary;
      },
      { totalRows: 0, safeRows: 0, fixRows: 0, unknownRows: 0, unmatchedFoodRows: 0, selectedRows: 0 }
    );
  };

  const learnSupplierMatchFromReviewedRow = (row: any, ingredientId: string) => {
    const selectedIngredientId = String(ingredientId || "").trim();
    if (!selectedIngredientId) return false;

    const matchedIngredient = supplierIngredients.find((ingredient: any) => String(ingredient?.id || "") === selectedIngredientId);
    if (!matchedIngredient) return false;

    const supplierName = String(row?.supplierNameForLearning || row?.supplierName || selectedSupplier?.name || invoiceSpendForm.supplierName || "Unknown Supplier").trim() || "Unknown Supplier";
    const key = buildSupplierMatchMemoryKey(row, supplierName);
    if (!key) return false;

    const learnedFrom = String(row?.cleanedInvoiceName || row?.name || row?.description || row?.rawLine || "").trim();

    const memoryRecord = {
      linkedIngredientId: selectedIngredientId,
      ingredientName: String(matchedIngredient?.name || ""),
      supplierName,
      learnedFrom,
      learnedAt: new Date().toISOString(),
      source: "auto_review_link",
    };

    setSupplierMatchMemory((previous: Record<string, any>) => ({
      ...(previous && typeof previous === "object" && !Array.isArray(previous) ? previous : {}),
      [key]: memoryRecord,
    }));

    return true;
  };

  const buildInvoiceIngredientPricingPatch = (row: any) => {
    const purchasePrice = getInvoiceRowPurchasePrice(row);
    const purchaseUnit = String(row?.purchaseUnit || "box").trim() || "box";
    const amountInPurchaseUnit = String(row?.amountInPurchaseUnit || "1").trim() || "1";
    const sizePerItem = String(row?.sizePerItem || "1").trim() || "1";
    const sizeUnit = sizeUnitOptions.includes(String(row?.sizeUnit || "")) ? String(row.sizeUnit) : "each";
    const baseQuantity = toBaseUnit(safeNumber(amountInPurchaseUnit) * safeNumber(sizePerItem), sizeUnit);
    const baseUnit = baseUnitFromSizeUnit(sizeUnit);
    const supplierPackSize = `${amountInPurchaseUnit} x ${sizePerItem} ${sizeUnit}`;

    return {
      purchasePrice: String(purchasePrice),
      purchaseUnit,
      amountInPurchaseUnit,
      sizePerItem,
      sizeUnit,
      supplierUnitCost: String(purchasePrice),
      supplierPackSize,
      baseQuantity,
      baseUnit,
      unitType: unitTypeFromUnit(sizeUnit),
      updatedAt: new Date().toISOString(),
    };
  };

  const getInvoiceRowQuantityBase = (row: any) => {
    const qty = Math.max(safeNumber(row?.qty), 1);
    const amountInPurchaseUnit = safeNumber(row?.amountInPurchaseUnit || 1);
    const sizePerItem = safeNumber(row?.sizePerItem || 1);
    const sizeUnit = sizeUnitOptions.includes(String(row?.sizeUnit || "")) ? String(row.sizeUnit) : "each";
    return toBaseUnit(qty * amountInPurchaseUnit * sizePerItem, sizeUnit);
  };

  const getCurrentInvoiceDraftForLock = () => {
    return {
      ...(invoiceDraft || {}),
      id: invoiceDraft?.id || `invoice_draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      supplierName: selectedSupplier?.name || invoiceDraft?.supplierName || supplierInvoiceRows[0]?.supplierName || "",
      invoiceNumber: String(invoiceIntakeMeta.invoiceNumber || invoiceDraft?.invoiceNumber || "").trim(),
      invoiceDate: String(invoiceIntakeMeta.invoiceDate || invoiceDraft?.invoiceDate || new Date().toISOString().slice(0, 10)),
      rawText: supplierInvoiceText,
      rows: supplierInvoiceRows,
      status: invoiceDraft?.status || "draft",
      createdAt: invoiceDraft?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const invoiceLockSummary = useMemo(() => {
    const rows = Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : [];
    const activeRows = rows.filter((row: any) => row?.selected !== false && row?.status !== "ignore");
    const validRows = activeRows.filter((row: any) => getInvoiceRowLineTotal(row) > 0);
    const matchedRows = activeRows.filter((row: any) => row?.status === "matched" && row?.linkedIngredientId);
    const createNewRows = activeRows.filter((row: any) => row?.status === "create_new" || row?.createNewIngredient);
    const ignoredRows = rows.filter((row: any) => row?.status === "ignore" || row?.selected === false);
    const needsAttentionRows = activeRows.filter((row: any) => row?.status === "needs_match" || (!row?.linkedIngredientId && !(row?.status === "create_new" || row?.createNewIngredient)));
    const estimatedTotal = validRows.reduce((sum: number, row: any) => sum + getInvoiceRowLineTotal(row), 0);

    return {
      selectedCount: activeRows.length,
      validCount: validRows.length,
      matchedCount: matchedRows.length,
      createNewCount: createNewRows.length,
      ignoredCount: ignoredRows.length,
      needsAttentionCount: needsAttentionRows.length,
      estimatedTotal,
      isLocked: invoiceDraft?.status === "locked",
    };
  }, [supplierInvoiceRows, invoiceDraft]);

  const isDuplicateLockedInvoice = (supplierName: string, invoiceDate: string, invoiceNumber: string, invoiceTotal: number) => {
    const normalizedSupplier = normalizeLooseText(supplierName);
    const normalizedInvoice = String(invoiceNumber || "").trim().toLowerCase();
    return invoiceSpendRecords.some((record: any) => {
      const sameSupplier = normalizeLooseText(record?.supplierName || "") === normalizedSupplier;
      const sameDate = String(record?.date || record?.invoiceDate || "").slice(0, 10) === invoiceDate;
      const sameInvoice = normalizedInvoice && String(record?.invoiceNumber || "").trim().toLowerCase() === normalizedInvoice;
      const sameTotal = Math.abs(safeNumber(record?.totalCost) - safeNumber(invoiceTotal)) < 0.01;
      return sameSupplier && ((sameInvoice && sameDate) || (!normalizedInvoice && sameDate && sameTotal));
    });
  };

  const handleLockInvoiceIntoStock = () => {
    const draftToLock = getCurrentInvoiceDraftForLock();
    const supplierName = String(draftToLock.supplierName || "").trim();
    const invoiceDate = String(draftToLock.invoiceDate || "").trim();
    const invoiceNumber = String(draftToLock.invoiceNumber || "").trim();
    const rows = Array.isArray(draftToLock.rows) ? draftToLock.rows : [];
    const rowsToLock = rows
      .filter((row: any) => row?.selected !== false && row?.status !== "ignore")
      .map((row: any) => ({ ...row }));

    if (!supplierName) {
      setSupplierInvoiceMessage("Pick a supplier before locking invoice stock in.");
      return;
    }

    if (!invoiceDate) {
      setSupplierInvoiceMessage("Add an invoice date before locking invoice stock in.");
      return;
    }

    if (rows.length === 0 || rowsToLock.length === 0) {
      setSupplierInvoiceMessage("No selected invoice rows to lock. Select the reviewed rows first.");
      return;
    }

    if (draftToLock.status === "locked") {
      setSupplierInvoiceMessage("This invoice is already locked into stock. No double dipping.");
      return;
    }

    const unknownCogsRows = rowsToLock.filter((row: any) => {
      const cogsType = getInvoiceRowCogsTypeForApp(row);
      return !cogsType || cogsType === "unknown";
    });

    const foodRowsMissingIngredient = rowsToLock.filter((row: any) => {
      const cogsType = getInvoiceRowCogsTypeForApp(row);
      const status = String(row?.status || "").trim().toLowerCase();
      const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
      return cogsType === "food_cogs" && !linkedIngredientId && status !== "create_new";
    });

    const rowsMissingName = rowsToLock.filter((row: any) => !String(row?.name || "").trim());
    const rowsMissingLineTotal = rowsToLock.filter((row: any) => getInvoiceRowLineTotal(row) <= 0);

    const blockingMessages: string[] = [];

    if (unknownCogsRows.length > 0) {
      blockingMessages.push(`${unknownCogsRows.length} selected row${unknownCogsRows.length === 1 ? " is" : "s are"} still Unknown / Needs Review. Mark each one as Food COGS, Consumable COGS, or Non-COGS.`);
    }

    if (foodRowsMissingIngredient.length > 0) {
      blockingMessages.push(`${foodRowsMissingIngredient.length} selected food row${foodRowsMissingIngredient.length === 1 ? " has" : "s have"} no ingredient match. Link it, mark Create New, or change it to Consumable/Non-COGS if it is not food.`);
    }

    if (rowsMissingName.length > 0) {
      blockingMessages.push(`${rowsMissingName.length} selected row${rowsMissingName.length === 1 ? " is" : "s are"} missing an item name. Add a name or ignore the row.`);
    }

    if (rowsMissingLineTotal.length > 0) {
      blockingMessages.push(`${rowsMissingLineTotal.length} selected row${rowsMissingLineTotal.length === 1 ? " is" : "s are"} missing a line total. Add the line total or ignore the row.`);
    }

    if (blockingMessages.length > 0) {
      const message = `Invoice lock blocked. Fix these before locking:

${blockingMessages.map((item) => `• ${item}`).join("\n")}`;
      window.alert(message);
      setSupplierInvoiceMessage(message);
      return;
    }

    const foodRowsToLock = rowsToLock.filter((row: any) => getInvoiceRowCogsTypeForApp(row) === "food_cogs");
    const consumableRowsToLock = rowsToLock.filter((row: any) => getInvoiceRowCogsTypeForApp(row) === "consumable_cogs");
    const nonCogsRowsToLock = rowsToLock.filter((row: any) => getInvoiceRowCogsTypeForApp(row) === "non_cogs");

    const priceSpikeRows = foodRowsToLock.filter((row: any) => {
      const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
      const matchedIngredientName = String(row?.matchedIngredientName || "").trim().toLowerCase();
      if (!linkedIngredientId && !matchedIngredientName) return false;

      const matchedIngredient = supplierIngredients.find((ingredient: any) => {
        if (linkedIngredientId && String(ingredient?.id || "") === linkedIngredientId) return true;
        if (matchedIngredientName && String(ingredient?.name || "").trim().toLowerCase() === matchedIngredientName) return true;
        return false;
      });

      if (!matchedIngredient) return false;

      const invoiceUnitPrice = safeNumber(row?.unitPrice);
      const invoiceLineTotal = safeNumber(row?.lineTotal || row?.purchasePrice);
      const knownPurchasePrice = safeNumber(matchedIngredient?.purchasePrice || matchedIngredient?.lastPurchasePrice);
      const invoicePrice = invoiceUnitPrice > 0 ? invoiceUnitPrice : invoiceLineTotal > 0 ? invoiceLineTotal : 0;

      if (knownPurchasePrice <= 0 || invoicePrice <= 0) return false;
      return ((invoicePrice - knownPurchasePrice) / knownPurchasePrice) * 100 >= 15;
    });

    const warningMessages: string[] = [];
    if (consumableRowsToLock.length > 0) {
      warningMessages.push(`${consumableRowsToLock.length} consumable row${consumableRowsToLock.length === 1 ? " is" : "s are"} selected. They will be recorded separately and will not touch food GP.`);
    }
    if (nonCogsRowsToLock.length > 0) {
      warningMessages.push(`${nonCogsRowsToLock.length} non-COGS row${nonCogsRowsToLock.length === 1 ? " is" : "s are"} selected. They will be kept out of food GP and stock movements.`);
    }
    if (priceSpikeRows.length > 0) {
      warningMessages.push(`${priceSpikeRows.length} matched food row${priceSpikeRows.length === 1 ? " has" : "s have"} a supplier price spike of +15% or more. Review price warnings before committing.`);
    }

    if (warningMessages.length > 0) {
      const continueWithWarnings = window.confirm(`Invoice lock warning:

${warningMessages.map((item) => `• ${item}`).join("\n")}

Continue locking this invoice?`);
      if (!continueWithWarnings) {
        setSupplierInvoiceMessage("Invoice not locked. Review the warning rows before continuing.");
        return;
      }
    }

    const missingIngredientRows = foodRowsToLock.filter(
      (row: any) => row?.linkedIngredientId && !supplierIngredients.some((ingredient: any) => ingredient.id === row.linkedIngredientId)
    );
    if (missingIngredientRows.length > 0) {
      setSupplierInvoiceMessage("One or more matched food rows point to missing ingredients. Re-match them before locking.");
      return;
    }

    const invoiceTotal = rowsToLock.reduce((sum: number, row: any) => sum + getInvoiceRowLineTotal(row), 0);
    if (invoiceTotal <= 0) {
      setSupplierInvoiceMessage("Some rows still need review before locking. Fix, match, or ignore them first.");
      return;
    }

    if (isDuplicateLockedInvoice(supplierName, invoiceDate, invoiceNumber, invoiceTotal)) {
      const continueDuplicate = window.confirm("This invoice looks like it may already be locked. Continue anyway?");
      if (!continueDuplicate) {
        setSupplierInvoiceMessage("Duplicate-looking invoice not locked. Check locked invoice history before continuing.");
        return;
      }
    }

    const confirmed = window.confirm(`🚔 Lock ${rowsToLock.length} selected invoice row${rowsToLock.length === 1 ? "" : "s"} from ${supplierName}? Food rows will update ingredients and stock. Consumables and non-COGS will be recorded separately without touching food GP.`);
    if (!confirmed) return;

    createEmergencyBackupSnapshot("lock_invoice_intake_v2_review_commit");

    const now = new Date().toISOString();
    const invoiceId = draftToLock.id || `invoice_draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const createdIngredients: any[] = [];
    const existingIngredientPatches: Record<string, any> = {};

    foodRowsToLock.forEach((row: any) => {
      const wantsCreate = row?.status === "create_new" || row?.createNewIngredient || !row?.linkedIngredientId;
      if (wantsCreate && !row?.linkedIngredientId) {
        const invoiceBuiltIngredient: any = buildSupplierIngredientFromInvoiceRow(row, supplierName);

        const nextIngredient = invoiceBuiltIngredient
          ? {
              ...invoiceBuiltIngredient,
              createdFromInvoice: true,
              needsReview: true,
              notes: String(invoiceBuiltIngredient.notes || "").trim() || "Auto-created from invoice",
            }
          : null;

        if (nextIngredient) {
          const normalizedNewName = normalizeLooseText(nextIngredient.name);
          const duplicateIngredient = supplierIngredients.find((ingredient: any) => {
            const ingredientSupplierName = String(ingredient?.supplierName || orderingMeta?.[ingredient.id]?.supplierName || "").trim();
            return normalizeLooseText(ingredient?.name || "") === normalizedNewName && ingredientSupplierName.toLowerCase() === supplierName.toLowerCase();
          });

          if (duplicateIngredient) {
            row.linkedIngredientId = duplicateIngredient.id;
            row.matchedIngredientName = duplicateIngredient.name;
            row.status = "matched";
            row.confidence = "high";
            existingIngredientPatches[duplicateIngredient.id] = buildInvoiceIngredientPricingPatch(row);
          } else {
            createdIngredients.push(nextIngredient);
            row.linkedIngredientId = nextIngredient.id;
            row.matchedIngredientName = nextIngredient.name;
            row.status = "matched";
            row.confidence = "high";
          }
        }
        return;
      }

      if (row?.linkedIngredientId) {
        existingIngredientPatches[row.linkedIngredientId] = buildInvoiceIngredientPricingPatch(row);
      }
    });

    const lockedFoodRows = foodRowsToLock.filter((row: any) => row?.linkedIngredientId);
    if (lockedFoodRows.length !== foodRowsToLock.length) {
      setSupplierInvoiceMessage("Some selected food rows still need an ingredient match before locking. Match them, create them, or mark them as consumables if they are not food.");
      return;
    }

    const lockedRows = [...lockedFoodRows, ...consumableRowsToLock, ...nonCogsRowsToLock];

    const invoiceDamageSummary = lockedRows.reduce(
      (summary: any, row: any) => {
        const linkedIngredientId = String(row?.linkedIngredientId || "").trim();
        const matchedIngredientName = String(row?.matchedIngredientName || "").trim().toLowerCase();

        if (!linkedIngredientId && !matchedIngredientName) return summary;

        const matchedIngredient = supplierIngredients.find((ingredient: any) => {
          if (linkedIngredientId && String(ingredient?.id || "") === linkedIngredientId) return true;
          if (matchedIngredientName && String(ingredient?.name || "").trim().toLowerCase() === matchedIngredientName) return true;
          return false;
        });

        if (!matchedIngredient) return summary;

        const invoiceUnitPrice = safeNumber(row?.unitPrice);
        const invoiceLineTotal = safeNumber(row?.lineTotal || row?.purchasePrice);
        const knownPurchasePrice = safeNumber(matchedIngredient?.purchasePrice || matchedIngredient?.lastPurchasePrice);
        const invoicePrice = invoiceUnitPrice > 0 ? invoiceUnitPrice : invoiceLineTotal > 0 ? invoiceLineTotal : 0;

        if (knownPurchasePrice <= 0 || invoicePrice <= 0) return summary;

        const percentIncrease = ((invoicePrice - knownPurchasePrice) / knownPurchasePrice) * 100;
        const lineValue = getInvoiceRowLineTotal(row);

        if (percentIncrease >= 25) {
          summary.marginKillerTotal += lineValue;
        } else if (percentIncrease >= 15) {
          summary.priceSpikeTotal += lineValue;
        } else if (percentIncrease >= 8) {
          summary.priceRiseTotal += lineValue;
        }

        summary.totalDamage = summary.marginKillerTotal + summary.priceSpikeTotal + summary.priceRiseTotal;
        return summary;
      },
      {
        marginKillerTotal: 0,
        priceSpikeTotal: 0,
        priceRiseTotal: 0,
        totalDamage: 0,
      }
    );

    const ingredientLookupAfterCreate: Record<string, any> = {};
    supplierIngredients.forEach((ingredient: any) => {
      ingredientLookupAfterCreate[ingredient.id] = ingredient;
    });
    createdIngredients.forEach((ingredient: any) => {
      ingredientLookupAfterCreate[ingredient.id] = ingredient;
    });

    const nextStockMovements = lockedFoodRows.map((row: any) => {
      const linkedIngredient = ingredientLookupAfterCreate[row.linkedIngredientId];
      const pricingPatch = buildInvoiceIngredientPricingPatch(row);
      const quantityBase = getInvoiceRowQuantityBase(row);
      const totalCost = getInvoiceRowLineTotal(row);
      const unitCost = quantityBase > 0 ? totalCost / quantityBase : 0;

      return {
        id: `stock_move_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ingredientId: row.linkedIngredientId,
        ingredientName: linkedIngredient?.name || row.name || "Invoice ingredient",
        qty: safeNumber(row?.qty) || 1,
        unit: row?.unit || pricingPatch.purchaseUnit || "each",
        type: "invoice_in",
        date: invoiceDate,
        supplier: supplierName,
        supplierName,
        invoiceId,
        invoiceNumber,
        quantityBase,
        baseUnit: pricingPatch.baseUnit,
        purchaseUnit: pricingPatch.purchaseUnit,
        unitCost,
        totalCost,
        createdAt: now,
      };
    });

    setSupplierIngredients((previous: any[]) => {
      const updatedExisting = previous.map((ingredient: any) => {
        const patch = existingIngredientPatches[ingredient.id];
        return patch ? { ...ingredient, ...patch } : ingredient;
      });
      const nextIngredients = [...updatedExisting, ...createdIngredients];
      try {
        safeSetLocalStorageValue(STORAGE_KEYS.INGREDIENTS, nextIngredients);
      } catch (error) {
        console.warn("GP Police immediate invoice ingredient save failed", error);
      }
      return nextIngredients;
    });

    setStockMovements((previous: any[]) => [...previous, ...nextStockMovements]);

    setOrderingMeta((previous: any) => {
      const next = { ...(previous || {}) };
      nextStockMovements.forEach((movement: any) => {
        const existing = next[movement.ingredientId] || {};
        next[movement.ingredientId] = {
          ...existing,
          supplierName: existing.supplierName || movement.supplierName,
          onHand: safeNumber(existing.onHand) + safeNumber(movement.quantityBase),
        };
      });
      return next;
    });

    const invoiceSpendRecord = {
      id: `invoice_spend_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      invoiceId,
      invoiceNumber,
      supplierName,
      date: invoiceDate,
      totalCost: invoiceTotal,
      foodCogsTotal: lockedFoodRows.reduce((sum: number, row: any) => sum + getInvoiceRowLineTotal(row), 0),
      consumableCogsTotal: consumableRowsToLock.reduce((sum: number, row: any) => sum + getInvoiceRowLineTotal(row), 0),
      nonCogsTotal: nonCogsRowsToLock.reduce((sum: number, row: any) => sum + getInvoiceRowLineTotal(row), 0),
      type: "invoice",
      notes: `Locked from Invoice Intake V3. Food rows: ${lockedFoodRows.length}. Consumable rows: ${consumableRowsToLock.length}. Non-COGS rows: ${nonCogsRowsToLock.length}.`,
      createdAt: now,
    };

    setInvoiceSpendRecords((previous: any[]) => [...previous, invoiceSpendRecord]);

    const invoiceLockSuccessReportPayload = {
      invoiceNumber: invoiceNumber || "No invoice #",
      supplierName,
      lockDate: now,
      invoiceDate,
      selectedRowCount: rowsToLock.length,
      foodCogsTotal: lockedFoodRows.reduce((sum: number, row: any) => sum + getInvoiceRowLineTotal(row), 0),
      consumablesTotal: consumableRowsToLock.reduce((sum: number, row: any) => sum + getInvoiceRowLineTotal(row), 0),
      nonCogsTotal: nonCogsRowsToLock.reduce((sum: number, row: any) => sum + getInvoiceRowLineTotal(row), 0),
      unknownTotal: rowsToLock
        .filter((row: any) => getInvoiceRowCogsTypeForApp(row) === "unknown")
        .reduce((sum: number, row: any) => sum + getInvoiceRowLineTotal(row), 0),
      matchedFoodRows: lockedFoodRows.filter((row: any) => String(row?.linkedIngredientId || "").trim()).length,
      createNewFoodRows: createdIngredients.length,
      ignoredRows: rows.filter((row: any) => row?.status === "ignore" || row?.selected === false).length,
      stockMovementsCreatedCount: nextStockMovements.length,
    };
    setInvoiceLockSuccessReport(invoiceLockSuccessReportPayload);

    const damageHistoryEntry = {
      id: `damage_history_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: invoiceDate,
      supplierName,
      marginKillerTotal: invoiceDamageSummary.marginKillerTotal,
      priceSpikeTotal: invoiceDamageSummary.priceSpikeTotal,
      priceRiseTotal: invoiceDamageSummary.priceRiseTotal,
      totalDamage: invoiceDamageSummary.totalDamage,
    };

    setDamageHistory((previous: any[]) => {
      const nextDamageHistory = [damageHistoryEntry, ...(Array.isArray(previous) ? previous : [])].slice(0, 100);
      try {
        safeSetLocalStorageValue(DAMAGE_HISTORY_STORAGE_KEY, nextDamageHistory);
      } catch (error) {
        console.warn("GP Police damage history save failed", error);
      }
      return nextDamageHistory;
    });

    setLockedInvoiceHistory((previous: any[]) => [
      {
        ...invoiceSpendRecord,
        rowCount: lockedRows.length,
        rows: lockedRows.map((row: any) => ({
          id: row.id,
          name: row.name,
          code: row.code || "",
          qty: row.qty,
          unit: row.unit,
          lineTotal: getInvoiceRowLineTotal(row),
          cogsType: getInvoiceRowCogsTypeForApp(row),
          category: row.category || "",
          categoryConfidence: row.categoryConfidence || "",
          categoryReason: row.categoryReason || "",
          cogsCategory: row.cogsCategory || legacyInvoiceCogsCategoryForApp(row.cogsType || row.cogsCategory),
          cogsCategoryConfidence: row.cogsCategoryConfidence || "",
          cogsCategoryReason: row.cogsCategoryReason || "",
          linkedIngredientId: row.linkedIngredientId || "",
          matchedIngredientName: row.matchedIngredientName || ingredientLookupAfterCreate[row.linkedIngredientId]?.name || "",
          rawLine: row.rawLine || "",
        })),
      },
      ...previous,
    ].slice(0, 25));

    const lockedDraft = {
      ...draftToLock,
      rows: rows.map((row: any) => {
        const lockedRow = lockedRows.find((item: any) => item.id === row.id);
        return lockedRow ? { ...lockedRow, status: "matched", selected: true } : row;
      }),
      status: "locked",
      lockedAt: now,
      updatedAt: now,
    };

    safeSetLocalStorageValue(INVOICE_INTAKE_DRAFT_KEY, lockedDraft);
    setInvoiceDraft(lockedDraft);
    setInvoiceDraftMessage("Invoice locked. GP updated for food rows. Consumables and non-COGS recorded separately. You're in control 👮‍♂️");
    setSupplierInvoiceMessage(`Invoice locked. ${createdIngredients.length} food ingredient${createdIngredients.length === 1 ? "" : "s"} auto-created. ${lockedFoodRows.length} food row${lockedFoodRows.length === 1 ? "" : "s"} posted to stock. ${consumableRowsToLock.length} consumable row${consumableRowsToLock.length === 1 ? "" : "s"} and ${nonCogsRowsToLock.length} non-COGS row${nonCogsRowsToLock.length === 1 ? "" : "s"} recorded without touching ingredients.`);

    localStorage.removeItem(INVOICE_INTAKE_DRAFT_KEY);
    setSupplierInvoiceRows([]);
    setSupplierInvoiceText("");
    setInvoiceQualityWarning("");
    setInvoiceFixingRowId(null);
    setInvoiceDraft(null);
    setSupplierInvoicePhotoName("");
    if (supplierInvoicePhotoPreviewUrl) {
      URL.revokeObjectURL(supplierInvoicePhotoPreviewUrl);
      setSupplierInvoicePhotoPreviewUrl("");
    }
  };

  const importSelectedInvoiceLinesToIngredients = (_rowsToImport: any[], _options: { clearRows?: boolean; backupReason?: string } = {}) => {
    setSupplierInvoiceMessage("Bulk invoice import is locked for safety. Use Create Ingredient From Row on reviewed rows marked Create New.");
    return 0;
  };

  const handleCreateIngredientFromInvoiceRow = (rowId: string) => {
    const supplierName = String(selectedSupplier?.name || "").trim();
    if (!supplierName) {
      setSupplierInvoiceMessage("Pick a supplier first before creating an ingredient from an invoice row.");
      return;
    }

    const rowToCreate = supplierInvoiceRows.find((row: any) => row.id === rowId);
    if (!rowToCreate) {
      setSupplierInvoiceMessage("Could not find that invoice row. Scan or load the draft again.");
      return;
    }

    if (rowToCreate.status !== "create_new") {
      setSupplierInvoiceMessage("Mark the row as Create New before creating an ingredient.");
      return;
    }

    const cogsCategory = String(rowToCreate?.cogsCategory || "unknown").trim().toLowerCase();
    if (cogsCategory !== "food") {
      setSupplierInvoiceMessage("Only Food COGS rows can create recipe ingredients. Consumables and unknown rows stay out of recipes.");
      return;
    }

    const cleanName = String(rowToCreate?.name || "").replace(/\s+/g, " ").trim();
    const qty = safeNumber(rowToCreate?.qty);
    const unitPrice = safeNumber(rowToCreate?.unitPrice);
    const lineTotal = safeNumber(rowToCreate?.lineTotal || rowToCreate?.purchasePrice);

    if (!cleanName) {
      setSupplierInvoiceMessage("Add an item name before creating an ingredient from this invoice row.");
      return;
    }

    if (qty <= 0) {
      setSupplierInvoiceMessage("Add a real quantity before creating an ingredient from this invoice row.");
      return;
    }

    if (unitPrice <= 0 && lineTotal <= 0) {
      setSupplierInvoiceMessage("Add a unit price or line total before creating an ingredient from this invoice row.");
      return;
    }

    const purchasePrice = unitPrice > 0 ? unitPrice : lineTotal / qty;
    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
      setSupplierInvoiceMessage("That row needs a usable price before GP Police can build the ingredient.");
      return;
    }

    const normalizedNewName = normalizeLooseText(cleanName);
    const duplicateIngredient = supplierIngredients.find((ingredient: any) => {
      const ingredientSupplierName = String(ingredient?.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim();
      return (
        normalizeLooseText(ingredient?.name || "") === normalizedNewName &&
        ingredientSupplierName.toLowerCase() === supplierName.toLowerCase()
      );
    });

    if (duplicateIngredient) {
      setSupplierInvoiceMessage("Ingredient already exists — link instead");
      setSupplierInvoiceRows((previous: any[]) =>
        previous.map((row: any) =>
          row.id === rowId
            ? {
                ...row,
                linkedIngredientId: duplicateIngredient.id,
                matchedIngredientName: duplicateIngredient.name,
                matchConfidence: "high",
                status: "matched",
                selected: true,
                confidence: getInvoiceRowConfidence(row, duplicateIngredient),
              }
            : row
        )
      );
      return;
    }

    const purchaseUnit = String(rowToCreate?.unit || rowToCreate?.purchaseUnit || "each").trim() || "each";
    const amountInPurchaseUnit = String(rowToCreate?.amountInPurchaseUnit || "1").trim() || "1";
    const sizePerItem = String(rowToCreate?.sizePerItem || "1").trim() || "1";
    const sizeUnit = sizeUnitOptions.includes(String(rowToCreate?.sizeUnit || "")) ? String(rowToCreate.sizeUnit) : "each";
    const baseQuantity = toBaseUnit(safeNumber(amountInPurchaseUnit) * safeNumber(sizePerItem), sizeUnit);
    const baseUnit = baseUnitFromSizeUnit(sizeUnit);
    const now = new Date().toISOString();

    const nextIngredient = {
      id: `ingredient_invoice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      purchasePrice: String(purchasePrice),
      purchaseUnit,
      amountInPurchaseUnit,
      sizePerItem,
      sizeUnit,
      supplierName,
      supplierUnitCost: String(purchasePrice),
      supplierPackSize: `${amountInPurchaseUnit} x ${sizePerItem} ${sizeUnit}`,
      baseQuantity,
      baseUnit,
      unitType: unitTypeFromUnit(sizeUnit),
      createdAt: now,
      updatedAt: now,
    };

    createEmergencyBackupSnapshot("create_ingredient_from_invoice_row");

    setSupplierIngredients((previous: any[]) => [...previous, nextIngredient]);

    setSupplierInvoiceRows((previous: any[]) =>
      previous.map((row: any) =>
        row.id === rowId
          ? {
              ...row,
              name: cleanName,
              linkedIngredientId: nextIngredient.id,
              matchedIngredientName: nextIngredient.name,
              matchConfidence: "high",
              status: "matched",
              selected: true,
              confidence: "high",
            }
          : row
      )
    );

    setSupplierInvoiceMessage(`${nextIngredient.name} created and linked to this invoice row. Stock has not been updated yet.`);
  };



  const setAllSupplierInvoiceRowsSelected = (selected: boolean) => {
    setSupplierInvoiceRows((previous: any[]) =>
      previous.map((row: any) => ({
        ...row,
        selected,
        status: selected && row.status === "ignore" ? "needs_match" : row.status,
      }))
    );
  };


  return {
    supplierInvoiceText,
    setSupplierInvoiceText,
    supplierInvoiceRows,
    setSupplierInvoiceRows,
    invoiceDraft,
    setInvoiceDraft,
    invoiceDraftMessage,
    setInvoiceDraftMessage,
    invoiceLockSuccessReport,
    setInvoiceLockSuccessReport,
    invoiceIntakeMeta,
    setInvoiceIntakeMeta,
    supplierInvoiceMessage,
    setSupplierInvoiceMessage,
    supplierInvoicePhotoName,
    setSupplierInvoicePhotoName,
    supplierInvoicePhotoPreviewUrl,
    setSupplierInvoicePhotoPreviewUrl,
    supplierInvoiceViewOpen,
    setSupplierInvoiceViewOpen,
    invoiceQualityWarning,
    setInvoiceQualityWarning,
    invoiceFixingRowId,
    setInvoiceFixingRowId,
    parseInvoiceForSelectedSupplier,
    refreshInvoiceRowIntelligence,
    handleSupplierInvoiceFileUpload,
    updateSupplierInvoiceRow,
    handleSaveSupplierMatchMemory,
    setSupplierInvoiceRowStatus,
    handleSaveInvoiceDraft,
    handleLoadInvoiceDraft,
    handleDeleteInvoiceDraft,
    handleSaveInvoiceSpend,
    deleteInvoiceSpendRecord,
    invoiceLockSummary,
    invoiceAutopilotSummary: buildInvoiceAutopilotSummary(supplierInvoiceRows),
    handleLockInvoiceIntoStock,
    handleCreateIngredientFromInvoiceRow,
    setAllSupplierInvoiceRowsSelected,
  };
}
