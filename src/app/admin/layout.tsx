
"use client";
import type { FC, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LottieLoader } from '@/components/ui/lottie-loader';
import {
  LogOut, Zap, LayoutDashboard, Users, Briefcase, FileText as FileTextIconLucide,
  Receipt, MessageSquareText, UsersRound, Sparkles, User, Settings2, Newspaper, FolderKanban
} from 'lucide-react';
import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent,
  SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarTrigger, SidebarInset, SidebarRail
} from '@/components/ui/sidebar';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const authState = useAdminAuth();
  const router = useRouter();
  const currentPath = usePathname();
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

  if (authState.isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <LottieLoader size={64} className="text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading Admin Area...</p>
      </div>
    );
  }

  if (!authState.user) {
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

  if (!authState.isAdmin) {
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

  const isActivePath = (href: string) => {
    if (href === "/admin" || href === "/admin/") {
      return currentPath === "/admin" || currentPath === "/admin/";
    }
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  const navItems = [
    { href: "/admin", icon: <LayoutDashboard />, label: "Dashboard", tooltip: "Dashboard" },
    { href: "/admin/cms", icon: <Newspaper />, label: "CMS", tooltip: "Content Management" },
    { href: "/admin/clients", icon: <Users />, label: "Client Hub", tooltip: "Client Management" },
    { href: "/admin/projects", icon: <Briefcase />, label: "Project Hub", tooltip: "Project Hub (coming soon)" },
    { href: "/admin/contracts", icon: <FileTextIconLucide />, label: "Contracts", tooltip: "Contracts Hub" },
    { href: "/admin/invoices", icon: <Receipt />, label: "Invoices", tooltip: "Invoices Hub" },
    { href: "/admin/communication", icon: <MessageSquareText />, label: "Communication Hub", tooltip: "Communication Hub (coming soon)" },
    { href: "/admin/staff", icon: <UsersRound />, label: "Staff", tooltip: "Staff Management" },
    { href: "/admin/file-manager", icon: <FolderKanban />, label: "File Manager", tooltip: "File Manager (coming soon)" },
    { href: "/admin/ai-tools", icon: <Sparkles />, label: "AI Tools", tooltip: "AI Tools & Integrations" },
  ];

  const accountItems = [
    { href: "/admin/profile", icon: <User />, label: "Profile", tooltip: "My Profile" },
    { href: "/admin/settings", icon: <Settings2 />, label: "Settings", tooltip: "Admin Settings" },
  ];

  const getRolePill = () => {
    if (!authState.userData?.role) return null;

    let backgroundColor = '';
    let roleText = '';

    switch (authState.userData.role) {
      case 'admin':
        backgroundColor = '#ef3da6'; // Pink for Admin
        roleText = 'Admin Portal';
        break;
      case 'client':
        backgroundColor = '#f58d11'; // Orange for Client
        roleText = 'Client Portal';
        break;
      case 'staff':
        backgroundColor = '#00274d'; // Primary Dark Blue for Staff
        roleText = 'Staff Portal';
        break;
      default:
        return null;
    }

    return (
      <div
        style={{ backgroundColor }}
        className="ml-auto px-3 py-1 text-xs font-semibold text-white rounded-full"
      >
        {roleText}
      </div>
    );
  };


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
                <SidebarMenuButton asChild isActive={isActivePath(item.href)} tooltip={item.tooltip}>
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
                <SidebarMenuButton asChild isActive={isActivePath(item.href)} tooltip={item.tooltip}>
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
      <SidebarInset className={cn(
          "flex flex-col flex-1 min-h-0 bg-secondary/20 ml-0",
          "transition-all duration-200 ease-linear" 
        )}>
        <div className="flex items-center justify-between px-2 sm:px-4 py-3 border-b border-border bg-background">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          {getRolePill()}
        </div>

        <main className="flex-1 overflow-y-auto container mx-auto px-2 sm:px-4">
          {children}
        </main>
        <Footer className="py-3" />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
