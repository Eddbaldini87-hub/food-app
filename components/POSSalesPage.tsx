export function POSSalesPage(props: any) {
  const {
    styles,
    posSales,
    posSalesMessage,
    posSalesReport,
    posDishMatches,
    finalDishRecipes,
    handlePosSalesCsvUpload,
    clearPosSales,
    updatePosDishMatch,
    formatCurrency,
    roundTo,
    safeNumber,
  } = props;

  const renderPosSalesRow = (row: any) => (
    <div key={row.id || row.posItemName} style={styles.infoCard}>
      <div style={styles.infoCardHeaderRow}>
        <div>
          <div style={styles.infoCardTitle}>{row.posItemName}</div>
          <div style={styles.infoCardSubtext}>{row.linkedRecipe ? `Linked to ${row.linkedRecipe.name}` : "Not linked yet"}</div>
        </div>
        <div style={styles.infoCardCostMain}>{roundTo(row.gpPercent, 1)}%</div>
      </div>
      <div style={styles.infoCardText}>Quantity Sold: {roundTo(row.quantitySold, 2)}</div>
      <div style={styles.infoCardText}>Total Sales: {formatCurrency(row.totalSales)}</div>
      <div style={styles.infoCardText}>Estimated Dish Cost Total: {formatCurrency(row.dishCostTotal)}</div>
      <div style={styles.infoCardText}>Profit Total: {formatCurrency(row.profitTotal)}</div>
      <div style={styles.infoCardText}>Average Sale Price: {formatCurrency(row.averageSalePrice)}</div>
    </div>
  );

  const renderPosSalesPage = () => {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>POS Sales</h1>
          <p style={styles.pageSubtitle}>
            Upload the POS sales, match the dish once, then GP Police starts calling out what’s making money and what’s robbing the till.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.dashboardSectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Bring In POS Sales CSV</h2>
              <p style={styles.sectionSubtitle}>Export sales from the POS as CSV. GP Police will combine duplicate item names and wait for you to match them to final dishes.</p>
            </div>
            <div style={styles.buttonRow}>
              <label style={styles.primaryButton as any}>
                Bring In POS Sales CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: "none" }}
                  onChange={(event: any) => {
                    handlePosSalesCsvUpload(event.target.files?.[0] || null);
                    event.target.value = "";
                  }}
                />
              </label>
              {posSales.length > 0 ? <button type="button" style={styles.secondaryButton} onClick={clearPosSales}>Clear POS Sales</button> : null}
            </div>
          </div>

          {posSalesMessage ? <div style={styles.infoCardText}>{posSalesMessage}</div> : null}

          <div style={styles.metricGrid}>
            <div style={styles.metricCard}><div style={styles.metricLabel}>Total POS Sales</div><div style={styles.metricValue}>{formatCurrency(posSalesReport.totalPosSales)}</div></div>
            <div style={styles.metricCard}><div style={styles.metricLabel}>Matched Sales</div><div style={styles.metricValue}>{formatCurrency(posSalesReport.matchedSales)}</div></div>
            <div style={styles.metricCard}><div style={styles.metricLabel}>Unmatched POS Items</div><div style={styles.metricValue}>{posSalesReport.unmatched.length}</div></div>
            <div style={styles.metricCard}><div style={styles.metricLabel}>Estimated Gross Profit</div><div style={styles.metricValue}>{formatCurrency(posSalesReport.estimatedGrossProfit)}</div></div>
            <div style={styles.metricCard}><div style={styles.metricLabel}>Average GP %</div><div style={styles.metricValue}>{roundTo(posSalesReport.averageGpPercent, 1)}%</div></div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.dashboardSectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Damage Report</h2>
              <p style={styles.sectionSubtitle}>Quick calls from the latest matched sales. No spreadsheets, no sugar-coating.</p>
            </div>
          </div>
          <div style={styles.infoCardGrid}>
            {posSalesReport.summaryCallouts
              .filter((callout: any) => callout !== null)
              .map((callout: string | null, index: number) => (
              <div key={`pos_summary_${index}`} style={styles.infoCard}>
                <div style={styles.infoCardText}>{callout ?? ""}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.dashboardSectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Top 5 Damage Report</h2>
              <p style={styles.sectionSubtitle}>Biggest lost GP opportunity compared to a 70% GP target.</p>
            </div>
          </div>
          {posSalesReport.damageReport.length === 0 ? (
            <div style={styles.emptyState}>Nothing below target — the GP cops are bored.</div>
          ) : (
            <div style={styles.infoCardGrid}>
              {posSalesReport.damageReport.map((row: any) => (
                <div key={`damage_${row.id || row.posItemName}`} style={styles.infoCard}>
                  <div style={styles.infoCardHeaderRow}>
                    <div>
                      <div style={styles.infoCardTitle}>{row.posItemName}</div>
                      <div style={styles.infoCardSubtext}>{row.linkedRecipe ? `Linked to ${row.linkedRecipe.name}` : "Not linked yet"}</div>
                    </div>
                    <div style={styles.infoCardCostMain}>{formatCurrency(row.lostOpportunity)}</div>
                  </div>
                  <div style={styles.infoCardText}>{row.posItemName}: {formatCurrency(row.lostOpportunity)} below 70% GP target.</div>
                  <div style={styles.infoCardText}>Quantity Sold: {roundTo(row.quantitySold, 2)}</div>
                  <div style={styles.infoCardText}>Total Sales: {formatCurrency(row.totalSales)}</div>
                  <div style={styles.infoCardText}>Current GP: {roundTo(row.gpPercent, 1)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.dashboardSectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Fix Suggestions</h2>
              <p style={styles.sectionSubtitle}>Advice only for red flags. Edit prices and portions back in the recipe/menu workflow when you are ready.</p>
            </div>
          </div>
          {posSalesReport.fixSuggestions.length === 0 ? (
            <div style={styles.emptyState}>No red flag fixes needed yet. Either the GP is behaving or the dishes need matching first.</div>
          ) : (
            <div style={styles.infoCardGrid}>
              {posSalesReport.fixSuggestions.map((row: any) => (
                <div key={`fix_${row.id || row.posItemName}`} style={styles.infoCard}>
                  <div style={styles.infoCardHeaderRow}>
                    <div>
                      <div style={styles.infoCardTitle}>{row.posItemName}</div>
                      <div style={styles.infoCardSubtext}>{row.linkedRecipe ? `Linked to ${row.linkedRecipe.name}` : "Not linked yet"}</div>
                    </div>
                    <div style={styles.infoCardCostMain}>{roundTo(row.gpPercent, 1)}%</div>
                  </div>
                  <div style={styles.infoCardText}>Current GP: {roundTo(row.gpPercent, 1)}%</div>
                  <div style={styles.infoCardText}>Current Average Sale Price: {formatCurrency(row.averageSalePrice)}</div>
                  <div style={styles.infoCardText}>Estimated Cost Per Dish: {formatCurrency(row.recipeCostPerDish)}</div>
                  <div style={styles.infoCardText}>Raise average sell price to {formatCurrency(row.priceNeededFor70)} to hit 70% GP.</div>
                  {safeNumber(row.costReductionNeeded) > 0 ? (
                    <div style={styles.infoCardText}>Or reduce plate cost by {formatCurrency(row.costReductionNeeded)} per serve.</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.dashboardTwoColumnGrid}>

        <div style={styles.card}>
          <div style={styles.dashboardSectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Match POS Items to Final Dishes</h2>
              <p style={styles.sectionSubtitle}>Match each POS name to the final dish recipe. No match, no profit callout.</p>
            </div>
          </div>

          {posSales.length === 0 ? (
            <div style={styles.emptyState}>No POS sales uploaded yet. Export a CSV from the till and let GP Police sniff out the margin.</div>
          ) : (
            <div style={styles.infoCardGrid}>
              {posSales.map((sale: any) => (
                <div key={sale.id} style={styles.infoCard}>
                  <div style={styles.infoCardTitle}>{sale.posItemName}</div>
                  <div style={styles.infoCardText}>Quantity Sold: {roundTo(sale.quantitySold, 2)}</div>
                  <div style={styles.infoCardText}>Total Sales: {formatCurrency(sale.totalSales)}</div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Link to Final Dish Recipe</label>
                    <select
                      value={posDishMatches[sale.posItemName] || ""}
                      onChange={(event: any) => updatePosDishMatch(sale.posItemName, event.target.value)}
                      style={styles.select}
                    >
                      <option value="">Not matched yet</option>
                      {finalDishRecipes.map((recipe: any) => (
                        <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>        <div style={styles.card}>
            <h2 style={styles.sectionTitle}>GP Winners</h2>
            <p style={styles.sectionSubtitle}>Matched dishes with GP at 70% or better.</p>
            {posSalesReport.winners.length === 0 ? <div style={styles.emptyState}>No winners yet. Either upload sales or start matching dishes.</div> : <div style={styles.infoCardGrid}>{posSalesReport.winners.map(renderPosSalesRow)}</div>}
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>GP Warnings</h2>
            <p style={styles.sectionSubtitle}>Matched dishes sitting between 60% and 69.99% GP.</p>
            {posSalesReport.warnings.length === 0 ? <div style={styles.emptyState}>No warnings right now.</div> : <div style={styles.infoCardGrid}>{posSalesReport.warnings.map(renderPosSalesRow)}</div>}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>GP Police Red Flags</h2>
          <p style={styles.sectionSubtitle}>Matched dishes under 60% GP. This is where the till starts looking suspicious.</p>
          {posSalesReport.redFlags.length === 0 ? <div style={styles.emptyState}>No red flags yet. GP Police found no crimes here.</div> : <div style={styles.infoCardGrid}>{posSalesReport.redFlags.map(renderPosSalesRow)}</div>}
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Unmatched POS Items</h2>
          <p style={styles.sectionSubtitle}>These items are not linked to a recipe yet. Match them before trusting the numbers.</p>
          {posSalesReport.unmatched.length === 0 ? (
            <div style={styles.emptyState}>All POS items are matched. Clean file, chef.</div>
          ) : (
            <div style={styles.infoCardGrid}>
              {posSalesReport.unmatched.map((row: any) => (
                <div key={row.id || row.posItemName} style={styles.infoCard}>
                  <div style={styles.infoCardTitle}>{row.posItemName}</div>
                  <div style={styles.infoCardText}>Quantity Sold: {roundTo(row.quantitySold, 2)}</div>
                  <div style={styles.infoCardText}>Total Sales: {formatCurrency(row.totalSales)}</div>
                  <div style={styles.infoCardSubtext}>Not linked to a final dish recipe yet.</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };


  return renderPosSalesPage();
}
