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
import { useSupplierIngredients } from "../hooks/useSupplierIngredients";
import { useRecipeController } from "../hooks/useRecipeController";
import { useVenueController } from "../hooks/useVenueController";
import { createPageRenderers } from "../components/pageRenderers/PageRenderers";
import { createRecipePageRenderers } from "../components/pageRenderers/RecipePageRenderers";
import { createAdminPageRenderers } from "../components/pageRenderers/AdminPageRenderers";
import { createMiscPageRenderers } from "../components/pageRenderers/MiscPageRenderers";
import { AppShell } from "../components/AppShell";
import { styles } from "../lib/pageStyles";
import { normaliseSupplierRecord, preprocessInvoiceImageForOCR } from "../lib/pageSafetyHelpers";
import {
  STORAGE_KEYS,
  INVOICE_SPEND_STORAGE_KEY,
  INVOICE_INTAKE_DRAFT_KEY,
  LOCKED_INVOICE_HISTORY_KEY,
  VENUE_STORAGE_KEYS,
  BACKUP_HISTORY_KEY,
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
  const [dashboardFolderView, setDashboardFolderView] = useState<string | null>(null);
  const invoiceCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [orderingMeta, setOrderingMeta] = useState<Record<string, any>>({});
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
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [failedStorageKeys, setFailedStorageKeys] = useState<Set<string>>(new Set());
  const [damageHistory, setDamageHistory] = useState<any[]>([]);
  const [supplierMatchMemory, setSupplierMatchMemory] = useState<Record<string, any>>({});

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

  const backupRef = useRef<(reason?: string) => any>(() => null);

  const backupBridgeRef = useRef<any>({});

  const {
    venueState,
    setVenueState,
    venueMessage,
    setVenueMessage,
    pendingVenueBackup,
    setPendingVenueBackup,
    venueBackupInputRef,
    currentVenue,
    readVenueData,
    handleSaveVenueSnapshot,
    handleSwitchVenue,
    handleCreateVenue,
    handleRenameCurrentVenue,
    handleDeleteCurrentVenue,
    handleDownloadVenueBackup,
    handleVenueBackupFileUpload,
    handleRestoreBackupIntoCurrentVenue,
    handleImportBackupAsNewVenue,
  } = useVenueController({
    adminUnlocked,
    createEmergencyBackup: (reason?: string) => backupBridgeRef.current?.createEmergencyBackup?.(reason),
    readGpPoliceAppStorage: () => backupBridgeRef.current?.readGpPoliceAppStorage?.() || {},
    restoreGpPoliceAppStorage: (data: any) => backupBridgeRef.current?.restoreGpPoliceAppStorage?.(data),
  });


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
  const {
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
  } = useSupplierIngredients({
    supplierIngredients,
    setSupplierIngredients,
    recipes,
    suppliers,
    setSuppliers,
    orderingMeta,
    setOrderingMeta,
    createEmergencyBackupSnapshot: (reason?: string) => backupRef.current(reason),
    setActiveView,
  });


  const {
    recipeForm,
    setRecipeForm,
    recipeSearchTerm,
    setRecipeSearchTerm,
    recipeTypeFilter,
    setRecipeTypeFilter,
    recipeFolderView,
    setRecipeFolderView,
    recipeIngredientSearch,
    setRecipeIngredientSearch,
    recipeIngredientSearchRef,
    recipeImportFileInputRef,
    selectedRecipeId,
    setSelectedRecipeId,
    selectedRecipeView,
    setSelectedRecipeView,
    recipeImportText,
    setRecipeImportText,
    recipeImportMessage,
    setRecipeImportMessage,
    importedRecipeDraft,
    ingredientLookup,
    computedRecipes,
    computedRecipeLookup,
    filteredRecipes,
    selectedRecipe,
    recipeFolderOptions,
    currentRecipeFolder,
    quickAddIngredientMatches,
    finalDishRecipes,
    recipesWithNoComponents,
    recipesMissingCategory,
    finalDishesWithNoSellPrice,
    needsAttentionItems,
    totalRecipeCount,
    totalFinalDishCount,
    mostRecentRecipe,
    housePrepRecipes,
    handleRecipeFormChange,
    clearRecipeForm,
    clearImportedRecipeReview,
    importRecipeFromText,
    updateImportedRecipeDraftField,
    updateImportedRecipeDraftLine,
    ignoreImportedRecipeDraftLine,
    editImportedRecipeInFullForm,
    saveImportedRecipeDraft,
    handleRecipeImportFileUpload,
    addRecipeComponent,
    quickAddSupplierIngredientToRecipe,
    updateRecipeComponent,
    removeRecipeComponent,
    saveRecipe,
    openRecipeView,
    startNewRecipe,
    editRecipe,
    deleteRecipe,
    recipePreview,
    downloadRecipeTextFile,
  } = useRecipeController({
    supplierIngredients,
    recipes,
    setRecipes,
    orderingMeta,
    createEmergencyBackupSnapshot: (reason?: string) => backupRef.current(reason),
    setActiveView,
  });

  const lowStockCount = stock.orderingRows.filter((row: any) => row.suggestedOrder > 0).length;
  const estimatedOrderSpend = stock.orderingRows.reduce((sum: number, row: any) => sum + safeNumber(row.estimatedOrderCost), 0);
  const totalIngredientCount = supplierIngredients.length;
  const mostRecentIngredient =
    supplierIngredients.length > 0 ? supplierIngredients[supplierIngredients.length - 1] : null;
  const recentSupplierIngredients = supplierIngredients.slice(-4).reverse();

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


  backupBridgeRef.current = {
    createEmergencyBackup,
    readGpPoliceAppStorage,
    restoreGpPoliceAppStorage,
  };

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

