
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Calculator,
  FileText,
  Users,
  Send,
  CalendarPlus,
  Briefcase,
  Network,
  GitBranch,
  Layers,
  GitMerge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PayEaseLogo from "@/components/icons/payease-logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useEffect } from "react";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent
} from "@/components/ui/accordion";
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
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/organization", label: "Organization", icon: Network },
];

const payrollSubItems: NavItem[] = [
  { href: "/dashboard/payroll/cycle", label: "Payroll Cycle", icon: Calculator },
  { href: "/dashboard/payroll/policy", label: "Payroll Policy", icon: Calculator },
  { href: "/dashboard/payroll/positions", label: "Positions", icon: Briefcase },
  { href: "/dashboard/payroll/holidays", label: "Holidays", icon: CalendarPlus },
  { href: "/dashboard/payroll/salary-component", label: "Components", icon: Layers },
  { href: "/dashboard/payroll/salary-structure", label: "Salary Structure", icon: GitMerge },
  { href: "/dashboard/payroll/records", label: "Payroll Records", icon: Calculator },
  { href: "/dashboard/payslips/generate", label: "Generate Payslips", icon: Send },
];

const organizationSubItems: NavItem[] = [
  { href: "/dashboard/organization/branches", label: "Branches", icon: GitBranch },
  { href: "/dashboard/organization/business", label: "Business", icon: Briefcase },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          {navItems.map((item) => {
            if (item.label === "Payroll ") {
              return (
                <Accordion type="single" collapsible key={item.label} className="w-full">
                  <AccordionItem value="item-1" className="border-none">
                    <AccordionTrigger className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg transition-colors duration-150 hover:no-underline",
                      pathname.startsWith("/dashboard/payroll") || pathname.startsWith("/dashboard/payslips")
                        ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm"
                        : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground"
                    )}>
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="ml-6 border-l border-sidebar-border py-1 space-y-1">
                      {payrollSubItems.map((subItem) => (
                        <Link
                          key={subItem.label}
                          href={subItem.href}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-150",
                            pathname === subItem.href
                              ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm"
                              : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground"
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
            if (item.label === "Organization") {
              return (
                <Accordion type="single" collapsible key={item.label} className="w-full">
                  <AccordionItem value="item-1" className="border-none">
                    <AccordionTrigger className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg transition-colors duration-150 hover:no-underline",
                      pathname.startsWith("/dashboard/organization")
                        ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm"
                        : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground"
                    )}>
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="ml-6 border-l border-sidebar-border py-1 space-y-1">
                      {organizationSubItems.map((subItem) => (
                        <Link
                          key={subItem.label}
                          href={subItem.href}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-150",
                            pathname === subItem.href
                              ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm"
                              : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground"
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
            return (
              <Link key={item.label} href={item.href} className={cn("flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-150", pathname === item.href ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm" : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground")} aria-current={pathname === item.href ? "page" : undefined}>
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
