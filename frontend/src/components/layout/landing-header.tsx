'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import KazuPaySolutionsLogo from '@/components/icons/payease-logo';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function LandingHeader() {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4 h-20 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <KazuPaySolutionsLogo className="h-8 w-auto text-primary" />
          <span className="text-xl font-bold text-foreground">KazuPay</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/login')}>
            Sign In
          </Button>
          <Button onClick={() => router.push('/register')}>
            <span>Get Started</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
