import { createFileRoute, redirect } from '@tanstack/react-router';

/** The clinic starts its day on the dashboard, not on a landing page. */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});
