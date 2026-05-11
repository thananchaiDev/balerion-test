// Domain types for salmon-allocation problem.

export type OrderType = 'EMERGENCY' | 'OVER_DUE' | 'DAILY';

export const ANY_WAREHOUSE = 'WH-000';
export const ANY_SUPPLIER = 'SP-000';

export interface Order {
  /** Parent order id, e.g. ORDER-0001 */
  order: string;
  /** Sub order id, e.g. ORDER-0001-001 — unique row key */
  subOrder: string;
  itemId: string;
  /** WH-000 means any warehouse */
  warehouseId: string;
  /** SP-000 means any supplier */
  supplierId: string;
  /** Requested quantity (kg) */
  request: number;
  type: OrderType;
  /** ISO date string for deterministic sorting */
  createDate: string;
  customerId: string;
  remark?: string;
}

/** Base price per (item, supplier) — tier multipliers applied at allocation time. */
export interface PriceRow {
  itemId: string;
  supplierId: string;
  /** DAILY base price (others derived via tier %) */
  basePrice: number;
}

/** Stock on hand for (warehouse, supplier, item). */
export interface StockRow {
  warehouseId: string;
  supplierId: string;
  itemId: string;
  quantity: number;
}

export interface Customer {
  customerId: string;
  /** Human-friendly display name (restaurant/hotel/retailer) */
  name?: string;
  /** Maximum spend allowed (currency units / THB) */
  creditLimit: number;
}

/** Tier multiplier as fraction (1.25 = 125%) */
export const TIER_MULTIPLIER: Record<OrderType, number> = {
  EMERGENCY: 1.25,
  OVER_DUE: 1.0,
  DAILY: 0.9,
};

/** Sort priority — lower = earlier. */
export const TYPE_PRIORITY: Record<OrderType, number> = {
  EMERGENCY: 0,
  OVER_DUE: 1,
  DAILY: 2,
};

export interface AllocationResult {
  /** subOrder -> allocated qty (after auto-allocate or manual edits) */
  allocated: Record<string, number>;
  /** Effective stock key -> remaining quantity */
  stockRemaining: Record<string, number>;
  /** customerId -> credit used */
  creditUsed: Record<string, number>;
  /** subOrder -> { warehouseId, supplierId, unitPrice } chosen during allocation */
  fulfillment: Record<
    string,
    { warehouseId: string; supplierId: string; unitPrice: number } | undefined
  >;
}

export const stockKey = (
  warehouseId: string,
  supplierId: string,
  itemId: string,
) => `${warehouseId}|${supplierId}|${itemId}`;
