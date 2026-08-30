import type * as React from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** The filter row: search on the left, a live result count on the right. */
export function Toolbar({
  children,
  count,
  className,
}: {
  children?: React.ReactNode;
  count?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      {children}
      {count !== undefined ? (
        <span className="text-ink-600 ml-auto text-xs">{count}</span>
      ) : null}
    </div>
  );
}

export function SearchInput({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <div className={cn('relative w-[280px] max-w-full', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-[15px] -translate-y-1/2 opacity-45" />
      <Input {...props} className="h-9 pl-[29px]" />
    </div>
  );
}

/**
 * The segmented control the designs use for status filters. Renders as real
 * radios so it stays keyboard- and screen-reader-navigable; `.seg-opt` paints
 * the checked one from the CSS.
 */
export function SegFilter<T extends string>({
  name,
  value,
  options,
  onChange,
  className,
}: {
  name: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('seg', className)} role="radiogroup">
      {options.map((option) => (
        <label key={option.value} className="seg-opt">
          <input
            type="radio"
            name={name}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
