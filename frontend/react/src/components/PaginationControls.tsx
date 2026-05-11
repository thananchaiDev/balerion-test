import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  page: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function PaginationControls({
  page,
  pageSize,
  pageSizeOptions,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, pageCount);
  const firstItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, totalItems);
  const canGoBack = safePage > 1;
  const canGoForward = safePage < pageCount;

  return (
    <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-muted-foreground">
        Showing{' '}
        <span className="font-medium text-foreground">
          {firstItem.toLocaleString()}-{lastItem.toLocaleString()}
        </span>{' '}
        of{' '}
        <span className="font-medium text-foreground">
          {totalItems.toLocaleString()}
        </span>{' '}
        sub-orders
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="order-page-size" className="text-xs text-muted-foreground">
          Rows
        </Label>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger id="order-page-size" className="h-9 w-[88px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          aria-label="First page"
          disabled={!canGoBack}
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          aria-label="Previous page"
          disabled={!canGoBack}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="min-w-[92px] text-center text-xs">
          Page {safePage.toLocaleString()} / {pageCount.toLocaleString()}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          aria-label="Next page"
          disabled={!canGoForward}
          onClick={() => onPageChange(safePage + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          aria-label="Last page"
          disabled={!canGoForward}
          onClick={() => onPageChange(pageCount)}
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
