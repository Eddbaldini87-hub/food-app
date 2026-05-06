export function InvoiceRowDiagnosticsPanel(props: any) {
  const {
    styles,
    row,
    selectedSupplier,
    showInvoiceAccuracyLab,
    showInvoiceMatchDebug,
    getInvoiceDebugCleanName,
    getInvoiceCogsCategoryBadgeStyle,
    getInvoiceCogsCategoryLabel,
    getInvoiceReviewBadgeStyle,
    getInvoiceRowReviewState,
    getInvoiceRowMergedWarning,
    getInvoiceCogsCategoryHelpText,
    getInvoiceMatchLabel,
    getInvoiceRowCogsType,
  } = props;

  return (
    <>
      {showInvoiceAccuracyLab ? (
        <div
          style={{
            ...styles.infoCard,
            marginTop: 10,
            border: "1px dashed rgba(96, 165, 250, 0.5)",
            background: "rgba(59, 130, 246, 0.08)",
          }}
        >
          <div style={styles.infoCardTitle}>Nerd Lab Row Check</div>
          <div style={styles.infoCardSubtext}>Parser source: {String(row?.recoverySource || row?.parserSource || "current review row")} · Clean key: {getInvoiceDebugCleanName(row)}</div>
          <div style={styles.infoCardSubtext}>Row shape: {String(row?.rowShape || "not scored")} · Shape confidence: {String(row?.rowShapeConfidence || "unknown")} · Parser score: {String(row?.parserScoreContribution ?? "n/a")}</div>
          <div style={{ ...styles.buttonRow, marginTop: 8 }}>
            <span style={getInvoiceCogsCategoryBadgeStyle(row)}>{getInvoiceCogsCategoryLabel(row)}</span>
            <span style={getInvoiceReviewBadgeStyle(row)}>{getInvoiceRowReviewState(row).label}</span>
            {(row?.suspectedMergedRow || getInvoiceRowMergedWarning(row)) ? <span style={{ ...getInvoiceReviewBadgeStyle({ cogsType: "unknown" }), color: "#fecaca" }}>Possible mashed-together OCR row</span> : null}
          </div>
          <div style={{ ...styles.formGrid, marginTop: 10 }}>
            <div style={styles.formGroup}><label style={styles.label}>Raw Line</label><textarea value={String(row?.rawLine || "No raw line stored")} readOnly style={{ ...styles.textarea, minHeight: 80, fontFamily: "monospace", fontSize: 12 }} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Row Shape Reason</label><textarea value={String(row?.rowShapeReason || "No row shape diagnostics stored")} readOnly style={{ ...styles.textarea, minHeight: 80 }} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Parser Score Reasons</label><textarea value={Array.isArray(row?.parserScoreReasons) ? row.parserScoreReasons.join("\n") : String(row?.parserScoreReasons || "No parser score reasons stored")} readOnly style={{ ...styles.textarea, minHeight: 80 }} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Category Reason</label><textarea value={String(row?.cogsCategoryReason || row?.categoryReason || getInvoiceCogsCategoryHelpText(row))} readOnly style={{ ...styles.textarea, minHeight: 80 }} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Match Sniffer Reason</label><textarea value={String(row?.matchReason || row?.matchDebugReason || row?.supplierMatchKey || getInvoiceMatchLabel(row))} readOnly style={{ ...styles.textarea, minHeight: 80 }} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Confidence Reason</label><textarea value={String(row?.confidenceReason || row?.rowConfidenceReason || getInvoiceRowReviewState(row).helper)} readOnly style={{ ...styles.textarea, minHeight: 80 }} /></div>
          </div>
        </div>
      ) : null}

      {showInvoiceMatchDebug ? (
        <div
          style={{
            ...styles.infoCard,
            marginTop: 10,
            border: "1px dashed rgba(59, 130, 246, 0.45)",
            background: "rgba(59, 130, 246, 0.08)",
          }}
        >
          <div style={styles.infoCardTitle}>Match Sniffer</div>
          <div style={styles.infoCardSubtext}>Read-only. Shows why GP Police did or didn’t match it.</div>
          <div style={{ ...styles.formGrid, marginTop: 10 }}>
            <div style={styles.formGroup}><label style={styles.label}>Cleaned Row Name</label><input value={getInvoiceDebugCleanName(row)} readOnly style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Matched Ingredient</label><input value={String(row?.matchedIngredientName || "No matched ingredient")} readOnly style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Match Strength</label><input value={String(row?.matchConfidence || "low")} readOnly style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Linked Ingredient ID</label><input value={String(row?.linkedIngredientId || "Not linked")} readOnly style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Status</label><input value={String(row?.status || "needs_match")} readOnly style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>COGS Bucket</label><input value={`${getInvoiceRowCogsType(row)} / ${String(row?.cogsCategory || row?.category || "unknown")}`} readOnly style={styles.input} /></div>
          </div>
          <div style={styles.infoCardSubtext}>Cleaned Name: {String(row.cleanedInvoiceName || getInvoiceDebugCleanName(row) || "")}</div>
          <div style={styles.infoCardSubtext}>Match Reason: {String(row.matchDebugReason || "No debug reason")}</div>
          <div style={styles.infoCardSubtext}>Match Score: {String(row.matchDebugScore ?? "0")}</div>
          <div style={styles.infoCardSubtext}>Candidates Checked: {String(row.matchDebugCandidateCount ?? "0")}</div>
          <div style={styles.infoCardSubtext}>Supplier Match Key: {String(row.supplierMatchKey || "Not prepared")}</div>
          <div style={styles.infoCardSubtext}>Supplier For Learning: {String(row.supplierNameForLearning || selectedSupplier?.name || "Unknown supplier")}</div>
          <div style={styles.infoCardSubtext}>Suggested Learning Label: {String(row.suggestedLearningLabel || "No learning label prepared")}</div>
          <div style={styles.infoCardSubtext}>Nothing learned yet until you tell it.</div>
        </div>
      ) : null}
    </>
  );
}
