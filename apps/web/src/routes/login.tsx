import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Blueprint } from '@/components/industry/Blueprint';
import { ProviderButtons } from '@/features/auth/components/ProviderButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  fetchAuthProviders,
  landingRoute,
  signInWithPassword,
} from '@/lib/auth/authClient';
import type { SignIn } from '@svet-monorepo/schemas';

/** One of the two screens outside the app shell. */
export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    // Set by the route guard when it bounces someone off a private page, so
    // signing in returns them to where they were headed.
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Only offer the buttons this API can actually honour — an environment with
  // no Google credentials should not show a Google button.
  const providers = useQuery({
    queryKey: ['auth', 'providers'],
    queryFn: fetchAuthProviders,
    staleTime: Infinity,
  });

  const signIn = useMutation({
    mutationFn: (input: SignIn) => signInWithPassword(input),
    onSuccess: (session) => {
      toast.success(`Signed in as ${session.user.name}`);
      navigate({ to: landingRoute(redirect) });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'Could not sign you in',
      ),
  });

  return (
    <div className="bg-background text-foreground grid min-h-screen place-items-center p-6">
      <form
        className="flex w-[340px] max-w-full flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          signIn.mutate({ email, password });
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="text-primary border-primary grid size-[34px] flex-none place-items-center border">
            <Stethoscope className="size-5" />
          </div>
          <div className="flex flex-col leading-[1.05]">
            <span className="font-heading text-[22px] tracking-[0.03em]">
              SVET
            </span>
            <span className="text-ink-600 text-[9.5px] tracking-[0.16em] uppercase">
              Vet Clinic
            </span>
          </div>
        </div>

        <Blueprint className="flex flex-col gap-3 px-4 py-4">
          <div>
            <div className="font-heading text-[19px]">Sign in</div>
            <div className="text-ink-600 text-xs">
              Staff accounts only. Ask an admin for access.
            </div>
          </div>

          <label>
            <span className="text-ink-700 mb-1.5 block text-xs">Email</span>
            <Input
              className="h-9"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            <span className="text-ink-700 mb-1.5 block text-xs">Password</span>
            <Input
              className="h-9"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <Button type="submit" className="w-full" disabled={signIn.isPending}>
            {signIn.isPending ? 'Signing in…' : 'Sign in'}
          </Button>

          <ProviderButtons
            providers={providers.data?.identityProviders ?? []}
            redirectTo={redirect}
            verb="Sign in"
          />

          <div className="text-ink-600 text-center text-xs">
            No account yet?{' '}
            <Link
              to="/register"
              search={{ redirect }}
              className="text-primary underline underline-offset-2"
            >
              Register
            </Link>
          </div>
        </Blueprint>
      </form>
    </div>
  );
}
