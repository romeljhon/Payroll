
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Calculator,
  FileText,
  Users,
  Settings,
  LogOut,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PayEaseLogo from "@/components/icons/payease-logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/dashboard/computation", label: "Payroll ", icon: Calculator },
  { href: "/dashboard/payslips/generate", label: "Generate Payslips", icon: Send },
  { href: "/dashboard/payslips/history", label: "My Payslips", icon: FileText },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    }
    router.push('/login');
  };

  const bottomNavItems: NavItem[] = [
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/login", label: "Logout", icon: LogOut },
  ];

  if (!mounted) {
    return (
      <aside className="w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col shadow-md">
        <div className="h-16 flex items-center justify-center px-6 border-b border-sidebar-border">
          <Skeleton className="h-8 w-32 bg-muted/50" />
        </div>
        <ScrollArea className="flex-1">
          <nav className="py-6 px-4 space-y-2">
            {navItems.map((item, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg bg-muted/50" />
            ))}
          </nav>
        </ScrollArea>
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <nav className="space-y-2">
            {bottomNavItems.map((item, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg bg-muted/50" />
            ))}
          </nav>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col shadow-md">
      <div className="h-16 flex items-center justify-center px-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <PayEaseLogo className="h-8 w-auto text-primary" />
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-150",
                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm"
                  : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground"
              )}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <nav className="space-y-2">
          {bottomNavItems.map((item) => (
             <Link
              key={item.label}
              href={item.href}
              onClick={item.label === "Logout" ? handleLogout : undefined}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-150",
                pathname === item.href && item.label !== "Logout"
                  ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm"
                  : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground"
              )}
              aria-current={pathname === item.href && item.label !== "Logout" ? "page" : undefined}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
