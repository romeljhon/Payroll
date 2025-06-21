
"use client";

import type { ReactNode } from 'react';
import { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 md:hidden">
          <Sidebar />
        </SheetContent>
      </Sheet>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={toggleMobileMenu} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6 md:p-8">
          <div className="animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
