import type * as React from 'react';

import { cn } from '@/lib/utils';

type TagTone = 'accent' | 'accent-2' | 'neutral' | 'outline';

export function Tag({
  tone = 'neutral',
  className,
  ...props
}: React.ComponentProps<'span'> & { tone?: TagTone }) {
  return <span className={cn('tag', `tag-${tone}`, className)} {...props} />;
}

/**
 * Visit status. SCHEDULED reads as an outline because nothing has happened
 * yet, ONGOING is the only filled state so the row in progress is findable,
 * and the two terminal states sit back in neutral.
 */
const VISIT_TONE: Record<string, TagTone> = {
  SCHEDULED: 'outline',
  ONGOING: 'accent',
  FINISHED: 'neutral',
  CANCELLED: 'neutral',
};

export function VisitStatusTag({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Tag
      tone={VISIT_TONE[status] ?? 'neutral'}
      className={cn(
        'text-[9.5px]',
        status === 'CANCELLED' && 'opacity-60',
        className,
      )}
    >
      {status}
    </Tag>
  );
}

const INVOICE_TONE: Record<string, TagTone> = {
  PENDING: 'accent',
  PAID: 'neutral',
  CANCELLED: 'neutral',
};

export function InvoiceStatusTag({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Tag
      tone={INVOICE_TONE[status] ?? 'neutral'}
      className={cn(
        'text-[9px]',
        status === 'CANCELLED' && 'opacity-60',
        className,
      )}
    >
      {status}
    </Tag>
  );
}
