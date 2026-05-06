import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_VENUE_ID,
  DEFAULT_VENUE_TIMESTAMP,
  GP_POLICE_APP_KEYS,
  VENUE_STORAGE_KEYS,
} from "../lib/gpPoliceConstants";
import { getVenueDisplayName } from "../lib/gpPoliceHelpers";
import {
  isValidObject,
  isValidVenueState,
  safeParse,
  safeParseRawValue,
  safeParseVenueState,
  safeRemoveLocalStorageKey,
  safeSetLocalStorageValue,
} from "../lib/storageHelpers";

type UseVenueControllerArgs = {
  adminUnlocked: boolean;
  createEmergencyBackup: (reason?: string) => void;
  readGpPoliceAppStorage: () => any;
  restoreGpPoliceAppStorage: (data: any) => void;
};

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

export function useVenueController(args: UseVenueControllerArgs) {
  const {
    adminUnlocked,
    createEmergencyBackup,
    readGpPoliceAppStorage,
    restoreGpPoliceAppStorage,
  } = args;

  const [venueState, setVenueState] = useState<any>({ currentVenueId: "", venues: [] });
  const [venueMessage, setVenueMessage] = useState("");
  const [pendingVenueBackup, setPendingVenueBackup] = useState<any>(null);
  const venueBackupInputRef = useRef<HTMLInputElement | null>(null);

  const saveVenueStateToStorage = (nextVenueState: any) => {
    if (!isValidVenueState(nextVenueState)) {
      console.warn("GP Police blocked invalid venue save", nextVenueState);
      return false;
    }

    safeSetLocalStorageValue(VENUE_STORAGE_KEYS.VENUES, nextVenueState);
    return true;
  };

  useEffect(() => {
    const fallbackVenueState = getDefaultVenueState();
    const parsedVenues = safeParseVenueState<any>(
      VENUE_STORAGE_KEYS.VENUES,
      null,
      isValidVenueState
    );

    if (!parsedVenues) {
      safeSetLocalStorageValue(VENUE_STORAGE_KEYS.VENUES, fallbackVenueState);
      setVenueState(fallbackVenueState);
      return;
    }

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


  const readVenueData = () => {
    return safeParse<Record<string, any>>(VENUE_STORAGE_KEYS.VENUE_DATA, {}, isValidObject);
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

    GP_POLICE_APP_KEYS.forEach((key) => safeRemoveLocalStorageKey(key));

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
      const parsedBackup = safeParseRawValue<Record<string, any> | null>(
        String(reader.result || ""),
        "uploaded_venue_backup",
        null,
        isValidObject
      );

      if (!parsedBackup || parsedBackup.app !== "GP Police" || !parsedBackup.data || typeof parsedBackup.data !== "object" || Array.isArray(parsedBackup.data)) {
        setPendingVenueBackup(null);
        setVenueMessage("Invalid backup file — not a GP Police export.");
        return;
      }

      setPendingVenueBackup(parsedBackup);
      setVenueMessage(`Backup loaded for ${parsedBackup.venue?.name || "Imported Venue"}. Choose how to restore it.`);
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



  const currentVenue = (Array.isArray(venueState.venues) ? venueState.venues : []).find((venue: any) => venue.id === venueState.currentVenueId) || null;

  return {
    venueState,
    setVenueState,
    venueMessage,
    setVenueMessage,
    pendingVenueBackup,
    setPendingVenueBackup,
    venueBackupInputRef,
    currentVenue,
    saveVenueStateToStorage,
    readVenueData,
    saveVenueSnapshotForId,
    handleSaveVenueSnapshot,
    handleSwitchVenue,
    handleCreateVenue,
    handleRenameCurrentVenue,
    handleDeleteCurrentVenue,
    handleDownloadVenueBackup,
    handleVenueBackupFileUpload,
    handleRestoreBackupIntoCurrentVenue,
    handleImportBackupAsNewVenue,
  };
}
