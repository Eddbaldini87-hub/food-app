import { safeNumber } from "./gpPoliceHelpers";

export function parseCsvRows(csvText: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(current.trim());
      if (row.some((cell) => String(cell || "").trim())) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += character;
  }

  row.push(current.trim());
  if (row.some((cell) => String(cell || "").trim())) {
    rows.push(row);
  }

  return rows;
}

export function normalizeCsvHeader(value: string) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function findCsvColumn(headers: string[], options: string[]) {
  const normalizedOptions = options.map(normalizeCsvHeader);
  return headers.findIndex((header) => normalizedOptions.includes(normalizeCsvHeader(header)));
}

export function parseMoneyLikeValue(value: any) {
  const cleaned = String(value || "").replace(/[$,]/g, "").trim();
  return safeNumber(cleaned);
}

export function parsePosSalesCsv(csvText: string) {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return { sales: [], warning: "No POS rows found. Export a CSV with a header row and sales lines." };
  }

  const headers = rows[0];
  const itemIndex = findCsvColumn(headers, ["Item Name", "Item", "Product", "Product Name", "Menu Item"]);
  const quantityIndex = findCsvColumn(headers, ["Qty", "Quantity", "Sold", "Count"]);
  const salesIndex = findCsvColumn(headers, ["Sales", "Net Sales", "Gross Sales", "Revenue", "Total"]);

  const missingColumns = [];
  if (itemIndex < 0) missingColumns.push("item name");
  if (quantityIndex < 0) missingColumns.push("quantity");
  if (salesIndex < 0) missingColumns.push("sales");

  if (missingColumns.length > 0) {
    return {
      sales: [],
      warning: `Could not find ${missingColumns.join(", ")} column${missingColumns.length === 1 ? "" : "s"}. Check the CSV headers before GP Police can call the numbers.`,
    };
  }

  const grouped: Record<string, any> = {};
  const importedAt = new Date().toISOString();

  rows.slice(1).forEach((row: any) => {
    const posItemName = String(row[itemIndex] || "").trim();
    if (!posItemName) return;

    const quantitySold = parseMoneyLikeValue(row[quantityIndex]);
    const totalSales = parseMoneyLikeValue(row[salesIndex]);
    const groupingKey = posItemName.toLowerCase();

    if (!grouped[groupingKey]) {
      grouped[groupingKey] = {
        id: `pos_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        posItemName,
        quantitySold: 0,
        totalSales: 0,
        importedAt,
      };
    }

    grouped[groupingKey].quantitySold += quantitySold;
    grouped[groupingKey].totalSales += totalSales;
  });

  const sales = Object.values(grouped).filter((row: any) => row.posItemName && (row.quantitySold > 0 || row.totalSales > 0));

  return {
    sales,
    warning: sales.length > 0 ? "" : "No valid POS sales lines were found. Check the item name, quantity, and sales columns.",
  };
}
