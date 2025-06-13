
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getClientAction, updateClientAction, type ClientFormData, type ClientOperationResult } from '../../actions';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { ArrowLeft, Save } from 'lucide-react';

const clientFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name too long."),
  email: z.string().email("Invalid email address.").max(100, "Email too long."),
  company: z.string().max(100, "Company name too long.").optional(),
  phone: z.string().max(20, "Phone number too long.").optional(),
});

const EditClientPage: FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const { user: firebaseUser } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(true);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      phone: '',
    },
  });

  const fetchClientData = useCallback(async () => {
    if (!clientId) return;
    setIsLoadingClient(true);
    const clientData = await getClientAction(clientId);
    if (clientData) {
      form.reset({
        name: clientData.name,
        email: clientData.email,
        company: clientData.company || '',
        phone: clientData.phone || '',
      });
    } else {
      toast({ title: 'Error', description: 'Client not found or could not be loaded.', variant: 'destructive' });
      router.push('/admin/clients');
    }
    setIsLoadingClient(false);
  }, [clientId, form, router, toast]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const handleUpdateClient: SubmitHandler<ClientFormData> = async (data) => {
    setIsSubmitting(true);
    if (!firebaseUser?.uid) {
      toast({ title: 'Authentication Error', description: 'Admin not authenticated.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    const result: ClientOperationResult = await updateClientAction(clientId, data, firebaseUser.uid);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      router.push('/admin/clients');
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LottieLoader size={64} />
        <p className="ml-4 text-lg">Loading client data...</p>
      </div>
    );
  }

  return (
    <div>
      <Button variant="outline" asChild className="mb-6">
        <Link href="/admin/clients">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Client Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">Edit Client</CardTitle>
          <CardDescription>Update the client's information below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateClient)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jane Doe" {...field} disabled={isSubmitting} />
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
                      <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Doe Innovations Inc." {...field} value={field.value || ''} disabled={isSubmitting} />
                    </FormControl>
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
                      <Input type="tel" placeholder="e.g., +1 555-123-4567" {...field} value={field.value || ''} disabled={isSubmitting} />
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

export default EditClientPage;
