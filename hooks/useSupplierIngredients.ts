import { useEffect, useMemo, useState, type FormEvent } from "react";
import { STORAGE_KEYS, defaultIngredientForm, defaultSupplierForm } from "../lib/gpPoliceConstants";
import {
  formatCurrencyInputDisplay,
  formatRawNumericInput,
  safeNumber,
  toBaseUnit,
  unitTypeFromUnit,
} from "../lib/gpPoliceHelpers";
import { safeSetLocalStorageValue } from "../lib/storageHelpers";

type UseSupplierIngredientsArgs = {
  supplierIngredients: any[];
  setSupplierIngredients: (value: any) => void;
  recipes: any[];
  suppliers: any[];
  setSuppliers: (value: any) => void;
  orderingMeta: Record<string, any>;
  setOrderingMeta: (value: any) => void;
  createEmergencyBackupSnapshot: (reason?: string) => any;
  setActiveView: (value: any) => void;
};

function normaliseSupplierRecord(record: any) {
  return {
    ...defaultSupplierForm,
    ...(record || {}),
    id: record?.id || `supplier_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: String(record?.name || "").trim(),
    orderingDays: Array.isArray(record?.orderingDays) ? record.orderingDays : [],
    deliveryDays: Array.isArray(record?.deliveryDays) ? record.deliveryDays : [],
  };
}

export function useSupplierIngredients(args: UseSupplierIngredientsArgs) {
  const {
    supplierIngredients,
    setSupplierIngredients,
    recipes,
    suppliers,
    setSuppliers,
    orderingMeta,
    setOrderingMeta,
    createEmergencyBackupSnapshot,
    setActiveView,
  } = args;

  const [ingredientForm, setIngredientForm] = useState<any>(defaultIngredientForm);
  const [purchasePriceInputValue, setPurchasePriceInputValue] = useState("");
  const [isPurchasePriceFocused, setIsPurchasePriceFocused] = useState(false);
  const [ingredientSupplierName, setIngredientSupplierName] = useState("");
  const [showSupplierLineForm, setShowSupplierLineForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState<any>(defaultSupplierForm);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [supplierMessage, setSupplierMessage] = useState("");

  useEffect(() => {
    if (isPurchasePriceFocused) return;
    setPurchasePriceInputValue(formatCurrencyInputDisplay(ingredientForm.purchasePrice));
  }, [ingredientForm.purchasePrice, isPurchasePriceFocused]);

  useEffect(() => {
    if (!ingredientForm.id) return;
    const matchedIngredient = supplierIngredients.find((item: any) => item.id === ingredientForm.id);
    setIngredientSupplierName(matchedIngredient?.supplierName || orderingMeta[ingredientForm.id]?.supplierName || "");
  }, [ingredientForm.id, orderingMeta, supplierIngredients]);

  const supplierDirectory = useMemo(() => {
    const linkedNames = Array.from<string>(
      new Set<string>(
        supplierIngredients
          .map((ingredient: any) => String(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim())
          .filter(Boolean)
      )
    );

    const stored = suppliers.map(normaliseSupplierRecord).filter((supplier: any) => supplier.name);
    const storedNameSet = new Set(stored.map((supplier: any) => supplier.name.toLowerCase()));
    const virtual = linkedNames
      .filter((name) => !storedNameSet.has(name.toLowerCase()))
      .map((name) => ({
        ...defaultSupplierForm,
        id: `virtual_supplier_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        name,
        isVirtual: true,
      }));

    return [...stored, ...virtual].sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [orderingMeta, supplierIngredients, suppliers]);

  const filteredSupplierDirectory = useMemo(() => {
    const search = supplierSearchTerm.trim().toLowerCase();
    if (!search) return supplierDirectory;
    return supplierDirectory.filter((supplier: any) => {
      const haystack = [supplier.name, supplier.contactName, supplier.phone, supplier.email, supplier.repName, supplier.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [supplierDirectory, supplierSearchTerm]);

  const selectedSupplier = useMemo(() => {
    if (!selectedSupplierId) return null;
    return supplierDirectory.find((supplier: any) => supplier.id === selectedSupplierId) || null;
  }, [selectedSupplierId, supplierDirectory]);

  const selectedSupplierIngredients = useMemo(() => {
    if (!selectedSupplier?.name) return [];
    return supplierIngredients
      .filter((ingredient: any) => String(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim() === selectedSupplier.name)
      .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [orderingMeta, selectedSupplier, supplierIngredients]);

  const handleIngredientFormChange = (field: string, value: any) => {
    setIngredientForm((previous: any) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handlePurchasePriceFocus = () => {
    setIsPurchasePriceFocused(true);
    setPurchasePriceInputValue(formatRawNumericInput(ingredientForm.purchasePrice));
  };

  const handlePurchasePriceChange = (value: string) => {
    if (value === "") {
      setPurchasePriceInputValue("");
      setIngredientForm((previous: any) => ({
        ...previous,
        purchasePrice: "",
      }));
      return;
    }

    const cleanedValue = value.replace(/[^0-9.]/g, "");
    const decimalParts = cleanedValue.split(".");
    const normalizedValue =
      decimalParts.length > 2
        ? `${decimalParts[0]}.${decimalParts.slice(1).join("")}`
        : cleanedValue;

    setPurchasePriceInputValue(normalizedValue);

    const parsed = parseFloat(normalizedValue);
    setIngredientForm((previous: any) => ({
      ...previous,
      purchasePrice: Number.isFinite(parsed) ? parsed : previous.purchasePrice === "" ? "" : previous.purchasePrice,
    }));
  };

  const handlePurchasePriceBlur = () => {
    setIsPurchasePriceFocused(false);

    if (purchasePriceInputValue === "") {
      setIngredientForm((previous: any) => ({
        ...previous,
        purchasePrice: "",
      }));
      setPurchasePriceInputValue("");
      return;
    }

    const parsed = parseFloat(purchasePriceInputValue);

    if (!Number.isFinite(parsed)) {
      setIngredientForm((previous: any) => ({
        ...previous,
        purchasePrice: "",
      }));
      setPurchasePriceInputValue("");
      return;
    }

    setIngredientForm((previous: any) => ({
      ...previous,
      purchasePrice: parsed,
    }));
    setPurchasePriceInputValue(`$${parsed.toFixed(2)}`);
  };

  const clearIngredientForm = () => {
    if (
      ingredientForm.name ||
      ingredientForm.purchasePrice ||
      ingredientForm.amountInPurchaseUnit ||
      ingredientForm.sizePerItem ||
      ingredientSupplierName ||
      ingredientForm.supplierUnitCost ||
      ingredientForm.supplierPackSize
    ) {
      const confirmed = window.confirm("Clear this ingredient form? Say goodbye to the evidence?");
      if (!confirmed) return;
    }
    setIngredientForm(defaultIngredientForm);
    setIngredientSupplierName("");
    setPurchasePriceInputValue("");
    setIsPurchasePriceFocused(false);
  };

  const saveIngredient = (event: FormEvent) => {
    event.preventDefault();

    const supplierName = String(ingredientForm.supplierName || ingredientSupplierName || "").trim();

    if (!supplierName) {
      window.alert("Add the supplier name first. We need to know who sent the bill, mate.");
      return;
    }

    if (!ingredientForm.name.trim()) {
      window.alert("Give the ingredient a name, mate. Hard to cost mystery stock.");
      return;
    }

    if (safeNumber(ingredientForm.purchasePrice) <= 0) {
      window.alert("Put a real price in. This is GP Police App, not guess police.");
      return;
    }

    if (safeNumber(ingredientForm.amountInPurchaseUnit) <= 0) {
      window.alert("Put in a real pack amount. We are costing stock, not daydreams.");
      return;
    }

    if (safeNumber(ingredientForm.sizePerItem) <= 0) {
      window.alert("Chuck in a real item size so the maths stops throwing hands.");
      return;
    }

    const baseQuantity = toBaseUnit(
      safeNumber(ingredientForm.amountInPurchaseUnit) * safeNumber(ingredientForm.sizePerItem),
      ingredientForm.sizeUnit
    );

    const payload = {
      ...ingredientForm,
      id: ingredientForm.id || `ingredient_${Date.now()}`,
      name: ingredientForm.name.trim(),
      purchasePrice: safeNumber(ingredientForm.purchasePrice),
      amountInPurchaseUnit: safeNumber(ingredientForm.amountInPurchaseUnit),
      sizePerItem: safeNumber(ingredientForm.sizePerItem),
      supplierName,
      supplierUnitCost:
        safeNumber(ingredientForm.supplierUnitCost) > 0
          ? safeNumber(ingredientForm.supplierUnitCost)
          : safeNumber(ingredientForm.purchasePrice),
      supplierPackSize:
        safeNumber(ingredientForm.supplierPackSize) > 0
          ? safeNumber(ingredientForm.supplierPackSize)
          : baseQuantity,
      unitType: unitTypeFromUnit(ingredientForm.sizeUnit),
      baseQuantity,
    };

    createEmergencyBackupSnapshot("save_ingredient");

    setSupplierIngredients((previous: any[]) => {
      const nextIngredients = ingredientForm.id
        ? previous.map((item: any) => (item.id === ingredientForm.id ? payload : item))
        : [...previous, payload];

      try {
        safeSetLocalStorageValue(STORAGE_KEYS.INGREDIENTS, nextIngredients);
      } catch (error) {
        console.warn("GP Police immediate ingredient save failed", error);
      }

      return nextIngredients;
    });

    setOrderingMeta((previous: any) => ({
      ...previous,
      [payload.id]: {
        ...(previous[payload.id] || {}),
        supplierName: payload.supplierName,
      },
    }));

    setIngredientForm(defaultIngredientForm);
    setIngredientSupplierName("");
    setPurchasePriceInputValue("");
    setIsPurchasePriceFocused(false);
    setShowSupplierLineForm(false);
  };

  const editIngredient = (ingredient: any) => {
    setIngredientForm({
      id: ingredient.id,
      name: ingredient.name || "",
      purchasePrice: Number.isFinite(parseFloat(ingredient.purchasePrice)) ? parseFloat(ingredient.purchasePrice) : "",
      purchaseUnit: ingredient.purchaseUnit || "box",
      amountInPurchaseUnit: ingredient.amountInPurchaseUnit?.toString() || "",
      sizePerItem: ingredient.sizePerItem?.toString() || "",
      sizeUnit: ingredient.sizeUnit || "kg",
      supplierName: ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "",
      supplierUnitCost:
        ingredient.supplierUnitCost !== undefined && ingredient.supplierUnitCost !== null
          ? String(ingredient.supplierUnitCost)
          : ingredient.purchasePrice?.toString() || "",
      supplierPackSize:
        ingredient.supplierPackSize !== undefined && ingredient.supplierPackSize !== null
          ? String(ingredient.supplierPackSize)
          : ingredient.baseQuantity?.toString() || "",
    });
    setIngredientSupplierName(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "");
    setPurchasePriceInputValue(formatCurrencyInputDisplay(ingredient.purchasePrice));
    setIsPurchasePriceFocused(false);
    setShowSupplierLineForm(true);
    setActiveView("ordering");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteIngredient = (ingredientId: string) => {
    const linkedRecipesCount = recipes.filter((recipe) =>
      (recipe.components || []).some(
        (component: any) => component.componentType === "supplier" && component.linkedId === ingredientId
      )
    ).length;

    const message =
      linkedRecipesCount > 0
        ? `This ingredient is linked to ${linkedRecipesCount} recipe(s). Delete it anyway and cause paperwork?`
        : "Delete this ingredient? Gone, finished, off the books?";

    const confirmed = window.confirm(message);
    if (!confirmed) return;

    createEmergencyBackupSnapshot("delete_ingredient");

    setSupplierIngredients((previous: any) => previous.filter((item: any) => item.id !== ingredientId));

    if (ingredientForm.id === ingredientId) {
      setIngredientForm(defaultIngredientForm);
      setIngredientSupplierName("");
      setPurchasePriceInputValue("");
      setIsPurchasePriceFocused(false);
      setShowSupplierLineForm(false);
    }
  };

  const handleSupplierFormChange = (field: string, value: any) => {
    setSupplierForm((previous: any) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleSupplierDay = (field: "orderingDays" | "deliveryDays", day: string) => {
    setSupplierForm((previous: any) => {
      const currentDays = Array.isArray(previous[field]) ? previous[field] : [];
      const nextDays = currentDays.includes(day)
        ? currentDays.filter((item: string) => item !== day)
        : [...currentDays, day];
      return {
        ...previous,
        [field]: nextDays,
      };
    });
  };

  const resetSupplierForm = () => {
    setSupplierForm(defaultSupplierForm);
    setSupplierMessage("");
  };

  const saveSupplier = (event: FormEvent) => {
    event.preventDefault();
    const supplierName = String(supplierForm.name || "").trim();

    if (!supplierName) {
      setSupplierMessage("Supplier name first, chef. Can't order from a ghost.");
      return;
    }

    const duplicate = suppliers.find(
      (supplier: any) =>
        String(supplier.name || "").trim().toLowerCase() === supplierName.toLowerCase() && supplier.id !== supplierForm.id
    );

    if (duplicate) {
      setSupplierMessage("That supplier already exists. No double-ups in the evidence locker.");
      return;
    }

    const oldSupplier = suppliers.find((supplier: any) => supplier.id === supplierForm.id);
    const payload = normaliseSupplierRecord({
      ...supplierForm,
      id: supplierForm.id || `supplier_${Date.now()}`,
      name: supplierName,
      contactName: String(supplierForm.contactName || "").trim(),
      phone: String(supplierForm.phone || "").trim(),
      email: String(supplierForm.email || "").trim(),
      notes: String(supplierForm.notes || "").trim(),
      repName: String(supplierForm.repName || "").trim(),
      orderEmail: String(supplierForm.orderEmail || "").trim(),
      orderPhone: String(supplierForm.orderPhone || "").trim(),
      minimumOrder: String(supplierForm.minimumOrder || "").trim(),
      accountNumber: String(supplierForm.accountNumber || "").trim(),
    });

    createEmergencyBackupSnapshot("save_supplier");

    setSuppliers((previous: any[]) => {
      if (supplierForm.id) {
        return previous.map((supplier: any) => (supplier.id === supplierForm.id ? payload : supplier));
      }
      return [...previous, payload];
    });

    if (oldSupplier && oldSupplier.name !== payload.name) {
      setSupplierIngredients((previous: any[]) =>
        previous.map((ingredient: any) =>
          String(ingredient.supplierName || "").trim() === oldSupplier.name
            ? { ...ingredient, supplierName: payload.name }
            : ingredient
        )
      );

      setOrderingMeta((previous: any) => {
        const next = { ...previous };
        Object.keys(next).forEach((ingredientId) => {
          if (String(next[ingredientId]?.supplierName || "").trim() === oldSupplier.name) {
            next[ingredientId] = {
              ...(next[ingredientId] || {}),
              supplierName: payload.name,
            };
          }
        });
        return next;
      });
    }

    setSelectedSupplierId(payload.id);
    setSupplierForm(defaultSupplierForm);
    setShowSupplierForm(false);
    setSupplierMessage("Supplier saved. GP Police has the file on them now.");
  };

  const editSupplier = (supplier: any) => {
    if (supplier.isVirtual) {
      setSupplierForm({ ...defaultSupplierForm, name: supplier.name });
    } else {
      setSupplierForm(normaliseSupplierRecord(supplier));
    }
    setSupplierMessage("");
    setSelectedSupplierId(null);
    setShowSupplierForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSupplier = (supplier: any) => {
    if (supplier.isVirtual) {
      setSupplierMessage("This supplier is coming from linked ingredients. Edit those links first, chef.");
      return;
    }

    const linkedCount = supplierIngredients.filter(
      (ingredient: any) => String(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim() === supplier.name
    ).length;

    if (linkedCount > 0) {
      setSupplierMessage("This supplier is linked to ingredients and cannot be deleted until those links are changed.");
      return;
    }

    const confirmed = window.confirm(`Delete ${supplier.name}? No linked ingredients found, but still don't be sloppy.`);
    if (!confirmed) return;

    createEmergencyBackupSnapshot("delete_supplier");

    setSuppliers((previous: any[]) => previous.filter((item: any) => item.id !== supplier.id));
    if (selectedSupplierId === supplier.id) {
      setSelectedSupplierId(null);
    }
    setSupplierMessage("Supplier deleted. Case closed.");
  };

  const selectedSupplierEmailAddress = selectedSupplier?.orderEmail || selectedSupplier?.email || "";

  const supplierEmailHref = selectedSupplierEmailAddress
    ? `mailto:${selectedSupplierEmailAddress}?subject=${encodeURIComponent(`GP Police App - ${selectedSupplier?.name || "Supplier"}`)}&body=${encodeURIComponent(`Hi ${selectedSupplier?.repName || selectedSupplier?.contactName || selectedSupplier?.name || "there"},\n\nJust touching base from GP Police App.\n\nThanks.`)}`
    : "";

  const startNewSupplierLine = () => {
    setIngredientForm(defaultIngredientForm);
    setIngredientSupplierName("");
    setPurchasePriceInputValue("");
    setIsPurchasePriceFocused(false);
    setShowSupplierLineForm(true);
    setActiveView("ordering");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    ingredientForm,
    setIngredientForm,
    purchasePriceInputValue,
    isPurchasePriceFocused,
    ingredientSupplierName,
    setIngredientSupplierName,
    showSupplierLineForm,
    setShowSupplierLineForm,
    supplierForm,
    setSupplierForm,
    showSupplierForm,
    setShowSupplierForm,
    selectedSupplierId,
    setSelectedSupplierId,
    supplierSearchTerm,
    setSupplierSearchTerm,
    supplierMessage,
    setSupplierMessage,
    supplierDirectory,
    filteredSupplierDirectory,
    selectedSupplier,
    selectedSupplierIngredients,
    selectedSupplierEmailAddress,
    supplierEmailHref,
    handleIngredientFormChange,
    handlePurchasePriceFocus,
    handlePurchasePriceChange,
    handlePurchasePriceBlur,
    clearIngredientForm,
    saveIngredient,
    editIngredient,
    deleteIngredient,
    handleSupplierFormChange,
    toggleSupplierDay,
    resetSupplierForm,
    saveSupplier,
    editSupplier,
    deleteSupplier,
    startNewSupplierLine,
  };
}
