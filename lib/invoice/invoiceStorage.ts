export const SUPPLIER_COGS_MEMORY_STORAGE_KEY = "gpPolice_supplierCogsMemory_v1";
export const DAMAGE_HISTORY_STORAGE_KEY = "gpPolice_damageHistory_v1";

export function isValidObject(value: unknown) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isValidArray(value: unknown) {
  return Array.isArray(value);
}

export function safeParse<T>(key: string, fallback: T, validate?: (value: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (validate && !validate(parsed)) throw new Error("Invalid data shape");
    return parsed as T;
  } catch (error) {
    console.warn("GP Police invoice hook storage parse failed:", key, error);
    return fallback;
  }
}

export function safeSetLocalStorageValue(key: string, value: unknown) {
  try {
    const serialised = JSON.stringify(value);
    localStorage.setItem(key, serialised === undefined ? "null" : serialised);
    return true;
  } catch (error) {
    console.warn("GP Police invoice hook storage save blocked:", key, error);
    return false;
  }
}
