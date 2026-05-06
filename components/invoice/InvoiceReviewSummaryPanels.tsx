export function InvoiceReviewSummaryPanels(props: any) {
  const {
    styles,
    supplierInvoiceRows,
    invoiceReviewActionPlan,
    invoiceReviewReadinessSummary,
    invoiceReviewOutcomeSummary,
    invoiceReviewWarningSummary,
    invoiceSafeToLockTone,
    invoiceReviewMode,
    setInvoiceReviewMode,
    handleFixNextInvoiceProblem,
    handleJumpToInvoiceFilter,
    handleRefreshInvoiceIntelligence,
    handleInvoiceReviewPrimaryAction,
  } = props;

  return (
    <>
      <div style={{ ...styles.infoCard, marginTop: 10, border: "1px solid rgba(59, 130, 246, 0.38)", background: "rgba(59, 130, 246, 0.08)" }}>
        <div style={styles.infoCardTitle}>Autopilot Sorting The Mess</div>
        <div style={styles.infoCardSubtext}>{invoiceReviewActionPlan?.helper || "GP Police is splitting safe rows from rows that can hurt you."}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: 10, marginTop: 10 }}>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Safe</div>
            <div style={{ ...styles.infoCardText, color: "#bbf7d0" }}>{invoiceReviewActionPlan?.readyRows || 0}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Needs A Decision</div>
            <div style={{ ...styles.infoCardText, color: (invoiceReviewActionPlan?.needsFixRows || 0) > 0 ? "#fecaca" : "#bbf7d0" }}>{invoiceReviewActionPlan?.needsFixRows || 0}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Cleaned Up</div>
            <div style={styles.infoCardText}>{invoiceReviewActionPlan?.progressPercent || 0}%</div>
          </div>
        </div>
        <div style={{ ...styles.buttonRow, marginTop: 10 }}>
          <button type="button" style={styles.primaryButton} onClick={handleInvoiceReviewPrimaryAction}>
            {(invoiceReviewActionPlan?.needsFixRows || 0) > 0 ? "Fix Next Mess" : "Lock It Down"}
          </button>
          <button type="button" style={styles.secondaryButton} onClick={handleRefreshInvoiceIntelligence}>Run The Sniffer Again</button>
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
          <button type="button" style={styles.primaryButton} onClick={handleFixNextInvoiceProblem}>Fix Next Mess</button>
          <button type="button" style={styles.secondaryButton} onClick={() => handleJumpToInvoiceFilter("needs_fix")}>Show The Mess ({invoiceReviewReadinessSummary.needsFixRowsCount})</button>
          <button type="button" style={styles.secondaryButton} onClick={() => setInvoiceReviewMode(invoiceReviewMode === "compact" ? "normal" : "compact")}>
            {invoiceReviewMode === "compact" ? "Full Noise" : "Kitchen View"}
          </button>
        </div>
      </div>

      <div style={{ ...styles.infoCard, marginTop: 10, border: "1px solid rgba(59, 130, 246, 0.32)", background: "rgba(59, 130, 246, 0.08)" }}>
        <div style={styles.infoCardTitle}>Invoice Scoreboard</div>
        <div style={styles.infoCardSubtext}>Every row gets a label. Safe, messy, or dangerous.</div>
        <div style={{ ...styles.formGrid, marginTop: 10 }}>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Rows Found</div>
            <div style={styles.infoCardText}>{invoiceReviewOutcomeSummary.totalReviewRows}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Food Cost</div>
            <div style={{ ...styles.infoCardText, color: invoiceReviewOutcomeSummary.matchedFoodCount > 0 ? "#bbf7d0" : undefined }}>{invoiceReviewOutcomeSummary.matchedFoodCount}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Kitchen Bits</div>
            <div style={{ ...styles.infoCardText, color: invoiceReviewOutcomeSummary.matchedConsumableCount > 0 ? "#bfdbfe" : undefined }}>{invoiceReviewOutcomeSummary.matchedConsumableCount}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Needs A Decision</div>
            <div style={{ ...styles.infoCardText, color: invoiceReviewOutcomeSummary.unknownCount > 0 ? "#fde68a" : undefined }}>{invoiceReviewOutcomeSummary.unknownCount}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Price Smacks</div>
            <div style={{ ...styles.infoCardText, color: invoiceReviewOutcomeSummary.priceWarningCount > 0 ? "#fca5a5" : undefined }}>{invoiceReviewOutcomeSummary.priceWarningCount}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Double-Dip Warnings</div>
            <div style={{ ...styles.infoCardText, color: invoiceReviewOutcomeSummary.duplicateWarningCount > 0 ? "#fca5a5" : undefined }}>{invoiceReviewOutcomeSummary.duplicateWarningCount}</div>
          </div>
        </div>
      </div>

      <div style={{ ...styles.infoCard, marginTop: 10, border: "1px solid rgba(245, 158, 11, 0.36)", background: "rgba(245, 158, 11, 0.08)" }}>
        <div style={styles.infoCardTitle}>Tap The Trouble</div>
        <div style={{ ...styles.formGrid, marginTop: 10 }}>
          <button type="button" style={{ ...styles.infoCard, textAlign: "left", cursor: "pointer", border: invoiceReviewWarningSummary.unknownRowsCount > 0 ? "1px solid rgba(245, 158, 11, 0.55)" : styles.infoCard?.border }} onClick={() => handleJumpToInvoiceFilter("unknown")}>
            <div style={styles.infoCardTitle}>Mystery Rows</div>
            <div style={{ ...styles.infoCardText, color: invoiceReviewWarningSummary.unknownRowsCount > 0 ? "#fde68a" : undefined }}>{invoiceReviewWarningSummary.unknownRowsCount}</div>
            <div style={styles.infoCardSubtext}>Show the mystery rows</div>
          </button>
          <button type="button" style={{ ...styles.infoCard, textAlign: "left", cursor: "pointer", border: invoiceReviewWarningSummary.unmatchedFoodCount > 0 ? "1px solid rgba(248, 113, 113, 0.55)" : styles.infoCard?.border }} onClick={() => handleJumpToInvoiceFilter("unmatched_food")}>
            <div style={styles.infoCardTitle}>Food With No Match</div>
            <div style={{ ...styles.infoCardText, color: invoiceReviewWarningSummary.unmatchedFoodCount > 0 ? "#fecaca" : undefined }}>{invoiceReviewWarningSummary.unmatchedFoodCount}</div>
            <div style={styles.infoCardSubtext}>Link the food before locking</div>
          </button>
          <button type="button" style={{ ...styles.infoCard, textAlign: "left", cursor: "pointer", border: invoiceReviewWarningSummary.priceWarningCount > 0 ? "1px solid rgba(248, 113, 113, 0.55)" : styles.infoCard?.border }} onClick={() => handleJumpToInvoiceFilter("price_warnings")}>
            <div style={styles.infoCardTitle}>Price Smacks</div>
            <div style={{ ...styles.infoCardText, color: invoiceReviewWarningSummary.priceWarningCount > 0 ? "#fca5a5" : undefined }}>{invoiceReviewWarningSummary.priceWarningCount}</div>
            <div style={styles.infoCardSubtext}>Check the price punch</div>
          </button>
          <button type="button" style={{ ...styles.infoCard, textAlign: "left", cursor: "pointer", border: invoiceReviewWarningSummary.duplicateWarningCount > 0 ? "1px solid rgba(248, 113, 113, 0.55)" : styles.infoCard?.border }} onClick={() => handleJumpToInvoiceFilter("duplicates")}>
            <div style={styles.infoCardTitle}>Double-Dip Warnings</div>
            <div style={{ ...styles.infoCardText, color: invoiceReviewWarningSummary.duplicateWarningCount > 0 ? "#fca5a5" : undefined }}>{invoiceReviewWarningSummary.duplicateWarningCount}</div>
            <div style={styles.infoCardSubtext}>Check the double dip</div>
          </button>
        </div>
        <div style={styles.infoCardSubtext}>Tap the problem. GP Police takes you there.</div>
      </div>

      <div style={{ ...styles.infoCard, marginTop: 10, border: "1px solid rgba(34, 197, 94, 0.28)", background: "rgba(34, 197, 94, 0.07)" }}>
        <div style={styles.infoCardTitle}>Ready To Lock?</div>
        <div style={{ ...styles.formGrid, marginTop: 10 }}>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Safe Rows</div>
            <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.readyRowsCount > 0 ? "#bbf7d0" : undefined }}>
              {invoiceReviewReadinessSummary.readyRowsCount}
            </div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Needs A Decision</div>
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
            <div style={styles.infoCardTitle}>Food With No Match</div>
            <div style={{ ...styles.infoCardText, color: invoiceReviewReadinessSummary.unmatchedFoodCount > 0 ? "#fecaca" : undefined }}>
              {invoiceReviewReadinessSummary.unmatchedFoodCount}
            </div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Price Smacks</div>
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
        <div style={styles.infoCardTitle}>{invoiceSafeToLockTone === "safe" ? "✅ Safe To Lock Check" : "⚠️ Not Ready To Lock"}</div>
        <div style={styles.infoCardSubtext}>Dirty rows get stopped before they hit stock.</div>
        <div style={styles.infoCardText}>
          {invoiceSafeToLockTone === "safe"
            ? "No mystery rows or unmatched food. Still check price smacks."
            : `Still ugly: ${invoiceReviewReadinessSummary.unknownRowsCount} unknown row(s), ${invoiceReviewReadinessSummary.unmatchedFoodCount} unmatched food row(s).`}
        </div>
      </div>
    </>
  );
}
