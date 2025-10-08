'client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Calculator,
  Users,
  Send,
  Briefcase,
  Network,
  GitBranch,
  GitMerge,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRolesAndPermissions } from '@/hooks/roles-and-permissions';

type Role = 'owner' | 'admin' | 'employee';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'admin'] },
  { href: '/dashboard/organization', label: 'Organization', icon: Network, roles: ['owner', 'admin'] },
  { href: '/dashboard/employees', label: 'Employees', icon: Users, roles: ['owner', 'admin'] },
  { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['owner', 'admin'] },
  { href: '/dashboard/computation', label: 'Payroll', icon: Calculator, roles: ['owner', 'admin'] },
  { href: '/dashboard/payslips/generate', label: 'Payslips', icon: Send, roles: ['owner', 'admin'] },
  { href: '/dashboard/tutorial', label: 'View Tutorial', icon: Send, roles: ['owner', 'admin', 'employee'] },
  { href: '/dashboard/my-payslips', label: 'My Payslips', icon: FileText, roles: ['employee'] },
];

const payrollSubItems: NavItem[] = [
  { href: '/dashboard/payroll/config', label: 'Payroll Configuration', icon: GitMerge, roles: ['owner', 'admin'] },
  { href: '/dashboard/payroll/records', label: 'Payroll Records', icon: Calculator, roles: ['owner', 'admin'] },
];

const payslipsSubItems: NavItem[] = [
    { href: '/dashboard/payslips/generate', label: 'Generate & Preview', icon: Calculator, roles: ['owner', 'admin'] },
    { href: '/dashboard/payslips/distribution', label: 'Distribution', icon: Send, roles: ['owner', 'admin'] },
];

const organizationSubItems: NavItem[] = [
  { href: '/dashboard/organization/business', label: 'Business', icon: Briefcase, roles: ['owner', 'admin'] },
  { href: '/dashboard/organization/branches', label: 'Branches', icon: GitBranch, roles: ['owner', 'admin'] },
  { href: '/dashboard/organization/schedule', label: 'Work Schedule', icon: GitBranch, roles: ['owner', 'admin'] },
];

const employeesSubItems: NavItem[] = [
  { href: '/dashboard/employees/positions', label: 'Positions', icon: Briefcase, roles: ['owner', 'admin'] },
  { href: '/dashboard/employees', label: 'All Employees', icon: Users, roles: ['owner', 'admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useRolesAndPermissions();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  if (!mounted) {
    return (
      <aside className="w-64 flex-shrink-0 border-r border-sidebar-border backdrop-blur-md text-sidebar-foreground flex flex-col shadow-lg">
        <div className="h-16 flex items-center justify-center px-6 border-b border-sidebar-border">
          <Skeleton className="h-8 w-32 bg-muted/50" />
        </div>
        <ScrollArea className="flex-1">
          <nav className="py-6 px-4 space-y-2">
            {filteredNavItems.map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg bg-muted/50" />
            ))}
          </nav>
        </ScrollArea>
      </aside>
    );
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex-shrink-0 border-r border-sidebar-border backdrop-blur-md text-sidebar-foreground flex flex-col shadow-lg transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary whitespace-nowrap">KazuPay Solutions</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-sidebar-hover transition-all duration-200 hidden sm:flex"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="py-6 px-2 space-y-2">
            {filteredNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.label === 'Payroll' && pathname.startsWith('/dashboard/payroll')) ||
                (item.label === 'Payslips' && pathname.startsWith('/dashboard/payslips')) ||
                (item.label === 'Organization' && pathname.startsWith('/dashboard/organization')) ||
                (item.label === 'Employees' && pathname.startsWith('/dashboard/employees'));

              const renderLink = (isCollapsed: boolean) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => { if (collapsed) e.preventDefault(); }}
                  className={cn(
                    'group relative flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02]',
                    isActive ? 'bg-sidebar-active text-sidebar-active-foreground shadow-md' : 'hover:bg-sidebar-hover hover:text-sidebar-hover-foreground',
                    isCollapsed && 'justify-center opacity-70'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && !isCollapsed && <span className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-primary"></span>}
                  <item.icon className="h-5 w-5" />
                  {!isCollapsed && <span className="font-semibold tracking-wide">{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>{renderLink(true)}</TooltipTrigger>
                    <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
                  </Tooltip>
                );
              }

              if (['Payroll', 'Payslips', 'Organization', 'Employees'].includes(item.label)) {
                const subItems = 
                    item.label === 'Payroll' ? payrollSubItems : 
                    item.label === 'Payslips' ? payslipsSubItems :
                    item.label === 'Organization' ? organizationSubItems : 
                    employeesSubItems;
                return (
                  <Accordion type="single" collapsible key={item.label} className="w-full">
                    <AccordionItem value={item.label.toLowerCase()} className="border-none">
                      <AccordionTrigger
                        className={cn(
                          'group relative flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 hover:no-underline',
                          isActive ? 'bg-sidebar-active text-sidebar-active-foreground shadow-md' : 'hover:bg-sidebar-hover hover:text-sidebar-hover-foreground'
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-5 w-5" />
                          <span className="font-semibold tracking-wide">{item.label}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="ml-6 border-l border-sidebar-border py-1 space-y-1">
                        {subItems.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className={cn(
                              'flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02]',
                              pathname === subItem.href ? 'bg-sidebar-active text-sidebar-active-foreground shadow-md' : 'hover:bg-sidebar-hover hover:text-sidebar-hover-foreground'
                            )}
                          >
                            <subItem.icon className="h-4 w-4" />
                            <span>{subItem.label}</span>
                          </Link>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              }

              return renderLink(false);
            })}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}
''