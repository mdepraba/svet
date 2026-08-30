import { Button } from '@/components/ui/button';
import { startProviderSignIn } from '@/lib/auth/authClient';

/**
 * A button per identity provider the API reports, rendered from that list
 * rather than from a hard-coded one. Swapping Google for another provider on
 * the API side changes what appears here with no edit to this file — the only
 * Google-specific thing left in the web app is the label and the mark below.
 */
const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
};

export function ProviderButtons({
  providers,
  redirectTo,
  verb,
}: {
  providers: readonly string[];
  redirectTo?: string;
  /** "Sign in" or "Continue" — the surrounding screen decides. */
  verb: string;
}) {
  if (providers.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-ink-600 flex items-center gap-2 text-[10px] tracking-[0.14em] uppercase">
        <span className="bg-border h-px flex-1" />
        or
        <span className="bg-border h-px flex-1" />
      </div>

      {providers.map((provider) => (
        <Button
          key={provider}
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => startProviderSignIn(provider, redirectTo)}
        >
          {provider === 'google' && <GoogleMark />}
          {verb} with {PROVIDER_LABELS[provider] ?? titleCase(provider)}
        </Button>
      ))}
    </div>
  );
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Inline so the button does not depend on a network round trip to render. */
function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7A21.99 21.99 0 0 0 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18A13.2 13.2 0 0 1 11 24c0-1.45.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}
