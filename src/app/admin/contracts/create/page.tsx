
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatISO } from 'date-fns';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { LottieLoader } from '@/components/ui/lottie-loader';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, FilePlus2, Building, Info, Sparkles, Bot, Wand2, Settings2, Tags, Share2, Briefcase } from 'lucide-react';

import { addContractAction, type ContractOperationResult, getAllContractTemplatesAction } from '../actions';
import { CreateContractFormSchema, type CreateContractFormValues, type ContractStatus, type Contract, defaultEditorContent } from '../schema';
import { getAllClientsAction, type Client } from '../../clients/actions';
import { generateContractContent, type GenerateContractContentInput } from '@/ai/flows/generate-contract-content-flow';
// AI Improve flow is temporarily disabled due to complexity with rich text editor
// import { improveContractContent, type ImproveContractContentInput } from '@/ai/flows/improve-contract-content-flow';

import { TiptapEditor } from "@/components/ui/tiptap-editor";


const aiGenerateSchema = z.object({
  contractType: z.string().min(3, "Contract type is required (e.g., Service Agreement)"),
  clientInfo: z.string().min(5, "Client info summary is required"),
  serviceSummary: z.string().min(10, "Service summary is required"),
  paymentDetails: z.string().min(5, "Payment details summary is required"),
  keyClauses: z.string().optional(), 
});
type AiGenerateFormValues = z.infer<typeof aiGenerateSchema>;

interface ContractMetadataSidebarProps {
  formControl: ReturnType<typeof useForm<CreateContractFormValues & { tagsInput?: string }>>['control'];
  formWatch: ReturnType<typeof useForm<CreateContractFormValues & { tagsInput?: string }>>['watch'];
  isSubmitting: boolean;
  isTemplate: boolean;
  clients: Client[];
  isLoadingClients: boolean;
  contractTemplates: Contract[];
  isLoadingTemplates: boolean;
  setSelectedTemplateId: (id: string | null) => void;
}

const ContractMetadataSidebar: FC<ContractMetadataSidebarProps> = ({
  formControl,
  formWatch,
  isSubmitting,
  isTemplate,
  clients,
  isLoadingClients,
  contractTemplates,
  isLoadingTemplates,
  setSelectedTemplateId,
}) => {
  return (
    <aside className="w-80 border-l border-border bg-background p-6 space-y-6 overflow-y-auto flex-shrink-0 transition-all duration-300">
      <h3 className="text-lg font-semibold text-primary">Contract Settings</h3>
      <Separator />
      
      <FormField control={formControl} name="isTemplate" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5"><FormLabel>Save as Template?</FormLabel><FormDescription className="text-xs">This contract will be reusable.</FormDescription></div>
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl>
          </FormItem>
      )} />

      {isTemplate && (
        <FormField control={formControl} name="templateName" render={({ field }) => (
            <FormItem><FormLabel>Template Name *</FormLabel><FormControl><Input placeholder="e.g., Standard Service Agreement" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
        )} />
      )}
      
      {!isTemplate && (
         <div className="space-y-4">
            <FormField control={formControl} name="clientId" render={({ field }) => (
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
                <Label className="text-sm">Or Use Template Content</Label>
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
                <FormDescription className="text-xs">Populate editor with template content.</FormDescription>
            </FormItem>
        </div>
      )}

      <FormField control={formControl} name="effectiveDate" render={({ field }) => (
          <FormItem className="flex flex-col"><FormLabel className="text-sm">Effective Date *</FormLabel><DatePicker date={field.value} setDate={field.onChange} disabled={isSubmitting} /><FormMessage /></FormItem>
      )} />
      <FormField control={formControl} name="expirationDate" render={({ field }) => (
          <FormItem className="flex flex-col"><FormLabel className="text-sm">Expiration Date</FormLabel><DatePicker date={field.value} setDate={(date) => field.onChange(date || null)} placeholder="No expiration" disabled={isSubmitting} /><FormMessage /></FormItem>
      )} />
      
      {!isTemplate && (
        <FormField control={formControl} name="status" render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm">Contract Status *</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1" disabled={isSubmitting || isTemplate}>
                  {(['draft', 'pending_signature', 'active'] as const).map((statusValue) => ( 
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
            <p className="text-blue-700">This will be saved with status 'Template'.</p>
        </div>
      )}
       <FormField
        control={formControl}
        name="tagsInput"
        render={({ field }) => (
            <FormItem>
            <FormLabel className="text-sm flex items-center"><Tags className="mr-1.5 h-4 w-4 text-muted-foreground" />Tags</FormLabel>
            <FormControl><Input placeholder="e.g. NDA, Software, Q1-2024" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl>
            <FormDescription className="text-xs">Comma-separated tags. (Backend not implemented)</FormDescription>
            <FormMessage />
            </FormItem>
        )}
        />
        <Button variant="outline" size="sm" className="w-full" disabled><Share2 className="mr-2 h-4 w-4" />Collaborate (Coming Soon)</Button>
    </aside>
  );
};


const CreateContractNotionStylePage: FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { user: adminFirebaseUser } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [contractTemplates, setContractTemplates] = useState<Contract[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);
  // const [isImprovingAiContent, setIsImprovingAiContent] = useState(false); // AI Improve temporarily disabled
  const [aiDialogGenerateOpen, setAiDialogGenerateOpen] = useState(false);
  const [showMetadataSidebar, setShowMetadataSidebar] = useState(false);

  const form = useForm<CreateContractFormValues & { tagsInput?: string }>({ 
    resolver: zodResolver(CreateContractFormSchema.extend({ tagsInput: z.string().optional()})),
    defaultValues: {
      title: 'Untitled Contract',
      clientId: '',
      contentJson: defaultEditorContent,
      effectiveDate: new Date(),
      expirationDate: null,
      status: 'draft',
      isTemplate: false,
      templateName: '',
      tagsInput: '', 
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

  useEffect(() => {
    fetchClientsCallback();
    fetchTemplatesCallback();
  }, [fetchClientsCallback, fetchTemplatesCallback]);

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
            if (template.contentJson) {
              form.setValue('contentJson', template.contentJson, { shouldDirty: true });
            } else {
               form.setValue('contentJson', {
                type: "doc",
                content: [
                  { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: template.title }] },
                  ...(defaultEditorContent.content || [])
                ]
               }, { shouldDirty: true });
            }
            toast({ title: "Template Applied", description: `Content from "${template.templateName || template.title}" loaded into editor.`});
        }
        setSelectedTemplateId(null); 
    }
  }, [selectedTemplateId, contractTemplates, form, toast]);


  const handleSaveContract: SubmitHandler<CreateContractFormValues & {tagsInput?: string}> = async (data) => {
    setIsSubmitting(true);
    if (!adminFirebaseUser?.uid) {
      toast({ title: 'Authentication Error', description: 'Admin not authenticated.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    
    const dataForServerAction: Omit<CreateContractFormValues, 'effectiveDate' | 'expirationDate'> & { effectiveDate: string; expirationDate?: string | null; } = {
        title: data.title,
        clientId: data.isTemplate ? null : data.clientId,
        contentJson: data.contentJson,
        effectiveDate: formatISO(data.effectiveDate), 
        expirationDate: data.expirationDate ? formatISO(data.expirationDate) : null,
        status: data.isTemplate ? 'template' as ContractStatus : data.status,
        isTemplate: data.isTemplate,
        templateName: data.isTemplate ? data.templateName : null,
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

      // Convert Markdown to Tiptap JSON structure
      const content = [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Executive Summary' }] },
        { type: 'paragraph', content: [{ type: 'text', text: output.executiveSummaryMarkdown || '' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Scope of Services / Description' }] },
        { type: 'paragraph', content: [{ type: 'text', text: output.serviceDescriptionMarkdown || '' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Payment Terms' }] },
        { type: 'paragraph', content: [{ type: 'text', text: output.paymentTermsMarkdown || '' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Terms and Conditions' }] },
        { type: 'paragraph', content: [{ type: 'text', text: output.termsAndConditionsMarkdown || '' }] },
      ];

      if (output.additionalClausesMarkdown) {
        content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Additional Clauses' }] });
        content.push({ type: 'paragraph', content: [{ type: 'text', text: output.additionalClausesMarkdown }] });
      }
      if (output.signatoryBlockMarkdown) {
        content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Signatory Section' }] });
        content.push({ type: 'paragraph', content: [{ type: 'text', text: output.signatoryBlockMarkdown }] });
      }

      form.setValue('contentJson', { type: "doc", content } , { shouldDirty: true });

      toast({ title: 'AI Content Drafted', description: 'Contract content populated. Review and refine.' });
      setAiDialogGenerateOpen(false); 
      aiGenerateForm.reset();
    } catch (error: any) {
      console.error("AI Contract Generation Error:", error);
      toast({ title: 'AI Generation Failed', description: error.message || 'Could not generate contract content.', variant: 'destructive' });
    }
    setIsGeneratingAiContent(false);
  };
  
  const currentStatus = form.watch('status');

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-secondary/30 flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveContract)} className="flex-grow flex flex-col">
            
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
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setAiDialogGenerateOpen(true)} disabled={isGeneratingAiContent || isSubmitting}>
                        <Bot className="mr-1.5 h-4 w-4" /> AI Draft
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Generate contract draft with AI</p></TooltipContent>
                  </Tooltip>
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" disabled> 
                        <Wand2 className="mr-1.5 h-4 w-4" /> AI Improve
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>AI Improve (Temporarily Disabled)</p></TooltipContent>
                  </Tooltip>
                   <Tooltip>
                    <TooltipTrigger asChild>
                       <Button type="button" variant="ghost" size="icon" onClick={() => setShowMetadataSidebar(!showMetadataSidebar)} className="text-muted-foreground">
                        <Settings2 className="h-5 w-5" />
                       </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Contract Settings & Metadata</p></TooltipContent>
                  </Tooltip>
                  <Button type="submit" disabled={isSubmitting || isGeneratingAiContent || !adminFirebaseUser} size="sm">
                    {isSubmitting ? <LottieLoader className="mr-2" size={16} /> : <Save className="mr-1.5 h-4 w-4" />}
                    {isSubmitting ? (isTemplate ? 'Saving Template...' : 'Saving...') : (isTemplate ? 'Save Template' : (currentStatus === 'draft' ? 'Save Draft' : `Save as ${currentStatus.replace('_',' ')}`)) }
                  </Button>
                </div>
              </div>
            </header>

            
            <div className="flex-grow flex">
              <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto bg-card shadow-xl rounded-lg">
                  <div className="p-2 md:p-4 min-h-[70vh]">
                     <Controller
                        control={form.control}
                        name="contentJson"
                        render={({ field }) => (
                          <TiptapEditor
                            content={field.value as object}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      {form.formState.errors.contentJson && (
                        <p className="text-sm text-destructive mt-2 p-4">{form.formState.errors.contentJson.message?.toString()}</p>
                      )}
                  </div>
                </div>
              </main>
              
              {showMetadataSidebar && (
                <ContractMetadataSidebar
                  formControl={form.control}
                  formWatch={form.watch}
                  isSubmitting={isSubmitting}
                  isTemplate={isTemplate}
                  clients={clients}
                  isLoadingClients={isLoadingClients}
                  contractTemplates={contractTemplates}
                  isLoadingTemplates={isLoadingTemplates}
                  setSelectedTemplateId={setSelectedTemplateId}
                />
              )}
            </div>
          </form>
        </Form>

        
        <Dialog open={aiDialogGenerateOpen} onOpenChange={setAiDialogGenerateOpen}>
            <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Generate Contract with AI</DialogTitle>
                <DialogDescription>Provide key details for the AI to draft the contract sections. This will populate the editor.</DialogDescription>
            </DialogHeader>
            <form onSubmit={aiGenerateForm.handleSubmit(handleGenerateWithAi)} className="space-y-4 py-4">
                <FormField control={aiGenerateForm.control} name="contractType" render={({ field }) => (
                <FormItem><FormLabel>Contract Type *</FormLabel><FormControl><Input {...field} placeholder="e.g., Service Agreement, NDA" disabled={isGeneratingAiContent} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={aiGenerateForm.control} name="clientInfo" render={({ field }) => (
                <FormItem><FormLabel>Client Info Summary *</FormLabel><FormControl><Input {...field} placeholder="e.g., Acme Corp, a software company" disabled={isGeneratingAiContent} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={aiGenerateForm.control} name="serviceSummary" render={({ field }) => (
                <FormItem><FormLabel>Service/Scope Summary *</FormLabel><FormControl><Textarea {...field} placeholder="e.g., Provide VA services for social media management for 3 months" disabled={isGeneratingAiContent} rows={3}/></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={aiGenerateForm.control} name="paymentDetails" render={({ field }) => (
                <FormItem><FormLabel>Payment Details Summary *</FormLabel><FormControl><Input {...field} placeholder="e.g., KES 20,000 per month, due on 1st" disabled={isGeneratingAiContent} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={aiGenerateForm.control} name="keyClauses" render={({ field }) => (
                <FormItem><FormLabel>Key Clauses (Optional, comma-separated)</FormLabel><FormControl><Input {...field} placeholder="e.g., Confidentiality, IP Rights" disabled={isGeneratingAiContent} /></FormControl><FormMessage /></FormItem>
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
      </div>
    </TooltipProvider>
  );
};

export default CreateContractNotionStylePage;
