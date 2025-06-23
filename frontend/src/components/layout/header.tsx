
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Search, UserCircle, Sun, Moon, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard Overview";
  if (pathname.startsWith("/dashboard/attendance")) return "Attendance Management";
  if (pathname.startsWith("/dashboard/computation")) return "Payroll Computation";
  if (pathname.startsWith("/dashboard/payslips/generate")) return "Generate Payslips";
  if (pathname.startsWith("/dashboard/payslips/history")) return "My Payslips";
  if (pathname.startsWith("/dashboard/employees")) return "Employee Management";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "PayEase";
}

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [userName, setUserName] = useState("User");
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        setUserName(storedEmail.split('@')[0] || "User");
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    }
    router.push('/login');
  };

  if (!mounted) {
    return ( 
      <header className="h-16 flex-shrink-0 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-muted rounded-md animate-pulse md:hidden"></div>
          <div className="h-6 w-48 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-9 w-64 bg-muted rounded-full animate-pulse hidden md:block"></div>
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 bg-muted rounded-full animate-pulse"></div>
            <div className="h-4 w-20 bg-muted rounded animate-pulse hidden md:inline-block"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 flex-shrink-0 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-muted-foreground hover:text-foreground" 
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-lg sm:text-xl font-semibold text-foreground font-headline">{pageTitle}</h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10 pr-4 py-2 h-9 w-64 rounded-full" />
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 px-1 sm:px-2 rounded-full hover:bg-muted">
              <UserCircle className="h-7 w-7 text-muted-foreground" />
              <span className="hidden md:inline text-sm font-medium text-foreground">{userName}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
               Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
