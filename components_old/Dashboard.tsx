"use client";

export function Dashboard(props: any) {
  const styles = props.styles || {};
  const finalDishes = Array.isArray(props.computedRecipes) ? props.computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish") : [];
  const ingredients = Array.isArray(props.supplierIngredients) ? props.supplierIngredients : [];
  const invoiceRecords = Array.isArray(props.invoiceSpendRecords) ? props.invoiceSpendRecords : [];
  const stockDamageReport = Array.isArray(props.stockDamageReport) ? props.stockDamageReport : [];
  const gpDamageSummary = props.gpDamageSummary || {};
  const gpImpactSummary = props.gpImpactSummary || {};
  const alerts = Array.isArray(gpImpactSummary.alerts) ? gpImpactSummary.alerts : [];
  const recommendedActions = Array.isArray(gpImpactSummary.recommendedActions) ? gpImpactSummary.recommendedActions : [];
  const biggestLosers = Array.isArray(gpImpactSummary.biggestLosers) ? gpImpactSummary.biggestLosers : [];
  const biggestIngredientRisks = Array.isArray(gpImpactSummary.biggestIngredientRisks) ? gpImpactSummary.biggestIngredientRisks : [];
  const decisionSummary = gpImpactSummary.decisionSummary || {};
  const totalInvoiceSpend = invoiceRecords.reduce((sum: number, record: any) => sum + props.safeNumber(record?.totalCost ?? record?.total ?? record?.amount ?? 0), 0);

  const formatLossQuantity = (value: any) => {
    const numberValue = props.safeNumber ? props.safeNumber(value) : Number(value || 0);
    if (!Number.isFinite(numberValue)) return "0";
    return props.roundTo ? props.roundTo(numberValue, 2) : Math.round(numberValue * 100) / 100;
  };

  const formatMoney = (value: any) => {
    return props.formatCurrency ? props.formatCurrency(value || 0) : `$${Number(value || 0).toFixed(2)}`;
  };

  const formatPercent = (value: any) => {
    const numericValue = props.safeNumber ? props.safeNumber(value) : Number(value || 0);
    if (!Number.isFinite(numericValue)) return "0%";
    return `${Math.round(numericValue)}%`;
  };

  const getAlertCardStyle = (level: string) => {
    const base = styles.infoCard || {};
    if (level === "danger") {
      return { ...base, border: "1px solid rgba(248, 113, 113, 0.45)", background: "rgba(127, 29, 29, 0.16)" };
    }
    if (level === "warning") {
      return { ...base, border: "1px solid rgba(245, 158, 11, 0.42)", background: "rgba(120, 53, 15, 0.14)" };
    }
    return { ...base, border: "1px solid rgba(59, 130, 246, 0.34)", background: "rgba(30, 64, 175, 0.12)" };
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
            <h2 style={styles.sectionTitle}>🚔 Main Hideout Decision Engine</h2>
            <p style={styles.sectionSubtitle}>Price movement, menu GP impact, and recommended actions from locked invoices.</p>
          </div>
        </div>
        <div style={styles.infoGrid}>
          <div style={getAlertCardStyle(decisionSummary.status)}>
            <div style={styles.infoCardTitle}>Status</div>
            <div style={styles.infoCardText}>{decisionSummary.headline || "GP stable"}</div>
            <div style={styles.infoCardSubtext}>{decisionSummary.topAction || "Keep locking invoices and matching ingredients."}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Menu Damage</div>
            <div style={styles.infoCardText}>{formatMoney(gpImpactSummary.totalWeeklyDamage)}</div>
            <div style={styles.infoCardSubtext}>Estimated weekly damage using POS/weekly sales where available.</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Affected Dishes</div>
            <div style={styles.infoCardText}>{gpImpactSummary.affectedRecipeCount || 0}</div>
            <div style={styles.infoCardSubtext}>Final dishes hit by supplier price movement.</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Active Alerts</div>
            <div style={styles.infoCardText}>{alerts.length}</div>
            <div style={styles.infoCardSubtext}>{gpImpactSummary.dangerAlertCount || 0} danger · {gpImpactSummary.warningAlertCount || 0} warning</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>🎯 Recommended Actions</h2>
            <p style={styles.sectionSubtitle}>The app should tell you what to do next, not just show numbers.</p>
          </div>
        </div>
        {recommendedActions.length === 0 ? (
          <div style={styles.emptyState || styles.infoCardText}>No actions yet. Lock more invoices and match recipe ingredients to activate the decision layer.</div>
        ) : (
          <div style={styles.infoGrid}>
            {recommendedActions.slice(0, 6).map((action: any, index: number) => (
              <div key={`${action.title || "action"}_${index}`} style={getAlertCardStyle(action.level)}>
                <div style={styles.infoCardTitle}>{action.title || "Recommended action"}</div>
                <div style={styles.infoCardText}>{action.action || "Review this item."}</div>
                <div style={styles.infoCardSubtext}>{action.reason || "GP Police found a risk worth checking."}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>🚨 Live GP Alerts</h2>
            <p style={styles.sectionSubtitle}>Price spikes and menu damage that need eyes before they become profit leaks.</p>
          </div>
        </div>
        {alerts.length === 0 ? (
          <div style={styles.emptyState || styles.infoCardText}>No GP alerts yet. This is normal until invoices are locked with ingredient matches.</div>
        ) : (
          <div style={styles.infoGrid}>
            {alerts.slice(0, 8).map((alert: any, index: number) => (
              <div key={`${alert.title || "alert"}_${index}`} style={getAlertCardStyle(alert.level)}>
                <div style={styles.infoCardTitle}>{alert.title || "GP alert"}</div>
                <div style={styles.infoCardText}>{alert.detail || "Review this before the GP leaks."}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>💀 Top Menu Damage</h2>
            <p style={styles.sectionSubtitle}>Dishes most exposed to supplier price movement.</p>
          </div>
        </div>
        {biggestLosers.length === 0 ? (
          <div style={styles.emptyState || styles.infoCardText}>No affected dishes found yet. Match invoice rows to ingredients used in final dishes.</div>
        ) : (
          <div style={styles.infoGrid}>
            {biggestLosers.slice(0, 6).map((item: any) => (
              <div key={item.recipeId || item.recipeName} style={styles.infoCard}>
                <div style={styles.infoCardTitle}>{item.recipeName || "Unnamed dish"}</div>
                <div style={styles.infoCardText}>{formatMoney(item.estimatedCostIncreasePerServe)} per serve leak</div>
                <div style={styles.infoCardSubtext}>
                  {item.ingredientName || "Ingredient"} · GP drop {formatPercent(item.gpDropPercent)}
                  {item.weeklySalesEstimate > 0 ? ` · ${formatMoney(item.estimatedWeeklyDamage)} weekly damage` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>📈 Ingredient Price Watch</h2>
            <p style={styles.sectionSubtitle}>Supplier ingredients with the sharpest locked-in price movement.</p>
          </div>
        </div>
        {biggestIngredientRisks.length === 0 ? (
          <div style={styles.emptyState || styles.infoCardText}>No ingredient price risks yet. GP Police needs locked invoices with linked food rows.</div>
        ) : (
          <div style={styles.infoGrid}>
            {biggestIngredientRisks.slice(0, 6).map((item: any) => (
              <div key={`${item.ingredientId || item.ingredientName}_${item.invoiceNumber || item.invoiceDate}`} style={getAlertCardStyle(item.percentIncrease >= 25 ? "danger" : item.percentIncrease >= 15 ? "warning" : "watch")}>
                <div style={styles.infoCardTitle}>{item.ingredientName || "Ingredient"}</div>
                <div style={styles.infoCardText}>+{formatPercent(item.percentIncrease)}</div>
                <div style={styles.infoCardSubtext}>{item.supplierName || "Supplier"} · {formatMoney(item.knownPurchasePrice)} → {formatMoney(item.invoicePrice)}</div>
              </div>
            ))}
          </div>
        )}
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
