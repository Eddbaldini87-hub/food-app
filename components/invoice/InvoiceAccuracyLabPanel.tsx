export function InvoiceAccuracyLabPanel(props: any) {
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
      <div style={{ ...styles.infoCard, border: showInvoiceAccuracyLab ? "1px solid rgba(96, 165, 250, 0.45)" : "1px solid rgba(255, 255, 255, 0.12)", background: showInvoiceAccuracyLab ? "rgba(59, 130, 246, 0.08)" : undefined }}>
        <div style={styles.sectionGroupHeaderRow}>
          <div>
            <div style={styles.infoCardTitle}>Invoice Accuracy Lab</div>
            <div style={styles.infoCardSubtext}>Diagnostic mode for ugly invoices. Normal kitchen users can leave this shut.</div>
          </div>
          <button type="button" style={showInvoiceAccuracyLab ? styles.primaryButton : styles.secondaryButton} onClick={() => setShowInvoiceAccuracyLab((previous) => !previous)}>
            {showInvoiceAccuracyLab ? "Hide Accuracy Lab" : "Show Accuracy Lab"}
          </button>
        </div>
      
        {showInvoiceAccuracyLab ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <div style={{ ...styles.infoCard, border: "1px solid rgba(245, 158, 11, 0.32)", background: "rgba(245, 158, 11, 0.08)" }}>
              <div style={styles.infoCardTitle}>Mixed Invoice Safety</div>
              <div style={styles.infoCardSubtext}>MBL can mix food and consumables. Classification is row-by-row, not whole-invoice.</div>
            </div>
      
            <div style={{ ...styles.formGrid, marginTop: 0 }}>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Chosen Parser Source</div>
                <div style={styles.infoCardText}>{invoiceAccuracyDiagnostics.finalParserSource}</div>
                <div style={styles.infoCardSubtext}>{invoiceAccuracyDiagnostics.chosenReasons.join(" · ") || "Scan or paste an invoice to compare parser candidates."}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Raw Price Anchors</div>
                <div style={styles.infoCardText}>{getInvoiceAccuracyMoneyCount(invoiceAccuracyDiagnostics.rawText)}</div>
                <div style={styles.infoCardSubtext}>Detected money values in raw OCR.</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Current Rows</div>
                <div style={styles.infoCardText}>{Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows.length : 0}</div>
                <div style={styles.infoCardSubtext}>Rows currently shown in review.</div>
              </div>
            </div>
      
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr>
                    {["Candidate", "Rows", "Prices", "Categories", "Food", "Consumables", "Unknown", "Low", "Total", "Score"].map((heading) => (
                      <th key={heading} style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.12)", color: "#e5e7eb", fontSize: 12 }}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoiceAccuracyDiagnostics.candidates.map((candidate: any) => (
                    <tr key={`${candidate.candidateName}_${candidate.parserMode}`}>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 800 }}>{candidate.candidateName}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{candidate.rowCount}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{candidate.rowsWithPrice}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{candidate.rowsWithCategory}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{candidate.foodRows}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{candidate.consumableRows}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{candidate.unknownRows}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{candidate.lowConfidenceRows}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{formatCurrency(candidate.estimatedTotal || 0)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 900 }}>{candidate.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      
            <div style={styles.formGrid}>
              {[
                ["Raw OCR Text", invoiceAccuracyDiagnostics.rawText],
                ["Cleaned OCR Text", invoiceAccuracyDiagnostics.cleanedText],
                ["Soft Line Break Candidate", invoiceAccuracyDiagnostics.softLineText],
                ["Price-Anchor Rebuilt Text", invoiceAccuracyDiagnostics.priceAnchorText],
              ].map(([label, value]: any) => (
                <div key={label} style={styles.formGroup}>
                  <label style={styles.label}>{label}</label>
                  <textarea readOnly value={getInvoiceAccuracyTextPreview(value)} style={{ ...styles.textarea, minHeight: 120, fontFamily: "monospace", fontSize: 12 }} />
                </div>
              ))}
            </div>
      
            <div style={styles.formGroup}>
              <label style={styles.label}>Failed Invoice Notes</label>
              <textarea
                value={trialModeNotes}
                onChange={(event: any) => setTrialModeNotes(event.target.value)}
                style={styles.textarea}
                placeholder="Supplier quirks, missing rows, wrong categories, OCR words it misread, and what needs fixing next."
              />
            </div>
      
            <div style={styles.buttonRow}>
              <button type="button" style={styles.primaryButton} onClick={copyInvoiceAccuracyDebugPack}>Copy Debug Pack</button>
              <button type="button" style={styles.secondaryButton} onClick={() => setShowInvoiceMatchDebug((previous) => !previous)}>
                {showInvoiceMatchDebug ? "Hide Match Debug" : "Show Match Debug Too"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
