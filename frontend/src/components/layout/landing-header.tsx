'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import KazuPayGraphicalLogo from '@/components/icons/kazupay-graphical-logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ArrowRight, Menu } from 'lucide-react';
import { useState } from 'react';

export default function LandingHeader() {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLinkClick = (href: string) => {
    setIsSheetOpen(false);
    setTimeout(() => {
        if (href.startsWith('#')) {
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            router.push(href);
        }
    }, 300);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4 h-20 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <KazuPayGraphicalLogo className="h-10 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/login')}>
            Sign In
          </Button>
          <Button onClick={() => router.push('/register')}>
            <span>Get Started</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-background/90 backdrop-blur-lg">
              <div className="flex flex-col h-full p-6">
                <Link href="/" className="flex items-center gap-2 mb-8" onClick={() => handleLinkClick('/')}>
                  <KazuPayGraphicalLogo className="h-10 w-auto" />
                </Link>
                <nav className="flex flex-col gap-6 text-lg">
                  <a onClick={() => handleLinkClick('#features')} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Features
                  </a>
                  <a onClick={() => handleLinkClick('#pricing')} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Pricing
                  </a>
                </nav>
                <div className="mt-auto flex flex-col gap-4">
                    <Button variant="ghost" onClick={() => handleLinkClick('/login')}>
                        Sign In
                    </Button>
                    <Button onClick={() => handleLinkClick('/register')}>
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
