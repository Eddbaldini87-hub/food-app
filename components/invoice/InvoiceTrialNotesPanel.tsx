export function InvoiceTrialNotesPanel(props: any) {
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
  } = props;

  return (
    <>
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
    </>
  );
}
