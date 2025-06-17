
"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings, Briefcase, Users, Palette, Clock, DollarSign, Bell, Shield, Users2,
  MessageSquareText, ListChecks, Link2, Brain, LifeBuoy, Scale, UploadCloud, Save
} from 'lucide-react';
import { LottieLoader } from '@/components/ui/lottie-loader';
import Image from 'next/image';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getAgencySettingsAction, updateAgencySettingsAction, type AgencySettingsData, type SettingsOperationResult } from './actions';


interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  ref: React.RefObject<HTMLDivElement>;
}

const AdminSettingsPage: FC = () => {
  const { toast } = useToast();
  const { user: firebaseUser } = useAdminAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [agencyName, setAgencyName] = useState('');
  const [agencyLogoUrl, setAgencyLogoUrl] = useState<string | null>(null);
  const [agencyBannerUrl, setAgencyBannerUrl] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [selectedTimezone, setSelectedTimezone] = useState('Africa/Nairobi');
  const [selectedCurrency, setSelectedCurrency] = useState('KES');

  const agencyLogoFileRef = useRef<HTMLInputElement>(null);
  const agencyBannerFileRef = useRef<HTMLInputElement>(null);
  
  const generalRef = useRef<HTMLDivElement>(null);
  const userManagementRef = useRef<HTMLDivElement>(null);
  const vaManagementRef = useRef<HTMLDivElement>(null);
  const clientSettingsRef = useRef<HTMLDivElement>(null);
  const communicationRef = useRef<HTMLDivElement>(null);
  const taskWorkflowRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);
  const paymentsBillingRef = useRef<HTMLDivElement>(null);
  const integrationsRef = useRef<HTMLDivElement>(null);
  const aiAutomationRef = useRef<HTMLDivElement>(null);
  const supportHelpdeskRef = useRef<HTMLDivElement>(null);
  const legalComplianceRef = useRef<HTMLDivElement>(null);

  const navItems: NavItem[] = [
    { id: 'general', label: 'General', icon: <Palette className="mr-2 h-5 w-5" />, ref: generalRef },
    { id: 'userManagement', label: 'User Management', icon: <Users className="mr-2 h-5 w-5" />, ref: userManagementRef },
    { id: 'vaManagement', label: 'VA Management', icon: <Briefcase className="mr-2 h-5 w-5" />, ref: vaManagementRef },
    { id: 'clientSettings', label: 'Client Settings', icon: <Users2 className="mr-2 h-5 w-5" />, ref: clientSettingsRef },
    { id: 'communication', label: 'Communication', icon: <MessageSquareText className="mr-2 h-5 w-5" />, ref: communicationRef },
    { id: 'taskWorkflow', label: 'Task & Workflow', icon: <ListChecks className="mr-2 h-5 w-5" />, ref: taskWorkflowRef },
    { id: 'security', label: 'Security', icon: <Shield className="mr-2 h-5 w-5" />, ref: securityRef },
    { id: 'paymentsBilling', label: 'Payments & Billing', icon: <DollarSign className="mr-2 h-5 w-5" />, ref: paymentsBillingRef },
    { id: 'integrations', label: 'Integrations', icon: <Link2 className="mr-2 h-5 w-5" />, ref: integrationsRef },
    { id: 'aiAutomation', label: 'AI/Automation', icon: <Brain className="mr-2 h-5 w-5" />, ref: aiAutomationRef },
    { id: 'supportHelpdesk', label: 'Support & Helpdesk', icon: <LifeBuoy className="mr-2 h-5 w-5" />, ref: supportHelpdeskRef },
    { id: 'legalCompliance', label: 'Legal & Compliance', icon: <Scale className="mr-2 h-5 w-5" />, ref: legalComplianceRef },
  ];

  const loadAgencySettings = useCallback(async () => {
    setIsLoadingSettings(true);
    const settings = await getAgencySettingsAction();
    if (settings) {
      setAgencyName(settings.agencyName || 'Tiny Tasks VA Services');
      setAgencyLogoUrl(settings.agencyLogoUrl || null);
      setAgencyBannerUrl(settings.agencyBannerUrl || null);
      setSelectedTheme(settings.theme || 'light');
      setSelectedTimezone(settings.timezone || 'Africa/Nairobi');
      setSelectedCurrency(settings.defaultCurrency || 'KES');
    } else {
      setAgencyName('Tiny Tasks VA Services');
    }
    setIsLoadingSettings(false);
  }, []);

  useEffect(() => {
    loadAgencySettings();
  }, [loadAgencySettings]);

  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement>, sectionId: string) => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
  };
  
  const handleImageUpload = async (imageType: 'logo' | 'banner', file: File) => {
    if (!firebaseUser?.uid || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
      toast({ title: 'Configuration Error', description: 'Cloudinary settings are missing.', variant: 'destructive' });
      return;
    }
    if (!file) return;

    const setLoading = (isLoading: boolean) => setIsSaving(prev => ({ ...prev, [`upload-${imageType}`]: isLoading }));
    const setPreview = imageType === 'logo' ? setAgencyLogoUrl : setAgencyBannerUrl;
    const currentUrl = imageType === 'logo' ? agencyLogoUrl : agencyBannerUrl;

    setLoading(true);
    setPreview(URL.createObjectURL(file)); 

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    
    // Define a folder structure within the main asset folder from Cloudinary preset
    const folderPath = imageType === 'logo' ? 'agency_logos' : 'agency_banners';
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

      const updatePayload: Partial<AgencySettingsData> = {};
      if (imageType === 'logo') updatePayload.agencyLogoUrl = publicUrl;
      if (imageType === 'banner') updatePayload.agencyBannerUrl = publicUrl;
      
      const result = await updateAgencySettingsAction(updatePayload, firebaseUser.uid);

      if (result.success) {
        toast({ title: `Agency ${imageType} Updated`, description: `Agency ${imageType} successfully updated.` });
        if (result.data) { 
            if (imageType === 'logo') setAgencyLogoUrl(result.data.agencyLogoUrl || null);
            if (imageType === 'banner') setAgencyBannerUrl(result.data.agencyBannerUrl || null);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: `Upload Failed`, description: error.message || `Could not upload agency ${imageType}.`, variant: 'destructive' });
      setPreview(currentUrl); 
    } finally {
      setLoading(false);
      if (imageType === 'logo' && agencyLogoFileRef.current) agencyLogoFileRef.current.value = "";
      if (imageType === 'banner' && agencyBannerFileRef.current) agencyBannerFileRef.current.value = "";
    }
  };

  const handleSaveGeneralSettings = async () => {
    if (!firebaseUser?.uid) {
        toast({ title: 'Authentication Error', variant: 'destructive' });
        return;
    }
    setIsSaving(prev => ({ ...prev, general: true }));
    const settingsToSave: Partial<AgencySettingsData> = {
        agencyName,
        theme: selectedTheme as AgencySettingsData['theme'],
        timezone: selectedTimezone,
        defaultCurrency: selectedCurrency,
        // URLs are saved by their respective upload functions
    };
    
    const result = await updateAgencySettingsAction(settingsToSave, firebaseUser.uid);
    if (result.success) {
        toast({ title: "General Settings Saved", description: "Your changes have been saved." });
         if (result.data) { 
            setAgencyName(result.data.agencyName || 'Tiny Tasks VA Services');
            setSelectedTheme(result.data.theme || 'light');
            setSelectedTimezone(result.data.timezone || 'Africa/Nairobi');
            setSelectedCurrency(result.data.defaultCurrency || 'KES');
        }
    } else {
        toast({ title: "Save Failed", description: result.message, variant: "destructive" });
    }
    setIsSaving(prev => ({ ...prev, general: false }));
  };
  
  const handleSaveSection = async (sectionId: string) => {
    if (!firebaseUser?.uid) {
      toast({ title: 'Authentication Error', variant: 'destructive' });
      return;
    }
    setIsSaving(prev => ({ ...prev, [sectionId]: true }));
    // Placeholder: Implement actual save logic for other sections later
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    toast({ title: `${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} Settings`, description: `Settings for ${sectionId} would be saved here.` });
    setIsSaving(prev => ({ ...prev, [sectionId]: false }));
  };


  if (isLoadingSettings) {
     return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <LottieLoader size={64} />
        <p className="ml-4 text-lg">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 h-full">
      <aside className="md:w-72 shrink-0">
        <Card className="sticky top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-6 w-6 text-primary"/> Settings</CardTitle>
            <CardDescription>Manage platform configurations.</CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'secondary' : 'ghost'}
                  className="justify-start text-sm h-auto py-2.5 px-3"
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

      <main className="flex-1 min-w-0">
        <ScrollArea className="h-[calc(100vh-8rem)] pr-4 pb-8">
          <div className="space-y-10">
            
            <section id="general" ref={generalRef} className="pt-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5 text-accent"/>General Settings</CardTitle>
                  <CardDescription>Basic agency and platform configurations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="agencyName">Agency Name / Branding</Label>
                    <Input id="agencyName" placeholder="Tiny Tasks Inc." value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <Label>Agency Logo</Label>
                      <div className="mt-1 flex items-center space-x-3">
                        <Image 
                            src={agencyLogoUrl || "https://placehold.co/100x40/00274d/ffffff?text=Logo"} 
                            alt="Current Agency Logo" 
                            width={100} height={40} 
                            className="bg-muted rounded p-1 object-contain h-10" 
                            data-ai-hint="agency logo"
                            key={agencyLogoUrl || 'default-agency-logo'} 
                        />
                        <input type="file" ref={agencyLogoFileRef} hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload('logo', e.target.files[0])} />
                        <Button variant="outline" size="sm" onClick={() => agencyLogoFileRef.current?.click()} disabled={isSaving['upload-logo']}>
                            {isSaving['upload-logo'] ? <LottieLoader size={16} className="mr-1"/> : <UploadCloud className="mr-2 h-4 w-4" />}
                            {isSaving['upload-logo'] ? 'Uploading...' : 'Change Logo'}
                        </Button>
                      </div>
                    </div>
                     <div>
                      <Label>Agency Banner (e.g., for login page)</Label>
                       <div className="mt-1 flex items-center space-x-3">
                        <Image 
                            src={agencyBannerUrl || "https://placehold.co/150x50/secondary/primary?text=Banner"} 
                            alt="Current Agency Banner" 
                            width={150} height={50} 
                            className="bg-muted rounded p-1 object-contain h-12" 
                            data-ai-hint="website banner wide"
                            key={agencyBannerUrl || 'default-agency-banner'}
                        />
                        <input type="file" ref={agencyBannerFileRef} hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload('banner', e.target.files[0])} />
                        <Button variant="outline" size="sm" onClick={() => agencyBannerFileRef.current?.click()} disabled={isSaving['upload-banner']}>
                            {isSaving['upload-banner'] ? <LottieLoader size={16} className="mr-1"/> : <UploadCloud className="mr-2 h-4 w-4" />}
                            {isSaving['upload-banner'] ? 'Uploading...' : 'Change Banner'}
                        </Button>
                      </div>
                    </div>
                  </div>
                   <div className="space-y-2">
                    <Label>Theme Color Scheme</Label>
                     <Select value={selectedTheme} onValueChange={(value) => setSelectedTheme(value as 'light'|'dark'|'custom')}>
                        <SelectTrigger id="theme"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="custom" disabled>Custom (soon)</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                        <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Africa/Nairobi">Africa/Nairobi (GMT+3)</SelectItem>
                            <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                            <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currency">Default Currency</Label>
                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                        <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Notification Preferences</Label>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                        <span>System Alerts (e.g., errors, updates)</span>
                        <Switch id="systemAlerts" defaultChecked disabled />
                    </div>
                     <div className="flex items-center justify-between p-3 border rounded-md">
                        <span>Email Notifications for Critical Events</span>
                        <Switch id="emailCritical" defaultChecked disabled />
                    </div>
                     <div className="flex items-center justify-between p-3 border rounded-md">
                        <span>SMS Push for Urgent Matters (Placeholder)</span>
                        <Switch id="smsPush" disabled />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveGeneralSettings} disabled={isSaving['general'] || isSaving['upload-logo'] || isSaving['upload-banner']}>
                    {isSaving['general'] && <LottieLoader className="mr-2" size={16} />}
                    <Save className="mr-2 h-4 w-4"/> Save General Settings
                  </Button>
                </CardFooter>
              </Card>
            </section>

            {navItems.slice(1).map(item => (
              <section key={item.id} id={item.id} ref={item.ref} className="pt-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">{item.icon} {item.label} Settings</CardTitle>
                    <CardDescription>Configure {item.label.toLowerCase()} specific settings for the platform.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Configuration options for {item.label.toLowerCase()} will appear here. This section is a placeholder.</p>
                  </CardContent>
                   <CardFooter>
                     <Button onClick={() => handleSaveSection(item.id)} disabled={isSaving[item.id] || true}>
                        {isSaving[item.id] && <LottieLoader className="mr-2" size={16} />}
                        <Save className="mr-2 h-4 w-4"/> Save {item.label} Settings
                     </Button>
                   </CardFooter>
                </Card>
              </section>
            ))}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default AdminSettingsPage;
