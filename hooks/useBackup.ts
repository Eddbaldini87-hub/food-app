import { useEffect, useState } from "react";
import {
  BACKUP_HISTORY_KEY,
  GP_POLICE_APP_KEYS,
  INVOICE_SPEND_STORAGE_KEY,
  LOCKED_INVOICE_HISTORY_KEY,
  STOCK_MOVEMENTS_STORAGE_KEY,
  STORAGE_KEYS,
  VENUE_STORAGE_KEYS,
} from "../lib/gpPoliceConstants";
import { isValidArray, isValidObject, safeParse, safeParseRawValue, safeSetLocalStorageRaw, safeSetLocalStorageValue } from "../lib/storageHelpers";

const STOCKTAKE_STORAGE_KEY = "gpPolice_stocktake_v1";
const SUPPLIER_MATCH_MEMORY_STORAGE_KEY = "gpPoliceSupplierMatchMemory";
const DAMAGE_HISTORY_STORAGE_KEY = "gpPolice_damageHistory_v1";

type UseBackupArgs = {
  storageLoaded: boolean;
  supplierIngredients: any[];
  setSupplierIngredients: (value: any) => void;
  recipes: any[];
  setRecipes: (value: any) => void;
  orderingMeta: Record<string, any>;
  setOrderingMeta: (value: any) => void;
  suppliers: any[];
  setSuppliers: (value: any) => void;
  posSales: any[];
  setPosSales: (value: any) => void;
  posDishMatches: Record<string, string>;
  setPosDishMatches: (value: any) => void;
  invoiceSpendRecords: any[];
  setInvoiceSpendRecords: (value: any) => void;
  stockMovements: any[];
  setStockMovements: (value: any) => void;
  stocktakeRecords: any[];
  setStocktakeRecords: (value: any) => void;
  lockedInvoiceHistory: any[];
  setLockedInvoiceHistory: (value: any) => void;
  damageHistory: any[];
  setDamageHistory: (value: any) => void;
  supplierMatchMemory: Record<string, any>;
  setSupplierMatchMemory: (value: any) => void;
  invoiceDraft: any;
  venueState: any;
  setFailedStorageKeys: (value: any) => void;
};

export function useBackup(args: UseBackupArgs) {
  const {
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
    stockMovements,
    setStockMovements,
    stocktakeRecords,
    setStocktakeRecords,
    lockedInvoiceHistory,
    setLockedInvoiceHistory,
    damageHistory,
    setDamageHistory,
    supplierMatchMemory,
    setSupplierMatchMemory,
    invoiceDraft,
    venueState,
    setFailedStorageKeys,
  } = args;

  const [backupHistory, setBackupHistory] = useState<any[]>([]);

  const readGpPoliceAppStorage = () => {
    return GP_POLICE_APP_KEYS.reduce((snapshot: Record<string, string>, key: string) => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        snapshot[key] = value;
      }
      return snapshot;
    }, {});
  };

  const restoreGpPoliceAppStorage = (snapshot: Record<string, string> = {}) => {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return false;
    }

    let restoredCount = 0;

    GP_POLICE_APP_KEYS.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(snapshot, key)) {
        return;
      }

      const rawValue = snapshot[key];

      if (typeof rawValue !== "string") {
        console.warn("GP Police restore skipped bad raw storage value:", key);
        return;
      }

      const parsedValue = safeParseRawValue(rawValue, key, null);
      if (parsedValue === null) {
        console.warn("GP Police restore skipped invalid JSON value:", key);
        return;
      }

      if (safeSetLocalStorageRaw(key, rawValue)) {
        restoredCount += 1;
      }
    });

    return restoredCount > 0;
  };

  const readBackupHistory = () => {
    return safeParse<any[]>(BACKUP_HISTORY_KEY, [], isValidArray);
  };

  useEffect(() => {
    const history = readBackupHistory();
    setBackupHistory(Array.isArray(history) ? history.slice(0, 5) : []);
  }, []);

  const createEmergencyBackupSnapshot = (reason = "manual_backup") => {
    if (!storageLoaded) return null;

    try {
      const snapshot = {
        createdAt: new Date().toISOString(),
        reason,
        ingredients: supplierIngredients,
        recipes,
        orderingMeta,
        suppliers,
        posSales,
        posDishMatches,
        invoiceSpendRecords,
        stockMovements,
        stocktakeRecords,
        lockedInvoiceHistory,
        damageHistory,
        supplierMatchMemory,
        invoiceDraft,
        venueState,
        data: readGpPoliceAppStorage(),
      };

      safeSetLocalStorageValue(VENUE_STORAGE_KEYS.EMERGENCY_BACKUP, snapshot);

      const existingHistory = readBackupHistory();
      const newHistory = [snapshot, ...existingHistory].slice(0, 5);
      safeSetLocalStorageValue(BACKUP_HISTORY_KEY, newHistory);
      setBackupHistory(newHistory);

      return snapshot;
    } catch (error) {
      console.error("Failed creating emergency backup", error);
      return null;
    }
  };

  const createEmergencyBackup = (reason: string) => {
    return createEmergencyBackupSnapshot(reason);
  };

  const safeReadBackupArray = (snapshot: any, directKey: string, rawStorageKey: string) => {
    if (Array.isArray(snapshot?.[directKey])) {
      return snapshot[directKey];
    }

    if (!snapshot?.data || typeof snapshot.data !== "object" || Array.isArray(snapshot.data)) return null;
    const rawValue = snapshot.data[rawStorageKey];
    if (typeof rawValue !== "string") return null;
    const parsedValue = safeParseRawValue<any[] | null>(rawValue, rawStorageKey, null, isValidArray);
    return Array.isArray(parsedValue) ? parsedValue : null;
  };

  const safeReadBackupObject = (snapshot: any, directKey: string, rawStorageKey: string) => {
    if (snapshot?.[directKey] && typeof snapshot[directKey] === "object" && !Array.isArray(snapshot[directKey])) {
      return snapshot[directKey];
    }

    if (!snapshot?.data || typeof snapshot.data !== "object" || Array.isArray(snapshot.data)) return null;
    const rawValue = snapshot.data[rawStorageKey];
    if (typeof rawValue !== "string") return null;
    const parsedValue = safeParseRawValue<Record<string, any> | null>(rawValue, rawStorageKey, null, isValidObject);
    return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue) ? parsedValue : null;
  };

  const getBackupRestoreSafetyReport = (snapshot: any) => {
    const report = {
      hasAnyData: false,
      arraysFound: 0,
      objectsFound: 0,
      rawStorageKeysFound: 0,
    };

    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return report;
    }

    [
      "ingredients",
      "recipes",
      "suppliers",
      "posSales",
      "invoiceSpendRecords",
      "stockMovements",
      "stocktakeRecords",
      "lockedInvoiceHistory",
      "damageHistory",
    ].forEach((key) => {
      if (Array.isArray(snapshot[key])) {
        report.arraysFound += 1;
      }
    });

    ["orderingMeta", "posDishMatches", "supplierMatchMemory", "venueState"].forEach((key) => {
      if (snapshot[key] && typeof snapshot[key] === "object" && !Array.isArray(snapshot[key])) {
        report.objectsFound += 1;
      }
    });

    if (snapshot.data && typeof snapshot.data === "object" && !Array.isArray(snapshot.data)) {
      report.rawStorageKeysFound = Object.keys(snapshot.data).filter((key) => typeof snapshot.data[key] === "string").length;
    }

    report.hasAnyData = report.arraysFound > 0 || report.objectsFound > 0 || report.rawStorageKeysFound > 0;
    return report;
  };

  const restoreFromSnapshot = (snapshot: any, label = "selected backup") => {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      window.alert("Backup restore failed. The selected backup data is damaged.");
      return;
    }

    const confirmed = window.confirm(
      `Restore ${label}? This will replace the current kitchen data with the selected backup snapshot.`
    );

    if (!confirmed) return;

    try {
      const safetyReport = getBackupRestoreSafetyReport(snapshot);

      if (!safetyReport.hasAnyData) {
        window.alert("Backup restore blocked. GP Police could not find usable data in that snapshot.");
        return;
      }

      createEmergencyBackupSnapshot("pre_restore_backup");

      const backupIngredients = safeReadBackupArray(snapshot, "ingredients", STORAGE_KEYS.INGREDIENTS);
      const backupRecipes = safeReadBackupArray(snapshot, "recipes", STORAGE_KEYS.RECIPES);
      const backupOrderingMeta = safeReadBackupObject(snapshot, "orderingMeta", STORAGE_KEYS.ORDERING);
      const backupSuppliers = safeReadBackupArray(snapshot, "suppliers", STORAGE_KEYS.SUPPLIERS);
      const backupPosSales = safeReadBackupArray(snapshot, "posSales", STORAGE_KEYS.POS_SALES);
      const backupPosDishMatches = safeReadBackupObject(snapshot, "posDishMatches", STORAGE_KEYS.POS_MATCHES);
      const backupInvoiceSpendRecords = safeReadBackupArray(snapshot, "invoiceSpendRecords", INVOICE_SPEND_STORAGE_KEY);
      const backupStockMovements = safeReadBackupArray(snapshot, "stockMovements", STOCK_MOVEMENTS_STORAGE_KEY);
      const backupStocktakeRecords = safeReadBackupArray(snapshot, "stocktakeRecords", STOCKTAKE_STORAGE_KEY);
      const backupLockedInvoiceHistory = safeReadBackupArray(snapshot, "lockedInvoiceHistory", LOCKED_INVOICE_HISTORY_KEY);
      const backupDamageHistory = safeReadBackupArray(snapshot, "damageHistory", DAMAGE_HISTORY_STORAGE_KEY);
      const backupSupplierMatchMemory = safeReadBackupObject(snapshot, "supplierMatchMemory", SUPPLIER_MATCH_MEMORY_STORAGE_KEY);

      restoreGpPoliceAppStorage(snapshot.data);

      if (Array.isArray(backupIngredients)) {
        setSupplierIngredients(backupIngredients);
      }

      if (Array.isArray(backupRecipes)) {
        setRecipes(backupRecipes);
      }

      if (backupOrderingMeta && typeof backupOrderingMeta === "object" && !Array.isArray(backupOrderingMeta)) {
        setOrderingMeta(backupOrderingMeta);
      }

      if (Array.isArray(backupSuppliers)) {
        setSuppliers(backupSuppliers);
      }

      if (Array.isArray(backupPosSales)) {
        setPosSales(backupPosSales);
      }

      if (backupPosDishMatches && typeof backupPosDishMatches === "object" && !Array.isArray(backupPosDishMatches)) {
        setPosDishMatches(backupPosDishMatches);
      }

      if (Array.isArray(backupInvoiceSpendRecords)) {
        setInvoiceSpendRecords(backupInvoiceSpendRecords);
      }

      if (Array.isArray(backupStockMovements)) {
        setStockMovements(backupStockMovements);
      }

      if (Array.isArray(backupStocktakeRecords)) {
        setStocktakeRecords(backupStocktakeRecords);
      }

      if (Array.isArray(backupLockedInvoiceHistory)) {
        setLockedInvoiceHistory(backupLockedInvoiceHistory.slice(0, 25));
      }

      if (Array.isArray(backupDamageHistory)) {
        setDamageHistory(backupDamageHistory.slice(0, 100));
      }

      if (backupSupplierMatchMemory && typeof backupSupplierMatchMemory === "object" && !Array.isArray(backupSupplierMatchMemory)) {
        setSupplierMatchMemory(backupSupplierMatchMemory);
      }

      setFailedStorageKeys(new Set());

      window.alert("Emergency backup restored. GP Police restored only valid backup data and skipped anything damaged.");
    } catch (error) {
      console.warn("Failed to restore emergency backup", error);
      window.alert("Backup restore failed. The backup data may be damaged.");
    }
  };

  const restoreEmergencyBackup = () => {
    const backup = safeParse<Record<string, any> | null>(
      VENUE_STORAGE_KEYS.EMERGENCY_BACKUP,
      null,
      isValidObject
    );

    if (!backup) {
      window.alert("No usable emergency backup found.");
      return;
    }

    restoreFromSnapshot(backup, "the emergency backup");
  };

  return {
    backupHistory,
    setBackupHistory,
    readGpPoliceAppStorage,
    restoreGpPoliceAppStorage,
    readBackupHistory,
    createEmergencyBackupSnapshot,
    createEmergencyBackup,
    restoreFromSnapshot,
    restoreEmergencyBackup,
    safeReadBackupArray,
    safeReadBackupObject,
    getBackupRestoreSafetyReport,
  };
}
