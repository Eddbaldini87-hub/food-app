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
    </>
  );
}
