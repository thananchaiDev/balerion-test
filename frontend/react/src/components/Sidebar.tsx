import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  Fish,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils/cn';

const NAV: { to: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'shrink-0 border-r bg-card flex flex-col transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      <div
        className={cn(
          'px-3 py-4 flex items-center gap-2',
          collapsed && 'justify-center',
        )}
      >
        <Fish className="size-5 text-primary shrink-0" strokeWidth={1.75} />
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-none">Salmon</div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Allocation Console
            </div>
          </div>
        )}
      </div>
      <Separator />

      <nav className="p-2 space-y-1 flex-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <NavLink
              key={n.to}
              to={n.to}
              title={collapsed ? n.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-secondary text-primary'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
              {!collapsed && <span>{n.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <Separator />
      <div className="p-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'w-full justify-start text-muted-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" strokeWidth={1.75} />
          ) : (
            <>
              <PanelLeftClose className="size-4" strokeWidth={1.75} />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
