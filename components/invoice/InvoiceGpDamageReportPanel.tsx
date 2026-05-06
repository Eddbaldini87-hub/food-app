export function InvoiceGpDamageReportPanel(props: any) {
  const { styles, invoiceGpDamageSummary, formatCurrency } = props;

  if (!invoiceGpDamageSummary || invoiceGpDamageSummary.totalDamage <= 0) {
    return null;
  }

  return (
    <div style={{ ...styles.infoCard, marginTop: 12, border: "1px solid rgba(248, 113, 113, 0.42)", background: "rgba(127, 29, 29, 0.16)" }}>
      <div style={styles.infoCardTitle}>💀 GP Damage Report</div>
      <div style={styles.infoCardSubtext}>Potential supplier price damage from matched invoice rows. Display only — no prices or stock are changed.</div>
      <div style={{ ...styles.formGrid, marginTop: 12 }}>
        <div style={{ ...styles.infoCard, border: "1px solid rgba(248, 113, 113, 0.42)", background: "rgba(248, 113, 113, 0.10)" }}>
          <div style={styles.infoCardTitle}>Margin Killers</div>
          <div style={{ ...styles.infoCardText, color: "#fca5a5" }}>{formatCurrency(invoiceGpDamageSummary.marginKillerTotal)}</div>
          <div style={styles.infoCardSubtext}>{invoiceGpDamageSummary.marginKillerCount} row(s) at +25% or more</div>
        </div>
        <div style={{ ...styles.infoCard, border: "1px solid rgba(251, 146, 60, 0.42)", background: "rgba(251, 146, 60, 0.10)" }}>
          <div style={styles.infoCardTitle}>Price Spikes</div>
          <div style={{ ...styles.infoCardText, color: "#fed7aa" }}>{formatCurrency(invoiceGpDamageSummary.priceSpikeTotal)}</div>
          <div style={styles.infoCardSubtext}>{invoiceGpDamageSummary.priceSpikeCount} row(s) at +15% or more</div>
        </div>
        <div style={{ ...styles.infoCard, border: "1px solid rgba(245, 158, 11, 0.42)", background: "rgba(245, 158, 11, 0.10)" }}>
          <div style={styles.infoCardTitle}>Price Rises</div>
          <div style={{ ...styles.infoCardText, color: "#fde68a" }}>{formatCurrency(invoiceGpDamageSummary.priceRiseTotal)}</div>
          <div style={styles.infoCardSubtext}>{invoiceGpDamageSummary.priceRiseCount} row(s) at +8% or more</div>
        </div>
        <div style={{ ...styles.infoCard, border: "1px solid rgba(248, 113, 113, 0.55)", background: "rgba(248, 113, 113, 0.14)" }}>
          <div style={styles.infoCardTitle}>Total Potential Damage</div>
          <div style={{ ...styles.infoCardText, color: "#fecaca", fontWeight: 900 }}>{formatCurrency(invoiceGpDamageSummary.totalDamage)}</div>
          <div style={styles.infoCardSubtext}>Sum of flagged invoice line totals</div>
        </div>
      </div>
    </div>
  );
}
