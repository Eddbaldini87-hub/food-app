"use client";

export function Dashboard(props: any) {
  const styles = props.styles || {};
  const finalDishes = Array.isArray(props.computedRecipes) ? props.computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish") : [];
  const ingredients = Array.isArray(props.supplierIngredients) ? props.supplierIngredients : [];
  const invoiceRecords = Array.isArray(props.invoiceSpendRecords) ? props.invoiceSpendRecords : [];
  const stockDamageReport = Array.isArray(props.stockDamageReport) ? props.stockDamageReport : [];
  const gpDamageSummary = props.gpDamageSummary || {};
  const totalInvoiceSpend = invoiceRecords.reduce((sum: number, record: any) => sum + props.safeNumber(record?.totalCost ?? record?.total ?? record?.amount ?? 0), 0);

  const formatLossQuantity = (value: any) => {
    const numberValue = props.safeNumber ? props.safeNumber(value) : Number(value || 0);
    if (!Number.isFinite(numberValue)) return "0";
    return props.roundTo ? props.roundTo(numberValue, 2) : Math.round(numberValue * 100) / 100;
  };

  const formatMoney = (value: any) => {
    return props.formatCurrency ? props.formatCurrency(value || 0) : `$${Number(value || 0).toFixed(2)}`;
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Main Hideout</h1>
        <p style={styles.pageSubtitle}>Build recipes, price dishes, track invoices, and keep your GP in line.</p>
      </div>

      <div style={styles.dashboardGrid}>
        <button type="button" style={styles.metricCard} onClick={() => props.handleSidebarNavigation?.("ingredients")}>
          <div style={styles.metricLabel}>Ingredients</div>
          <div style={styles.metricValue}>{ingredients.length}</div>
        </button>
        <button type="button" style={styles.metricCard} onClick={() => props.handleSidebarNavigation?.("recipes")}>
          <div style={styles.metricLabel}>Recipes</div>
          <div style={styles.metricValue}>{props.totalRecipeCount || 0}</div>
        </button>
        <button type="button" style={styles.metricCard} onClick={() => props.handleSidebarNavigation?.("invoice")}>
          <div style={styles.metricLabel}>Invoice Spend</div>
          <div style={styles.metricValue}>{props.formatCurrency ? props.formatCurrency(totalInvoiceSpend) : totalInvoiceSpend}</div>
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>💀 GP Damage Snapshot</h2>
            <p style={styles.sectionSubtitle}>Weekly supplier price damage from locked invoices.</p>
          </div>
        </div>
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>This Week Damage</div>
            <div style={styles.infoCardText}>{formatMoney(gpDamageSummary.thisWeekDamage)}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Last Week Damage</div>
            <div style={styles.infoCardText}>{formatMoney(gpDamageSummary.lastWeekDamage)}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Change</div>
            <div style={styles.infoCardText}>{formatMoney(gpDamageSummary.weeklyChange)}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Trend</div>
            <div style={styles.infoCardText}>{gpDamageSummary.damageTrendLabel || "Damage stable"}</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>🚨 Stock Damage Report</h2>
            <p style={styles.sectionSubtitle}>Top stock losses from manual adjustments and recipe movement data.</p>
          </div>
        </div>

        {stockDamageReport.length === 0 ? (
          <div style={styles.emptyState || styles.infoCardText}>No stock damage found yet. Log stock adjustments first and GP Police will start calling out the losses.</div>
        ) : (
          <div style={styles.infoGrid}>
            {stockDamageReport.map((item: any) => (
              <div key={item.ingredientId} style={styles.infoCard}>
                <div style={styles.infoCardTitle}>{item.ingredientName || "Unnamed ingredient"}</div>
                <div style={styles.infoCardText}>
                  You're losing {formatLossQuantity(item.loss)} {item.purchaseUnit || "unit"} per week
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>GP Check</h2>
            <p style={styles.sectionSubtitle}>Quick health check before the next upgrade.</p>
          </div>
        </div>
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Final dishes</div>
            <div style={styles.infoCardText}>{finalDishes.length} ready to review.</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Needs attention</div>
            <div style={styles.infoCardText}>{(props.recipesWithNoComponents?.length || 0) + (props.finalDishesWithNoSellPrice?.length || 0)} recipe issue(s) found.</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Estimated ordering</div>
            <div style={styles.infoCardText}>{props.formatCurrency ? props.formatCurrency(props.estimatedOrderSpend || 0) : props.estimatedOrderSpend || 0}</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.buttonRow}>
          <button type="button" style={styles.primaryButton} onClick={() => props.startNewRecipe?.("final dish")}>New Recipe</button>
          <button type="button" style={styles.secondaryButton} onClick={() => props.startNewSupplierLine?.()}>New Ingredient</button>
          <button type="button" style={styles.secondaryButton} onClick={() => props.handleSidebarNavigation?.("menu")}>Open Damage Report</button>
        </div>
      </div>

      {typeof props.renderRecipesListSection === "function" ? props.renderRecipesListSection() : null}
    </div>
  );
}
