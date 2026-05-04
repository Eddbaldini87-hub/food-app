export function SuppliersPage(props: any) {

  const {
    styles,
    supplierInvoiceViewOpen,
    selectedSupplier,
    setSupplierInvoiceViewOpen,
    renderSupplierInvoiceImportPanel,
    setSupplierForm,
    defaultSupplierForm,
    setSupplierMessage,
    setShowSupplierForm,
    supplierMessage,
    showSupplierForm,
    supplierForm,
    saveSupplier,
    handleSupplierFormChange,
    supplierDayOptions,
    toggleSupplierDay,
    resetSupplierForm,
    supplierSearchTerm,
    setSupplierSearchTerm,
    filteredSupplierDirectory,
    supplierIngredients,
    orderingMeta,
    setSelectedSupplierId,
    editSupplier,
    deleteSupplier,
    setSupplierInvoiceText,
    setSupplierInvoiceRows,
    setSupplierInvoiceMessage,
    selectedSupplierEmailAddress,
    supplierEmailHref,
    selectedSupplierIngredients,
    getIngredientSummaryDisplay,
    roundTo,
    formatCurrency,
    editIngredient,
  } = props;
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
  }
