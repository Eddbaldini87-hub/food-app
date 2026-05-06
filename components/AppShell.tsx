import { AppHeader } from "./AppHeader";
import { AuthPage } from "./AuthPage";
import { Sidebar } from "./Sidebar";
import { getGpPoliceNavItems } from "../lib/gpPoliceConstants";

export function AppShell(props: any) {
  const {
    styles,
    authenticated,
    adminUnlocked,
    passwordInput,
    setPasswordInput,
    passwordError,
    setPasswordError,
    showPasswordInput,
    setShowPasswordInput,
    handleLogin,
    activeView,
    activeViewLabel,
    isMobileViewport,
    isMobileMenuOpen,
    onToggleMobileMenu,
    onCloseMobileMenu,
    onNavigate,
    renderVenueSelector,
    renderActiveView,
    startNewRecipe,
    startNewSupplierLine,
    handleOpenInvoiceCamera,
  } = props;

  const renderGpLogoFrame = (size = 86, borderRadius = 22) => (
    <div
      style={{
        ...styles.logoFrame,
        width: size,
        height: size,
        borderRadius,
      }}
    >
      <img
        src="/gp-police-logo-clean.png"
        alt="GP Police"
        style={styles.logoFrameImage}
      />
    </div>
  );

  const shellNavItems = (() => {
    const navItems = getGpPoliceNavItems();
    const stockNavItem = {
      key: "stock",
      label: "Stock",
      description: "Stock control hub for counts, ordering, invoice evidence, and damage leaks.",
      icon: "▣",
    };
    const stocktakeNavItem = {
      key: "stocktake",
      label: "Stocktake",
      description: "Count the shelves before the numbers start lying to you.",
      icon: "▦",
    };
    const consumablesNavItem = {
      key: "consumables",
      label: "Kitchen Bits",
      description: "Packaging, gloves, napkins, and disposables kept out of food GP.",
      icon: "◈",
    };
    const withStock = navItems.some((item: any) => item.key === "stock") ? navItems : [...navItems, stockNavItem];
    const withStocktake = withStock.some((item: any) => item.key === "stocktake") ? withStock : [...withStock, stocktakeNavItem];
    return withStocktake.some((item: any) => item.key === "consumables") ? withStocktake : [...withStocktake, consumablesNavItem];
  })();

  const renderSidebar = () => (
    <Sidebar
      activeView={activeView}
      isMobileViewport={isMobileViewport}
      isMobileMenuOpen={isMobileMenuOpen}
      navItems={shellNavItems}
      styles={styles}
      onNavigate={onNavigate}
      onCloseMobileMenu={onCloseMobileMenu}
    />
  );

  if (!authenticated) {
    return (
      <AuthPage
        styles={styles}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        passwordError={passwordError}
        setPasswordError={setPasswordError}
        showPasswordInput={showPasswordInput}
        setShowPasswordInput={setShowPasswordInput}
        handleLogin={handleLogin}
        renderGpLogoFrame={renderGpLogoFrame}
      />
    );
  }

  return (
    <div
      data-admin-unlocked={adminUnlocked ? "true" : "false"}
      style={{
        ...styles.appShell,
        ...(isMobileViewport ? styles.appShellMobile : {}),
      }}
    >
      <AppHeader
        isMobileViewport={isMobileViewport}
        isMobileMenuOpen={isMobileMenuOpen}
        activeViewLabel={activeViewLabel}
        styles={styles}
        onToggleMobileMenu={onToggleMobileMenu}
      />
      {!isMobileViewport ? renderSidebar() : null}
      {isMobileViewport ? renderSidebar() : null}
      <div
        style={{
          ...styles.mainContent,
          ...(isMobileViewport ? styles.mainContentMobile : {}),
        }}
      >
        {renderVenueSelector()}
        {renderActiveView()}
      </div>
      {isMobileViewport ? (
        <div style={styles.mobileActionBar}>
          <button
            type="button"
            style={{
              ...styles.secondaryButton,
              ...styles.mobileActionButton,
            }}
            onClick={() => onNavigate("dashboard")}
          >
            Main Hideout
          </button>
          <button
            type="button"
            style={{
              ...styles.primaryButton,
              ...styles.mobileActionButton,
            }}
            onClick={handleOpenInvoiceCamera}
          >
            Snap Invoice
          </button>
          <button
            type="button"
            style={{
              ...styles.secondaryButton,
              ...styles.mobileActionButton,
            }}
            onClick={startNewRecipe}
          >
            Cost Plate
          </button>
          <button
            type="button"
            style={{
              ...styles.secondaryButton,
              ...styles.mobileActionButton,
            }}
            onClick={startNewSupplierLine}
          >
            Add Line
          </button>
        </div>
      ) : null}
    </div>
  );
}
