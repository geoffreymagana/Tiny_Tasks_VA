
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const AdminDashboardPage: FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Admin Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Activity className="mr-2 h-6 w-6 text-accent" /> Dashboard Overview</CardTitle>
          <CardDescription>Welcome to the Tiny Tasks admin dashboard. Here you can manage your content and tools.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground/80">
            This is your main dashboard area. Future updates could include summary statistics, quick actions, or important notifications.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Newspaper className="mr-2 h-5 w-5 text-primary"/> CMS</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Manage blog posts, pages, and other website content.</p>
                <Button asChild variant="outline">
                  <Link href="/admin/cms">Go to CMS</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Zap className="mr-2 h-5 w-5 text-primary"/> AI Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Access AI-powered tools like image generation.</p>
                 <Button asChild variant="outline">
                  <Link href="/admin/cms">Access AI Image Generator</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
