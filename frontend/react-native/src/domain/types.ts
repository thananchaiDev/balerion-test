export type OrderType = 'EMERGENCY' | 'OVER_DUE' | 'DAILY';

export interface Order {
  orderId: string;
  subOrderId: string;
  itemId: string;
  warehouseId: string;
  supplierId: string;
  request: number;
  type: OrderType;
  createDate: string; // ISO
  customerId: string;
  remark?: string;
}

export interface Allocation {
  subOrderId: string;
  allocated: number; // 2 decimals
  effectivePrice: number; // 2 decimals
  warehouseId: string; // resolved if wildcard
  supplierId: string; // resolved if wildcard
}

export interface PriceRow {
  itemId: string;
  supplierId: string;
  basePrice: number;
}

export interface StockRow {
  itemId: string;
  warehouseId: string;
  supplierId: string;
  available: number;
}

export interface CustomerCredit {
  customerId: string;
  /** Human-friendly display name (restaurant/hotel/retailer) */
  name?: string;
  creditLimit: number; // in money units (THB)
}

export const TIER_MULTIPLIER: Record<OrderType, number> = {
  EMERGENCY: 1.25,
  OVER_DUE: 1.0,
  DAILY: 0.9,
};

export const TYPE_PRIORITY: Record<OrderType, number> = {
  EMERGENCY: 0,
  OVER_DUE: 1,
  DAILY: 2,
};

export const WILDCARD_WAREHOUSE = 'WH-000';
export const WILDCARD_SUPPLIER = 'SP-000';
