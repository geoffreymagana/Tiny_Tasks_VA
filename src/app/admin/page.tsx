
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, Newspaper, Bell, ListChecks, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const AdminDashboardPage: FC = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Middle Section: Primary Workspace */}
      <div className="flex-grow lg:w-2/3 space-y-8">
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
                  <p className="text-sm text-muted-foreground mb-3">Explore AI-powered tools and integrations.</p>
                   <Button asChild variant="outline">
                    <Link href="/admin/ai-tools">Explore AI Tools</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        {/* You can add more cards or sections to the middle panel here */}
      </div>

      {/* Right Panel: Notifications, Updates, Quick Actions */}
      <div className="lg:w-1/3 space-y-6 shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Bell className="mr-2 h-5 w-5 text-accent" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No new notifications.</p>
            {/* Placeholder for actual notifications list */}
            <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-accent">View all</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><ListChecks className="mr-2 h-5 w-5 text-accent" /> Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">New blog post "Intro to VAs" published.</li>
              <li className="text-muted-foreground">Client "Acme Corp" onboarded.</li>
              <li className="text-muted-foreground">Staff member "Jane Doe" updated profile.</li>
            </ul>
            <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-accent">View full log</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Zap className="mr-2 h-5 w-5 text-accent" /> Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Link href="/admin/blog/create" className="flex items-center w-full">
                Create New Blog Post <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Link href="/admin/clients/create" className="flex items-center w-full">
                Add New Client <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Link href="/admin/staff/create" className="flex items-center w-full">
                Add New Staff <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
