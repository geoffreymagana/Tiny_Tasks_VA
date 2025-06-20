
import { z } from 'zod';
import { format } from 'date-fns';

export const ContractStatusSchema = z.enum([
  'draft', 
  'pending_signature', 
  'active', 
  'expired', 
  'terminated',
  'template'
]);
export type ContractStatus = z.infer<typeof ContractStatusSchema>;

// Define a basic structure for Tiptap/Novel JSON content
// This can be refined further if more specific validation is needed.
const TiptapNodeSchema = z.object({
  type: z.string(),
  attrs: z.record(z.any()).optional(),
  content: z.array(z.lazy(() => TiptapNodeSchema)).optional(),
  text: z.string().optional(),
  marks: z.array(z.any()).optional(),
});

const TiptapDocumentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(TiptapNodeSchema).optional(),
});


export const ContractSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(150, "Title too long."),
  contractNumber: z.string().min(1, "Contract number is required."),
  
  clientId: z.string().optional().nullable(), 
  clientName: z.string().optional().nullable(), 
  
  // Replaced individual content fields with a single contentJson field
  contentJson: TiptapDocumentSchema.optional().nullable().describe("The main contract content in Tiptap/Novel JSON format."),
  
  effectiveDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid effective date"),
  expirationDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid expiration date").optional().nullable(),
    
  status: ContractStatusSchema,
  isTemplate: z.boolean().default(false),
  templateName: z.string().max(100, "Template name too long.").optional().nullable(),

  adminId: z.string().min(1, "Admin ID is required."),
  createdAt: z.any().optional(), 
  updatedAt: z.any().optional(),
});
export type Contract = z.infer<typeof ContractSchema>;


export const CreateContractFormSchema = ContractSchema.omit({
  id: true,
  contractNumber: true,
  adminId: true,
  createdAt: true,
  updatedAt: true,
  clientName: true, 
}).extend({
  effectiveDate: z.date({ required_error: "Effective date is required."}),
  expirationDate: z.date().optional().nullable(),
  status: z.enum(['draft', 'pending_signature', 'active', 'expired', 'terminated'], { // Status for non-templates
    required_error: "Status is required.",
  }),
  contentJson: TiptapDocumentSchema.optional().nullable().default(null), // Default to null for new contracts
});

export type CreateContractFormValues = z.infer<typeof CreateContractFormSchema>;

export function generateContractNumberSync(): string {
  const prefix = "TTCON";
  const datePart = format(new Date(), "yyyyMMdd");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${datePart}-${randomSuffix}`;
}

export const defaultEditorContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Executive Summary" }],
    },
    { type: "paragraph", content: [{ type: "text", text: "Provide a brief overview of the contract..." }] },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Scope of Services / Description" }],
    },
    { type: "paragraph", content: [{ type: "text", text: "Detailed description of services to be provided..." }] },
     {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Payment Terms" }],
    },
    { type: "paragraph", content: [{ type: "text", text: "e.g., Net 30 days, 50% upfront, specific milestones..." }] },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Terms and Conditions" }],
    },
    { type: "paragraph", content: [{ type: "text", text: "Enter the full terms and conditions of the contract here..." }] },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Additional Clauses" }],
    },
    { type: "paragraph", content: [{ type: "text", text: "Any other specific clauses for this contract..." }] },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Signatory Section" }],
    },
    { type: "paragraph", content: [{ type: "text", text: "Draft the signatory block, e.g., names, titles, date lines..." }] },
  ],
};
