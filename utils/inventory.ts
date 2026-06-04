/**
 * Inventory helpers — single source of truth for stock thresholds.
 *
 * BUG-FIX (issue_1778400960746, FIX-BUGS-01): low-stock logic was inconsistent
 * across components:
 *   - ProductGrid (POS): `stock <= (minStock || 20)`  ✓
 *   - InventoryList:     `stock <  (minStock || 20)`  ✗  (wrong operator)
 *   - Dashboard:         `stock <  (minStock || 20)`  ✗  (wrong operator)
 *   - ReportsManagement: `stock <= (minStock ||  0)`  ✗  (wrong fallback)
 *   - InventoryValuation:`stock <= (minStock ||  0)`  ✗  (wrong fallback)
 *
 * Centralize the rule here so all surfaces render identical low-stock state.
 */

/** Default minimum-stock threshold when `product.minStock` is missing/zero. */
export const DEFAULT_LOW_STOCK_THRESHOLD = 20;

/** Operator: a product is "low stock" when its current stock is at or below its min. */
const LOW_STOCK_OPERATOR: '<=' = '<=';

/**
 * Returns true when the product's stock is at or below its minimum threshold.
 * Uses `<=` (so stock exactly equal to minStock IS low) and falls back to
 * {@link DEFAULT_LOW_STOCK_THRESHOLD} when `minStock` is missing.
 */
export function isLowStock(
  product: { stock: number; minStock?: number | null } | null | undefined,
): boolean {
  if (!product) return false;
  const stock = Number(product.stock);
  const min = Number(product.minStock ?? DEFAULT_LOW_STOCK_THRESHOLD);
  if (!Number.isFinite(stock) || !Number.isFinite(min)) return false;
  if (LOW_STOCK_OPERATOR === '<=') return stock <= min;
  return stock < min;
}

/** Resolves the effective minimum stock value (for display purposes). */
export function effectiveMinStock(
  product: { minStock?: number | null } | null | undefined,
): number {
  if (!product) return DEFAULT_LOW_STOCK_THRESHOLD;
  const min = Number(product.minStock);
  return Number.isFinite(min) && min > 0 ? min : DEFAULT_LOW_STOCK_THRESHOLD;
}
