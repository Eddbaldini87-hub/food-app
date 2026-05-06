export function InvoiceReviewActionPanel(props: any) {
  const {
    styles,
    invoiceCanLockSafely,
    invoiceReviewActionPlan,
    getInvoiceReviewActionPanelStyle,
    getInvoiceReviewBadgeStyle,
    handleInvoiceReviewPrimaryAction,
    showOnlyInvoiceRowsNeedingFix,
    autoApproveHighConfidenceInvoiceRows,
    handleRefreshInvoiceIntelligence,
  } = props;

  const actionPlan = invoiceReviewActionPlan || {};
  const panelStyle = typeof getInvoiceReviewActionPanelStyle === "function"
    ? getInvoiceReviewActionPanelStyle()
    : styles?.infoCard || {};
  const readyBadgeStyle = typeof getInvoiceReviewBadgeStyle === "function"
    ? getInvoiceReviewBadgeStyle({ cogsType: invoiceCanLockSafely ? "food_cogs" : "unknown" })
    : styles?.statusBadge || {};

  return (
    <div style={panelStyle}>
      <div style={styles.sectionGroupHeaderRow}>
        <div>
          <h3 style={styles.sectionGroupTitle}>{actionPlan.headline || "Invoice Action Board"}</h3>
          <div style={styles.infoCardSubtext}>{actionPlan.helper || "Fix the risky rows before this hits stock and GP."}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={readyBadgeStyle}>{actionPlan.progressPercent || 0}% READY</span>
          <span style={styles.statusBadge}>{actionPlan.selectedRows || 0} SELECTED</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 10, marginTop: 12 }}>
        <div style={styles.infoCard}>
          <strong>{actionPlan.totalRows || 0}</strong>
          <div style={styles.infoCardSubtext}>Rows detected</div>
        </div>
        <div style={styles.infoCard}>
          <strong>{actionPlan.readyRows || 0}</strong>
          <div style={styles.infoCardSubtext}>Ready rows</div>
        </div>
        <div style={styles.infoCard}>
          <strong>{actionPlan.needsFixRows || 0}</strong>
          <div style={styles.infoCardSubtext}>Need fixing</div>
        </div>
      </div>

      <div style={{ ...styles.buttonRow, marginTop: 14 }}>
        <button type="button" style={invoiceCanLockSafely ? styles.primaryButton : styles.secondaryButton} onClick={handleInvoiceReviewPrimaryAction}>
          {invoiceCanLockSafely ? "🚔 Lock clean invoice" : "🔎 Fix next problem"}
        </button>
        <button type="button" style={styles.secondaryButton} onClick={showOnlyInvoiceRowsNeedingFix}>
          Show fix-only lane
        </button>
        <button type="button" style={styles.secondaryButton} onClick={autoApproveHighConfidenceInvoiceRows}>
          Auto-select clean rows
        </button>
        <button type="button" style={styles.secondaryButton} onClick={handleRefreshInvoiceIntelligence}>
          Re-check matching
        </button>
      </div>
    </div>
  );
}
