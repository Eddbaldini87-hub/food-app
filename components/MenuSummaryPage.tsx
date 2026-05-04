export function MenuSummaryPage(props: any) {
  const {
    styles,
    posSalesReport,
    finalDishes,
    formatCurrency,
    formatDisplayCostPerUnit,
    roundTo,
  } = props;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Damage Report</h1>
        <p style={styles.pageSubtitle}>Command Centre for final dishes, pricing, food cost, and profit.</p>
      </div>

      <div style={styles.card}>
        {finalDishes.length === 0 ? (
          <div style={styles.emptyState}>No final dishes saved yet. Hard to judge GP when there is nothing to judge.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Recipe</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Total Cost</th>
                  <th style={styles.th}>Yield</th>
                  <th style={styles.th}>Cost / Unit</th>
                  <th style={styles.th}>Cost / Portion</th>
                  <th style={styles.th}>Sell Price</th>
                  <th style={styles.th}>Food Cost %</th>
                  <th style={styles.th}>GP %</th>
                </tr>
              </thead>
              <tbody>
                {finalDishes.map((recipe: any) => (
                  <tr key={recipe.id}>
                    <td style={styles.td}>{recipe.name}</td>
                    <td style={styles.td}>{recipe.category || "-"}</td>
                    <td style={styles.td}>{formatCurrency(recipe.totalCost)}</td>
                    <td style={styles.td}>
                      {roundTo(recipe.yieldAmount, 2)} {recipe.yieldUnit}
                    </td>
                    <td style={styles.td}>
                      {formatDisplayCostPerUnit(recipe.baseUnit, recipe.costPerBaseUnit)}
                    </td>
                    <td style={styles.td}>{formatCurrency(recipe.costPerPortion)}</td>
                    <td style={styles.td}>{formatCurrency(recipe.sellPrice)}</td>
                    <td style={styles.td}>{roundTo(recipe.foodCostPercent, 2)}%</td>
                    <td style={styles.td}>{roundTo(recipe.grossProfitPercent, 2)}%</td>
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
