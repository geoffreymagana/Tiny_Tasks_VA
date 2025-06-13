
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getStaffAction, updateStaffAction, type StaffFormData, type StaffOperationResult } from '../../actions';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { ArrowLeft, Save, UserCog } from 'lucide-react';

// Department Configuration (moved from actions.ts)
const STAFF_DEPARTMENTS_CONFIG: Record<string, { name: string; color: string; textColor?: string }> = {
  'Client Success & Onboarding': { name: 'Client Success & Onboarding', color: 'hsl(207, 70%, 50%)', textColor: 'hsl(0, 0%, 100%)' },
  'VA Operations': { name: 'VA Operations', color: 'hsl(145, 63%, 42%)', textColor: 'hsl(0, 0%, 100%)' },
  'Sales & Account Management': { name: 'Sales & Account Management', color: 'hsl(30, 90%, 50%)', textColor: 'hsl(0, 0%, 100%)' },
  'HR / VA Talent': { name: 'HR / VA Talent', color: 'hsl(260, 60%, 55%)', textColor: 'hsl(0, 0%, 100%)' },
  'Automation & AI': { name: 'Automation & AI', color: 'hsl(180, 50%, 45%)', textColor: 'hsl(0, 0%, 100%)' },
  'Marketing & Content': { name: 'Marketing & Content', color: 'hsl(330, 70%, 55%)', textColor: 'hsl(0, 0%, 100%)' },
  'IT Support': { name: 'IT Support', color: 'hsl(0, 0%, 40%)', textColor: 'hsl(0, 0%, 100%)' },
  'Finance & Billing': { name: 'Finance & Billing', color: 'hsl(45, 100%, 50%)', textColor: 'hsl(210, 29%, 10%)' },
  'QA & Training': { name: 'QA & Training', color: 'hsl(240, 60%, 65%)', textColor: 'hsl(0, 0%, 100%)' },
  'Product/UX': { name: 'Product/UX', color: 'hsl(350, 75%, 60%)', textColor: 'hsl(0, 0%, 100%)' },
};
const STAFF_DEPARTMENT_NAMES = Object.keys(STAFF_DEPARTMENTS_CONFIG);

const staffFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name too long."),
  email: z.string().email("Invalid email address.").max(100, "Email too long."), // Will be read-only in form
  department: z.enum(STAFF_DEPARTMENT_NAMES as [string, ...string[]], {
     errorMap: () => ({ message: "Please select a valid department." }),
  }),
  phone: z.string().max(20, "Phone number too long.").optional().or(z.literal('')),
});


const EditStaffPage: FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const staffId = params.staffId as string;
  const { user: firebaseUser } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: '',
      email: '', 
      department: undefined,
      phone: '',
    },
  });

  const fetchStaffData = useCallback(async () => {
    if (!staffId) return;
    setIsLoadingStaff(true);
    const staffData = await getStaffAction(staffId);
    if (staffData) {
      form.reset({
        name: staffData.name,
        email: staffData.email,
        department: staffData.department as (typeof STAFF_DEPARTMENT_NAMES)[number], // Cast to ensure type match
        phone: staffData.phone || '',
      });
    } else {
      toast({ title: 'Error', description: 'Staff member not found or could not be loaded.', variant: 'destructive' });
      router.push('/admin/staff');
    }
    setIsLoadingStaff(false);
  }, [staffId, form, router, toast]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  const handleUpdateStaff: SubmitHandler<StaffFormData> = async (data) => {
    setIsSubmitting(true);
    if (!firebaseUser?.uid) {
      toast({ title: 'Authentication Error', description: 'Admin not authenticated.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    
    const dataToSend = { ...data, email: form.getValues('email') }; // Ensure email is included, even if read-only


    const result: StaffOperationResult = await updateStaffAction(staffId, dataToSend, firebaseUser.uid);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      router.push('/admin/staff');
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive', duration: 7000 });
    }
    setIsSubmitting(false);
  };

  if (isLoadingStaff) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LottieLoader size={64} />
        <p className="ml-4 text-lg">Loading staff data...</p>
      </div>
    );
  }

  return (
    <div>
      <Button variant="outline" asChild className="mb-6">
        <Link href="/admin/staff">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Staff Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary flex items-center">
            <UserCog className="mr-3 h-7 w-7" /> Edit Staff Member
          </CardTitle>
          <CardDescription>Update the staff member's information below. Email is read-only.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateStaff)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Alex Johnson" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address (Read-only)</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} readOnly disabled className="bg-muted/50 cursor-not-allowed" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAFF_DEPARTMENT_NAMES.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {STAFF_DEPARTMENTS_CONFIG[dept]?.name || dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="e.g., +1 555-987-6543" {...field} value={field.value ?? ''} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting || !firebaseUser} size="lg">
                {isSubmitting ? <LottieLoader className="mr-2" size={20} /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditStaffPage;

    