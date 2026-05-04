import React, { type CSSProperties } from "react";

type SuppliersProps = Record<string, any>;

export function Suppliers(props: SuppliersProps) {
  const {
    activeView,
    styles,
    ingredientForm,
    supplierDirectory,
    purchasePriceInputValue,
    purchaseUnitOptions,
    sizeUnitOptions,
    supplierIngredients,
    componentUnitOptions,
    orderingMeta,
    defaultSupplierForm,
    supplierDayOptions,
    handleIngredientFormChange,
    setIngredientSupplierName,
    handlePurchasePriceFocus,
    handlePurchasePriceChange,
    handlePurchasePriceBlur,
    saveIngredient,
    clearIngredientForm,
    formatCurrency,
    roundTo,
    getIngredientSummaryDisplay,
    editIngredient,
    deleteIngredient,
    supplierInvoiceViewOpen,
    selectedSupplier,
    selectedSupplierEmailAddress,
    supplierEmailHref,
    selectedSupplierIngredients,
    supplierInvoiceText,
    supplierInvoiceRows,
    supplierInvoiceMessage,
    supplierInvoicePhotoName,
    supplierInvoicePhotoPreviewUrl,
    invoiceQualityWarning,
    invoiceDraftMessage,
    invoiceDraft,
    lockedInvoiceHistory,
    invoiceIntakeMeta,
    invoiceLockSummary,
    filteredSupplierDirectory,
    supplierSearchTerm,
    showSupplierForm,
    supplierForm,
    supplierMessage,
    setSupplierMessage,
    setSupplierInvoiceViewOpen,
    setSupplierInvoiceText,
    setSupplierInvoiceRows,
    setSupplierInvoiceMessage,
    setSupplierInvoicePhotoPreviewUrl,
    setSupplierInvoicePhotoName,
    invoiceCameraInputRef,
    handleSupplierInvoiceFileUpload,
    parseInvoiceForSelectedSupplier,
    handleSaveInvoiceDraft,
    handleLoadInvoiceDraft,
    handleDeleteInvoiceDraft,
    handleLockInvoiceIntoStock,
    updateSupplierInvoiceRow,
    setSupplierInvoiceRowStatus,
    handleCreateIngredientFromInvoiceRow,
    setInvoiceFixingRowId,
    invoiceFixingRowId,
    setInvoiceIntakeMeta,
    setInvoiceDraftMessage,
    setInvoiceQualityWarning,
    setSupplierSearchTerm,
    setShowSupplierForm,
    saveSupplier,
    handleSupplierFormChange,
    toggleSupplierDay,
    resetSupplierForm,
    editSupplier,
    deleteSupplier,
    setSelectedSupplierId,
    setSupplierForm,
  } = props;

  const renderIngredientsPage = () => {
    const formDerived = getIngredientSummaryDisplay(ingredientForm);

    return (
      <div style={styles.pageWrapper}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Manage Ingredients</h1>
          <p style={styles.pageSubtitle}>
            Lock in supplier pricing, base-unit costs, and stop pretending a carton costs whatever feels right.
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            {ingredientForm.id ? "Fix Supplier Ingredient" : "Add Supplier Ingredient"}
          </h2>

          <form onSubmit={saveIngredient} style={styles.formWrapper}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ingredient Name</label>
                <input
                  type="text"
                  value={ingredientForm.name}
                  onChange={(event: any) => handleIngredientFormChange("name", event.target.value)}
                  style={styles.input}
                  placeholder="e.g. Chips"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Supplier Name</label>
                <input
                  type="text"
                  value={ingredientForm.supplierName}
                  onChange={(event: any) => {
                    handleIngredientFormChange("supplierName", event.target.value);
                    setIngredientSupplierName(event.target.value);
                  }}
                  style={styles.input}
                  placeholder="e.g. Bidfood"
                  list="supplier-name-options"
                />
                <datalist id="supplier-name-options">
                  {supplierDirectory.map((supplier: any) => (
                    <option key={supplier.id} value={supplier.name} />
                  ))}
                </datalist>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Purchase Price</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={purchasePriceInputValue}
                  onFocus={handlePurchasePriceFocus}
                  onChange={(event: any) => {
                    handlePurchasePriceChange(event.target.value);
                    handleIngredientFormChange("supplierUnitCost", event.target.value.replace(/[^0-9.]/g, ""));
                  }}
                  onBlur={handlePurchasePriceBlur}
                  style={styles.input}
                  placeholder="e.g. 48"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Purchase Unit</label>
                <select
                  value={ingredientForm.purchaseUnit}
                  onChange={(event: any) => handleIngredientFormChange("purchaseUnit", event.target.value)}
                  style={styles.select}
                >
                  {purchaseUnitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Amount in Purchase Unit</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ingredientForm.amountInPurchaseUnit}
                  onChange={(event: any) => handleIngredientFormChange("amountInPurchaseUnit", event.target.value)}
                  style={styles.input}
                  placeholder="e.g. 12"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Supplier Pack Size (base units)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ingredientForm.supplierPackSize}
                  onChange={(event: any) => handleIngredientFormChange("supplierPackSize", event.target.value)}
                  style={styles.input}
                  placeholder="Auto from pack size"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Size per Item</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ingredientForm.sizePerItem}
                  onChange={(event: any) => handleIngredientFormChange("sizePerItem", event.target.value)}
                  style={styles.input}
                  placeholder="e.g. 1"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Size Unit</label>
                <select
                  value={ingredientForm.sizeUnit}
                  onChange={(event: any) => handleIngredientFormChange("sizeUnit", event.target.value)}
                  style={styles.select}
                >
                  {sizeUnitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.summaryBar}>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Purchase Price</div>
                <div style={styles.summaryValue}>{formatCurrency(ingredientForm.purchasePrice)}</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Total Quantity</div>
                <div style={styles.summaryValue}>{formDerived.visibleQuantity}</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>{formDerived.displayCostLabel}</div>
                <div style={styles.summaryValue}>{formDerived.visibleCost}</div>
              </div>
            </div>

            <div style={styles.buttonRow}>
              <button type="submit" style={styles.primaryButton}>
                {ingredientForm.id ? "Fix It" : "Lock It In"}
              </button>
              <button type="button" style={styles.secondaryButton} onClick={clearIngredientForm}>
                Clear
              </button>
            </div>
          </form>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Saved Supplier Lines</h2>

          {supplierIngredients.length === 0 ? (
            <div style={styles.emptyState}>No ingredients logged — start building your base</div>
          ) : (
            <div style={styles.cardGrid}>
              {supplierIngredients.map((ingredient) => {
                const summary = getIngredientSummaryDisplay(ingredient);

                return (
                  <div key={ingredient.id} style={styles.infoCard}>
                    <div style={styles.infoCardHeader}>
                      <div>
                        <div style={styles.infoCardTitle}>{ingredient.name}</div>
                        <div style={styles.infoCardSubtext}>
                          Purchase: {formatCurrency(ingredient.purchasePrice)} per {ingredient.purchaseUnit}
                        </div>
                      </div>
                      <div style={styles.inlineButtonRow}>
                        <button
                          type="button"
                          style={styles.smallButton}
                          onClick={() => editIngredient(ingredient)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          style={styles.smallDangerButton}
                          onClick={() => deleteIngredient(ingredient.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div style={styles.infoCardText}>Supplier: {ingredient.supplierName || "Not set"}</div>
                    <div style={styles.infoCardText}>
                      Pack Size: {roundTo(ingredient.amountInPurchaseUnit, 2)} x{" "}
                      {roundTo(ingredient.sizePerItem, 2)} {ingredient.sizeUnit}
                    </div>
                    <div style={styles.infoCardText}>
                      Base Quantity: {roundTo(ingredient.baseQuantity || summary.totalQuantity, 2)} {summary.baseUnit}
                    </div>
                    <div style={styles.infoCardText}>Total Quantity: {summary.visibleQuantity}</div>
                    <div style={styles.infoCardText}>{summary.displayCostLabel}</div>
                    <div style={styles.infoCardCostMain}>{summary.visibleCost}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getInvoiceConfidenceBadgeStyle = (confidence: string): CSSProperties => {
    if (confidence === "high") return { ...styles.statusBadge, background: "rgba(34, 197, 94, 0.18)", borderColor: "rgba(34, 197, 94, 0.45)", color: "#bbf7d0" };
    if (confidence === "medium") return { ...styles.statusBadge, background: "rgba(250, 204, 21, 0.18)", borderColor: "rgba(250, 204, 21, 0.45)", color: "#fef08a" };
    return { ...styles.statusBadge, background: "rgba(248, 113, 113, 0.18)", borderColor: "rgba(248, 113, 113, 0.45)", color: "#fecaca" };
  };

  const getInvoiceStatusLabel = (row: any) => {
    if (row?.selected === false || row?.status === "ignore") return "Ignored";
    if (row?.status === "matched" && row?.linkedIngredientId) return "Matched";
    if (row?.status === "create_new" || row?.createNewIngredient) return "Create New";
    if (row?.confidence === "low") return "Low Confidence";
    return "Needs Match";
  };

  const getInvoiceStatusBadgeStyle = (row: any): CSSProperties => {
    const label = getInvoiceStatusLabel(row);
    if (label === "Matched") return { ...styles.statusBadge, background: "rgba(34, 197, 94, 0.18)", borderColor: "rgba(34, 197, 94, 0.45)", color: "#bbf7d0" };
    if (label === "Low Confidence") return { ...styles.statusBadge, background: "rgba(248, 113, 113, 0.18)", borderColor: "rgba(248, 113, 113, 0.45)", color: "#fecaca" };
    return { ...styles.statusBadge, background: "rgba(250, 204, 21, 0.18)", borderColor: "rgba(250, 204, 21, 0.45)", color: "#fef08a" };
  };

  const setAllSupplierInvoiceRowsSelected = (selected: boolean) => {
    setSupplierInvoiceRows((previous: any[]) => previous.map((row: any) => ({ ...row, selected, status: selected && row.status === "ignore" ? "needs_match" : row.status })));
  };

  const renderSupplierInvoiceImportPanel = () => (
              <div id="supplier-invoice-import" style={styles.cardInset}>
                <div style={styles.sectionGroupHeaderRow}>
                  <div>
                    <h3 style={styles.sectionGroupTitle}>Invoice Import</h3>
                    <div style={styles.infoCardSubtext}>Photo preview is active. OCR has pulled the invoice text below — review the rows before locking anything into stock.</div>
                  </div>
                </div>

                <div style={styles.infoCard}>
                  <div style={styles.infoCardTitle}>Invoice workflow</div>
                  <div style={styles.infoCardText}>Step 1: Take/upload photo</div>
                  <div style={styles.infoCardText}>Step 2: Paste invoice text or upload text/CSV export</div>
                  <div style={styles.infoCardText}>Step 3: Scan Invoice Text</div>
                  <div style={styles.infoCardText}>Step 4: Review items before adding to ingredients</div>
                </div>

                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Invoice Number</label>
                    <input
                      type="text"
                      value={invoiceIntakeMeta.invoiceNumber}
                      onChange={(event: any) => setInvoiceIntakeMeta((previous: any) => ({ ...previous, invoiceNumber: event.target.value }))}
                      style={styles.input}
                      placeholder="e.g. INV-10234"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Invoice Date</label>
                    <input
                      type="date"
                      value={invoiceIntakeMeta.invoiceDate}
                      onChange={(event: any) => setInvoiceIntakeMeta((previous: any) => ({ ...previous, invoiceDate: event.target.value }))}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Upload Text / CSV Export or Invoice Photo</label>
                  <input type="file" accept=".txt,.csv,text/plain,text/csv,image/*" onChange={(event: any) => handleSupplierInvoiceFileUpload(event.target.files?.[0] || null)} style={styles.input} />
                  <input
                    ref={invoiceCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={(event: any) => {
                      const file = event.target.files?.[0] || null;
                      handleSupplierInvoiceFileUpload(file);
                      event.target.value = "";
                    }}
                  />
                  <div style={styles.buttonRow}>
                    <button type="button" style={styles.secondaryButton} onClick={() => invoiceCameraInputRef.current?.click()}>
                      📷 Take Invoice Photo
                    </button>
                  </div>
                </div>

                {supplierInvoicePhotoName ? (
                  <div style={styles.infoCard}>
                    <div style={styles.infoCardTitle}>Photo uploaded</div>
                    <div style={styles.infoCardText}>{supplierInvoicePhotoName}</div>
                    {supplierInvoicePhotoPreviewUrl ? <img src={supplierInvoicePhotoPreviewUrl} alt="Uploaded invoice preview" style={{ width: "100%", maxWidth: 320, borderRadius: 12, marginTop: 10 }} /> : null}
                    <div style={styles.infoCardSubtext}>Photo preview is active. OCR has pulled the invoice text below — review the rows before locking anything into stock.</div>
                  </div>
                ) : null}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Step 2 — Paste Invoice Text</label>
                  <textarea value={supplierInvoiceText} onChange={(event: any) => setSupplierInvoiceText(event.target.value)} style={styles.textarea} placeholder="Paste supplier invoice text here. Example: Tomato Polpa 2 x 5kg $38.50" />
                </div>

                <div style={styles.buttonRow}>
                  <button type="button" style={styles.primaryButton} onClick={parseInvoiceForSelectedSupplier}>Scan Invoice Text</button>
                  <button type="button" style={styles.secondaryButton} onClick={handleSaveInvoiceDraft}>Save Draft</button>
                  <button type="button" style={styles.secondaryButton} onClick={handleLoadInvoiceDraft}>Load Latest Draft</button>
                  <button type="button" style={styles.secondaryButton} onClick={handleDeleteInvoiceDraft}>Delete Draft</button>
                  <button type="button" style={styles.secondaryButton} onClick={() => { setSupplierInvoiceText(""); setSupplierInvoiceRows([]); setSupplierInvoiceMessage(""); setInvoiceQualityWarning(""); setInvoiceFixingRowId(null); setInvoiceDraftMessage(""); setSupplierInvoicePhotoName(""); if (supplierInvoicePhotoPreviewUrl) { URL.revokeObjectURL(supplierInvoicePhotoPreviewUrl); setSupplierInvoicePhotoPreviewUrl(""); } }}>Clear Import</button>
                </div>

                {supplierInvoiceMessage ? <div style={styles.infoCardText}>{supplierInvoiceMessage}</div> : null}
                {invoiceQualityWarning ? <div style={{ ...styles.infoCardText, color: "#fef08a" }}>⚠️ {invoiceQualityWarning}</div> : null}
                {invoiceDraftMessage ? <div style={styles.infoCardText}>{invoiceDraftMessage}</div> : null}
                {invoiceDraft ? <div style={styles.infoCardSubtext}>Draft status: {String(invoiceDraft.status || "draft")} · Saved: {String(invoiceDraft.updatedAt || invoiceDraft.createdAt || "")}</div> : null}

                {lockedInvoiceHistory.length > 0 ? (
                  <div style={styles.infoCard}>
                    <div style={styles.infoCardTitle}>Locked Invoice History</div>
                    {lockedInvoiceHistory.slice(0, 5).map((invoice: any) => (
                      <details key={invoice.id} style={{ marginTop: 8 }}>
                        <summary style={styles.infoCardText}>{invoice.date} · {invoice.supplierName} · {invoice.invoiceNumber || "No invoice #"} · {formatCurrency(invoice.totalCost)} · {invoice.rowCount || invoice.rows?.length || 0} rows</summary>
                        <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                          {(invoice.rows || []).slice(0, 12).map((row: any) => (
                            <div key={row.id} style={styles.infoCardSubtext}>{row.name} · {row.qty} {row.unit} · {formatCurrency(row.lineTotal)}{row.rawLine ? ` · raw: ${row.rawLine}` : ""}</div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                ) : null}

                {supplierInvoiceRows.length > 0 ? (
                  <div style={styles.infoCard}>
                    <div style={styles.infoCardText}>Invoice Lock Status: {invoiceLockSummary.isLocked ? "Locked Into Stock" : "Draft"}</div>
                    <div style={styles.infoCardSubtext}>
                      Selected: {invoiceLockSummary.selectedCount} · Matched: {invoiceLockSummary.matchedCount} · Create new: {invoiceLockSummary.createNewCount} · Ignored: {invoiceLockSummary.ignoredCount} · Needs attention: {invoiceLockSummary.needsAttentionCount} · Total: {formatCurrency(invoiceLockSummary.estimatedTotal)}
                    </div>
                    <div style={styles.buttonRow}>
                      <button type="button" style={invoiceLockSummary.isLocked ? styles.secondaryButton : styles.primaryButton} onClick={handleLockInvoiceIntoStock} disabled={invoiceLockSummary.isLocked}>
                        {invoiceLockSummary.isLocked ? "Invoice Already Locked" : "🚔 Lock Invoice (Commit to System)"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {supplierInvoiceRows.length > 0 ? (
                  <div style={styles.cardInset}>
                    <h3 style={styles.sectionGroupTitle}>Review Invoice Lines</h3>
                    <div style={styles.infoCardSubtext}>Review these lines before locking. GP Police does not auto-post invoice damage without your say-so.</div>
                    <div style={{ ...styles.buttonRow, position: "sticky", top: 0, zIndex: 5, background: "rgba(10, 10, 12, 0.94)", padding: "10px 0" }}>
                      <button type="button" style={styles.secondaryButton} onClick={() => setAllSupplierInvoiceRowsSelected(true)}>Select All</button>
                      <button type="button" style={styles.secondaryButton} onClick={() => setAllSupplierInvoiceRowsSelected(false)}>Deselect All</button>
                      <div style={styles.infoCardSubtext}>Selected rows: {invoiceLockSummary.selectedCount} · Total: {formatCurrency(invoiceLockSummary.estimatedTotal)}</div>
                    </div>
                    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                      {supplierInvoiceRows.map((row: any) => (
                        <div key={row.id} style={styles.infoCard}>
                          <div style={styles.infoCardSubtext}>Raw line: {String(row.rawLine || "")}</div>
                          <div style={styles.buttonRow}>
                            <button type="button" style={row.status === "matched" ? styles.primaryButton : styles.secondaryButton} onClick={() => setSupplierInvoiceRowStatus(row.id, "matched")}>Matched</button>
                            <button type="button" style={row.status === "create_new" ? styles.primaryButton : styles.secondaryButton} onClick={() => setSupplierInvoiceRowStatus(row.id, "create_new")}>Create New</button>
                            <button type="button" style={row.status === "ignore" ? styles.primaryButton : styles.secondaryButton} onClick={() => setSupplierInvoiceRowStatus(row.id, "ignore")}>Ignore Line</button>
                            <button type="button" style={invoiceFixingRowId === row.id ? styles.primaryButton : styles.secondaryButton} onClick={() => setInvoiceFixingRowId(invoiceFixingRowId === row.id ? null : row.id)}>Fix This Row</button>
                          </div>
                          {invoiceFixingRowId === row.id ? (
                            <div style={styles.infoCard}>
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
                            <span style={getInvoiceConfidenceBadgeStyle(row.confidence || "low")}>{String(row.confidence || "low").toUpperCase()}</span>
                            {row.matchedIngredientName ? <span style={styles.infoCardSubtext}>Linked: {row.matchedIngredientName}</span> : null}
                          </div>
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
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Pack Size</label>
                              <input value={`${row.amountInPurchaseUnit || "1"} x ${row.sizePerItem || "1"} ${row.sizeUnit || "each"}`} readOnly style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Confidence</label>
                              <input value={row.confidence || "low"} readOnly style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Match Ingredient</label>
                              <select value={row.linkedIngredientId || ""} onChange={(event: any) => updateSupplierInvoiceRow(row.id, "linkedIngredientId", event.target.value)} style={styles.input}>
                                <option value="">Needs match</option>
                                {supplierIngredients
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
                                <button type="button" style={styles.primaryButton} onClick={() => handleCreateIngredientFromInvoiceRow(row.id)}>Create Ingredient From Row</button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={styles.buttonRow}>
                      <button type="button" style={styles.primaryButton} onClick={handleLockInvoiceIntoStock}>🚔 Lock Invoice (Commit to System)</button>
                      <button type="button" style={styles.secondaryButton} onClick={handleSaveInvoiceDraft}>Save Review Draft</button>
                    </div>
                  </div>
                ) : null}
              </div>
  );

  const renderSuppliersPage = () => {
    if (supplierInvoiceViewOpen && !selectedSupplier) {
      return (
        <div style={styles.pageWrapper}>
          <div style={styles.card}>
            <h1 style={styles.pageTitle}>Choose a supplier first</h1>
            <p style={styles.pageSubtitle}>Choose a supplier first before uploading an invoice.</p>
            <button type="button" style={styles.secondaryButton} onClick={() => setSupplierInvoiceViewOpen(false)}>← Back to Suppliers</button>
          </div>
        </div>
      );
    }

    if (supplierInvoiceViewOpen && selectedSupplier) {
      return (
        <div style={styles.pageWrapper}>
          <div style={styles.pageHeader}>
            <button type="button" style={styles.secondaryButton} onClick={() => setSupplierInvoiceViewOpen(false)}>← Back to Suppliers</button>
            <button type="button" style={styles.secondaryButton} onClick={() => { setSupplierInvoiceViewOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← Back to Supplier</button>
            <h1 style={styles.pageTitle}>Invoice Upload — {selectedSupplier.name}</h1>
            <p style={styles.pageSubtitle}>Take a photo for reference, upload a text/CSV file, or paste invoice text. GP Police scans text only for now before anything hits ingredients.</p>
            <p style={styles.infoCardSubtext}>No blind uploads. Check the evidence before it hits your ingredient list.</p>
          </div>
          {renderSupplierInvoiceImportPanel()}
        </div>
      );
    }

    return (
      <div style={styles.pageWrapper}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Supplier Folder</h1>
          <p style={styles.pageSubtitle}>
            Supplier evidence locker: contacts, emails, rep details, invoice text import, and every ingredient linked to the right supplier. No ordering circus — just clean files and cleaner costing.
          </p>
        </div>

        {selectedSupplier ? null : (
          <div style={styles.card}>
            <div style={styles.supplierPageToolbar}>
            <div>
              <h2 style={styles.sectionTitle}>Supplier List Folder</h2>
              <p style={styles.sectionSubtitle}>Main supplier files first. Open a card when you need the full details.</p>
            </div>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => {
                setSupplierForm(defaultSupplierForm);
                setSupplierMessage("");
                setShowSupplierForm(true);
              }}
            >
              + Add Supplier
            </button>
          </div>

          {supplierMessage ? <div style={styles.infoCardText}>{supplierMessage}</div> : null}

          {showSupplierForm ? (
            <div style={styles.cardInset}>
              <div style={styles.dashboardSectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>{supplierForm.id ? "Fix Supplier" : "Add Supplier"}</h2>
                  <p style={styles.sectionSubtitle}>Keep supplier details tidy, then tuck the form away.</p>
                </div>
              </div>

              <form onSubmit={saveSupplier} style={styles.formWrapper}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Supplier Name</label>
                    <input type="text" value={supplierForm.name} onChange={(event: any) => handleSupplierFormChange("name", event.target.value)} style={styles.input} placeholder="e.g. Bidfood" />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Contact Name</label>
                    <input type="text" value={supplierForm.contactName} onChange={(event: any) => handleSupplierFormChange("contactName", event.target.value)} style={styles.input} placeholder="e.g. Sarah" />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone</label>
                    <input type="text" value={supplierForm.phone} onChange={(event: any) => handleSupplierFormChange("phone", event.target.value)} style={styles.input} placeholder="supplier phone" />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input type="email" value={supplierForm.email} onChange={(event: any) => handleSupplierFormChange("email", event.target.value)} style={styles.input} placeholder="accounts or office email" />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Rep Name</label>
                    <input type="text" value={supplierForm.repName} onChange={(event: any) => handleSupplierFormChange("repName", event.target.value)} style={styles.input} placeholder="who actually answers the phone" />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Order Email</label>
                    <input type="email" value={supplierForm.orderEmail} onChange={(event: any) => handleSupplierFormChange("orderEmail", event.target.value)} style={styles.input} placeholder="orders@supplier.com" />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Order Phone</label>
                    <input type="text" value={supplierForm.orderPhone} onChange={(event: any) => handleSupplierFormChange("orderPhone", event.target.value)} style={styles.input} placeholder="order desk" />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Minimum Order</label>
                    <input type="text" value={supplierForm.minimumOrder} onChange={(event: any) => handleSupplierFormChange("minimumOrder", event.target.value)} style={styles.input} placeholder="e.g. $150" />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Account Number</label>
                    <input type="text" value={supplierForm.accountNumber} onChange={(event: any) => handleSupplierFormChange("accountNumber", event.target.value)} style={styles.input} placeholder="customer / account number" />
                  </div>
                </div>

                <div style={styles.dashboardTwoColumnGrid}>
                  <div style={styles.cardInset}>
                    <div style={styles.recipeCategoryHeading}>Ordering Days</div>
                    <div style={styles.inlineButtonRow}>
                      {supplierDayOptions.map((day) => (
                        <button key={`ordering_${day}`} type="button" onClick={() => toggleSupplierDay("orderingDays", day)} style={{ ...styles.smallButton, ...(supplierForm.orderingDays.includes(day) ? styles.smallButtonActive : {}) }}>
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={styles.cardInset}>
                    <div style={styles.recipeCategoryHeading}>Delivery Days</div>
                    <div style={styles.inlineButtonRow}>
                      {supplierDayOptions.map((day) => (
                        <button key={`delivery_${day}`} type="button" onClick={() => toggleSupplierDay("deliveryDays", day)} style={{ ...styles.smallButton, ...(supplierForm.deliveryDays.includes(day) ? styles.smallButtonActive : {}) }}>
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes</label>
                  <textarea value={supplierForm.notes} onChange={(event: any) => handleSupplierFormChange("notes", event.target.value)} style={styles.textarea} placeholder="Cut-off times, delivery quirks, minimum spend, rep notes. All the stuff that saves a phone call." />
                </div>

                <div style={styles.buttonRow}>
                  <button type="submit" style={styles.primaryButton}>{supplierForm.id ? "Fix It" : "Lock It In"}</button>
                  <button type="button" style={styles.secondaryButton} onClick={resetSupplierForm}>Clear</button>
                  <button type="button" style={styles.secondaryButton} onClick={() => { resetSupplierForm(); setShowSupplierForm(false); }}>Cancel</button>
                </div>
              </form>
            </div>
          ) : null}

          <div style={styles.cardInset}>
            <input type="text" value={supplierSearchTerm} onChange={(event: any) => setSupplierSearchTerm(event.target.value)} style={styles.input} placeholder="Search suppliers..." />
          </div>

          <div style={styles.supplierListLayout}>
            {filteredSupplierDirectory.length === 0 ? (
              <div style={styles.emptyState}>No suppliers saved yet. The reps are hiding in the smoke.</div>
            ) : (
              filteredSupplierDirectory.map((supplier: any) => {
                const linkedCount = supplierIngredients.filter(
                  (ingredient: any) => String(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim() === supplier.name
                ).length;

                return (
                  <div key={supplier.id} style={{ ...styles.infoCard, ...(selectedSupplier?.id === supplier.id ? styles.infoCardSelected : {}) }}>
                    <div style={styles.supplierSummaryMeta}>
                      <div style={styles.infoCardTitle}>{supplier.name}</div>
                      <div style={styles.infoCardSubtext}>{supplier.contactName || "No contact saved"}{supplier.isVirtual ? " • pulled from ingredient links" : ""}</div>
                      <div style={styles.infoCardText}>{linkedCount} linked ingredient{linkedCount === 1 ? "" : "s"}</div>
                    </div>

                    <div style={styles.supplierActions}>
                      <button type="button" style={styles.smallButton} onClick={() => { setSelectedSupplierId(supplier.id); setShowSupplierForm(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>View</button>
                      <button type="button" style={styles.smallButton} onClick={() => { setSelectedSupplierId(supplier.id); setSupplierInvoiceViewOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Add invoice</button>
                      <button type="button" style={styles.smallButton} onClick={() => editSupplier(supplier)}>Fix It</button>
                      <button type="button" style={styles.smallDangerButton} onClick={() => deleteSupplier(supplier)}>Wipe It</button>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        )}

        <div style={styles.card}>
          {!selectedSupplier ? (
            <div style={styles.emptyStatePanel}>
              <div style={styles.emptyStateTitle}>No supplier selected</div>
              <div style={styles.emptyStateText}>Hit View on a supplier card and GP Police will open the file here.</div>
            </div>
          ) : (
            <>
              <div style={styles.dashboardSectionHeader}>
                <div>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => {
                      setSelectedSupplierId(null);
                      setSupplierInvoiceText("");
                      setSupplierInvoiceRows([]);
                      setSupplierInvoiceMessage("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    ← Back to Suppliers
                  </button>
                  <h2 style={styles.sectionTitle}>{selectedSupplier.name}</h2>
                  <p style={styles.sectionSubtitle}>Supplier file, ordering info, and linked ingredients only for this supplier.</p>
                </div>
                <div style={styles.buttonRow}>
                  {selectedSupplierEmailAddress ? <a href={supplierEmailHref} style={styles.secondaryButton as any}>Email Supplier</a> : null}
                  <button type="button" style={styles.secondaryButton} onClick={() => { setSupplierInvoiceViewOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Add invoice</button>
                  <button type="button" style={styles.secondaryButton} onClick={() => editSupplier(selectedSupplier)}>Fix Supplier</button>
                </div>
              </div>

              <div style={styles.supplierDetailGrid}>
                <div style={styles.metricCard}>
                  <div style={styles.metricLabel}>Contact</div>
                  <div style={styles.metricValueSmall}>{selectedSupplier.contactName || "No contact saved"}</div>
                  <div style={styles.infoCardSubtext}>{selectedSupplier.phone || "No phone saved"}</div>
                  <div style={styles.infoCardSubtext}>{selectedSupplier.email || "No email saved"}</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={styles.metricLabel}>Ordering</div>
                  <div style={styles.metricValueSmall}>{selectedSupplier.orderEmail || selectedSupplier.email || "No order email saved"}</div>
                  <div style={styles.infoCardSubtext}>{selectedSupplier.orderPhone || selectedSupplier.phone || "No order phone saved"}</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={styles.metricLabel}>Linked Ingredients</div>
                  <div style={styles.metricValueSmall}>{selectedSupplierIngredients.length}</div>
                  <div style={styles.infoCardSubtext}>items currently tied to this supplier</div>
                </div>
              </div>

              <div style={styles.dashboardTwoColumnGrid}>
                <div style={styles.cardInset}>
                  <div style={styles.recipeCategoryHeading}>Supplier Details</div>
                  <div style={styles.infoCardText}>Contact: {selectedSupplier.contactName || "Not saved"}</div>
                  <div style={styles.infoCardText}>Phone: {selectedSupplier.phone || "Not saved"}</div>
                  <div style={styles.infoCardText}>Email: {selectedSupplier.email || "Not saved"}</div>
                  <div style={styles.infoCardText}>Rep: {selectedSupplier.repName || "Not saved"}</div>
                  <div style={styles.infoCardText}>Account Number: {selectedSupplier.accountNumber || "Not saved"}</div>
                </div>

                <div style={styles.cardInset}>
                  <div style={styles.recipeCategoryHeading}>Ordering Setup</div>
                  <div style={styles.infoCardText}>Order Email: {selectedSupplier.orderEmail || "Not saved"}</div>
                  <div style={styles.infoCardText}>Order Phone: {selectedSupplier.orderPhone || "Not saved"}</div>
                  <div style={styles.infoCardText}>Minimum Order: {selectedSupplier.minimumOrder || "Not saved"}</div>
                  <div style={styles.infoCardText}>Ordering Days: {selectedSupplier.orderingDays?.join(", ") || "Not saved"}</div>
                  <div style={styles.infoCardText}>Delivery Days: {selectedSupplier.deliveryDays?.join(", ") || "Not saved"}</div>
                </div>
              </div>

              {selectedSupplier.notes ? (
                <div style={styles.cardInset}>
                  <div style={styles.recipeCategoryHeading}>Notes</div>
                  <div style={styles.infoCardText}>{selectedSupplier.notes}</div>
                </div>
              ) : null}

              <div style={styles.cardInset}>
                <div style={styles.sectionGroupHeaderRow}>
                  <h3 style={styles.sectionGroupTitle}>Linked Ingredients</h3>
                  <div style={styles.sectionGroupSubtotal}>{selectedSupplierIngredients.length} item{selectedSupplierIngredients.length === 1 ? "" : "s"}</div>
                </div>

                {selectedSupplierIngredients.length === 0 ? (
                  <div style={styles.emptyState}>No ingredients logged — start building your base</div>
                ) : (
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr><th style={styles.th}>Ingredient</th><th style={styles.th}>Pack</th><th style={styles.th}>Price</th><th style={styles.th}>Cost Unit</th><th style={styles.th}>Action</th></tr>
                      </thead>
                      <tbody>
                        {selectedSupplierIngredients.map((ingredient: any) => {
                          const summary = getIngredientSummaryDisplay(ingredient);
                          return (
                            <tr key={ingredient.id}>
                              <td style={styles.td}>{ingredient.name}</td>
                              <td style={styles.td}>{roundTo(ingredient.amountInPurchaseUnit, 2)} x {roundTo(ingredient.sizePerItem, 2)} {ingredient.sizeUnit}</td>
                              <td style={styles.td}>{formatCurrency(ingredient.purchasePrice)}</td>
                              <td style={styles.td}>{summary.visibleCost}</td>
                              <td style={styles.td}><button type="button" style={styles.smallButton} onClick={() => editIngredient(ingredient)}>Fix It</button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>


            </>
          )}
        </div>
      </div>
    );
  };


  return activeView === "ingredients" ? renderIngredientsPage() : renderSuppliersPage();
}
