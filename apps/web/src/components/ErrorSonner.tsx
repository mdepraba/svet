import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Error boundary for routes under `_app`. Toasts the error and offers a retry
 * that re-runs the failed loader without a full reload.
 *
 * @param props.error The error thrown by the route.
 */
export function GlobalErrorComponent({ error }: { error: Error }) {
  const router = useRouter();

  useEffect(() => {
    toast.error(error.message || 'Terjadi kesalahan', {
      id: 'global-route-error',
    });
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">
        Terjadi kesalahan saat memuat halaman.
      </p>

      <button
        type="button"
        onClick={() => {
          router.invalidate();
          toast.dismiss('global-route-error');
        }}
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Coba Lagi
      </button>
    </div>
  );
}
