export function RecipeBuilderPage(props: any) {
  const {
    styles,
    computedRecipes,
    recipeForm,
    setActiveView,
    recipeImportFileInputRef,
    handleRecipeImportFileUpload,
    recipeImportMessage,
    recipeImportText,
    setRecipeImportText,
    importRecipeFromText,
    clearImportedRecipeReview,
    renderImportedRecipeReview,
    saveRecipe,
    handleRecipeFormChange,
    recipeTypeOptions,
    recipeYieldUnitOptions,
    addRecipeComponent,
    recipeIngredientSearchRef,
    recipeIngredientSearch,
    setRecipeIngredientSearch,
    quickAddIngredientMatches,
    orderingMeta,
    getIngredientSummaryDisplay,
    quickAddSupplierIngredientToRecipe,
    ingredientLookup,
    computedRecipeLookup,
    getCompatibleUnitsForBase,
    componentUnitOptions,
    supplierIngredients,
    updateRecipeComponent,
    buildComponentDetail,
    removeRecipeComponent,
    formatCurrency,
    recipePreview,
    formatDisplayCostPerUnit,
    roundTo,
    safeNumber,
    clearRecipeForm,
  } = props;

    const recipeLinkOptions = computedRecipes.filter((recipe: any) => recipe.id !== recipeForm.id);

    return (
      <div style={styles.pageWrapper}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>{recipeForm.id ? "Fix Recipe" : "Recipe Builder"}</h1>
          <p style={styles.pageSubtitle}>
            Build ingredient prep, batch recipes, and final dishes with linked supplier ingredients and linked recipes.
          </p>
        </div>

        <div style={styles.buttonRow}>
          <button type="button" style={styles.secondaryButton} onClick={() => setActiveView("recipes")}>
            Back to Recipes
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.importCardHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Bring In Recipe</h2>
              <p style={styles.sectionSubtitle}>
                Import a plain text recipe file or paste recipe text from Word, then GP Police drops the name, ingredients, weights, and method into the builder.
              </p>
            </div>
          </div>

          <div style={styles.importActionRow}>
            <input
              ref={recipeImportFileInputRef}
              type="file"
              accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event: any) => handleRecipeImportFileUpload(event.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <button type="button" style={styles.secondaryButton} onClick={() => recipeImportFileInputRef.current?.click()}>
              Bring In Recipe File
            </button>
            <div style={styles.importHelperText}>
              .txt and .docx files can load here. Old .doc files are not supported.
            </div>
          </div>

          {recipeImportMessage ? (
            <div style={styles.emptyState}>{recipeImportMessage}</div>
          ) : null}

          <div style={styles.formGroupFull}>
            <label style={styles.label}>Paste recipe text</label>
            <textarea
              value={recipeImportText}
              onChange={(event: any) => setRecipeImportText(event.target.value)}
              style={styles.textareaTall}
              placeholder={"Example:\nRoast Garlic Aioli\nYield: 1 kg\n\nIngredients\n500 g mayo\n120 g roast garlic\n30 ml lemon juice\n5 g salt\n\nMethod\nBlend until smooth."}
            />
          </div>

          <div style={styles.importActionRow}>
            <button type="button" style={styles.primaryButton} onClick={importRecipeFromText}>
              Bring In Recipe Text
            </button>
            <button type="button" style={styles.secondaryButton} onClick={clearImportedRecipeReview}>
              Clear Import
            </button>
            <div style={styles.importHelperText}>
              Best result: title, yield, ingredients, and method on separate lines. Imports now open in review before saving.
            </div>
          </div>
        </div>

        {renderImportedRecipeReview()}

        <div id="recipe-full-form" style={styles.card}>
          <h2 style={styles.sectionTitle}>{recipeForm.id ? "Fix Recipe" : "Build Recipe"}</h2>

          <form onSubmit={saveRecipe} style={styles.formWrapper}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Recipe Name</label>
                <input
                  type="text"
                  value={recipeForm.name}
                  onChange={(event: any) => handleRecipeFormChange("name", event.target.value)}
                  style={styles.input}
                  placeholder="e.g. Confit Garlic"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Recipe Type</label>
                <select
                  value={recipeForm.recipeType}
                  onChange={(event: any) => handleRecipeFormChange("recipeType", event.target.value)}
                  style={styles.select}
                >
                  {recipeTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <input
                  type="text"
                  value={recipeForm.category}
                  onChange={(event: any) => handleRecipeFormChange("category", event.target.value)}
                  style={styles.input}
                  placeholder="e.g. Sauce, Prep, Main"
                />
              </div>

              <div style={styles.formGroupFull}>
                <label style={styles.label}>Method / Notes</label>
                <textarea
                  value={recipeForm.notes}
                  onChange={(event: any) => handleRecipeFormChange("notes", event.target.value)}
                  style={styles.textarea}
                  placeholder="Add method, prep instructions, plating notes, or kitchen reminders"
                />
              </div>

              {recipeForm.recipeType !== "final dish" && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Yield Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={recipeForm.yieldAmount}
                      onChange={(event: any) => handleRecipeFormChange("yieldAmount", event.target.value)}
                      style={styles.input}
                      placeholder="e.g. 1000"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Yield Unit</label>
                    <select
                      value={recipeForm.yieldUnit}
                      onChange={(event: any) => handleRecipeFormChange("yieldUnit", event.target.value)}
                      style={styles.select}
                    >
                      {recipeYieldUnitOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

            </div>

            <div style={styles.sectionDivider} />

            <div style={styles.componentHeaderRow}>
              <div>
                <h3 style={styles.sectionTitleSmall}>Ingredient Lines</h3>
                <div style={styles.infoCardSubtext}>Costed and ready for the pass.</div>
              </div>
              <button type="button" style={styles.smallButton} onClick={addRecipeComponent}>
                + Add Blank Line
              </button>
            </div>

            <div style={styles.quickAddBox}>
              <div style={styles.formGroupFull}>
                <label style={styles.label}>Quick Add Ingredient</label>
                <input
                  ref={recipeIngredientSearchRef}
                  type="text"
                  value={recipeIngredientSearch}
                  onChange={(event: any) => setRecipeIngredientSearch(event.target.value)}
                  style={styles.input}
                  placeholder="Search supplier ingredients and hit add…"
                />
              </div>

              {recipeIngredientSearch.trim() ? (
                quickAddIngredientMatches.length > 0 ? (
                  <div style={styles.quickAddResults}>
                    {quickAddIngredientMatches.map((ingredient: any) => {
                      const supplierName = String(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim();
                      const ingredientSummary = getIngredientSummaryDisplay(ingredient);

                      return (
                        <button
                          key={ingredient.id}
                          type="button"
                          style={styles.quickAddResultButton}
                          onClick={() => quickAddSupplierIngredientToRecipe(ingredient)}
                        >
                          <div style={styles.quickAddResultMain}>
                            <div style={styles.quickAddResultName}>{ingredient.name || "Unnamed ingredient"}</div>
                            <div style={styles.quickAddResultMeta}>
                              {supplierName || "No supplier saved"}
                            </div>
                          </div>
                          <div style={styles.quickAddResultCost}>{ingredientSummary.visibleCost}</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={styles.emptyState}>No match found. Add it in Manage Ingredients first.</div>
                )
              ) : null}
            </div>

            {recipeForm.components.length === 0 ? (
              <div style={styles.emptyState}>No ingredient lines added yet.</div>
            ) : (
              <div style={styles.componentList}>
                {recipeForm.components.map((component: any) => {
                  const linkedRecipe =
                    component.componentType === "supplier" ? null : computedRecipeLookup[component.linkedId];
                  const linkedIngredient =
                    component.componentType === "supplier" ? ingredientLookup[component.linkedId] : null;
                  const compatibleUnits =
                    component.componentType === "supplier"
                      ? linkedIngredient
                        ? getCompatibleUnitsForBase(linkedIngredient.baseUnit)
                        : componentUnitOptions
                      : linkedRecipe
                      ? getCompatibleUnitsForBase(linkedRecipe.baseUnit)
                      : componentUnitOptions;

                  const componentPreview = buildComponentDetail(component, ingredientLookup, computedRecipeLookup);

                  return (
                    <div key={component.id} style={styles.componentRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Type</label>
                        <select
                          value={component.componentType}
                          onChange={(event: any) => {
                            const nextType = event.target.value;
                            updateRecipeComponent(component.id, "componentType", nextType);
                            updateRecipeComponent(component.id, "linkedId", "");
                            updateRecipeComponent(component.id, "unit", "g");
                          }}
                          style={styles.select}
                        >
                          <option value="supplier">Supplier Ingredient</option>
                          <option value="prep">Ingredient Prep Recipe</option>
                          <option value="batch">Batch Recipe</option>
                        </select>
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          {component.componentType === "supplier" ? "Ingredient" : "Linked Recipe"}
                        </label>

                        {component.componentType === "supplier" ? (
                          <div style={styles.supplierComponentStack}>
                            <select
                              value={component.linkedId}
                              onChange={(event: any) => updateRecipeComponent(component.id, "linkedId", event.target.value)}
                              style={styles.select}
                            >
                              <option value="">Search/select ingredient</option>
                              {supplierIngredients
                                .slice()
                                .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")))
                                .map((ingredient: any) => {
                                  const supplierName = String(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim();
                                  return (
                                    <option key={ingredient.id} value={ingredient.id}>
                                      {supplierName ? `${ingredient.name} • ${supplierName}` : ingredient.name}
                                    </option>
                                  );
                                })}
                            </select>
                            {component.importedName && !component.linkedId ? (
                              <div style={styles.importHelperText}>Imported as: {component.importedName}</div>
                            ) : null}
                          </div>
                        ) : (
                          <select
                            value={component.linkedId}
                            onChange={(event: any) => updateRecipeComponent(component.id, "linkedId", event.target.value)}
                            style={styles.select}
                          >
                            <option value="">Select linked recipe</option>
                            {recipeLinkOptions
                              .filter((recipe: any) =>
                                component.componentType === "prep"
                                  ? recipe.recipeType === "ingredient prep"
                                  : recipe.recipeType === "batch recipe" || recipe.recipeType === "ingredient prep"
                              )
                              .map((recipe: any) => (
                                <option key={recipe.id} value={recipe.id}>
                                  {recipe.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>Quantity</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={component.quantity}
                          onChange={(event: any) => updateRecipeComponent(component.id, "quantity", event.target.value)}
                          style={styles.input}
                          placeholder="e.g. 250"
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>Unit</label>
                        <select
                          value={component.unit}
                          onChange={(event: any) => updateRecipeComponent(component.id, "unit", event.target.value)}
                          style={styles.select}
                        >
                          {compatibleUnits.map((unit: string) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>Section</label>
                        <input
                          type="text"
                          value={component.section || "Main"}
                          onChange={(event: any) => updateRecipeComponent(component.id, "section", event.target.value)}
                          style={styles.input}
                          placeholder="e.g. Sauce, Protein, Garnish"
                        />
                      </div>

                      <div style={styles.formGroupButton}>
                        <button
                          type="button"
                          style={styles.smallDangerButton}
                          onClick={() => removeRecipeComponent(component.id)}
                        >
                          Remove
                        </button>
                      </div>

                      <div style={styles.componentCostNote}>
                        <div style={styles.componentCostLabel}>Line Cost</div>
                        <div style={styles.componentCostValue}>{formatCurrency(componentPreview.lineCost)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.summaryBar}>
              {recipeForm.recipeType !== "final dish" ? (
                <>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Total Cost</div>
                    <div style={styles.summaryValue}>{formatCurrency(recipePreview.totalCost)}</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Cost Per Unit</div>
                    <div style={styles.summaryValue}>
                      {formatDisplayCostPerUnit(recipePreview.baseUnit, recipePreview.costPerBaseUnit)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Dish cost</div>
                    <div style={styles.summaryValue}>{formatCurrency(recipePreview.totalCost)}</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Cost per plate</div>
                    <div style={styles.summaryValue}>{formatCurrency(recipePreview.costPerPortion)}</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Food Cost %</div>
                    <div style={styles.summaryValue}>{roundTo(recipePreview.foodCostPercent, 2)}%</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Gross Profit %</div>
                    <div style={styles.summaryValue}>{roundTo(recipePreview.grossProfitPercent, 2)}%</div>
                  </div>
                </>
              )}
            </div>

            {recipeForm.recipeType === "final dish" && (
              <div
                style={{
                  ...styles.pricingGuidanceBox,
                  ...(recipePreview.isSellPriceBelowRecommendation ? styles.pricingGuidanceBoxWarning : {}),
                }}
              >
                <div style={styles.pricingGuidanceHeader}>
                  <div>
                    <div style={styles.summaryLabel}>Pricing &amp; GP Check</div>
                    <div style={styles.pricingGuidanceTitle}>Costed from ingredient lines</div>
                  </div>
                  <div style={styles.pricingGuidanceBadge}>Target COGS {recipePreview.targetCogsPercent}% • Target GP {recipePreview.targetGpPercent}%</div>
                </div>

                <div style={styles.pricingGuidanceGrid}>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Total dish cost</div>
                    <div style={styles.summaryValue}>{formatCurrency(recipePreview.totalCost)}</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Recommended COGS</div>
                    <div style={styles.summaryValue}>{recipePreview.targetCogsPercent.toFixed(1)}%</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Recommended GP</div>
                    <div style={styles.summaryValue}>{recipePreview.targetGpPercent.toFixed(1)}%</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Recommended sell price</div>
                    <div style={styles.summaryValue}>{formatCurrency(recipePreview.recommendedSellPrice)}</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <label style={styles.summaryLabel}>Chosen sell price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={recipeForm.sellPrice}
                      onChange={(event: any) => handleRecipeFormChange("sellPrice", event.target.value)}
                      style={styles.pricingInput}
                      placeholder={recipePreview.recommendedSellPrice > 0 ? roundTo(recipePreview.recommendedSellPrice, 2).toString() : "e.g. 32"}
                    />
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Current COGS</div>
                    <div style={styles.summaryValue}>{safeNumber(recipeForm.sellPrice) > 0 ? `${roundTo(recipePreview.foodCostPercent, 1)}%` : "—"}</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Current GP</div>
                    <div style={styles.summaryValue}>{safeNumber(recipeForm.sellPrice) > 0 ? `${roundTo(recipePreview.grossProfitPercent, 1)}%` : "—"}</div>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.pricingGuidanceMessage,
                    ...(recipePreview.isSellPriceBelowRecommendation ? styles.pricingGuidanceMessageWarning : {}),
                  }}
                >
                  {safeNumber(recipeForm.sellPrice) <= 0
                    ? "Recommended price is ready. Pick your sell price when the dish is costed properly."
                    : recipePreview.isSellPriceBelowRecommendation
                    ? "⚠️ Change this price to stay in a job before you have to resort to crime."
                    : "GP looking clean. The food cost police are off your back."}
                </div>
              </div>
            )}

            <div style={styles.buttonRow}>
              <button type="submit" style={styles.primaryButton}>
                {recipeForm.id ? "Fix It" : "Lock It In"}
              </button>
              <button type="button" style={styles.secondaryButton} onClick={clearRecipeForm}>
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  
}
