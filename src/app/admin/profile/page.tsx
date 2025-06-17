
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { User, Shield, Users2, Bell, Trash2, Save, Camera, UploadCloud, Pencil, BadgeCheck } from 'lucide-react';
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
  const { user: firebaseUser, userData, isLoading: authLoading, refetchUserData } = useAdminAuth();
  const { toast } = useToast();
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const avatarFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

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
      setAvatarPreview(userData.photoURL || null);
      setBannerPreview(userData.bannerURL || null);
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
      refetchUserData?.();
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

  const handleImageUpload = async (imageType: 'avatar' | 'banner', file: File) => {
    if (!firebaseUser?.uid || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
      toast({ title: 'Configuration Error', description: 'Cloudinary settings are missing.', variant: 'destructive' });
      return;
    }
    if (!file) return;

    const setLoading = imageType === 'avatar' ? setIsUploadingAvatar : setIsUploadingBanner;
    const setPreview = imageType === 'avatar' ? setAvatarPreview : setBannerPreview;
    const currentUrl = imageType === 'avatar' ? userData?.photoURL : userData?.bannerURL;

    setLoading(true);
    setPreview(URL.createObjectURL(file)); // Show local preview immediately

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    
    // Organize uploads within the main asset folder defined in the Cloudinary preset
    const folderPath = imageType === 'avatar' 
      ? `avatars/${firebaseUser.uid}` 
      : `profile_banners/${firebaseUser.uid}`;
    formData.append('folder', folderPath);


    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (data.error || !data.secure_url) {
        throw new Error(data.error?.message || 'Cloudinary upload failed.');
      }
      
      const publicUrl = data.secure_url;

      const updates: { photoURL?: string | null; bannerURL?: string | null } = {};
      if (imageType === 'avatar') updates.photoURL = publicUrl;
      if (imageType === 'banner') updates.bannerURL = publicUrl;
      
      const result = await updateUserProfileServerAction(firebaseUser.uid, updates);

      if (result.success) {
        toast({ title: `${imageType === 'avatar' ? 'Avatar' : 'Banner'} Updated`, description: `Your ${imageType} has been successfully updated.` });
        refetchUserData?.(); 
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: `Upload Failed`, description: error.message || `Could not upload ${imageType}.`, variant: 'destructive' });
      setPreview(currentUrl || null); 
    } finally {
      setLoading(false);
      if (imageType === 'avatar' && avatarFileRef.current) avatarFileRef.current.value = "";
      if (imageType === 'banner' && bannerFileRef.current) bannerFileRef.current.value = "";
    }
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
                      src={bannerPreview || "https://placehold.co/1200x400.png"}
                      alt="Profile Banner"
                      fill
                      style={{objectFit:"cover"}}
                      className="rounded-t-lg"
                      data-ai-hint="abstract gradient modern"
                      key={bannerPreview || 'default-banner'} // Force re-render on URL change
                    />
                     <input 
                      type="file" 
                      ref={bannerFileRef} 
                      hidden 
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload('banner', e.target.files[0])}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 hover:bg-background"
                      onClick={() => bannerFileRef.current?.click()}
                      disabled={isUploadingBanner}
                    >
                      {isUploadingBanner ? <LottieLoader size={16} className="mr-1" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                      {isUploadingBanner ? 'Uploading...' : 'Change Banner'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-6 pb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:space-x-6">
                    <div className="relative -mt-12 sm:-mt-16 h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 shrink-0 group">
                      <Image
                        src={avatarPreview || "https://placehold.co/160x160.png"}
                        alt={userData?.displayName || "User Avatar"}
                        fill
                        style={{objectFit:"cover"}}
                        className="rounded-full border-4 border-card bg-card"
                        data-ai-hint="professional avatar"
                        key={avatarPreview || 'default-avatar'} // Force re-render on URL change
                      />
                       <input 
                        type="file" 
                        ref={avatarFileRef} 
                        hidden 
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload('avatar', e.target.files[0])}
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="absolute bottom-1 right-1 h-8 w-8 sm:h-9 sm:w-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 hover:bg-background"
                        onClick={() => avatarFileRef.current?.click()}
                        disabled={isUploadingAvatar}
                        title="Change avatar"
                      >
                         {isUploadingAvatar ? <LottieLoader size={16} /> : <Camera className="h-4 w-4 sm:h-5 sm:w-5" />}
                        <span className="sr-only">Upload Avatar</span>
                      </Button>
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
