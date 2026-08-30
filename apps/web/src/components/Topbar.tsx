import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Clock } from './clock';
import { DynamicBreadcrumb } from './DynamicBreadcrumb'; // Import komponen baru

export function AppTopbar() {
  return (
    <header className="bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="text-foreground/70 hover:text-foreground hover:bg-accent -ml-1 rounded-md p-2 transition-colors" />

      <Separator orientation="vertical" className="mr-2 h-4" />

      <DynamicBreadcrumb />

      <div className="ml-auto flex items-center gap-6">
        <Clock />

        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
