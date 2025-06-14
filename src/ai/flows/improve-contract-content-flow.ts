
'use server';
/**
 * @fileOverview An AI flow to improve existing contract content.
 *
 * - improveContractContent - A function that refines contract sections.
 * - ImproveContractContentInput - The input type for the function.
 * - ImproveContractContentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveContractContentInputSchema = z.object({
  currentTitle: z.string().describe('The current title of the contract.'),
  currentServiceDescription: z.string().describe('The current service description or scope of work.'),
  currentTermsAndConditions: z.string().describe('The current main terms and conditions of the contract.'),
  currentPaymentTerms: z.string().describe('The current payment terms section.'),
});
export type ImproveContractContentInput = z.infer<typeof ImproveContractContentInputSchema>;

const ImproveContractContentOutputSchema = z.object({
  improvedTitle: z.string().describe('An improved and more professional title for the contract.'),
  improvedServiceDescriptionMarkdown: z.string().describe('The improved service description in Markdown format.'),
  improvedTermsAndConditionsMarkdown: z.string().describe('The improved terms and conditions in Markdown format, with better structure and clarity.'),
  improvedPaymentTermsMarkdown: z.string().describe('The improved payment terms in Markdown format.'),
});
export type ImproveContractContentOutput = z.infer<typeof ImproveContractContentOutputSchema>;

export async function improveContractContent(input: ImproveContractContentInput): Promise<ImproveContractContentOutput> {
  return improveContractContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveContractContentPrompt',
  input: {schema: ImproveContractContentInputSchema},
  output: {schema: ImproveContractContentOutputSchema},
  prompt: `You are an expert legal assistant AI editor.
  Your task is to review and improve the provided contract sections.
  Focus on clarity, conciseness, professional tone, and proper Markdown formatting.
  If the input text is plain, convert it to well-structured Markdown.

  Current Contract Sections:
  - Title: {{{currentTitle}}}
  - Service Description: {{{currentServiceDescription}}}
  - Terms and Conditions: {{{currentTermsAndConditions}}}
  - Payment Terms: {{{currentPaymentTerms}}}

  Instructions:
  1.  Generate an 'improvedTitle' that is clear and professional.
  2.  Provide 'improvedServiceDescriptionMarkdown', enhancing clarity and ensuring Markdown format.
  3.  Revise 'currentTermsAndConditions' into 'improvedTermsAndConditionsMarkdown'. Improve structure, readability, and legal phrasing (general best practices, not specific legal advice). Ensure it is well-formatted Markdown.
  4.  Refine 'currentPaymentTerms' into 'improvedPaymentTermsMarkdown', ensuring clarity and Markdown format.

  Return the output in the specified JSON format.
  `,
});

const improveContractContentFlow = ai.defineFlow(
  {
    name: 'improveContractContentFlow',
    inputSchema: ImproveContractContentInputSchema,
    outputSchema: ImproveContractContentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI did not return an output for contract content improvement.');
    }
    return output;
  }
);
