import type { CSSProperties } from "react";

type AppHeaderProps = {
  isMobileViewport: boolean;
  isMobileMenuOpen: boolean;
  activeViewLabel: string;
  styles: Record<string, CSSProperties>;
  onToggleMobileMenu: () => void;
};

export function AppHeader({
  isMobileViewport,
  isMobileMenuOpen,
  activeViewLabel,
  styles,
  onToggleMobileMenu,
}: AppHeaderProps) {
  if (!isMobileViewport) return null;

  return (
    <div style={styles.mobileTopBar}>
      <button
        type="button"
        style={styles.mobileMenuButton}
        onClick={onToggleMobileMenu}
      >
        {isMobileMenuOpen ? "Close" : "Menu"}
      </button>
      <div style={styles.mobileTopBarTitleWrap}>
        <div style={styles.mobileTopBarBadge}>GP POLICE</div>
        <div style={styles.mobileTopBarTitle}>{activeViewLabel}</div>
      </div>
    </div>
  );
}
