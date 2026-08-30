import { Link } from '@tanstack/react-router';
import {
  ChevronRight,
  CreditCard,
  Home,
  Hospital,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

type NavLeaf = { title: string; url: string };
type NavItem = {
  title: string;
  icon: typeof Home;
  url?: string;
  subItems?: NavLeaf[];
};

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Users', url: '/staff', icon: Users },
  {
    title: 'Medical',
    icon: Hospital,
    subItems: [
      { title: 'Owner', url: '/owner' },
      { title: 'Patient', url: '/patient' },
      { title: 'Visit', url: '/visit' },
      { title: 'Medical record', url: '/record' },
    ],
  },
  {
    title: 'Finance',
    icon: CreditCard,
    subItems: [
      { title: 'Invoice', url: '/invoice' },
      { title: 'Product', url: '/product' },
      { title: 'Treatment', url: '/treatment' },
      { title: 'Inventory', url: '/inventory' },
    ],
  },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-3.5">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 px-1.5 py-1 no-underline"
        >
          <div className="text-primary border-primary grid size-7 flex-none place-items-center border">
            <Stethoscope className="size-4" />
          </div>
          <div className="flex flex-col leading-[1.05]">
            <span className="font-heading text-foreground text-lg tracking-[0.03em]">
              SVET
            </span>
            <span className="text-[9.5px] tracking-[0.16em] text-ink-600 uppercase">
              Vet Clinic
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9.5px] tracking-[0.14em] uppercase">
            Main menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-px">
              {navItems.map((item) =>
                item.subItems ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link
                                  to={subItem.url}
                                  activeProps={{
                                    className:
                                      'bg-sidebar-accent text-sidebar-accent-foreground',
                                  }}
                                  activeOptions={{ exact: false }}
                                >
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link
                        to={item.url}
                        activeProps={{
                          className:
                            'bg-sidebar-accent text-sidebar-accent-foreground',
                        }}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
