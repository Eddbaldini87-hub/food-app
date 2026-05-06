export function InvoiceRowHeaderPanel(props: any) {
  const {
    styles,
    row,
    reviewState,
    isLinked,
    isCompactReviewMode,
    isFixPanelOpen,
    supplierMatchLearningSaved,
    formatCurrency,
    setInvoiceFixingRowId,
    getInvoiceOutcomeBadgeStyle,
    getInvoiceRowOutcome,
    getInvoiceReviewBadgeStyle,
    getInvoiceCogsCategoryBadgeStyle,
    getInvoiceCogsCategoryLabel,
    getInvoiceMatchBadgeStyle,
    getInvoiceMatchConfidenceBadgeStyle,
  } = props;

  return (
    <>
      <div style={{ ...styles.buttonRow, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={getInvoiceOutcomeBadgeStyle(row)}>{getInvoiceRowOutcome(row).label}</span>
          <span style={getInvoiceReviewBadgeStyle(row)}>{reviewState.label}</span>
          <span style={getInvoiceCogsCategoryBadgeStyle(row)}>{getInvoiceCogsCategoryLabel(row)}</span>
          <span style={getInvoiceMatchBadgeStyle(row)}>{isLinked ? "Matched" : "Not Linked"}</span>
          {String(row?.matchConfidence || "").toLowerCase() === "learned" ? (
            <span style={getInvoiceMatchConfidenceBadgeStyle(row)}>🧠 Learned match</span>
          ) : null}
          {supplierMatchLearningSaved ? (
            <span style={styles.infoCardSubtext}>Remembered for next time</span>
          ) : null}
        </div>
        {!isCompactReviewMode ? (
          <span style={styles.infoCardSubtext}>{reviewState.helper}</span>
        ) : null}
      </div>

      {isCompactReviewMode ? (
        <button
          type="button"
          style={{
            ...styles.infoCard,
            width: "100%",
            textAlign: "left",
            marginTop: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(15,23,42,0.72)",
            cursor: "pointer",
          }}
          onClick={() => setInvoiceFixingRowId(isFixPanelOpen ? null : row.id)}
        >
          <div style={{ ...styles.infoCardTitle, fontSize: 16 }}>
            {String(row.name || row.rawLine || "Unnamed invoice row").slice(0, 76)}
          </div>
          <div style={styles.infoCardSubtext}>
            {String(row.qty || "?")} {String(row.unit || "unit")} · Unit {formatCurrency(row.unitPrice || 0)} · Total {formatCurrency(row.lineTotal || row.purchasePrice || 0)}
          </div>
          <div style={{ ...styles.infoCardSubtext, marginTop: 4 }}>Tap to fix this line.</div>
        </button>
      ) : (
        <div style={styles.infoCardSubtext}>Raw OCR mess: {String(row.rawLine || "")}</div>
      )}
    </>
  );
}
