import { InvoiceReviewRowCard } from "./InvoiceReviewRowCard";
import { InvoiceReviewSummaryPanels } from "./InvoiceReviewSummaryPanels";
import { InvoiceReviewControlsPanel } from "./InvoiceReviewControlsPanel";
import { InvoiceGpDamageReportPanel } from "./InvoiceGpDamageReportPanel";

export function InvoiceReviewToolbar(props: any) {
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
    setAllSupplierInvoiceRowsSelected,
    updateSupplierInvoiceRow,
    setSupplierInvoiceRowStatus,
    invoiceFixingRowId,
    sizeUnitOptions,
    componentUnitOptions,
    purchaseUnitOptions,
    supplierIngredients,
    selectedSupplier,
    orderingMeta,
    getInvoiceRowCogsType,
    invoiceReviewPanelRef,
    getInvoiceStatusBadgeStyle,
    getInvoiceStatusLabel,
    getInvoiceConfidenceBadgeStyle,
    handleCreateIngredientFromInvoiceRow,
    invoiceFlowSummary,
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
    invoiceReviewActionPlan,
    handleRefreshInvoiceIntelligence,
    handleInvoiceReviewPrimaryAction,
  } = props;

  return (
    <>
      {Array.isArray(supplierInvoiceRows) && supplierInvoiceRows.length > 0 ? (
        <div id="invoice-review-list" ref={invoiceReviewPanelRef} style={styles.cardInset}>
          <div style={{ ...styles.sectionGroupHeaderRow, alignItems: "center" }}>
            <div>
              <h3 style={styles.sectionGroupTitle}>Fix The Invoice Damage</h3>
              <div style={styles.infoCardSubtext}>Tap the ugly row, fix it, move on. No spreadsheet therapy.</div>
            </div>
            <button type="button" style={styles.primaryButton} onClick={handleFixNextInvoiceProblem}>Fix Next Mess</button>
          </div>
      
          <InvoiceReviewSummaryPanels {...props} />

          <InvoiceReviewControlsPanel {...props} />
          <InvoiceGpDamageReportPanel {...props} />
      
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {displayedSupplierInvoiceRows.length === 0 ? (
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>No rows match this search/filter</div>
                <div style={styles.infoCardSubtext}>Clear the search, reset the filter, or change the sort controls to see more invoice lines. No data has been changed.</div>
              </div>
            ) : null}
                      {displayedSupplierInvoiceRows.map((row: any) => (
                        <InvoiceReviewRowCard key={row.id} row={row} {...props} />
                      ))}
                    </div>
                    <div style={styles.buttonRow}>
                      <button type="button" style={invoiceCanLockSafely ? styles.primaryButton : styles.secondaryButton} onClick={handleSafeLockInvoiceClick}>{invoiceFlowSummary.lockLabel}</button>
                      <button type="button" style={styles.secondaryButton} onClick={showOnlyInvoiceRowsNeedingFix}>Show Show The Mess</button>
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

    </>
  );
}
