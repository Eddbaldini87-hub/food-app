"use client";

export function Dashboard(props: any) {
  const styles = props.styles || {};
  const finalDishes = Array.isArray(props.computedRecipes)
    ? props.computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish")
    : [];
  const ingredients = Array.isArray(props.supplierIngredients) ? props.supplierIngredients : [];
  const invoiceRecords = Array.isArray(props.invoiceSpendRecords) ? props.invoiceSpendRecords : [];
  const stockDamageReport = Array.isArray(props.stockDamageReport) ? props.stockDamageReport : [];
  const gpDamageSummary = props.gpDamageSummary || {};
  const recipesWithNoComponents = Array.isArray(props.recipesWithNoComponents) ? props.recipesWithNoComponents : [];
  const finalDishesWithNoSellPrice = Array.isArray(props.finalDishesWithNoSellPrice) ? props.finalDishesWithNoSellPrice : [];
  const posSales = Array.isArray(props.posSales) ? props.posSales : [];
  const isMobileViewport = Boolean(props.isMobileViewport);

  const safeNumber = props.safeNumber || ((value: any) => {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  });

  const totalInvoiceSpend = invoiceRecords.reduce(
    (sum: number, record: any) => sum + safeNumber(record?.totalCost ?? record?.total ?? record?.amount ?? 0),
    0
  );

  const formatLossQuantity = (value: any) => {
    const numberValue = safeNumber(value);
    if (!Number.isFinite(numberValue)) return "0";
    return props.roundTo ? props.roundTo(numberValue, 2) : Math.round(numberValue * 100) / 100;
  };

  const formatMoney = (value: any) => {
    return props.formatCurrency ? props.formatCurrency(value || 0) : `$${Number(value || 0).toFixed(2)}`;
  };

  const recipeIssueCount = recipesWithNoComponents.length + finalDishesWithNoSellPrice.length;
  const thisWeekDamage = safeNumber(gpDamageSummary.thisWeekDamage);
  const lastWeekDamage = safeNumber(gpDamageSummary.lastWeekDamage);
  const damageRising = thisWeekDamage > 0 && thisWeekDamage > lastWeekDamage;
  const topStockDamage = stockDamageReport[0] || null;

  const openInvoiceCamera = () => {
    if (typeof props.handleOpenInvoiceCamera === "function") {
      props.handleOpenInvoiceCamera();
      return;
    }

    props.handleSidebarNavigation?.("invoice");
  };

  const openInvoiceReview = () => {
    props.handleSidebarNavigation?.("suppliers");
  };

  const nextAction = (() => {
    if (damageRising) {
      return {
        label: "💀 GP damage is rising",
        detail: `This week is ${formatMoney(thisWeekDamage)} vs ${formatMoney(lastWeekDamage)} last week. Open the evidence and stop the leak.`,
        button: "Open Damage Report",
        action: () => props.handleSidebarNavigation?.("menu"),
      };
    }

    if (topStockDamage) {
      return {
        label: "🚨 Stock leak detected",
        detail: `${topStockDamage.ingredientName || "An ingredient"} is showing ${formatLossQuantity(topStockDamage.loss)} ${topStockDamage.purchaseUnit || "unit"} of damage.`,
        button: "Open Stock",
        action: () => props.handleSidebarNavigation?.("stock"),
      };
    }

    if (recipeIssueCount > 0) {
      return {
        label: "⚠️ Recipes need attention",
        detail: `${recipeIssueCount} recipe issue(s) need fixing before the numbers are clean.`,
        button: "Open Recipes",
        action: () => props.handleSidebarNavigation?.("recipes"),
      };
    }

    if (invoiceRecords.length === 0) {
      return {
        label: "📸 Start with an invoice",
        detail: "Scan the first supplier bill. This is the money feature and it needs to be one tap from the hideout.",
        button: "Take Invoice Photo",
        action: openInvoiceCamera,
      };
    }

    return {
      label: "✅ Command centre clean",
      detail: "Nothing screaming right now. Scan the next invoice and keep the evidence fresh.",
      button: "Take Invoice Photo",
      action: openInvoiceCamera,
    };
  })();

  const commandCardStyle = {
    ...styles.card,
    border: "1px solid rgba(245, 158, 11, 0.32)",
    background: "linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(12, 12, 14, 0.96))",
  };

  const heroButtonStyle = {
    ...(styles.primaryButton || {}),
    minHeight: isMobileViewport ? 58 : 48,
    fontWeight: 900,
    fontSize: isMobileViewport ? 16 : undefined,
  };

  const mobileButtonGridStyle = {
    display: "grid",
    gridTemplateColumns: isMobileViewport ? "1fr" : "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginTop: 12,
  };

  const smallMutedTextStyle = {
    ...(styles.sectionSubtitle || {}),
    marginTop: 6,
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Main Hideout</h1>
        <p style={styles.pageSubtitle}>Phone-first control room for invoices, food cost, stock damage, and GP leaks.</p>
      </div>

      <div style={commandCardStyle}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>{nextAction.label}</h2>
            <p style={styles.sectionSubtitle}>{nextAction.detail}</p>
          </div>
          <button type="button" style={heroButtonStyle} onClick={nextAction.action}>
            {nextAction.button}
          </button>
        </div>
      </div>

      <div style={{ ...styles.card, border: "1px solid rgba(59, 130, 246, 0.28)", background: "rgba(15, 23, 42, 0.72)" }}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>📸 Invoice Fast Lane</h2>
            <p style={styles.sectionSubtitle}>No more five-click camera mission. Start, review, and fix invoice problems from here.</p>
          </div>
        </div>

        <div style={mobileButtonGridStyle}>
          <button type="button" style={styles.primaryButton} onClick={openInvoiceCamera}>📷 Take Invoice Photo</button>
          <button type="button" style={styles.secondaryButton} onClick={openInvoiceReview}>Fix Invoice Problems</button>
          <button type="button" style={styles.secondaryButton} onClick={() => props.handleSidebarNavigation?.("invoice")}>Invoice Spend Folder</button>
        </div>
      </div>

      <div style={styles.dashboardGrid}>
        <button type="button" style={styles.metricCard} onClick={() => props.handleSidebarNavigation?.("invoice")}>
          <div style={styles.metricLabel}>Invoice Evidence</div>
          <div style={styles.metricValue}>{formatMoney(totalInvoiceSpend)}</div>
          <div style={smallMutedTextStyle}>Scan. Fix. Lock. Expose the damage.</div>
        </button>
        <button type="button" style={styles.metricCard} onClick={() => props.handleSidebarNavigation?.("recipes")}>
          <div style={styles.metricLabel}>Final Dishes</div>
          <div style={styles.metricValue}>{finalDishes.length}</div>
          <div style={smallMutedTextStyle}>Plates ready for GP review.</div>
        </button>
        <button type="button" style={styles.metricCard} onClick={() => props.handleSidebarNavigation?.("ingredients")}>
          <div style={styles.metricLabel}>Ingredients</div>
          <div style={styles.metricValue}>{ingredients.length}</div>
          <div style={smallMutedTextStyle}>Supplier cost lines under watch.</div>
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>💀 GP Damage Snapshot</h2>
            <p style={styles.sectionSubtitle}>Supplier price damage from locked invoices.</p>
          </div>
          <button type="button" style={styles.secondaryButton} onClick={() => props.handleSidebarNavigation?.("menu")}>Open Damage Report</button>
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
            <p style={styles.sectionSubtitle}>Stock losses from manual adjustments and recipe movement data.</p>
          </div>
          <button type="button" style={styles.secondaryButton} onClick={() => props.handleSidebarNavigation?.("stock")}>Open Stock</button>
        </div>

        {stockDamageReport.length === 0 ? (
          <div style={styles.emptyState || styles.infoCardText}>No stock damage found yet — log a stock adjustment and GP Police will start calling out the leaks.</div>
        ) : (
          <div style={styles.infoGrid}>
            {stockDamageReport.slice(0, 4).map((item: any) => (
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
            <h2 style={styles.sectionTitle}>⚠️ Needs Attention</h2>
            <p style={styles.sectionSubtitle}>Clickable clean-up list before this venue is properly GP ready.</p>
          </div>
        </div>
        <div style={styles.infoGrid}>
          <button type="button" style={styles.infoCard} onClick={() => props.handleSidebarNavigation?.("recipes")}>
            <div style={styles.infoCardTitle}>Recipes with no components</div>
            <div style={styles.infoCardText}>{recipesWithNoComponents.length} issue(s)</div>
          </button>
          <button type="button" style={styles.infoCard} onClick={() => props.handleSidebarNavigation?.("recipes")}>
            <div style={styles.infoCardTitle}>Final dishes with no sell price</div>
            <div style={styles.infoCardText}>{finalDishesWithNoSellPrice.length} issue(s)</div>
          </button>
          <button type="button" style={styles.infoCard} onClick={() => props.handleSidebarNavigation?.("posSales")}>
            <div style={styles.infoCardTitle}>POS sales loaded</div>
            <div style={styles.infoCardText}>{posSales.length} row(s)</div>
          </button>
          <button type="button" style={styles.infoCard} onClick={() => props.handleSidebarNavigation?.("ordering")}>
            <div style={styles.infoCardTitle}>Estimated ordering</div>
            <div style={styles.infoCardText}>{formatMoney(props.estimatedOrderSpend || 0)}</div>
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>⚡ Quick Actions</h2>
            <p style={styles.sectionSubtitle}>Fast paths for service, setup, and boss demos.</p>
          </div>
        </div>
        <div style={mobileButtonGridStyle}>
          <button type="button" style={styles.primaryButton} onClick={openInvoiceCamera}>📷 Take Invoice Photo</button>
          <button type="button" style={styles.secondaryButton} onClick={() => props.startNewRecipe?.("final dish")}>New Recipe</button>
          <button type="button" style={styles.secondaryButton} onClick={() => props.startNewSupplierLine?.()}>New Ingredient</button>
          <button type="button" style={styles.secondaryButton} onClick={() => props.handleSidebarNavigation?.("menu")}>Damage Report</button>
        </div>
      </div>

      {typeof props.renderRecipesListSection === "function" ? props.renderRecipesListSection() : null}
    </div>
  );
}
