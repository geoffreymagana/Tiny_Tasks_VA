
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { addStaffAction, STAFF_DEPARTMENT_NAMES, type StaffFormData, type StaffOperationResult } from '../actions';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';

const staffFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name too long."),
  email: z.string().email("Invalid email address.").max(100, "Email too long."),
  department: z.enum(STAFF_DEPARTMENT_NAMES as [string, ...string[]], {
    required_error: "Department is required.",
    errorMap: () => ({ message: "Please select a valid department." }),
  }),
  phone: z.string().max(20, "Phone number too long.").optional(),
});


const CreateStaffPage: FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { user: firebaseUser } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: '',
      email: '',
      department: undefined, // Or a default department if you prefer
      phone: '',
    },
  });

  const handleSaveStaff: SubmitHandler<StaffFormData> = async (data) => {
    setIsSubmitting(true);
    if (!firebaseUser?.uid) {
      toast({ title: 'Authentication Error', description: 'Admin not authenticated.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    const result: StaffOperationResult = await addStaffAction(data, firebaseUser.uid);
    if (result.success) {
      toast({ 
        title: 'Success', 
        description: `${result.message}. A default password "password123" has been set. The staff member should change it upon first login.`,
        duration: 7000 
      });
      router.push('/admin/staff'); 
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive', duration: 7000 });
    }
    setIsSubmitting(false);
  };

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
            <UserPlus className="mr-3 h-7 w-7" /> Add New Staff Member
          </CardTitle>
          <CardDescription>Enter the details for the new staff member. An account will be created with a default password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveStaff)} className="space-y-6">
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
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., alex.johnson@example.com" {...field} disabled={isSubmitting} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAFF_DEPARTMENT_NAMES.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
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
                {isSubmitting ? 'Adding Staff...' : 'Add Staff Member'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateStaffPage;
