import { createFileRoute, Outlet } from '@tanstack/react-router';

import { GlobalErrorComponent } from '@/components/ErrorSonner';
import Header from '@/components/Header';
import { AppSidebar } from '@/components/Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export const Route = createFileRoute('/_app')({
  /**
   * The whole signed-in app renders in the browser, not on the server.
   *
   * Every page under here loads per-user data with the access token, and that
   * token lives in the browser's storage — a server render has no way to see
   * it, so every loader beneath this route would fetch as an anonymous caller
   * and get a 401. Nothing on these screens is public or cacheable, so there
   * is nothing to gain by rendering them server-side anyway.
   *
   * The public screens — sign-in, register, the provider callback — keep SSR.
   */
  ssr: false,

  staticData: {
    breadcrumb: false,
  },
  component: AppLayout,
  errorComponent: GlobalErrorComponent,
});

function AppLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />

        <main className="flex w-full flex-1 flex-col overflow-hidden">
          <Header />

          <div className="flex-1 overflow-y-auto p-[18px]">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
