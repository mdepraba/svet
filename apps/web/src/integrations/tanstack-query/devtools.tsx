import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';

/**
 * The React Query panel, as a plugin for the `TanStackDevtools` shell in
 * `routes/__root.tsx` — hence a plain object rather than a component.
 */
export default {
  name: 'Tanstack Query',
  render: <ReactQueryDevtoolsPanel />,
};
