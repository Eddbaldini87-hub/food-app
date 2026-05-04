export function InvoiceSpendPage(props: any) {
  const {
    styles,
    invoiceSpendForm,
    setInvoiceSpendForm,
    invoiceWeeklySummary,
    invoiceSpendMessage,
    sortedInvoiceSpendRecords,
    handleSaveInvoiceSpend,
    handleSidebarNavigation,
    deleteInvoiceSpendRecord,
    getInvoiceRecordDateValue,
    getInvoiceRecordSupplierName,
    getInvoiceRecordTotal,
    getMondayWeekStart,
    formatCurrency,
  } = props;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Invoice Folder</h1>
        <p style={styles.pageSubtitle}>Track weekly invoices and know your true spend. Supplier, date, total, notes — no more guessing.</p>
      </div>

      <div style={styles.dashboardGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>This Week</div>
          <div style={styles.metricValue}>{formatCurrency(invoiceWeeklySummary.thisWeekSpend)}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Last Week</div>
          <div style={styles.metricValue}>{formatCurrency(invoiceWeeklySummary.lastWeekSpend)}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Change</div>
          <div style={styles.metricValue}>{invoiceWeeklySummary.weeklyChange >= 0 ? "+" : "-"}{formatCurrency(Math.abs(invoiceWeeklySummary.weeklyChange))}</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Add Weekly Invoice</h2>
            <p style={styles.sectionSubtitle}>Save the invoice total here first. Ingredient importing can still happen from the supplier screen.</p>
          </div>
        </div>

        <div style={styles.formWrapper}>
          <div style={styles.formGrid}>
            <label style={styles.formGroup}>
              <span style={styles.label}>Supplier Name</span>
              <input
                value={invoiceSpendForm.supplierName}
                onChange={(event: any) => setInvoiceSpendForm((previous: any) => ({ ...previous, supplierName: event.target.value }))}
                style={styles.input}
                placeholder="Bidfood, Festival Fish, Little Home Bakery..."
              />
            </label>

            <label style={styles.formGroup}>
              <span style={styles.label}>Invoice Date</span>
              <input
                type="date"
                value={invoiceSpendForm.date}
                onChange={(event: any) => setInvoiceSpendForm((previous: any) => ({ ...previous, date: event.target.value }))}
                style={styles.input}
              />
            </label>

            <label style={styles.formGroup}>
              <span style={styles.label}>Total Cost</span>
              <input
                inputMode="decimal"
                value={invoiceSpendForm.totalCost}
                onChange={(event: any) => setInvoiceSpendForm((previous: any) => ({ ...previous, totalCost: event.target.value.replace(/[^0-9.]/g, "") }))}
                style={styles.input}
                placeholder="0.00"
              />
            </label>
          </div>

          <label style={styles.formGroup}>
            <span style={styles.label}>Optional Notes</span>
            <textarea
              value={invoiceSpendForm.notes}
              onChange={(event: any) => setInvoiceSpendForm((previous: any) => ({ ...previous, notes: event.target.value }))}
              style={styles.textarea}
              placeholder="Invoice number, delivery issue, credit note reminder..."
            />
          </label>

          <div style={styles.buttonRow}>
            <button type="button" style={styles.primaryButton} onClick={handleSaveInvoiceSpend}>
              Lock In Invoice Spend
            </button>
            <button type="button" style={styles.secondaryButton} onClick={() => handleSidebarNavigation("suppliers")}>
              Open Supplier Invoice Import
            </button>
          </div>
          {invoiceSpendMessage ? <div style={styles.infoCardSubtext}>{invoiceSpendMessage}</div> : null}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Saved Invoices</h2>
            <p style={styles.sectionSubtitle}>Grouped by invoice week in the background using the invoice date.</p>
          </div>
        </div>

        {sortedInvoiceSpendRecords.length === 0 ? (
          <div style={styles.emptyStatePanel}>
            <div style={styles.emptyStateTitle}>No invoices tracked — blind spending alert</div>
            <div style={styles.emptyStateText}>Add your first invoice total and GP Police will start tracking the weekly spend.</div>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Week Start</th>
                  <th style={styles.th}>Supplier</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Notes</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoiceSpendRecords.map((record: any) => (
                  <tr key={record.id || getInvoiceRecordSupplierName(record) + "_" + getInvoiceRecordDateValue(record) + "_" + getInvoiceRecordTotal(record)}>
                    <td style={styles.td}>{getInvoiceRecordDateValue(record) || "-"}</td>
                    <td style={styles.td}>{getMondayWeekStart(getInvoiceRecordDateValue(record)) || "-"}</td>
                    <td style={styles.td}>{getInvoiceRecordSupplierName(record)}</td>
                    <td style={styles.td}>{formatCurrency(getInvoiceRecordTotal(record))}</td>
                    <td style={styles.td}>{record.notes || "-"}</td>
                    <td style={styles.td}>
                      {record.id ? (
                        <button type="button" style={styles.smallDangerButton} onClick={() => deleteInvoiceSpendRecord(record.id)}>
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
