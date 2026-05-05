export function InvoiceLockHistoryPanel(props: any) {
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
    </>
  );
}
