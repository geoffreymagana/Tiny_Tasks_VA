
import { z } from 'zod';
import { format } from 'date-fns';

export const ContractStatusSchema = z.enum([
  'draft', 
  'pending_signature', 
  'active', 
  'expired', 
  'terminated',
  'template' // Added template status
]);
export type ContractStatus = z.infer<typeof ContractStatusSchema>;

export const ContractSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(150, "Title too long."),
  contractNumber: z.string().min(1, "Contract number is required."),
  
  clientId: z.string().optional().nullable(), // Optional for templates
  clientName: z.string().optional().nullable(), // Denormalized, optional for templates
  
  effectiveDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid effective date"),
  expirationDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid expiration date").optional().nullable(),
  
  serviceDescription: z.string().min(10, "Service description is required.").max(5000, "Service description too long."),
  termsAndConditions: z.string().min(50, "Terms and conditions are required.").max(20000, "Terms and conditions too long."),
  paymentTerms: z.string().max(5000, "Payment terms too long.").optional().nullable(),
  
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
  clientName: true, // Will be set based on clientId
}).extend({
  effectiveDate: z.date({ required_error: "Effective date is required."}),
  expirationDate: z.date().optional().nullable(),
  // Override status for form to not include 'template' directly, it's handled by isTemplate
  status: z.enum(['draft', 'pending_signature', 'active', 'expired', 'terminated'], {
    required_error: "Status is required.",
  }),
});

export type CreateContractFormValues = z.infer<typeof CreateContractFormSchema>;

// Helper to generate a contract number (example format)
export function generateContractNumberSync(): string {
  const prefix = "TTCON";
  const datePart = format(new Date(), "yyyyMMdd");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${datePart}-${randomSuffix}`;
}
