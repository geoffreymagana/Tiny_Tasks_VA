
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatISO, add } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, FilePlus2, Building, Info } from 'lucide-react';

import { addContractAction, type ContractOperationResult } from '../actions';
import { CreateContractFormSchema, type CreateContractFormValues, type ContractStatus } from '../schema';
import { getAllClientsAction, type Client } from '../../clients/actions';

const CreateContractPage: FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { user: adminFirebaseUser } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  const form = useForm<CreateContractFormValues>({
    resolver: zodResolver(CreateContractFormSchema),
    defaultValues: {
      title: '',
      clientId: '',
      effectiveDate: new Date(),
      expirationDate: null, // Initially no expiration
      serviceDescription: '',
      termsAndConditions: '',
      paymentTerms: '',
      status: 'draft',
      isTemplate: false,
      templateName: '',
    },
  });

  const isTemplate = form.watch('isTemplate');

  const fetchClientsCallback = useCallback(async () => {
    setIsLoadingClients(true);
    try {
      const fetchedClients = await getAllClientsAction();
      setClients(fetchedClients.filter(c => !c.isDisabled)); // Filter out disabled clients
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch clients.", variant: "destructive" });
    } finally {
      setIsLoadingClients(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClientsCallback();
  }, [fetchClientsCallback]);

  useEffect(() => {
    // When isTemplate changes, update related fields
    if (isTemplate) {
      form.setValue('clientId', ''); // Clear client if it's a template
      // Status will be handled by server action for templates
    }
    // templateName is handled by conditional rendering
  }, [isTemplate, form]);


  const handleSaveContract: SubmitHandler<CreateContractFormValues> = async (data) => {
    setIsSubmitting(true);
    if (!adminFirebaseUser?.uid) {
      toast({ title: 'Authentication Error', description: 'Admin not authenticated.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    const dataForServerAction = {
        ...data,
        effectiveDate: formatISO(data.effectiveDate), 
        expirationDate: data.expirationDate ? formatISO(data.expirationDate) : null,
        templateName: data.isTemplate ? data.templateName : null, // Ensure templateName is null if not a template
    };

    const result: ContractOperationResult = await addContractAction(dataForServerAction, adminFirebaseUser.uid);
    if (result.success && result.contractId) {
      toast({ title: 'Success', description: result.message });
      // Redirect to view page of newly created contract/template
      router.push(`/admin/contracts/view/${result.contractId}`);
    } else {
      toast({ title: 'Error', description: result.message || 'Failed to create contract.', variant: 'destructive', duration: 7000 });
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      <Button variant="outline" asChild className="mb-6">
        <Link href="/admin/contracts">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contracts Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary flex items-center">
            <FilePlus2 className="mr-3 h-7 w-7" /> Create New Contract / Template
          </CardTitle>
          <CardDescription>Fill in the details to generate a new contract or save as a reusable template.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveContract)} className="space-y-8">
              
              <FormField
                control={form.control}
                name="isTemplate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-secondary/30">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Save as Contract Template?
                      </FormLabel>
                      <FormDescription>
                        If checked, this contract will be saved as a template and won't be tied to a specific client.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isTemplate && (
                <FormField
                    control={form.control}
                    name="templateName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Template Name *</FormLabel>
                        <FormControl><Input placeholder="e.g., Standard Service Agreement Template" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Title *</FormLabel>
                    <FormControl><Input placeholder={isTemplate ? "e.g., General Service Agreement" : "e.g., Web Development Services for Client X"} {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isTemplate && (
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground" />Client (Optional for draft, required for active contracts)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isLoadingClients || isSubmitting || isTemplate}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingClients ? "Loading clients..." : (isTemplate ? "Not applicable for templates" : "Select a client")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} ({client.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Select the client this contract is for. Leave blank if not applicable yet.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="effectiveDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Effective Date *</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} disabled={isSubmitting} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiration Date (Optional)</FormLabel>
                      <DatePicker date={field.value} setDate={(date) => field.onChange(date || null)} placeholder="No expiration" disabled={isSubmitting} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="serviceDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope of Services / Description *</FormLabel>
                    <FormControl><Textarea placeholder="Detailed description of services to be provided..." {...field} rows={5} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="termsAndConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Terms & Conditions *</FormLabel>
                    <FormControl><Textarea placeholder="Enter the full terms and conditions of the contract here..." {...field} rows={15} className="min-h-[300px]" disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="e.g., Net 30 days, 50% upfront, specific milestones..." {...field} value={field.value ?? ''} rows={3} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isTemplate && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Contract Status *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                          disabled={isSubmitting || isTemplate}
                        >
                          {(['draft', 'pending_signature', 'active'] as const).map((statusValue) => (
                            <FormItem key={statusValue} className="flex items-center space-x-2">
                              <RadioGroupItem value={statusValue} id={`status-${statusValue}`} />
                              <Label htmlFor={`status-${statusValue}`} className="capitalize">
                                {statusValue.replace('_', ' ')}
                              </Label>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>Set the current status of the contract.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {isTemplate && (
                 <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <Info className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-700">
                        This contract will be saved as a template. Its status will automatically be set to 'Template'.
                    </p>
                </div>
              )}


              <CardFooter className="px-0 pt-8">
                <Button type="submit" disabled={isSubmitting || !adminFirebaseUser} size="lg">
                  {isSubmitting ? <LottieLoader className="mr-2" size={20} /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? (isTemplate ? 'Saving Template...' : 'Saving Contract...') : (isTemplate ? 'Save as Template' : 'Create Contract')}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateContractPage;
