export function BackupPage(props: any) {
  const {
    styles,
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
    <>
      <button type="button" style={styles.secondaryButton} onClick={handleDownloadVenueBackup}>
        Download Venue Backup
      </button>
      <input
        ref={venueBackupInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={(event: any) => {
          const file = event.target.files?.[0] || null;
          handleVenueBackupFileUpload(file);
          event.target.value = "";
        }}
      />
      <button type="button" style={styles.secondaryButton} onClick={() => venueBackupInputRef.current?.click()}>
        Upload Venue Backup
      </button>
      <button type="button" style={styles.secondaryButton} onClick={restoreEmergencyBackup}>
        Restore Emergency Backup
      </button>
      {backupHistory
        .slice()
        .sort((a: any, b: any) => String(b?.createdAt || b?.updatedAt || "").localeCompare(String(a?.createdAt || a?.updatedAt || "")))
        .slice(0, 3)
        .map((snapshot: any, index: number) => {
          const backupStamp = snapshot?.createdAt || snapshot?.updatedAt || snapshot?.savedAt || "";
          const backupLabel = backupStamp ? new Date(backupStamp).toLocaleString() : "No timestamp saved";
          return (
            <button
              key={`${backupStamp || "backup"}_${index}`}
              type="button"
              style={styles.secondaryButton}
              onClick={() => restoreFromSnapshot(snapshot, `backup ${index + 1} (${backupLabel})`)}
            >
              Restore Backup {index + 1} — {backupLabel}
            </button>
          );
        })}

      {pendingVenueBackup ? (
        <div
          style={{
            flex: "1 1 100%",
            marginTop: 2,
            padding: 12,
            borderRadius: 18,
            border: "1px solid rgba(96,165,250,0.20)",
            background: "rgba(15,23,42,0.72)",
            color: "#f8fafc",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 900, color: "#f8fafc" }}>
            Backup ready: {pendingVenueBackup.venue?.name || "Imported Venue"}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#cbd5e1" }}>
            Restore into this venue or import it as a separate venue. Emergency backup happens first either way.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button type="button" style={styles.primaryButton} onClick={handleRestoreBackupIntoCurrentVenue}>
              Restore into Current Venue
            </button>
            <button type="button" style={styles.secondaryButton} onClick={handleImportBackupAsNewVenue}>
              Import as New Venue
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
