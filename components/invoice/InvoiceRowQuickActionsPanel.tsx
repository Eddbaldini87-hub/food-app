export function InvoiceRowQuickActionsPanel(props: any) {
  const {
    styles,
    row,
    reviewState,
    isCompactReviewMode,
    isFixPanelOpen,
    canLearnSupplierMatch,
    supplierMatchLearningSaved,
    priceUpdateSuggestion,
    formatCurrency,
    setInvoiceFixingRowId,
    setRowStatusAndMoveNext,
    markRowCogsAndMoveNext,
    handleLearnSupplierMatchFromRow,
    handleUpdateIngredientPriceFromInvoiceRow,
    getInvoiceCogsCategoryHelpText,
    getInvoiceRowDamageFlags,
    getInvoiceStatusBadgeStyle,
    getInvoiceStatusLabel,
    getInvoiceConfidenceBadgeStyle,
    getInvoiceMatchBadgeStyle,
    getInvoiceMatchConfidenceBadgeStyle,
    getInvoiceMatchLabel,
    getInvoiceRowCogsType,
  } = props;

  return (
    <>
      <div
        style={{
          ...styles.infoCard,
          marginTop: 10,
          border: reviewState.level === "low" ? "1px solid rgba(248, 113, 113, 0.48)" : "1px solid rgba(255, 255, 255, 0.12)",
          background: reviewState.level === "low" ? "rgba(127, 29, 29, 0.12)" : "rgba(15, 23, 42, 0.62)",
        }}
      >
        <div style={styles.infoCardTitle}>{reviewState.level === "low" ? "💀 This Line Can Hurt You" : "⚡ Quick Fixes"}</div>
        <div style={styles.infoCardSubtext}>One tap. No ceremony. Fix it and move on.</div>
        <div style={{ ...styles.buttonRow, marginTop: 10 }}>
          <button type="button" style={styles.secondaryButton} onClick={() => markRowCogsAndMoveNext("consumable_cogs")}>Kitchen Bits</button>
          <button type="button" style={styles.secondaryButton} onClick={() => markRowCogsAndMoveNext("food_cogs")}>Food Cost</button>
          <button type="button" style={styles.secondaryButton} onClick={() => markRowCogsAndMoveNext("non_cogs")}>Not GP</button>
          <button type="button" style={styles.secondaryButton} onClick={() => setRowStatusAndMoveNext("ignore")}>Bin It</button>
          <button type="button" style={styles.primaryButton} onClick={() => setInvoiceFixingRowId(isFixPanelOpen ? null : row.id)}>{isFixPanelOpen ? "Close Fix" : "Fix Properly"}</button>
        </div>
      </div>

      <div style={{ ...styles.buttonRow, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {!isCompactReviewMode ? (
            <span style={styles.infoCardSubtext}>{getInvoiceCogsCategoryHelpText(row)}</span>
          ) : null}
          {getInvoiceRowDamageFlags(row).map((flag: string, index: number) => (
            <span
              key={`${row.id}_damage_flag_${index}`}
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: flag.includes("💀") || flag.includes("🚨") ? "#fca5a5" : "#fde68a",
              }}
            >
              {flag}
            </span>
          ))}
          {priceUpdateSuggestion ? (
            <div style={{
              border: "1px solid rgba(245, 158, 11, 0.35)",
              background: "rgba(245, 158, 11, 0.10)",
              borderRadius: 12,
              padding: "8px 10px",
              marginTop: 4,
            }}>
              <div style={{ ...styles.infoCardText, color: "#fde68a", fontWeight: 900 }}>Price Smack Detected</div>
              <div style={styles.infoCardSubtext}>
                Old cost: {formatCurrency(priceUpdateSuggestion.currentIngredientPrice || 0)} · New invoice cost: {formatCurrency(priceUpdateSuggestion.invoicePrice || 0)} · Up: {Math.round(priceUpdateSuggestion.percentIncrease || 0)}%
              </div>
              <button type="button" style={{ ...styles.secondaryButton, marginTop: 8 }} onClick={() => handleUpdateIngredientPriceFromInvoiceRow(row)}>
                Accept New Cost
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div style={styles.buttonRow}>
        <button type="button" style={row.status === "matched" ? styles.primaryButton : styles.secondaryButton} onClick={() => setRowStatusAndMoveNext("matched")}>Matched</button>
        <button type="button" style={row.status === "create_new" ? styles.primaryButton : styles.secondaryButton} onClick={() => setRowStatusAndMoveNext("create_new")}>Create Ingredient</button>
        <button type="button" style={row.status === "ignore" ? styles.primaryButton : styles.secondaryButton} onClick={() => setRowStatusAndMoveNext("ignore")}>Bin Line</button>
        {canLearnSupplierMatch ? (
          <button type="button" style={supplierMatchLearningSaved ? styles.primaryButton : styles.secondaryButton} onClick={() => handleLearnSupplierMatchFromRow(row)}>
            {supplierMatchLearningSaved ? "Remembered ✓" : "Remember Match"}
          </button>
        ) : null}
        <button type="button" style={isFixPanelOpen ? styles.primaryButton : styles.secondaryButton} onClick={() => setInvoiceFixingRowId(isFixPanelOpen ? null : row.id)}>{isFixPanelOpen ? "Close Fix" : "Fix Properly"}</button>
      </div>

      <div style={styles.buttonRow}>
        <span style={getInvoiceStatusBadgeStyle(row)}>{getInvoiceStatusLabel(row)}</span>
        {!isCompactReviewMode ? (
          <span style={getInvoiceConfidenceBadgeStyle(row.confidence || "low")}>{String(row.confidence || "low").toUpperCase()}</span>
        ) : null}
        <span style={getInvoiceMatchBadgeStyle(row)}>{getInvoiceMatchLabel(row)}</span>
        {!isCompactReviewMode && getInvoiceRowCogsType(row) === "food_cogs" ? (
          <span style={getInvoiceMatchConfidenceBadgeStyle(row)}>Match {String(row.matchConfidence || "low")}</span>
        ) : null}
      </div>
    </>
  );
}
