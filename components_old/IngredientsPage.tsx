import React, { type CSSProperties } from "react";

type IngredientsPageProps = {
  styles: Record<string, CSSProperties>;
  ingredientForm: any;
  supplierDirectory: any[];
  purchasePriceInputValue: string;
  purchaseUnitOptions: string[];
  sizeUnitOptions: string[];
  supplierIngredients: any[];
  handleIngredientFormChange: (field: string, value: any) => void;
  setIngredientSupplierName: (name: string) => void;
  handlePurchasePriceFocus: () => void;
  handlePurchasePriceChange: (value: string) => void;
  handlePurchasePriceBlur: () => void;
  saveIngredient: (event: any) => void;
  clearIngredientForm: () => void;
  formatCurrency: (value: any) => string;
  roundTo: (value: any, decimals?: number) => number;
  getIngredientSummaryDisplay: (ingredient: any) => any;
  editIngredient: (ingredient: any) => void;
  deleteIngredient: (ingredientId: string) => void;
};

export function IngredientsPage({
  styles,
  ingredientForm,
  supplierDirectory,
  purchasePriceInputValue,
  purchaseUnitOptions,
  sizeUnitOptions,
  supplierIngredients,
  handleIngredientFormChange,
  setIngredientSupplierName,
  handlePurchasePriceFocus,
  handlePurchasePriceChange,
  handlePurchasePriceBlur,
  saveIngredient,
  clearIngredientForm,
  formatCurrency,
  roundTo,
  getIngredientSummaryDisplay,  editIngredient,
  deleteIngredient,}: IngredientsPageProps) {
  const formDerived = getIngredientSummaryDisplay(ingredientForm);

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Manage Ingredients</h1>
        <p style={styles.pageSubtitle}>
          Lock in supplier pricing, base-unit costs, and stop pretending a carton costs whatever feels right.
        </p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          {ingredientForm.id ? "Fix Supplier Ingredient" : "Add Supplier Ingredient"}
        </h2>

        <form onSubmit={saveIngredient} style={styles.formWrapper}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Ingredient Name</label>
              <input
                type="text"
                value={ingredientForm.name}
                onChange={(event: any) => handleIngredientFormChange("name", event.target.value)}
                style={styles.input}
                placeholder="e.g. Chips"
              />
            </div>

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
                list="supplier-name-options"
              />
              <datalist id="supplier-name-options">
                {supplierDirectory.map((supplier: any) => (
                  <option key={supplier.id} value={supplier.name} />
                ))}
              </datalist>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Purchase Price</label>
              <input
                type="text"
                inputMode="decimal"
                value={purchasePriceInputValue}
                onFocus={handlePurchasePriceFocus}
                onChange={(event: any) => {
                  handlePurchasePriceChange(event.target.value);
                  handleIngredientFormChange("supplierUnitCost", event.target.value.replace(/[^0-9.]/g, ""));
                }}
                onBlur={handlePurchasePriceBlur}
                style={styles.input}
                placeholder="e.g. 48"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Purchase Unit</label>
              <select
                value={ingredientForm.purchaseUnit}
                onChange={(event: any) => handleIngredientFormChange("purchaseUnit", event.target.value)}
                style={styles.select}
              >
                {purchaseUnitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Amount in Purchase Unit</label>
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
              <label style={styles.label}>Supplier Pack Size (base units)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ingredientForm.supplierPackSize}
                onChange={(event: any) => handleIngredientFormChange("supplierPackSize", event.target.value)}
                style={styles.input}
                placeholder="Auto from pack size"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Size per Item</label>
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
                {sizeUnitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.summaryBar}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Purchase Price</div>
              <div style={styles.summaryValue}>{formatCurrency(ingredientForm.purchasePrice)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Total Quantity</div>
              <div style={styles.summaryValue}>{formDerived.visibleQuantity}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>{formDerived.displayCostLabel}</div>
              <div style={styles.summaryValue}>{formDerived.visibleCost}</div>
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

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Saved Supplier Lines</h2>

        {supplierIngredients.length === 0 ? (
          <div style={styles.emptyState}>No ingredients logged — start building your base</div>
        ) : (
          <div style={styles.cardGrid}>
            {supplierIngredients.map((ingredient) => {
              const summary = getIngredientSummaryDisplay(ingredient);

              return (
                <div key={ingredient.id} style={styles.infoCard}>
                  <div style={styles.infoCardHeader}>
                    <div>
                      <div style={styles.infoCardTitle}>{ingredient.name}</div>
                      <div style={styles.infoCardSubtext}>
                        Purchase: {formatCurrency(ingredient.purchasePrice)} per {ingredient.purchaseUnit}
                      </div>
                    </div>
                    <div style={styles.inlineButtonRow}>
                      <button
                        type="button"
                        style={styles.smallButton}
                        onClick={() => editIngredient(ingredient)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={styles.smallDangerButton}
                        onClick={() => deleteIngredient(ingredient.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div style={styles.infoCardText}>Supplier: {ingredient.supplierName || "Not set"}</div>
                  <div style={styles.infoCardText}>
                    Pack Size: {roundTo(ingredient.amountInPurchaseUnit, 2)} x{" "}
                    {roundTo(ingredient.sizePerItem, 2)} {ingredient.sizeUnit}
                  </div>
                  <div style={styles.infoCardText}>
                    Base Quantity: {roundTo(ingredient.baseQuantity || summary.totalQuantity, 2)} {summary.baseUnit}
                  </div>
                  <div style={styles.infoCardText}>Total Quantity: {summary.visibleQuantity}</div>
                  <div style={styles.infoCardText}>{summary.displayCostLabel}</div>
                  <div style={styles.infoCardCostMain}>{summary.visibleCost}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}