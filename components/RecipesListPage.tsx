export function RecipesListPage(props: any) {
  const {
    styles,
    recipesToShow = [],
    showToolbar = true,
    recipeTypeOptions = [],
    recipeSearchTerm,
    setRecipeSearchTerm,
    recipeTypeFilter,
    setRecipeTypeFilter,
    startNewRecipe,
    computedRecipes = [],
    formatCurrency,
    roundTo,
    formatDisplayCostPerUnit,
    openRecipeView,
    editRecipe,
    deleteRecipe,
  } = props;

  const groupedRecipes = recipeTypeOptions
    .map((type: string) => {
      const typeRecipes = recipesToShow.filter((recipe: any) => recipe.recipeType === type);
      const categories = Array.from(
        new Set<string>(
          typeRecipes.map((recipe: any) => String(recipe.category || "Uncategorised").trim() || "Uncategorised")
        )
      ).sort((a: string, b: string) => a.localeCompare(b));

      return {
        type,
        total: typeRecipes.length,
        categories: categories.map((category) => ({
          category,
          items: typeRecipes
            .filter((recipe: any) => (String(recipe.category || "Uncategorised").trim() || "Uncategorised") === category)
            .sort((a: any, b: any) => a.name.localeCompare(b.name)),
        })),
      };
    })
    .filter((group: any) => group.total > 0);

  return (
    <div style={styles.card}>
      {showToolbar ? (
        <div style={styles.recipeToolbar}>
          <div style={styles.recipeToolbarLeft}>
            <h2 style={styles.sectionTitle}>Recipes</h2>
            <div style={styles.recipeToolbarSubtitle}>
              Search, filter, view, edit, delete, or spin up recipes without the usual carry-on.
            </div>
          </div>

          <div style={styles.recipeToolbarRight}>
            <div style={styles.recipeSearchWrap}>
              <input
                type="text"
                value={recipeSearchTerm}
                onChange={(event: any) => setRecipeSearchTerm(event.target.value)}
                style={styles.input}
                placeholder="Search recipes..."
              />
            </div>

            <div style={styles.recipeFilterWrap}>
              <select
                value={recipeTypeFilter}
                onChange={(event: any) => setRecipeTypeFilter(event.target.value)}
                style={styles.select}
              >
                <option value="all">all</option>
                <option value="ingredient prep">ingredient prep</option>
                <option value="batch recipe">batch recipe</option>
                <option value="final dish">final dish</option>
              </select>
            </div>

            <button type="button" style={styles.primaryButton} onClick={startNewRecipe}>
              Add New Recipe
            </button>
          </div>
        </div>
      ) : null}

      {recipesToShow.length === 0 ? (
        <div style={styles.emptyState}>
          {showToolbar
            ? computedRecipes.length === 0
              ? "No recipes yet. Your GP’s getting cooked."
              : "Nothing matches that search. Your filter's kicking doors in."
            : "No recipes saved. No wonder your GP’s cooked."}
        </div>
      ) : (
        <div style={styles.sectionGroupStack}>
          {groupedRecipes.map((typeGroup: any) => (
            <div key={typeGroup.type} style={styles.sectionGroupCard}>
              <div style={styles.sectionGroupHeaderRow}>
                <h3 style={styles.sectionGroupTitle}>{typeGroup.type}</h3>
                <div style={styles.sectionGroupSubtotal}>{typeGroup.total} recipe{typeGroup.total === 1 ? "" : "s"}</div>
              </div>

              <div style={styles.sectionGroupStack}>
                {typeGroup.categories.map((categoryGroup: any) => (
                  <div key={`${typeGroup.type}_${categoryGroup.category}`} style={styles.cardInset}>
                    <div style={styles.recipeCategoryHeading}>{categoryGroup.category}</div>

                    <div style={styles.recipeFolderList}>
                      {categoryGroup.items.map((recipe: any) => (
                        <div key={recipe.id} style={styles.recipeFolderRow}>
                          <div style={styles.recipeFolderMeta}>
                            <div style={styles.recipeFolderName}>{recipe.name}</div>
                            <div style={styles.recipeFolderSubtext}>
                              {recipe.recipeType}
                              {recipe.category ? ` • ${recipe.category}` : ""}
                            </div>

                            <div style={styles.recipeFolderStats}>
                              <div style={styles.recipeFolderStat}>Total Cost: {formatCurrency(recipe.totalCost)}</div>

                              {recipe.recipeType !== "final dish" ? (
                                <>
                                  <div style={styles.recipeFolderStat}>
                                    Yield: {roundTo(recipe.yieldAmount, 2)} {recipe.yieldUnit}
                                  </div>
                                  <div style={styles.recipeFolderStat}>
                                    Cost / Unit: {formatDisplayCostPerUnit(recipe.baseUnit, recipe.costPerBaseUnit)}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={styles.recipeFolderStat}>
                                    Cost / Portion: {formatCurrency(recipe.costPerPortion)}
                                  </div>
                                  <div style={styles.recipeFolderStat}>
                                    Sell Price: {formatCurrency(recipe.sellPrice)}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div style={styles.recipeFolderActions}>
                            <button type="button" style={styles.smallButton} onClick={() => openRecipeView(recipe.id)}>
                              View Recipe
                            </button>
                            <button type="button" style={styles.smallButton} onClick={() => editRecipe(recipe.id)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              style={styles.smallDangerButton}
                              onClick={() => deleteRecipe(recipe.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
