import Decimal from 'decimal.js';
import type {
  Order,
  Allocation,
  PriceRow,
  StockRow,
  CustomerCredit,
} from '../../domain/types';
import {
  TIER_MULTIPLIER,
  TYPE_PRIORITY,
  WILDCARD_SUPPLIER,
  WILDCARD_WAREHOUSE,
} from '../../domain/types';
import { bankersRound2 } from './math';

export interface AllocationContext {
  orders: Order[];
  prices: PriceRow[];
  stock: StockRow[];
  credits: CustomerCredit[];
}

export interface AllocationResult {
  allocations: Record<string, Allocation>; // by subOrderId
  remainingStock: StockRow[]; // updated availability
  customerCreditUsed: Record<string, number>; // money
}

function priceFor(prices: PriceRow[], itemId: string, supplierId: string): number | undefined {
  const row = prices.find((p) => p.itemId === itemId && p.supplierId === supplierId);
  return row?.basePrice;
}

function stockIndex(stock: StockRow[]): Map<string, StockRow> {
  const m = new Map<string, StockRow>();
  for (const s of stock) {
    m.set(`${s.itemId}|${s.warehouseId}|${s.supplierId}`, { ...s });
  }
  return m;
}

function findCandidates(
  index: Map<string, StockRow>,
  itemId: string,
  warehouseId: string,
  supplierId: string,
): StockRow[] {
  const whWild = warehouseId === WILDCARD_WAREHOUSE;
  const spWild = supplierId === WILDCARD_SUPPLIER;
  const list: StockRow[] = [];
  for (const row of index.values()) {
    if (row.itemId !== itemId) continue;
    if (!whWild && row.warehouseId !== warehouseId) continue;
    if (!spWild && row.supplierId !== supplierId) continue;
    if (row.available <= 0) continue;
    list.push(row);
  }
  // wildcard: prefer highest available
  list.sort((a, b) => b.available - a.available);
  return list;
}

export function sortOrdersForAllocation(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const pa = TYPE_PRIORITY[a.type];
    const pb = TYPE_PRIORITY[b.type];
    if (pa !== pb) return pa - pb;
    if (a.createDate !== b.createDate) {
      return a.createDate < b.createDate ? -1 : 1;
    }
    // FIFO tiebreak by subOrderId
    return a.subOrderId < b.subOrderId ? -1 : 1;
  });
}

export function autoAllocate(ctx: AllocationContext): AllocationResult {
  const sorted = sortOrdersForAllocation(ctx.orders);
  const index = stockIndex(ctx.stock);
  const allocations: Record<string, Allocation> = {};
  const creditUsed = new Map<string, Decimal>();
  const creditLimit = new Map<string, number>();
  for (const c of ctx.credits) creditLimit.set(c.customerId, c.creditLimit);

  for (const o of sorted) {
    const candidates = findCandidates(index, o.itemId, o.warehouseId, o.supplierId);
    if (candidates.length === 0) {
      allocations[o.subOrderId] = {
        subOrderId: o.subOrderId,
        allocated: 0,
        effectivePrice: 0,
        warehouseId: o.warehouseId,
        supplierId: o.supplierId,
      };
      continue;
    }
    // Use first (highest available) candidate; allocate up to request.
    const chosen = candidates[0]!;
    const base = priceFor(ctx.prices, o.itemId, chosen.supplierId);
    if (base === undefined) {
      allocations[o.subOrderId] = {
        subOrderId: o.subOrderId,
        allocated: 0,
        effectivePrice: 0,
        warehouseId: chosen.warehouseId,
        supplierId: chosen.supplierId,
      };
      continue;
    }
    const tier = TIER_MULTIPLIER[o.type];
    const effPrice = bankersRound2(new Decimal(base).mul(tier));

    // Compute max allowed by credit.
    const used = creditUsed.get(o.customerId) ?? new Decimal(0);
    const limit = creditLimit.get(o.customerId);
    let qty = Math.min(o.request, chosen.available);
    if (limit !== undefined && effPrice > 0) {
      const remainingCredit = new Decimal(limit).minus(used);
      const maxByCredit = remainingCredit.div(effPrice);
      const maxByCreditNum = maxByCredit.toNumber();
      if (maxByCreditNum < qty) qty = Math.max(0, maxByCreditNum);
    }
    const allocated = bankersRound2(qty);
    if (allocated > 0) {
      chosen.available = bankersRound2(new Decimal(chosen.available).minus(allocated));
      const cost = new Decimal(allocated).mul(effPrice);
      creditUsed.set(o.customerId, used.plus(cost));
    }
    allocations[o.subOrderId] = {
      subOrderId: o.subOrderId,
      allocated,
      effectivePrice: effPrice,
      warehouseId: chosen.warehouseId,
      supplierId: chosen.supplierId,
    };
  }

  const remainingStock = Array.from(index.values());
  const customerCreditUsed: Record<string, number> = {};
  for (const [k, v] of creditUsed.entries()) {
    customerCreditUsed[k] = bankersRound2(v);
  }
  return { allocations, remainingStock, customerCreditUsed };
}

// Manual update with constraint validation.
export interface ManualUpdateInput {
  subOrderId: string;
  newAllocated: number;
}

export function applyManualUpdate(
  ctx: AllocationContext,
  current: AllocationResult,
  input: ManualUpdateInput,
): { ok: true; result: AllocationResult } | { ok: false; reason: string } {
  const order = ctx.orders.find((o) => o.subOrderId === input.subOrderId);
  if (!order) return { ok: false, reason: 'Order not found' };
  const alloc = current.allocations[input.subOrderId];
  if (!alloc) return { ok: false, reason: 'Allocation not initialized' };

  const stockRow = current.remainingStock.find(
    (s) =>
      s.itemId === order.itemId &&
      s.warehouseId === alloc.warehouseId &&
      s.supplierId === alloc.supplierId,
  );
  // "remaining stock" should include current allocation as recoverable.
  const recoverableAvailable = new Decimal(stockRow?.available ?? 0).plus(alloc.allocated);
  const newAlloc = bankersRound2(Math.max(0, input.newAllocated));
  if (newAlloc > recoverableAvailable.toNumber()) {
    return { ok: false, reason: 'Exceeds remaining stock' };
  }

  // Credit check.
  const customerCost = new Decimal(newAlloc).mul(alloc.effectivePrice);
  const prevCost = new Decimal(alloc.allocated).mul(alloc.effectivePrice);
  const usedBefore = current.customerCreditUsed[order.customerId] ?? 0;
  const newUsed = new Decimal(usedBefore).minus(prevCost).plus(customerCost);
  const limit = ctx.credits.find((c) => c.customerId === order.customerId)?.creditLimit;
  if (limit !== undefined && newUsed.toNumber() > limit + 1e-9) {
    return { ok: false, reason: 'Exceeds customer credit' };
  }

  const allocations = { ...current.allocations };
  allocations[input.subOrderId] = { ...alloc, allocated: newAlloc };
  const remainingStock = current.remainingStock.map((s) => {
    if (
      s.itemId === order.itemId &&
      s.warehouseId === alloc.warehouseId &&
      s.supplierId === alloc.supplierId
    ) {
      return {
        ...s,
        available: bankersRound2(recoverableAvailable.minus(newAlloc)),
      };
    }
    return s;
  });
  const customerCreditUsed = {
    ...current.customerCreditUsed,
    [order.customerId]: bankersRound2(newUsed),
  };
  return {
    ok: true,
    result: { allocations, remainingStock, customerCreditUsed },
  };
}
