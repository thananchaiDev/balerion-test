import type { OrderType } from '../domain/types';

export interface FilterState {
  search: string;
  type: OrderType | 'ALL';
  customerId: string;
  warehouseId: string;
  supplierId: string;
}

export const initialFilter: FilterState = {
  search: '',
  type: 'ALL',
  customerId: '',
  warehouseId: '',
  supplierId: '',
};
