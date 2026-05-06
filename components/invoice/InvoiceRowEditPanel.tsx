export function InvoiceRowEditPanel(props: any) {
  const {
    styles,
    row,
    isCompactReviewMode,
    isFixPanelOpen,
    invoiceRowNameInputRef,
    sizeUnitOptions,
    componentUnitOptions,
    purchaseUnitOptions,
    supplierIngredients,
    selectedSupplier,
    orderingMeta,
    formatCurrency,
    updateSupplierInvoiceRow,
    updateRowAndMoveNext,
    markRowCogsAndMoveNext,
    moveToNextInvoiceProblem,
    handleCreateIngredientFromInvoiceRow,
    getInvoiceRowCogsType,
  } = props;

  return (
    <>
      {isFixPanelOpen ? (
        <div style={{ ...styles.infoCard, border: "1px solid rgba(245, 158, 11, 0.42)", background: "rgba(245, 158, 11, 0.08)" }}>
          <div style={styles.infoCardTitle}>Fix This Row Properly</div>
          <div style={styles.infoCardSubtext}>Clean the OCR and pack info. One row at a time.</div>
          <label style={styles.label}>Raw OCR Mess</label>
          <textarea value={row.rawLine || ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "rawLine", event.target.value)} style={styles.textarea} />
          <div style={styles.formGrid}>
            <div style={styles.formGroup}><label style={styles.label}>Amount In Pack</label><input value={row.amountInPurchaseUnit || "1"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "amountInPurchaseUnit", event.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Size Per Item</label><input value={row.sizePerItem || "1"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "sizePerItem", event.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Size Unit</label><select value={row.sizeUnit || "each"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "sizeUnit", event.target.value)} style={styles.input}>{sizeUnitOptions.map((unit: string) => <option key={unit} value={unit}>{unit}</option>)}</select></div>
          </div>
        </div>
      ) : null}

      {(!isCompactReviewMode || isFixPanelOpen) ? (
        <>
          <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={!!row.selected} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "selected", event.target.checked)} />
            Use this line
          </label>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}><label style={styles.label}>Item Name</label><input ref={invoiceRowNameInputRef} value={row.name || ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "name", event.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Code</label><input value={row.code || ""} readOnly style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Qty</label><input value={row.qty ?? ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "qty", event.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Unit</label>
              <select value={row.unit || "each"} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "unit", event.target.value)} style={styles.input}>
                {[...new Set([...componentUnitOptions, ...purchaseUnitOptions])].map((unit: string) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}><label style={styles.label}>Unit Price</label><input value={row.unitPrice ?? ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "unitPrice", event.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Line Total</label><input value={row.lineTotal ?? ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "lineTotal", event.target.value)} style={styles.input} /></div>
            {!isCompactReviewMode ? (
              <>
                <div style={styles.formGroup}><label style={styles.label}>Pack Size</label><input value={`${row.amountInPurchaseUnit || "1"} x ${row.sizePerItem || "1"} ${row.sizeUnit || "each"}`} readOnly style={styles.input} /></div>
                <div style={styles.formGroup}><label style={styles.label}>Confidence</label><input value={row.confidence || "low"} readOnly style={styles.input} /></div>
              </>
            ) : null}
            <div style={styles.formGroup}>
              <label style={styles.label}>COGS Category</label>
              <select value={getInvoiceRowCogsType(row)} onChange={(event: any) => markRowCogsAndMoveNext(event.target.value)} style={styles.input}>
                <option value="food_cogs">Food COGS</option>
                <option value="consumable_cogs">Consumable COGS</option>
                <option value="non_cogs">Not GP / Cleaning / Sundries</option>
                <option value="unknown">Unknown / Needs Review</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Match Ingredient</label>
              <select value={row.linkedIngredientId || ""} onChange={(event: any) => updateRowAndMoveNext("linkedIngredientId", event.target.value)} style={styles.input}>
                <option value="">Needs match</option>
                {(Array.isArray(supplierIngredients) ? supplierIngredients : [])
                  .filter((ingredient: any) => !selectedSupplier?.name || String(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim() === selectedSupplier.name)
                  .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")))
                  .map((ingredient: any) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
              </select>
            </div>
            {row.status === "create_new" ? (
              <div style={styles.formGroup}>
                <label style={styles.label}>New Ingredient Preview</label>
                <div style={styles.infoCardSubtext}>
                  {String(row.name || "Unnamed item")} · {formatCurrency(row.purchasePrice || row.lineTotal || row.unitPrice)} · {String(row.purchaseUnit || "box")} · {String(row.amountInPurchaseUnit || "1")} x {String(row.sizePerItem || "1")} {String(row.sizeUnit || "each")}
                </div>
                {getInvoiceRowCogsType(row) === "food_cogs" ? (
                  <button type="button" style={styles.primaryButton} onClick={() => { handleCreateIngredientFromInvoiceRow(row.id); moveToNextInvoiceProblem(); }}>Create Ingredient From Row</button>
                ) : (
                  <div style={styles.infoCardSubtext}>Consumables and unknown rows do not create recipe ingredients. Change this row to Food COGS first if it belongs in recipes.</div>
                )}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );
}
