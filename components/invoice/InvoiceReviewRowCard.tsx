import { useEffect, useRef } from "react";
import { InvoiceRowHeaderPanel } from "./InvoiceRowHeaderPanel";
import { InvoiceRowQuickActionsPanel } from "./InvoiceRowQuickActionsPanel";
import { InvoiceRowDiagnosticsPanel } from "./InvoiceRowDiagnosticsPanel";
import { InvoiceRowEditPanel } from "./InvoiceRowEditPanel";

export function InvoiceReviewRowCard(props: any) {
  const {
    styles,
    setInvoiceFixingRowId,
    formatCurrency,
    supplierIngredients,
    selectedSupplier,
    orderingMeta,
    invoiceReviewMode,
    invoiceFixingRowId,
    sizeUnitOptions,
    componentUnitOptions,
    purchaseUnitOptions,
    updateSupplierInvoiceRow,
    setSupplierInvoiceRowStatus,
    handleFixNextInvoiceProblem,
    handleCreateIngredientFromInvoiceRow,
    getInvoiceStatusBadgeStyle,
    getInvoiceStatusLabel,
    getInvoiceConfidenceBadgeStyle,
    getInvoiceReviewBadgeStyle,
    showInvoiceAccuracyLab,
    showInvoiceMatchDebug,
    getInvoiceRowReviewState,
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
    getInvoiceRowCogsType,
  } = props;

  const row = props.row;
  const reviewState = getInvoiceRowReviewState(row);
  const isLinked = !!String(row?.linkedIngredientId || "").trim();
  const priceUpdateSuggestion = getInvoicePriceUpdateSuggestion(row);
  const isCompactReviewMode = invoiceReviewMode === "compact";
  const isFixPanelOpen = invoiceFixingRowId === row.id;
  const canLearnSupplierMatch = Boolean(String(row?.linkedIngredientId || "").trim()) && Boolean(String(row?.supplierMatchKey || "").trim());
  const supplierMatchLearningSaved = Boolean(savedSupplierMatchRows[String(row?.id || row?.supplierMatchKey || "")]);
  const invoiceRowNameInputRef = useRef<HTMLInputElement | null>(null);

  const moveToNextInvoiceProblem = () => {
    if (typeof handleFixNextInvoiceProblem !== "function") return;
    window.setTimeout(() => handleFixNextInvoiceProblem(), 220);
  };

  const updateRowAndMoveNext = (field: string, value: any) => {
    updateSupplierInvoiceRow(row.id, field, value);
    moveToNextInvoiceProblem();
  };

  const setRowStatusAndMoveNext = (nextStatus: "needs_match" | "matched" | "create_new" | "ignore") => {
    setSupplierInvoiceRowStatus(row.id, nextStatus);
    moveToNextInvoiceProblem();
  };

  const markRowCogsAndMoveNext = (nextCogsType: any) => {
    updateSupplierInvoiceRow(row.id, "cogsCategory", nextCogsType);
    if (nextCogsType === "consumable_cogs" || nextCogsType === "non_cogs") {
      updateSupplierInvoiceRow(row.id, "selected", true);
    }
    moveToNextInvoiceProblem();
  };

  useEffect(() => {
    if (!isFixPanelOpen) return;
    window.setTimeout(() => invoiceRowNameInputRef.current?.focus(), 80);
  }, [isFixPanelOpen, row?.id]);

  const sharedProps = {
    ...props,
    row,
    reviewState,
    isLinked,
    priceUpdateSuggestion,
    isCompactReviewMode,
    isFixPanelOpen,
    canLearnSupplierMatch,
    supplierMatchLearningSaved,
    invoiceRowNameInputRef,
    moveToNextInvoiceProblem,
    updateRowAndMoveNext,
    setRowStatusAndMoveNext,
    markRowCogsAndMoveNext,
    styles,
    setInvoiceFixingRowId,
    formatCurrency,
    supplierIngredients,
    selectedSupplier,
    orderingMeta,
    sizeUnitOptions,
    componentUnitOptions,
    purchaseUnitOptions,
    updateSupplierInvoiceRow,
    handleCreateIngredientFromInvoiceRow,
    getInvoiceStatusBadgeStyle,
    getInvoiceStatusLabel,
    getInvoiceConfidenceBadgeStyle,
    getInvoiceReviewBadgeStyle,
    showInvoiceAccuracyLab,
    showInvoiceMatchDebug,
    getInvoiceRowReviewState,
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
    getInvoiceRowCogsType,
  };

  return (
    <div key={row.id} id={`invoice-row-${row.id}`} style={getInvoiceRowReviewCardStyle(row)}>
      <InvoiceRowHeaderPanel {...sharedProps} />
      <InvoiceRowQuickActionsPanel {...sharedProps} />
      <InvoiceRowDiagnosticsPanel {...sharedProps} />
      <InvoiceRowEditPanel {...sharedProps} />
    </div>
  );
}
