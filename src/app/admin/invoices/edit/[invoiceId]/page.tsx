
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { add, formatISO, parseISO } from 'date-fns';

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
import { ArrowLeft, Save, PlusCircle, Trash2, FileText, Edit, UserCircle2, Building, Percent } from 'lucide-react';

import { getInvoiceAction, updateInvoiceAction, type InvoiceOperationResult } from '../../actions';
import { CreateInvoiceFormSchema, type CreateInvoiceFormValues, type InvoiceItem, type Invoice } from '../../schema';
import { getAllClientsAction, type Client } from '../../../clients/actions';

const KESFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const EditInvoicePage: FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const { user: adminFirebaseUser, userData: adminUserData } = useAdminAuth();

  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(CreateInvoiceFormSchema),
    defaultValues: { 
      senderName: adminUserData?.displayName || '',
      senderEmail: adminUserData?.email || '',
      senderPhone: adminUserData?.phone || '',
      senderAddress: '', 
      clientId: '',
      clientName: '',
      clientEmail: '',
      issueDate: new Date(),
      dueDate: add(new Date(), { weeks: 2 }),
      items: [{ description: '', quantity: 1, unitOfMeasure: '', unitPrice: 0 }],
      status: 'draft',
      notes: '',
      taxRate: 0,
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

  const fetchInvoiceData = useCallback(async () => {
    if (!invoiceId) {
      router.push('/admin/invoices');
      return;
    }
    setIsLoadingInvoice(true);
    try {
      const fetchedInvoice = await getInvoiceAction(invoiceId);
      if (fetchedInvoice) {
        const subTotalForRate = fetchedInvoice.items.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
        const taxRateForForm = subTotalForRate > 0 ? (fetchedInvoice.taxAmount / subTotalForRate) * 100 : 0;

        form.reset({
          ...fetchedInvoice,
          senderName: fetchedInvoice.senderName || adminUserData?.displayName || '',
          senderEmail: fetchedInvoice.senderEmail || adminUserData?.email || '',
          senderPhone: fetchedInvoice.senderPhone || adminUserData?.phone || '',
          senderAddress: fetchedInvoice.senderAddress || '',
          issueDate: fetchedInvoice.issueDate ? parseISO(fetchedInvoice.issueDate) : new Date(),
          dueDate: fetchedInvoice.dueDate ? parseISO(fetchedInvoice.dueDate) : add(new Date(), { weeks: 2 }),
          items: fetchedInvoice.items.map(item => ({ 
            description: item.description,
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure || '',
            unitPrice: item.unitPrice
          })),
          notes: fetchedInvoice.notes || '',
          taxRate: parseFloat(taxRateForForm.toFixed(2)) || 0, // Ensure it's a number, default to 0
          discountAmount: fetchedInvoice.discountAmount || 0,
        });
      } else {
        toast({ title: "Error", description: "Invoice not found.", variant: "destructive" });
        router.push('/admin/invoices');
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast({ title: "Error", description: "Could not load invoice details.", variant: "destructive" });
      router.push('/admin/invoices');
    } finally {
      setIsLoadingInvoice(false);
    }
  }, [invoiceId, toast, router, form, adminUserData]);

  useEffect(() => {
    fetchInvoiceData();
  }, [fetchInvoiceData]);
  
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'clientId' && value.clientId) {
        const selectedClient = clients.find(c => c.id === value.clientId);
        if (selectedClient) {
          form.setValue('clientName', selectedClient.name, { shouldDirty: true });
          form.setValue('clientEmail', selectedClient.email || '', { shouldDirty: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, clients]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'issueDate' && value.issueDate && !form.formState.dirtyFields.dueDate) { 
        form.setValue('dueDate', add(value.issueDate, { weeks: 2 }));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const watchedItems = form.watch('items');
  const watchedTaxRate = form.watch('taxRate') || 0;
  const watchedDiscount = form.watch('discountAmount') || 0;

  const subTotal = useMemo(() => {
    return watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
  }, [watchedItems]);

  const calculatedTaxAmount = useMemo(() => {
    return subTotal * (watchedTaxRate / 100);
  }, [subTotal, watchedTaxRate]);

  const totalAmount = useMemo(() => {
    return subTotal + calculatedTaxAmount - watchedDiscount;
  }, [subTotal, calculatedTaxAmount, watchedDiscount]);


  const handleUpdateInvoice: SubmitHandler<CreateInvoiceFormValues> = async (data) => {
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

    const result: InvoiceOperationResult = await updateInvoiceAction(invoiceId, dataForServerAction, adminFirebaseUser.uid);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      router.push(`/admin/invoices/view/${invoiceId}`);
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive', duration: 7000 });
    }
    setIsSubmitting(false);
  };

  if (isLoadingInvoice || isLoadingClients) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <LottieLoader size={64} />
        <p className="ml-4 text-lg">Loading invoice data...</p>
      </div>
    );
  }


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
            <Edit className="mr-3 h-7 w-7" /> Edit Invoice
          </CardTitle>
          <CardDescription>Modify the invoice details below. Invoice #: {form.getValues('invoiceNumber') || invoiceId.substring(0,6)+'...'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateInvoice)} className="space-y-8">
              
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
                        <Select 
                            onValueChange={(value) => {
                            field.onChange(value);
                            const selectedClient = clients.find(c => c.id === value);
                            if (selectedClient) {
                                form.setValue('clientName', selectedClient.name, { shouldDirty: true });
                                form.setValue('clientEmail', selectedClient.email || '', { shouldDirty: true });
                            }
                            }} 
                            value={field.value} 
                            disabled={isLoadingClients || isSubmitting}
                        >
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
                  <div key={item.id} className="grid grid-cols-12 gap-x-2 gap-y-2 items-start mb-4 p-3 border rounded-md bg-secondary/30">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="col-span-12 md:col-span-4">
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
                        <FormItem className="col-span-3 md:col-span-2">
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
                      name={`items.${index}.unitOfMeasure`}
                      render={({ field }) => (
                        <FormItem className="col-span-4 md:col-span-2">
                           {index === 0 && <FormLabel className="text-xs md:hidden">Unit</FormLabel>}
                          <FormControl>
                            <Input placeholder="Unit (e.g. hrs, pcs)" {...field} value={field.value ?? ''} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="col-span-3 md:col-span-2">
                          {index === 0 && <FormLabel className="text-xs md:hidden">Unit Price</FormLabel>}
                          <FormControl>
                            <Input type="number" placeholder="Unit Price" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="col-span-2 md:col-span-1 flex items-center pt-1 md:pt-0">
                       {index === 0 && <FormLabel className="text-xs md:hidden invisible">Total</FormLabel>}
                      <p className="text-sm font-medium w-full text-right pr-1">
                        {KESFormatter.format((form.getValues(`items.${index}.quantity`) || 0) * (form.getValues(`items.${index}.unitPrice`) || 0))}
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
                  onClick={() => append({ description: '', quantity: 1, unitOfMeasure: '', unitPrice: 0 })}
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
                              value={field.value} 
                              className="flex flex-wrap gap-4" 
                              disabled={isSubmitting}
                            >
                              {(['draft', 'pending', 'paid', 'overdue', 'void'] as const).map((statusValue) => (
                                <FormItem key={statusValue} className="flex items-center space-x-2">
                                  <RadioGroupItem value={statusValue} id={`status-${statusValue}`} />
                                  <Label htmlFor={`status-${statusValue}`} className="capitalize">{statusValue}</Label>
                                </FormItem>
                              ))}
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
                        <span className="font-medium">{KESFormatter.format(subTotal)}</span>
                    </div>
                     <FormField
                        control={form.control}
                        name="taxRate"
                        render={({ field }) => (
                        <FormItem className="space-y-1 text-sm">
                            <div className="flex justify-between items-center">
                                <FormLabel className="text-muted-foreground mb-0">Tax Rate (%):</FormLabel>
                                <div className="flex items-center">
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-8 w-20 text-right" placeholder="0" disabled={isSubmitting}/>
                                    </FormControl>
                                    <Percent className="h-4 w-4 ml-1 text-muted-foreground" />
                                </div>
                            </div>
                            {field.value > 0 && <p className="text-xs text-right text-muted-foreground">Tax Amount: {KESFormatter.format(calculatedTaxAmount)}</p>}
                            <FormMessage />
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
                        <span>{KESFormatter.format(totalAmount)}</span>
                    </div>
                </Card>
              </div>


              <CardFooter className="px-0 pt-8">
                <Button type="submit" disabled={isSubmitting || !adminFirebaseUser} size="lg">
                  {isSubmitting ? <LottieLoader className="mr-2" size={20} /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditInvoicePage;
