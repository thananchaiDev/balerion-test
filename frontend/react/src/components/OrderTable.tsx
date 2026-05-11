import { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Loader2,
  TriangleAlert,
} from 'lucide-react';
import type { AllocationResult, Order, OrderType } from '@/domain/types';
import type { ValidationOutcome } from '@/logic/allocation';
import type { OrderSortKey, OrderSortState } from '@/utils/orderSort';

import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

interface Props {
  orders: Order[];
  result: AllocationResult;
  onChange: (subOrder: string, value: number) => void;
  validateChange: (subOrder: string, value: number) => ValidationOutcome;
  errors: Record<string, string | undefined>;
  busy?: boolean;
  sort: OrderSortState;
  onSortChange: (sort: OrderSortState) => void;
  startIndex?: number;
}

const TYPE_BADGE: Record<OrderType, BadgeProps['variant']> = {
  EMERGENCY: 'destructive',
  OVER_DUE: 'warning',
  DAILY: 'info',
};

const COL_TEMPLATE =
  'grid-cols-[60px_minmax(105px,1.05fr)_minmax(130px,1.3fr)_minmax(90px,0.9fr)_minmax(135px,1.35fr)_minmax(150px,1.5fr)_minmax(70px,0.7fr)_minmax(90px,0.9fr)_minmax(90px,0.9fr)_minmax(85px,0.85fr)_minmax(75px,0.75fr)_minmax(70px,0.7fr)]';

interface EditState {
  order: Order;
  current: number;
}

interface HeaderConfig {
  label: string;
  align?: 'left' | 'right' | 'center';
  sortKey?: OrderSortKey;
}

interface AllocateDialogProps {
  state: EditState;
  error?: string;
  onClose: () => void;
  onSave: (subOrder: string, value: number) => void;
  validateChange: (subOrder: string, value: number) => ValidationOutcome;
}

function AllocateDialog({
  state,
  error,
  onClose,
  onSave,
  validateChange,
}: AllocateDialogProps) {
  const { order, current } = state;
  const [draft, setDraft] = useState<string>(String(current));

  const parsed = Number(draft);
  const rangeValid =
    !Number.isNaN(parsed) && parsed >= 0 && parsed <= order.request;
  const validation = rangeValid
    ? validateChange(order.subOrder, parsed || 0)
    : { ok: false, reason: `Value must be between 0 and ${order.request}.` };
  const dirty = rangeValid && parsed !== current;
  const canSave = dirty && validation.ok;
  const validationMessage = validation.ok ? undefined : validation.reason ?? error;

  const commit = () => {
    if (!canSave) return;
    onSave(order.subOrder, parsed || 0);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Allocation</DialogTitle>
          <DialogDescription>
            {order.subOrder} · {order.itemId} · {order.customerId}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="text-right">
            <Badge variant={TYPE_BADGE[order.type]}>{order.type}</Badge>
          </dd>
          <dt className="text-muted-foreground">Request</dt>
          <dd className="text-right">{order.request.toLocaleString()}</dd>
          <dt className="text-muted-foreground">Current Allocated</dt>
          <dd className="text-right">{current.toLocaleString()}</dd>
          <dt className="text-muted-foreground">Create</dt>
          <dd className="text-right">{order.createDate}</dd>
        </dl>

        {order.remark && (
          <div className="rounded-md border bg-muted/40 p-2 text-xs">
            <div className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              Remark
            </div>
            {order.remark}
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="alloc-input">
            New Allocated (0 – {order.request})
          </Label>
          <Input
            id="alloc-input"
            type="number"
            step="0.01"
            min={0}
            max={order.request}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
            }}
            className={cn(
              !rangeValid && 'border-destructive focus-visible:ring-destructive',
              rangeValid &&
                !validation.ok &&
                'border-warning focus-visible:ring-warning',
            )}
          />
          {!rangeValid && (
            <p className="text-xs text-destructive">
              Value must be between 0 and {order.request}.
            </p>
          )}
          {rangeValid && validationMessage && (
            <p className="text-xs text-warning-message">{validationMessage}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" size="xl" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="xl"
            onClick={commit}
            disabled={!canSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OrderTable({
  orders,
  result,
  onChange,
  validateChange,
  errors,
  busy,
  sort,
  onSortChange,
  startIndex = 0,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<EditState | null>(null);

  const virtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 53,
    overscan: 12,
  });

  const items = virtualizer.getVirtualItems();

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [orders]);

  const headers = useMemo<HeaderConfig[]>(
    () => [
      { label: '#', align: 'right' },
      { label: 'Order', sortKey: 'order' },
      { label: 'Sub Order', sortKey: 'subOrder' },
      { label: 'Item', sortKey: 'itemId' },
      { label: 'Warehouse', sortKey: 'warehouseId' },
      { label: 'Supplier', sortKey: 'supplierId' },
      { label: 'Request', align: 'right', sortKey: 'request' },
      { label: 'Type', sortKey: 'type' },
      { label: 'Create', sortKey: 'createDate' },
      { label: 'Customer', sortKey: 'customerId' },
      { label: 'Allocated', align: 'right', sortKey: 'allocated' },
      { label: 'Action', align: 'center' },
    ],
    [],
  );

  const toggleSort = (key: OrderSortKey) => {
    onSortChange(
      sort?.key === key
        ? { key, direction: sort.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  };

  return (
    <div className="relative overflow-hidden rounded-lg border bg-card">
      {busy && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
          <Loader2 className="size-8 text-primary animate-spin" strokeWidth={2} />
          <div className="text-sm text-muted-foreground">Allocating…</div>
        </div>
      )}

      <div
        className={cn(
          'grid border-b bg-muted/40 text-xs font-medium text-muted-foreground',
          COL_TEMPLATE,
        )}
      >
        {headers.map((h) => {
          const sortKey = h.sortKey;
          const isSorted = Boolean(sortKey && sort?.key === sortKey);
          const sortedDirection = isSorted && sort ? sort.direction : undefined;
          const SortIcon =
            sortedDirection === 'asc'
              ? ArrowUp
              : sortedDirection === 'desc'
                ? ArrowDown
                : ArrowUpDown;
          const alignClass =
            h.align === 'right'
              ? 'justify-end text-right'
              : h.align === 'center'
                ? 'justify-center text-center'
                : 'justify-start text-left';
          return (
            <div key={h.label} className="min-w-0">
              {sortKey ? (
                <button
                  type="button"
                  onClick={() => toggleSort(sortKey)}
                  aria-label={`Sort by ${h.label}`}
                  aria-pressed={isSorted}
                  className={cn(
                    'group flex h-full w-full items-center gap-1.5 px-2 py-2 hover:bg-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    alignClass,
                  )}
                >
                  <span className="truncate">{h.label}</span>
                  <SortIcon
                    className={cn(
                      'size-3.5 shrink-0',
                      isSorted
                        ? 'text-primary'
                        : 'text-muted-foreground/60 group-hover:text-foreground',
                    )}
                    strokeWidth={2}
                  />
                </button>
              ) : (
                <div
                  className={cn(
                    'px-2 py-2 truncate',
                    h.align === 'right' && 'text-right',
                    h.align === 'center' && 'text-center',
                  )}
                >
                  {h.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: 'min(70vh, 640px)' }}
      >
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {items.map((vRow) => {
            const o = orders[vRow.index];
            const allocated = result.allocated[o.subOrder] ?? 0;
            const err = errors[o.subOrder];
            const hasError = Boolean(err);
            const f = result.fulfillment[o.subOrder];
            const fulfilledLabel = f
              ? `${f.warehouseId}/${f.supplierId}`
              : '';
            const showFulfilled =
              f &&
              (f.warehouseId !== o.warehouseId || f.supplierId !== o.supplierId);
            const rowHint = [
              o.remark || '',
              fulfilledLabel ? `via ${fulfilledLabel}` : '',
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <div
                key={o.subOrder}
                title={hasError ? undefined : rowHint}
                className={cn(
                  'grid items-center border-b text-xs',
                  hasError
                    ? 'border-warning/30 bg-warning/10 hover:bg-warning/15'
                    : 'hover:bg-accent/40',
                  COL_TEMPLATE,
                )}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: vRow.size,
                  transform: `translateY(${vRow.start}px)`,
                }}
              >
                <div className="px-2 text-right tabular-nums text-muted-foreground">
                  {(startIndex + vRow.index + 1).toLocaleString()}
                </div>
                <div className="px-2 truncate">{o.order}</div>
                <div className="px-2 truncate">{o.subOrder}</div>
                <div className="px-2 truncate">{o.itemId}</div>
                <div className="px-2 truncate">
                  {o.warehouseId}
                  {showFulfilled && (
                    <span className="text-muted-foreground"> →{f!.warehouseId}</span>
                  )}
                </div>
                <div className="px-2 truncate">
                  {o.supplierId}
                  {showFulfilled && (
                    <span className="text-muted-foreground"> →{f!.supplierId}</span>
                  )}
                </div>
                <div className="px-2 text-right tabular-nums">
                  {o.request.toLocaleString()}
                </div>
                <div className="px-2">
                  <Badge variant={TYPE_BADGE[o.type]}>{o.type}</Badge>
                </div>
                <div className="px-2 truncate text-muted-foreground">
                  {o.createDate}
                </div>
                <div className="px-2 truncate">{o.customerId}</div>
                <div
                  className={cn(
                    'flex items-center justify-end gap-1.5 px-2 text-right tabular-nums',
                    hasError && 'text-destructive',
                  )}
                >
                  {err && (
                    <span
                      tabIndex={0}
                      aria-label={err}
                      title={err}
                      className="group relative inline-flex rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                    >
                      <TriangleAlert
                        className="size-3.5 text-warning-foreground"
                        strokeWidth={2.25}
                      />
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden w-max max-w-[260px] rounded-md border border-warning/40 bg-tooltip px-2 py-1 text-left text-[11px] leading-4 text-warning-muted shadow-xl group-hover:block group-focus:block"
                      >
                        {err}
                      </span>
                    </span>
                  )}
                  <span>{allocated.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-center px-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setEditing({ order: o, current: allocated })}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <AllocateDialog
          state={editing}
          error={errors[editing.order.subOrder]}
          onClose={() => setEditing(null)}
          onSave={onChange}
          validateChange={validateChange}
        />
      )}
    </div>
  );
}
