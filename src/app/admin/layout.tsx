
"use client";
import type { FC, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Loader2, LogOut, Zap, LayoutDashboard, Users, Briefcase, FileText, 
  Receipt, MessageSquareText, UsersRound, Sparkles, User, Settings2 
} from 'lucide-react';
import { 
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, 
  SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, 
  SidebarTrigger, SidebarInset, SidebarRail 
} from '@/components/ui/sidebar';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const { isLoading, isAdmin, user } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/auth');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({ title: 'Logout Failed', description: error.message || 'Could not log out.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading Admin Area...</p>
      </div>
    );
  }

  if (!user) {
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

  const navItems = [
    { href: "/admin", icon: <LayoutDashboard />, label: "Dashboard", tooltip: "Dashboard" },
    { href: "/admin/clients", icon: <Users />, label: "Client Hub", tooltip: "Client Hub" },
    { href: "/admin/projects", icon: <Briefcase />, label: "Project Hub", tooltip: "Project Hub" },
    { href: "/admin/contracts", icon: <FileText />, label: "Contracts", tooltip: "Contracts" },
    { href: "/admin/invoices", icon: <Receipt />, label: "Invoices", tooltip: "Invoices" },
    { href: "/admin/communication", icon: <MessageSquareText />, label: "Communication Hub", tooltip: "Communication Hub" },
    { href: "/admin/staff", icon: <UsersRound />, label: "Staff", tooltip: "Staff Management" },
    { href: "/admin/ai-tools", icon: <Sparkles />, label: "AI Tools", tooltip: "AI Tools" },
  ];

  const accountItems = [
    { href: "/admin/profile", icon: <User />, label: "Profile", tooltip: "My Profile" },
    { href: "/admin/settings", icon: <Settings2 />, label: "Settings", tooltip: "Admin Settings" },
  ];

  return (
    <SidebarProvider defaultOpen>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarRail />
        <SidebarHeader className="p-4 border-b border-sidebar-border">
           <Link href="/admin" className="flex items-center gap-2 group-data-[state=collapsed]:justify-center">
            <Zap className="size-6 text-primary" />
            <span className="font-headline text-xl font-bold text-sidebar-foreground group-data-[state=collapsed]:hidden">Tiny Tasks</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild isActive={router.pathname === item.href} tooltip={item.tooltip}>
                  <Link href={item.href}>
                    {item.icon}
                    <span className="group-data-[state=collapsed]:hidden">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <SidebarMenu>
             {accountItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild isActive={router.pathname === item.href} tooltip={item.tooltip}>
                  <Link href={item.href}>
                    {item.icon}
                    <span className="group-data-[state=collapsed]:hidden">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                <LogOut />
                <span className="group-data-[state=collapsed]:hidden">Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-secondary/20">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
           {/* Mobile sidebar trigger will be here */}
           <div className="md:hidden">
             <SidebarTrigger />
           </div>
           {/* Could add breadcrumbs or page title here */}
           <div className="flex-1">
             <h1 className="text-xl font-semibold text-foreground">Admin Dashboard</h1>
           </div>
        </header>
        <main className="flex-grow container mx-auto py-8 md:py-12">
          {children}
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
