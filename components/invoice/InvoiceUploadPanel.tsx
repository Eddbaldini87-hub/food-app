export function InvoiceUploadPanel(props: any) {
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
      <div style={{ ...styles.infoCard, marginBottom: 12, border: "1px solid rgba(59, 130, 246, 0.34)", background: "rgba(59, 130, 246, 0.08)" }}>
        <div style={styles.infoCardTitle}>1. Get The Invoice In</div>
        <div style={styles.infoCardSubtext}>Snap it or dump the text. Don’t overthink it — GP Police will sort the mess.</div>
      </div>

      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Invoice #</label>
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
        <label style={styles.label}>Upload Text / CSV or Snap The Bill</label>
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
            📷 Snap Invoice
          </button>
        </div>
      </div>
      
      {supplierInvoicePhotoName ? (
        <div style={styles.infoCard}>
          <div style={styles.infoCardTitle}>Invoice photo loaded</div>
          <div style={styles.infoCardText}>{supplierInvoicePhotoName}</div>
          {supplierInvoicePhotoPreviewUrl ? <img src={supplierInvoicePhotoPreviewUrl} alt="Uploaded invoice preview" style={{ width: "100%", maxWidth: 320, borderRadius: 12, marginTop: 10 }} /> : null}
          <div style={styles.infoCardSubtext}>Fix the ugly rows, then lock it before GP gets hit.</div>
        </div>
      ) : null}
      
      <div style={styles.formGroup}>
        <label style={styles.label}>Dump Invoice Text Here</label>
        <textarea value={supplierInvoiceText} onChange={(event: any) => setSupplierInvoiceText(event.target.value)} style={styles.textarea} placeholder="Paste the supplier text here. Example: Tomato Polpa 2 x 5kg $38.50" />
      </div>
      
      <div style={styles.buttonRow}>
        <button type="button" style={styles.primaryButton} onClick={parseInvoiceForSelectedSupplier}>Scan The Damage</button>
        <button type="button" style={styles.secondaryButton} onClick={handleSaveInvoiceDraft}>Save Mess</button>
        <button type="button" style={styles.secondaryButton} onClick={handleLoadInvoiceDraft}>Load Mess</button>
        <button type="button" style={styles.secondaryButton} onClick={handleDeleteInvoiceDraft}>Delete Mess</button>
        <button type="button" style={styles.secondaryButton} onClick={() => { setSupplierInvoiceText(""); setSupplierInvoiceRows([]); setSupplierInvoiceMessage(""); setInvoiceQualityWarning(""); setInvoiceFixingRowId(null); setInvoiceDraftMessage(""); setSupplierInvoicePhotoName(""); if (supplierInvoicePhotoPreviewUrl) { URL.revokeObjectURL(supplierInvoicePhotoPreviewUrl); setSupplierInvoicePhotoPreviewUrl(""); } }}>Clear The Deck</button>
      </div>
      
      {supplierInvoiceMessage ? <div style={styles.infoCardText}>{supplierInvoiceMessage}</div> : null}
      {invoiceQualityWarning ? <div style={{ ...styles.infoCardText, color: "#fef08a" }}>⚠️ {invoiceQualityWarning}</div> : null}
      {invoiceDraftMessage ? <div style={styles.infoCardText}>{invoiceDraftMessage}</div> : null}
      {invoiceDraft ? <div style={styles.infoCardSubtext}>Saved mess: {String(invoiceDraft.status || "draft")} · Saved: {String(invoiceDraft.updatedAt || invoiceDraft.createdAt || "")}</div> : null}
    </>
  );
}
