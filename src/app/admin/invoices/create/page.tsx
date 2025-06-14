
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react'; 
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { add, formatISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, PlusCircle, Trash2, FileText, UserCircle2, Building } from 'lucide-react';

import { addInvoiceAction, type InvoiceOperationResult } from '../actions';
import { CreateInvoiceFormSchema, type CreateInvoiceFormValues, type InvoiceItem } from '../schema';
import { getAllClientsAction, type Client } from '../../clients/actions'; 

const CreateInvoicePage: FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { user: adminFirebaseUser, userData: adminUserData } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(CreateInvoiceFormSchema),
    defaultValues: {
      senderName: adminUserData?.displayName || '',
      senderEmail: adminUserData?.email || '',
      senderPhone: adminUserData?.phone || '', // Assuming adminUserData might have phone
      senderAddress: '', // No typical address field in adminUserData yet
      clientId: '',
      clientName: '', // Will be set on client selection
      clientEmail: '', // Will be set on client selection
      issueDate: new Date(),
      dueDate: add(new Date(), { weeks: 2 }),
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      status: 'draft',
      notes: '',
      taxAmount: 0,
      discountAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const fetchClientsCallback = useCallback(async () => {
    setIsLoadingClients(true);
    try {
      const fetchedClients = await getAllClientsAction();
      setClients(fetchedClients);
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
    // Pre-fill sender info if admin data changes
    if (adminUserData) {
        form.setValue('senderName', adminUserData.displayName || '');
        form.setValue('senderEmail', adminUserData.email || '');
        // Add other fields if available, e.g. form.setValue('senderPhone', adminUserData.phone || '');
    }
  }, [adminUserData, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'clientId' && value.clientId) {
        const selectedClient = clients.find(c => c.id === value.clientId);
        if (selectedClient) {
          form.setValue('clientName', selectedClient.name);
          form.setValue('clientEmail', selectedClient.email || '');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, clients]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'issueDate' && value.issueDate) {
        form.setValue('dueDate', add(value.issueDate, { weeks: 2 }));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const watchedItems = form.watch('items');
  const watchedTax = form.watch('taxAmount') || 0;
  const watchedDiscount = form.watch('discountAmount') || 0;

  const subTotal = useMemo(() => {
    return watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
  }, [watchedItems]);

  const totalAmount = useMemo(() => {
    return subTotal + (watchedTax || 0) - (watchedDiscount || 0);
  }, [subTotal, watchedTax, watchedDiscount]);


  const handleSaveInvoice: SubmitHandler<CreateInvoiceFormValues> = async (data) => {
    setIsSubmitting(true);
    if (!adminFirebaseUser?.uid) {
      toast({ title: 'Authentication Error', description: 'Admin not authenticated.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    const dataForServerAction = {
        ...data,
        issueDate: formatISO(data.issueDate), 
        dueDate: formatISO(data.dueDate),     
    };

    const result: InvoiceOperationResult = await addInvoiceAction(dataForServerAction, adminFirebaseUser.uid);
    if (result.success && result.invoiceId) {
      toast({ title: 'Success', description: result.message });
      router.push(`/admin/invoices/view/${result.invoiceId}`);
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive', duration: 7000 });
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      <Button variant="outline" asChild className="mb-6">
        <Link href="/admin/invoices">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary flex items-center">
            <FileText className="mr-3 h-7 w-7" /> Create New Invoice
          </CardTitle>
          <CardDescription>Fill in the details to generate a new invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveInvoice)} className="space-y-8">
              
              <section className="space-y-4 p-4 border rounded-lg bg-secondary/20">
                <h3 className="text-xl font-semibold text-primary flex items-center"><UserCircle2 className="mr-2 h-5 w-5" />Your Company Details (Sender)</h3>
                 <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="senderName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company/Your Name *</FormLabel>
                            <FormControl><Input placeholder="Your Company LLC" {...field} disabled={isSubmitting} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="senderEmail"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl><Input type="email" placeholder="yourcompany@example.com" {...field} disabled={isSubmitting} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="senderPhone"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl><Input type="tel" placeholder="+1 234 567 8900" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="senderAddress"
                        render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel>Address</FormLabel>
                            <FormControl><Textarea placeholder="123 Main St, City, Country" {...field} value={field.value ?? ''} rows={2} disabled={isSubmitting} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
              </section>

              <Separator />

              <section className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-xl font-semibold text-primary flex items-center"><Building className="mr-2 h-5 w-5" />Client Details (Bill To)</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Client *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients || isSubmitting}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                {client.name} ({client.email})
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <input type="hidden" {...form.register('clientName')} />
                    <input type="hidden" {...form.register('clientEmail')} />
                </div>
              </section>
              
              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Issue Date *</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} disabled={isSubmitting} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date *</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} disabled={isSubmitting} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />
              
              <div>
                <h3 className="text-lg font-medium text-primary mb-4">Invoice Items</h3>
                {fields.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-start mb-4 p-3 border rounded-md bg-secondary/30">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="col-span-12 md:col-span-5">
                          {index === 0 && <FormLabel className="text-xs md:hidden">Description</FormLabel>}
                          <FormControl>
                            <Input placeholder="Item description" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="col-span-4 md:col-span-2">
                           {index === 0 && <FormLabel className="text-xs md:hidden">Qty</FormLabel>}
                          <FormControl>
                            <Input type="number" placeholder="Qty" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="col-span-5 md:col-span-2">
                          {index === 0 && <FormLabel className="text-xs md:hidden">Unit Price</FormLabel>}
                          <FormControl>
                            <Input type="number" placeholder="Unit Price" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="col-span-3 md:col-span-2 flex items-center pt-1 md:pt-0">
                       {index === 0 && <FormLabel className="text-xs md:hidden invisible">Total</FormLabel>}
                      <p className="text-sm font-medium w-full text-right pr-2">
                        KES {( (form.getValues(`items.${index}.quantity`) || 0) * (form.getValues(`items.${index}.unitPrice`) || 0) ).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center items-center pt-1 md:pt-0">
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isSubmitting} className="text-destructive h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                  disabled={isSubmitting}
                  className="mt-2"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
                 {form.formState.errors.items && typeof form.formState.errors.items === 'object' && !Array.isArray(form.formState.errors.items) && (
                  <p className="text-sm text-destructive mt-2">{ (form.formState.errors.items as any).message || (form.formState.errors.items.root as any)?.message }</p>
                )}
              </div>
              
              <Separator />

              <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes / Payment Instructions</FormLabel>
                            <FormControl>
                            <Textarea placeholder="Any additional notes for the client or payment details..." {...field} value={field.value ?? ''} rows={4} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Invoice Status *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                              disabled={isSubmitting}
                            >
                              <FormItem className="flex items-center space-x-2">
                                <RadioGroupItem value="draft" id="draft" />
                                <Label htmlFor="draft">Draft</Label>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <RadioGroupItem value="pending" id="pending" />
                                <Label htmlFor="pending">Pending (Mark as Sent)</Label>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <Card className="md:col-span-1 p-4 space-y-3 bg-secondary/50">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">KES {subTotal.toFixed(2)}</span>
                    </div>
                    <FormField
                        control={form.control}
                        name="taxAmount"
                        render={({ field }) => (
                        <FormItem className="flex justify-between items-center text-sm">
                            <FormLabel className="text-muted-foreground mb-0">Tax (KES):</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-8 w-24 text-right" placeholder="0.00" disabled={isSubmitting}/>
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="discountAmount"
                        render={({ field }) => (
                        <FormItem className="flex justify-between items-center text-sm">
                            <FormLabel className="text-muted-foreground mb-0">Discount (KES):</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-8 w-24 text-right" placeholder="0.00" disabled={isSubmitting}/>
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-primary">
                        <span>Total:</span>
                        <span>KES {totalAmount.toFixed(2)}</span>
                    </div>
                </Card>
              </div>


              <CardFooter className="px-0 pt-8">
                <Button type="submit" disabled={isSubmitting || !adminFirebaseUser} size="lg">
                  {isSubmitting ? <LottieLoader className="mr-2" size={20} /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? 'Saving Invoice...' : (form.getValues('status') === 'pending' ? 'Save & Mark as Pending' : 'Save as Draft')}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateInvoicePage;

