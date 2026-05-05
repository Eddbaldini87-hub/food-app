export function InvoiceReviewRowCard(props: any) {
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

  const row = props.row;
  const reviewState = getInvoiceRowReviewState(row);
  const isLinked = !!String(row?.linkedIngredientId || "").trim();
  const priceUpdateSuggestion = getInvoicePriceUpdateSuggestion(row);
  const isCompactReviewMode = invoiceReviewMode === "compact";
  const isFixPanelOpen = invoiceFixingRowId === row.id;
  const canLearnSupplierMatch = Boolean(String(row?.linkedIngredientId || "").trim()) && Boolean(String(row?.supplierMatchKey || "").trim());
  const supplierMatchLearningSaved = Boolean(savedSupplierMatchRows[String(row?.id || row?.supplierMatchKey || "")]);

  return (
    <>
      <div key={row.id} id={`invoice-row-${row.id}`} style={getInvoiceRowReviewCardStyle(row)}>
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
              <span style={styles.infoCardSubtext}>Saved for next invoices</span>
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
            <div style={{ ...styles.infoCardSubtext, marginTop: 4 }}>Tap to open the row editor.</div>
          </button>
        ) : (
          <div style={styles.infoCardSubtext}>Raw line: {String(row.rawLine || "")}</div>
        )}
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
              <div style={{ ...styles.infoCardText, color: "#fde68a", fontWeight: 900 }}>
                Price update suggested
              </div>
              <div style={styles.infoCardSubtext}>
                Current ingredient price: {formatCurrency(priceUpdateSuggestion.currentIngredientPrice || 0)} · Invoice price: {formatCurrency(priceUpdateSuggestion.invoicePrice || 0)} · Increase: {Math.round(priceUpdateSuggestion.percentIncrease || 0)}%
              </div>
              <button
                type="button"
                style={{ ...styles.secondaryButton, marginTop: 8 }}
                onClick={() => handleUpdateIngredientPriceFromInvoiceRow(row)}
              >
                Update Ingredient Price
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div style={styles.buttonRow}>
        <button type="button" style={row.status === "matched" ? styles.primaryButton : styles.secondaryButton} onClick={() => setSupplierInvoiceRowStatus(row.id, "matched")}>Matched</button>
        <button type="button" style={row.status === "create_new" ? styles.primaryButton : styles.secondaryButton} onClick={() => setSupplierInvoiceRowStatus(row.id, "create_new")}>Create New</button>
        <button type="button" style={row.status === "ignore" ? styles.primaryButton : styles.secondaryButton} onClick={() => setSupplierInvoiceRowStatus(row.id, "ignore")}>Ignore Line</button>
        {canLearnSupplierMatch ? (
          <button type="button" style={supplierMatchLearningSaved ? styles.primaryButton : styles.secondaryButton} onClick={() => handleLearnSupplierMatchFromRow(row)}>
            {supplierMatchLearningSaved ? "Saved ✓" : "Learn Match"}
          </button>
        ) : null}
        <button type="button" style={isFixPanelOpen ? styles.primaryButton : styles.secondaryButton} onClick={() => setInvoiceFixingRowId(isFixPanelOpen ? null : row.id)}>{isFixPanelOpen ? "Close Fix Panel" : "Expand Fix Panel"}</button>
      </div>
      {isFixPanelOpen ? (
        <div style={{ ...styles.infoCard, border: "1px solid rgba(245, 158, 11, 0.42)", background: "rgba(245, 158, 11, 0.08)" }}>
          <div style={styles.infoCardTitle}>Fix Panel Open — Selected Row Only</div>
          <div style={styles.infoCardSubtext}>Edit the OCR and pack details for this row. Other rows stay closed.</div>
          <label style={styles.label}>Raw OCR Line</label>
          <textarea value={row.rawLine || ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "rawLine", event.target.value)} style={styles.textarea} />
          <div style={styles.formGrid}>
            <div style={styles.formGroup}><label style={styles.label}>Amount In Pack</label><input value={row.amountInPurchaseUnit || "1"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "amountInPurchaseUnit", event.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Size Per Item</label><input value={row.sizePerItem || "1"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "sizePerItem", event.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Size Unit</label><select value={row.sizeUnit || "each"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "sizeUnit", event.target.value)} style={styles.input}>{sizeUnitOptions.map((unit: string) => <option key={unit} value={unit}>{unit}</option>)}</select></div>
          </div>
        </div>
      ) : null}
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
      {showInvoiceAccuracyLab ? (
        <div
          style={{
            ...styles.infoCard,
            marginTop: 10,
            border: "1px dashed rgba(96, 165, 250, 0.5)",
            background: "rgba(59, 130, 246, 0.08)",
          }}
        >
          <div style={styles.infoCardTitle}>Accuracy Lab Row Diagnostics</div>
          <div style={styles.infoCardSubtext}>Recovery source: {String(row?.recoverySource || row?.parserSource || "current review row")} · Clean key: {getInvoiceDebugCleanName(row)}</div>
          <div style={styles.infoCardSubtext}>Row shape: {String(row?.rowShape || "not scored")} · Shape confidence: {String(row?.rowShapeConfidence || "unknown")} · Parser score: {String(row?.parserScoreContribution ?? "n/a")}</div>
          <div style={{ ...styles.buttonRow, marginTop: 8 }}>
            <span style={getInvoiceCogsCategoryBadgeStyle(row)}>{getInvoiceCogsCategoryLabel(row)}</span>
            <span style={getInvoiceReviewBadgeStyle(row)}>{getInvoiceRowReviewState(row).label}</span>
            {(row?.suspectedMergedRow || getInvoiceRowMergedWarning(row)) ? <span style={{ ...getInvoiceReviewBadgeStyle({ cogsType: "unknown" }), color: "#fecaca" }}>Possible merged OCR row</span> : null}
          </div>
          <div style={{ ...styles.formGrid, marginTop: 10 }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Raw Line</label>
              <textarea value={String(row?.rawLine || "No raw line stored")} readOnly style={{ ...styles.textarea, minHeight: 80, fontFamily: "monospace", fontSize: 12 }} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Row Shape Reason</label>
              <textarea value={String(row?.rowShapeReason || "No row shape diagnostics stored")} readOnly style={{ ...styles.textarea, minHeight: 80 }} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Parser Score Reasons</label>
              <textarea value={Array.isArray(row?.parserScoreReasons) ? row.parserScoreReasons.join("\n") : String(row?.parserScoreReasons || "No parser score reasons stored")} readOnly style={{ ...styles.textarea, minHeight: 80 }} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category Reason</label>
              <textarea value={String(row?.cogsCategoryReason || row?.categoryReason || getInvoiceCogsCategoryHelpText(row))} readOnly style={{ ...styles.textarea, minHeight: 80 }} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Match Debug Reason</label>
              <textarea value={String(row?.matchReason || row?.matchDebugReason || row?.supplierMatchKey || getInvoiceMatchLabel(row))} readOnly style={{ ...styles.textarea, minHeight: 80 }} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Confidence Reason</label>
              <textarea value={String(row?.confidenceReason || row?.rowConfidenceReason || getInvoiceRowReviewState(row).helper)} readOnly style={{ ...styles.textarea, minHeight: 80 }} />
            </div>
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
          <div style={styles.infoCardTitle}>Match Debug</div>
          <div style={styles.infoCardSubtext}>Read-only. Shows why this row did or did not match after parsing.</div>
          <div style={{ ...styles.formGrid, marginTop: 10 }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Cleaned Invoice Row Name</label>
              <input value={getInvoiceDebugCleanName(row)} readOnly style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Matched Ingredient Name</label>
              <input value={String(row?.matchedIngredientName || "No matched ingredient")} readOnly style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Match Confidence</label>
              <input value={String(row?.matchConfidence || "low")} readOnly style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Linked Ingredient ID</label>
              <input value={String(row?.linkedIngredientId || "Not linked")} readOnly style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <input value={String(row?.status || "needs_match")} readOnly style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>COGS Type / Category</label>
              <input value={`${getInvoiceRowCogsType(row)} / ${String(row?.cogsCategory || row?.category || "unknown")}`} readOnly style={styles.input} />
            </div>
          </div>
          <div style={styles.infoCardSubtext}>Cleaned Name: {String(row.cleanedInvoiceName || getInvoiceDebugCleanName(row) || "")}</div>
          <div style={styles.infoCardSubtext}>Match Reason: {String(row.matchDebugReason || "No debug reason")}</div>
          <div style={styles.infoCardSubtext}>Match Score: {String(row.matchDebugScore ?? "0")}</div>
          <div style={styles.infoCardSubtext}>Candidates Checked: {String(row.matchDebugCandidateCount ?? "0")}</div>
          <div style={styles.infoCardSubtext}>Supplier Match Key: {String(row.supplierMatchKey || "Not prepared")}</div>
          <div style={styles.infoCardSubtext}>Supplier For Learning: {String(row.supplierNameForLearning || selectedSupplier?.name || "Unknown supplier")}</div>
          <div style={styles.infoCardSubtext}>Suggested Learning Label: {String(row.suggestedLearningLabel || "No learning label prepared")}</div>
          <div style={styles.infoCardSubtext}>Learning is prepared only — nothing is saved yet.</div>
        </div>
      ) : null}
      
      {(!isCompactReviewMode || isFixPanelOpen) ? (
        <>
          <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={!!row.selected} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "selected", event.target.checked)} />
            Use this line for review
          </label>
          <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Item Name</label>
          <input value={row.name || ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "name", event.target.value)} style={styles.input} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Code</label>
          <input value={row.code || ""} readOnly style={styles.input} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Qty</label>
          <input value={row.qty ?? ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "qty", event.target.value)} style={styles.input} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Unit</label>
          <select value={row.unit || "each"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "unit", event.target.value)} style={styles.input}>
            {[...new Set([...componentUnitOptions, ...purchaseUnitOptions])].map((unit: string) => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Unit Price</label>
          <input value={row.unitPrice ?? ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "unitPrice", event.target.value)} style={styles.input} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Line Total</label>
          <input value={row.lineTotal ?? ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "lineTotal", event.target.value)} style={styles.input} />
        </div>
        {!isCompactReviewMode ? (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label}>Pack Size</label>
              <input value={`${row.amountInPurchaseUnit || "1"} x ${row.sizePerItem || "1"} ${row.sizeUnit || "each"}`} readOnly style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Confidence</label>
              <input value={row.confidence || "low"} readOnly style={styles.input} />
            </div>
          </>
        ) : null}
        <div style={styles.formGroup}>
          <label style={styles.label}>COGS Category</label>
          <select
            value={getInvoiceRowCogsType(row)}
            onChange={(event: any) => updateSupplierInvoiceRow(row.id, "cogsCategory", event.target.value)}
            style={styles.input}
          >
            <option value="food_cogs">Food COGS</option>
            <option value="consumable_cogs">Consumable COGS</option>
            <option value="non_cogs">Non-COGS / Cleaning / Sundries</option>
            <option value="unknown">Unknown / Needs Review</option>
          </select>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Match Ingredient</label>
          <select value={row.linkedIngredientId || ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "linkedIngredientId", event.target.value)} style={styles.input}>
            <option value="">Needs match</option>
            {(Array.isArray(supplierIngredients) ? supplierIngredients : [])
              .filter((ingredient: any) => !selectedSupplier?.name || String(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim() === selectedSupplier.name)
              .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")))
              .map((ingredient: any) => (
                <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
              ))}
          </select>
        </div>
        {row.status === "create_new" ? (
          <div style={styles.formGroup}>
            <label style={styles.label}>New Ingredient Preview</label>
            <div style={styles.infoCardSubtext}>
              {String(row.name || "Unnamed item")} · {formatCurrency(row.purchasePrice || row.lineTotal || row.unitPrice)} · {String(row.purchaseUnit || "box")} · {String(row.amountInPurchaseUnit || "1")} x {String(row.sizePerItem || "1")} {String(row.sizeUnit || "each")}
            </div>
            {getInvoiceRowCogsType(row) === "food_cogs" ? (
              <button type="button" style={styles.primaryButton} onClick={() => handleCreateIngredientFromInvoiceRow(row.id)}>Create Ingredient From Row</button>
            ) : (
              <div style={styles.infoCardSubtext}>Consumables and unknown rows do not create recipe ingredients. Change this row to Food COGS first if it belongs in recipes.</div>
            )}
          </div>
        ) : null}
          </div>
        </>
      ) : null}
      </div>
    </>
  );
}
