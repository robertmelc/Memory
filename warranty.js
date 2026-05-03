// js/warranty.js — výpočty záruční lhůty

const Warranty = (() => {

  function expiry(receipt) {
    if (!receipt.purchaseDate || !receipt.warrantyLen) return null;
    const d = new Date(receipt.purchaseDate);
    if (receipt.warrantyUnit === 'years') {
      d.setFullYear(d.getFullYear() + parseInt(receipt.warrantyLen));
    } else {
      d.setMonth(d.getMonth() + parseInt(receipt.warrantyLen));
    }
    return d;
  }

  function daysLeft(receipt) {
    const exp = expiry(receipt);
    if (!exp) return null;
    return Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24));
  }

  function percent(receipt) {
    const exp = expiry(receipt);
    if (!exp || !receipt.purchaseDate) return 0;
    const start = new Date(receipt.purchaseDate);
    const total = exp - start;
    const elapsed = new Date() - start;
    return Math.min(100, Math.max(0, Math.round(elapsed / total * 100)));
  }

  function badge(receipt) {
    const d = daysLeft(receipt);
    if (d === null) return '';
    if (d < 0)   return `<span class="warranty-badge wb-exp">⚠ Vypršela</span>`;
    if (d <= 30) return `<span class="warranty-badge wb-warn">⏰ ${d} dní</span>`;
    const months = Math.ceil(d / 30);
    return `<span class="warranty-badge wb-ok">🛡 ${months} měs.</span>`;
  }

  function fillColor(d) {
    if (d === null) return 'var(--c-muted)';
    if (d < 0)     return 'var(--c-red)';
    if (d <= 30)   return 'var(--c-amber)';
    return 'var(--c-green)';
  }

  return { expiry, daysLeft, percent, badge, fillColor };
})();
