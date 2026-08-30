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
  registerWithPassword,
} from '@/lib/auth/authClient';
import { type Register, RegisterSchema } from '@svet-monorepo/schemas';

export const Route = createFileRoute('/register')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const providers = useQuery({
    queryKey: ['auth', 'providers'],
    queryFn: fetchAuthProviders,
    staleTime: Infinity,
  });

  const register = useMutation({
    mutationFn: (input: Register) => registerWithPassword(input),
    onSuccess: (session) => {
      toast.success(`Welcome, ${session.user.name}`);
      navigate({ to: landingRoute(redirect) });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'Could not create the account',
      ),
  });

  const update = (field: keyof Register) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="bg-background text-foreground grid min-h-screen place-items-center p-6">
      <form
        className="flex w-[340px] max-w-full flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();

          // Checked here as well as at the API, so the password rules are shown
          // before a round trip rather than after one.
          const parsed = RegisterSchema.safeParse(form);

          if (!parsed.success) {
            const message =
              parsed.error.issues[0]?.message ?? 'Check the form and try again';
            setPasswordError(message);
            toast.error(message);
            return;
          }

          setPasswordError(null);
          register.mutate(parsed.data);
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
            <div className="font-heading text-[19px]">Create an account</div>
            <div className="text-ink-600 text-xs">
              Already registered through Google? Use the same email and both
              will share one account.
            </div>
          </div>

          <label>
            <span className="text-ink-700 mb-1.5 block text-xs">Name</span>
            <Input
              className="h-9"
              autoComplete="name"
              required
              value={form.name}
              onChange={(event) => update('name')(event.target.value)}
            />
          </label>

          <label>
            <span className="text-ink-700 mb-1.5 block text-xs">Email</span>
            <Input
              className="h-9"
              type="email"
              autoComplete="username"
              required
              value={form.email}
              onChange={(event) => update('email')(event.target.value)}
            />
          </label>

          <label>
            <span className="text-ink-700 mb-1.5 block text-xs">Password</span>
            <Input
              className="h-9"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(event) => update('password')(event.target.value)}
            />
            <span className="text-ink-600 mt-1.5 block text-[11px]">
              {passwordError ??
                'At least 8 characters, with upper and lower case, a number, and a symbol.'}
            </span>
          </label>

          <Button
            type="submit"
            className="w-full"
            disabled={register.isPending}
          >
            {register.isPending ? 'Creating account…' : 'Create account'}
          </Button>

          <ProviderButtons
            providers={providers.data?.identityProviders ?? []}
            redirectTo={redirect}
            verb="Continue"
          />

          <div className="text-ink-600 text-center text-xs">
            Already have an account?{' '}
            <Link
              to="/login"
              search={{ redirect }}
              className="text-primary underline underline-offset-2"
            >
              Sign in
            </Link>
          </div>
        </Blueprint>
      </form>
    </div>
  );
}
