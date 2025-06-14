
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatISO, add } from 'date-fns';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, FilePlus2, Building, Info, Sparkles, Bot, Wand2 } from 'lucide-react';

import { addContractAction, type ContractOperationResult } from '../actions';
import { CreateContractFormSchema, type CreateContractFormValues, type ContractStatus } from '../schema';
import { getAllClientsAction, type Client } from '../../clients/actions';
import { generateContractContent, type GenerateContractContentInput } from '@/ai/flows/generate-contract-content-flow';
import { improveContractContent, type ImproveContractContentInput } from '@/ai/flows/improve-contract-content-flow';

const aiGenerateSchema = z.object({
  contractType: z.string().min(3, "Contract type is required (e.g., Service Agreement)"),
  clientInfo: z.string().min(5, "Client info summary is required"),
  serviceSummary: z.string().min(10, "Service summary is required"),
  paymentDetails: z.string().min(5, "Payment details summary is required"),
  keyClauses: z.string().optional(), // Comma-separated
});
type AiGenerateFormValues = z.infer<typeof aiGenerateSchema>;

const CreateContractPage: FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { user: adminFirebaseUser } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);
  const [isImprovingAiContent, setIsImprovingAiContent] = useState(false);
  const [aiDialogGenerateOpen, setAiDialogGenerateOpen] = useState(false);

  const form = useForm<CreateContractFormValues>({
    resolver: zodResolver(CreateContractFormSchema),
    defaultValues: {
      title: '',
      clientId: '',
      executiveSummary: '',
      effectiveDate: new Date(),
      expirationDate: null,
      serviceDescription: '',
      termsAndConditions: '',
      paymentTerms: '',
      additionalClauses: '',
      signatorySectionText: '',
      status: 'draft',
      isTemplate: false,
      templateName: '',
    },
  });

  const aiGenerateForm = useForm<AiGenerateFormValues>({
    resolver: zodResolver(aiGenerateSchema),
    defaultValues: { contractType: '', clientInfo: '', serviceSummary: '', paymentDetails: '', keyClauses: '' },
  });

  const isTemplate = form.watch('isTemplate');

  const fetchClientsCallback = useCallback(async () => {
    setIsLoadingClients(true);
    try {
      const fetchedClients = await getAllClientsAction();
      setClients(fetchedClients.filter(c => !c.isDisabled));
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
    if (isTemplate) {
      form.setValue('clientId', '');
    }
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
        templateName: data.isTemplate ? data.templateName : null,
        executiveSummary: data.executiveSummary || null,
        additionalClauses: data.additionalClauses || null,
        signatorySectionText: data.signatorySectionText || null,
    };
    const result: ContractOperationResult = await addContractAction(dataForServerAction, adminFirebaseUser.uid);
    if (result.success && result.contractId) {
      toast({ title: 'Success', description: result.message });
      router.push(`/admin/contracts/view/${result.contractId}`);
    } else {
      toast({ title: 'Error', description: result.message || 'Failed to create contract.', variant: 'destructive', duration: 7000 });
    }
    setIsSubmitting(false);
  };

  const handleGenerateWithAi: SubmitHandler<AiGenerateFormValues> = async (aiData) => {
    setIsGeneratingAiContent(true);
    try {
      const input: GenerateContractContentInput = {
        contractType: aiData.contractType,
        clientInfo: aiData.clientInfo,
        serviceSummary: aiData.serviceSummary,
        paymentDetails: aiData.paymentDetails,
        keyClauses: aiData.keyClauses?.split(',').map(k => k.trim()).filter(k => k) || [],
      };
      const output = await generateContractContent(input);
      form.setValue('title', output.suggestedTitle);
      if (output.executiveSummaryMarkdown) form.setValue('executiveSummary', output.executiveSummaryMarkdown);
      form.setValue('serviceDescription', output.serviceDescriptionMarkdown);
      form.setValue('termsAndConditions', output.termsAndConditionsMarkdown);
      form.setValue('paymentTerms', output.paymentTermsMarkdown);
      if (output.additionalClausesMarkdown) form.setValue('additionalClauses', output.additionalClausesMarkdown);
      if (output.signatoryBlockMarkdown) form.setValue('signatorySectionText', output.signatoryBlockMarkdown);
      toast({ title: 'AI Content Generated', description: 'Contract fields populated with draft content.' });
      setAiDialogGenerateOpen(false); 
      aiGenerateForm.reset();
    } catch (error: any) {
      console.error("AI Contract Generation Error:", error);
      toast({ title: 'AI Generation Failed', description: error.message || 'Could not generate contract content.', variant: 'destructive' });
    }
    setIsGeneratingAiContent(false);
  };

  const handleImproveWithAi = async () => {
    setIsImprovingAiContent(true);
    const currentData = form.getValues();
    if (!currentData.termsAndConditions.trim() && !currentData.serviceDescription.trim() && !currentData.executiveSummary?.trim()) {
      toast({ title: 'Missing Content', description: 'Key content sections (Terms, Services, or Summary) are needed to improve with AI.', variant: 'destructive' });
      setIsImprovingAiContent(false);
      return;
    }
    try {
      const input: ImproveContractContentInput = {
        currentTitle: currentData.title || "Untitled Contract",
        currentExecutiveSummary: currentData.executiveSummary || undefined,
        currentServiceDescription: currentData.serviceDescription || "Not specified",
        currentTermsAndConditions: currentData.termsAndConditions || "Not specified",
        currentPaymentTerms: currentData.paymentTerms || "Not specified",
        currentAdditionalClauses: currentData.additionalClauses || undefined,
        currentSignatoryBlock: currentData.signatorySectionText || undefined,
      };
      const output = await improveContractContent(input);
      form.setValue('title', output.improvedTitle);
      if (output.improvedExecutiveSummaryMarkdown) form.setValue('executiveSummary', output.improvedExecutiveSummaryMarkdown);
      form.setValue('serviceDescription', output.improvedServiceDescriptionMarkdown);
      form.setValue('termsAndConditions', output.improvedTermsAndConditionsMarkdown);
      form.setValue('paymentTerms', output.improvedPaymentTermsMarkdown);
      if (output.improvedAdditionalClausesMarkdown) form.setValue('additionalClauses', output.improvedAdditionalClausesMarkdown);
      if (output.improvedSignatoryBlockMarkdown) form.setValue('signatorySectionText', output.improvedSignatoryBlockMarkdown);
      toast({ title: 'AI Content Improved', description: 'Contract content has been refined.' });
    } catch (error: any) {
      console.error("AI Contract Improvement Error:", error);
      toast({ title: 'AI Improvement Failed', description: error.message || 'Could not improve contract content.', variant: 'destructive' });
    }
    setIsImprovingAiContent(false);
  };

  return (
    <TooltipProvider>
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
          <CardDescription>Fill in details or use AI to generate a draft. Saved templates can be reused.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveContract)} className="space-y-8">
              
            <Dialog open={aiDialogGenerateOpen} onOpenChange={setAiDialogGenerateOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Generate Contract with AI</DialogTitle>
                  <DialogDescription>
                    Provide key details for the AI to draft the contract sections.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={aiGenerateForm.handleSubmit(handleGenerateWithAi)} className="space-y-4 py-4">
                  <FormField control={aiGenerateForm.control} name="contractType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Type *</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g., Service Agreement, NDA" disabled={isGeneratingAiContent} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={aiGenerateForm.control} name="clientInfo" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Info Summary *</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g., Acme Corp, a software company" disabled={isGeneratingAiContent} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={aiGenerateForm.control} name="serviceSummary" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service/Scope Summary *</FormLabel>
                      <FormControl><Textarea {...field} placeholder="e.g., Provide VA services for social media management for 3 months" disabled={isGeneratingAiContent} rows={3}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={aiGenerateForm.control} name="paymentDetails" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Details Summary *</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g., KES 20,000 per month, due on 1st" disabled={isGeneratingAiContent} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={aiGenerateForm.control} name="keyClauses" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Clauses (Optional, comma-separated)</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g., Confidentiality, IP Rights" disabled={isGeneratingAiContent} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isGeneratingAiContent}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isGeneratingAiContent}>
                      {isGeneratingAiContent ? <LottieLoader className="mr-2" size={20} /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isGeneratingAiContent ? 'Generating...' : 'Generate Draft'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>


              <FormField
                control={form.control}
                name="isTemplate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-secondary/30">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Save as Contract Template?</FormLabel>
                      <FormDescription>If checked, this will be saved as a template and won't be tied to a specific client.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isTemplate && (
                <FormField control={form.control} name="templateName" render={({ field }) => (
                    <FormItem><FormLabel>Template Name *</FormLabel><FormControl><Input placeholder="e.g., Standard Service Agreement Template" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />
              )}
              
              <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Contract Title *</FormLabel><FormControl><Input placeholder={isTemplate ? "e.g., General Service Agreement" : "e.g., Web Development Services for Client X"} {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
              )} />

              {!isTemplate && (
                <FormField control={form.control} name="clientId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground" />Client (Optional for draft)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isLoadingClients || isSubmitting || isTemplate}>
                        <FormControl><SelectTrigger><SelectValue placeholder={isLoadingClients ? "Loading clients..." : (isTemplate ? "Not applicable for templates" : "Select a client")} /></SelectTrigger></FormControl>
                        <SelectContent>{clients.map((client) => (<SelectItem key={client.id} value={client.id}>{client.name} ({client.email})</SelectItem>))}</SelectContent>
                      </Select>
                      <FormDescription>Select client. Leave blank if not applicable yet.</FormDescription><FormMessage />
                    </FormItem>
                )} />
              )}

              <FormField control={form.control} name="executiveSummary" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Executive Summary (Optional, Markdown supported)</FormLabel>
                    <FormControl><Textarea placeholder="A brief overview of the contract's purpose and key terms..." {...field} value={field.value ?? ''} rows={4} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="effectiveDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Effective Date *</FormLabel><DatePicker date={field.value} setDate={field.onChange} disabled={isSubmitting} /><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="expirationDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Expiration Date (Optional)</FormLabel><DatePicker date={field.value} setDate={(date) => field.onChange(date || null)} placeholder="No expiration" disabled={isSubmitting} /><FormMessage /></FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="serviceDescription" render={({ field }) => (
                  <FormItem><FormLabel>Scope of Services / Description * (Markdown supported)</FormLabel><FormControl><Textarea placeholder="Detailed description of services to be provided..." {...field} rows={8} disabled={isSubmitting} className="min-h-[200px]" /></FormControl><FormMessage /></FormItem>
              )} />
              
              <div className="space-y-2 relative">
                <Label htmlFor="termsAndConditions">Main Terms & Conditions * (Markdown supported)</Label>
                <Textarea id="termsAndConditions" placeholder="Enter the full terms and conditions of the contract here..." {...form.register('termsAndConditions')} rows={15} className="min-h-[300px] pr-12" disabled={isSubmitting} />
                {form.formState.errors.termsAndConditions && <p className="text-sm text-destructive">{form.formState.errors.termsAndConditions.message}</p>}
                
                <div className="absolute top-0 right-0 flex flex-col space-y-2 pt-1 pr-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="outline" size="icon" disabled={isGeneratingAiContent || isSubmitting} onClick={() => setAiDialogGenerateOpen(true)}>
                        <Bot className="h-4 w-4" /><span className="sr-only">Generate content with AI</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Generate with AI</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="outline" size="icon" onClick={handleImproveWithAi} disabled={isImprovingAiContent || isSubmitting}>
                        {isImprovingAiContent ? <LottieLoader size={16} /> : <Wand2 className="h-4 w-4" />}
                        <span className="sr-only">Improve content with AI</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Improve with AI</p></TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                  <FormItem><FormLabel>Payment Terms (Optional, Markdown supported)</FormLabel><FormControl><Textarea placeholder="e.g., Net 30 days, 50% upfront, specific milestones..." {...field} value={field.value ?? ''} rows={5} disabled={isSubmitting} className="min-h-[150px]" /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="additionalClauses" render={({ field }) => (
                  <FormItem><FormLabel>Additional Clauses (Optional, Markdown supported)</FormLabel><FormControl><Textarea placeholder="Any other specific clauses for this contract..." {...field} value={field.value ?? ''} rows={6} disabled={isSubmitting} className="min-h-[180px]" /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="signatorySectionText" render={({ field }) => (
                  <FormItem><FormLabel>Signatory Section Text (Optional, Markdown supported)</FormLabel><FormControl><Textarea placeholder="Draft the signatory block, e.g., names, titles, date lines..." {...field} value={field.value ?? ''} rows={4} disabled={isSubmitting} className="min-h-[120px]" /></FormControl><FormMessage /></FormItem>
              )} />

              {!isTemplate && (
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Contract Status *</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0" disabled={isSubmitting || isTemplate}>
                          {(['draft', 'pending_signature', 'active'] as const).map((statusValue) => (
                            <FormItem key={statusValue} className="flex items-center space-x-2">
                              <RadioGroupItem value={statusValue} id={`status-${statusValue}`} />
                              <Label htmlFor={`status-${statusValue}`} className="capitalize">{statusValue.replace('_', ' ')}</Label>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>Set current status. 'Template' status is automatic if 'Save as Template' is checked.</FormDescription><FormMessage />
                    </FormItem>
                )} />
              )}
              {isTemplate && (
                 <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <Info className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-700">This contract will be saved with status 'Template'.</p>
                </div>
              )}

              <CardFooter className="px-0 pt-8">
                <Button type="submit" disabled={isSubmitting || isGeneratingAiContent || isImprovingAiContent || !adminFirebaseUser} size="lg">
                  {isSubmitting ? <LottieLoader className="mr-2" size={20} /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? (isTemplate ? 'Saving Template...' : 'Saving Contract...') : (isTemplate ? 'Save as Template' : 'Create Contract')}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
};

export default CreateContractPage;
