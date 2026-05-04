import { BackupPage } from "./BackupPage";

export function VenueAdminPage(props: any) {
  const {
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
  } = props;

  return (
    <div style={{ ...styles.card, ...styles.premiumFirePanel, padding: "clamp(14px, 2vw, 18px)", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ minWidth: 220, flex: "1 1 280px" }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#93c5fd" }}>
            Main Hideout Control
          </div>
          <div style={{ marginTop: 4, fontSize: 22, fontWeight: 900, color: "#f8fafc" }}>
            {getVenueDisplayName(currentVenue)}
          </div>
          {venueMessage ? <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: adminUnlocked ? "#86efac" : "#cbd5e1" }}>{venueMessage}</div> : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: "1 1 420px", alignItems: "stretch" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 38,
                padding: "8px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 950,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: adminUnlocked ? "#86efac" : "#fbbf24",
                background: adminUnlocked ? "rgba(22, 163, 74, 0.16)" : "rgba(245, 158, 11, 0.16)",
                border: adminUnlocked ? "1px solid rgba(134, 239, 172, 0.28)" : "1px solid rgba(245, 158, 11, 0.28)",
              }}
            >
              {adminUnlocked ? "Admin Unlocked" : "Admin Locked"}
            </span>
            <button
              type="button"
              style={adminUnlocked ? { ...styles.secondaryButton, borderColor: "rgba(248,113,113,0.42)", color: "#fecaca", background: "rgba(127,29,29,0.34)" } : styles.secondaryButton}
              onClick={adminUnlocked ? handleAdminLock : handleAdminUnlock}
            >
              {adminUnlocked ? "Lock Admin" : "Unlock Admin"}
            </button>
            <select
              value={venueState.currentVenueId || ""}
              onChange={(event: any) => handleSwitchVenue(event.target.value)}
              style={{ ...styles.select, minWidth: 210, maxWidth: 280, flex: "1 1 220px" }}
            >
              {(venueState.venues || []).map((venue: any) => (
                <option key={venue.id} value={venue.id}>
                  {getVenueDisplayName(venue)}
                </option>
              ))}
            </select>
          </div>

          {adminUnlocked ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
              <button type="button" style={styles.secondaryButton} onClick={handleCreateVenue}>
                Create Venue
              </button>
              <button type="button" style={styles.secondaryButton} onClick={handleRenameCurrentVenue}>
                Rename Venue
              </button>
              <button
                type="button"
                style={{ ...styles.secondaryButton, borderColor: "rgba(248,113,113,0.42)", color: "#fecaca", background: "rgba(127,29,29,0.34)" }}
                onClick={handleDeleteCurrentVenue}
              >
                Delete Venue
              </button>
              <button type="button" style={styles.primaryButton} onClick={handleSaveVenueSnapshot}>
                Save Venue Snapshot
              </button>
              <BackupPage
                styles={styles}
                venueBackupInputRef={venueBackupInputRef}
                handleDownloadVenueBackup={handleDownloadVenueBackup}
                handleVenueBackupFileUpload={handleVenueBackupFileUpload}
                restoreEmergencyBackup={restoreEmergencyBackup}
                backupHistory={backupHistory}
                restoreFromSnapshot={restoreFromSnapshot}
                pendingVenueBackup={pendingVenueBackup}
                handleRestoreBackupIntoCurrentVenue={handleRestoreBackupIntoCurrentVenue}
                handleImportBackupAsNewVenue={handleImportBackupAsNewVenue}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
