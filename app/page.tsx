// GP POLICE STABLE BASELINE
// Do not modularise, delete files, rename storage keys, or move UI
// without a staged patch and build test.
// This file is currently the single source of truth.

"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useInvoiceIntake } from "../hooks/useInvoiceIntake";
import { usePosSales } from "../hooks/usePosSales";
import { useBackup } from "../hooks/useBackup";
import { useStockOrdering } from "../hooks/useStockOrdering";
import { createPageRenderers } from "../components/pageRenderers/PageRenderers";
import { createRecipePageRenderers } from "../components/pageRenderers/RecipePageRenderers";
import { createAdminPageRenderers } from "../components/pageRenderers/AdminPageRenderers";
import { createMiscPageRenderers } from "../components/pageRenderers/MiscPageRenderers";
import { AppShell } from "../components/AppShell";
import {
  STORAGE_KEYS,
  INVOICE_SPEND_STORAGE_KEY,
  INVOICE_INTAKE_DRAFT_KEY,
  LOCKED_INVOICE_HISTORY_KEY,
  VENUE_STORAGE_KEYS,
  BACKUP_HISTORY_KEY,
  DEFAULT_VENUE_ID,
  DEFAULT_VENUE_TIMESTAMP,
  DEFAULT_ADMIN_PASSWORD,
  GP_POLICE_APP_KEYS,
  purchaseUnitOptions,
  sizeUnitOptions,
  recipeYieldUnitOptions,
  componentUnitOptions,
  recipeTypeOptions,
  supplierDayOptions,
  defaultIngredientForm,
  defaultRecipeForm,
  defaultSupplierForm
} from "../lib/gpPoliceConstants";
import {
  getVenueDisplayName,
  safeNumber,
  roundTo,
  formatCurrency,
  formatCurrencyInputDisplay,
  getInvoiceRecordDateValue,
  getInvoiceRecordSupplierName,
  getInvoiceRecordTotal,
  getMondayWeekStart,
  getPreviousMondayWeekStart,
  formatRawNumericInput,
  unitCategory,
  unitTypeFromUnit,
  toBaseUnit,
  baseUnitFromSizeUnit,
  normalizeRecipeYieldUnitForMath,
  areUnitsCompatible,
  formatChefFriendlyDisplayQuantity,
  getChefFriendlyCostLabel,
  formatDisplayCostPerUnit,
  getIngredientDerivedValues,
  getIngredientSummaryDisplay,
  getRecipeCostPerBaseUnit,
  getCompatibleUnitsForBase,
  getCostingSourceForComponent,
  buildComponentDetail,
  normalizeLooseText
} from "../lib/gpPoliceHelpers";
import {
  safeParse,
  safeSetLocalStorageValue,
  safeSetLocalStorageRaw,
  safeParseVenueState,
  isValidArray,
  isValidObject,
  isValidVenueArray,
  isValidVenueState
} from "../lib/storageHelpers";
import {
  cleanInvoiceOcrText,
  getInvoiceOcrQualityWarning,
  getInvoiceRowConfidence,
  enhanceInvoiceReviewRows,
  parseSupplierInvoiceText,
  parseSupplierInvoiceTextSmart,
  getInvoiceRowRecoveryPriceAnchorCount,
  rebuildInvoiceTextFromPriceAnchors,
  splitInvoiceTextWithSoftLineBreaks
} from "../lib/invoiceParsing";
import {
  extractDocxTextFallbackMessage,
  importedRecipeUnitOptions,
  parseImportedRecipeText,
  normalizeImportedRecipeType,
  normalizeImportedUnitForComponent,
  parseImportedIngredientLine,
  buildImportedRecipeDraftFromText
} from "../lib/recipeImportParsing";
import {
  parseCsvRows,
  normalizeCsvHeader,
  findCsvColumn,
  parseMoneyLikeValue,
  parsePosSalesCsv
} from "../lib/posCsvParsing";

const SUPPLIER_COGS_MEMORY_STORAGE_KEY = "gpPolice_supplierCogsMemory_v1";
const SUPPLIER_MATCH_MEMORY_STORAGE_KEY = "gpPoliceSupplierMatchMemory";
const DAMAGE_HISTORY_STORAGE_KEY = "gpPolice_damageHistory_v1";



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

function getDefaultVenueState() {
  const defaultVenue = {
    id: DEFAULT_VENUE_ID,
    name: "Mother Base Main Hideout",
    createdAt: DEFAULT_VENUE_TIMESTAMP,
    updatedAt: DEFAULT_VENUE_TIMESTAMP,
  };

  return {
    currentVenueId: DEFAULT_VENUE_ID,
    venues: [defaultVenue],
  };
}


function loadImageElementFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load invoice image"));
    };
    image.src = url;
  });
}

async function preprocessInvoiceImageForOCR(file: File): Promise<Blob | File> {
  try {
    if (typeof document === "undefined") return file;

    const image = await loadImageElementFromFile(file);
    const maxWidth = 1800;
    const scale = image.width > maxWidth ? maxWidth / image.width : 1;
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return file;

    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let index = 0; index < data.length; index += 4) {
      const grey = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
      const boosted = grey > 170 ? 255 : grey < 120 ? 0 : grey * 1.2;
      data[index] = boosted;
      data[index + 1] = boosted;
      data[index + 2] = boosted;
    }

    context.putImageData(imageData, 0, 0);

    return await new Promise<Blob | File>((resolve) => {
      canvas.toBlob((blob) => resolve(blob || file), "image/png", 1);
    });
  } catch (error) {
    console.warn("GP Police image preprocessing failed, using original photo", error);
    return file;
  }
}


export default function Page() {
  const [activeView, setActiveView] = useState("dashboard");
  const [authenticated, setAuthenticated] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [supplierIngredients, setSupplierIngredients] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [ingredientForm, setIngredientForm] = useState<any>(defaultIngredientForm);
  const [recipeForm, setRecipeForm] = useState<any>(defaultRecipeForm);
  const [purchasePriceInputValue, setPurchasePriceInputValue] = useState("");
  const [isPurchasePriceFocused, setIsPurchasePriceFocused] = useState(false);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("");
  const [recipeTypeFilter, setRecipeTypeFilter] = useState("all");
  const [recipeFolderView, setRecipeFolderView] = useState<any>(null);
  const [dashboardFolderView, setDashboardFolderView] = useState<string | null>(null);
  const [recipeIngredientSearch, setRecipeIngredientSearch] = useState("");
  const recipeIngredientSearchRef = useRef<HTMLInputElement | null>(null);
  const recipeImportFileInputRef = useRef<HTMLInputElement | null>(null);
  const invoiceCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedRecipeView, setSelectedRecipeView] = useState<"detail" | "prepSheet">("detail");
  const [orderingMeta, setOrderingMeta] = useState<Record<string, any>>({});
  const [recipeImportText, setRecipeImportText] = useState("");
  const [recipeImportMessage, setRecipeImportMessage] = useState("");
  const [importedRecipeDraft, setImportedRecipeDraft] = useState<any>(null);
  const [ingredientSupplierName, setIngredientSupplierName] = useState("");
  const [showSupplierLineForm, setShowSupplierLineForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState<any>(defaultSupplierForm);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [supplierMessage, setSupplierMessage] = useState("");
  const [supplierInvoiceText, setSupplierInvoiceText] = useState("");
  const [supplierInvoiceRows, setSupplierInvoiceRows] = useState<any[]>([]);
  const [invoiceDraft, setInvoiceDraft] = useState<any>(null);
  const [invoiceDraftMessage, setInvoiceDraftMessage] = useState("");
  const [invoiceLockSuccessReport, setInvoiceLockSuccessReport] = useState<any>(null);
  const [invoiceIntakeMeta, setInvoiceIntakeMeta] = useState<any>({ invoiceNumber: "", invoiceDate: new Date().toISOString().slice(0, 10) });
  const [invoiceSpendRecords, setInvoiceSpendRecords] = useState<any[]>([]);
  const [invoiceSpendForm, setInvoiceSpendForm] = useState<any>({
    supplierName: "",
    date: new Date().toISOString().slice(0, 10),
    totalCost: "",
    notes: "",
  });
  const [invoiceSpendMessage, setInvoiceSpendMessage] = useState("");
  const [supplierInvoiceMessage, setSupplierInvoiceMessage] = useState("");
  const [supplierInvoicePhotoName, setSupplierInvoicePhotoName] = useState("");
  const [supplierInvoicePhotoPreviewUrl, setSupplierInvoicePhotoPreviewUrl] = useState("");
  const [supplierInvoiceViewOpen, setSupplierInvoiceViewOpen] = useState(false);
  const [invoiceQualityWarning, setInvoiceQualityWarning] = useState("");
  const [invoiceFixingRowId, setInvoiceFixingRowId] = useState<string | null>(null);
  const [lockedInvoiceHistory, setLockedInvoiceHistory] = useState<any[]>([]);
  const [venueState, setVenueState] = useState<any>({ currentVenueId: "", venues: [] });
  const [venueMessage, setVenueMessage] = useState("");
  const [pendingVenueBackup, setPendingVenueBackup] = useState<any>(null);
  const venueBackupInputRef = useRef<HTMLInputElement | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [failedStorageKeys, setFailedStorageKeys] = useState<Set<string>>(new Set());
  const [damageHistory, setDamageHistory] = useState<any[]>([]);
  const [supplierMatchMemory, setSupplierMatchMemory] = useState<Record<string, any>>({});

  const saveVenueStateToStorage = (nextVenueState: any) => {
    if (!isValidVenueState(nextVenueState)) {
      console.warn("GP Police blocked invalid venue save", nextVenueState);
      return false;
    }

    safeSetLocalStorageValue(VENUE_STORAGE_KEYS.VENUES, nextVenueState);
    return true;
  };


  useEffect(() => {
    const loadFailedKeys = new Set<string>();
    const markStorageKeyFailed = (key: string) => {
      loadFailedKeys.add(key);
    };

    const ingredients = safeParse<any[]>(STORAGE_KEYS.INGREDIENTS, [], isValidArray, markStorageKeyFailed);
    if (Array.isArray(ingredients)) {
      setSupplierIngredients(ingredients);
    }

    const savedRecipes = safeParse<any[]>(STORAGE_KEYS.RECIPES, [], isValidArray, markStorageKeyFailed);
    if (Array.isArray(savedRecipes)) {
      setRecipes(savedRecipes);
    }

    const ordering = safeParse<Record<string, any>>(STORAGE_KEYS.ORDERING, {}, isValidObject, markStorageKeyFailed);
    if (ordering && typeof ordering === "object" && !Array.isArray(ordering)) {
      setOrderingMeta(ordering);
    }

    const savedSuppliers = safeParse<any[]>(STORAGE_KEYS.SUPPLIERS, [], isValidArray, markStorageKeyFailed);
    if (Array.isArray(savedSuppliers)) {
      setSuppliers(savedSuppliers.map(normaliseSupplierRecord).filter((supplier: any) => supplier.name));
    }


    const invoiceSpend = safeParse<any[]>(INVOICE_SPEND_STORAGE_KEY, [], isValidArray, markStorageKeyFailed);
    if (Array.isArray(invoiceSpend)) {
      setInvoiceSpendRecords(invoiceSpend);
    }

    const savedSupplierMatchMemory = safeParse<Record<string, any>>(SUPPLIER_MATCH_MEMORY_STORAGE_KEY, {}, isValidObject, markStorageKeyFailed);
    if (savedSupplierMatchMemory && typeof savedSupplierMatchMemory === "object" && !Array.isArray(savedSupplierMatchMemory)) {
      setSupplierMatchMemory(savedSupplierMatchMemory);
    }

    setFailedStorageKeys(loadFailedKeys);
    setStorageLoaded(true);
  }, []);


  useEffect(() => {
    const savedLockedInvoices = safeParse<any[]>(LOCKED_INVOICE_HISTORY_KEY, [], isValidArray);
    if (Array.isArray(savedLockedInvoices)) {
      setLockedInvoiceHistory(savedLockedInvoices.slice(0, 25));
    }
  }, []);

  useEffect(() => {
    const savedDamageHistory = safeParse<any[]>(DAMAGE_HISTORY_STORAGE_KEY, [], isValidArray);
    if (Array.isArray(savedDamageHistory)) {
      setDamageHistory(savedDamageHistory.slice(0, 100));
    }
  }, []);

  useEffect(() => {
    const savedInvoiceDraft = safeParse<any>(
      INVOICE_INTAKE_DRAFT_KEY,
      null,
      (value) => !value || (typeof value === "object" && !Array.isArray(value))
    );

    if (!savedInvoiceDraft) return;

    setInvoiceDraft(savedInvoiceDraft);
    setSupplierInvoiceText(String(savedInvoiceDraft.rawText || ""));
    setSupplierInvoiceRows(Array.isArray(savedInvoiceDraft.rows) ? savedInvoiceDraft.rows : []);
    setInvoiceIntakeMeta({
      invoiceNumber: String(savedInvoiceDraft.invoiceNumber || ""),
      invoiceDate: String(savedInvoiceDraft.invoiceDate || new Date().toISOString().slice(0, 10)),
    });
    setInvoiceDraftMessage("Latest invoice draft loaded from this device.");
  }, []);

  useEffect(() => {
    const fallbackVenueState = getDefaultVenueState();
    const savedVenues = localStorage.getItem(VENUE_STORAGE_KEYS.VENUES);

    if (!savedVenues) {
      safeSetLocalStorageValue(VENUE_STORAGE_KEYS.VENUES, fallbackVenueState);
      setVenueState(fallbackVenueState);
      return;
    }

    const parsedVenues = safeParseVenueState<any>(VENUE_STORAGE_KEYS.VENUES, null);

    if (!isValidVenueState(parsedVenues)) {
      console.warn("Invalid venue structure");
      setVenueState(fallbackVenueState);
      return;
    }

    const validVenue = parsedVenues.venues.find((venue: any) => venue.id === parsedVenues.currentVenueId);
    const safeVenueState = validVenue
      ? parsedVenues
      : {
          ...parsedVenues,
          currentVenueId: parsedVenues.venues[0]?.id || DEFAULT_VENUE_ID,
        };

    if (!isValidVenueState(safeVenueState)) {
      console.warn("Invalid selected venue state");
      setVenueState(fallbackVenueState);
      return;
    }

    if (safeVenueState.currentVenueId !== parsedVenues.currentVenueId) {
      saveVenueStateToStorage(safeVenueState);
    }

    setVenueState(safeVenueState);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    if (failedStorageKeys.has(STORAGE_KEYS.INGREDIENTS)) return;
    safeSetLocalStorageValue(STORAGE_KEYS.INGREDIENTS, supplierIngredients);
  }, [storageLoaded, supplierIngredients, failedStorageKeys]);

  useEffect(() => {
    if (!storageLoaded) return;
    if (failedStorageKeys.has(STORAGE_KEYS.RECIPES)) return;
    safeSetLocalStorageValue(STORAGE_KEYS.RECIPES, recipes);
  }, [storageLoaded, recipes, failedStorageKeys]);

  useEffect(() => {
    if (!storageLoaded) return;
    if (failedStorageKeys.has(STORAGE_KEYS.ORDERING)) return;
    safeSetLocalStorageValue(STORAGE_KEYS.ORDERING, orderingMeta);
  }, [storageLoaded, orderingMeta, failedStorageKeys]);

  useEffect(() => {
    if (!storageLoaded) return;
    if (failedStorageKeys.has(STORAGE_KEYS.SUPPLIERS)) return;
    safeSetLocalStorageValue(STORAGE_KEYS.SUPPLIERS, suppliers);
  }, [storageLoaded, suppliers, failedStorageKeys]);


  useEffect(() => {
    if (!storageLoaded) return;
    if (failedStorageKeys.has(INVOICE_SPEND_STORAGE_KEY)) return;
    safeSetLocalStorageValue(INVOICE_SPEND_STORAGE_KEY, invoiceSpendRecords);
  }, [storageLoaded, invoiceSpendRecords, failedStorageKeys]);

  useEffect(() => {
    if (!storageLoaded) return;
    if (failedStorageKeys.has(SUPPLIER_MATCH_MEMORY_STORAGE_KEY)) return;
    safeSetLocalStorageValue(SUPPLIER_MATCH_MEMORY_STORAGE_KEY, supplierMatchMemory);
  }, [storageLoaded, supplierMatchMemory, failedStorageKeys]);

  useEffect(() => {
    if (!storageLoaded) return;
    if (failedStorageKeys.has(LOCKED_INVOICE_HISTORY_KEY)) return;
    safeSetLocalStorageValue(LOCKED_INVOICE_HISTORY_KEY, lockedInvoiceHistory.slice(0, 25));
  }, [storageLoaded, lockedInvoiceHistory, failedStorageKeys]);

  useEffect(() => {
    if (isPurchasePriceFocused) return;
    setPurchasePriceInputValue(formatCurrencyInputDisplay(ingredientForm.purchasePrice));
  }, [ingredientForm.purchasePrice, isPurchasePriceFocused]);

  useEffect(() => {
    if (!ingredientForm.id) return;
    const matchedIngredient = supplierIngredients.find((item: any) => item.id === ingredientForm.id);
    setIngredientSupplierName(matchedIngredient?.supplierName || orderingMeta[ingredientForm.id]?.supplierName || "");
  }, [ingredientForm.id, orderingMeta[ingredientForm.id], supplierIngredients]);

  useEffect(() => {
    const syncViewport = () => {
      const mobile = window.innerWidth <= 820;

      setIsMobileViewport((previous: any) => (previous === mobile ? previous : mobile));

      if (!mobile) {
        setIsMobileMenuOpen((previous: any) => (previous ? false : previous));
      }
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    const shouldHideOverflow = isMobileViewport && isMobileMenuOpen;
    const currentOverflow = document.body.style.overflow;
    const nextOverflow = shouldHideOverflow ? "hidden" : "";

    if (currentOverflow !== nextOverflow) {
      document.body.style.overflow = nextOverflow;
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isMobileViewport, isMobileMenuOpen]);

  useEffect(() => {
    return () => {
      if (supplierInvoicePhotoPreviewUrl) {
        URL.revokeObjectURL(supplierInvoicePhotoPreviewUrl);
      }
    };
  }, [supplierInvoicePhotoPreviewUrl]);

  const ingredientLookup = useMemo(() => {
    return supplierIngredients.reduce((accumulator: any, ingredient: any) => {
      const derived = getIngredientDerivedValues(ingredient);
      accumulator[ingredient.id] = {
        ...ingredient,
        ...derived,
      };
      return accumulator;
    }, {});
  }, [supplierIngredients]);

  const computedRecipes = useMemo(() => {
    const recipeMap: Record<string, any> = {};
    const baseRecipes = recipes.map((recipe) => ({
      ...recipe,
      components: Array.isArray(recipe.components) ? recipe.components : [],
    }));

    const computeRecipe = (recipeId: string, stack: string[] = []) => {
      if (recipeMap[recipeId]) return recipeMap[recipeId];

      const recipe = baseRecipes.find((item: any) => item.id === recipeId);
      if (!recipe) return null;

      if (stack.includes(recipeId)) {
        return {
          ...recipe,
          baseUnit: baseUnitFromSizeUnit(normalizeRecipeYieldUnitForMath(recipe.yieldUnit)),
          totalCost: 0,
          costPerBaseUnit: 0,
          costPerPortion: 0,
          portionsPerBatch: 0,
          foodCostPercent: 0,
          grossProfitAmount: 0,
          grossProfitPercent: 0,
          componentDetails: [],
        };
      }

      const componentDetails = recipe.components.map((component: any) => {
        if (component.componentType === "supplier") {
          return buildComponentDetail(component, ingredientLookup, {});
        }

        const linkedRecipe = computeRecipe(component.linkedId, [...stack, recipeId]);
        return buildComponentDetail(
          component,
          ingredientLookup,
          linkedRecipe ? { [component.linkedId]: linkedRecipe } : {}
        );
      });

      const totalCost = componentDetails.reduce((sum: number, item: any) => sum + safeNumber(item.lineCost), 0);
      const isFinalDish = recipe.recipeType === "final dish";
      const recipeBaseValues = isFinalDish
        ? { baseUnit: "each", costPerBaseUnit: totalCost }
        : getRecipeCostPerBaseUnit({
            totalCost,
            yieldAmount: recipe.yieldAmount,
            yieldUnit: recipe.yieldUnit,
          });
      const baseUnit = recipeBaseValues.baseUnit;
      const costPerBaseUnit = recipeBaseValues.costPerBaseUnit;
      const portionsPerBatch = isFinalDish ? 1 : 0;
      const costPerPortion = isFinalDish ? totalCost : 0;

      const sellPrice = safeNumber(recipe.sellPrice);
      const foodCostPercent = sellPrice > 0 ? (costPerPortion / sellPrice) * 100 : 0;
      const grossProfitAmount = sellPrice - costPerPortion;
      const grossProfitPercent = sellPrice > 0 ? (grossProfitAmount / sellPrice) * 100 : 0;

      const computed = {
        ...recipe,
        baseUnit,
        totalCost,
        costPerBaseUnit,
        componentDetails,
        portionsPerBatch,
        costPerPortion,
        foodCostPercent,
        grossProfitAmount,
        grossProfitPercent,
      };

      recipeMap[recipeId] = computed;
      return computed;
    };

    return baseRecipes.map((recipe) => computeRecipe(recipe.id)).filter(Boolean);
  }, [recipes, ingredientLookup]);

  const computedRecipeLookup = useMemo(() => {
    return computedRecipes.reduce((accumulator: any, recipe: any) => {
      accumulator[recipe.id] = recipe;
      return accumulator;
    }, {});
  }, [computedRecipes]);

  const filteredRecipes = useMemo(() => {
    const search = recipeSearchTerm.trim().toLowerCase();

    return computedRecipes.filter((recipe: any) => {
      const matchesFilter = recipeTypeFilter === "all" ? true : recipe.recipeType === recipeTypeFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [recipe.name, recipe.recipeType, recipe.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [computedRecipes, recipeSearchTerm, recipeTypeFilter]);

  const selectedRecipe = selectedRecipeId ? computedRecipeLookup[selectedRecipeId] : null;

  const recipeFolderOptions = [
    {
      key: "all",
      label: "Total Recipes",
      helper: "Every recipe in the folder. No hiding from the numbers now.",
      getRecipes: () => computedRecipes,
    },
    {
      key: "ingredient-prep",
      label: "Ingredient Prep",
      helper: "Prep recipes only. The mise en place evidence locker.",
      getRecipes: () => computedRecipes.filter((recipe: any) => recipe.recipeType === "ingredient prep"),
    },
    {
      key: "batch-recipes",
      label: "Batch Recipes",
      helper: "Batch recipes only. Sauces, bases, and all the margin building blocks.",
      getRecipes: () => computedRecipes.filter((recipe: any) => recipe.recipeType === "batch recipe"),
    },
    {
      key: "final-dishes",
      label: "Final Dishes",
      helper: "Final dishes only. This is where the GP either behaves or gets arrested.",
      getRecipes: () => computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish"),
    },
    {
      key: "missing-category",
      label: "Missing Category",
      helper: "Recipes with no category. Bit hard to sort the evidence if the folder is blank.",
      getRecipes: () => computedRecipes.filter((recipe: any) => !String(recipe.category || "").trim()),
    },
    {
      key: "no-components",
      label: "No Components",
      helper: "Recipes with no ingredient lines. That's not costing, that's wishful thinking.",
      getRecipes: () => computedRecipes.filter((recipe: any) => !Array.isArray(recipe.components) || recipe.components.length === 0),
    },
    {
      key: "no-sell-price",
      label: "No Sell Price",
      helper: "Final dishes with no sell price. Lovely way to donate margin if no one fixes it.",
      getRecipes: () => computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish" && safeNumber(recipe.sellPrice) <= 0),
    },
  ];

  const currentRecipeFolder = recipeFolderView
    ? recipeFolderOptions.find((folder) => folder.key === recipeFolderView)
    : null;

  const quickAddIngredientMatches = useMemo(() => {
    const search = recipeIngredientSearch.trim().toLowerCase();
    if (!search) return [];

    return supplierIngredients
      .filter((ingredient: any) => {
        const supplierName = String(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim();
        const haystack = [ingredient.name, supplierName].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(search);
      })
      .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")))
      .slice(0, 10);
  }, [orderingMeta, recipeIngredientSearch, supplierIngredients]);

  const backupRef = useRef<(reason?: string) => any>(() => null);

  const stock = useStockOrdering({
    supplierIngredients,
    orderingMeta,
    setOrderingMeta,
    storageLoaded,
    failedStorageKeys,
    setFailedStorageKeys,
    createEmergencyBackupSnapshot: (reason?: string) => backupRef.current(reason),
  });

  const availableSupplierNames = useMemo(() => {
    const names = stock.orderingRows
      .map((row: any) => String(row.supplierName || "").trim())
      .filter((name: string) => name && name !== "Unassigned Supplier");
    return Array.from(new Set<string>(names)).sort((a: string, b: string) => a.localeCompare(b));
  }, [stock.orderingRows]);

  const supplierGroupedRegister = useMemo(
    () =>
      availableSupplierNames.map((supplierName: any) => ({
        supplierName,
        items: stock.orderingRows
          .filter((row: any) => row.supplierName === supplierName)
          .sort((a: any, b: any) => a.ingredientName.localeCompare(b.ingredientName)),
      })),
    [availableSupplierNames, stock.orderingRows]
  );
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

  const finalDishRecipes = useMemo(
    () => computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish"),
    [computedRecipes]
  );

  const lowStockCount = stock.orderingRows.filter((row: any) => row.suggestedOrder > 0).length;
  const estimatedOrderSpend = stock.orderingRows.reduce((sum: number, row: any) => sum + safeNumber(row.estimatedOrderCost), 0);
  const housePrepRecipes = computedRecipes.filter((recipe: any) => recipe.recipeType === "ingredient prep");

  const totalIngredientCount = supplierIngredients.length;
  const totalRecipeCount = recipes.length;
  const totalFinalDishCount = computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish").length;

  const mostRecentIngredient =
    supplierIngredients.length > 0 ? supplierIngredients[supplierIngredients.length - 1] : null;
  const mostRecentRecipe = computedRecipes.length > 0 ? computedRecipes[computedRecipes.length - 1] : null;

  const recentSupplierIngredients = supplierIngredients.slice(-4).reverse();

  const recipesWithNoComponents = recipes.filter(
    (recipe) => !Array.isArray(recipe.components) || recipe.components.length === 0
  );
  const recipesMissingCategory = recipes.filter((recipe) => !String(recipe.category || "").trim());
  const finalDishesWithNoSellPrice = computedRecipes.filter(
    (recipe: any) => recipe.recipeType === "final dish" && safeNumber(recipe.sellPrice) <= 0
  );

  const needsAttentionItems = [
    ...recipesWithNoComponents.map((recipe) => ({
      id: `no_components_${recipe.id}`,
      folderKey: "no-components",
      label: `${recipe.name || "Unnamed recipe"} has no components. That's not a recipe, that's a liability.`,
    })),
    ...recipesMissingCategory.map((recipe) => ({
      id: `missing_category_${recipe.id}`,
      folderKey: "missing-category",
      label: `${recipe.name || "Unnamed recipe"} is missing a category. Bit hard to sort the evidence.`,
    })),
    ...finalDishesWithNoSellPrice.map((recipe: any) => ({
      id: `missing_sell_price_${recipe.id}`,
      folderKey: "no-sell-price",
      label: `${recipe.name || "Unnamed final dish"} has no sell price. Lovely way to donate margin.`,
    })),
  ];

  const invoiceWeeklySummary = useMemo(() => {
    const today = new Date();
    const thisWeekKey = getMondayWeekStart(today);
    const lastWeekKey = getPreviousMondayWeekStart(today);

    const recordsByWeek = invoiceSpendRecords.reduce((accumulator: Record<string, number>, record: any) => {
      const weekKey = getMondayWeekStart(getInvoiceRecordDateValue(record));
      if (!weekKey) return accumulator;
      accumulator[weekKey] = safeNumber(accumulator[weekKey]) + getInvoiceRecordTotal(record);
      return accumulator;
    }, {});

    const thisWeekSpend = safeNumber(recordsByWeek[thisWeekKey]);
    const lastWeekSpend = safeNumber(recordsByWeek[lastWeekKey]);
    const weeklyChange = thisWeekSpend - lastWeekSpend;

    return {
      thisWeekKey,
      lastWeekKey,
      thisWeekSpend,
      lastWeekSpend,
      weeklyChange,
    };
  }, [invoiceSpendRecords]);

  const sortedInvoiceSpendRecords = useMemo(() => {
    return invoiceSpendRecords
      .slice()
      .sort((a: any, b: any) => String(getInvoiceRecordDateValue(b)).localeCompare(String(getInvoiceRecordDateValue(a))));
  }, [invoiceSpendRecords]);

  const gpDamageSummary = useMemo(() => {
    const today = new Date();
    const thisWeekKey = getMondayWeekStart(today);
    const lastWeekKey = getPreviousMondayWeekStart(today);

    const damageByWeek = (Array.isArray(damageHistory) ? damageHistory : []).reduce((accumulator: Record<string, number>, record: any) => {
      const weekKey = getMondayWeekStart(record?.date || record?.createdAt || new Date());
      if (!weekKey) return accumulator;
      accumulator[weekKey] = safeNumber(accumulator[weekKey]) + safeNumber(record?.totalDamage);
      return accumulator;
    }, {});

    const thisWeekDamage = safeNumber(damageByWeek[thisWeekKey]);
    const lastWeekDamage = safeNumber(damageByWeek[lastWeekKey]);
    const weeklyChange = thisWeekDamage - lastWeekDamage;
    const percentChange = lastWeekDamage > 0 ? (weeklyChange / lastWeekDamage) * 100 : thisWeekDamage > 0 ? 100 : 0;

    let damageTrendLabel = "Damage stable";
    if (thisWeekDamage > lastWeekDamage * 1.05 && thisWeekDamage > 0) {
      damageTrendLabel = "Damage rising";
    } else if (lastWeekDamage > 0 && thisWeekDamage < lastWeekDamage * 0.95) {
      damageTrendLabel = "Damage improving";
    }

    return {
      thisWeekDamage,
      lastWeekDamage,
      weeklyChange,
      percentChange,
      damageTrendLabel,
    };
  }, [damageHistory]);

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


  const handleImportSelectedInvoiceLines = () => {
    setSupplierInvoiceMessage("Stage 4 creates ingredients one reviewed row at a time. Use Create Ingredient From Row on rows marked Create New.");
  };

  const handleSaveAndImportInvoice = () => {
    const supplierName = String(invoiceSpendForm.supplierName || selectedSupplier?.name || "").trim();
    const date = String(invoiceSpendForm.date || "").trim();
    const totalCost = safeNumber(invoiceSpendForm.totalCost);
    const hasValidSpend = Boolean(supplierName && date && totalCost > 0);

    if (!hasValidSpend) {
      setSupplierInvoiceMessage("Stage 2 is review and matching only. Add a real invoice total to lock invoice spend, or keep reviewing rows.");
      setInvoiceSpendMessage("Add a real invoice total before saving invoice spend.");
      return;
    }

    const payload = {
      id: `invoice_spend_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      supplierName,
      date,
      totalCost,
      notes: String(invoiceSpendForm.notes || "").trim(),
      createdAt: new Date().toISOString(),
    };

    createEmergencyBackupSnapshot("save_invoice_spend_stage2_review_only");
    setInvoiceSpendRecords((previous: any[]) => [...previous, payload]);
    setInvoiceSpendForm({
      supplierName: selectedSupplier?.name || "",
      date: new Date().toISOString().slice(0, 10),
      totalCost: "",
      notes: "",
    });
    setSupplierInvoiceMessage("Invoice spend saved. Reviewed rows were not imported into ingredients — Stage 2 is matching only.");
    setInvoiceSpendMessage("Invoice spend saved.");
  };

  const pos = usePosSales({
    finalDishRecipes,
    storageLoaded,
    failedStorageKeys,
    createEmergencyBackupSnapshot: (reason?: string) => backupRef.current(reason),
  });

  const {
    posSales,
    setPosSales,
    posDishMatches,
    setPosDishMatches,
    posSalesMessage,
    setPosSalesMessage,
    posSalesReport,
    handlePosSalesCsvUpload,
    updatePosDishMatch,
    clearPosSales,
  } = pos;

  const backup = useBackup({
    storageLoaded,
    supplierIngredients,
    setSupplierIngredients,
    recipes,
    setRecipes,
    orderingMeta,
    setOrderingMeta,
    suppliers,
    setSuppliers,
    posSales,
    setPosSales,
    posDishMatches,
    setPosDishMatches,
    invoiceSpendRecords,
    setInvoiceSpendRecords,
    stockMovements: stock.stockMovements,
    setStockMovements: stock.setStockMovements,
    stocktakeRecords: stock.stocktakeRecords,
    setStocktakeRecords: stock.setStocktakeRecords,
    lockedInvoiceHistory,
    setLockedInvoiceHistory,
    damageHistory,
    setDamageHistory,
    supplierMatchMemory,
    setSupplierMatchMemory,
    invoiceDraft,
    venueState,
    setFailedStorageKeys,
  });

  backupRef.current = backup.createEmergencyBackupSnapshot;

  const {
    backupHistory,
    createEmergencyBackupSnapshot,
    createEmergencyBackup,
    restoreFromSnapshot,
    restoreEmergencyBackup,
    readGpPoliceAppStorage,
    restoreGpPoliceAppStorage,
  } = backup;

  const invoice = useInvoiceIntake({
    selectedSupplier,
    supplierIngredients,
    setSupplierIngredients,
    orderingMeta,
    setOrderingMeta,
    invoiceSpendForm,
    invoiceSpendRecords,
    setInvoiceSpendForm,
    setInvoiceSpendRecords,
    setInvoiceSpendMessage,
    supplierMatchMemory,
    setSupplierMatchMemory,
    stockMovements: stock.stockMovements,
    setStockMovements: stock.setStockMovements,
    lockedInvoiceHistory,
    setLockedInvoiceHistory,
    setDamageHistory,
    createEmergencyBackupSnapshot,
    preprocessInvoiceImageForOCR,
  });

  const readVenueData = () => {
    const parsedVenueData = safeParseVenueState<Record<string, any>>(VENUE_STORAGE_KEYS.VENUE_DATA, {});

    if (!parsedVenueData || typeof parsedVenueData !== "object" || Array.isArray(parsedVenueData)) {
      console.warn("Invalid venue data structure");
      return {};
    }

    return parsedVenueData;
  };

  const saveVenueSnapshotForId = (venueId: string, showSavedMessage = false) => {
    if (!venueId) return null;

    try {
      const now = new Date().toISOString();
      const venueData = readVenueData();
      venueData[venueId] = {
        updatedAt: now,
        data: readGpPoliceAppStorage(),
      };
      safeSetLocalStorageValue(VENUE_STORAGE_KEYS.VENUE_DATA, venueData);

      const nextVenueState = {
        ...venueState,
        currentVenueId: venueState.currentVenueId || venueId,
        venues: (venueState.venues || []).map((venue: any) =>
          venue.id === venueId ? { ...venue, updatedAt: now } : venue
        ),
      };
      saveVenueStateToStorage(nextVenueState);
      setVenueState(nextVenueState);

      if (showSavedMessage) {
        setVenueMessage("Venue saved — this kitchen’s evidence is locked in.");
      }

      return venueData[venueId];
    } catch (error) {
      console.error("Failed saving venue snapshot", error);
      setVenueMessage("Could not save venue snapshot. Nothing was switched.");
      return null;
    }
  };

  const handleSaveVenueSnapshot = () => {
    createEmergencyBackup("manual_backup");
    saveVenueSnapshotForId(venueState.currentVenueId, true);
  };

  const handleSwitchVenue = (nextVenueId: string) => {
    if (!nextVenueId || nextVenueId === venueState.currentVenueId) return;

    const nextVenue = (venueState.venues || []).find((venue: any) => venue.id === nextVenueId);
    if (!nextVenue) return;

    const confirmed = window.confirm(`Switch to ${getVenueDisplayName(nextVenue)}? GP Police will save this kitchen first, then load the selected venue.`);
    if (!confirmed) return;

    createEmergencyBackup("switch_venue");
    saveVenueSnapshotForId(venueState.currentVenueId, false);

    const venueData = readVenueData();
    restoreGpPoliceAppStorage(venueData[nextVenueId]?.data || {});

    const now = new Date().toISOString();
    const nextVenueState = {
      ...venueState,
      currentVenueId: nextVenueId,
      venues: (venueState.venues || []).map((venue: any) =>
        venue.id === nextVenueId ? { ...venue, updatedAt: now } : venue
      ),
    };
    saveVenueStateToStorage(nextVenueState);
    window.location.reload();
  };

  const handleCreateVenue = () => {
    const venueName = window.prompt("Name this venue:");
    const cleanedVenueName = String(venueName || "").trim();
    if (!cleanedVenueName) return;

    createEmergencyBackup("create_venue");
    saveVenueSnapshotForId(venueState.currentVenueId, false);

    const now = new Date().toISOString();
    const newVenue = {
      id: `venue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanedVenueName,
      createdAt: now,
      updatedAt: now,
    };

    GP_POLICE_APP_KEYS.forEach((key) => localStorage.removeItem(key));

    const nextVenueState = {
      currentVenueId: newVenue.id,
      venues: [...(venueState.venues || []), newVenue],
    };
    saveVenueStateToStorage(nextVenueState);

    const venueData = readVenueData();
    venueData[newVenue.id] = {
      updatedAt: now,
      data: {},
    };
    safeSetLocalStorageValue(VENUE_STORAGE_KEYS.VENUE_DATA, venueData);
    window.location.reload();
  };

  const handleRenameCurrentVenue = () => {
    if (!adminUnlocked) {
      setVenueMessage("Unlock admin before renaming a venue.");
      return;
    }

    const currentVenueId = String(venueState.currentVenueId || "");
    const currentVenueRecord = (venueState.venues || []).find((venue: any) => venue.id === currentVenueId);

    if (!currentVenueId || !currentVenueRecord) {
      setVenueMessage("No current venue found to rename.");
      return;
    }

    const venueName = window.prompt("Rename this venue:", getVenueDisplayName(currentVenueRecord));
    if (venueName === null) return;

    const cleanedVenueName = String(venueName || "").trim();
    if (!cleanedVenueName) {
      setVenueMessage("Venue name cannot be blank.");
      return;
    }

    createEmergencyBackup("rename_venue");

    const now = new Date().toISOString();
    const nextVenueState = {
      ...venueState,
      currentVenueId,
      venues: (venueState.venues || []).map((venue: any) =>
        venue.id === currentVenueId ? { ...venue, name: cleanedVenueName, updatedAt: now } : venue
      ),
    };

    const saved = saveVenueStateToStorage(nextVenueState);
    if (!saved) {
      setVenueMessage("Rename blocked — venue storage failed validation.");
      return;
    }

    setVenueState(nextVenueState);
    setVenueMessage("Venue renamed safely.");
  };

  const handleDeleteCurrentVenue = () => {
    if (!adminUnlocked) {
      setVenueMessage("Unlock admin before deleting a venue.");
      return;
    }

    const venues = Array.isArray(venueState.venues) ? venueState.venues : [];
    const currentVenueId = String(venueState.currentVenueId || "");
    const currentVenueRecord = venues.find((venue: any) => venue.id === currentVenueId);

    if (!currentVenueId || !currentVenueRecord) {
      setVenueMessage("No current venue found to delete.");
      return;
    }

    if (venues.length <= 1) {
      setVenueMessage("Cannot delete the last venue. GP Police needs one safe hideout.");
      return;
    }

    const fallbackVenue = venues.find((venue: any) => venue.id !== currentVenueId);
    if (!fallbackVenue?.id) {
      setVenueMessage("Delete blocked — no safe fallback venue found.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${getVenueDisplayName(currentVenueRecord)}? GP Police will back up first, then switch to ${getVenueDisplayName(fallbackVenue)}.`
    );
    if (!confirmed) return;

    createEmergencyBackup("delete_venue");
    saveVenueSnapshotForId(currentVenueId, false);

    const now = new Date().toISOString();
    const nextVenueState = {
      currentVenueId: fallbackVenue.id,
      venues: venues
        .filter((venue: any) => venue.id !== currentVenueId)
        .map((venue: any) => (venue.id === fallbackVenue.id ? { ...venue, updatedAt: now } : venue)),
    };

    const venueData = readVenueData();
    delete venueData[currentVenueId];
    safeSetLocalStorageValue(VENUE_STORAGE_KEYS.VENUE_DATA, venueData);

    const saved = saveVenueStateToStorage(nextVenueState);
    if (!saved) {
      setVenueMessage("Delete blocked — venue storage failed validation.");
      return;
    }

    restoreGpPoliceAppStorage(venueData[fallbackVenue.id]?.data || {});
    window.location.reload();
  };

  const safeBackupFileNamePart = (value: string) => {
    return String(value || "venue")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "venue";
  };

  const handleDownloadVenueBackup = () => {
    const currentVenueId = String(venueState.currentVenueId || "");
    const currentVenueRecord = (venueState.venues || []).find((venue: any) => venue.id === currentVenueId);
    const venueData = readVenueData();
    const savedVenueData = currentVenueId ? venueData[currentVenueId]?.data : null;

    if (!currentVenueId || !savedVenueData) {
      setVenueMessage("No data to export — save the venue first.");
      return;
    }

    const now = new Date().toISOString();
    const exportPayload = {
      app: "GP Police",
      version: "1.0",
      exportedAt: now,
      venue: {
        id: currentVenueId,
        name: currentVenueRecord?.name || "GP Police Venue",
      },
      data: savedVenueData,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const dateStamp = now.slice(0, 10);
    anchor.href = url;
    anchor.download = `gp-police-backup-${safeBackupFileNamePart(exportPayload.venue.name)}-${dateStamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setVenueMessage("Backup downloaded — your kitchen is safe.");
  };

  const handleVenueBackupFileUpload = (file: File | null) => {
    if (!file) return;

    const fileName = String(file.name || "").toLowerCase();
    if (!fileName.endsWith(".json")) {
      setPendingVenueBackup(null);
      setVenueMessage("Invalid backup file — not a GP Police export.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsedBackup = JSON.parse(String(reader.result || ""));
        if (!parsedBackup || parsedBackup.app !== "GP Police" || !parsedBackup.data || typeof parsedBackup.data !== "object" || Array.isArray(parsedBackup.data)) {
          setPendingVenueBackup(null);
          setVenueMessage("Invalid backup file — not a GP Police export.");
          return;
        }

        setPendingVenueBackup(parsedBackup);
        setVenueMessage(`Backup loaded for ${parsedBackup.venue?.name || "Imported Venue"}. Choose how to restore it.`);
      } catch (error) {
        console.error("Failed reading venue backup", error);
        setPendingVenueBackup(null);
        setVenueMessage("Invalid backup file — not a GP Police export.");
      }
    };
    reader.onerror = () => {
      setPendingVenueBackup(null);
      setVenueMessage("Invalid backup file — not a GP Police export.");
    };
    reader.readAsText(file);
  };

  const handleRestoreBackupIntoCurrentVenue = () => {
    if (!pendingVenueBackup?.data || typeof pendingVenueBackup.data !== "object") {
      setVenueMessage("Invalid backup file — not a GP Police export.");
      return;
    }

    const currentVenueId = String(venueState.currentVenueId || "");
    if (!currentVenueId) {
      setVenueMessage("Choose or create a venue before restoring a backup.");
      return;
    }

    const confirmed = window.confirm("Restore this backup into the current venue? GP Police will make an emergency backup first.");
    if (!confirmed) return;

    createEmergencyBackup("manual_backup");
    restoreGpPoliceAppStorage(pendingVenueBackup.data);

    const now = new Date().toISOString();
    const venueData = readVenueData();
    venueData[currentVenueId] = {
      updatedAt: now,
      data: pendingVenueBackup.data,
    };
    safeSetLocalStorageValue(VENUE_STORAGE_KEYS.VENUE_DATA, venueData);

    const nextVenueState = {
      ...venueState,
      venues: (venueState.venues || []).map((venue: any) =>
        venue.id === currentVenueId ? { ...venue, updatedAt: now } : venue
      ),
    };
    saveVenueStateToStorage(nextVenueState);
    window.location.reload();
  };

  const handleImportBackupAsNewVenue = () => {
    if (!pendingVenueBackup?.data || typeof pendingVenueBackup.data !== "object") {
      setVenueMessage("Invalid backup file — not a GP Police export.");
      return;
    }

    const importedVenueName = String(pendingVenueBackup.venue?.name || "Imported Venue").trim() || "Imported Venue";
    const confirmed = window.confirm(`Import ${importedVenueName} as a new venue? GP Police will make an emergency backup first.`);
    if (!confirmed) return;

    createEmergencyBackup("manual_backup");
    saveVenueSnapshotForId(venueState.currentVenueId, false);

    const now = new Date().toISOString();
    const newVenue = {
      id: `venue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${importedVenueName} (Imported)`,
      createdAt: now,
      updatedAt: now,
    };

    const nextVenueState = {
      currentVenueId: newVenue.id,
      venues: [...(venueState.venues || []), newVenue],
    };
    saveVenueStateToStorage(nextVenueState);

    const venueData = readVenueData();
    venueData[newVenue.id] = {
      updatedAt: now,
      data: pendingVenueBackup.data,
    };
    safeSetLocalStorageValue(VENUE_STORAGE_KEYS.VENUE_DATA, venueData);

    restoreGpPoliceAppStorage(pendingVenueBackup.data);
    window.location.reload();
  };

  const handleRecipeFormChange = (field: string, value: any) => {
    setRecipeForm((previous: any) => ({
      ...previous,
      [field]: value,
    }));
  };

  const startNewSupplierLine = () => {
    setIngredientForm(defaultIngredientForm);
    setIngredientSupplierName("");
    setPurchasePriceInputValue("");
    setIsPurchasePriceFocused(false);
    setShowSupplierLineForm(true);
    setActiveView("ordering");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearRecipeForm = () => {
    const hasContent =
      recipeForm.name ||
      recipeForm.category ||
      recipeForm.yieldAmount ||
      recipeForm.portionSize ||
      recipeForm.sellPrice ||
      recipeForm.components.length > 0;

    if (hasContent) {
      const confirmed = window.confirm("Clear this recipe form? All that hard work in the bin?");
      if (!confirmed) return;
    }

    setRecipeForm(defaultRecipeForm);
  };

  const clearImportedRecipeReview = () => {
    setRecipeImportText("");
    setImportedRecipeDraft(null);
    setRecipeImportMessage("");
    if (recipeImportFileInputRef.current) {
      recipeImportFileInputRef.current.value = "";
    }
  };

  const importRecipeFromText = () => {
    setImportedRecipeDraft(null);
    const draft = buildImportedRecipeDraftFromText(recipeImportText, supplierIngredients, recipeForm.recipeType);

    if (!draft) {
      setRecipeImportMessage("Paste a recipe in first. Even GP Police can't cost thin air.");
      window.alert("Paste a recipe in first. Even GP Police App can't cost thin air.");
      return;
    }

    if (!draft.method && draft.lines.length === 0) {
      setImportedRecipeDraft(null);
      setRecipeImportMessage("Only the recipe name was recognised. Paste title, ingredients, and method on separate lines.");
      window.alert("Only the recipe name was recognised. Paste title, ingredients, and method on separate lines.");
      return;
    }

    const matchedCount = draft.lines.filter((line: any) => line.status === "matched").length;
    const attentionCount = draft.lines.filter((line: any) => line.status !== "matched" && line.status !== "ignored").length;
    setImportedRecipeDraft(draft);
    setRecipeImportMessage(`Recipe imported. ${matchedCount} line${matchedCount === 1 ? "" : "s"} matched, ${attentionCount} need attention. Check the lines below, then save.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateImportedRecipeDraftField = (field: string, value: any) => {
    setImportedRecipeDraft((previous: any) => previous ? { ...previous, [field]: value } : previous);
  };

  const updateImportedRecipeDraftLine = (lineId: string, field: string, value: any) => {
    setImportedRecipeDraft((previous: any) => {
      if (!previous) return previous;
      const lines = previous.lines.map((line: any) => {
        if (line.id !== lineId) return line;

        if (field === "matchedIngredientId") {
          const matchedIngredient = supplierIngredients.find((ingredient: any) => ingredient.id === value);
          return {
            ...line,
            matchedIngredientId: value || null,
            matchedIngredientName: matchedIngredient?.name || null,
            ingredientName: matchedIngredient?.name || line.ingredientName,
            status: value ? (line.quantity ? "matched" : "needs_qty") : "needs_match",
          };
        }

        const nextLine = { ...line, [field]: value };
        if (field === "quantity" || field === "unit" || field === "ingredientName") {
          nextLine.status = nextLine.matchedIngredientId
            ? safeNumber(nextLine.quantity) > 0
              ? "matched"
              : "needs_qty"
            : "needs_match";
        }
        return nextLine;
      });

      return { ...previous, lines };
    });
  };

  const ignoreImportedRecipeDraftLine = (lineId: string) => {
    setImportedRecipeDraft((previous: any) => {
      if (!previous) return previous;
      return {
        ...previous,
        lines: previous.lines.map((line: any) =>
          line.id === lineId ? { ...line, status: line.status === "ignored" ? (line.matchedIngredientId ? "matched" : "needs_match") : "ignored" } : line
        ),
      };
    });
  };

  const importedDraftToRecipeForm = (draft: any) => {
    const recipeType = normalizeImportedRecipeType(draft.type);
    const components = (draft.lines || [])
      .filter((line: any) => line.status !== "ignored")
      .map((line: any) => ({
        id: `component_import_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        componentType: "supplier",
        linkedId: line.matchedIngredientId || "",
        quantity: line.quantity === "" ? "" : safeNumber(line.quantity),
        unit: normalizeImportedUnitForComponent(line.unit),
        section: "Imported",
        importedName: line.ingredientName,
      }));

    return {
      ...defaultRecipeForm,
      name: String(draft.name || "").trim(),
      recipeType,
      category: String(draft.category || "").trim(),
      notes: String(draft.method || "").trim(),
      yieldAmount: recipeType === "final dish" ? "" : draft.yieldAmount,
      yieldUnit: draft.yieldUnit || (recipeType === "final dish" ? "each" : "g"),
      components,
    };
  };

  const editImportedRecipeInFullForm = () => {
    if (!importedRecipeDraft) return;
    setRecipeForm(importedDraftToRecipeForm(importedRecipeDraft));
    setImportedRecipeDraft(null);
    setRecipeImportMessage("Imported recipe moved into the full form. Finish any loose lines, then save.");
    window.setTimeout(() => {
      document.getElementById("recipe-full-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const saveImportedRecipeDraft = () => {
    if (!importedRecipeDraft) return;

    const draft = importedRecipeDraft;
    const recipeType = normalizeImportedRecipeType(draft.type);
    if (!String(draft.name || "").trim()) {
      setRecipeImportMessage("Recipe name required before saving.");
      return;
    }
    if (recipeType !== "final dish" && safeNumber(draft.yieldAmount) <= 0) {
      setRecipeImportMessage("Yield required before saving this recipe.");
      return;
    }

    const activeLines = (draft.lines || []).filter((line: any) => line.status !== "ignored");
    const unmatchedLines = activeLines.filter((line: any) => !line.matchedIngredientId);
    if (unmatchedLines.length > 0) {
      setRecipeImportMessage(`Match ${unmatchedLines.length} ingredient${unmatchedLines.length === 1 ? "" : "s"} before saving.`);
      return;
    }

    const invalidQtyLines = activeLines.filter((line: any) => safeNumber(line.quantity) <= 0 || !line.unit || line.unit === "to taste");
    if (invalidQtyLines.length > 0) {
      setRecipeImportMessage(`Fix quantity/unit on ${invalidQtyLines.length} line${invalidQtyLines.length === 1 ? "" : "s"} before saving.`);
      return;
    }

    const payload = {
      ...importedDraftToRecipeForm(draft),
      id: `recipe_${Date.now()}`,
      name: String(draft.name || "").trim(),
      category: String(draft.category || "").trim(),
      notes: String(draft.method || "").trim(),
      yieldAmount: recipeType === "final dish" ? 1 : safeNumber(draft.yieldAmount),
      yieldUnit: recipeType === "final dish" ? "each" : draft.yieldUnit,
      portionSize: 0,
      sellPrice: 0,
    };

    createEmergencyBackupSnapshot("save_imported_recipe");

    setRecipes((previous: any) => [...previous, payload]);
    setImportedRecipeDraft(null);
    setRecipeImportText("");
    setRecipeImportMessage("Recipe saved.");
    setActiveView("recipes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRecipeImportFileUpload = (file: File | null) => {
    if (!file) return;

    const fileName = String(file.name || "").toLowerCase();
    const resetRecipeImportInput = () => {
      if (recipeImportFileInputRef.current) {
        recipeImportFileInputRef.current.value = "";
      }
    };

    const loadImportedRecipeText = (importedText: string) => {
      const cleanText = String(importedText || "").trim();

      if (!cleanText) {
        const message = "Could not read that recipe file. Try saving as .txt or paste the recipe text.";
        setRecipeImportMessage(message);
        window.alert(message);
        resetRecipeImportInput();
        return;
      }

      setImportedRecipeDraft(null);
      setRecipeImportText(cleanText);
      setRecipeImportMessage("Recipe file loaded. Hit Bring In Recipe Text to review it before saving.");
      resetRecipeImportInput();
    };

    if (fileName.endsWith(".doc") && !fileName.endsWith(".docx")) {
      const message = "Old .doc files are not supported. Save it as .docx or .txt, then import again.";
      setRecipeImportMessage(message);
      window.alert(message);
      resetRecipeImportInput();
      return;
    }

    if (fileName.endsWith(".docx")) {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          // @ts-ignore - dynamic Word import dependency is loaded at runtime.
          const mammothModule = await import("mammoth");
          const mammothReader = (mammothModule as any).default || mammothModule;
          const result = await mammothReader.extractRawText({ arrayBuffer });
          loadImportedRecipeText(result.value || "");
        } catch (error) {
          console.error("Could not read Word recipe file", error);
          const message = "Could not read that Word file. Try saving as .txt or paste the recipe text.";
          setRecipeImportMessage(message);
          window.alert(message);
          resetRecipeImportInput();
        }
      };

      reader.onerror = () => {
        const message = "Could not read that Word file. Try saving as .txt or paste the recipe text.";
        setRecipeImportMessage(message);
        window.alert(message);
        resetRecipeImportInput();
      };

      reader.readAsArrayBuffer(file);
      return;
    }

    if (!fileName.endsWith(".txt")) {
      const message = "Upload a .txt or .docx recipe file, or paste the recipe text into the box.";
      setRecipeImportMessage(message);
      window.alert(message);
      resetRecipeImportInput();
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      loadImportedRecipeText(String(reader.result || ""));
    };

    reader.onerror = () => {
      const message = "Could not read that recipe file. Try saving as .txt or paste the recipe text.";
      setRecipeImportMessage(message);
      window.alert(message);
      resetRecipeImportInput();
    };

    reader.readAsText(file);
  };


  const addRecipeComponent = () => {
    setRecipeForm((previous: any) => ({
      ...previous,
      components: [
        ...previous.components,
        {
          id: `component_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          componentType: "supplier",
          linkedId: "",
          quantity: "",
          unit: "g",
          section: "Main",
        },
      ],
    }));
  };

  const quickAddSupplierIngredientToRecipe = (ingredient: any) => {
    const derived = getIngredientDerivedValues(ingredient);

    setRecipeForm((previous: any) => ({
      ...previous,
      components: [
        ...previous.components,
        {
          id: `component_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          componentType: "supplier",
          linkedId: ingredient.id,
          quantity: "",
          unit: derived.baseUnit || "g",
          section: "Main",
        },
      ],
    }));

    setRecipeIngredientSearch("");
    window.setTimeout(() => recipeIngredientSearchRef.current?.focus(), 0);
  };

  const updateRecipeComponent = (componentId: string, field: string, value: any) => {
    setRecipeForm((previous: any) => ({
      ...previous,
      components: previous.components.map((component: any) =>
        component.id === componentId ? { ...component, [field]: value } : component
      ),
    }));
  };

  const removeRecipeComponent = (componentId: string) => {
    const confirmed = window.confirm("Remove this component? Hope it wasn't carrying the dish.");
    if (!confirmed) return;

    setRecipeForm((previous: any) => ({
      ...previous,
      components: previous.components.filter((component: any) => component.id !== componentId),
    }));
  };

  const saveRecipe = (event: FormEvent) => {
    event.preventDefault();

    if (!recipeForm.name.trim()) {
      window.alert("Give the recipe a name, mate. We can't cost vibes.");
      return;
    }

    if (recipeForm.recipeType !== "final dish" && safeNumber(recipeForm.yieldAmount) <= 0) {
      window.alert("Put in a real yield. GP Police App needs something to work with.");
      return;
    }

    if (recipeForm.components.length === 0) {
      window.alert("No components? What are we costing here, air?");
      return;
    }


    const normalizedComponents = recipeForm.components.map((component: any) => ({
      ...component,
      quantity: safeNumber(component.quantity),
      section: String(component.section || "Main").trim() || "Main",
    }));

    const invalidComponent = normalizedComponents.find(
      (component: any) => !component.linkedId || safeNumber(component.quantity) <= 0
    );

    if (invalidComponent) {
      window.alert("Finish the component picks and quantities first. Half-built jobs get pinched.");
      return;
    }

    const payload = {
      ...recipeForm,
      id: recipeForm.id || `recipe_${Date.now()}`,
      name: recipeForm.name.trim(),
      category: recipeForm.category.trim(),
      notes: String(recipeForm.notes || "").trim(),
      yieldAmount: recipeForm.recipeType === "final dish" ? safeNumber(recipeForm.yieldAmount) || 1 : safeNumber(recipeForm.yieldAmount),
      yieldUnit: recipeForm.recipeType === "final dish" ? recipeForm.yieldUnit || "each" : recipeForm.yieldUnit,
      portionSize: safeNumber(recipeForm.portionSize),
      sellPrice: safeNumber(recipeForm.sellPrice),
      components: normalizedComponents,
    };

    createEmergencyBackupSnapshot("save_recipe");

    setRecipes((previous: any) => {
      if (recipeForm.id) {
        return previous.map((item: any) => (item.id === recipeForm.id ? payload : item));
      }
      return [...previous, payload];
    });

    setRecipeForm(defaultRecipeForm);
    setSelectedRecipeId(null);
    setActiveView("recipes");
  };

  const openRecipeView = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setSelectedRecipeView("detail");
    setActiveView("recipeDetail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startNewRecipe = () => {
    setRecipeForm(defaultRecipeForm);
    setSelectedRecipeId(null);
    setActiveView("recipeBuilder");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editRecipe = (recipeId: string) => {
    const recipe = recipes.find((item: any) => item.id === recipeId);
    if (!recipe) return;

    setRecipeForm({
      id: recipe.id,
      name: recipe.name || "",
      recipeType: recipe.recipeType || "batch recipe",
      category: recipe.category || "",
      notes: recipe.notes || "",
      yieldAmount: recipe.yieldAmount?.toString() || "",
      yieldUnit: recipe.yieldUnit || "g",
      portionSize: recipe.portionSize?.toString() || "",
      portionUnit: recipe.portionUnit || "g",
      sellPrice: recipe.sellPrice?.toString() || "",
      components: Array.isArray(recipe.components)
        ? recipe.components.map((component: any) => ({
            ...component,
            quantity: component.quantity?.toString() || "",
            section: component.section || "Main",
          }))
        : [],
    });

    setActiveView("recipeBuilder");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRecipe = (recipeId: string) => {
    const linkedRecipesCount = recipes.filter((recipe) =>
      (recipe.components || []).some(
        (component: any) =>
          (component.componentType === "batch" || component.componentType === "prep") &&
          component.linkedId === recipeId
      )
    ).length;

    const message =
      linkedRecipesCount > 0
        ? `This recipe is linked to ${linkedRecipesCount} other recipe(s). Delete it anyway and start a scene?`
        : "Delete this recipe? That's brave.";

    const confirmed = window.confirm(message);
    if (!confirmed) return;

    createEmergencyBackupSnapshot("delete_recipe");

    setRecipes((previous: any) => previous.filter((item: any) => item.id !== recipeId));

    if (recipeForm.id === recipeId) {
      setRecipeForm(defaultRecipeForm);
    }

    if (selectedRecipeId === recipeId) {
      setSelectedRecipeId(null);
      setSelectedRecipeView("detail");
      setActiveView("recipes");
    }
  };

  const recipePreview = useMemo(() => {
    const isFinalDish = recipeForm.recipeType === "final dish";
    const temporaryRecipe = {
      ...recipeForm,
      id: recipeForm.id || "preview_recipe",
      yieldAmount: isFinalDish ? safeNumber(recipeForm.yieldAmount) || 1 : safeNumber(recipeForm.yieldAmount),
      yieldUnit: isFinalDish ? recipeForm.yieldUnit || "each" : recipeForm.yieldUnit,
      portionSize: safeNumber(recipeForm.portionSize),
      sellPrice: safeNumber(recipeForm.sellPrice),
      components: (recipeForm.components || []).map((component: any) => ({
        ...component,
        quantity: safeNumber(component.quantity),
        section: String(component.section || "Main").trim() || "Main",
      })),
    };

    const componentDetails = temporaryRecipe.components.map((component: any) =>
      buildComponentDetail(component, ingredientLookup, computedRecipeLookup)
    );

    const totalCost = componentDetails.reduce((sum: number, item: any) => sum + safeNumber(item.lineCost), 0);
    const recipeBaseValues = isFinalDish
      ? { baseUnit: "each", costPerBaseUnit: totalCost }
      : getRecipeCostPerBaseUnit({
          totalCost,
          yieldAmount: temporaryRecipe.yieldAmount,
          yieldUnit: temporaryRecipe.yieldUnit,
        });
    const baseUnit = recipeBaseValues.baseUnit;
    const costPerBaseUnit = recipeBaseValues.costPerBaseUnit;
    const portionsPerBatch = isFinalDish ? 1 : 0;
    const costPerPortion = isFinalDish ? totalCost : 0;

    const sellPrice = safeNumber(temporaryRecipe.sellPrice);
    const foodCostPercent = sellPrice > 0 ? (costPerPortion / sellPrice) * 100 : 0;
    const grossProfitAmount = sellPrice - costPerPortion;
    const grossProfitPercent = sellPrice > 0 ? (grossProfitAmount / sellPrice) * 100 : 0;
    const targetCogsPercent = 26;
    const targetGpPercent = 74;
    const targetCogsDecimal = targetCogsPercent / 100;
    const recommendedSellPrice = isFinalDish && totalCost > 0 ? totalCost / targetCogsDecimal : 0;
    const isSellPriceBelowRecommendation = isFinalDish && sellPrice > 0 && grossProfitPercent < targetGpPercent;

    return {
      ...temporaryRecipe,
      baseUnit,
      totalCost,
      costPerBaseUnit,
      componentDetails,
      portionsPerBatch,
      costPerPortion,
      foodCostPercent,
      grossProfitAmount,
      grossProfitPercent,
      targetCogsPercent,
      targetGpPercent,
      recommendedSellPrice,
      isSellPriceBelowRecommendation,
    };
  }, [recipeForm, ingredientLookup, computedRecipeLookup]);

  const handleSidebarNavigation = (viewKey: string) => {
    const allowedViewKeys = [
      "dashboard",
      "ingredients",
      "ordering",
      "stock",
      "stocktake",
      "suppliers",
      "invoice",
      "consumables",
      "posSales",
      "recipes",
      "recipeBuilder",
      "recipeDetail",
      "recipePrepSheet",
      "menu",
    ];
    const safeViewKey = allowedViewKeys.includes(viewKey) ? viewKey : "dashboard";

    setDashboardFolderView(null);
    setSupplierInvoiceViewOpen(false);
    setActiveView(safeViewKey);
    if (safeViewKey !== "recipes" && safeViewKey !== "recipeDetail" && safeViewKey !== "recipePrepSheet") {
      setSelectedRecipeId(null);
    }
    if (safeViewKey !== "recipePrepSheet") {
      setSelectedRecipeView("detail");
    }
    if (isMobileViewport) {
      setIsMobileMenuOpen(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const handleOpenInvoiceCamera = () => {
    const firstSupplierId = selectedSupplierId || (Array.isArray(supplierDirectory) && supplierDirectory[0]?.id ? supplierDirectory[0].id : "");

    if (firstSupplierId && !selectedSupplierId) {
      setSelectedSupplierId(firstSupplierId);
    }

    setDashboardFolderView(null);
    setSupplierInvoiceViewOpen(true);
    setActiveView("suppliers");
    setIsMobileMenuOpen(false);

    window.setTimeout(() => {
      invoiceCameraInputRef.current?.click();
      const invoicePanel = document.getElementById("supplier-invoice-import");
      invoicePanel?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  };

  const currentVenue = (Array.isArray(venueState.venues) ? venueState.venues : []).find((venue: any) => venue.id === venueState.currentVenueId) || null;

  const handlePasswordSubmit = (event: FormEvent) => {
    event.preventDefault();

    const cleanInput = passwordInput.trim();
    const currentVenueId = String(venueState.currentVenueId || "");
    const venueData = readVenueData();
    const savedVenueRecord = currentVenueId ? venueData[currentVenueId] || {} : {};
    const savedVenuePassword =
      savedVenueRecord?.password ||
      savedVenueRecord?.venuePassword ||
      savedVenueRecord?.accessPassword ||
      savedVenueRecord?.data?.password ||
      savedVenueRecord?.data?.venuePassword ||
      savedVenueRecord?.data?.accessPassword ||
      "";


    const validPasswords = [
      currentVenue?.password,
      currentVenue?.venuePassword,
      currentVenue?.accessPassword,
      savedVenuePassword,
      DEFAULT_ADMIN_PASSWORD,
    ].filter(Boolean);

    if (cleanInput === DEFAULT_ADMIN_PASSWORD) {
      setAdminUnlocked(true);
    }

    if (validPasswords.includes(cleanInput)) {
      setAuthenticated(true);
      setPasswordError("");
      setPasswordInput("");
      return;
    }

    setPasswordError("Wrong password");
  };

  const handleAdminUnlock = () => {
    if (adminUnlocked) return;

    const enteredPassword = window.prompt("Enter admin password:");
    const cleanInput = String(enteredPassword || "").trim();

    if (cleanInput === DEFAULT_ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setVenueMessage("Admin unlocked.");
      return;
    }

    if (enteredPassword !== null) {
      setVenueMessage("Admin password incorrect.");
    }
  };

  const handleAdminLock = () => {
    setAdminUnlocked(false);
    setPendingVenueBackup(null);
    setVenueMessage("Admin locked. Venue controls are back in the safe.");
  };

  const { renderVenueSelector } = createAdminPageRenderers({
    styles,
    venueState,
    venueMessage,
    currentVenue,
    adminUnlocked,
    handleAdminUnlock,
    handleAdminLock,
    handleSwitchVenue,
    handleCreateVenue,
    handleRenameCurrentVenue,
    handleDeleteCurrentVenue,
    handleSaveVenueSnapshot,
    getVenueDisplayName,
    venueBackupInputRef,
    handleDownloadVenueBackup,
    handleVenueBackupFileUpload,
    restoreEmergencyBackup,
    backupHistory,
    restoreFromSnapshot,
    pendingVenueBackup,
    handleRestoreBackupIntoCurrentVenue,
    handleImportBackupAsNewVenue,
  });

  const getActiveViewLabel = () => {
    if (activeView === "dashboard") return "Main Hideout";
    if (activeView === "ingredients") return "Manage Ingredients";
    if (activeView === "ordering") return "Inventory / Ordering";
    if (activeView === "stock") return "Stock";
    if (activeView === "stocktake") return "Stocktake";
    if (activeView === "suppliers") return "Suppliers";
    if (activeView === "invoice") return "Invoice Folder";
    if (activeView === "consumables") return "Consumables";
    if (activeView === "posSales") return "POS Sales";
    if (activeView === "recipes") return "Recipes";
    if (activeView === "recipeBuilder") return recipeForm.id ? "Fix Recipe" : "Build Recipe";
    if (activeView === "recipeDetail") return selectedRecipe?.name || "Recipe Detail";
    if (activeView === "recipePrepSheet") return selectedRecipe?.name || "Prep Sheet";
    if (activeView === "menu") return "Damage Report";
    return "GP Police App";
  };

  const getLockedInvoiceRowCogsTypeForConsumables = (row: any) => {
    const rawType = String(row?.cogsType || row?.cogsCategory || "unknown").trim().toLowerCase();
    if (["consumable", "consumables", "consumable_cogs", "consumable cogs", "kitchen consumables"].includes(rawType)) {
      return "consumable_cogs";
    }
    return rawType;
  };

  const getConsumableItemCategory = (row: any) => {
    const text = [row?.category, row?.name, row?.rawLine]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (/\b(napkin|napkins|serviette|serviettes)\b/.test(text)) return "Napkins / serviettes";
    if (/\b(takeaway|take away|container|containers|box|boxes|lid|lids|bowl|bowls|cup|cups)\b/.test(text)) return "Takeaway boxes / containers";
    if (/\b(glove|gloves|nitrile|latex|vinyl)\b/.test(text)) return "Gloves";
    if (/\b(foil|alfoil|cling|wrap|baking paper|greaseproof)\b/.test(text)) return "Foil / wrap / paper";
    if (/\b(packaging|bag|bags|label|labels|straw|straws|cutlery|fork|forks|knife|knives|spoon|spoons|skewer|toothpick)\b/.test(text)) return "Packaging / disposables";
    return "Unknown consumables";
  };

  const escapeConsumablesCsvValue = (value: any) => {
    const text = String(value ?? "");
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const consumablesTrackingReport = useMemo(() => {
    const lockedInvoices = Array.isArray(lockedInvoiceHistory) ? lockedInvoiceHistory : [];
    const today = new Date();
    const thisWeekKey = getMondayWeekStart(today);
    const lastWeekKey = getPreviousMondayWeekStart(today);

    const rows = lockedInvoices.flatMap((invoice: any) => {
      const invoiceRows = Array.isArray(invoice?.rows) ? invoice.rows : [];
      return invoiceRows
        .filter((row: any) => getLockedInvoiceRowCogsTypeForConsumables(row) === "consumable_cogs")
        .map((row: any) => {
          const date = String(invoice?.date || invoice?.invoiceDate || row?.date || "").slice(0, 10);
          const total = safeNumber(row?.lineTotal || row?.total || row?.amount || row?.purchasePrice);
          const mappedRow = {
            id: String(row?.id || `consumable_${invoice?.id || Date.now()}_${String(row?.name || "line").replace(/[^a-z0-9]+/gi, "_")}`),
            invoiceId: invoice?.invoiceId || invoice?.id || "",
            invoiceNumber: invoice?.invoiceNumber || "",
            supplierName: invoice?.supplierName || row?.supplierName || "Unassigned Supplier",
            date,
            name: row?.name || "Unnamed consumable",
            qty: row?.qty || "",
            unit: row?.unit || "",
            lineTotal: total,
            category: row?.category || "Kitchen consumables / packaging",
            rawLine: row?.rawLine || "",
          };

          return {
            ...mappedRow,
            itemCategory: getConsumableItemCategory(mappedRow),
          };
        });
    });

    const totalConsumablesSpend = rows.reduce((sum: number, row: any) => sum + safeNumber(row.lineTotal), 0);
    const thisWeekConsumablesSpend = rows.reduce((sum: number, row: any) => {
      return getMondayWeekStart(row.date || new Date()) === thisWeekKey ? sum + safeNumber(row.lineTotal) : sum;
    }, 0);
    const lastWeekConsumablesSpend = rows.reduce((sum: number, row: any) => {
      return getMondayWeekStart(row.date || new Date()) === lastWeekKey ? sum + safeNumber(row.lineTotal) : sum;
    }, 0);

    const supplierBreakdown = Object.values(
      rows.reduce((accumulator: Record<string, any>, row: any) => {
        const supplierName = String(row.supplierName || "Unassigned Supplier").trim() || "Unassigned Supplier";
        if (!accumulator[supplierName]) {
          accumulator[supplierName] = { supplierName, total: 0, rowCount: 0, lastInvoiceDate: "" };
        }
        accumulator[supplierName].total += safeNumber(row.lineTotal);
        accumulator[supplierName].rowCount += 1;
        if (row.date && (!accumulator[supplierName].lastInvoiceDate || String(row.date) > String(accumulator[supplierName].lastInvoiceDate))) {
          accumulator[supplierName].lastInvoiceDate = row.date;
        }
        return accumulator;
      }, {})
    ).sort((a: any, b: any) => safeNumber(b.total) - safeNumber(a.total));

    const itemBreakdown = Object.values(
      rows.reduce((accumulator: Record<string, any>, row: any) => {
        const itemCategory = String(row.itemCategory || "Unknown consumables").trim() || "Unknown consumables";
        if (!accumulator[itemCategory]) {
          accumulator[itemCategory] = { itemCategory, total: 0, rowCount: 0, lastInvoiceDate: "" };
        }
        accumulator[itemCategory].total += safeNumber(row.lineTotal);
        accumulator[itemCategory].rowCount += 1;
        if (row.date && (!accumulator[itemCategory].lastInvoiceDate || String(row.date) > String(accumulator[itemCategory].lastInvoiceDate))) {
          accumulator[itemCategory].lastInvoiceDate = row.date;
        }
        return accumulator;
      }, {})
    ).sort((a: any, b: any) => safeNumber(b.total) - safeNumber(a.total));

    const recentLines = rows
      .slice()
      .sort((a: any, b: any) => String(b.date || "").localeCompare(String(a.date || "")))
      .slice(0, 25);

    return {
      rows,
      totalConsumablesSpend,
      thisWeekConsumablesSpend,
      lastWeekConsumablesSpend,
      supplierBreakdown,
      itemBreakdown,
      recentLines,
    };
  }, [lockedInvoiceHistory]);

  const exportConsumablesCsv = () => {
    const rows = Array.isArray(consumablesTrackingReport.rows) ? consumablesTrackingReport.rows : [];

    if (rows.length === 0) {
      window.alert("No consumables to export yet. Lock an invoice with consumable COGS rows first.");
      return;
    }

    const header = ["date", "supplier", "invoiceNumber", "itemName", "qty", "unit", "lineTotal", "category"];
    const csvRows = rows.map((row: any) => [
      row.date || "",
      row.supplierName || "",
      row.invoiceNumber || "",
      row.name || "",
      row.qty || "",
      row.unit || "",
      safeNumber(row.lineTotal).toFixed(2),
      row.itemCategory || row.category || "Unknown consumables",
    ]);

    const csvText = [header, ...csvRows]
      .map((columns) => columns.map(escapeConsumablesCsvValue).join(","))
      .join("\n");

    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gp-police-consumables-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };



  const getInvoiceConfidenceBadgeStyle = (confidence: string): CSSProperties => {
    if (confidence === "high") return { ...styles.statusBadge, background: "rgba(34, 197, 94, 0.18)", borderColor: "rgba(34, 197, 94, 0.45)", color: "#bbf7d0" };
    if (confidence === "medium") return { ...styles.statusBadge, background: "rgba(250, 204, 21, 0.18)", borderColor: "rgba(250, 204, 21, 0.45)", color: "#fef08a" };
    return { ...styles.statusBadge, background: "rgba(248, 113, 113, 0.18)", borderColor: "rgba(248, 113, 113, 0.45)", color: "#fecaca" };
  };

  const getInvoiceStatusLabel = (row: any) => {
    if (row?.selected === false || row?.status === "ignore") return "Ignored";
    if (row?.status === "matched" && row?.linkedIngredientId) return "Matched";
    if (row?.status === "create_new" || row?.createNewIngredient) return "Create New";
    if (row?.confidence === "low") return "Low Confidence";
    return "Needs Match";
  };

  const getInvoiceStatusBadgeStyle = (row: any): CSSProperties => {
    const label = getInvoiceStatusLabel(row);
    if (label === "Matched") return { ...styles.statusBadge, background: "rgba(34, 197, 94, 0.18)", borderColor: "rgba(34, 197, 94, 0.45)", color: "#bbf7d0" };
    if (label === "Low Confidence") return { ...styles.statusBadge, background: "rgba(248, 113, 113, 0.18)", borderColor: "rgba(248, 113, 113, 0.45)", color: "#fecaca" };
    return { ...styles.statusBadge, background: "rgba(250, 204, 21, 0.18)", borderColor: "rgba(250, 204, 21, 0.45)", color: "#fef08a" };
  };

  const setAllSupplierInvoiceRowsSelected = (selected: boolean) => {
    setSupplierInvoiceRows((previous: any[]) => previous.map((row: any) => ({ ...row, selected, status: selected && row.status === "ignore" ? "needs_match" : row.status })));
  };

  const { renderConsumablesPage, renderSupplierInvoiceImportPanel } = createMiscPageRenderers({
    styles,
    exportConsumablesCsv,
    consumablesTrackingReport,
    formatCurrency,
    invoice,
    invoiceCameraInputRef,
    lockedInvoiceHistory,
    invoiceWeeklySummary,
    damageHistory,
    sizeUnitOptions,
    componentUnitOptions,
    purchaseUnitOptions,
    supplierIngredients,
    setSupplierIngredients,
    selectedSupplier,
    orderingMeta,
    getInvoiceStatusBadgeStyle,
    getInvoiceStatusLabel,
    getInvoiceConfidenceBadgeStyle,
  });


  const buildRecipeDownloadText = (recipe: any, mode = "recipe") => {
    const lines = [
      `GP Police ${mode === "prep" ? "Prep Sheet" : "Recipe"}`,
      `Name: ${recipe.name || "Untitled Recipe"}`,
      `Type: ${recipe.recipeType || "Recipe"}`,
      recipe.category ? `Category: ${recipe.category}` : "",
      recipe.recipeType !== "final dish" ? `Yield: ${roundTo(recipe.yieldAmount, 2)} ${recipe.yieldUnit}` : "",
      recipe.recipeType === "final dish" ? `Sell Price: ${formatCurrency(recipe.sellPrice)}` : "",
      recipe.recipeType === "final dish" ? `Food Cost %: ${roundTo(recipe.foodCostPercent, 2)}%` : "",
      recipe.recipeType === "final dish" ? `Gross Profit %: ${roundTo(recipe.grossProfitPercent, 2)}%` : "",
      `Total Cost: ${formatCurrency(recipe.totalCost)}`,
      "",
      "Components:",
      ...(recipe.componentDetails || []).map((component: any) => {
        const unitCost = safeNumber(component.quantity) > 0 ? safeNumber(component.lineCost) / safeNumber(component.quantity) : 0;
        return `- ${component.linkedName || "Unlinked item"}: ${roundTo(component.quantity, 2)} ${component.unit || ""} | Unit Cost ${formatCurrency(unitCost)} | Line Cost ${formatCurrency(component.lineCost)}`;
      }),
      "",
      "Method / Notes:",
      recipe.notes || "",
    ];

    return lines.filter((line) => line !== "").join("\n");
  };

  const downloadRecipeTextFile = (recipe: any, mode = "recipe") => {
    if (!recipe) return;

    const safeName = String(recipe.name || "recipe")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "recipe";
    const blob = new Blob([buildRecipeDownloadText(recipe, mode)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gp-police-${mode}-${safeName}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const {
    renderRecipesListSection,
    renderRecipeDetailSection,
    renderPrepSheetPage,
    renderRecipesPage,
    renderImportedRecipeReview,
    renderRecipeBuilderPage,
  } = createRecipePageRenderers({
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
  });

  const {
    renderDashboardPage,
    renderInvoicePage,
    renderSuppliersPage,
    renderIngredientsPage,
    renderOrderingPage,
    renderStockPage,
    renderStocktakePage,
    renderPosSalesPage,
    renderMenuSummaryPage,
  } = createPageRenderers({
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
  });






  const renderActiveView = () => {
    if ((activeView === "recipeDetail" || activeView === "recipePrepSheet") && !selectedRecipe) {
      return renderRecipesPage();
    }

    if (activeView === "dashboard") return renderDashboardPage();
    if (activeView === "ingredients") return renderIngredientsPage();
    if (activeView === "ordering") return renderOrderingPage();
    if (activeView === "stock") return renderStockPage();
    if (activeView === "stocktake") return renderStocktakePage();
    if (activeView === "suppliers") return renderSuppliersPage();
    if (activeView === "invoice") return renderInvoicePage();
    if (activeView === "consumables") return renderConsumablesPage();
    if (activeView === "posSales") return renderPosSalesPage();
    if (activeView === "recipes") return renderRecipesPage();
    if (activeView === "recipeDetail") return renderRecipeDetailSection();
    if (activeView === "recipePrepSheet") return renderPrepSheetPage();
    if (activeView === "recipeBuilder") return renderRecipeBuilderPage();
    if (activeView === "menu") return renderMenuSummaryPage();
    return renderDashboardPage();
  };

  return (
    <AppShell
      styles={styles}
      authenticated={authenticated}
      adminUnlocked={adminUnlocked}
      passwordInput={passwordInput}
      setPasswordInput={setPasswordInput}
      passwordError={passwordError}
      setPasswordError={setPasswordError}
      showPasswordInput={showPasswordInput}
      setShowPasswordInput={setShowPasswordInput}
      handleLogin={handlePasswordSubmit}
      activeView={activeView}
      activeViewLabel={getActiveViewLabel()}
      isMobileViewport={isMobileViewport}
      isMobileMenuOpen={isMobileMenuOpen}
      onToggleMobileMenu={() => setIsMobileMenuOpen((previous: any) => !previous)}
      onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      onNavigate={handleSidebarNavigation}
      renderVenueSelector={renderVenueSelector}
      renderActiveView={renderActiveView}
      startNewRecipe={startNewRecipe}
      startNewSupplierLine={startNewSupplierLine}
    />
  );
}

const styles: Record<string, CSSProperties> = {
  loginScreen: {
    backgroundRepeat: "no-repeat",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.85)), url("/images/hero.png")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    fontFamily: "Arial, sans-serif",
  },
  loginCard: {
    background: "rgba(255, 255, 255, 0.06)",
    width: "100%",
    maxWidth: 440,
    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.85)), url("/images/hero.png")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    borderRadius: 28,
    padding: 32,
    boxSizing: "border-box",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    backdropFilter: "blur(12px)",
    color: "#ffffff",
  },
  loginBadge: {
    alignSelf: "flex-start",
    background: "#111827",
    color: "#ffffff",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
  },
  loginTitle: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.1,
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.04em",
  },
  loginSubtitle: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.75)",
  },
  loginInput: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.26)",
    padding: "14px 16px",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827",
  },
  loginError: {
    fontSize: 13,
    color: "#dc2626",
    fontWeight: 600,
    minHeight: 18,
  },
  loginButton: {
    border: "none",
    borderRadius: 14,
    padding: "14px 18px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 16px 32px rgba(220,38,38,0.28)",
  },
  appShell: {
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.85)), url("/images/hero.png")`,
    display: "flex",
    minHeight: "100vh",
    background: "#0a0f19",
    color: "#e5eefc",
    fontFamily: "Arial, sans-serif",
    overflowX: "hidden",
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  appShellMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    width: "100%",
    maxWidth: "100%",
    paddingLeft: 0,
    marginLeft: 0,
  },
  mainHideoutHeroPanel: {
    backdropFilter: "blur(12px)",
    background: "rgba(255, 255, 255, 0.06)",
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    minHeight: 340,
    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.85)), url("/images/hero.png")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  mainHideoutToolCloud: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity: 0.14,
  },
  mainHideoutTool: {
    position: "absolute",
    fontSize: 54,
    filter: "drop-shadow(0 16px 18px rgba(0,0,0,0.34))",
  },
  mainHideoutHeroOverlay: {
    position: "relative",
    zIndex: 2,
    minHeight: 340,
    padding: "clamp(22px, 5vw, 48px)",
    display: "flex",
    alignItems: "center",
    color: "#ffffff",
    background: "linear-gradient(90deg, rgba(2,6,23,0.78), rgba(2,6,23,0.34))",
  },
  gpPoliceLogoMark: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 108,
    height: 108,
    borderRadius: 28,
    background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #111827 46%, #020617 100%)",
    boxShadow: "0 18px 34px rgba(0,0,0,0.34)",
    border: "1px solid rgba(255,255,255,0.22)",
  },
  gpPoliceLogoShield: {
    width: 82,
    minHeight: 82,
    borderRadius: "20px 20px 28px 28px",
    background: "linear-gradient(180deg, #111827 0%, #020617 100%)",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid rgba(251,191,36,0.9)",
    textAlign: "center",
    padding: 8,
    boxSizing: "border-box",
  },
  gpPoliceLogoTop: {
    fontSize: 24,
    fontWeight: 950,
    letterSpacing: "-0.08em",
    lineHeight: 1,
    color: "#fbbf24",
  },
  gpPoliceLogoMiddle: {
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: "0.08em",
    lineHeight: 1.2,
  },
  gpPoliceLogoBottom: {
    fontSize: 7,
    fontWeight: 900,
    letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },
  mainHideoutHeroBadge: {
    display: "inline-flex",
    width: "fit-content",
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(30,64,175,0.36)",
    border: "1px solid rgba(96,165,250,0.36)",
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  mainHideoutHeroTitle: {
    margin: 0,
    fontSize: "clamp(34px, 6vw, 64px)",
    lineHeight: 0.95,
    fontWeight: 950,
    letterSpacing: "-0.06em",
    color: "#ffffff",
    textShadow: "0 12px 34px rgba(0,0,0,0.55)",
  },
  mainHideoutHeroTagline: {
    marginTop: 6,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: 950,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  mainHideoutHeroSubtext: {
    margin: 0,
    maxWidth: 680,
    color: "rgba(255,255,255,0.75)",
    fontSize: "clamp(15px, 2vw, 19px)",
    lineHeight: 1.55,
    fontWeight: 750,
  },
  mobileTopBar: {
    position: "sticky",
    top: 0,
    left: 0,
    zIndex: 40,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    background: "rgba(15,23,42,0.96)",
    borderBottom: "1px solid rgba(148,163,184,0.18)",
    backdropFilter: "blur(12px)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    flexShrink: 0,
  },
  mobileMenuButton: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    flexShrink: 0,
  },
  mobileTopBarTitleWrap: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    gap: 4,
  },
  mobileTopBarBadge: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "#c4b5fd",
  },
  mobileTopBarTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#ffffff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  sidebar: {
    width: 320,
    flexShrink: 0,
    background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(17,24,39,0.98) 100%)",
    color: "#ffffff",
    padding: 22,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    borderRight: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "18px 0 40px rgba(2,6,23,0.28)",
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
    minHeight: "100vh",
    zIndex: 35,
  },
  sidebarMobile: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: "min(320px, 84vw)",
    maxWidth: "84vw",
    minHeight: "100dvh",
    overflowY: "auto",
    borderRight: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "24px 0 48px rgba(2,6,23,0.42)",
  },
  mobileMenuBackdrop: {
    position: "fixed",
    inset: 0,
    border: "none",
    background: "rgba(2,6,23,0.52)",
    padding: 0,
    margin: 0,
    zIndex: 30,
    cursor: "pointer",
  },
  sidebarHeader: {
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: 18,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: "-0.05em",
    marginBottom: 2,
    lineHeight: 1,
  },
  brandSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.4,
    fontWeight: 700,
  },
  brandMeta: {
    fontSize: 12,
    opacity: 0.64,
    marginTop: 2,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.4,
  },
  navList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  navButton: {
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: "14px 16px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  navButtonActive: {
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#ffffff",
    boxShadow: "0 16px 28px rgba(37,99,235,0.28)",
  },
  sidebarStats: {
    display: "grid",
    gap: 10,
    marginTop: "auto",
  },
  sidebarStatCard: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  sidebarStatLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 6,
  },
  sidebarStatValue: {
    fontSize: 22,
    fontWeight: 700,
  },
  mainContent: {
    flex: 1,
    padding: 28,
    boxSizing: "border-box",
    minWidth: 0,
    width: "100%",
    maxWidth: "100%",
    marginLeft: 0,
  },
  mainContentMobile: {
    padding: "16px 16px 112px",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    marginLeft: 0,
    paddingLeft: 16,
    paddingRight: 16,
    alignSelf: "stretch",
    overflowX: "hidden",
    boxSizing: "border-box",
  },
  pageWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    minWidth: 0,
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    paddingBottom: 120,
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  pageTitle: {
    margin: 0,
    fontSize: "clamp(28px, 6vw, 40px)",
    fontWeight: 800,
    letterSpacing: "-0.06em",
    color: "#ffffff",
    lineHeight: 1.02,
  },
  pageSubtitle: {
    margin: 0,
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.6,
    maxWidth: 900,
  },
  card: {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.85)), url("/images/hero.png")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    borderRadius: 28,
    padding: "clamp(20px, 3vw, 28px)",
    boxShadow: "0 22px 70px rgba(0,0,0,0.45), inset 0 0 40px rgba(59,130,246,0.08)",
    border: "1px solid rgba(96,165,250,0.22)",
    color: "#ffffff",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  premiumFirePanel: {
    backgroundImage: `
  linear-gradient(90deg,
    rgba(3, 7, 18, 0.60) 0%,
    rgba(3, 7, 18, 0.42) 30%,
    rgba(3, 7, 18, 0.12) 60%,
    rgba(3, 7, 18, 0.38) 100%
  ),
  linear-gradient(180deg,
    rgba(3, 7, 18, 0.00) 0%,
    rgba(3, 7, 18, 0.28) 100%
  ),
  url("/images/hero.png")
`,
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    backgroundBlendMode: "normal, multiply, normal",
    position: "relative",
    overflow: "hidden",
    minHeight: 260,
    border: "1px solid rgba(96,165,250,0.32)",
    boxShadow: "0 0 36px rgba(14, 165, 233, 0.18), inset 0 0 80px rgba(0,0,0,0.75)",
  },
  cardInset: {
    marginTop: 20,
    paddingTop: 20,
    borderTop: "1px solid #e5e7eb",
  },
  supplierPageToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  supplierListLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gap: 12,
    marginTop: 16,
  },
  supplierSummaryMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    minWidth: 0,
    overflowWrap: "anywhere",
  },
  supplierActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 10,
  },
  supplierDetailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: 12,
  },
  sectionGroupStack: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  sectionGroupCard: {
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
  },
  sectionGroupHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  sectionGroupTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#ffffff",
  },
  sectionGroupSubtotal: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#ffffff",
  },
  sectionTitleSmall: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#ffffff",
  },
  sectionSubtitle: {
    margin: 0,
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.6,
  },
  formWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    marginTop: 16,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: 16,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  formGroupButton: {
    display: "flex",
    alignItems: "flex-end",
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.75)",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827",
  },
  buttonRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#ffffff",
    border: "none",
    borderRadius: 16,
    padding: "13px 18px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(37,99,235,0.24)",
    minHeight: 48,
  },
  secondaryButton: {
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: "13px 18px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    minHeight: 48,
  },
  smallButton: {
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 12,
    padding: "10px 13px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  smallDangerButton: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: 12,
    padding: "10px 13px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  inlineButtonRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  summaryBar: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },
  summaryItem: {
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 6,
    fontWeight: 600,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
  },
  pricingGuidanceBox: {
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 18,
    background: "rgba(255, 255, 255, 0.06)",
    display: "grid",
    gap: 14,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  pricingGuidanceBoxWarning: {
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255, 255, 255, 0.06)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  pricingGuidanceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  pricingGuidanceTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: "#ffffff",
  },
  pricingGuidanceBadge: {
    borderRadius: 999,
    padding: "8px 12px",
    background: "#111827",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 900,
  },
  pricingGuidanceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },
  pricingInput: {
    width: "100%",
    border: "1px solid rgba(148,163,184,0.26)",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 16,
    fontWeight: 800,
    color: "#ffffff",
    background: "rgba(255, 255, 255, 0.06)",
    outline: "none",
  },
  pricingGuidanceMessage: {
    borderRadius: 16,
    padding: 14,
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid #86efac",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 900,
    lineHeight: 1.45,
  },
  pricingGuidanceMessageWarning: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid #fb923c",
    color: "rgba(255,255,255,0.75)",
  },
  emptyState: {
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    backdropFilter: "blur(12px)",
    padding: 18,
    borderRadius: 18,
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: 700,
  },
  emptyStatePanel: {
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    backdropFilter: "blur(12px)",
    padding: 22,
    borderRadius: 22,
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
  },
  emptyStateText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.5,
  },
  successStatePanel: {
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    backdropFilter: "blur(12px)",
    padding: 20,
    borderRadius: 20,
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  successStateTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
  },
  successStateText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.5,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
    gap: 14,
  },
  infoCard: {
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
    background: "rgba(255, 255, 255, 0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  infoCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  infoCardTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#ffffff",
  },
  infoCardSubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.4,
  },
  infoCardText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.5,
  },
  infoCardCostMain: {
    fontSize: 18,
    fontWeight: 700,
    color: "#ffffff",
  },
  dashboardSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  quickActionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: 16,
  },
  quickActionCard: {
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 22,
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 800,
    flexShrink: 0,
  },
  quickActionContent: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#ffffff",
  },
  quickActionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.5,
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: 14,
  },
  metricCard: {
    backdropFilter: "blur(12px)",
    background: "rgba(255, 255, 255, 0.06)",
    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.85)), url("/images/hero.png")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    color: "#ffffff",
    borderRadius: 22,
    padding: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  metricCardButton: {
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  metricLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 8,
    fontWeight: 600,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 700,
    color: "#ffffff",
  },
  dashboardTwoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: 16,
  },
  activityList: {
    display: "grid",
    gap: 12,
  },
  activityCard: {
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 18,
    padding: 16,
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
  },
  activityText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.4,
  },
  attentionList: {
    display: "grid",
    gap: 10,
  },
  attentionItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 18,
    background: "linear-gradient(135deg, rgba(69,26,3,0.78), rgba(127,29,29,0.58))",
    color: "rgba(255,255,255,0.75)",
    border: "1px solid rgba(251,146,60,0.42)",
  },
  attentionItemButton: {
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  attentionDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#f97316",
    marginTop: 4,
    flexShrink: 0,
  },
  attentionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.5,
  },
  dashboardStatStack: {
    display: "grid",
    gap: 12,
  },
  dashboardStatRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "12px 0",
    borderBottom: "1px solid rgba(148,163,184,0.18)",
  },
  dashboardStatName: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: 600,
  },
  dashboardStatNumber: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: 700,
  },
  sectionDivider: {
    height: 1,
    background: "#e5e7eb",
  },
  componentHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  componentList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  componentRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))",
    gap: 10,
    padding: 12,
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 16,
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    alignItems: "end",
    overflow: "hidden",
  },
  componentCostNote: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    justifyContent: "flex-end",
    minWidth: 0,
  },
  componentCostLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
  },
  componentCostValue: {
    fontSize: 15,
    fontWeight: 700,
    color: "#ffffff",
  },
  recipeToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 22,
    flexWrap: "wrap",
  },
  recipeToolbarLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  recipeToolbarSubtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    lineHeight: 1.4,
  },
  recipeToolbarRight: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    width: "100%",
  },
  recipeSearchWrap: {
    minWidth: 0,
    width: "100%",
    maxWidth: "100%",
    flex: "1 1 260px",
  },
  recipeFilterWrap: {
    minWidth: 0,
    width: "100%",
    flex: "1 1 180px",
  },
  recipeFolderList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxHeight: 520,
    overflowY: "auto",
    paddingRight: 4,
  },
  recipeFolderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 20,
    padding: 18,
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    flexWrap: "wrap",
    boxShadow: "0 16px 28px rgba(15,23,42,0.08)",
  },
  recipeFolderMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  recipeFolderName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
  },
  recipeFolderSubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
  },
  recipeFolderStats: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  recipeFolderStat: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
  recipeFolderActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  recipeDetailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 980,
    overflow: "hidden",
  },
  th: {
    textAlign: "left",
    padding: "14px 12px",
    borderBottom: "1px solid #dbe4f2",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    background: "rgba(15,23,42,0.78)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 800,
  },
  td: {
    textAlign: "left",
    padding: "14px 12px",
    borderBottom: "1px solid rgba(148,163,184,0.18)",
    fontSize: 14,
    color: "#ffffff",
    verticalAlign: "top",
    background: "rgba(15,23,42,0.45)",
  },

  formGroupFull: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    gridColumn: "1 / -1",
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: 12,
    fontSize: 14,
    fontFamily: "Arial, sans-serif",
    color: "#ffffff",
    background: "rgba(255, 255, 255, 0.06)",
    resize: "vertical",
    boxSizing: "border-box",
  },
  recipeNotesBlock: {
    whiteSpace: "pre-wrap",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#ffffff",
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 12,
    padding: 14,
  },
  prepSheetSectionStack: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  prepSheetSectionCard: {
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 14,
    padding: 16,
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  prepSheetSectionHeader: {
    fontSize: 18,
    fontWeight: 700,
    color: "#ffffff",
  },
  prepSheetItemList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  prepSheetItemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(148,163,184,0.18)",
  },
  prepSheetItemMain: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  prepSheetItemName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#ffffff",
  },
  prepSheetItemMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  prepSheetItemQty: {
    fontSize: 15,
    fontWeight: 700,
    color: "#ffffff",
    whiteSpace: "nowrap",
  },
  orderingSupplierList: {
    display: "grid",
    gap: 16,
  },
  orderingSupplierCard: {
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 22,
    padding: 20,
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxShadow: "0 18px 32px rgba(15,23,42,0.08)",
  },
  orderingSupplierHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  orderingSupplierName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#ffffff",
  },
  orderingRowList: {
    display: "grid",
    gap: 12,
  },
  orderingRowCard: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1.3fr) repeat(3, minmax(140px, 0.8fr)) minmax(180px, 1fr)",
    gap: 12,
    alignItems: "end",
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 18,
    padding: 16,
  },
  orderingRowMain: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  orderingIngredientName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#ffffff",
  },
  orderingIngredientMeta: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.4,
  },
  orderingSuggestionCard: {
    borderRadius: 18,
    padding: 14,
    background: "linear-gradient(135deg, rgba(127,29,29,0.85), rgba(37,99,235,0.55))",
    border: "1px solid #c4b5fd",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minHeight: 88,
    justifyContent: "center",
  },
  orderingSuggestionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1d4ed8",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  orderingSuggestionValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#ffffff",
  },
  orderingSuggestionCost: {
    fontSize: 13,
    color: "#1e3a8a",
    fontWeight: 600,
  },
  orderSummaryList: {
    display: "grid",
    gap: 10,
  },
  orderSummaryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
  },
  orderSummaryName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
  },
  orderSummaryMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  orderSummaryQty: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
    whiteSpace: "nowrap",
  },
  sidebarBrandBadge: {
    alignSelf: "flex-start",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(139,92,246,0.18)",
    border: "1px solid rgba(196,181,253,0.34)",
    color: "#ddd6fe",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.12em",
  },
  brandRoast: {
    fontSize: 12,
    lineHeight: 1.5,
    color: "#93c5fd",
  },
  navButtonInner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  navIcon: {
    width: 40,
    height: 40,
    minWidth: 40,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 800,
  },
  navTextWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: "inherit",
  },
  navDescription: {
    fontSize: 11,
    lineHeight: 1.35,
    color: "rgba(226,232,240,0.78)",
  },
  sidebarMiniPanel: {
    borderRadius: 22,
    padding: 16,
    background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(37,99,235,0.18) 100%)",
    border: "1px solid rgba(196,181,253,0.18)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sidebarMiniPanelTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#ffffff",
  },
  sidebarMiniPanelText: {
    fontSize: 12,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.75)",
  },
  sidebarStatCardHot: {
    background: "linear-gradient(135deg, rgba(124,58,237,0.26) 0%, rgba(37,99,235,0.26) 100%)",
  },
  dashboardHero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: 20,
    alignItems: "stretch",
  },
  dashboardHeroCopy: {
    borderRadius: 32,
    padding: 28,
    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.85)), url("/images/hero.png")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    border: "1px solid rgba(96,165,250,0.22)",
    boxShadow: "0 22px 70px rgba(0,0,0,0.45), inset 0 0 40px rgba(59,130,246,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  dashboardHeroEyebrow: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#c4b5fd",
  },
  heroButtonRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 8,
  },
  heroButtonRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },
  mobileHeroButton: {
    width: "100%",
    minHeight: 48,
    fontSize: 15,
    fontWeight: 800,
  },
  dashboardHeroAside: {
    borderRadius: 30,
    padding: 24,
    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.85)), url("/images/hero.png")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    color: "#ffffff",
    border: "1px solid rgba(96,165,250,0.22)",
    boxShadow: "0 22px 70px rgba(0,0,0,0.45), inset 0 0 40px rgba(59,130,246,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    justifyContent: "space-between",
  },
  heroAsideLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#93c5fd",
    marginBottom: 8,
  },
  heroAsideValue: {
    fontSize: 28,
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.05em",
  },
  heroAsideText: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.75)",
    fontWeight: 600,
  },
  cardAccentMetricStack: {
    display: "grid",
    gap: 12,
  },
  cardAccentMetric: {
    background: "rgba(15,23,42,0.65)",
    borderRadius: 18,
    padding: 16,
    border: "1px solid rgba(148,163,184,0.18)",
  },
  cardAccentMetricLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#93c5fd",
    marginBottom: 8,
  },
  cardAccentMetricValue: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "#ffffff",
  },
  recipeOverviewStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  recipeOverviewCard: {
    borderRadius: 22,
    padding: 18,
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
  },
  recipeOverviewCardClickable: {
    cursor: "pointer",
    textAlign: "left",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
    width: "100%",
  },
  recipeOverviewLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#ffffff",
    marginBottom: 10,
  },
  recipeCategoryHeading: {
    fontSize: 13,
    fontWeight: 800,
    color: "#4b5563",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 12,
  },
  quickAddBox: {
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    backdropFilter: "blur(12px)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    background: "rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
  },
  quickAddResults: {
    display: "grid",
    gap: 8,
  },
  quickAddResultButton: {
    width: "100%",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 14,
    background: "rgba(255, 255, 255, 0.06)",
    padding: 12,
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    textAlign: "left",
    boxSizing: "border-box",
    flexWrap: "wrap",
  },
  quickAddResultMain: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
    flex: 1,
  },
  quickAddResultName: {
    fontSize: 14,
    fontWeight: 800,
    color: "#ffffff",
    wordBreak: "break-word",
  },
  quickAddResultMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    wordBreak: "break-word",
  },
  quickAddResultCost: {
    fontSize: 13,
    fontWeight: 800,
    color: "#1d4ed8",
    whiteSpace: "normal",
    textAlign: "right",
  },
  supplierComponentStack: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  mobileActionBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 45,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    padding: "12px 16px calc(12px + env(safe-area-inset-bottom, 0px))",
    background: "rgba(15,23,42,0.96)",
    borderTop: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 -16px 32px rgba(2,6,23,0.24)",
    backdropFilter: "blur(12px)",
    boxSizing: "border-box",
  },
  smallButtonActive: {
    background: "#111827",
    color: "#ffffff",
    borderColor: "#111827",
  },
  infoCardSelected: {
    borderColor: "#111827",
    boxShadow: "0 14px 35px rgba(17, 24, 39, 0.14)",
    transform: "translateY(-1px)",
  },
  metricValueSmall: {
    fontSize: 16,
    fontWeight: 900,
    color: "#ffffff",
    lineHeight: 1.25,
    wordBreak: "break-word",
  },
  mobileActionButton: {
    width: "100%",
    minHeight: 48,
    fontSize: 15,
    fontWeight: 800,
    justifyContent: "center",
  },

  gpLogoBadge: {
    width: 70,
    height: 70,
    borderRadius: 18,
    border: "1px solid rgba(96,165,250,0.45)",
    background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.35))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: 18,
    letterSpacing: 1,
    boxShadow: "0 0 24px rgba(59,130,246,0.25)",
  },
  loginLogoImage: {
    width: "min(220px, 72vw)",
    maxWidth: "100%",
    height: "auto",
    objectFit: "contain",
    alignSelf: "center",
    filter: "drop-shadow(0 12px 28px rgba(248,113,113,0.26))",
  },
  sidebarLogoImage: {
    width: 92,
    maxWidth: "100%",
    height: "auto",
    objectFit: "contain",
    filter: "drop-shadow(0 10px 22px rgba(239,68,68,0.30))",
  },
  heroLogoBadge: {
    width: 96,
    maxWidth: "28vw",
    height: "auto",
    objectFit: "contain",
    borderRadius: 18,
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(96,165,250,0.22)",
    padding: 6,
    boxShadow: "0 18px 42px rgba(0,0,0,0.32)",
  },
  mainHideoutHeroContent: {
    position: "relative",
    zIndex: 2,
    width: "min(780px, 100%)",
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  mainHideoutHeroLogoRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },

  importActionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  importCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  importHelperText: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.5,
  },
  infoCardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  infoCardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  logoFrame: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoFrameImage: {
    width: "100%",
    maxWidth: 220,
    height: "auto",
    objectFit: "contain",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 900,
    background: "rgba(15,23,42,0.08)",
    color: "#0f172a",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },
  textareaTall: {
    minHeight: 180,
    resize: "vertical",
  },

};
