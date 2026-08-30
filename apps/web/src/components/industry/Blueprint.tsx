import type * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * A hairline panel with registration marks at its four corners — the frame
 * every content block sits in across the SVET screens. The marks are drawn
 * outside the border box, so the panel must never clip its own overflow;
 * put `overflow-hidden` on an inner element instead.
 */
export function Blueprint({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('blueprint', className)} {...props}>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      {children}
    </div>
  );
}

/** The uppercase micro-label that titles a panel. */
export function Kicker({
  className,
  accent = false,
  ...props
}: React.ComponentProps<'div'> & { accent?: boolean }) {
  return (
    <div
      className={cn(accent ? 'kicker-accent' : 'kicker', className)}
      {...props}
    />
  );
}

/**
 * Panel header: kicker on the left, an optional action on the right.
 */
export function PanelHead({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-2 flex items-baseline gap-2.5', className)}>
      <Kicker>{title}</Kicker>
      {action ? <div className="ml-auto text-xs">{action}</div> : null}
    </div>
  );
}
