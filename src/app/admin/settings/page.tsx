
"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings, Briefcase, Users, Palette, Clock, DollarSign, Bell, Shield, Users2,
  MessageSquareText, ListChecks, Link2, Brain, LifeBuoy, Scale, UploadCloud, Save
} from 'lucide-react';
import { LottieLoader } from '@/components/ui/lottie-loader';
import Image from 'next/image';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  ref: React.RefObject<HTMLDivElement>;
}

const AdminSettingsPage: FC = () => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  // Refs for scrolling
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

  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement>, sectionId: string) => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
  };
  
  const handleSaveSection = (sectionId: string) => {
    setIsSaving(prev => ({ ...prev, [sectionId]: true }));
    // Simulate API call
    setTimeout(() => {
      toast({ title: `${navItems.find(item => item.id === sectionId)?.label} Settings Saved`, description: "Your changes have been (simulated) saved." });
      setIsSaving(prev => ({ ...prev, [sectionId]: false }));
    }, 1500);
  };


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
            
            {/* General Settings Section */}
            <section id="general" ref={generalRef} className="pt-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5 text-accent"/>General Settings</CardTitle>
                  <CardDescription>Basic agency and platform configurations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="agencyName">Agency Name / Branding</Label>
                    <Input id="agencyName" placeholder="Tiny Tasks Inc." defaultValue="Tiny Tasks VA Services" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <Label>Agency Logo</Label>
                      <div className="mt-1 flex items-center space-x-3">
                        <Image src="https://placehold.co/100x40/00274d/ffffff?text=Logo" alt="Current Logo" width={100} height={40} className="bg-muted rounded p-1 object-contain h-10" data-ai-hint="agency logo" />
                        <Button variant="outline" size="sm"><UploadCloud className="mr-2 h-4 w-4" /> Upload Logo</Button>
                      </div>
                    </div>
                     <div>
                      <Label>Agency Banner (e.g., for login page)</Label>
                       <div className="mt-1 flex items-center space-x-3">
                        <Image src="https://placehold.co/150x50/secondary/primary?text=Banner" alt="Current Banner" width={150} height={50} className="bg-muted rounded p-1 object-contain h-12" data-ai-hint="website banner wide" />
                        <Button variant="outline" size="sm"><UploadCloud className="mr-2 h-4 w-4" /> Upload Banner</Button>
                      </div>
                    </div>
                  </div>
                   <div className="space-y-2">
                    <Label>Theme Color Scheme</Label>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="border-primary text-primary">Light</Button>
                      <Button variant="outline" size="sm">Dark</Button>
                      <Button variant="outline" size="sm" disabled>Custom (soon)</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select defaultValue="Africa/Nairobi">
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
                        <Select defaultValue="KES">
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
                        <Switch id="systemAlerts" defaultChecked />
                    </div>
                     <div className="flex items-center justify-between p-3 border rounded-md">
                        <span>Email Notifications for Critical Events</span>
                        <Switch id="emailCritical" defaultChecked />
                    </div>
                     <div className="flex items-center justify-between p-3 border rounded-md">
                        <span>SMS Push for Urgent Matters (Placeholder)</span>
                        <Switch id="smsPush" disabled />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleSaveSection('general')} disabled={isSaving['general']}>
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


    