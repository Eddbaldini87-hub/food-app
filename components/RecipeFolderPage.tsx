export function RecipeFolderPage(props: any) {
  const {
    styles,
    recipeFolderOptions,
    currentRecipeFolder,
    setRecipeFolderView,
    folderRecipes,
    renderRecipesListSection,
  } = props;

  if (currentRecipeFolder) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.pageHeader}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => setRecipeFolderView(null)}
          >
            ← Back to Recipes
          </button>
          <h1 style={styles.pageTitle}>{currentRecipeFolder.label}</h1>
          <p style={styles.pageSubtitle}>{currentRecipeFolder.helper}</p>
        </div>

        {renderRecipesListSection(folderRecipes, false)}
      </div>
    );
  }

  const recipeOverviewCards = recipeFolderOptions.map((folder: any) => {
    const folderCount = folder.folderCount ?? 0;

    return (
      <button
        key={folder.key}
        type="button"
        style={{ ...styles.recipeOverviewCard, ...styles.recipeOverviewCardClickable }}
        onClick={() => setRecipeFolderView(folder.key)}
      >
        <div style={styles.recipeOverviewLabel}>{folder.label}</div>
        <div style={styles.metricValueSmall}>{folderCount}</div>
      </button>
    );
  });

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Recipes</h1>
        <p style={styles.pageSubtitle}>
          Build, search, and manage your prep, batch, and final dish recipes without pretending memory is a costing system.
        </p>
      </div>

      <div style={styles.recipeOverviewStrip}>{recipeOverviewCards}</div>

      {renderRecipesListSection()}
    </div>
  );
}
