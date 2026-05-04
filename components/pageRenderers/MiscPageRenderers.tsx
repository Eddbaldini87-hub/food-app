import { InvoiceIntakeView } from "../InvoiceIntakeView";

export function createMiscPageRenderers(props: any) {
  const {
    styles,
    exportConsumablesCsv,
    consumablesTrackingReport,
    formatCurrency,
    invoice,
    invoiceCameraInputRef,
    lockedInvoiceHistory,
    invoiceWeeklySummary,
    damageHistory,
    sizeUnitOptions,
    componentUnitOptions,
    purchaseUnitOptions,
    supplierIngredients,
    setSupplierIngredients,
    selectedSupplier,
    orderingMeta,
    getInvoiceStatusBadgeStyle,
    getInvoiceStatusLabel,
    getInvoiceConfidenceBadgeStyle,
  } = props;

  const renderConsumablesPage = () => (
    <div style={styles.pageWrapper}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Consumables Tracking</h1>
          <p style={styles.pageSubtitle}>Napkins, takeaway boxes, gloves, foil, bags, and packaging stay out of food GP and get tracked here.</p>
        </div>
        <button type="button" style={styles.secondaryButton} onClick={exportConsumablesCsv}>
          Export Consumables CSV
        </button>
      </div>

      <div style={styles.dashboardGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Total Consumables</div>
          <div style={styles.metricValue}>{formatCurrency(consumablesTrackingReport.totalConsumablesSpend)}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>This Week</div>
          <div style={styles.metricValue}>{formatCurrency(consumablesTrackingReport.thisWeekConsumablesSpend)}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Last Week</div>
          <div style={styles.metricValue}>{formatCurrency(consumablesTrackingReport.lastWeekConsumablesSpend)}</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Supplier Spend Ranking</h2>
            <p style={styles.sectionSubtitle}>Consumable spend grouped by supplier from locked invoice history.</p>
          </div>
        </div>
        {consumablesTrackingReport.supplierBreakdown.length === 0 ? (
          <div style={styles.emptyState || styles.infoCardText}>No consumables tracked yet. Lock an invoice with consumable_cogs rows and they will appear here.</div>
        ) : (
          <div style={styles.infoGrid}>
            {consumablesTrackingReport.supplierBreakdown.map((supplier: any) => (
              <div key={supplier.supplierName} style={styles.infoCard}>
                <div style={styles.infoCardTitle}>{supplier.supplierName}</div>
                <div style={styles.infoCardText}>{formatCurrency(supplier.total)}</div>
                <div style={styles.infoCardSubtext}>{supplier.rowCount} consumable line{supplier.rowCount === 1 ? "" : "s"}</div>
                <div style={styles.infoCardSubtext}>Last invoice: {supplier.lastInvoiceDate || "No date"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Category / Item Ranking</h2>
            <p style={styles.sectionSubtitle}>Napkins, takeaway boxes, gloves, foil, packaging, and unknown consumables ranked by spend.</p>
          </div>
        </div>
        {consumablesTrackingReport.itemBreakdown.length === 0 ? (
          <div style={styles.emptyState || styles.infoCardText}>No consumable categories tracked yet.</div>
        ) : (
          <div style={styles.infoGrid}>
            {consumablesTrackingReport.itemBreakdown.map((item: any) => (
              <div key={item.itemCategory} style={styles.infoCard}>
                <div style={styles.infoCardTitle}>{item.itemCategory}</div>
                <div style={styles.infoCardText}>{formatCurrency(item.total)}</div>
                <div style={styles.infoCardSubtext}>{item.rowCount} line{item.rowCount === 1 ? "" : "s"}</div>
                <div style={styles.infoCardSubtext}>Last invoice: {item.lastInvoiceDate || "No date"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Recent Consumable Lines</h2>
            <p style={styles.sectionSubtitle}>Latest consumable rows preserved from locked invoice history.</p>
          </div>
        </div>
        {consumablesTrackingReport.recentLines.length === 0 ? (
          <div style={styles.emptyState || styles.infoCardText}>No consumable invoice lines found yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {consumablesTrackingReport.recentLines.map((row: any) => (
              <div key={`${row.invoiceId}_${row.id}`} style={styles.infoCard}>
                <div style={styles.infoCardTitle}>{row.name}</div>
                <div style={styles.infoCardText}>{formatCurrency(row.lineTotal)}</div>
                <div style={styles.infoCardSubtext}>{row.itemCategory || row.category || "Unknown consumables"}</div>
                <div style={styles.infoCardSubtext}>
                  {row.date || "No date"} · {row.supplierName} · {row.invoiceNumber || "No invoice #"} · {row.qty || ""} {row.unit || ""}
                </div>
                {row.rawLine ? <div style={styles.infoCardSubtext}>Raw: {row.rawLine}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSupplierInvoiceImportPanel = () => (
    <InvoiceIntakeView
      styles={styles}
      invoiceIntakeMeta={invoice.invoiceIntakeMeta}
      setInvoiceIntakeMeta={invoice.setInvoiceIntakeMeta}
      handleSupplierInvoiceFileUpload={invoice.handleSupplierInvoiceFileUpload}
      invoiceCameraInputRef={invoiceCameraInputRef}
      supplierInvoicePhotoName={invoice.supplierInvoicePhotoName}
      supplierInvoicePhotoPreviewUrl={invoice.supplierInvoicePhotoPreviewUrl}
      supplierInvoiceText={invoice.supplierInvoiceText}
      setSupplierInvoiceText={invoice.setSupplierInvoiceText}
      parseInvoiceForSelectedSupplier={invoice.parseInvoiceForSelectedSupplier}
      handleSaveInvoiceDraft={invoice.handleSaveInvoiceDraft}
      handleLoadInvoiceDraft={invoice.handleLoadInvoiceDraft}
      handleDeleteInvoiceDraft={invoice.handleDeleteInvoiceDraft}
      setSupplierInvoiceRows={invoice.setSupplierInvoiceRows}
      setSupplierInvoiceMessage={invoice.setSupplierInvoiceMessage}
      setInvoiceQualityWarning={invoice.setInvoiceQualityWarning}
      setInvoiceFixingRowId={invoice.setInvoiceFixingRowId}
      setInvoiceDraftMessage={invoice.setInvoiceDraftMessage}
      setSupplierInvoicePhotoName={invoice.setSupplierInvoicePhotoName}
      setSupplierInvoicePhotoPreviewUrl={invoice.setSupplierInvoicePhotoPreviewUrl}
      supplierInvoiceMessage={invoice.supplierInvoiceMessage}
      invoiceQualityWarning={invoice.invoiceQualityWarning}
      invoiceDraftMessage={invoice.invoiceDraftMessage}
      invoiceDraft={invoice.invoiceDraft}
      invoiceLockSuccessReport={invoice.invoiceLockSuccessReport}
      lockedInvoiceHistory={lockedInvoiceHistory}
      formatCurrency={formatCurrency}
      supplierInvoiceRows={invoice.supplierInvoiceRows}
      invoiceLockSummary={invoice.invoiceLockSummary}
      invoiceWeeklySummary={invoiceWeeklySummary}
      damageHistory={damageHistory}
      setAllSupplierInvoiceRowsSelected={invoice.setAllSupplierInvoiceRowsSelected}
      updateSupplierInvoiceRow={invoice.updateSupplierInvoiceRow}
      setSupplierInvoiceRowStatus={invoice.setSupplierInvoiceRowStatus}
      invoiceFixingRowId={invoice.invoiceFixingRowId}
      sizeUnitOptions={sizeUnitOptions}
      componentUnitOptions={componentUnitOptions}
      purchaseUnitOptions={purchaseUnitOptions}
      supplierIngredients={supplierIngredients}
      setSupplierIngredients={setSupplierIngredients}
      selectedSupplier={selectedSupplier}
      orderingMeta={orderingMeta}
      getInvoiceStatusBadgeStyle={getInvoiceStatusBadgeStyle}
      getInvoiceStatusLabel={getInvoiceStatusLabel}
      getInvoiceConfidenceBadgeStyle={getInvoiceConfidenceBadgeStyle}
      handleCreateIngredientFromInvoiceRow={invoice.handleCreateIngredientFromInvoiceRow}
      handleSaveSupplierMatchMemory={invoice.handleSaveSupplierMatchMemory}
      handleLockInvoiceIntoStock={invoice.handleLockInvoiceIntoStock}
    />
  );

  return {
    renderConsumablesPage,
    renderSupplierInvoiceImportPanel,
  };
}
