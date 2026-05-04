export function RecipeDetailPage(props: any) {
  const {
    styles,
    selectedRecipe,
    setSelectedRecipeId,
    setSelectedRecipeView,
    setActiveView,
    editRecipe,
    downloadRecipeTextFile,
    deleteRecipe,
    roundTo,
    formatCurrency,
    formatDisplayCostPerUnit,
    safeNumber,
  } = props;

  if (!selectedRecipe) {
    return null;
  }

  return (
    <div style={styles.card}>
      <div style={styles.recipeDetailHeader}>
        <div>
          <h2 style={styles.sectionTitle}>{selectedRecipe.name}</h2>
          <div style={styles.infoCardSubtext}>
            {selectedRecipe.recipeType}
            {selectedRecipe.category ? ` • ${selectedRecipe.category}` : ""}
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => {
              setSelectedRecipeId(null);
              setSelectedRecipeView("detail");
              setActiveView("recipes");
            }}
          >
            Back to Recipes
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => {
              setSelectedRecipeView("prepSheet");
              setActiveView("recipePrepSheet");
            }}
          >
            View Prep Sheet
          </button>
          <button type="button" style={styles.primaryButton} onClick={() => editRecipe(selectedRecipe.id)}>
            Edit
          </button>
          <button type="button" style={styles.secondaryButton} onClick={() => window.print()}>
            Print Recipe
          </button>
          <button type="button" style={styles.secondaryButton} onClick={() => downloadRecipeTextFile(selectedRecipe, "recipe")}>
            Download Recipe
          </button>
          <button
            type="button"
            style={styles.smallDangerButton}
            onClick={() => deleteRecipe(selectedRecipe.id)}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={styles.summaryBar}>
        {selectedRecipe.recipeType !== "final dish" ? (
          <>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Yield</div>
              <div style={styles.summaryValue}>
                {roundTo(selectedRecipe.yieldAmount, 2)} {selectedRecipe.yieldUnit}
              </div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Total Cost</div>
              <div style={styles.summaryValue}>{formatCurrency(selectedRecipe.totalCost)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Cost Per Unit</div>
              <div style={styles.summaryValue}>
                {formatDisplayCostPerUnit(selectedRecipe.baseUnit, selectedRecipe.costPerBaseUnit)}
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Total Dish Cost</div>
              <div style={styles.summaryValue}>{formatCurrency(selectedRecipe.totalCost)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Portion Size</div>
              <div style={styles.summaryValue}>
                {roundTo(selectedRecipe.portionSize, 2)} {selectedRecipe.portionUnit}
              </div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Cost Per Portion</div>
              <div style={styles.summaryValue}>{formatCurrency(selectedRecipe.costPerPortion)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Sell Price</div>
              <div style={styles.summaryValue}>{formatCurrency(selectedRecipe.sellPrice)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Food Cost %</div>
              <div style={styles.summaryValue}>{roundTo(selectedRecipe.foodCostPercent, 2)}%</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Gross Profit %</div>
              <div style={styles.summaryValue}>{roundTo(selectedRecipe.grossProfitPercent, 2)}%</div>
            </div>
          </>
        )}
      </div>

      {selectedRecipe.notes ? (
        <div style={styles.cardInset}>
          <h3 style={styles.sectionTitleSmall}>Method / Notes</h3>
          <div style={styles.recipeNotesBlock}>{selectedRecipe.notes}</div>
        </div>
      ) : null}

      <div style={styles.cardInset}>
        <h3 style={styles.sectionTitleSmall}>Recipe Components</h3>

        {selectedRecipe.componentDetails.length === 0 ? (
          <div style={styles.emptyState}>No components in this recipe. Bit hard to cost thin air.</div>
        ) : (
          <div style={styles.sectionGroupStack}>
            {Object.entries(
              selectedRecipe.componentDetails.reduce((accumulator: Record<string, any[]>, component: any) => {
                const sectionName = String(component.section || "Main").trim() || "Main";
                if (!accumulator[sectionName]) {
                  accumulator[sectionName] = [];
                }
                accumulator[sectionName].push(component);
                return accumulator;
              }, {})
            ).map(([sectionName, sectionComponents]) => {
              const sectionSubtotal = (sectionComponents as any[]).reduce(
                (sum: number, component: any) => sum + safeNumber(component.lineCost),
                0
              );

              return (
                <div key={sectionName} style={styles.sectionGroupCard}>
                  <div style={styles.sectionGroupHeaderRow}>
                    <h4 style={styles.sectionGroupTitle}>{sectionName}</h4>
                    <div style={styles.sectionGroupSubtotal}>
                      Section Subtotal: {formatCurrency(sectionSubtotal)}
                    </div>
                  </div>

                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Type</th>
                          <th style={styles.th}>Item</th>
                          <th style={styles.th}>Quantity</th>
                          <th style={styles.th}>Unit Cost</th>
                          <th style={styles.th}>Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sectionComponents as any[]).map((component: any) => {
                          const unitCost =
                            safeNumber(component.quantity) > 0
                              ? safeNumber(component.lineCost) / safeNumber(component.quantity)
                              : 0;

                          return (
                            <tr key={component.id}>
                              <td style={styles.td}>
                                {component.componentType === "supplier"
                                  ? "Supplier Ingredient"
                                  : component.componentType === "prep"
                                  ? "Ingredient Prep Recipe"
                                  : "Batch Recipe"}
                              </td>
                              <td style={styles.td}>{component.linkedName}</td>
                              <td style={styles.td}>
                                {roundTo(component.quantity, 2)} {component.unit}
                              </td>
                              <td style={styles.td}>{formatCurrency(unitCost)}</td>
                              <td style={styles.td}>{formatCurrency(component.lineCost)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
