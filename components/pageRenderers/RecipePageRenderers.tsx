import { RecipesListPage } from "../RecipesListPage";
import { RecipeDetailPage } from "../RecipeDetailPage";
import { RecipeBuilderPage } from "../RecipeBuilderPage";
import { RecipePrepSheetPage } from "../RecipePrepSheetPage";
import { ImportedRecipeReviewPage } from "../ImportedRecipeReviewPage";
import { RecipeFolderPage } from "../RecipeFolderPage";

export function createRecipePageRenderers(props: any) {
  const {
    styles,
    filteredRecipes,
    recipeTypeOptions,
    recipeSearchTerm,
    setRecipeSearchTerm,
    recipeTypeFilter,
    setRecipeTypeFilter,
    startNewRecipe,
    computedRecipes,
    formatCurrency,
    roundTo,
    formatDisplayCostPerUnit,
    openRecipeView,
    editRecipe,
    deleteRecipe,
    selectedRecipe,
    setSelectedRecipeId,
    setSelectedRecipeView,
    setActiveView,
    downloadRecipeTextFile,
    safeNumber,
    handleSidebarNavigation,
    currentRecipeFolder,
    recipeFolderOptions,
    setRecipeFolderView,
    importedRecipeDraft,
    recipeImportMessage,
    setRecipeImportMessage,
    saveImportedRecipeDraft,
    clearImportedRecipeReview,
    editImportedRecipeInFullForm,
    updateImportedRecipeDraftField,
    updateImportedRecipeDraftLine,
    ignoreImportedRecipeDraftLine,
    normalizeImportedRecipeType,
    recipeYieldUnitOptions,
    importedRecipeUnitOptions,
    supplierIngredients,
    orderingMeta,
    recipeForm,
    recipeImportFileInputRef,
    handleRecipeImportFileUpload,
    recipeImportText,
    setRecipeImportText,
    importRecipeFromText,
    saveRecipe,
    handleRecipeFormChange,
    addRecipeComponent,
    recipeIngredientSearchRef,
    recipeIngredientSearch,
    setRecipeIngredientSearch,
    quickAddIngredientMatches,
    getIngredientSummaryDisplay,
    quickAddSupplierIngredientToRecipe,
    ingredientLookup,
    computedRecipeLookup,
    getCompatibleUnitsForBase,
    componentUnitOptions,
    updateRecipeComponent,
    buildComponentDetail,
    removeRecipeComponent,
    recipePreview,
    clearRecipeForm,
  } = props;

  const renderRecipesListSection = (recipesToShow = filteredRecipes, showToolbar = true) => (
    <RecipesListPage
      styles={styles}
      recipesToShow={recipesToShow}
      showToolbar={showToolbar}
      recipeTypeOptions={recipeTypeOptions}
      recipeSearchTerm={recipeSearchTerm}
      setRecipeSearchTerm={setRecipeSearchTerm}
      recipeTypeFilter={recipeTypeFilter}
      setRecipeTypeFilter={setRecipeTypeFilter}
      startNewRecipe={startNewRecipe}
      computedRecipes={computedRecipes}
      formatCurrency={formatCurrency}
      roundTo={roundTo}
      formatDisplayCostPerUnit={formatDisplayCostPerUnit}
      openRecipeView={openRecipeView}
      editRecipe={editRecipe}
      deleteRecipe={deleteRecipe}
    />
  );

  const renderRecipeDetailSection = () => (
    <RecipeDetailPage
      styles={styles}
      selectedRecipe={selectedRecipe}
      setSelectedRecipeId={setSelectedRecipeId}
      setSelectedRecipeView={setSelectedRecipeView}
      setActiveView={setActiveView}
      editRecipe={editRecipe}
      downloadRecipeTextFile={downloadRecipeTextFile}
      deleteRecipe={deleteRecipe}
      roundTo={roundTo}
      formatCurrency={formatCurrency}
      formatDisplayCostPerUnit={formatDisplayCostPerUnit}
      safeNumber={safeNumber}
    />
  );

  const renderPrepSheetPage = () => (
    <RecipePrepSheetPage
      styles={styles}
      selectedRecipe={selectedRecipe}
      handleSidebarNavigation={handleSidebarNavigation}
      setSelectedRecipeView={setSelectedRecipeView}
      setActiveView={setActiveView}
      downloadRecipeTextFile={downloadRecipeTextFile}
      roundTo={roundTo}
    />
  );

  const renderRecipesPage = () => {
    if (currentRecipeFolder) {
      const folderRecipes = currentRecipeFolder.getRecipes();

      return (
        <RecipeFolderPage
          styles={styles}
          recipeFolderOptions={recipeFolderOptions}
          currentRecipeFolder={currentRecipeFolder}
          setRecipeFolderView={setRecipeFolderView}
          folderRecipes={folderRecipes}
          renderRecipesListSection={renderRecipesListSection}
        />
      );
    }

    const recipeFolderSummaries = recipeFolderOptions.map((folder: any) => ({
      ...folder,
      folderCount: folder.getRecipes().length,
    }));

    return (
      <RecipeFolderPage
        styles={styles}
        recipeFolderOptions={recipeFolderSummaries}
        currentRecipeFolder={currentRecipeFolder}
        setRecipeFolderView={setRecipeFolderView}
        renderRecipesListSection={renderRecipesListSection}
      />
    );
  };

  const renderImportedRecipeReview = () => {
    if (!importedRecipeDraft) return null;

    const matchedCount = importedRecipeDraft.lines.filter((line: any) => line.status === "matched").length;
    const ignoredCount = importedRecipeDraft.lines.filter((line: any) => line.status === "ignored").length;
    const attentionCount = importedRecipeDraft.lines.filter((line: any) => line.status !== "matched" && line.status !== "ignored").length;
    const activeLineCount = importedRecipeDraft.lines.length - ignoredCount;

    return (
      <ImportedRecipeReviewPage
        styles={styles}
        importedRecipeDraft={importedRecipeDraft}
        recipeImportMessage={recipeImportMessage}
        setRecipeImportMessage={setRecipeImportMessage}
        handleImportRecipeConfirm={saveImportedRecipeDraft}
        handleCancelImport={clearImportedRecipeReview}
        formatCurrency={formatCurrency}
        roundTo={roundTo}
        matchedCount={matchedCount}
        ignoredCount={ignoredCount}
        attentionCount={attentionCount}
        activeLineCount={activeLineCount}
        saveImportedRecipeDraft={saveImportedRecipeDraft}
        editImportedRecipeInFullForm={editImportedRecipeInFullForm}
        clearImportedRecipeReview={clearImportedRecipeReview}
        updateImportedRecipeDraftField={updateImportedRecipeDraftField}
        updateImportedRecipeDraftLine={updateImportedRecipeDraftLine}
        ignoreImportedRecipeDraftLine={ignoreImportedRecipeDraftLine}
        normalizeImportedRecipeType={normalizeImportedRecipeType}
        recipeYieldUnitOptions={recipeYieldUnitOptions}
        importedRecipeUnitOptions={importedRecipeUnitOptions}
        supplierIngredients={supplierIngredients}
        orderingMeta={orderingMeta}
      />
    );
  };

  const renderRecipeBuilderPage = () => (
    <RecipeBuilderPage
      styles={styles}
      computedRecipes={computedRecipes}
      recipeForm={recipeForm}
      setActiveView={setActiveView}
      recipeImportFileInputRef={recipeImportFileInputRef}
      handleRecipeImportFileUpload={handleRecipeImportFileUpload}
      recipeImportMessage={recipeImportMessage}
      recipeImportText={recipeImportText}
      setRecipeImportText={setRecipeImportText}
      importRecipeFromText={importRecipeFromText}
      clearImportedRecipeReview={clearImportedRecipeReview}
      renderImportedRecipeReview={renderImportedRecipeReview}
      saveRecipe={saveRecipe}
      handleRecipeFormChange={handleRecipeFormChange}
      recipeTypeOptions={recipeTypeOptions}
      recipeYieldUnitOptions={recipeYieldUnitOptions}
      addRecipeComponent={addRecipeComponent}
      recipeIngredientSearchRef={recipeIngredientSearchRef}
      recipeIngredientSearch={recipeIngredientSearch}
      setRecipeIngredientSearch={setRecipeIngredientSearch}
      quickAddIngredientMatches={quickAddIngredientMatches}
      orderingMeta={orderingMeta}
      getIngredientSummaryDisplay={getIngredientSummaryDisplay}
      quickAddSupplierIngredientToRecipe={quickAddSupplierIngredientToRecipe}
      ingredientLookup={ingredientLookup}
      computedRecipeLookup={computedRecipeLookup}
      getCompatibleUnitsForBase={getCompatibleUnitsForBase}
      componentUnitOptions={componentUnitOptions}
      supplierIngredients={supplierIngredients}
      updateRecipeComponent={updateRecipeComponent}
      buildComponentDetail={buildComponentDetail}
      removeRecipeComponent={removeRecipeComponent}
      formatCurrency={formatCurrency}
      recipePreview={recipePreview}
      formatDisplayCostPerUnit={formatDisplayCostPerUnit}
      roundTo={roundTo}
      safeNumber={safeNumber}
      clearRecipeForm={clearRecipeForm}
    />
  );

  return {
    renderRecipesListSection,
    renderRecipeDetailSection,
    renderPrepSheetPage,
    renderRecipesPage,
    renderImportedRecipeReview,
    renderRecipeBuilderPage,
  };
}
