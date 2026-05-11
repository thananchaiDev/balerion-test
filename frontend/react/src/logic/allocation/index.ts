import {
  ANY_SUPPLIER,
  ANY_WAREHOUSE,
  TIER_MULTIPLIER,
  TYPE_PRIORITY,
  stockKey,
} from '@/domain/types';
import type {
  AllocationResult,
  Customer,
  Order,
  PriceRow,
  StockRow,
} from '@/domain/types';
import { Decimal, bankersRound, priceOf } from './math';

interface AllocationInput {
  orders: Order[];
  prices: PriceRow[];
  stocks: StockRow[];
  customers: Customer[];
}

interface IndexedInputs {
  stockRemaining: Map<string, number>;
  priceBySupplierItem: Map<string, number>; // `${supplierId}|${itemId}` -> base price
  creditLimits: Map<string, number>;
  creditUsed: Map<string, number>;
}

function indexInputs(
  prices: PriceRow[],
  stocks: StockRow[],
  customers: Customer[],
): IndexedInputs {
  const stockRemaining = new Map<string, number>();
  for (const s of stocks) {
    stockRemaining.set(stockKey(s.warehouseId, s.supplierId, s.itemId), s.quantity);
  }
  const priceBySupplierItem = new Map<string, number>();
  for (const p of prices) {
    priceBySupplierItem.set(`${p.supplierId}|${p.itemId}`, p.basePrice);
  }
  const creditLimits = new Map<string, number>();
  for (const c of customers) creditLimits.set(c.customerId, c.creditLimit);

  return {
    stockRemaining,
    priceBySupplierItem,
    creditLimits,
    creditUsed: new Map<string, number>(),
  };
}

/** Resolve effective (warehouse, supplier) for an order, honoring WH-000 / SP-000. */
function resolveBucket(
  order: Order,
  stockRemaining: Map<string, number>,
): { warehouseId: string; supplierId: string } | undefined {
  const wAny = order.warehouseId === ANY_WAREHOUSE;
  const sAny = order.supplierId === ANY_SUPPLIER;

  if (!wAny && !sAny) {
    return { warehouseId: order.warehouseId, supplierId: order.supplierId };
  }

  // Otherwise pick the bucket (warehouse,supplier) with the highest remaining
  // stock for this item, scanning available keys.
  let best:
    | { warehouseId: string; supplierId: string; qty: number }
    | undefined;
  for (const [key, qty] of stockRemaining) {
    if (qty <= 0) continue;
    const [w, s, it] = key.split('|');
    if (it !== order.itemId) continue;
    if (!wAny && w !== order.warehouseId) continue;
    if (!sAny && s !== order.supplierId) continue;
    if (!best || qty > best.qty) {
      best = { warehouseId: w, supplierId: s, qty };
    }
  }
  return best ? { warehouseId: best.warehouseId, supplierId: best.supplierId } : undefined;
}

function unitPriceFor(
  itemId: string,
  supplierId: string,
  type: Order['type'],
  priceBySupplierItem: Map<string, number>,
): number | undefined {
  const base = priceBySupplierItem.get(`${supplierId}|${itemId}`);
  if (base === undefined) return undefined;
  // tier multiplier — decimal-safe to avoid float drift.
  return new Decimal(base)
    .mul(TIER_MULTIPLIER[type])
    .toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN)
    .toNumber();
}

/**
 * Auto-allocate. Pure: returns a new AllocationResult, never mutates inputs.
 *
 * Algorithm:
 *  1. Sort by type priority (EMERGENCY > OVER_DUE > DAILY), then FIFO by createDate,
 *     then by subOrder for deterministic tie-break.
 *  2. For each order, resolve target (warehouse, supplier):
 *     - If both specific, use as-is.
 *     - If WH-000 / SP-000, choose the (w,s) tuple for this item with the
 *       highest remaining stock.
 *  3. Quantity = min(request, stockRemaining, creditHeadroom / unitPrice),
 *     rounded with banker's rounding to 2dp.
 *  4. Deduct stock and customer credit accordingly.
 */
export function autoAllocate(input: AllocationInput): AllocationResult {
  const { orders, prices, stocks, customers } = input;
  const idx = indexInputs(prices, stocks, customers);

  const allocated: Record<string, number> = {};
  const fulfillment: AllocationResult['fulfillment'] = {};

  const sorted = [...orders].sort((a, b) => {
    const p = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    if (p !== 0) return p;
    if (a.createDate !== b.createDate) {
      return a.createDate < b.createDate ? -1 : 1;
    }
    return a.subOrder < b.subOrder ? -1 : 1;
  });

  for (const o of sorted) {
    const bucket = resolveBucket(o, idx.stockRemaining);
    if (!bucket) {
      allocated[o.subOrder] = 0;
      continue;
    }
    const key = stockKey(bucket.warehouseId, bucket.supplierId, o.itemId);
    const remaining = idx.stockRemaining.get(key) ?? 0;
    if (remaining <= 0) {
      allocated[o.subOrder] = 0;
      continue;
    }
    const unitPrice = unitPriceFor(
      o.itemId,
      bucket.supplierId,
      o.type,
      idx.priceBySupplierItem,
    );
    if (unitPrice === undefined || unitPrice <= 0) {
      allocated[o.subOrder] = 0;
      continue;
    }

    const creditLimit = idx.creditLimits.get(o.customerId) ?? Infinity;
    const used = idx.creditUsed.get(o.customerId) ?? 0;
    const headroom = Math.max(0, creditLimit - used);
    const creditCap = headroom === Infinity ? Infinity : headroom / unitPrice;

    const rawQty = Math.min(o.request, remaining, creditCap);
    // Round down with bankers to 2 decimals; never exceed remaining / creditCap.
    let qty = bankersRound(rawQty, 2);
    if (qty > remaining) qty = remaining;
    if (qty * unitPrice > headroom + 1e-9) {
      // recompute floor to stay within credit when rounding pushes over.
      qty = bankersRound(headroom / unitPrice, 2);
      while (qty * unitPrice > headroom + 1e-9 && qty > 0) {
        qty = bankersRound(qty - 0.01, 2);
      }
    }
    if (qty < 0) qty = 0;

    allocated[o.subOrder] = qty;
    fulfillment[o.subOrder] = {
      warehouseId: bucket.warehouseId,
      supplierId: bucket.supplierId,
      unitPrice,
    };
    if (qty > 0) {
      idx.stockRemaining.set(key, bankersRound(remaining - qty, 2));
      idx.creditUsed.set(o.customerId, bankersRound(used + priceOf(qty, unitPrice), 2));
    }
  }

  // Fill subOrders that weren't visited (shouldn't happen) with 0.
  for (const o of orders) {
    if (!(o.subOrder in allocated)) allocated[o.subOrder] = 0;
  }

  return {
    allocated,
    stockRemaining: Object.fromEntries(idx.stockRemaining),
    creditUsed: Object.fromEntries(idx.creditUsed),
    fulfillment,
  };
}

// ---- Manual allocation helpers ---------------------------------------------

export interface ManualContext {
  orders: Order[];
  prices: PriceRow[];
  stocks: StockRow[];
  customers: Customer[];
  current: AllocationResult;
}

export interface ValidationOutcome {
  ok: boolean;
  reason?: string;
  /** Best legal value the user could have entered (used for clamping). */
  clamped?: number;
}

/**
 * Recompute the allocation result given an updated allocated map. Cheap O(n).
 * Returns a fresh AllocationResult with re-derived stock / credit.
 */
export function recomputeAllocation(
  input: AllocationInput,
  allocated: Record<string, number>,
  fulfillment: AllocationResult['fulfillment'],
): AllocationResult {
  const idx = indexInputs(input.prices, input.stocks, input.customers);
  const nextFulfillment: AllocationResult['fulfillment'] = { ...fulfillment };

  for (const o of input.orders) {
    const qty = allocated[o.subOrder] ?? 0;
    if (qty <= 0) continue;
    let f = nextFulfillment[o.subOrder];
    if (!f) {
      // Resolve a bucket now (manual edit on previously-zero row).
      const bucket = resolveBucket(o, idx.stockRemaining);
      if (!bucket) continue;
      const unitPrice = unitPriceFor(
        o.itemId,
        bucket.supplierId,
        o.type,
        idx.priceBySupplierItem,
      );
      if (unitPrice === undefined) continue;
      f = { warehouseId: bucket.warehouseId, supplierId: bucket.supplierId, unitPrice };
      nextFulfillment[o.subOrder] = f;
    }
    const key = stockKey(f.warehouseId, f.supplierId, o.itemId);
    const cur = idx.stockRemaining.get(key) ?? 0;
    idx.stockRemaining.set(key, bankersRound(cur - qty, 2));
    const used = idx.creditUsed.get(o.customerId) ?? 0;
    idx.creditUsed.set(o.customerId, bankersRound(used + priceOf(qty, f.unitPrice), 2));
  }

  return {
    allocated: { ...allocated },
    stockRemaining: Object.fromEntries(idx.stockRemaining),
    creditUsed: Object.fromEntries(idx.creditUsed),
    fulfillment: nextFulfillment,
  };
}

/**
 * Validate a manual allocation change for a single sub-order.
 * `desired` is the value the user typed; we check whether applying it (in place
 * of the prior allocation for that sub-order) keeps stock and credit valid.
 */
export function validateManualChange(
  ctx: ManualContext,
  subOrder: string,
  desired: number,
): ValidationOutcome {
  const order = ctx.orders.find((o) => o.subOrder === subOrder);
  if (!order) return { ok: false, reason: 'Order not found' };
  if (desired < 0) return { ok: false, reason: 'Quantity must be >= 0', clamped: 0 };
  if (desired > order.request) {
    return {
      ok: false,
      reason: `Cannot allocate more than request (${order.request})`,
      clamped: order.request,
    };
  }

  // Build prospective allocated map and recompute.
  const nextAllocated = { ...ctx.current.allocated, [subOrder]: desired };
  const next = recomputeAllocation(
    { orders: ctx.orders, prices: ctx.prices, stocks: ctx.stocks, customers: ctx.customers },
    nextAllocated,
    ctx.current.fulfillment,
  );

  // Stock check
  const f = next.fulfillment[subOrder];
  if (f) {
    const key = stockKey(f.warehouseId, f.supplierId, order.itemId);
    if ((next.stockRemaining[key] ?? 0) < -1e-9) {
      return {
        ok: false,
        reason: 'Allocation exceeds remaining stock',
        clamped: clampStock(ctx, subOrder, desired),
      };
    }
  }

  // Credit check
  const limit = ctx.customers.find((c) => c.customerId === order.customerId)?.creditLimit;
  if (limit !== undefined && (next.creditUsed[order.customerId] ?? 0) > limit + 1e-6) {
    return {
      ok: false,
      reason: `Customer ${order.customerId} exceeds credit limit ${limit}`,
      clamped: clampCredit(ctx, subOrder, desired),
    };
  }

  return { ok: true };
}

function clampStock(ctx: ManualContext, subOrder: string, desired: number): number {
  const order = ctx.orders.find((o) => o.subOrder === subOrder);
  if (!order) return 0;
  const f = ctx.current.fulfillment[subOrder];
  if (!f) return desired;
  const key = stockKey(f.warehouseId, f.supplierId, order.itemId);
  // Recompute "available" without this sub-order's prior allocation.
  const idx = indexInputs(ctx.prices, ctx.stocks, ctx.customers);
  for (const o of ctx.orders) {
    if (o.subOrder === subOrder) continue;
    const qty = ctx.current.allocated[o.subOrder] ?? 0;
    if (qty <= 0) continue;
    const ff = ctx.current.fulfillment[o.subOrder];
    if (!ff) continue;
    const k = stockKey(ff.warehouseId, ff.supplierId, o.itemId);
    idx.stockRemaining.set(k, (idx.stockRemaining.get(k) ?? 0) - qty);
  }
  const avail = Math.max(0, idx.stockRemaining.get(key) ?? 0);
  return bankersRound(Math.min(avail, desired, order.request), 2);
}

function clampCredit(ctx: ManualContext, subOrder: string, desired: number): number {
  const order = ctx.orders.find((o) => o.subOrder === subOrder);
  if (!order) return 0;
  const limit = ctx.customers.find((c) => c.customerId === order.customerId)?.creditLimit;
  if (limit === undefined) return desired;
  const f = ctx.current.fulfillment[subOrder];
  if (!f) return desired;
  // Sum customer credit excluding this sub-order's old allocation.
  let usedByOthers = 0;
  for (const o of ctx.orders) {
    if (o.customerId !== order.customerId) continue;
    if (o.subOrder === subOrder) continue;
    const qty = ctx.current.allocated[o.subOrder] ?? 0;
    const ff = ctx.current.fulfillment[o.subOrder];
    if (!ff || qty <= 0) continue;
    usedByOthers += priceOf(qty, ff.unitPrice);
  }
  const headroom = Math.max(0, limit - usedByOthers);
  const maxQty = headroom / f.unitPrice;
  return bankersRound(Math.min(maxQty, desired, order.request), 2);
}
