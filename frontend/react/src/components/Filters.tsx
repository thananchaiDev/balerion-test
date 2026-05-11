import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FilterState } from '@/utils/filterState';

interface Props {
  value: FilterState;
  onChange: (v: FilterState) => void;
  customerOptions: string[];
  warehouseOptions: string[];
  supplierOptions: string[];
  matchCount: number;
  totalCount: number;
}

const ALL = '__ALL__';

export default function Filters({
  value,
  onChange,
  customerOptions,
  warehouseOptions,
  supplierOptions,
}: Props) {
  const update = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  return (
    <Card className="p-3 grid grid-cols-2 md:grid-cols-6 gap-2">
      <Input
        type="text"
        placeholder="Search order / sub-order / customer / item…"
        className="md:col-span-2"
        value={value.search}
        onChange={(e) => update({ search: e.target.value })}
      />

      <Select
        value={value.type}
        onValueChange={(v) => update({ type: v as FilterState['type'] })}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>
          <SelectItem value="EMERGENCY">EMERGENCY</SelectItem>
          <SelectItem value="OVER_DUE">OVER_DUE</SelectItem>
          <SelectItem value="DAILY">DAILY</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.customerId || ALL}
        onValueChange={(v) => update({ customerId: v === ALL ? '' : v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Customers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Customers</SelectItem>
          {customerOptions.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.warehouseId || ALL}
        onValueChange={(v) => update({ warehouseId: v === ALL ? '' : v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Warehouses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Warehouses</SelectItem>
          {warehouseOptions.map((w) => (
            <SelectItem key={w} value={w}>
              {w}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.supplierId || ALL}
        onValueChange={(v) => update({ supplierId: v === ALL ? '' : v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Suppliers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Suppliers</SelectItem>
          {supplierOptions.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

    </Card>
  );
}
