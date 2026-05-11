import type {
  Order,
  PriceRow,
  StockRow,
  CustomerCredit,
  OrderType,
} from '../domain/types';
import ordersJson from './sample-orders.json';
import pricesJson from './sample-prices.json';
import stocksJson from './sample-stocks.json';
import customersJson from './sample-customers.json';

type ReactOrderJson = Omit<Order, 'orderId' | 'subOrderId'> & {
  order: string;
  subOrder: string;
};

type ReactStockJson = Omit<StockRow, 'available'> & {
  quantity: number;
};

const toNativeOrder = ({
  order,
  subOrder,
  ...rest
}: ReactOrderJson): Order => ({
  ...rest,
  orderId: order,
  subOrderId: subOrder,
});

const toNativeStock = ({ quantity, ...rest }: ReactStockJson): StockRow => ({
  ...rest,
  available: quantity,
});

// ---- Domain catalog --------------------------------------------------------
// Thai distributor importing premium salmon from international producers,
// fulfilling restaurants/hotels/retailers.

/** Salmon SKUs — origin × grade. */
const ITEMS = [
  'SAL-NOR-A', // Norwegian Atlantic, Grade A (premium fresh)
  'SAL-NOR-B', // Norwegian Atlantic, Grade B (food-service)
  'SAL-CHI-A', // Chilean Atlantic, Grade A
  'SAL-FAR-A', // Faroe Atlantic, Grade A
  'SAL-SCT-A', // Scottish Atlantic, Grade A
] as const;

/** Cold-storage warehouses across Thailand. */
const WAREHOUSES = [
  'WH-BKK', // Bangkok central cold storage
  'WH-CNX', // Chiang Mai (north)
  'WH-HKT', // Phuket (south, tourist hubs)
  'WH-PTY', // Pattaya (east coast hotels)
] as const;

/** Producer / supplier accounts. */
const SUPPLIERS = [
  'SP-MOWI', // Mowi (Norway)
  'SP-AQCH', // AquaChile
  'SP-BAKK', // Bakkafrost (Faroe Islands)
  'SP-SSF', //  Scottish Sea Farms
] as const;

const TYPES: OrderType[] = ['EMERGENCY', 'OVER_DUE', 'DAILY'];

export const SAMPLE_ORDERS: Order[] = (ordersJson as ReactOrderJson[]).map(
  toNativeOrder,
);
export const SAMPLE_PRICES = pricesJson as PriceRow[];
export const SAMPLE_STOCK: StockRow[] = (stocksJson as ReactStockJson[]).map(
  toNativeStock,
);
export const SAMPLE_CREDITS = customersJson as CustomerCredit[];

// ---- Synthetic generator ---------------------------------------------------

/** Named accounts seeded into every dataset for recognisable demos. */
const NAMED_CUSTOMERS: Array<{ id: string; name: string }> = [
  { id: 'CT-SUKIYA', name: 'Sukiya Sushi (Siam)' },
  { id: 'CT-MARRT', name: 'Marriott Pattaya' },
  { id: 'CT-OISHI', name: 'Oishi Grand Restaurant' },
  { id: 'CT-FUJI', name: 'Fuji Japanese' },
  { id: 'CT-MK', name: 'MK Restaurants' },
  { id: 'CT-CENTRA', name: 'Centara Grand BKK' },
  { id: 'CT-TOPS', name: 'Tops Food Hall' },
  { id: 'CT-VILLA', name: 'Villa Market' },
  { id: 'CT-ICONS', name: 'IconSiam Foodcourt' },
  { id: 'CT-ZEN', name: 'ZEN Restaurant' },
  { id: 'CT-BIGC', name: 'Big C Premium' },
  { id: 'CT-ANANT', name: 'Anantara Resorts' },
];

function seededRand(seed: number): () => number {
  // Mulberry32
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSyntheticOrders(count: number, seed = 42): Order[] {
  const rng = seededRand(seed);
  const customerIds = [
    ...NAMED_CUSTOMERS.map(c => c.id),
    ...Array.from(
      { length: 200 },
      (_, i) => `CT-${String(i + 1).padStart(4, '0')}`,
    ),
  ];
  const orders: Order[] = [];
  const baseDate = new Date('2025-01-01').getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  for (let i = 0; i < count; i++) {
    const orderIdx = Math.floor(i / 2);
    const subIdx = (i % 2) + 1;
    const customerId = customerIds[Math.floor(rng() * customerIds.length)]!;
    const item = ITEMS[Math.floor(rng() * ITEMS.length)]!;
    const useAnyWh = rng() < 0.15;
    const useAnySp = rng() < 0.15;
    const wh = useAnyWh
      ? 'WH-000'
      : WAREHOUSES[Math.floor(rng() * WAREHOUSES.length)]!;
    const sp = useAnySp
      ? 'SP-000'
      : SUPPLIERS[Math.floor(rng() * SUPPLIERS.length)]!;
    const type = TYPES[Math.floor(rng() * TYPES.length)]!;
    const dayOffset = Math.floor(rng() * 28);
    const date = new Date(baseDate + dayOffset * dayMs)
      .toISOString()
      .slice(0, 10);
    orders.push({
      orderId: `ORDER-${String(orderIdx + 1).padStart(5, '0')}`,
      subOrderId: `ORDER-${String(orderIdx + 1).padStart(5, '0')}-${String(
        subIdx,
      ).padStart(3, '0')}`,
      itemId: item,
      warehouseId: wh,
      supplierId: sp,
      request: Math.floor(rng() * 240) + 10,
      type,
      createDate: date,
      customerId,
      remark: rng() < 0.04 ? 'VIP — priority handling' : undefined,
    });
  }
  return orders;
}

// Match credits/stock/prices for synthetic.
export function generateCreditsForOrders(orders: Order[]): CustomerCredit[] {
  const seen = new Set<string>();
  const credits: CustomerCredit[] = [];
  const nameById = new Map(NAMED_CUSTOMERS.map(c => [c.id, c.name]));
  for (const o of orders) {
    if (seen.has(o.customerId)) continue;
    seen.add(o.customerId);
    credits.push({
      customerId: o.customerId,
      name: nameById.get(o.customerId),
      creditLimit: nameById.has(o.customerId) ? 200_000 : 50_000,
    });
  }
  return credits;
}

export function generateStockForOrders(orders: Order[]): StockRow[] {
  const map = new Map<string, StockRow>();
  const items = new Set(orders.map(o => o.itemId));
  for (const it of items) {
    for (const wh of WAREHOUSES) {
      for (const sp of SUPPLIERS) {
        const key = `${it}|${wh}|${sp}`;
        if (!map.has(key)) {
          map.set(key, {
            itemId: it,
            warehouseId: wh,
            supplierId: sp,
            available: 5000,
          });
        }
      }
    }
  }
  return Array.from(map.values());
}
