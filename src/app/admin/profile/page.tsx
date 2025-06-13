
"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { User, Shield, Users2, Bell, Trash2, Save, Camera, UploadCloud } from 'lucide-react';
import { updateUserProfileServerAction, type UserProfileUpdateResult } from './actions';
import { ScrollArea } from '@/components/ui/scroll-area';

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  ref: React.RefObject<HTMLDivElement>;
}

const AdminProfilePage: FC = () => {
  const { user: firebaseUser, userData, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  // Refs for scrolling
  const profileRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);
  const teamsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
    },
  });

  useEffect(() => {
    if (userData?.displayName) {
      form.reset({ displayName: userData.displayName });
    }
  }, [userData, form]);

  const navItems: NavItem[] = [
    { id: 'profile', label: 'Profile', icon: <User className="mr-2 h-5 w-5" />, ref: profileRef },
    { id: 'security', label: 'Security', icon: <Shield className="mr-2 h-5 w-5" />, ref: securityRef },
    { id: 'teams', label: 'Teams', icon: <Users2 className="mr-2 h-5 w-5" />, ref: teamsRef },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="mr-2 h-5 w-5" />, ref: notificationsRef },
    { id: 'delete', label: 'Delete Account', icon: <Trash2 className="mr-2 h-5 w-5" />, ref: deleteRef },
  ];

  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement>, sectionId: string) => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
  };

  const handleNameUpdate: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!firebaseUser?.uid) {
      toast({ title: 'Error', description: 'User not authenticated.', variant: 'destructive' });
      return;
    }
    setIsSubmittingName(true);
    const result: UserProfileUpdateResult = await updateUserProfileServerAction(firebaseUser.uid, data.displayName);
    if (result.success) {
      toast({ title: 'Success', description: 'Profile name updated successfully.' });
      // Optionally refetch userData or update local state if useAdminAuth doesn't auto-update fast enough
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsSubmittingName(false);
  };
  
  const handleAvatarUpload = () => {
    toast({ title: 'Coming Soon', description: 'Avatar upload functionality will be available soon.' });
  };

  const handleBannerUpload = () => {
     toast({ title: 'Coming Soon', description: 'Banner upload functionality will be available soon.' });
  };


  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <LottieLoader size={64} />
        <p className="ml-4 text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left Navigation */}
      <aside className="md:w-1/4 lg:w-1/5">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  className="justify-start"
                  onClick={() => scrollToSection(item.ref, item.id)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 md:w-3/4 lg:w-4/5">
        <ScrollArea className="h-[calc(100vh-10rem)]"> {/* Adjust height as needed */}
          <div className="space-y-12 pr-4">
            {/* Profile Section */}
            <section id="profile" ref={profileRef} className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Public Profile</CardTitle>
                  <CardDescription>Customize your public presence.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Banner Image */}
                  <div className="relative h-48 md:h-64 bg-muted rounded-lg group">
                    <Image
                      src="https://placehold.co/1200x400.png"
                      alt="Profile Banner"
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg"
                      data-ai-hint="abstract gradient"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 hover:bg-background"
                      onClick={handleBannerUpload}
                    >
                      <UploadCloud className="mr-2 h-4 w-4" /> Upload Banner
                    </Button>
                  </div>

                  {/* Avatar and Name */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 -mt-16 sm:-mt-20 px-6">
                    <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-background bg-muted group">
                      <Image
                        src={userData?.photoURL || "https://placehold.co/160x160.png"}
                        alt={userData?.displayName || "User Avatar"}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-full"
                        data-ai-hint="professional avatar"
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="absolute bottom-1 right-1 h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 hover:bg-background"
                        onClick={handleAvatarUpload}
                      >
                        <Camera className="h-5 w-5" />
                        <span className="sr-only">Upload Avatar</span>
                      </Button>
                    </div>
                    
                    <form onSubmit={form.handleSubmit(handleNameUpdate)} className="flex-grow w-full sm:w-auto space-y-2 pt-4 sm:pt-0">
                      <div>
                        <Label htmlFor="displayName" className="sr-only">Display Name</Label>
                        <Input
                          id="displayName"
                          placeholder="Your Name"
                          {...form.register('displayName')}
                          className="text-xl font-semibold"
                          disabled={isSubmittingName}
                        />
                        {form.formState.errors.displayName && (
                          <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                        )}
                      </div>
                       <Button type="submit" size="sm" disabled={isSubmittingName || !form.formState.isDirty}>
                        {isSubmittingName ? <LottieLoader size={16} className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSubmittingName ? 'Saving...' : 'Save Name'}
                      </Button>
                    </form>
                  </div>
                  
                  {/* More profile fields can go here */}
                  <div className="space-y-2 pt-6">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={userData?.email || ''} readOnly disabled className="bg-muted/50" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Security Section */}
            <section id="security" ref={securityRef} className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Security Settings</CardTitle>
                  <CardDescription>Manage your account security.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Password change, two-factor authentication, and active sessions will be managed here.</p>
                  {/* Placeholder content */}
                  <Button variant="outline" className="mt-4" disabled>Change Password (Coming Soon)</Button>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Teams Section */}
            <section id="teams" ref={teamsRef} className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Teams</CardTitle>
                  <CardDescription>Manage your team members and roles.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Team management features will be available here.</p>
                   <Button variant="outline" className="mt-4" disabled>Manage Teams (Coming Soon)</Button>
                </CardContent>
              </Card>
            </section>
            
            <Separator />

            {/* Notifications Section */}
            <section id="notifications" ref={notificationsRef} className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Notifications</CardTitle>
                  <CardDescription>Configure your notification preferences.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Notification settings will be available here.</p>
                  <Button variant="outline" className="mt-4" disabled>Notification Settings (Coming Soon)</Button>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Delete Account Section */}
            <section id="delete" ref={deleteRef} className="pt-4">
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-2xl text-destructive">Delete Account</CardTitle>
                  <CardDescription>Permanently delete your account and all associated data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-destructive/90 mb-4">This action is irreversible. Please be certain before proceeding.</p>
                  <Button variant="destructive" className="mt-4" disabled>Delete My Account (Coming Soon)</Button>
                </CardContent>
              </Card>
            </section>
             <div className="h-20" /> {/* Spacer for bottom scroll */}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default AdminProfilePage;

    