
"use client"; 

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
          <Link href="/#portfolio" className="transition-colors hover:text-primary">
            Portfolio
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-primary">
            Pricing
          </Link>
          <Link href="/#tools" className="transition-colors hover:text-primary">
            Tools
          </Link>
          <Link href="/about" className="transition-colors hover:text-primary">
            About Us
          </Link>
          <Link href="/blog" className="transition-colors hover:text-primary">
            Blog
          </Link>
          <Button asChild>
            <Link href="/auth">Get Started</Link>
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
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              </SheetHeader>
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
                 <Link href="/#portfolio" className="hover:text-primary">
                  Portfolio
                </Link>
                <Link href="/#pricing" className="hover:text-primary">
                  Pricing
                </Link>
                <Link href="/#tools" className="hover:text-primary">
                  Tools
                </Link>
                <Link href="/about" className="hover:text-primary">
                  About Us
                </Link>
                <Link href="/blog" className="hover:text-primary">
                  Blog
                </Link>
                <Button className="w-full" asChild>
                  <Link href="/auth">Get Started</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
