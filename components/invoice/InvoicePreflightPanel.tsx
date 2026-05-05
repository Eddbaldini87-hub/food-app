export function InvoicePreflightPanel(props: any) {
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
    handleSaveInvoiceStill draft,
    handleLoadInvoiceStill draft,
    handleDeleteInvoiceStill draft,
    setSupplierInvoiceRows,
    setSupplierInvoiceMessage,
    setInvoiceQualityWarning,
    setInvoiceFixingRowId,
    setInvoiceStill draftMessage,
    setSupplierInvoicePhotoName,
    setSupplierInvoicePhotoPreviewUrl,
    supplierInvoiceMessage,
    invoiceQualityWarning,
    invoiceStill draftMessage,
    invoiceStill draft,
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
  } = props;

  return (
    <>
      {Array.isArray(supplierInvoiceRows) && supplierInvoiceRows.length > 0 ? (
        <div style={styles.infoCard}>
          <div style={{ ...styles.infoCard, marginBottom: 12, border: invoiceCanLockSafely ? "1px solid rgba(34, 197, 94, 0.45)" : "1px solid rgba(245, 158, 11, 0.42)", background: invoiceCanLockSafely ? "rgba(34, 197, 94, 0.10)" : "rgba(245, 158, 11, 0.08)" }}>
            <div style={styles.infoCardTitle}>{invoiceCanLockSafely ? "✅ Clean Enough To Lock" : "⚠️ Still Dirty — Keep Fixing"}</div>
            <div style={styles.infoCardSubtext}>{invoiceReviewActionPlan?.helper || "Last gate before this hits stock and GP."}</div>
            <div style={{ ...styles.infoCardText, marginTop: 8 }}>Safe {invoiceReviewActionPlan?.readyRows || 0} / {invoiceReviewActionPlan?.totalRows || 0} rows · Needs fixing {invoiceReviewActionPlan?.needsFixRows || 0}</div>
          </div>
          <div style={styles.infoCardText}>Lock status: {invoiceLockSummary.isLocked ? "Locked into stock" : "Still draft"}</div>
          <div style={styles.infoCardSubtext}>
            Selected: {invoiceLockSummary.selectedCount} · Matched: {invoiceLockSummary.matchedCount} · Create: {invoiceLockSummary.createNewCount} · Binned: {invoiceLockSummary.ignoredCount} · Still ugly: {invoiceLockSummary.needsAttentionCount} · Total: {formatCurrency(invoiceLockSummary.estimatedTotal)}
          </div>
          <div style={{ ...styles.formGrid, marginTop: 12 }}>
            <div style={styles.infoCard}>
              <div style={styles.infoCardTitle}>Food COGS</div>
              <div style={styles.infoCardText}>{formatCurrency(invoiceCogsCategoryTotals.food)}</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoCardTitle}>Kitchen Bits</div>
              <div style={styles.infoCardText}>{formatCurrency(invoiceCogsCategoryTotals.consumable)}</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoCardTitle}>Mystery Money</div>
              <div style={styles.infoCardText}>{formatCurrency(invoiceCogsCategoryTotals.unknown)}</div>
            </div>
          </div>
          <div style={{ ...styles.infoCard, marginTop: 12 }}>
            <div style={styles.infoCardTitle}>Last Chance Check</div>
            <div style={styles.infoCardSubtext}>If this is wrong, GP gets hit. Check it now.</div>
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
                <div style={styles.infoCardTitle}>Kitchen Bits</div>
                <div style={styles.infoCardText}>{invoicePreflightSummary.consumableRowsCount}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Mystery Rows</div>
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
                <div style={styles.infoCardTitle}>Food Damage Total</div>
                <div style={styles.infoCardText}>{formatCurrency(invoicePreflightSummary.estimatedFoodCogsTotal)}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Kitchen Bits Total</div>
                <div style={styles.infoCardText}>{formatCurrency(invoicePreflightSummary.estimatedConsumablesTotal)}</div>
              </div>
            </div>
            {invoicePreflightSummary.unknownRowsCount > 0 ? (
              <div style={{ ...styles.infoCardText, color: "#fca5a5", marginTop: 10 }}>
                ⚠️ Mystery rows still there. Don’t lock garbage.
              </div>
            ) : null}
            {invoicePreflightSummary.unlinkedFoodRowsCount > 0 ? (
              <div style={{ ...styles.infoCardText, color: "#fca5a5", marginTop: 6 }}>
                ⚠️ Food with no match. Link it or create it.
              </div>
            ) : null}
            {!invoiceCanLockSafely ? (
              <div style={{ ...styles.infoCard, marginTop: 12, border: "1px solid rgba(248, 113, 113, 0.45)", background: "rgba(127, 29, 29, 0.14)" }}>
                <div style={{ ...styles.infoCardTitle, color: "#fecaca" }}>🚧 Not Clean Yet</div>
                <div style={styles.infoCardSubtext}>Fix the ugly bits before this hits stock.</div>
                <div style={{ ...styles.infoCardSubtext, marginTop: 8 }}>
                  Unknown: {invoiceLockBlockingSummary.unknownRowsCount} · Unlinked food: {invoiceLockBlockingSummary.unlinkedFoodRowsCount} · Missing names: {invoiceLockBlockingSummary.missingNameRowsCount} · Missing totals: {invoiceLockBlockingSummary.missingValueRowsCount}
                </div>
              </div>
            ) : (
              <div style={{ ...styles.infoCard, marginTop: 12, border: "1px solid rgba(34, 197, 94, 0.45)", background: "rgba(34, 197, 94, 0.10)" }}>
                <div style={{ ...styles.infoCardTitle, color: "#bbf7d0" }}>✅ Lock It Down</div>
                <div style={styles.infoCardSubtext}>Rows are named, valued, sorted, and ready.</div>
              </div>
            )}
          </div>
      
          <div style={styles.buttonRow}>
            <button type="button" style={invoiceCanLockSafely ? styles.primaryButton : styles.secondaryButton} onClick={handleSafeLockInvoiceClick} disabled={invoiceLockSummary.isLocked}>
              {invoiceLockSummary.isLocked ? "Already Locked" : invoiceFlowSummary.lockLabel}
            </button>
            {!invoiceCanLockSafely ? (
              <button type="button" style={styles.secondaryButton} onClick={showOnlyInvoiceRowsNeedingFix}>Show Fix Only</button>
            ) : null}
            <button type="button" style={styles.secondaryButton} onClick={autoApproveHighConfidenceInvoiceRows}>Auto Approve High Confidence</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
