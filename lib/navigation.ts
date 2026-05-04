import type { GpPoliceNavItem } from "../types/navigation";

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
