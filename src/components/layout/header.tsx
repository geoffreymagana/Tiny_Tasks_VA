
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Zap } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold">Tiny Tasks</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/#features" className="transition-colors hover:text-primary">
            Features
          </Link>
          <Link href="/#services" className="transition-colors hover:text-primary">
            Services
          </Link>
          <Link href="/#onboarding-overview" className="transition-colors hover:text-primary">
            How It Works
          </Link>
          <Link href="/#copy-comparison" className="transition-colors hover:text-primary">
            Our Approach
          </Link>
          <Button asChild>
            <Link href="/#cta">Get Started</Link>
          </Button>
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <Link href="/" className="flex items-center space-x-2">
                  <Zap className="h-6 w-6 text-primary" />
                  <span className="font-headline text-xl font-bold">Tiny Tasks</span>
                </Link>
                <Link href="/#features" className="hover:text-primary">
                  Features
                </Link>
                <Link href="/#services" className="hover:text-primary">
                  Services
                </Link>
                <Link href="/#onboarding-overview" className="hover:text-primary">
                  How It Works
                </Link>
                <Link href="/#copy-comparison" className="hover:text-primary">
                  Our Approach
                </Link>
                <Button className="w-full" asChild>
                  <Link href="/#cta">Get Started</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
