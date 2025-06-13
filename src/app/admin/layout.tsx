
"use client";
import type { FC, ReactNode } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const { isLoading, isAdmin, user } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading Admin Area...</p>
      </div>
    );
  }

  if (!user) {
    // Should be handled by useAdminAuth redirect, but as a fallback:
    return (
       <div className="flex flex-col min-h-screen items-center justify-center bg-background p-6">
        <h1 className="text-2xl font-bold text-destructive mb-4">Authentication Required</h1>
        <p className="text-center text-foreground/80 mb-6">
          You need to be signed in to access this page.
        </p>
        <Button asChild>
          <Link href="/auth">Go to Sign In</Link>
        </Button>
      </div>
    );
  }
  
  if (!isAdmin) {
     // Should be handled by useAdminAuth redirect, but as a fallback:
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-6">
        <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
        <p className="text-center text-foreground/80 mb-6">
          You do not have the necessary permissions to view this page.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/20">
      <Header />
      {/* Optional: Admin-specific sidebar or sub-navigation could go here */}
      <main className="flex-grow container mx-auto py-8 md:py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default AdminLayout;
