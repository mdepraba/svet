import type * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * The block that opens every screen: an accent kicker naming the section, the
 * screen title, and the screen's primary action pushed to the right.
 */
export function PageHead({
  kicker,
  title,
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div>
        {kicker ? <div className="kicker-accent">{kicker}</div> : null}
        <h3 className="mt-0.5 text-[27px]">{title}</h3>
      </div>
      {actions ? (
        <div className="flex flex-none items-center gap-2.5">{actions}</div>
      ) : null}
    </div>
  );
}
