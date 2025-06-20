
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react'; 
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Edit, Briefcase, Settings2, Tags, Share2 } from 'lucide-react';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatISO, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Added missing import
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Separator } from '@/components/ui/separator';
import { FilePlus2, Building, Info, Sparkles, Bot, Wand2, Save } from 'lucide-react';

import { getContractAction, updateContractAction, getAllContractTemplatesAction, type ContractOperationResult } from '../../actions';
import { CreateContractFormSchema, type CreateContractFormValues, type Contract, type ContractStatus } from '../../schema';
import { getAllClientsAction, type Client } from '../../../clients/actions';
import { generateContractContent, type GenerateContractContentInput } from '@/ai/flows/generate-contract-content-flow';
import { improveContractContent, type ImproveContractContentInput } from '@/ai/flows/improve-contract-content-flow';
import { z } from 'zod';


const aiGenerateSchema = z.object({
  contractType: z.string().min(3, "Contract type is required (e.g., Service Agreement)"),
  clientInfo: z.string().min(5, "Client info summary is required"),
  serviceSummary: z.string().min(10, "Service summary is required"),
  paymentDetails: z.string().min(5, "Payment details summary is required"),
  keyClauses: z.string().optional(), 
});
type AiGenerateFormValues = z.infer<typeof aiGenerateSchema>;


const EditContractNotionStylePage: FC = () => {
  const params = useParams();
  const contractId = params.contractId as string;
  const router = useRouter();
  const { toast } = useToast();
  const { user: adminFirebaseUser } = useAdminAuth();

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [contractTemplates, setContractTemplates] = useState<Contract[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);
  const [isImprovingAiContent, setIsImprovingAiContent] = useState(false);
  const [aiDialogGenerateOpen, setAiDialogGenerateOpen] = useState(false);
  const [showMetadataSidebar, setShowMetadataSidebar] = useState(false);


  const form = useForm<CreateContractFormValues & { tagsInput?: string, contractNumber?: string }>({ 
    resolver: zodResolver(CreateContractFormSchema.extend({ tagsInput: z.string().optional(), contractNumber: z.string().optional() })),
    defaultValues: {
      title: 'Untitled Contract',
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
      tagsInput: '',
      contractNumber: '',
    },
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

  const fetchTemplatesCallback = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const fetchedTemplates = await getAllContractTemplatesAction();
      setContractTemplates(fetchedTemplates);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch contract templates.", variant: "destructive" });
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [toast]);

  const fetchContractData = useCallback(async () => {
    if (!contractId) {
        router.push('/admin/contracts');
        return;
    }
    setIsLoadingPage(true);
    try {
        const fetchedContract = await getContractAction(contractId);
        if (fetchedContract) {
            form.reset({
                title: fetchedContract.title,
                clientId: fetchedContract.clientId || '',
                executiveSummary: fetchedContract.executiveSummary || '',
                effectiveDate: fetchedContract.effectiveDate ? parseISO(fetchedContract.effectiveDate) : new Date(),
                expirationDate: fetchedContract.expirationDate ? parseISO(fetchedContract.expirationDate) : null,
                serviceDescription: fetchedContract.serviceDescription,
                termsAndConditions: fetchedContract.termsAndConditions,
                paymentTerms: fetchedContract.paymentTerms || '',
                additionalClauses: fetchedContract.additionalClauses || '',
                signatorySectionText: fetchedContract.signatorySectionText || '',
                status: fetchedContract.isTemplate ? 'draft' : fetchedContract.status as Exclude<ContractStatus, 'template'>, 
                isTemplate: fetchedContract.isTemplate,
                templateName: fetchedContract.templateName || '',
                contractNumber: fetchedContract.contractNumber, 
                tagsInput: '', 
            });
        } else {
            toast({ title: "Error", description: "Contract not found.", variant: "destructive" });
            router.push('/admin/contracts');
        }
    } catch (error) {
        console.error("Error fetching contract:", error);
        toast({ title: "Error", description: "Could not load contract details.", variant: "destructive" });
        router.push('/admin/contracts');
    } finally {
        setIsLoadingPage(false);
    }
  }, [contractId, toast, router, form]);


  useEffect(() => {
    fetchClientsCallback();
    fetchTemplatesCallback();
    fetchContractData();
  }, [fetchClientsCallback, fetchTemplatesCallback, fetchContractData]);

  useEffect(() => {
    if (isTemplate) {
      form.setValue('clientId', '');
    }
  }, [isTemplate, form]);

  useEffect(() => {
    if (selectedTemplateId) {
        const template = contractTemplates.find(t => t.id === selectedTemplateId);
        if (template) {
            form.setValue('title', template.title, { shouldDirty: true });
            form.setValue('executiveSummary', template.executiveSummary || '', { shouldDirty: true });
            form.setValue('serviceDescription', template.serviceDescription, { shouldDirty: true });
            form.setValue('termsAndConditions', template.termsAndConditions, { shouldDirty: true });
            form.setValue('paymentTerms', template.paymentTerms || '', { shouldDirty: true });
            form.setValue('additionalClauses', template.additionalClauses || '', { shouldDirty: true });
            form.setValue('signatorySectionText', template.signatorySectionText || '', { shouldDirty: true });
            toast({ title: "Template Applied", description: `Content from "${template.templateName || template.title}" loaded into editor.`});
        }
        setSelectedTemplateId(null); 
    }
  }, [selectedTemplateId, contractTemplates, form, toast]);


  const handleUpdateContract: SubmitHandler<CreateContractFormValues & {tagsInput?: string}> = async (data) => {
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
    const result: ContractOperationResult = await updateContractAction(contractId, dataForServerAction, adminFirebaseUser.uid);
    if (result.success && result.contractId) {
      toast({ title: 'Success', description: result.message });
      router.push(`/admin/contracts/view/${result.contractId}`);
    } else {
      toast({ title: 'Error', description: result.message || 'Failed to update contract.', variant: 'destructive', duration: 7000 });
    }
    setIsSubmitting(false);
  };

  const aiGenerateForm = useForm<AiGenerateFormValues>({
    resolver: zodResolver(aiGenerateSchema),
    defaultValues: { contractType: '', clientInfo: '', serviceSummary: '', paymentDetails: '', keyClauses: '' },
  });

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
      form.setValue('title', output.suggestedTitle, { shouldDirty: true });
      if (output.executiveSummaryMarkdown) form.setValue('executiveSummary', output.executiveSummaryMarkdown, { shouldDirty: true });
      form.setValue('serviceDescription', output.serviceDescriptionMarkdown, { shouldDirty: true });
      form.setValue('termsAndConditions', output.termsAndConditionsMarkdown, { shouldDirty: true });
      form.setValue('paymentTerms', output.paymentTermsMarkdown, { shouldDirty: true });
      if (output.additionalClausesMarkdown) form.setValue('additionalClauses', output.additionalClausesMarkdown, { shouldDirty: true });
      if (output.signatoryBlockMarkdown) form.setValue('signatorySectionText', output.signatoryBlockMarkdown, { shouldDirty: true });
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
    if (!currentData.termsAndConditions?.trim() && !currentData.serviceDescription?.trim() && !currentData.executiveSummary?.trim()) {
      toast({ title: 'Missing Content', description: 'Key content sections are needed to improve with AI.', variant: 'destructive' });
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
      form.setValue('title', output.improvedTitle, { shouldDirty: true });
      if(output.improvedExecutiveSummaryMarkdown) form.setValue('executiveSummary', output.improvedExecutiveSummaryMarkdown, { shouldDirty: true });
      form.setValue('serviceDescription', output.improvedServiceDescriptionMarkdown, { shouldDirty: true });
      form.setValue('termsAndConditions', output.improvedTermsAndConditionsMarkdown, { shouldDirty: true });
      form.setValue('paymentTerms', output.improvedPaymentTermsMarkdown, { shouldDirty: true });
      if(output.improvedAdditionalClausesMarkdown) form.setValue('additionalClauses', output.improvedAdditionalClausesMarkdown, { shouldDirty: true });
      if(output.improvedSignatoryBlockMarkdown) form.setValue('signatorySectionText', output.improvedSignatoryBlockMarkdown, { shouldDirty: true });
      toast({ title: 'AI Content Improved', description: 'Contract content has been refined.' });
    } catch (error: any) {
      console.error("AI Contract Improvement Error:", error);
      toast({ title: 'AI Improvement Failed', description: error.message || 'Could not improve contract content.', variant: 'destructive' });
    }
    setIsImprovingAiContent(false);
  };
  
  const renderSectionTextarea = (name: keyof CreateContractFormValues, label: string, placeholder: string, rows: number = 5, minHeight: string = 'min-h-[120px]') => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="mb-6">
          <FormLabel className="text-sm font-medium text-muted-foreground block mb-1">{label}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              {...field}
              value={field.value || ''}
              rows={rows}
              disabled={isSubmitting}
              className={`w-full p-3 border border-border rounded-md focus:ring-primary focus:border-primary text-base leading-relaxed bg-background ${minHeight} notion-style-textarea`}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  if (isLoadingPage) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <LottieLoader size={64} />
        <p className="ml-4 text-lg">Loading contract...</p>
      </div>
    );
  }
  
  const currentStatus = form.watch('status');

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-secondary/30 flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdateContract)} className="flex-grow flex flex-col">
            
            <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-2 shadow-sm">
              <div className="flex items-center justify-between h-14">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
                    <Link href="/admin/contracts">
                      <ArrowLeft className="h-5 w-5" />
                      <span className="sr-only">Back to Contracts</span>
                    </Link>
                  </Button>
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <FormField control={form.control} name="title" render={({ field }) => (
                      <Input 
                        placeholder="Untitled Contract" 
                        {...field} 
                        className="text-lg font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-1 h-auto w-auto max-w-xs md:max-w-md truncate"
                        disabled={isSubmitting} 
                      />
                  )} />
                   {form.getValues('contractNumber') && (
                      <span className="text-xs text-muted-foreground">({form.getValues('contractNumber')})</span>
                   )}
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setAiDialogGenerateOpen(true)} disabled={isGeneratingAiContent || isSubmitting}>
                        <Bot className="mr-1.5 h-4 w-4" /> AI Draft
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Generate new draft content with AI (overwrites)</p></TooltipContent>
                  </Tooltip>
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" onClick={handleImproveWithAi} disabled={isImprovingAiContent || isSubmitting}>
                        <Wand2 className="mr-1.5 h-4 w-4" /> AI Improve
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Improve existing content with AI</p></TooltipContent>
                  </Tooltip>
                   <Tooltip>
                    <TooltipTrigger asChild>
                       <Button type="button" variant="ghost" size="icon" onClick={() => setShowMetadataSidebar(!showMetadataSidebar)} className="text-muted-foreground">
                        <Settings2 className="h-5 w-5" />
                       </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Contract Settings & Metadata</p></TooltipContent>
                  </Tooltip>
                  <Button type="submit" disabled={isSubmitting || isGeneratingAiContent || isImprovingAiContent || !adminFirebaseUser} size="sm">
                    {isSubmitting ? <LottieLoader className="mr-2" size={16} /> : <Save className="mr-1.5 h-4 w-4" />}
                    {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </header>

            
            <div className="flex-grow flex">
              <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-3xl mx-auto bg-card shadow-xl rounded-lg">
                  <div className="p-8 md:p-12 space-y-8">
                    {renderSectionTextarea("executiveSummary", "Executive Summary", "Provide a brief overview of the contract...", 5, "min-h-[150px]")}
                    {renderSectionTextarea("serviceDescription", "Scope of Services / Description *", "Detailed description of services to be provided...", 10, "min-h-[250px]")}
                    {renderSectionTextarea("termsAndConditions", "Main Terms & Conditions *", "Enter the full terms and conditions of the contract here...", 20, "min-h-[400px]")}
                    {renderSectionTextarea("paymentTerms", "Payment Terms", "e.g., Net 30 days, 50% upfront, specific milestones...", 8, "min-h-[200px]")}
                    {renderSectionTextarea("additionalClauses", "Additional Clauses", "Any other specific clauses for this contract...", 8, "min-h-[200px]")}
                    {renderSectionTextarea("signatorySectionText", "Signatory Section Text", "Draft the signatory block, e.g., names, titles, date lines...", 6, "min-h-[150px]")}
                  </div>
                </div>
              </main>

              
              {showMetadataSidebar && (
                <aside className="w-80 border-l border-border bg-background p-6 space-y-6 overflow-y-auto flex-shrink-0 transition-all duration-300">
                  <h3 className="text-lg font-semibold text-primary">Contract Settings</h3>
                  <Separator />
                  
                  <FormField control={form.control} name="isTemplate" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5"><FormLabel>Save as Template?</FormLabel><FormDescription className="text-xs">This contract will be reusable.</FormDescription></div>
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl>
                      </FormItem>
                  )} />

                  {isTemplate && (
                    <FormField control={form.control} name="templateName" render={({ field }) => (
                        <FormItem><FormLabel>Template Name *</FormLabel><FormControl><Input placeholder="e.g., Standard Service Agreement" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                    )} />
                  )}
                  
                  {!isTemplate && (
                    <div className="space-y-4">
                        <FormField control={form.control} name="clientId" render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center text-sm"><Building className="mr-1.5 h-4 w-4 text-muted-foreground" />Client</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isLoadingClients || isSubmitting || isTemplate}>
                                <FormControl><SelectTrigger><SelectValue placeholder={isLoadingClients ? "Loading..." : (isTemplate ? "N/A for templates" : "Select client")} /></SelectTrigger></FormControl>
                                <SelectContent>{clients.map((client) => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )} />
                        <FormItem>
                            <FormLabel className="text-sm">Or Use Template Content</FormLabel>
                            <Select onValueChange={(value) => setSelectedTemplateId(value)} disabled={isLoadingTemplates || isSubmitting || isTemplate || contractTemplates.length === 0}>
                                <SelectTrigger><SelectValue placeholder={isLoadingTemplates ? "Loading..." : (contractTemplates.length === 0 ? "No templates" : "Load from template")} /></SelectTrigger>
                                <SelectContent>
                                    {contractTemplates.map((template) => (
                                        <SelectItem key={template.id} value={template.id!}> 
                                            {template.templateName || template.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription className="text-xs">Populate fields with template content.</FormDescription>
                        </FormItem>
                    </div>
                  )}

                  <FormField control={form.control} name="effectiveDate" render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel className="text-sm">Effective Date *</FormLabel><DatePicker date={field.value} setDate={field.onChange} disabled={isSubmitting} /><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="expirationDate" render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel className="text-sm">Expiration Date</FormLabel><DatePicker date={field.value} setDate={(date) => field.onChange(date || null)} placeholder="No expiration" disabled={isSubmitting} /><FormMessage /></FormItem>
                  )} />
                  
                  {!isTemplate && (
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm">Contract Status *</FormLabel>
                          <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1" disabled={isSubmitting || isTemplate}>
                              {(['draft', 'pending_signature', 'active', 'expired', 'terminated'] as const).map((statusValue) => (
                                <FormItem key={statusValue} className="flex items-center space-x-2">
                                  <RadioGroupItem value={statusValue} id={`status-${statusValue}`} />
                                  <Label htmlFor={`status-${statusValue}`} className="capitalize text-xs">{statusValue.replace('_', ' ')}</Label>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )} />
                  )}
                  {isTemplate && (
                     <div className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs">
                        <Info className="h-4 w-4 text-blue-600" />
                        <p className="text-blue-700">This is a 'Template'. Status managed via 'Is Template' checkbox.</p>
                    </div>
                  )}
                   <FormField
                    control={form.control}
                    name="tagsInput"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-sm flex items-center"><Tags className="mr-1.5 h-4 w-4 text-muted-foreground" />Tags</FormLabel>
                        <FormControl><Input placeholder="e.g. NDA, Software, Q1-2024" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl>
                        <FormDescription className="text-xs">Comma-separated tags. Full tag support coming soon.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button variant="outline" size="sm" className="w-full" disabled><Share2 className="mr-2 h-4 w-4" />Collaborate (Coming Soon)</Button>
                </aside>
              )}
            </div>
          </form>
        </Form>

        
        <Dialog open={aiDialogGenerateOpen} onOpenChange={setAiDialogGenerateOpen}>
            <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Generate Contract with AI</DialogTitle>
                <DialogDescription>Provide key details. This will overwrite existing content in respective fields.</DialogDescription>
            </DialogHeader>
            <form onSubmit={aiGenerateForm.handleSubmit(handleGenerateWithAi)} className="space-y-4 py-4">
                <FormField control={aiGenerateForm.control} name="contractType" render={({ field }) => (
                <FormItem><FormLabel>Contract Type *</FormLabel><FormControl><Input {...field} placeholder="e.g., Service Agreement" disabled={isGeneratingAiContent} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={aiGenerateForm.control} name="clientInfo" render={({ field }) => (
                <FormItem><FormLabel>Client Info Summary *</FormLabel><FormControl><Input {...field} placeholder="e.g., Acme Corp" disabled={isGeneratingAiContent} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={aiGenerateForm.control} name="serviceSummary" render={({ field }) => (
                <FormItem><FormLabel>Service/Scope Summary *</FormLabel><FormControl><Textarea {...field} placeholder="e.g., VA services for social media" disabled={isGeneratingAiContent} rows={3}/></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={aiGenerateForm.control} name="paymentDetails" render={({ field }) => (
                <FormItem><FormLabel>Payment Details Summary *</FormLabel><FormControl><Input {...field} placeholder="e.g., KES 20,000/month" disabled={isGeneratingAiContent} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={aiGenerateForm.control} name="keyClauses" render={({ field }) => (
                <FormItem><FormLabel>Key Clauses (Optional)</FormLabel><FormControl><Input {...field} placeholder="Confidentiality, IP" disabled={isGeneratingAiContent} /></FormControl><FormMessage /></FormItem>
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
         <style jsx global>{`
          .notion-style-textarea {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
            line-height: 1.6;
          }
           .notion-style-textarea:focus {
             box-shadow: none !important;
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
};

export default EditContractNotionStylePage;
    
