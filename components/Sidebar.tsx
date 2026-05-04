"use client";

import type { CSSProperties } from "react";

type GpPoliceNavItem = {
  key: string;
  label: string;
  description: string;
  icon: string;
};

type SidebarProps = {
  activeView: string;
  isMobileViewport: boolean;
  isMobileMenuOpen: boolean;
  navItems: GpPoliceNavItem[];
  styles: Record<string, CSSProperties>;
  onNavigate: (viewKey: string) => void;
  onCloseMobileMenu: () => void;
};

function SidebarLogoFrame({
  styles,
  size = 86,
  borderRadius = 22,
}: {
  styles: Record<string, CSSProperties>;
  size?: number;
  borderRadius?: number;
}) {
  return (
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
}

export function Sidebar({
  activeView,
  isMobileViewport,
  isMobileMenuOpen,
  navItems,
  styles,
  onNavigate,
  onCloseMobileMenu,
}: SidebarProps) {
  const activeNavKey =
    activeView === "recipeBuilder" || activeView === "recipeDetail" || activeView === "recipePrepSheet"
      ? "recipes"
      : activeView;

  const sidebarPanel = (
    <div
      style={{
        ...styles.sidebar,
        ...(isMobileViewport ? styles.sidebarMobile : {}),
      }}
    >
      <div style={styles.sidebarHeader}>
        <SidebarLogoFrame styles={styles} size={74} borderRadius={20} />
        <div style={styles.sidebarBrandBadge}>KITCHEN CONTROL UNIT</div>
        <div style={styles.brandTitle}>GP Police</div>
        <div style={styles.brandSubtitle}>GP leaks don&apos;t survive here.</div>
        <div style={styles.brandMeta}>Hospitality costing command centre</div>
      </div>

      <div style={styles.navList}>
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key)}
            style={{
              ...styles.navButton,
              ...(activeNavKey === item.key ? styles.navButtonActive : {}),
            }}
          >
            <div style={styles.navButtonInner}>
              <div style={styles.navIcon}>{item.icon}</div>
              <div style={styles.navTextWrap}>
                <div style={styles.navLabel}>{item.label}</div>
                <div style={styles.navDescription}>{item.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div style={styles.sidebarMiniPanel}>
        <div style={styles.sidebarMiniPanelTitle}>Street Report</div>
        <div style={styles.sidebarMiniPanelText}>
          Track your costs, clean your GP, and stop letting vibes run the pass.
        </div>
      </div>
    </div>
  );

  if (!isMobileViewport) {
    return sidebarPanel;
  }

  if (!isMobileMenuOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        style={styles.mobileMenuBackdrop}
        onClick={onCloseMobileMenu}
      />
      {sidebarPanel}
    </>
  );
}
