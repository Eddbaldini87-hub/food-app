export function InvoiceReviewControlsPanel(props: any) {
  const {
    styles,
    supplierInvoiceRows,
    invoiceLockSummary,
    invoiceCogsCategoryTotals,
    invoiceReviewReadinessSummary,
    invoiceReviewMode,
    setInvoiceReviewMode,
    showInvoiceMatchDebug,
    setShowInvoiceMatchDebug,
    invoiceReviewSearchTerm,
    setInvoiceReviewSearchTerm,
    displayedSupplierInvoiceRows,
    invoiceReviewSortKey,
    setInvoiceReviewSortKey,
    invoiceReviewSortOptions,
    invoiceReviewVisibilitySummary,
    updateDisplayedInvoiceRowsSelected,
    autoApproveHighConfidenceInvoiceRows,
    showOnlyInvoiceRowsNeedingFix,
    markDisplayedInvoiceRowsCogsCategory,
    resetInvoiceReviewControls,
    invoiceReviewFilterOptions,
    invoiceReviewFilter,
    setInvoiceReviewFilter,
    getInvoiceReviewFilterCount,
    setAllSupplierInvoiceRowsSelected,
    formatCurrency,
  } = props;

  return (
    <>
      <div style={{ ...styles.infoCard, marginTop: 10 }}>
        <div style={styles.infoCardTitle}>Last Look Before Lock</div>
        <div style={styles.infoCardText}>✅ Scan rows parsed: {(Array.isArray(supplierInvoiceRows) ? supplierInvoiceRows : []).length}</div>
        <div style={styles.infoCardText}>{invoiceReviewReadinessSummary.unknownRowsCount === 0 ? "✅" : "⚠️"} Clear mystery rows</div>
        <div style={styles.infoCardText}>{invoiceReviewReadinessSummary.unmatchedFoodCount === 0 ? "✅" : "⚠️"} Link food rows</div>
        <div style={styles.infoCardText}>{invoiceReviewReadinessSummary.priceWarningCount === 0 ? "✅" : "⚠️"} Check price smacks</div>
        <div style={styles.infoCardText}>🚔 Lock only when the mess is clean</div>
      </div>
      <div style={{ ...styles.buttonRow, position: "sticky", top: 0, zIndex: 5, background: "rgba(10, 10, 12, 0.94)", padding: "10px 0" }}>
        <button type="button" style={styles.secondaryButton} onClick={() => setAllSupplierInvoiceRowsSelected(true)}>Select All</button>
        <button type="button" style={styles.secondaryButton} onClick={() => setAllSupplierInvoiceRowsSelected(false)}>Deselect All</button>
        <div style={styles.infoCardSubtext}>Selected: {invoiceLockSummary.selectedCount} · Total: {formatCurrency(invoiceLockSummary.estimatedTotal)}</div>
        <div style={styles.infoCardSubtext}>Food: {formatCurrency(invoiceCogsCategoryTotals.food)} · Kitchen Bits: {formatCurrency(invoiceCogsCategoryTotals.consumable)} · Unknown: {formatCurrency(invoiceCogsCategoryTotals.unknown)}</div>
        <button type="button" style={invoiceReviewMode === "normal" ? styles.primaryButton : styles.secondaryButton} onClick={() => setInvoiceReviewMode("normal")}>Normal View</button>
        <button type="button" style={invoiceReviewMode === "compact" ? styles.primaryButton : styles.secondaryButton} onClick={() => setInvoiceReviewMode("compact")}>Kitchen View</button>
        <button type="button" style={showInvoiceMatchDebug ? styles.primaryButton : styles.secondaryButton} onClick={() => setShowInvoiceMatchDebug((previous: boolean) => !previous)}>
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
            <div style={styles.infoCardTitle}>Rows Found</div>
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
          <button type="button" style={styles.secondaryButton} onClick={showOnlyInvoiceRowsNeedingFix}>Show Show The Mess</button>
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
    </>
  );
}
