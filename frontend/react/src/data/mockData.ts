import type { Customer, Order, PriceRow, StockRow } from '@/domain/types';
import ordersJson from '@/data/sample-orders.json';
import pricesJson from '@/data/sample-prices.json';
import stocksJson from '@/data/sample-stocks.json';
import customersJson from '@/data/sample-customers.json';

export const SAMPLE_ORDERS = ordersJson as Order[];
export const SAMPLE_PRICES = pricesJson as PriceRow[];
export const SAMPLE_STOCKS = stocksJson as StockRow[];
export const SAMPLE_CUSTOMERS = customersJson as Customer[];

export { generateSyntheticDataset, type Dataset } from '@/data/syntheticData';
