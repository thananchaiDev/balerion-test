import type {
  Customer,
  Order,
  OrderType,
  PriceRow,
  StockRow,
} from '@/domain/types';
import catalog from '@/data/catalog.json';
import { pickWeighted, rng, type Weighted } from '@/utils/random';

const ITEM_IDS = catalog.items;
const WAREHOUSES = catalog.warehouses;
const SUPPLIERS = catalog.suppliers;
const NAMED_CUSTOMERS = catalog.namedCustomers;

type CustomerTier = 'VIP' | 'MID' | 'SMALL';

const TIER_WEIGHTS: Weighted<CustomerTier>[] = [
  { value: 'VIP', weight: 0.1 },
  { value: 'MID', weight: 0.3 },
  { value: 'SMALL', weight: 0.6 },
];

const TIER_CREDIT: Record<CustomerTier, [number, number]> = {
  VIP: [200_000, 800_000],
  MID: [60_000, 200_000],
  SMALL: [8_000, 60_000],
};

const ITEM_WEIGHTS: Weighted<string>[] = [
  { value: 'SAL-NOR-A', weight: 0.36 },
  { value: 'SAL-NOR-B', weight: 0.24 },
  { value: 'SAL-CHI-A', weight: 0.2 },
  { value: 'SAL-FAR-A', weight: 0.12 },
  { value: 'SAL-SCT-A', weight: 0.08 },
];

const WAREHOUSE_WEIGHTS: Weighted<string>[] = [
  { value: 'WH-BKK', weight: 0.45 },
  { value: 'WH-CNX', weight: 0.18 },
  { value: 'WH-HKT', weight: 0.2 },
  { value: 'WH-PTY', weight: 0.17 },
];

const SUPPLIER_WEIGHTS: Weighted<string>[] = [
  { value: 'SP-MOWI', weight: 0.4 },
  { value: 'SP-AQCH', weight: 0.25 },
  { value: 'SP-BAKK', weight: 0.2 },
  { value: 'SP-SSF', weight: 0.15 },
];

const TYPE_WEIGHT_BY_TIER: Record<CustomerTier, Weighted<OrderType>[]> = {
  VIP: [
    { value: 'EMERGENCY', weight: 0.4 },
    { value: 'OVER_DUE', weight: 0.3 },
    { value: 'DAILY', weight: 0.3 },
  ],
  MID: [
    { value: 'EMERGENCY', weight: 0.15 },
    { value: 'OVER_DUE', weight: 0.3 },
    { value: 'DAILY', weight: 0.55 },
  ],
  SMALL: [
    { value: 'EMERGENCY', weight: 0.05 },
    { value: 'OVER_DUE', weight: 0.2 },
    { value: 'DAILY', weight: 0.75 },
  ],
};

function pickRequest(rand: () => number, tier: CustomerTier): number {
  const r = rand();
  const skew = tier === 'VIP' ? 1.6 : tier === 'MID' ? 2.4 : 3.2;
  const max = tier === 'VIP' ? 900 : tier === 'MID' ? 350 : 80;
  return Math.max(1, Math.floor(Math.pow(r, skew) * max + rand() * 5));
}

export interface Dataset {
  orders: Order[];
  prices: PriceRow[];
  stocks: StockRow[];
  customers: Customer[];
}

export function generateSyntheticDataset(
  totalSubOrders: number,
  seed = 42,
): Dataset {
  const rand = rng(seed);
  const orders: Order[] = [];

  const extraCustomerCount = Math.max(60, Math.floor(totalSubOrders / 6));
  type CustomerEntry = Customer & { tier: CustomerTier };
  const customerEntries: CustomerEntry[] = NAMED_CUSTOMERS.map((c) => {
    const tier: CustomerTier = pickWeighted(rand, TIER_WEIGHTS);
    const [lo, hi] = TIER_CREDIT[tier];
    return {
      customerId: c.id,
      name: c.name,
      creditLimit: lo + Math.floor(rand() * (hi - lo)),
      tier,
    };
  });
  for (let i = 1; i <= extraCustomerCount; i++) {
    const tier: CustomerTier = pickWeighted(rand, TIER_WEIGHTS);
    const [lo, hi] = TIER_CREDIT[tier];
    customerEntries.push({
      customerId: `CT-${String(i).padStart(4, '0')}`,
      creditLimit: lo + Math.floor(rand() * (hi - lo)),
      tier,
    });
  }

  const activityWeights = customerEntries.map((c) => ({
    value: c,
    weight:
      c.tier === 'VIP'
        ? 3 + rand() * 4
        : c.tier === 'MID'
          ? 1 + rand() * 2
          : 0.2 + rand() * 0.8,
  }));

  let parentIdx = 1;
  let cursor = 0;
  while (cursor < totalSubOrders) {
    const subCount = 1 + Math.floor(rand() * 3);
    const parent = `ORDER-${String(parentIdx).padStart(5, '0')}`;
    const buyer = pickWeighted(rand, activityWeights);
    const type = pickWeighted(rand, TYPE_WEIGHT_BY_TIER[buyer.tier]);
    const day =
      type === 'EMERGENCY'
        ? 20 + Math.floor(rand() * 9)
        : type === 'OVER_DUE'
          ? 10 + Math.floor(rand() * 14)
          : 1 + Math.floor(rand() * 28);
    const createDate = `2025-01-${String(day).padStart(2, '0')}`;

    for (let i = 0; i < subCount && cursor < totalSubOrders; i++, cursor++) {
      const itemId = pickWeighted(rand, ITEM_WEIGHTS);
      const useAnyWh = rand() < 0.18;
      const useAnySp = rand() < 0.12;
      const warehouseId = useAnyWh
        ? 'WH-000'
        : pickWeighted(rand, WAREHOUSE_WEIGHTS);
      const supplierId = useAnySp
        ? 'SP-000'
        : pickWeighted(rand, SUPPLIER_WEIGHTS);
      const request = pickRequest(rand, buyer.tier);
      orders.push({
        order: parent,
        subOrder: `${parent}-${String(i + 1).padStart(3, '0')}`,
        itemId,
        warehouseId,
        supplierId,
        request,
        type,
        createDate,
        customerId: buyer.customerId,
        remark:
          buyer.tier === 'VIP' && rand() < 0.4
            ? 'VIP — priority handling'
            : type === 'EMERGENCY' && rand() < 0.3
              ? 'Rush — confirm before ship'
              : '',
      });
    }
    parentIdx++;
  }

  const prices: PriceRow[] = [];
  for (const itemId of ITEM_IDS) {
    for (const supplierId of SUPPLIERS) {
      prices.push({
        itemId,
        supplierId,
        basePrice: 85 + Math.round(rand() * 5500) / 100,
      });
    }
  }

  const stocks: StockRow[] = [];
  const itemPopularity = new Map(
    ITEM_WEIGHTS.map((w) => [w.value, w.weight] as const),
  );
  const supplierShare = new Map(
    SUPPLIER_WEIGHTS.map((w) => [w.value, w.weight] as const),
  );
  for (const warehouseId of WAREHOUSES) {
    for (const supplierId of SUPPLIERS) {
      for (const itemId of ITEM_IDS) {
        const pop = itemPopularity.get(itemId) ?? 0.2;
        const share = supplierShare.get(supplierId) ?? 0.25;
        const base = Math.max(
          200,
          Math.floor((totalSubOrders / 4) * pop * share * 2.5),
        );
        const jitter = rand() < 0.1 ? 0.2 + rand() * 0.3 : 0.6 + rand() * 0.8;
        stocks.push({
          warehouseId,
          supplierId,
          itemId,
          quantity: Math.max(50, Math.floor(base * jitter)),
        });
      }
    }
  }

  return {
    orders,
    prices,
    stocks,
    customers: customerEntries.map(({ customerId, name, creditLimit }) => ({
      customerId,
      name,
      creditLimit,
    })),
  };
}
