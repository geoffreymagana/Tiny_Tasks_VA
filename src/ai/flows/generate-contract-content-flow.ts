
'use server';
/**
 * @fileOverview An AI flow to generate contract content based on provided details.
 *
 * - generateContractContent - A function that generates draft contract sections.
 * - GenerateContractContentInput - The input type for the function.
 * - GenerateContractContentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateContractContentInputSchema = z.object({
  contractType: z.string().describe('The type of contract (e.g., Service Agreement, NDA, Consulting Agreement).'),
  clientInfo: z.string().describe('A brief summary of the client (e.g., "Client Name: Acme Corp, a tech startup").'),
  serviceSummary: z.string().describe('A concise summary of the services or scope of the agreement.'),
  paymentDetails: z.string().describe('Key payment terms or summary (e.g., "KES 50,000 total, 50% upfront").'),
  keyClauses: z.array(z.string()).optional().describe('Optional list of specific key clauses to emphasize or include (e.g., "Confidentiality", "Intellectual Property").'),
  desiredTone: z.string().optional().describe('The desired tone for the contract (e.g., "Formal", "Standard Legal", "Simple"). Default is "Standard Legal".'),
});
export type GenerateContractContentInput = z.infer<typeof GenerateContractContentInputSchema>;

const GenerateContractContentOutputSchema = z.object({
  suggestedTitle: z.string().describe('A suggested title for the contract based on the inputs.'),
  serviceDescriptionMarkdown: z.string().describe('A detailed service description or scope of work in Markdown format.'),
  termsAndConditionsMarkdown: z.string().describe('A comprehensive draft of the terms and conditions in Markdown format. This should be the main body of the contract.'),
  paymentTermsMarkdown: z.string().describe('A detailed breakdown of payment terms in Markdown format.'),
});
export type GenerateContractContentOutput = z.infer<typeof GenerateContractContentOutputSchema>;

export async function generateContractContent(input: GenerateContractContentInput): Promise<GenerateContractContentOutput> {
  return generateContractContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContractContentPrompt',
  input: {schema: GenerateContractContentInputSchema},
  output: {schema: GenerateContractContentOutputSchema},
  prompt: `You are an expert legal assistant AI specialized in drafting business contracts.
  Your task is to generate a draft contract based on the provided details.
  The output must be in Markdown format for all content sections.

  Contract Details:
  - Type: {{{contractType}}}
  - Client Information: {{{clientInfo}}}
  - Service/Scope Summary: {{{serviceSummary}}}
  - Payment Details: {{{paymentDetails}}}
  {{#if keyClauses}}
  - Key Clauses to Emphasize: {{#each keyClauses}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/if}}
  - Desired Tone: {{{desiredTone_or_default 'Standard Legal'}}}


  Instructions:
  1.  Generate a 'suggestedTitle' for the contract.
  2.  Develop a 'serviceDescriptionMarkdown' section, expanding on the service summary.
  3.  Create a comprehensive 'termsAndConditionsMarkdown' section. This is the main body. Include standard clauses relevant to the contract type and inputs. If key clauses are specified, ensure they are well-integrated.
  4.  Formulate a 'paymentTermsMarkdown' section based on the payment details provided.
  5.  Ensure all Markdown content is well-structured, clear, and professionally worded according to the desired tone.

  Return the output in the specified JSON format.
  `,
});

// Helper to provide default value for optional prompt parameters
Handlebars.registerHelper('desiredTone_or_default', function (value: string, defaultValue: string) {
  return value || defaultValue;
});


const generateContractContentFlow = ai.defineFlow(
  {
    name: 'generateContractContentFlow',
    inputSchema: GenerateContractContentInputSchema,
    outputSchema: GenerateContractContentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI did not return an output for contract content generation.');
    }
    return output;
  }
);

// Hack for Handlebars not being available in the global scope for the AI prompt block
// This is a common workaround for using Handlebars helpers within Genkit prompts
// if they are not automatically picked up.
declare var Handlebars: any;
if (typeof Handlebars === 'undefined' && typeof require !== 'undefined') {
  try {
    Handlebars = require('handlebars');
  } catch (e) {
    // Handlebars not available
  }
}
if (typeof Handlebars !== 'undefined' && Handlebars.registerHelper) {
    Handlebars.registerHelper('desiredTone_or_default', function (value: string, defaultValue: string) {
        return value || defaultValue;
    });
}
