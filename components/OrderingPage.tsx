export function OrderingPage(props: any) {
  const {
    styles,
    orderingRows,
    lowStockCount,
    estimatedOrderSpend,
    supplierGroupedRegister,
    groupedOrderingRows,
    orderingMeta,
    orderingSearchTerm,
    setOrderingSearchTerm,
    showLowStockOnly,
    setShowLowStockOnly,
    updateOrderingMetaField,
    editIngredient,
    deleteIngredient,
    formatCurrency,
    roundTo,
    getIngredientSummaryDisplay,
    ingredientForm,
    showSupplierLineForm,
    clearIngredientForm,
    startNewSupplierLine,
    saveIngredient,
    handleIngredientFormChange,
    setIngredientSupplierName,
    purchasePriceInputValue,
    handlePurchasePriceFocus,
    handlePurchasePriceChange,
    handlePurchasePriceBlur,
    purchaseUnitOptions,
    sizeUnitOptions,
    housePrepRecipes,
    formatDisplayCostPerUnit,
    openRecipeView,
  } = props;

  const supplierLineSummary = getIngredientSummaryDisplay(ingredientForm);

  return (
      <div style={styles.pageWrapper}>
        <div style={styles.pageHeader}>
          {ingredientForm.id || showSupplierLineForm ? (
            <button type="button" style={styles.secondaryButton} onClick={clearIngredientForm}>← Back to Inventory List</button>
          ) : null}
          <h1 style={styles.pageTitle}>Inventory / Ordering</h1>
          <p style={styles.pageSubtitle}>
            Fast ordering for busy kitchens. Set pars, rough counts, and get suggested orders without the spreadsheet migraine.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.recipeToolbar}>
            <div style={styles.recipeToolbarLeft}>
              <h2 style={styles.sectionTitle}>Supplier Pricebook</h2>
              <div style={styles.recipeToolbarSubtitle}>
                Enter, view, and edit supplier lines in one proper buying register instead of hunting through the joint.
              </div>
            </div>
            <div style={styles.recipeToolbarRight}>
              <button type="button" style={styles.primaryButton} onClick={startNewSupplierLine}>
                {showSupplierLineForm ? "Supplier Form Open" : "Add Supplier Line"}
              </button>
            </div>
          </div>

          {showSupplierLineForm ? (
            <div style={styles.cardInset}>
              <h3 style={styles.sectionTitleSmall}>{ingredientForm.id ? "Fix Supplier Line" : "Add Supplier Line"}</h3>

              <form onSubmit={saveIngredient} style={styles.formWrapper}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Supplier Name</label>
                    <input
                      type="text"
                      value={ingredientForm.supplierName}
                      onChange={(event: any) => {
                        handleIngredientFormChange("supplierName", event.target.value);
                        setIngredientSupplierName(event.target.value);
                      }}
                      style={styles.input}
                      placeholder="e.g. Bidfood"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Item / Product Name</label>
                    <input
                      type="text"
                      value={ingredientForm.name}
                      onChange={(event: any) => handleIngredientFormChange("name", event.target.value)}
                      style={styles.input}
                      placeholder="e.g. Chips 9mm"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Pack Cost</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={purchasePriceInputValue}
                      onFocus={handlePurchasePriceFocus}
                      onChange={(event: any) => handlePurchasePriceChange(event.target.value)}
                      onBlur={handlePurchasePriceBlur}
                      style={styles.input}
                      placeholder="e.g. 48"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Pack Unit</label>
                    <select
                      value={ingredientForm.purchaseUnit}
                      onChange={(event: any) => handleIngredientFormChange("purchaseUnit", event.target.value)}
                      style={styles.select}
                    >
                      {purchaseUnitOptions.map((option: any) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Items in Pack</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ingredientForm.amountInPurchaseUnit}
                      onChange={(event: any) => handleIngredientFormChange("amountInPurchaseUnit", event.target.value)}
                      style={styles.input}
                      placeholder="e.g. 12"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Unit Size</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ingredientForm.sizePerItem}
                      onChange={(event: any) => handleIngredientFormChange("sizePerItem", event.target.value)}
                      style={styles.input}
                      placeholder="e.g. 1"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Size Unit</label>
                    <select
                      value={ingredientForm.sizeUnit}
                      onChange={(event: any) => handleIngredientFormChange("sizeUnit", event.target.value)}
                      style={styles.select}
                    >
                      {sizeUnitOptions.map((option: any) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={styles.summaryBar}>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Supplier</div>
                    <div style={styles.summaryValue}>{ingredientForm.supplierName || "Not entered yet"}</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Pack Cost</div>
                    <div style={styles.summaryValue}>{formatCurrency(ingredientForm.purchasePrice)}</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Pack Size</div>
                    <div style={styles.summaryValue}>
                      {roundTo(ingredientForm.amountInPurchaseUnit, 2)} x {roundTo(ingredientForm.sizePerItem, 2)} {ingredientForm.sizeUnit}
                    </div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>{supplierLineSummary.displayCostLabel}</div>
                    <div style={styles.summaryValue}>{supplierLineSummary.visibleCost}</div>
                  </div>
                </div>

                <div style={styles.buttonRow}>
                  <button type="submit" style={styles.primaryButton}>
                    {ingredientForm.id ? "Fix It" : "Lock It In"}
                  </button>
                  <button type="button" style={styles.secondaryButton} onClick={clearIngredientForm}>
                    Clear
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {supplierGroupedRegister.length === 0 ? (
            <div style={styles.emptyState}>No supplier lines yet. Add the goods before the GP goes missing.</div>
          ) : (
            <div style={styles.sectionGroupStack}>
              {supplierGroupedRegister.map((group: any) => (
                <div key={group.supplierName} style={styles.sectionGroupCard}>
                  <div style={styles.sectionGroupHeaderRow}>
                    <h3 style={styles.sectionGroupTitle}>{group.supplierName}</h3>
                    <div style={styles.sectionGroupSubtotal}>{group.items.length} line{group.items.length === 1 ? "" : "s"}</div>
                  </div>

                  <div style={styles.recipeFolderList}>
                    {group.items.map((row: any) => {
                      const summary = getIngredientSummaryDisplay(row.ingredient);

                      return (
                        <div key={`register_${row.ingredientId}`} style={styles.recipeFolderRow}>
                          <div style={styles.recipeFolderMeta}>
                            <div style={styles.recipeFolderName}>{row.ingredientName}</div>
                            <div style={styles.recipeFolderSubtext}>
                              {formatCurrency(row.purchasePrice)} per {row.purchaseUnit}
                            </div>

                            <div style={styles.recipeFolderStats}>
                              <div style={styles.recipeFolderStat}>
                                Pack Size: {roundTo(row.ingredient.amountInPurchaseUnit, 2)} x {roundTo(row.ingredient.sizePerItem, 2)} {row.ingredient.sizeUnit}
                              </div>
                              <div style={styles.recipeFolderStat}>Usable Cost: {summary.visibleCost}</div>
                              <div style={styles.recipeFolderStat}>Linked Ingredient: {row.ingredientName}</div>
                            </div>
                          </div>

                          <div style={styles.recipeFolderActions}>
                            <button type="button" style={styles.smallButton} onClick={() => editIngredient(row.ingredient)}>
                              Edit
                            </button>
                            <button type="button" style={styles.smallDangerButton} onClick={() => deleteIngredient(row.ingredientId)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.dashboardGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Supplier Lines</div>
            <div style={styles.metricValue}>{orderingRows.length}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Below Par</div>
            <div style={styles.metricValue}>{lowStockCount}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Estimated Order Spend</div>
            <div style={styles.metricValue}>{formatCurrency(estimatedOrderSpend)}</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.recipeToolbar}>
            <div style={styles.recipeToolbarLeft}>
              <h2 style={styles.sectionTitle}>Order Builder</h2>
              <div style={styles.recipeToolbarSubtitle}>Update on-hand and par in purchase units. Suggested order updates instantly.</div>
            </div>
            <div style={styles.recipeToolbarRight}>
              <div style={styles.recipeSearchWrap}>
                <input
                  type="text"
                  value={orderingSearchTerm}
                  onChange={(event: any) => setOrderingSearchTerm(event.target.value)}
                  style={styles.input}
                  placeholder="Search supplier lines or suppliers..."
                />
              </div>
              <button
                type="button"
                style={showLowStockOnly ? styles.primaryButton : styles.secondaryButton}
                onClick={() => setShowLowStockOnly((previous: any) => !previous)}
              >
                {showLowStockOnly ? "Showing Below Par" : "Show Below Par Only"}
              </button>
            </div>
          </div>

          {groupedOrderingRows.length === 0 ? (
            <div style={styles.emptyState}>Nothing matches that search. Either you're dialled in or the filters are acting like cops.</div>
          ) : (
            <div style={styles.orderingSupplierList}>
              {groupedOrderingRows.map((group: any) => (
                <div key={group.supplierName} style={styles.orderingSupplierCard}>
                  <div style={styles.orderingSupplierHeader}>
                    <div>
                      <div style={styles.orderingSupplierName}>{group.supplierName}</div>
                      <div style={styles.infoCardSubtext}>{group.items.length} lines • Suggested spend {formatCurrency(group.supplierTotal)}</div>
                    </div>
                  </div>

                  <div style={styles.orderingRowList}>
                    {group.items.map((row: any) => (
                      <div key={row.ingredientId} style={styles.orderingRowCard}>
                        <div style={styles.orderingRowMain}>
                          <div style={styles.orderingIngredientName}>{row.ingredientName}</div>
                          <div style={styles.orderingIngredientMeta}>Last Price: {formatCurrency(row.purchasePrice)} per {row.purchaseUnit}</div>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>Supplier</label>
                          <input
                            type="text"
                            value={row.supplierName === "Unassigned Supplier" ? "" : row.supplierName}
                            onChange={(event: any) => updateOrderingMetaField(row.ingredientId, "supplierName", event.target.value)}
                            style={styles.input}
                            placeholder="e.g. Bidfood"
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>On Hand ({row.purchaseUnit})</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={orderingMeta[row.ingredientId]?.onHand ?? ""}
                            onChange={(event: any) => updateOrderingMetaField(row.ingredientId, "onHand", event.target.value)}
                            style={styles.input}
                            placeholder="e.g. 0.5"
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>Par ({row.purchaseUnit})</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={orderingMeta[row.ingredientId]?.parLevel ?? ""}
                            onChange={(event: any) => updateOrderingMetaField(row.ingredientId, "parLevel", event.target.value)}
                            style={styles.input}
                            placeholder="e.g. 2"
                          />
                        </div>

                        <div style={styles.orderingSuggestionCard}>
                          <div style={styles.orderingSuggestionLabel}>Suggested Order</div>
                          <div style={styles.orderingSuggestionValue}>{roundTo(row.suggestedOrder, 2)} {row.purchaseUnit}</div>
                          <div style={styles.orderingSuggestionCost}>{formatCurrency(row.estimatedOrderCost)}</div>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>Quick Order Note</label>
                          <input
                            type="text"
                            value={orderingMeta[row.ingredientId]?.orderNote ?? ""}
                            onChange={(event: any) => updateOrderingMetaField(row.ingredientId, "orderNote", event.target.value)}
                            style={styles.input}
                            placeholder="e.g. only if promo unavailable"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.dashboardTwoColumnGrid}>
          <div style={styles.card}>
            <div style={styles.dashboardSectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Suggested Order Snapshot</h2>
                <p style={styles.sectionSubtitle}>Only items currently below par, grouped for a fast order pass.</p>
              </div>
            </div>
            {orderingRows.filter((row: any) => row.suggestedOrder > 0).length === 0 ? (
              <div style={styles.successStatePanel}>
                <div style={styles.successStateTitle}>Everything is at or above par</div>
                <div style={styles.successStateText}>Nothing needs ordering right now. Either you're organised or no one counted properly.</div>
              </div>
            ) : (
              <div style={styles.orderSummaryList}>
                {orderingRows
                  .filter((row: any) => row.suggestedOrder > 0)
                  .sort((a: any, b: any) => a.supplierName.localeCompare(b.supplierName) || a.ingredientName.localeCompare(b.ingredientName))
                  .map((row: any) => (
                    <div key={`summary_${row.ingredientId}`} style={styles.orderSummaryItem}>
                      <div>
                        <div style={styles.orderSummaryName}>{row.ingredientName}</div>
                        <div style={styles.orderSummaryMeta}>{row.supplierName}</div>
                      </div>
                      <div style={styles.orderSummaryQty}>{roundTo(row.suggestedOrder, 2)} {row.purchaseUnit}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div style={styles.card}>
            <div style={styles.dashboardSectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>House Prep Snapshot</h2>
                <p style={styles.sectionSubtitle}>Quick access to ingredient prep recipes without digging through the whole joint.</p>
              </div>
            </div>
            {housePrepRecipes.length === 0 ? (
              <div style={styles.emptyStatePanel}>
                <div style={styles.emptyStateTitle}>No ingredient prep recipes yet</div>
                <div style={styles.emptyStateText}>Create ingredient prep recipes to tighten internal prep tracking.</div>
              </div>
            ) : (
              <div style={styles.cardGrid}>
                {housePrepRecipes.map((recipe: any) => (
                  <div key={recipe.id} style={styles.infoCard}>
                    <div style={styles.infoCardTitle}>{recipe.name}</div>
                    <div style={styles.infoCardText}>Yield: {roundTo(recipe.yieldAmount, 2)} {recipe.yieldUnit}</div>
                    <div style={styles.infoCardText}>Total Cost: {formatCurrency(recipe.totalCost)}</div>
                    <div style={styles.infoCardText}>Cost / Unit: {formatDisplayCostPerUnit(recipe.baseUnit, recipe.costPerBaseUnit)}</div>
                    <div style={styles.buttonRow}>
                      <button type="button" style={styles.smallButton} onClick={() => openRecipeView(recipe.id)}>
                        View Recipe
                      </button>
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
