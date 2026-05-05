import { Dashboard } from "../Dashboard";
import { IngredientsPage } from "../IngredientsPage";
import { SuppliersPage } from "../SuppliersPage";
import { OrderingPage } from "../OrderingPage";
import { StockPage } from "../StockPage";
import { StocktakePage } from "../StocktakePage";
import { POSSalesPage } from "../POSSalesPage";
import { InvoiceSpendPage } from "../InvoiceSpendPage";
import { MenuSummaryPage } from "../MenuSummaryPage";

export function createPageRenderers(props: any) {
  const {
    styles,
    orderingMeta,
    supplierIngredients,
    computedRecipes,
    dashboardFolderView,
    setDashboardFolderView,
    getIngredientSummaryDisplay,
    formatCurrency,
    roundTo,
    safeNumber,
    editIngredient,
    deleteIngredient,
    renderRecipesListSection,
    recipesWithNoComponents,
    finalDishesWithNoSellPrice,
    posSales,
    invoiceSpendRecords,
    totalFinalDishCount,
    estimatedOrderSpend,
    posSalesReport,
    isMobileViewport,
    handleSidebarNavigation,
    handleOpenInvoiceCamera,
    startNewRecipe,
    startNewSupplierLine,
    totalRecipeCount,
    stock,
    gpDamageSummary,
    gpImpactSummary,
    invoiceSpendForm,
    setInvoiceSpendForm,
    invoiceWeeklySummary,
    invoiceSpendMessage,
    sortedInvoiceSpendRecords,
    invoice,
    getInvoiceRecordDateValue,
    getInvoiceRecordSupplierName,
    getInvoiceRecordTotal,
    getMondayWeekStart,
    selectedSupplier,
    renderSupplierInvoiceImportPanel,
    setSupplierForm,
    defaultSupplierForm,
    setSupplierMessage,
    setShowSupplierForm,
    supplierMessage,
    showSupplierForm,
    supplierForm,
    saveSupplier,
    handleSupplierFormChange,
    supplierDayOptions,
    toggleSupplierDay,
    resetSupplierForm,
    supplierSearchTerm,
    setSupplierSearchTerm,
    filteredSupplierDirectory,
    setSelectedSupplierId,
    editSupplier,
    deleteSupplier,
    selectedSupplierEmailAddress,
    supplierEmailHref,
    selectedSupplierIngredients,
    ingredientForm,
    saveIngredient,
    handleIngredientFormChange,
    setIngredientSupplierName,
    supplierDirectory,
    purchasePriceInputValue,
    handlePurchasePriceFocus,
    handlePurchasePriceChange,
    handlePurchasePriceBlur,
    purchaseUnitOptions,
    sizeUnitOptions,
    clearIngredientForm,
    lowStockCount,
    supplierGroupedRegister,
    showSupplierLineForm,
    housePrepRecipes,
    formatDisplayCostPerUnit,
    openRecipeView,
    finalDishRecipes,
    posSalesMessage,
    posDishMatches,
    handlePosSalesCsvUpload,
    clearPosSales,
    updatePosDishMatch,
    setActiveView,
  } = props;



  const renderDashboardPage = () => (
    <Dashboard
      styles={styles}
      orderingMeta={orderingMeta}
      supplierIngredients={supplierIngredients}
      computedRecipes={computedRecipes}
      dashboardFolderView={dashboardFolderView}
      setDashboardFolderView={setDashboardFolderView}
      getIngredientSummaryDisplay={getIngredientSummaryDisplay}
      formatCurrency={formatCurrency}
      roundTo={roundTo}
      safeNumber={safeNumber}
      editIngredient={editIngredient}
      deleteIngredient={deleteIngredient}
      renderRecipesListSection={renderRecipesListSection}
      recipesWithNoComponents={recipesWithNoComponents}
      finalDishesWithNoSellPrice={finalDishesWithNoSellPrice}
      posSales={posSales}
      invoiceSpendRecords={invoiceSpendRecords}
      totalFinalDishCount={totalFinalDishCount}
      estimatedOrderSpend={estimatedOrderSpend}
      posSalesReport={posSalesReport}
      isMobileViewport={isMobileViewport}
      handleSidebarNavigation={handleSidebarNavigation}
      handleOpenInvoiceCamera={handleOpenInvoiceCamera}
      startNewRecipe={startNewRecipe}
      startNewSupplierLine={startNewSupplierLine}
      totalRecipeCount={totalRecipeCount}
      stockDamageReport={stock.stockDamageReport}
      gpDamageSummary={gpDamageSummary}
      gpImpactSummary={gpImpactSummary}
    />
  );



  const renderInvoicePage = () => (
    <InvoiceSpendPage
      styles={styles}
      invoiceSpendForm={invoiceSpendForm}
      setInvoiceSpendForm={setInvoiceSpendForm}
      invoiceWeeklySummary={invoiceWeeklySummary}
      invoiceSpendMessage={invoiceSpendMessage}
      sortedInvoiceSpendRecords={sortedInvoiceSpendRecords}
      handleSaveInvoiceSpend={invoice.handleSaveInvoiceSpend}
      handleSidebarNavigation={handleSidebarNavigation}
      deleteInvoiceSpendRecord={invoice.deleteInvoiceSpendRecord}
      getInvoiceRecordDateValue={getInvoiceRecordDateValue}
      getInvoiceRecordSupplierName={getInvoiceRecordSupplierName}
      getInvoiceRecordTotal={getInvoiceRecordTotal}
      getMondayWeekStart={getMondayWeekStart}
      formatCurrency={formatCurrency}
    />
  );



  const renderSuppliersPage = () => (
    <SuppliersPage
      styles={styles}
      supplierInvoiceViewOpen={invoice.supplierInvoiceViewOpen}
      selectedSupplier={selectedSupplier}
      setSupplierInvoiceViewOpen={invoice.setSupplierInvoiceViewOpen}
      renderSupplierInvoiceImportPanel={renderSupplierInvoiceImportPanel}
      setSupplierForm={setSupplierForm}
      defaultSupplierForm={defaultSupplierForm}
      setSupplierMessage={setSupplierMessage}
      setShowSupplierForm={setShowSupplierForm}
      supplierMessage={supplierMessage}
      showSupplierForm={showSupplierForm}
      supplierForm={supplierForm}
      saveSupplier={saveSupplier}
      handleSupplierFormChange={handleSupplierFormChange}
      supplierDayOptions={supplierDayOptions}
      toggleSupplierDay={toggleSupplierDay}
      resetSupplierForm={resetSupplierForm}
      supplierSearchTerm={supplierSearchTerm}
      setSupplierSearchTerm={setSupplierSearchTerm}
      filteredSupplierDirectory={filteredSupplierDirectory}
      supplierIngredients={supplierIngredients}
      orderingMeta={orderingMeta}
      setSelectedSupplierId={setSelectedSupplierId}
      editSupplier={editSupplier}
      deleteSupplier={deleteSupplier}
      setSupplierInvoiceText={invoice.setSupplierInvoiceText}
      setSupplierInvoiceRows={invoice.setSupplierInvoiceRows}
      setSupplierInvoiceMessage={invoice.setSupplierInvoiceMessage}
      selectedSupplierEmailAddress={selectedSupplierEmailAddress}
      supplierEmailHref={supplierEmailHref}
      selectedSupplierIngredients={selectedSupplierIngredients}
      getIngredientSummaryDisplay={getIngredientSummaryDisplay}
      roundTo={roundTo}
      formatCurrency={formatCurrency}
      editIngredient={editIngredient}
    />
  );



  const renderIngredientsPage = () => {
    return (
      <IngredientsPage
        styles={styles}
        ingredientForm={ingredientForm}
        saveIngredient={saveIngredient}
        handleIngredientFormChange={handleIngredientFormChange}
        setIngredientSupplierName={setIngredientSupplierName}
        supplierDirectory={supplierDirectory}
        purchasePriceInputValue={purchasePriceInputValue}
        handlePurchasePriceFocus={handlePurchasePriceFocus}
        handlePurchasePriceChange={handlePurchasePriceChange}
        handlePurchasePriceBlur={handlePurchasePriceBlur}
        purchaseUnitOptions={purchaseUnitOptions}
        sizeUnitOptions={sizeUnitOptions}
        formatCurrency={formatCurrency}
        clearIngredientForm={clearIngredientForm}
        supplierIngredients={supplierIngredients}
        getIngredientSummaryDisplay={getIngredientSummaryDisplay}
        editIngredient={editIngredient}
        deleteIngredient={deleteIngredient}
        roundTo={roundTo}
      />
    );
  };




  const renderOrderingPage = () => (
    <OrderingPage
      styles={styles}
      orderingRows={stock.orderingRows}
      lowStockCount={lowStockCount}
      estimatedOrderSpend={estimatedOrderSpend}
      supplierGroupedRegister={supplierGroupedRegister}
      groupedOrderingRows={stock.groupedOrderingRows}
      orderingMeta={orderingMeta}
      orderingSearchTerm={stock.orderingSearchTerm}
      setOrderingSearchTerm={stock.setOrderingSearchTerm}
      showLowStockOnly={stock.showLowStockOnly}
      setShowLowStockOnly={stock.setShowLowStockOnly}
      updateOrderingMetaField={stock.updateOrderingMetaField}
      editIngredient={editIngredient}
      deleteIngredient={deleteIngredient}
      formatCurrency={formatCurrency}
      roundTo={roundTo}
      getIngredientSummaryDisplay={getIngredientSummaryDisplay}
      ingredientForm={ingredientForm}
      showSupplierLineForm={showSupplierLineForm}
      clearIngredientForm={clearIngredientForm}
      startNewSupplierLine={startNewSupplierLine}
      saveIngredient={saveIngredient}
      handleIngredientFormChange={handleIngredientFormChange}
      setIngredientSupplierName={setIngredientSupplierName}
      purchasePriceInputValue={purchasePriceInputValue}
      handlePurchasePriceFocus={handlePurchasePriceFocus}
      handlePurchasePriceChange={handlePurchasePriceChange}
      handlePurchasePriceBlur={handlePurchasePriceBlur}
      purchaseUnitOptions={purchaseUnitOptions}
      sizeUnitOptions={sizeUnitOptions}
      housePrepRecipes={housePrepRecipes}
      formatDisplayCostPerUnit={formatDisplayCostPerUnit}
      openRecipeView={openRecipeView}
    />
  );



  const renderStockPage = () => (
    <StockPage
      styles={styles}
      setActiveView={setActiveView}
      supplierIngredients={supplierIngredients}
      stocktakeRecords={stock.stocktakeRecords}
      stockMovements={stock.stockMovements}
      stockMovementBalances={stock.stockMovementBalances}
      stockMovementSummary={stock.stockMovementSummary}
      logManualStockAdjustment={stock.logManualStockAdjustment}
      invoiceSpendRecords={invoiceSpendRecords}
      orderingRows={stock.orderingRows}
      formatCurrency={formatCurrency}
      roundTo={roundTo}
    />
  );



  const renderStocktakePage = () => (
    <StocktakePage
      styles={styles}
      supplierIngredients={supplierIngredients}
      orderingMeta={orderingMeta}
      stockMovementBalances={stock.stockMovementBalances}
      stockMovementBalanceLookup={stock.stockMovementBalanceLookup}
      logManualStockAdjustment={stock.logManualStockAdjustment}
      updateOrderingMetaField={stock.updateOrderingMetaField}
      stocktakeRecords={stock.stocktakeRecords}
      stocktakeMessage={stock.stocktakeMessage}
      selectedStocktakeRecordId={stock.selectedStocktakeRecordId}
      setSelectedStocktakeRecordId={stock.setSelectedStocktakeRecordId}
      handleSaveStocktakeSnapshot={stock.handleSaveStocktakeSnapshot}
      formatCurrency={formatCurrency}
      roundTo={roundTo}
    />
  );




  const renderPosSalesPage = () => (
    <POSSalesPage
      styles={styles}
      posSales={posSales}
      posSalesMessage={posSalesMessage}
      posSalesReport={posSalesReport}
      posDishMatches={posDishMatches}
      finalDishRecipes={finalDishRecipes}
      handlePosSalesCsvUpload={handlePosSalesCsvUpload}
      clearPosSales={clearPosSales}
      updatePosDishMatch={updatePosDishMatch}
      formatCurrency={formatCurrency}
      roundTo={roundTo}
      safeNumber={safeNumber}
    />
  );



  const renderMenuSummaryPage = () => {
    const finalDishes = computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish");

    return (
      <MenuSummaryPage
        styles={styles}
        posSalesReport={posSalesReport}
        finalDishes={finalDishes}
        formatCurrency={formatCurrency}
        formatDisplayCostPerUnit={formatDisplayCostPerUnit}
        roundTo={roundTo}
      />
    );
  };

  return {
    renderDashboardPage,
    renderInvoicePage,
    renderSuppliersPage,
    renderIngredientsPage,
    renderOrderingPage,
    renderStockPage,
    renderStocktakePage,
    renderPosSalesPage,
    renderMenuSummaryPage,
  };
}
