export function ImportedRecipeReviewPage(props: any) {
  const {
    styles,
    importedRecipeDraft,
    recipeImportMessage,
    setRecipeImportMessage,
    handleImportRecipeConfirm,
    handleCancelImport,
    formatCurrency,
    roundTo,
    matchedCount,
    ignoredCount,
    attentionCount,
    activeLineCount,
    saveImportedRecipeDraft,
    editImportedRecipeInFullForm,
    clearImportedRecipeReview,
    updateImportedRecipeDraftField,
    updateImportedRecipeDraftLine,
    ignoreImportedRecipeDraftLine,
    normalizeImportedRecipeType,
    recipeYieldUnitOptions,
    importedRecipeUnitOptions,
    supplierIngredients,
    orderingMeta,
  } = props;

  return (
    <div style={styles.card}>
      <div style={styles.importCardHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Review Imported Recipe</h2>
          <p style={styles.sectionSubtitle}>Recipe imported. Check the lines below, then save.</p>
        </div>
        <div style={styles.inlineButtonRow}>
          <button type="button" style={styles.primaryButton} onClick={handleImportRecipeConfirm || saveImportedRecipeDraft}>
            Lock It In
          </button>
          <button type="button" style={styles.secondaryButton} onClick={editImportedRecipeInFullForm}>
            Edit in Full Form
          </button>
          <button type="button" style={styles.smallDangerButton} onClick={handleCancelImport || clearImportedRecipeReview}>
            Clear Import
          </button>
        </div>
      </div>

      {recipeImportMessage ? <div style={styles.infoCardText}>{recipeImportMessage}</div> : null}

      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Recipe Name</label>
          <input
            type="text"
            value={importedRecipeDraft.name}
            onChange={(event: any) => updateImportedRecipeDraftField("name", event.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Recipe Type</label>
          <select
            value={importedRecipeDraft.type}
            onChange={(event: any) => updateImportedRecipeDraftField("type", event.target.value)}
            style={styles.select}
          >
            <option value="ingredient_prep">ingredient prep</option>
            <option value="batch_recipe">batch recipe</option>
            <option value="final_dish">final dish</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Category</label>
          <input
            type="text"
            value={importedRecipeDraft.category}
            onChange={(event: any) => updateImportedRecipeDraftField("category", event.target.value)}
            style={styles.input}
            placeholder="e.g. Sauce, Prep, Main"
          />
        </div>

        {normalizeImportedRecipeType(importedRecipeDraft.type) !== "final dish" ? (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label}>Yield Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={importedRecipeDraft.yieldAmount}
                onChange={(event: any) => updateImportedRecipeDraftField("yieldAmount", event.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Yield Unit</label>
              <select
                value={importedRecipeDraft.yieldUnit}
                onChange={(event: any) => updateImportedRecipeDraftField("yieldUnit", event.target.value)}
                style={styles.select}
              >
                {recipeYieldUnitOptions.map((option: any) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        <div style={styles.formGroupFull}>
          <label style={styles.label}>Method / Notes</label>
          <textarea
            value={importedRecipeDraft.method}
            onChange={(event: any) => updateImportedRecipeDraftField("method", event.target.value)}
            style={styles.textarea}
          />
        </div>
      </div>

      <div style={styles.summaryBar}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>Ingredient Lines</div>
          <div style={styles.summaryValue}>{activeLineCount}</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>Matched</div>
          <div style={styles.summaryValue}>{matchedCount}</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>Needs Attention</div>
          <div style={styles.summaryValue}>{attentionCount}</div>
        </div>
      </div>

      <div style={styles.componentList}>
        {importedRecipeDraft.lines.map((line: any) => {
          const lineStatusText =
            line.status === "ignored"
              ? "Ignored"
              : line.status === "matched"
              ? "Matched"
              : line.status === "needs_qty"
              ? "Needs quantity"
              : "Needs match";

          return (
            <div key={line.id} style={{ ...styles.componentRow, opacity: line.status === "ignored" ? 0.55 : 1 }}>
              <div style={styles.formGroupFull}>
                <div style={styles.infoCardSubtext}>Raw line: {line.rawText || "No raw line saved"}</div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Ingredient</label>
                <input
                  type="text"
                  value={line.ingredientName}
                  onChange={(event: any) => updateImportedRecipeDraftLine(line.id, "ingredientName", event.target.value)}
                  style={styles.input}
                  placeholder="Parsed ingredient name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Match</label>
                <select
                  value={line.matchedIngredientId || ""}
                  onChange={(event: any) => updateImportedRecipeDraftLine(line.id, "matchedIngredientId", event.target.value)}
                  style={styles.select}
                >
                  <option value="">Needs match</option>
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
                <div style={styles.importHelperText}>{lineStatusText}</div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.quantity}
                  onChange={(event: any) => updateImportedRecipeDraftLine(line.id, "quantity", event.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Unit</label>
                <select
                  value={line.unit}
                  onChange={(event: any) => updateImportedRecipeDraftLine(line.id, "unit", event.target.value)}
                  style={styles.select}
                >
                  {importedRecipeUnitOptions.map((unit: any) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroupButton}>
                <button type="button" style={line.status === "ignored" ? styles.smallButton : styles.smallDangerButton} onClick={() => ignoreImportedRecipeDraftLine(line.id)}>
                  {line.status === "ignored" ? "Use Line" : "Ignore Line"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
