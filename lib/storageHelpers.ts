export function isValidArray(value: unknown) {
  return Array.isArray(value);
}

export function isValidObject(value: unknown) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function safeParse<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => boolean,
  onFailure?: (key: string) => void
): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as unknown;

    if (validate && !validate(parsed)) {
      throw new Error("Invalid data shape");
    }

    return parsed as T;
  } catch (err) {
    console.warn("GP Police storage parse failed:", key, err);
    if (onFailure) {
      onFailure(key);
    }
    return fallback;
  }
}

export function safeSetLocalStorageValue(key: string, value: unknown) {
  try {
    const serialised = JSON.stringify(value);
    localStorage.setItem(key, serialised === undefined ? "null" : serialised);
    return true;
  } catch (err) {
    console.warn("GP Police storage save blocked:", key, err);
    return false;
  }
}

export function safeSetLocalStorageRaw(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn("GP Police raw storage restore blocked:", key, err);
    return false;
  }
}

export function isValidVenueArray(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      (venue: any) =>
        venue &&
        typeof venue === "object" &&
        typeof venue.id === "string" &&
        venue.id.trim().length > 0 &&
        typeof venue.name === "string" &&
        venue.name.trim().length > 0
    )
  );
}

export function isValidVenueState(value: unknown) {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    ((value as any).currentVenueId === undefined || typeof (value as any).currentVenueId === "string") &&
    isValidVenueArray((value as any).venues)
  );
}

export function safeParseVenueState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn("GP Police venue storage parse failed:", key, err);
    return fallback;
  }
}
