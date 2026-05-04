export function RecipePrepSheetPage(props: any) {
  const {
    styles,
    selectedRecipe,
    handleSidebarNavigation,
    setSelectedRecipeView,
    setActiveView,
    downloadRecipeTextFile,
    roundTo,
  } = props;

  if (!selectedRecipe) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Prep Sheet</h1>
          <p style={styles.pageSubtitle}>No recipe selected. The file's gone missing, chief.</p>
        </div>
        <div style={styles.card}>
          <div style={styles.emptyStatePanel}>
            <div style={styles.emptyStateTitle}>No prep sheet available</div>
            <div style={styles.emptyStateText}>Open a recipe first, then pull its prep sheet. No shortcuts here.</div>
            <div style={styles.buttonRow}>
              <button type="button" style={styles.primaryButton} onClick={() => handleSidebarNavigation("recipes")}>
                Back to Recipes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groupedSections = Object.entries(
    selectedRecipe.componentDetails.reduce((accumulator: Record<string, any[]>, component: any) => {
      const sectionName = String(component.section || "Main").trim() || "Main";
      if (!accumulator[sectionName]) {
        accumulator[sectionName] = [];
      }
      accumulator[sectionName].push(component);
      return accumulator;
    }, {})
  );

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>{selectedRecipe.name} Prep Sheet</h1>
        <p style={styles.pageSubtitle}>Kitchen-friendly production sheet for prep, service, and fewer "who forgot that?" crimes.</p>
      </div>

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
                setSelectedRecipeView("detail");
                setActiveView("recipeDetail");
              }}
            >
              Back to Recipe
            </button>
            <button type="button" style={styles.secondaryButton} onClick={() => window.print()}>
              Print Prep Sheet
            </button>
            <button type="button" style={styles.secondaryButton} onClick={() => downloadRecipeTextFile(selectedRecipe, "prep")}>
              Download Prep Sheet
            </button>
          </div>
        </div>

        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Recipe Type</div>
            <div style={styles.summaryValue}>{selectedRecipe.recipeType}</div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Yield</div>
            <div style={styles.summaryValue}>{roundTo(selectedRecipe.yieldAmount, 2)} {selectedRecipe.yieldUnit}</div>
          </div>
          {selectedRecipe.recipeType === "final dish" ? (
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Portion Size</div>
              <div style={styles.summaryValue}>{roundTo(selectedRecipe.portionSize, 2)} {selectedRecipe.portionUnit}</div>
            </div>
          ) : null}
        </div>

        {selectedRecipe.notes ? (
          <div style={styles.cardInset}>
            <h3 style={styles.sectionTitleSmall}>Method / Notes</h3>
            <div style={styles.recipeNotesBlock}>{selectedRecipe.notes}</div>
          </div>
        ) : null}

        <div style={styles.cardInset}>
          <h3 style={styles.sectionTitleSmall}>Prep Breakdown</h3>
          {groupedSections.length === 0 ? (
            <div style={styles.emptyState}>No components in this recipe. Bit hard to cost thin air.</div>
          ) : (
            <div style={styles.prepSheetSectionStack}>
              {groupedSections.map(([sectionName, sectionComponents]) => (
                <div key={sectionName} style={styles.prepSheetSectionCard}>
                  <div style={styles.prepSheetSectionHeader}>{sectionName}</div>
                  <div style={styles.prepSheetItemList}>
                    {(sectionComponents as any[]).map((component: any) => (
                      <div key={component.id} style={styles.prepSheetItemRow}>
                        <div style={styles.prepSheetItemMain}>
                          <div style={styles.prepSheetItemName}>{component.linkedName}</div>
                          <div style={styles.prepSheetItemMeta}>
                            {component.componentType === "supplier"
                              ? "Supplier Ingredient"
                              : component.componentType === "prep"
                              ? "Ingredient Prep Recipe"
                              : "Batch Recipe"}
                          </div>
                        </div>
                        <div style={styles.prepSheetItemQty}>
                          {roundTo(component.quantity, 2)} {component.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
    
}
