export function StocktakePage(props: any) {
  const {
    styles,
    supplierIngredients = [],
    orderingMeta = {},
    updateOrderingMetaField,
    stocktakeRecords = [],
    stockMovementBalances = [],
    stockMovementBalanceLookup = {},
    logManualStockAdjustment,
    stocktakeMessage,
    selectedStocktakeRecordId,
    setSelectedStocktakeRecordId,
    handleSaveStocktakeSnapshot,
    formatCurrency,
    roundTo,
  } = props;

  const sortedIngredients = supplierIngredients
    .slice()
    .sort((a: any, b: any) => {
      const supplierA = String(a.supplierName || orderingMeta[a.id]?.supplierName || "Unassigned Supplier").trim();
      const supplierB = String(b.supplierName || orderingMeta[b.id]?.supplierName || "Unassigned Supplier").trim();
      return supplierA.localeCompare(supplierB) || String(a.name || "").localeCompare(String(b.name || ""));
    });

  const latestSnapshots = stocktakeRecords.slice(0, 5);

  const getSystemBalance = (ingredientId: string) => {
    return (
      stockMovementBalanceLookup?.[ingredientId] ||
      stockMovementBalances.find((balance: any) => String(balance?.ingredientId || "") === String(ingredientId || "")) ||
      null
    );
  };

  const formatQuantity = (value: any) => {
    const numberValue = Number(value || 0);
    if (!Number.isFinite(numberValue)) return "0";
    return roundTo ? roundTo(numberValue, 2) : Math.round(numberValue * 100) / 100;
  };

  const getVarianceStyle = (variance: number) => {
    if (variance > 0) {
      return {
        ...(styles.td || {}),
        background: "rgba(34, 197, 94, 0.14)",
      };
    }

    if (variance < 0) {
      return {
        ...(styles.td || {}),
        background: "rgba(239, 68, 68, 0.14)",
      };
    }

    return styles.td;
  };

  const getRowStyle = (variance: number) => {
    if (variance > 0) {
      return { background: "rgba(34, 197, 94, 0.07)" };
    }

    if (variance < 0) {
      return { background: "rgba(239, 68, 68, 0.07)" };
    }

    return undefined;
  };

  const liveVarianceRows = sortedIngredients
    .map((ingredient: any) => {
      const meta = orderingMeta[ingredient.id] || {};
      const balance = getSystemBalance(ingredient.id);
      const countedQuantity = Number(meta.onHand || 0);
      const calculatedOnHand = Number(balance?.calculatedOnHand || 0);
      const variance = countedQuantity - calculatedOnHand;

      return {
        ingredient,
        countedQuantity,
        calculatedOnHand,
        variance,
      };
    })
    .filter((row: any) => Math.abs(Number(row.variance || 0)) > 0.0001);

  const applyStocktakeAdjustments = () => {
    if (typeof logManualStockAdjustment !== "function") {
      window.alert("Stocktake adjustment logging is not connected yet. Pass logManualStockAdjustment into StocktakePage from page.tsx before applying.");
      return;
    }

    if (liveVarianceRows.length === 0) {
      window.alert("No stocktake variances to apply.");
      return;
    }

    const confirmed = window.confirm(
      `Apply ${liveVarianceRows.length} stocktake adjustment${liveVarianceRows.length === 1 ? "" : "s"}? This will create manual stock movement records.`
    );

    if (!confirmed) return;

    liveVarianceRows.forEach((row: any) => {
      logManualStockAdjustment(row.ingredient.id, row.variance, "stocktake adjustment");
    });
  };

  const selectedSnapshot = selectedStocktakeRecordId
    ? stocktakeRecords.find((record: any) => record.id === selectedStocktakeRecordId) || null
    : null;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Stocktake</h1>
        <p style={styles.pageSubtitle}>
          Simple stock count base. Count on hand, check pars, and save stocktake snapshots without creating stock movements yet.
        </p>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Stock Count Base</h2>
            <p style={styles.sectionSubtitle}>
              V1 updates the same on-hand and par fields used by Ordering. Snapshot saving records the count only — it does not lock stocktake or create stock movements.
            </p>
          </div>
          <div style={styles.buttonRow}>
            <button type="button" style={styles.primaryButton} onClick={handleSaveStocktakeSnapshot}>
              Save Stocktake Snapshot
            </button>
            <button type="button" style={styles.secondaryButton} onClick={applyStocktakeAdjustments}>
              Apply Adjustments
            </button>
          </div>
        </div>

        {stocktakeMessage ? <div style={styles.infoCardText}>{stocktakeMessage}</div> : null}

        <div style={styles.metricGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Supplier Lines</div>
            <div style={styles.metricValue}>{sortedIngredients.length}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Saved Snapshots</div>
            <div style={styles.metricValue}>{stocktakeRecords.length}</div>
          </div>
        </div>

        {sortedIngredients.length === 0 ? (
          <div style={styles.emptyState}>No supplier ingredients yet. Add supplier lines before counting stock.</div>
        ) : (
          <div style={styles.tableWrap || styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Ingredient</th>
                  <th style={styles.th}>Supplier</th>
                  <th style={styles.th}>Purchase Unit</th>
                  <th style={styles.th}>System Stock</th>
                  <th style={styles.th}>Counted</th>
                  <th style={styles.th}>Variance</th>
                  <th style={styles.th}>Par Level</th>
                </tr>
              </thead>
              <tbody>
                {sortedIngredients.map((ingredient: any) => {
                  const supplierName = String(
                    ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "Unassigned Supplier"
                  ).trim() || "Unassigned Supplier";
                  const purchaseUnit = ingredient.purchaseUnit || "unit";
                  const meta = orderingMeta[ingredient.id] || {};
                  const balance = getSystemBalance(ingredient.id);
                  const countedQuantity = Number(meta.onHand || 0);
                  const calculatedOnHand = Number(balance?.calculatedOnHand || 0);
                  const variance = countedQuantity - calculatedOnHand;

                  return (
                    <tr key={ingredient.id} style={getRowStyle(variance)}>
                      <td style={styles.td}>{ingredient.name || "Unnamed ingredient"}</td>
                      <td style={styles.td}>{supplierName}</td>
                      <td style={styles.td}>{purchaseUnit}</td>
                      <td style={styles.td}>{formatQuantity(calculatedOnHand)}</td>
                      <td style={styles.td}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={meta.onHand ?? ""}
                          onChange={(event: any) => updateOrderingMetaField(ingredient.id, "onHand", event.target.value)}
                          style={styles.input}
                          placeholder={`Count in ${purchaseUnit}`}
                        />
                      </td>
                      <td style={getVarianceStyle(variance)}>{formatQuantity(variance)}</td>
                      <td style={styles.td}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={meta.parLevel ?? ""}
                          onChange={(event: any) => updateOrderingMetaField(ingredient.id, "parLevel", event.target.value)}
                          style={styles.input}
                          placeholder={`Par in ${purchaseUnit}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {latestSnapshots.length > 0 ? (
          <div style={styles.cardInset}>
            <h3 style={styles.sectionTitleSmall}>Latest Stocktake Snapshots</h3>
            <div style={styles.infoCardSubtext}>
              Latest 5 saved stocktake snapshots. These records are read-only history and do not create stock movements.
            </div>
            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              {latestSnapshots.map((record: any, index: number) => (
                <div key={record.id || `stocktake_snapshot_${index}`} style={styles.infoCard}>
                  <div style={styles.infoCardTitle}>
                    {record.createdAt ? new Date(record.createdAt).toLocaleString() : "No timestamp saved"}
                  </div>
                  <div style={styles.infoCardText}>
                    Items counted: {roundTo ? roundTo(record.itemCount || record.items?.length || 0, 0) : record.itemCount || record.items?.length || 0}
                  </div>
                  <div style={styles.infoCardText}>
                    Estimated value: {formatCurrency ? formatCurrency(record.totalEstimatedValue || 0) : record.totalEstimatedValue || 0}
                  </div>
                  <div style={styles.buttonRow}>
                    <button
                      type="button"
                      style={selectedStocktakeRecordId === record.id ? styles.primaryButton : styles.secondaryButton}
                      onClick={() => setSelectedStocktakeRecordId(record.id)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {selectedSnapshot ? (
          <div style={styles.cardInset}>
            <div style={styles.dashboardSectionHeader}>
              <div>
                <h3 style={styles.sectionTitleSmall}>Stocktake Snapshot Details</h3>
                <div style={styles.infoCardSubtext}>Read-only snapshot. Viewing this does not change ordering, stock movements, or ingredient data.</div>
              </div>
              <div style={styles.buttonRow}>
                <button type="button" style={styles.secondaryButton} onClick={() => setSelectedStocktakeRecordId(null)}>
                  Close Details
                </button>
              </div>
            </div>

            <div style={styles.metricGrid}>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Saved</div>
                <div style={styles.metricValue}>
                  {selectedSnapshot.createdAt ? new Date(selectedSnapshot.createdAt).toLocaleString() : "No timestamp"}
                </div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Items</div>
                <div style={styles.metricValue}>{selectedSnapshot.itemCount || selectedSnapshot.items?.length || 0}</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Estimated Value</div>
                <div style={styles.metricValue}>{formatCurrency ? formatCurrency(selectedSnapshot.totalEstimatedValue || 0) : selectedSnapshot.totalEstimatedValue || 0}</div>
              </div>
            </div>

            {Array.isArray(selectedSnapshot.items) && selectedSnapshot.items.length > 0 ? (
              <div style={styles.tableWrap || styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Ingredient</th>
                      <th style={styles.th}>Supplier</th>
                      <th style={styles.th}>System Stock</th>
                      <th style={styles.th}>Counted</th>
                      <th style={styles.th}>Variance</th>
                      <th style={styles.th}>Par</th>
                      <th style={styles.th}>Unit</th>
                      <th style={styles.th}>Estimated Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSnapshot.items.map((item: any, index: number) => {
                      const balance = getSystemBalance(item.ingredientId);
                      const countedQuantity = Number(item.onHand || 0);
                      const calculatedOnHand = Number(balance?.calculatedOnHand || 0);
                      const variance = countedQuantity - calculatedOnHand;

                      return (
                        <tr key={item.ingredientId || `stocktake_item_${index}`} style={getRowStyle(variance)}>
                          <td style={styles.td}>{item.ingredientName || "Unnamed ingredient"}</td>
                          <td style={styles.td}>{item.supplierName || "Unassigned Supplier"}</td>
                          <td style={styles.td}>{formatQuantity(calculatedOnHand)}</td>
                          <td style={styles.td}>{formatQuantity(countedQuantity)}</td>
                          <td style={getVarianceStyle(variance)}>{formatQuantity(variance)}</td>
                          <td style={styles.td}>{roundTo ? roundTo(item.parLevel || 0, 2) : item.parLevel || 0}</td>
                          <td style={styles.td}>{item.purchaseUnit || "unit"}</td>
                          <td style={styles.td}>{formatCurrency ? formatCurrency(item.estimatedValue || 0) : item.estimatedValue || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={styles.emptyState}>This snapshot has no item details saved.</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
