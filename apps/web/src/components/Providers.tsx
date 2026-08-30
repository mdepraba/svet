'use client';

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api';

/**
 * QueryClient provider with toast-on-error handling.
 *
 * NOT MOUNTED — nothing imports this, so none of it is in effect. The live
 * client is created in `@/integrations/tanstack-query/root-provider`; wiring
 * this behaviour up means moving these caches there.
 *
 * @param props.children Subtree to render.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },

        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.state.data !== undefined) {
              toast.error(`Gagal memperbarui data: ${error.message}`);
            } else {
              toast.error(error.message);
            }
          },
        }),

        mutationCache: new MutationCache({
          onError: (error) => {
            if (error instanceof ApiError) {
              toast.error(`Gagal menyimpan data (Status: ${error.status})`, {
                description: error.message,
              });
            } else {
              toast.error('Terjadi kesalahan jaringan');
            }
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
