import { InvoiceReviewRowCard } from "./InvoiceReviewRowCard";

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
              <h3 style={styles.sectionGroupTitle}>Fix & Review Lines</h3>
              <div style={styles.infoCardSubtext}>Mobile-first review: tap a warning, fix the row, then move to the next problem.</div>
            </div>
            <button type="button" style={styles.primaryButton} onClick={handleFixNextInvoiceProblem}>Fix Next Problem</button>
          </div>
      
          <div style={{ ...styles.infoCard, marginTop: 10, border: "1px solid rgba(59, 130, 246, 0.38)", background: "rgba(59, 130, 246, 0.08)" }}>
            <div style={styles.infoCardTitle}>Autopilot Command</div>
            <div style={styles.infoCardSubtext}>{invoiceReviewActionPlan?.helper || "GP Police is sorting safe rows from risky rows."}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: 10, marginTop: 10 }}>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Ready</div>
                <div style={{ ...styles.infoCardText, color: "#bbf7d0" }}>{invoiceReviewActionPlan?.readyRows || 0}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Needs Fix</div>
                <div style={{ ...styles.infoCardText, color: (invoiceReviewActionPlan?.needsFixRows || 0) > 0 ? "#fecaca" : "#bbf7d0" }}>{invoiceReviewActionPlan?.needsFixRows || 0}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Progress</div>
                <div style={styles.infoCardText}>{invoiceReviewActionPlan?.progressPercent || 0}%</div>
              </div>
            </div>
            <div style={{ ...styles.buttonRow, marginTop: 10 }}>
              <button type="button" style={styles.primaryButton} onClick={handleInvoiceReviewPrimaryAction}>
                {(invoiceReviewActionPlan?.needsFixRows || 0) > 0 ? "Fix Next Problem" : "Review / Lock"}
              </button>
              <button type="button" style={styles.secondaryButton} onClick={handleRefreshInvoiceIntelligence}>Re-check Matching</button>
            </div>
          </div>

          <div style={{
            ...styles.infoCard,
            position: "sticky",
            top: 8,
            zIndex: 8,
            marginTop: 10,
            border: "1px solid rgba(59, 130, 246, 0.35)",
            background: "rgba(15, 23, 42, 0.96)",
            boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
          }}>
            <div style={styles.infoCardTitle}>Phone Fix Bar</div>
            <div style={{ ...styles.buttonRow, marginTop: 10 }}>
              <button type="button" style={styles.primaryButton} onClick={handleFixNextInvoiceProblem}>Fix Next Problem</button>
              <button type="button" style={styles.secondaryButton} onClick={() => handleJumpToInvoiceFilter("needs_fix")}>Fix Only ({invoiceReviewReadinessSummary.needsFixRowsCount})</button>
              <button type="button" style={styles.secondaryButton} onClick={() => setInvoiceReviewMode(invoiceReviewMode === "compact" ? "normal" : "compact")}>
                {invoiceReviewMode === "compact" ? "Full View" : "Compact View"}
              </button>
            </div>
          </div>
      
          <div style={{ ...styles.infoCard, marginTop: 10, border: "1px solid rgba(59, 130, 246, 0.32)", background: "rgba(59, 130, 246, 0.08)" }}>
            <div style={styles.infoCardTitle}>Invoice Outcome Summary</div>
            <div style={styles.infoCardSubtext}>Every parsed row now lands in a clear review bucket. Display only — no invoice data is changed here.</div>
            <div style={{ ...styles.formGrid, marginTop: 10 }}>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Total Rows</div>
                <div style={styles.infoCardText}>{invoiceReviewOutcomeSummary.totalReviewRows}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Food COGS</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewOutcomeSummary.matchedFoodCount > 0 ? "#bbf7d0" : undefined }}>{invoiceReviewOutcomeSummary.matchedFoodCount}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Consumables</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewOutcomeSummary.matchedConsumableCount > 0 ? "#bfdbfe" : undefined }}>{invoiceReviewOutcomeSummary.matchedConsumableCount}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Needs Fix</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewOutcomeSummary.unknownCount > 0 ? "#fde68a" : undefined }}>{invoiceReviewOutcomeSummary.unknownCount}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Price Warnings</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewOutcomeSummary.priceWarningCount > 0 ? "#fca5a5" : undefined }}>{invoiceReviewOutcomeSummary.priceWarningCount}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Duplicate Warnings</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewOutcomeSummary.duplicateWarningCount > 0 ? "#fca5a5" : undefined }}>{invoiceReviewOutcomeSummary.duplicateWarningCount}</div>
              </div>
            </div>
          </div>
      
          <div style={{ ...styles.infoCard, marginTop: 10, border: "1px solid rgba(245, 158, 11, 0.36)", background: "rgba(245, 158, 11, 0.08)" }}>
            <div style={styles.infoCardTitle}>Tap A Trouble Spot</div>
            <div style={{ ...styles.formGrid, marginTop: 10 }}>
              <button type="button" style={{ ...styles.infoCard, textAlign: "left", cursor: "pointer", border: invoiceReviewWarningSummary.unknownRowsCount > 0 ? "1px solid rgba(245, 158, 11, 0.55)" : styles.infoCard?.border }} onClick={() => handleJumpToInvoiceFilter("unknown")}>
                <div style={styles.infoCardTitle}>Unknown Rows</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewWarningSummary.unknownRowsCount > 0 ? "#fde68a" : undefined }}>{invoiceReviewWarningSummary.unknownRowsCount}</div>
                <div style={styles.infoCardSubtext}>Tap to show category problems</div>
              </button>
              <button type="button" style={{ ...styles.infoCard, textAlign: "left", cursor: "pointer", border: invoiceReviewWarningSummary.unmatchedFoodCount > 0 ? "1px solid rgba(248, 113, 113, 0.55)" : styles.infoCard?.border }} onClick={() => handleJumpToInvoiceFilter("unmatched_food")}>
                <div style={styles.infoCardTitle}>Unmatched Food</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewWarningSummary.unmatchedFoodCount > 0 ? "#fecaca" : undefined }}>{invoiceReviewWarningSummary.unmatchedFoodCount}</div>
                <div style={styles.infoCardSubtext}>Tap to link food rows</div>
              </button>
              <button type="button" style={{ ...styles.infoCard, textAlign: "left", cursor: "pointer", border: invoiceReviewWarningSummary.priceWarningCount > 0 ? "1px solid rgba(248, 113, 113, 0.55)" : styles.infoCard?.border }} onClick={() => handleJumpToInvoiceFilter("price_warnings")}>
                <div style={styles.infoCardTitle}>Price Warnings</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewWarningSummary.priceWarningCount > 0 ? "#fca5a5" : undefined }}>{invoiceReviewWarningSummary.priceWarningCount}</div>
                <div style={styles.infoCardSubtext}>Tap to review price spikes</div>
              </button>
              <button type="button" style={{ ...styles.infoCard, textAlign: "left", cursor: "pointer", border: invoiceReviewWarningSummary.duplicateWarningCount > 0 ? "1px solid rgba(248, 113, 113, 0.55)" : styles.infoCard?.border }} onClick={() => handleJumpToInvoiceFilter("duplicates")}>
                <div style={styles.infoCardTitle}>Duplicate Warnings</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewWarningSummary.duplicateWarningCount > 0 ? "#fca5a5" : undefined }}>{invoiceReviewWarningSummary.duplicateWarningCount}</div>
                <div style={styles.infoCardSubtext}>Tap to check possible double rows</div>
              </button>
            </div>
            <div style={styles.infoCardSubtext}>These cards now jump straight to the problem rows — no more blind scrolling.</div>
          </div>
      
          <div style={{ ...styles.infoCard, marginTop: 10, border: "1px solid rgba(34, 197, 94, 0.28)", background: "rgba(34, 197, 94, 0.07)" }}>
            <div style={styles.infoCardTitle}>Lock Readiness</div>
            <div style={{ ...styles.formGrid, marginTop: 10 }}>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Ready Rows</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.readyRowsCount > 0 ? "#bbf7d0" : undefined }}>
                  {invoiceReviewReadinessSummary.readyRowsCount}
                </div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Needs Fix</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.needsFixRowsCount > 0 ? "#fecaca" : undefined }}>
                  {invoiceReviewReadinessSummary.needsFixRowsCount}
                </div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Unknown</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.unknownRowsCount > 0 ? "#fde68a" : undefined }}>
                  {invoiceReviewReadinessSummary.unknownRowsCount}
                </div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Unmatched Food</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.unmatchedFoodCount > 0 ? "#fecaca" : undefined }}>
                  {invoiceReviewReadinessSummary.unmatchedFoodCount}
                </div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Price Warnings</div>
                <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.priceWarningCount > 0 ? "#fca5a5" : undefined }}>
                  {invoiceReviewReadinessSummary.priceWarningCount}
                </div>
              </div>
            </div>
          </div>
      
          <div
            style={{
              ...styles.infoCard,
              marginTop: 10,
              border: invoiceSafeToLockTone === "safe" ? "1px solid rgba(34, 197, 94, 0.42)" : "1px solid rgba(245, 158, 11, 0.44)",
              background: invoiceSafeToLockTone === "safe" ? "rgba(34, 197, 94, 0.10)" : "rgba(245, 158, 11, 0.10)",
            }}
          >
            <div style={styles.infoCardTitle}>{invoiceSafeToLockTone === "safe" ? "✅ Safe To Lock Check" : "⚠️ Lock Review Needed"}</div>
            <div style={styles.infoCardSubtext}>Stage 3 helper. Dirty rows are blocked before commit.</div>
            <div style={styles.infoCardText}>
              {invoiceSafeToLockTone === "safe"
                ? "No unknown rows or unmatched food rows found. Still check price warnings before locking."
                : `Review needed: ${invoiceReviewReadinessSummary.unknownRowsCount} unknown row(s), ${invoiceReviewReadinessSummary.unmatchedFoodCount} unmatched food row(s).`}
            </div>
          </div>
      
          <div style={{ ...styles.infoCard, marginTop: 10 }}>
            <div style={styles.infoCardTitle}>Quick Review Checklist</div>
            <div style={styles.infoCardText}>✅ Scan rows parsed: {(Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).length}</div>
            <div style={styles.infoCardText}>{invoiceReviewReadinessSummary.unknownRowsCount === 0 ? "✅" : "⚠️"} Review unknown rows</div>
            <div style={styles.infoCardText}>{invoiceReviewReadinessSummary.unmatchedFoodCount === 0 ? "✅" : "⚠️"} Link unmatched food rows</div>
            <div style={styles.infoCardText}>{invoiceReviewReadinessSummary.priceWarningCount === 0 ? "✅" : "⚠️"} Check price warnings</div>
            <div style={styles.infoCardText}>🚔 Lock invoice only after review</div>
          </div>
          <div style={{ ...styles.buttonRow, position: "sticky", top: 0, zIndex: 5, background: "rgba(10, 10, 12, 0.94)", padding: "10px 0" }}>
            <button type="button" style={styles.secondaryButton} onClick={() => setAllSupplierInvoiceRowsSelected(true)}>Select All</button>
            <button type="button" style={styles.secondaryButton} onClick={() => setAllSupplierInvoiceRowsSelected(false)}>Deselect All</button>
            <div style={styles.infoCardSubtext}>Selected rows: {invoiceLockSummary.selectedCount} · Total: {formatCurrency(invoiceLockSummary.estimatedTotal)}</div>
            <div style={styles.infoCardSubtext}>Food: {formatCurrency(invoiceCogsCategoryTotals.food)} · Consumables: {formatCurrency(invoiceCogsCategoryTotals.consumable)} · Unknown: {formatCurrency(invoiceCogsCategoryTotals.unknown)}</div>
            <button type="button" style={invoiceReviewMode === "normal" ? styles.primaryButton : styles.secondaryButton} onClick={() => setInvoiceReviewMode("normal")}>Normal View</button>
            <button type="button" style={invoiceReviewMode === "compact" ? styles.primaryButton : styles.secondaryButton} onClick={() => setInvoiceReviewMode("compact")}>Compact View</button>
            <button type="button" style={showInvoiceMatchDebug ? styles.primaryButton : styles.secondaryButton} onClick={() => setShowInvoiceMatchDebug((previous) => !previous)}>
              {showInvoiceMatchDebug ? "Hide Match Debug" : "Show Match Debug"}
            </button>
          </div>
          <div style={{ ...styles.infoCard, marginTop: 10 }}>
            <label style={styles.label}>Search invoice rows</label>
            <input
              type="text"
              value={invoiceReviewSearchTerm}
              onChange={(event: any) => setInvoiceReviewSearchTerm(event.target.value)}
              style={styles.input}
              placeholder="Search item name, code, raw OCR line, COGS category, or matched ingredient"
            />
            <div style={styles.infoCardSubtext}>Showing {displayedSupplierInvoiceRows.length} of {(Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).length} invoice rows.</div>
          </div>
          <div style={{ ...styles.formGroup, marginTop: 10 }}>
            <label style={styles.label}>Sort invoice rows</label>
            <select
              value={invoiceReviewSortKey}
              onChange={(event: any) => setInvoiceReviewSortKey(event.target.value)}
              style={styles.input}
            >
              {invoiceReviewSortOptions.map((option: any) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            <div style={styles.infoCardSubtext}>Sorting only changes the display order. It does not alter invoice row data or lock behaviour.</div>
          </div>
          <div style={{ ...styles.infoCard, marginTop: 10 }}>
            <div style={styles.infoCardTitle}>Review Controls</div>
            <div style={styles.infoCardSubtext}>Bulk actions only affect the currently displayed rows after search, filter, and sort.</div>
            <div style={{ ...styles.formGrid, marginTop: 12 }}>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Total Rows</div>
                <div style={styles.infoCardText}>{invoiceReviewVisibilitySummary.totalRows}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Displayed</div>
                <div style={styles.infoCardText}>{invoiceReviewVisibilitySummary.displayedRows}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Selected Displayed</div>
                <div style={styles.infoCardText}>{invoiceReviewVisibilitySummary.selectedDisplayedRows}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>Hidden Rows</div>
                <div style={styles.infoCardText}>{invoiceReviewVisibilitySummary.hiddenRows}</div>
              </div>
            </div>
            <div style={{ ...styles.buttonRow, marginTop: 12 }}>
              <button type="button" style={styles.secondaryButton} onClick={() => updateDisplayedInvoiceRowsSelected(true)}>Select Displayed</button>
              <button type="button" style={styles.secondaryButton} onClick={() => updateDisplayedInvoiceRowsSelected(false)}>Deselect Displayed</button>
              <button type="button" style={styles.primaryButton} onClick={autoApproveHighConfidenceInvoiceRows}>Auto Approve High Confidence</button>
              <button type="button" style={styles.secondaryButton} onClick={showOnlyInvoiceRowsNeedingFix}>Show Fix Only</button>
              <button type="button" style={styles.secondaryButton} onClick={() => markDisplayedInvoiceRowsCogsCategory("unknown")}>Mark Displayed Unknown</button>
              <button type="button" style={styles.secondaryButton} onClick={() => markDisplayedInvoiceRowsCogsCategory("consumable_cogs")}>Mark Displayed Consumable</button>
              <button type="button" style={styles.secondaryButton} onClick={() => markDisplayedInvoiceRowsCogsCategory("non_cogs")}>Mark Displayed Non-COGS</button>
            </div>
            <div style={{ ...styles.buttonRow, marginTop: 10 }}>
              <button type="button" style={styles.secondaryButton} onClick={() => resetInvoiceReviewControls("search")}>Clear Search</button>
              <button type="button" style={styles.secondaryButton} onClick={() => resetInvoiceReviewControls("filter")}>Reset Filter</button>
              <button type="button" style={styles.secondaryButton} onClick={() => resetInvoiceReviewControls("sort")}>Reset Sort</button>
            </div>
          </div>
          <div style={{ ...styles.buttonRow, marginTop: 10, alignItems: "center" }}>
            <div style={styles.infoCardSubtext}>Filter rows:</div>
            {invoiceReviewFilterOptions.map((option: any) => (
              <button
                key={option.key}
                type="button"
                style={invoiceReviewFilter === option.key ? styles.primaryButton : styles.secondaryButton}
                onClick={() => setInvoiceReviewFilter(option.key)}
              >
                {option.label} ({getInvoiceReviewFilterCount(option.key)})
              </button>
            ))}
            <div style={styles.infoCardSubtext}>Showing {displayedSupplierInvoiceRows.length} of {(Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).length}</div>
          </div>
          {invoiceGpDamageSummary.totalDamage > 0 ? (
            <div style={{ ...styles.infoCard, marginTop: 12, border: "1px solid rgba(248, 113, 113, 0.42)", background: "rgba(127, 29, 29, 0.16)" }}>
              <div style={styles.infoCardTitle}>💀 GP Damage Report</div>
              <div style={styles.infoCardSubtext}>Potential supplier price damage from matched invoice rows. Display only — no prices or stock are changed.</div>
              <div style={{ ...styles.formGrid, marginTop: 12 }}>
                <div style={{ ...styles.infoCard, border: "1px solid rgba(248, 113, 113, 0.42)", background: "rgba(248, 113, 113, 0.10)" }}>
                  <div style={styles.infoCardTitle}>Margin Killers</div>
                  <div style={{ ...styles.infoCardText, color: "#fca5a5" }}>{formatCurrency(invoiceGpDamageSummary.marginKillerTotal)}</div>
                  <div style={styles.infoCardSubtext}>{invoiceGpDamageSummary.marginKillerCount} row(s) at +25% or more</div>
                </div>
                <div style={{ ...styles.infoCard, border: "1px solid rgba(251, 146, 60, 0.42)", background: "rgba(251, 146, 60, 0.10)" }}>
                  <div style={styles.infoCardTitle}>Price Spikes</div>
                  <div style={{ ...styles.infoCardText, color: "#fed7aa" }}>{formatCurrency(invoiceGpDamageSummary.priceSpikeTotal)}</div>
                  <div style={styles.infoCardSubtext}>{invoiceGpDamageSummary.priceSpikeCount} row(s) at +15% or more</div>
                </div>
                <div style={{ ...styles.infoCard, border: "1px solid rgba(245, 158, 11, 0.42)", background: "rgba(245, 158, 11, 0.10)" }}>
                  <div style={styles.infoCardTitle}>Price Rises</div>
                  <div style={{ ...styles.infoCardText, color: "#fde68a" }}>{formatCurrency(invoiceGpDamageSummary.priceRiseTotal)}</div>
                  <div style={styles.infoCardSubtext}>{invoiceGpDamageSummary.priceRiseCount} row(s) at +8% or more</div>
                </div>
                <div style={{ ...styles.infoCard, border: "1px solid rgba(248, 113, 113, 0.55)", background: "rgba(248, 113, 113, 0.14)" }}>
                  <div style={styles.infoCardTitle}>Total Potential Damage</div>
                  <div style={{ ...styles.infoCardText, color: "#fecaca", fontWeight: 900 }}>{formatCurrency(invoiceGpDamageSummary.totalDamage)}</div>
                  <div style={styles.infoCardSubtext}>Sum of flagged invoice line totals</div>
                </div>
              </div>
            </div>
          ) : null}
      
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
                      <button type="button" style={styles.secondaryButton} onClick={showOnlyInvoiceRowsNeedingFix}>Show Fix Only</button>
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
