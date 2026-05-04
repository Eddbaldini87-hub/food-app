import { VenueAdminPage } from "../VenueAdminPage";

export function createAdminPageRenderers(props: any) {
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

  const renderVenueSelector = () => (
    <VenueAdminPage
      styles={styles}
      venueState={venueState}
      venueMessage={venueMessage}
      currentVenue={currentVenue}
      adminUnlocked={adminUnlocked}
      handleAdminUnlock={handleAdminUnlock}
      handleAdminLock={handleAdminLock}
      handleSwitchVenue={handleSwitchVenue}
      handleCreateVenue={handleCreateVenue}
      handleRenameCurrentVenue={handleRenameCurrentVenue}
      handleDeleteCurrentVenue={handleDeleteCurrentVenue}
      handleSaveVenueSnapshot={handleSaveVenueSnapshot}
      getVenueDisplayName={getVenueDisplayName}
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
  );

  return {
    renderVenueSelector,
  };
}
