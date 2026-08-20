/**
 * Stock-health badge: ok | low | out. Used on Inventory + Dashboard.
 */
export function stockHealth(product) {
  const qty = Number(product?.quantity ?? 0);
  const reorder = Number(product?.reorderLevel ?? 0);
  if (qty <= 0) return { key: 'out', label: 'Out of stock', className: 'badge danger' };
  if (qty <= reorder) return { key: 'low', label: 'Low stock', className: 'badge warning' };
  return { key: 'ok', label: 'In stock', className: 'badge' };
}

export function StockBadge({ product }) {
  const health = stockHealth(product);
  return <span className={health.className}>{health.label}</span>;
}