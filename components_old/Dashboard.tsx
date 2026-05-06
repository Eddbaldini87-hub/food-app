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
  const gpImpactSummary = props.gpImpactSummary || {};
  const gpBiggestLosers = Array.isArray(gpImpactSummary.biggestLosers) ? gpImpactSummary.biggestLosers : [];
  const gpAlerts = Array.isArray(gpImpactSummary.alerts) ? gpImpactSummary.alerts : [];
  const gpActions = Array.isArray(gpImpactSummary.recommendedActions) ? gpImpactSummary.recommendedActions : [];
  const recentWins = Array.isArray(gpImpactSummary.recentWins) ? gpImpactSummary.recentWins : [];
  const damageDamageTrend = gpImpactSummary.damageDamageTrend || {};
  const proofEngine = gpImpactSummary.proofEngine || {};
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
    if (safeNumber(gpImpactSummary.totalWeeklyDamage) > 0) {
      return {
        label: "💀 Menu damage detected",
        detail: `${gpImpactSummary.affectedRecipeCount || 0} dish(es) are getting mugged by supplier prices. Weekly damage: ${formatMoney(gpImpactSummary.totalWeeklyDamage)}.`,
        button: "Show The Damage",
        action: () => props.handleSidebarNavigation?.("menu"),
      };
    }

    if (damageRising) {
      return {
        label: "💀 GP is bleeding harder this week",
        detail: `This week: ${formatMoney(thisWeekDamage)} vs ${formatMoney(lastWeekDamage)} last week. Open the damage board and stop the leak before the till cops it.`,
        button: "Show The Damage",
        action: () => props.handleSidebarNavigation?.("menu"),
      };
    }

    if (topStockDamage) {
      return {
        label: "🚨 Stock is walking out the back door",
        detail: `${topStockDamage.ingredientName || "An ingredient"} is doing a runner: ${formatLossQuantity(topStockDamage.loss)} ${topStockDamage.purchaseUnit || "unit"} damage.`,
        button: "Open Stock Damage",
        action: () => props.handleSidebarNavigation?.("stock"),
      };
    }

    if (recipeIssueCount > 0) {
      return {
        label: "⚠️ Recipes are half-dressed",
        detail: `${recipeIssueCount} recipe problem(s) need fixing before you trust the numbers.`,
        button: "Fix Recipes",
        action: () => props.handleSidebarNavigation?.("recipes"),
      };
    }

    if (invoiceRecords.length === 0) {
      return {
        label: "📸 Feed the beast an invoice",
        detail: "Snap a supplier bill. No evidence, no arrest. Simple.",
        button: "Snap Invoice",
        action: openInvoiceCamera,
      };
    }

    return {
      label: "✅ No alarms screaming right now",
      detail: "No fires on the board. Keep feeding invoices and keep suppliers honest.",
      button: "Snap Invoice",
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

  const proofToneStyle = proofEngine.confidence === "high"
    ? { border: "1px solid rgba(34, 197, 94, 0.42)", background: "rgba(34, 197, 94, 0.10)" }
    : proofEngine.confidence === "medium" || proofEngine.confidence === "early"
      ? { border: "1px solid rgba(245, 158, 11, 0.42)", background: "rgba(245, 158, 11, 0.10)" }
      : { border: "1px solid rgba(148, 163, 184, 0.26)", background: "rgba(15, 23, 42, 0.55)" };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Main Hideout</h1>
        <p style={styles.pageSubtitle}>Cook food. Don’t cook the books. GP Police sniffs out the margin leaks before they mug your menu.</p>
      </div>

      <div style={{ ...styles.infoCard, border: "1px solid rgba(251, 191, 36, 0.32)", background: "linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(15, 23, 42, 0.72))" }}>
        <div style={styles.infoCardTitle}>🚔 GP Police is on shift</div>
        <div style={styles.infoCardSubtext}>Invoices are evidence. Recipes are suspects. Suppliers don’t get to rob the GP in peace.</div>
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

      <div style={{ ...styles.card, ...proofToneStyle }}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>🧾 Evidence Locker</h2>
            <p style={styles.sectionSubtitle}>Shows whether GP Police has enough proof to call the damage, not guess it.</p>
          </div>
          <div style={styles.infoCardSubtext}>{String(proofEngine.confidence || "low").toUpperCase()} confidence</div>
        </div>
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>{proofEngine.headline || "Needs real kitchen evidence"}</div>
            <div style={styles.infoCardSubtext}>{proofEngine.trustMessage || "Lock invoices and load POS so GP Police stops guessing and starts arresting leaks."}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Damage Trend</div>
            <div style={styles.infoCardText}>{damageDamageTrend.proofLabel || "Waiting"}</div>
            <div style={styles.infoCardSubtext}>{damageDamageTrend.direction ? `Direction: ${damageDamageTrend.direction}` : "Needs more weeks"}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Latest Punch</div>
            <div style={styles.infoCardText}>{formatMoney(damageDamageTrend.change || 0)}</div>
            <div style={styles.infoCardSubtext}>Compared with the last tracked week.</div>
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, border: "1px solid rgba(34, 197, 94, 0.30)", background: "rgba(6, 78, 59, 0.14)" }}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>✅ Money You Stopped Bleeding</h2>
            <p style={styles.sectionSubtitle}>Wins board. Supplier damage found, margin leaks plugged, chef stress lowered.</p>
          </div>
        </div>
        <div style={styles.infoGrid}>
          {recentWins.slice(0, 4).map((win: any, index: number) => (
            <div key={`${win.title}-${index}`} style={styles.infoCard}>
              <div style={styles.infoCardTitle}>{win.title}</div>
              <div style={styles.infoCardSubtext}>{win.detail}</div>
              <div style={{ ...styles.infoCardSubtext, marginTop: 8 }}>Confidence: {String(win.confidence || "low").toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.card, border: "1px solid rgba(59, 130, 246, 0.28)", background: "rgba(15, 23, 42, 0.72)" }}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>📸 Invoice Drive-By</h2>
            <p style={styles.sectionSubtitle}>Snap it, fix the ugly rows, lock it. No spreadsheet therapy.</p>
          </div>
        </div>

        <div style={mobileButtonGridStyle}>
          <button type="button" style={styles.primaryButton} onClick={openInvoiceCamera}>📷 Snap Invoice</button>
          <button type="button" style={styles.secondaryButton} onClick={openInvoiceReview}>Fix The Mess</button>
          <button type="button" style={styles.secondaryButton} onClick={() => props.handleSidebarNavigation?.("invoice")}>Damage Folder</button>
        </div>
      </div>

      <div style={styles.dashboardGrid}>
        <button type="button" style={styles.metricCard} onClick={() => props.handleSidebarNavigation?.("invoice")}>
          <div style={styles.metricLabel}>Invoice Evidence</div>
          <div style={styles.metricValue}>{formatMoney(totalInvoiceSpend)}</div>
          <div style={smallMutedTextStyle}>Snap. Fix. Lock. Catch the robbery.</div>
        </button>
        <button type="button" style={styles.metricCard} onClick={() => props.handleSidebarNavigation?.("recipes")}>
          <div style={styles.metricLabel}>Plates Under Watch</div>
          <div style={styles.metricValue}>{finalDishes.length}</div>
          <div style={smallMutedTextStyle}>Menu items sitting under GP surveillance.</div>
        </button>
        <button type="button" style={styles.metricCard} onClick={() => props.handleSidebarNavigation?.("ingredients")}>
          <div style={styles.metricLabel}>Supplier Lines</div>
          <div style={styles.metricValue}>{ingredients.length}</div>
          <div style={smallMutedTextStyle}>The stuff suppliers keep shifting while nobody is looking.</div>
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>💀 Where The Money Is Bleeding</h2>
            <p style={styles.sectionSubtitle}>No vibes. Just damage called from locked invoice evidence.</p>
          </div>
          <button type="button" style={styles.secondaryButton} onClick={() => props.handleSidebarNavigation?.("menu")}>Show The Damage</button>
        </div>
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>This Week’s Hit</div>
            <div style={styles.infoCardText}>{formatMoney(gpDamageSummary.thisWeekDamage)}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Last Week’s Hit</div>
            <div style={styles.infoCardText}>{formatMoney(gpDamageSummary.lastWeekDamage)}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Movement</div>
            <div style={styles.infoCardText}>{formatMoney(gpDamageSummary.weeklyMovement)}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Damage Trend</div>
            <div style={styles.infoCardText}>{gpDamageSummary.damageDamageTrendLabel || "Damage stable"}</div>
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, border: "1px solid rgba(248, 113, 113, 0.32)", background: "rgba(127, 29, 29, 0.14)" }}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>🍽️ Menu Damage Scanner</h2>
            <p style={styles.sectionSubtitle}>Turns supplier price hikes into plate-level damage. No more chef maths in the dark.</p>
          </div>
          <button type="button" style={styles.secondaryButton} onClick={() => props.handleSidebarNavigation?.("menu")}>Show The Damage</button>
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Plates Getting Hit</div>
            <div style={styles.infoCardText}>{safeNumber(gpImpactSummary.affectedRecipeCount)}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Supplier Grenades</div>
            <div style={styles.infoCardText}>{safeNumber(gpImpactSummary.affectedIngredientCount)}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Weekly Damage</div>
            <div style={styles.infoCardText}>{formatMoney(gpImpactSummary.totalWeeklyDamage)}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoCardTitle}>Per-Plate Hit</div>
            <div style={styles.infoCardText}>{formatMoney(gpImpactSummary.totalPerServeDamage)}</div>
          </div>
        </div>

        {gpActions.length > 0 ? (
          <div style={{ marginTop: 14 }}>
            <div style={styles.infoCardTitle}>Recommended Actions</div>
            <div style={{ ...styles.infoGrid, marginTop: 10 }}>
              {gpActions.slice(0, 4).map((action: any, index: number) => (
                <div key={`${action.title}-${index}`} style={styles.infoCard}>
                  <div style={styles.infoCardTitle}>{action.title}</div>
                  <div style={styles.infoCardText}>{action.action}</div>
                  <div style={styles.infoCardSubtext}>{action.reason}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {gpAlerts.length === 0 ? (
          <div style={{ ...(styles.emptyState || styles.infoCardText), marginTop: 12 }}>Lock invoices against linked ingredients and GP Police will start naming the plates getting smashed.</div>
        ) : (
          <div style={{ ...styles.infoGrid, marginTop: 12 }}>
            {gpAlerts.slice(0, 4).map((alert: any, index: number) => (
              <div key={`${alert.title}-${index}`} style={styles.infoCard}>
                <div style={styles.infoCardTitle}>{alert.title}</div>
                <div style={styles.infoCardSubtext}>{alert.detail}</div>
              </div>
            ))}
          </div>
        )}

        {gpBiggestLosers.length > 0 ? (
          <div style={{ marginTop: 14 }}>
            <div style={styles.infoCardTitle}>Worst Plate Damage</div>
            <div style={{ ...styles.infoGrid, marginTop: 10 }}>
              {gpBiggestLosers.slice(0, 4).map((recipe: any) => (
                <div key={recipe.recipeId || recipe.recipeName} style={styles.infoCard}>
                  <div style={styles.infoCardTitle}>{recipe.recipeName}</div>
                  <div style={styles.infoCardText}>+{formatMoney(recipe.estimatedCostIncreasePerServe)} / serve</div>
                  <div style={styles.infoCardSubtext}>{recipe.ingredientName} +{Math.round(safeNumber(recipe.percentIncrease))}%{safeNumber(recipe.estimatedWeeklyDamage) > 0 ? ` · ${formatMoney(recipe.estimatedWeeklyDamage)} weekly` : ""}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>🚨 Stock Damage Board</h2>
            <p style={styles.sectionSubtitle}>Stock leaks from adjustments and movement evidence.</p>
          </div>
          <button type="button" style={styles.secondaryButton} onClick={() => props.handleSidebarNavigation?.("stock")}>Open Stock Damage</button>
        </div>

        {stockDamageReport.length === 0 ? (
          <div style={styles.emptyState || styles.infoCardText}>No stock leaks caught yet. Log stock movement and GP Police will start naming the damage.</div>
        ) : (
          <div style={styles.infoGrid}>
            {stockDamageReport.slice(0, 4).map((item: any) => (
              <div key={item.ingredientId} style={styles.infoCard}>
                <div style={styles.infoCardTitle}>{item.ingredientName || "Unnamed ingredient"}</div>
                <div style={styles.infoCardText}>
                  Losing {formatLossQuantity(item.loss)} {item.purchaseUnit || "unit"} per week
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>⚠️ Fix This Before You Trust It</h2>
            <p style={styles.sectionSubtitle}>The ugly bits. Clean these before showing off.</p>
          </div>
        </div>
        <div style={styles.infoGrid}>
          <button type="button" style={styles.infoCard} onClick={() => props.handleSidebarNavigation?.("recipes")}>
            <div style={styles.infoCardTitle}>Recipes missing guts</div>
            <div style={styles.infoCardText}>{recipesWithNoComponents.length} issue(s)</div>
          </button>
          <button type="button" style={styles.infoCard} onClick={() => props.handleSidebarNavigation?.("recipes")}>
            <div style={styles.infoCardTitle}>Dishes with no sell price</div>
            <div style={styles.infoCardText}>{finalDishesWithNoSellPrice.length} issue(s)</div>
          </button>
          <button type="button" style={styles.infoCard} onClick={() => props.handleSidebarNavigation?.("posSales")}>
            <div style={styles.infoCardTitle}>POS evidence loaded</div>
            <div style={styles.infoCardText}>{posSales.length} row(s)</div>
          </button>
          <button type="button" style={styles.infoCard} onClick={() => props.handleSidebarNavigation?.("ordering")}>
            <div style={styles.infoCardTitle}>Order damage risk</div>
            <div style={styles.infoCardText}>{formatMoney(props.estimatedOrderSpend || 0)}</div>
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardSectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>⚡ Do Something Useful</h2>
            <p style={styles.sectionSubtitle}>The buttons you actually need when the kitchen is moving.</p>
          </div>
        </div>
        <div style={mobileButtonGridStyle}>
          <button type="button" style={styles.primaryButton} onClick={openInvoiceCamera}>📷 Snap Invoice</button>
          <button type="button" style={styles.secondaryButton} onClick={() => props.startNewRecipe?.("final dish")}>Build Dish</button>
          <button type="button" style={styles.secondaryButton} onClick={() => props.startNewSupplierLine?.()}>Add Supplier Line</button>
          <button type="button" style={styles.secondaryButton} onClick={() => props.handleSidebarNavigation?.("menu")}>Damage Board</button>
        </div>
      </div>

      {typeof props.renderRecipesListSection === "function" ? props.renderRecipesListSection() : null}
    </div>
  );
}
