import { DEFAULT_VENUE_ID, DEFAULT_VENUE_TIMESTAMP, defaultSupplierForm } from "./gpPoliceConstants";

export function normaliseSupplierRecord(record: any) {
  return {
    ...defaultSupplierForm,
    ...(record || {}),
    id: record?.id || `supplier_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: String(record?.name || "").trim(),
    orderingDays: Array.isArray(record?.orderingDays) ? record.orderingDays : [],
    deliveryDays: Array.isArray(record?.deliveryDays) ? record.deliveryDays : [],
  };
}

export function getDefaultVenueState() {
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

export async function preprocessInvoiceImageForOCR(file: File): Promise<Blob | File> {
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
