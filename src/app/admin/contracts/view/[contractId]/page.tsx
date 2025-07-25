
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react'; 
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getContractAction } from '../../actions';
import type { Contract, ContractStatus } from '../../schema';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { ArrowLeft, FileText as FileTextIcon, Printer, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateHTML } from '@tiptap/html';
import { defaultEditorContent } from '../../schema';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import LinkExtension from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

const statusColors: Record<ContractStatus, string> = {
  draft: 'bg-gray-400 text-gray-800 border-gray-500',
  pending_signature: 'bg-yellow-400 text-yellow-800 border-yellow-500',
  active: 'bg-green-500 text-white border-green-600',
  expired: 'bg-blue-500 text-white border-blue-600',
  terminated: 'bg-red-600 text-white border-red-600',
  template: 'bg-purple-500 text-white border-purple-600',
};

// Define Tiptap extensions that match what our editor uses
const tiptapExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    bulletList: { keepMarks: true, keepAttributes: true },
    orderedList: { keepMarks: true, keepAttributes: true },
  }),
  Underline,
  LinkExtension.configure({ openOnClick: false, autolink: true, }),
  Placeholder.configure({ placeholder: "Contract content will appear here..." }),
];


const ViewContractPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const contractId = params.contractId as string;
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderedHtml, setRenderedHtml] = useState<string>('');

  const fetchContract = useCallback(async () => {
    if (!contractId) return;
    setIsLoading(true);
    try {
      const fetchedContract = await getContractAction(contractId);
      if (fetchedContract) {
        setContract(fetchedContract);
        if (fetchedContract.contentJson) {
          try {
            const contentToRender = typeof fetchedContract.contentJson === 'object' && fetchedContract.contentJson !== null
              ? fetchedContract.contentJson
              : defaultEditorContent;
            
            const html = generateHTML(contentToRender as any, tiptapExtensions);
            setRenderedHtml(html);
          } catch(e) {
             console.error("Error generating HTML from contract JSON:", e);
             setRenderedHtml("<p>Error rendering contract content.</p>");
          }
        } else {
          setRenderedHtml("<p>No content available for this contract.</p>");
        }
      } else {
        toast({ title: "Error", description: "Contract not found.", variant: "destructive" });
        router.push('/admin/contracts');
      }
    } catch (error) {
      console.error("Error fetching contract:", error);
      toast({ title: "Error", description: "Could not fetch contract details.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [contractId, toast, router]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      document.title = `TTCON-${contract?.contractNumber || contractId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      window.print();
    }
  };

  if (isLoading || !contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <LottieLoader size={64} />
        <p className="mt-4 text-lg text-muted-foreground">Loading contract details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" asChild>
          <Link href="/admin/contracts">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contracts Hub
          </Link>
        </Button>
        <div className="space-x-2">
            <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
            </Button>
            <Button variant="outline" asChild>
                <Link href={`/admin/contracts/edit/${contract.id}`}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
            </Button>
        </div>
      </div>

      <Card className="shadow-lg print:shadow-none print:border-none" id="contract-to-print">
        <CardHeader className="bg-muted/30 p-6 print:bg-transparent">
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">
                {contract.isTemplate ? 'CONTRACT TEMPLATE' : 'CONTRACT AGREEMENT'}
              </h1>
              <p className="text-muted-foreground">
                {contract.isTemplate ? `Template: ${contract.templateName}` : `Contract #: ${contract.contractNumber}`}
              </p>
            </div>
            <div className="text-left sm:text-right mt-4 sm:mt-0">
              <Badge variant="outline" className={cn("text-sm px-3 py-1", statusColors[contract.status])}>
                Status: {contract.status.charAt(0).toUpperCase() + contract.status.slice(1).replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-muted-foreground mb-1">Contract Title</h3>
              <p className="text-primary font-medium">{contract.title}</p>
            </div>
            {!contract.isTemplate && contract.clientName && (
              <div>
                <h3 className="font-semibold text-muted-foreground mb-1">Client</h3>
                <p className="text-primary font-medium">{contract.clientName}</p>
                {contract.clientId && <p className="text-xs text-muted-foreground">ID: {contract.clientId}</p>}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-muted-foreground mb-1">Effective Date</h3>
              <p>{format(parseISO(contract.effectiveDate), 'PPP')}</p>
            </div>
            {contract.expirationDate && (
              <div>
                <h3 className="font-semibold text-muted-foreground mb-1">Expiration Date</h3>
                <p>{format(parseISO(contract.expirationDate), 'PPP')}</p>
              </div>
            )}
          </div>
          
          <Separator />

          <div className="prose prose-lg dark:prose-invert max-w-none bg-background rounded-md">
            {isLoading ? (
                <p>Loading content...</p>
            ) : (
                <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-6 border-t bg-muted/30 print:border-t print:bg-transparent print:hidden">
            <p className="text-xs text-muted-foreground">
                Created: {contract.createdAt ? format(parseISO(contract.createdAt as string), 'PPP p') : 'N/A'}
                <br/>
                Last Updated: {contract.updatedAt ? format(parseISO(contract.updatedAt as string), 'PPP p') : 'N/A'}
            </p>
        </CardFooter>
      </Card>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #contract-to-print, #contract-to-print * {
            visibility: visible;
          }
          #contract-to-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
          }
          .print\\:hidden { display: none !important; }
          .print\\:bg-transparent { background-color: transparent !important; }
          .print\\:border-none { border: none !important; }
          .print\\:border-t { border-top-width: 1px !important; }
          .prose { font-size: 10pt !important; } 
          .prose h1 { font-size: 16pt !important; }
          .prose h2 { font-size: 14pt !important; }
          .prose h3 { font-size: 12pt !important; }
          .prose table { width: 100%; border-collapse: collapse; }
          .prose th, .prose td { border: 1px solid #ccc; padding: 0.5em; }
        }
        .prose h1, .prose h2, .prose h3 {
          color: hsl(var(--primary));
        }
        .prose a { color: hsl(var(--accent)); }
        .prose blockquote { border-left-color: hsl(var(--accent)); }
      `}</style>
    </div>
  );
};

export default ViewContractPage;
