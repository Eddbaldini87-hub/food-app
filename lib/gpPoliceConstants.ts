export const STORAGE_KEYS = {
  INGREDIENTS: "foodApp_supplierIngredients_v1",
  RECIPES: "foodApp_recipes_v1",
  ORDERING: "foodApp_orderingMeta_v1",
  SUPPLIERS: "gpPolice_suppliers_v1",
  POS_SALES: "gpPolicePosSales",
  POS_MATCHES: "gpPolicePosDishMatches",
};

export const INVOICE_SPEND_STORAGE_KEY = "gpPoliceInvoiceSpend";
export const INVOICE_INTAKE_DRAFT_KEY = "gpPoliceInvoiceIntakeV2";
export const STOCK_MOVEMENTS_STORAGE_KEY = "gpPoliceStockMovementsV1";
export const LOCKED_INVOICE_HISTORY_KEY = "gpPoliceLockedInvoiceHistoryV1";

export const VENUE_STORAGE_KEYS = {
  VENUES: "gpPoliceVenues",
  VENUE_DATA: "gpPoliceVenueData",
  EMERGENCY_BACKUP: "gpPoliceEmergencyBackup",
};

export const BACKUP_HISTORY_KEY = "gpPoliceBackupHistory";
export const DEFAULT_VENUE_ID = "mother_base";
export const DEFAULT_VENUE_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export const DEFAULT_ADMIN_PASSWORD = "GPPolice_Default_2026!";

export const GP_POLICE_APP_KEYS = [
  STORAGE_KEYS.INGREDIENTS,
  STORAGE_KEYS.RECIPES,
  STORAGE_KEYS.ORDERING,
  STORAGE_KEYS.SUPPLIERS,
  STORAGE_KEYS.POS_SALES,
  STORAGE_KEYS.POS_MATCHES,
  INVOICE_SPEND_STORAGE_KEY,
  INVOICE_INTAKE_DRAFT_KEY,
  STOCK_MOVEMENTS_STORAGE_KEY,
  LOCKED_INVOICE_HISTORY_KEY,
];

export const purchaseUnitOptions = [
  "each",
  "pack",
  "box",
  "carton",
  "bottle",
  "bag",
  "bunch",
  "tray",
  "tub",
  "jar",
  "tin",
  "sleeve",
  "roll",
  "case",
];

export const sizeUnitOptions = ["g", "kg", "ml", "l", "each"];
export const recipeYieldUnitOptions = ["g", "kg", "ml", "l", "each", "serve", "portion"];
export const componentUnitOptions = ["g", "kg", "ml", "l", "each"];
export const recipeTypeOptions = ["ingredient prep", "batch recipe", "final dish"];
export const supplierDayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const defaultIngredientForm = {
  id: null,
  name: "",
  purchasePrice: "",
  purchaseUnit: "box",
  amountInPurchaseUnit: "",
  sizePerItem: "",
  sizeUnit: "kg",
  supplierName: "",
  supplierUnitCost: "",
  supplierPackSize: "",
};

export const defaultRecipeForm = {
  id: null,
  name: "",
  recipeType: "batch recipe",
  category: "",
  notes: "",
  yieldAmount: "",
  yieldUnit: "g",
  portionSize: "",
  portionUnit: "g",
  sellPrice: "",
  components: [],
};

export const defaultSupplierForm = {
  id: null,
  name: "",
  contactName: "",
  phone: "",
  email: "",
  notes: "",
  repName: "",
  orderEmail: "",
  orderPhone: "",
  orderingDays: [],
  deliveryDays: [],
  minimumOrder: "",
  accountNumber: "",
};

export type GpPoliceNavItem = {
  key: string;
  label: string;
  description: string;
  icon: string;
};

export function getGpPoliceNavItems(): GpPoliceNavItem[] {
  return [
    { key: "dashboard", label: "Main Hideout", description: "See the damage before service does.", icon: "⌁" },
    { key: "ingredients", label: "Manage Ingredients", description: "Stop costing stock off blind faith.", icon: "◫" },
    { key: "ordering", label: "Inventory / Ordering", description: "Pars, counts, and less 4pm panic ordering.", icon: "↻" },
    { key: "suppliers", label: "Suppliers", description: "Supplier files, rep details, and who sells you what.", icon: "▣" },
    { key: "invoice", label: "Invoice Folder", description: "Track weekly invoices and know your true spend.", icon: "▤" },
    { key: "posSales", label: "POS Sales", description: "Upload sales and see what is making money.", icon: "$" },
    { key: "recipes", label: "Recipes", description: "Build dishes without torching margin.", icon: "✦" },
    { key: "menu", label: "Damage Report", description: "Check GP before it checks your pockets.", icon: "◎" },
  ];
}
