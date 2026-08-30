/**
 * Indonesian date order and Rupiah, matching the design board and the
 * existing `Clock` component's `id-ID` locale.
 */

const RUPIAH = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** `Rp 4.240.000` — the design writes a space after `Rp`, `id-ID` does not. */
export function rupiah(value: number | string | null | undefined): string {
  const amount = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (!Number.isFinite(amount)) return 'Rp 0';
  return RUPIAH.format(amount).replace(/^Rp\s*/, 'Rp ');
}

/** `4.240.000` — a bare amount for table columns that head their own Rp. */
export function amount(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `14/08/2026` */
export function shortDate(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** `14:30` */
export function shortTime(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** `14/08/2026 14:30` */
export function dateTime(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return `${shortDate(d)} ${shortTime(d)}`;
}

/** `Friday, 14 August 2026` — the dashboard's date line. */
export function longDate(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * `3 y 2 m` — a pet's age as the patient rows write it. Returns `—` when the
 * date of birth is unknown, which the Prisma model allows.
 */
export function petAge(dob: Date | string | null | undefined): string {
  const d = toDate(dob);
  if (!d) return '—';
  const now = new Date();
  let months =
    (now.getFullYear() - d.getFullYear()) * 12 +
    (now.getMonth() - d.getMonth());
  if (now.getDate() < d.getDate()) months -= 1;
  if (months < 0) return '—';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return years > 0 ? `${years} y ${rest} m` : `${rest} m`;
}

/** Initials for the avatar chip: `Budi Santoso` → `BS`. */
export function initials(name: string | null | undefined): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}
