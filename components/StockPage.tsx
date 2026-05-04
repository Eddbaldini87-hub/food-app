import { useState, type FormEvent } from "react";

export function StockPage(props: any) {
  const {
    styles,
    setActiveView,
    supplierIngredients = [],
    stocktakeRecords = [],
    stockMovements = [],
    stockMovementBalances = [],
    stockMovementSummary = {},
    logManualStockAdjustment,
    invoiceSpendRecords = [],
    orderingRows = [],
    formatCurrency,
    roundTo,
  } = props;

  const [manualAdjustmentIngredientId, setManualAdjustmentIngredientId] = useState("");
  const [manualAdjustmentQuantity, setManualAdjustmentQuantity] = useState("");
  const [manualAdjustmentNote, setManualAdjustmentNote] = useState("");
  const [manualAdjustmentMessage, setManualAdjustmentMessage] = useState("");

  const estimatedOrderSpend = orderingRows.reduce(
    (sum: number, row: any) => sum + Number(row?.estimatedOrderCost || 0),
    0
  );

  const formatQuantity = (value: any) => {
    const numberValue = Number(value || 0);
    if (!Number.isFinite(numberValue)) return "0";
    return roundTo ? roundTo(numberValue, 2) : Math.round(numberValue * 100) / 100;
  };

  const selectedManualAdjustmentIngredient = supplierIngredients.find(
    (ingredient: any) => ingredient.id === manualAdjustmentIngredientId
  );

  const handleManualAdjustmentSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!manualAdjustmentIngredientId) {
      setManualAdjustmentMessage("Pick an ingredient first. GP Police needs to know what stock moved.");
      return;
    }

    const quantity = Number(manualAdjustmentQuantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setManualAdjustmentMessage("Enter a quantity greater than 0 before logging the adjustment.");
      return;
    }

    if (typeof logManualStockAdjustment !== "function") {
      setManualAdjustmentMessage("Manual adjustment handler is not connected yet.");
      return;
    }

    const savedMovement = logManualStockAdjustment(
      manualAdjustmentIngredientId,
      quantity,
      manualAdjustmentNote.trim() || "manual"
    );

    if (!savedMovement) {
      setManualAdjustmentMessage("Adjustment was not saved. Check the ingredient and quantity.");
      return;
    }

    setManualAdjustmentQuantity("");
    setManualAdjustmentNote("");
    setManualAdjustmentMessage(
      `Adjustment logged for ${selectedManualAdjustmentIngredient?.name || "selected ingredient"}.`
    );
  };

  const visibleStockBalances = stockMovementBalances
    .slice()
    .sort((a: any, b: any) => {
      const mismatchSort = Number(Boolean(b.hasUnitMismatch)) - Number(Boolean(a.hasUnitMismatch));
      if (mismatchSort !== 0) return mismatchSort;
      return String(a.ingredientName || "").localeCompare(String(b.ingredientName || ""));
    })
    .slice(0, 25);

  const stockActions = [
    {
      title: "Stocktake",
      description: "Count stock and save snapshots without creating stock movements yet.",
      button: "Open Stocktake",
      view: "stocktake",
    },
    {
      title: "Ordering",
      description: "Update on-hand, pars, supplier lines, and suggested orders.",
      button: "Open Ordering",
      view: "ordering",
    },
    {
      title: "Invoice Spend",
      description: "Review weekly invoice spend records and supplier totals.",
      button: "Open Invoice Spend",
      view: "invoiceSpend",
    },
    {
      title: "Invoice Intake",
      description: "Open invoice review and lock workflow when you are ready.",
      button: "Open Invoice Intake",
      view: "invoiceIntake",
    },
  ];

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Stock</h1>
        <p style={styles.pageSubtitle}>
          Stock control hub. Review stocktake, ordering, invoice spend, invoice intake, and the read-only stock movement calculator.
        </p>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Stock Control Summary</h2>
            <p style={styles.sectionSubtitle}>
              Read-only overview. This page shows movement calculations but does not create, edit, delete, lock, or move stock data.
            </p>
          </div>
        </div>

        <div style={styles.metricGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Supplier Lines</div>
            <div style={styles.metricValue}>{supplierIngredients.length}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Saved Stocktakes</div>
            <div style={styles.metricValue}>{stocktakeRecords.length}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Stock Movements</div>
            <div style={styles.metricValue}>{stockMovements.length}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Invoice Spend Records</div>
            <div style={styles.metricValue}>{invoiceSpendRecords.length}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Estimated Order Spend</div>
            <div style={styles.metricValue}>{formatCurrency ? formatCurrency(estimatedOrderSpend) : estimatedOrderSpend}</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Stock Movement Calculator</h2>
            <p style={styles.sectionSubtitle}>
              Phase 3 read-only view. Starting on hand + invoice in + manual adjustments - recipe out = calculated stock.
            </p>
          </div>
        </div>

        <div style={styles.metricGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Movement Lines</div>
            <div style={styles.metricValue}>{formatQuantity(stockMovementSummary.totalMovementLines)}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Invoice In</div>
            <div style={styles.metricValue}>{formatQuantity(stockMovementSummary.totalInvoiceIn)}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Recipe Out</div>
            <div style={styles.metricValue}>{formatQuantity(stockMovementSummary.totalRecipeOut)}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Manual Adjustments</div>
            <div style={styles.metricValue}>{formatQuantity(stockMovementSummary.totalManualAdjustments)}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Unit Warnings</div>
            <div style={styles.metricValue}>{formatQuantity(stockMovementSummary.unitMismatchCount)}</div>
          </div>
        </div>

        <form onSubmit={handleManualAdjustmentSubmit} style={styles.cardInset}>
          <div style={styles.dashboardSectionHeader}>
            <div>
              <h3 style={styles.sectionTitleSmall}>Manual Stock Adjustment</h3>
              <div style={styles.infoCardSubtext}>
                Log a simple manual movement for waste, corrections, staff meal, damaged stock, or missing stock. This only adds a stock movement record. It does not change ordering, ingredients, invoices, recipes, or stocktake snapshots.
              </div>
            </div>
          </div>

          <div style={styles.formGrid || styles.metricGrid}>
            <label style={styles.label}>
              Ingredient
              <select
                value={manualAdjustmentIngredientId}
                onChange={(event: any) => {
                  setManualAdjustmentIngredientId(event.target.value);
                  setManualAdjustmentMessage("");
                }}
                style={styles.input}
              >
                <option value="">Select ingredient</option>
                {supplierIngredients
                  .slice()
                  .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")))
                  .map((ingredient: any) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name || "Unnamed ingredient"}
                    </option>
                  ))}
              </select>
            </label>

            <label style={styles.label}>
              Quantity
              <input
                type="number"
                step="0.01"
                min="0"
                value={manualAdjustmentQuantity}
                onChange={(event: any) => {
                  setManualAdjustmentQuantity(event.target.value);
                  setManualAdjustmentMessage("");
                }}
                style={styles.input}
                placeholder={selectedManualAdjustmentIngredient?.purchaseUnit || "Quantity"}
              />
            </label>

            <label style={styles.label}>
              Note
              <input
                type="text"
                value={manualAdjustmentNote}
                onChange={(event: any) => setManualAdjustmentNote(event.target.value)}
                style={styles.input}
                placeholder="waste, correction, staff meal, damaged stock"
              />
            </label>
          </div>

          <div style={styles.buttonRow}>
            <button type="submit" style={styles.primaryButton}>
              Log Adjustment
            </button>
          </div>

          {manualAdjustmentMessage ? <div style={styles.infoCardText}>{manualAdjustmentMessage}</div> : null}
        </form>

        {visibleStockBalances.length === 0 ? (
          <div style={styles.emptyState}>No supplier lines yet. Add ingredients before the stock calculator can show balances.</div>
        ) : (
          <div style={styles.tableWrap || styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Ingredient</th>
                  <th style={styles.th}>Supplier</th>
                  <th style={styles.th}>Starting On Hand</th>
                  <th style={styles.th}>Invoice In</th>
                  <th style={styles.th}>Recipe Out</th>
                  <th style={styles.th}>Adjustments</th>
                  <th style={styles.th}>Calculated On Hand</th>
                  <th style={styles.th}>Unit</th>
                  <th style={styles.th}>Warning</th>
                </tr>
              </thead>
              <tbody>
                {visibleStockBalances.map((balance: any) => (
                  <tr key={balance.ingredientId}>
                    <td style={styles.td}>{balance.ingredientName || "Unnamed ingredient"}</td>
                    <td style={styles.td}>{balance.supplierName || "Unassigned Supplier"}</td>
                    <td style={styles.td}>{formatQuantity(balance.startingOnHand)}</td>
                    <td style={styles.td}>{formatQuantity(balance.invoiceIn)}</td>
                    <td style={styles.td}>{formatQuantity(balance.recipeOut)}</td>
                    <td style={styles.td}>{formatQuantity(balance.manualAdjustments)}</td>
                    <td style={styles.td}>{formatQuantity(balance.calculatedOnHand)}</td>
                    <td style={styles.td}>{balance.purchaseUnit || "unit"}</td>
                    <td style={styles.td}>{balance.hasUnitMismatch ? "Check units" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {stockMovementBalances.length > visibleStockBalances.length ? (
          <div style={styles.infoCardSubtext}>
            Showing first {visibleStockBalances.length} stock lines. Full filtering can be added in a later UI pass.
          </div>
        ) : null}
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Stock Folders</h2>
            <p style={styles.sectionSubtitle}>Open the stock workflow you need. Nothing changes until you use the target page.</p>
          </div>
        </div>

        <div style={styles.infoCardGrid || styles.cardGrid || styles.metricGrid}>
          {stockActions.map((action) => (
            <div key={action.view} style={styles.infoCard}>
              <div style={styles.infoCardTitle}>{action.title}</div>
              <div style={styles.infoCardText}>{action.description}</div>
              <div style={styles.buttonRow}>
                <button type="button" style={styles.primaryButton} onClick={() => setActiveView(action.view)}>
                  {action.button}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Latest Stocktake Snapshot</h2>
        {stocktakeRecords.length === 0 ? (
          <div style={styles.emptyState}>No stocktake snapshots saved yet.</div>
        ) : (
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>
              {stocktakeRecords[0]?.createdAt ? new Date(stocktakeRecords[0].createdAt).toLocaleString() : "No timestamp saved"}
            </div>
            <div style={styles.infoCardText}>
              Items counted: {roundTo ? roundTo(stocktakeRecords[0]?.itemCount || stocktakeRecords[0]?.items?.length || 0, 0) : stocktakeRecords[0]?.itemCount || stocktakeRecords[0]?.items?.length || 0}
            </div>
            <div style={styles.infoCardText}>
              Estimated value: {formatCurrency ? formatCurrency(stocktakeRecords[0]?.totalEstimatedValue || 0) : stocktakeRecords[0]?.totalEstimatedValue || 0}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
