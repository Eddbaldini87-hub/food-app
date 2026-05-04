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
      description: "Stock control hub for ordering, counts, invoices, and spend.",
      icon: "▣",
    };
    const stocktakeNavItem = {
      key: "stocktake",
      label: "Stocktake",
      description: "Count stock without touching movements yet.",
      icon: "▦",
    };
    const consumablesNavItem = {
      key: "consumables",
      label: "Consumables",
      description: "Track packaging, napkins, gloves, and kitchen disposables outside food GP.",
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
              ...styles.primaryButton,
              ...styles.mobileActionButton,
            }}
            onClick={startNewRecipe}
          >
            Start Recipe
          </button>
          <button
            type="button"
            style={{
              ...styles.secondaryButton,
              ...styles.mobileActionButton,
            }}
            onClick={startNewSupplierLine}
          >
            Add Ingredient
          </button>
        </div>
      ) : null}
    </div>
  );
}
