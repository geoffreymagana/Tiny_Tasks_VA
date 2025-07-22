
"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { User, Shield, Users2, Bell, Trash2, Save, Camera, UploadCloud, Pencil, BadgeCheck } from 'lucide-react';
import { updateUserProfileServerAction, type UserProfileUpdateResult } from './actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CldUploadButton } from 'next-cloudinary';
import type { CldUploadWidgetResults } from 'next-cloudinary';


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
  const { user: firebaseUser, userData, isLoading: authLoading, refetchUserData } = useAdminAuth();
  const { toast } = useToast();
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  
  const [isUploading, setIsUploading] = useState<'avatar' | 'banner' | null>(null);

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
    if (userData) {
      if (!isEditingName) {
        form.reset({ displayName: userData.displayName || '' });
      }
    }
  }, [userData, form, isEditingName]);

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
    const result: UserProfileUpdateResult = await updateUserProfileServerAction(firebaseUser.uid, { displayName: data.displayName });
    if (result.success) {
      toast({ title: 'Success', description: 'Profile name updated successfully.' });
      setIsEditingName(false);
      await refetchUserData?.();
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsSubmittingName(false);
  };

  const handleEditNameClick = () => {
    setIsEditingName(true);
    form.setValue('displayName', userData?.displayName || '');
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    form.reset({ displayName: userData?.displayName || '' });
  };

  const handleImageUploadSuccess = async (imageType: 'avatar' | 'banner', result: CldUploadWidgetResults) => {
    setIsUploading(imageType);
    if (typeof result.info !== 'object' || result.info === null || !('secure_url' in result.info)) {
        toast({ title: "Upload Failed", description: "Invalid response from Cloudinary.", variant: "destructive" });
        setIsUploading(null);
        return;
    }
    
    const publicUrl = (result.info as { secure_url: string }).secure_url;
    const updates: { photoURL?: string | null; bannerURL?: string | null } = {};
    if (imageType === 'avatar') updates.photoURL = publicUrl;
    if (imageType === 'banner') updates.bannerURL = publicUrl;

    if (!firebaseUser?.uid) {
        toast({ title: 'Error', description: 'User not authenticated.', variant: 'destructive' });
        setIsUploading(null);
        return;
    }

    const dbResult = await updateUserProfileServerAction(firebaseUser.uid, updates);

    if (dbResult.success) {
        toast({ title: `${imageType === 'avatar' ? 'Avatar' : 'Banner'} Updated`, description: `Your ${imageType} has been successfully updated.` });
        await refetchUserData?.(); 
    } else {
        toast({ title: `Update Failed`, description: dbResult.message, variant: 'destructive' });
    }
    setIsUploading(null);
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

      <main className="flex-1 md:w-3/4 lg:w-4/5">
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="space-y-12 pr-4">
            <section id="profile" ref={profileRef} className="pt-4">
              <Card>
                <CardHeader className="p-0">
                  <div className="relative h-48 md:h-64 bg-muted group">
                    <Image
                      src={userData?.bannerURL || "https://placehold.co/1200x400.png"}
                      alt="Profile Banner"
                      fill
                      style={{objectFit:"cover"}}
                      className="rounded-t-lg"
                      data-ai-hint="abstract gradient modern"
                      key={userData?.bannerURL || 'default-banner'}
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CldUploadButton
                            options={{ folder: `profile_banners/${firebaseUser?.uid}` }}
                            onSuccess={(result) => handleImageUploadSuccess('banner', result)}
                            onUploadBegin={() => setIsUploading('banner')}
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                        >
                            <Button variant="outline" size="sm" className="bg-background/70 hover:bg-background" disabled={isUploading === 'banner'}>
                                {isUploading === 'banner' ? <LottieLoader size={16} className="mr-1" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                {isUploading === 'banner' ? 'Uploading...' : 'Change Banner'}
                            </Button>
                        </CldUploadButton>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-6 pb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:space-x-6">
                    <div className="relative -mt-12 sm:-mt-16 h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 shrink-0 group">
                      <Image
                        src={userData?.photoURL || "https://placehold.co/160x160.png"}
                        alt={userData?.displayName || "User Avatar"}
                        fill
                        style={{objectFit:"cover"}}
                        className="rounded-full border-4 border-card bg-card"
                        data-ai-hint="professional avatar"
                        key={userData?.photoURL || 'default-avatar'}
                      />
                      <div className="absolute bottom-1 right-1 h-8 w-8 sm:h-9 sm:w-9 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CldUploadButton
                            options={{ folder: `avatars/${firebaseUser?.uid}` }}
                            onSuccess={(result) => handleImageUploadSuccess('avatar', result)}
                            onUploadBegin={() => setIsUploading('avatar')}
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                        >
                            <Button variant="outline" size="icon" className="h-full w-full rounded-full bg-background/70 hover:bg-background" disabled={isUploading === 'avatar'} title="Change avatar">
                                {isUploading === 'avatar' ? <LottieLoader size={16} /> : <Camera className="h-4 w-4 sm:h-5 sm:w-5" />}
                                <span className="sr-only">Upload Avatar</span>
                            </Button>
                        </CldUploadButton>
                      </div>
                    </div>
                    
                    <div className="flex-grow pt-4 sm:pt-6 min-w-0">
                      {!isEditingName ? (
                        <div className="flex items-center space-x-2 group">
                          <h1 className="text-2xl sm:text-3xl font-bold text-primary truncate" title={userData?.displayName || 'User Name'}>
                            {userData?.displayName || 'User Name'}
                          </h1>
                          {userData?.role === 'admin' && (
                            <BadgeCheck className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" style={{color: "#ef3da6"}} title="Verified Admin" />
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground opacity-50 group-hover:opacity-100 h-7 w-7 sm:h-8 sm:w-8"
                            onClick={handleEditNameClick}
                            title="Edit name"
                          >
                            <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={form.handleSubmit(handleNameUpdate)} className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <Input
                            id="displayName"
                            placeholder="Your Name"
                            {...form.register('displayName')}
                            className="text-xl font-semibold flex-grow"
                            disabled={isSubmittingName}
                          />
                          <div className="flex space-x-2 mt-2 sm:mt-0">
                            <Button type="submit" size="sm" disabled={isSubmittingName || !form.formState.isDirty}>
                              {isSubmittingName ? <LottieLoader size={16} className="mr-1" /> : <Save className="mr-1 h-4 w-4" />}
                              Save
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleCancelEditName} disabled={isSubmittingName}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      )}
                      {form.formState.errors.displayName && (
                        <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                      )}
                      
                      {userData?.role === 'staff' && userData.department && (
                        <p className="text-sm text-muted-foreground mt-0.5">{userData.department}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-0.5">{userData?.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t pt-6">
                     <h3 className="text-lg font-semibold text-primary mb-2">Account Details</h3>
                     <p className="text-sm text-muted-foreground">
                        This section can include more details like join date, account type, etc.
                     </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator />

            <section id="security" ref={securityRef} className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Security Settings</CardTitle>
                  <CardDescription>Manage your account security.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Password change, two-factor authentication, and active sessions will be managed here.</p>
                  <Button variant="outline" className="mt-4" disabled>Change Password (Coming Soon)</Button>
                </CardContent>
              </Card>
            </section>

            <Separator />

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
