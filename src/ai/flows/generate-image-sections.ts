// Implemented the AI flow to generate image suggestions for landing page sections.
'use server';
/**
 * @fileOverview Image suggestion AI agent for generating visually appealing sections.
 *
 * - generateImageSections - A function to generate image suggestions for landing page sections.
 * - GenerateImageSectionsInput - The input type for the generateImageSections function.
 * - GenerateImageSectionsOutput - The return type for the generateImageSections function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageSectionsInputSchema = z.object({
  sectionText: z.string().describe('The text content of the landing page section.'),
});
export type GenerateImageSectionsInput = z.infer<typeof GenerateImageSectionsInputSchema>;

const GenerateImageSectionsOutputSchema = z.object({
  imageDescription: z
    .string()
    .describe(
      'A description of an image that would be visually appropriate for the given section.'
    ),
  imageType: z
    .string()
    .describe(
      'The type of image that would best enhance the section (illustration, photograph, abstract art, etc.).'
    ),
});
export type GenerateImageSectionsOutput = z.infer<typeof GenerateImageSectionsOutputSchema>;

export async function generateImageSections(input: GenerateImageSectionsInput): Promise<GenerateImageSectionsOutput> {
  return generateImageSectionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImageSectionsPrompt',
  input: {schema: GenerateImageSectionsInputSchema},
  output: {schema: GenerateImageSectionsOutputSchema},
  prompt: `You are an AI assistant designed to enhance landing pages with visually appealing image suggestions.

  Given the text content of a landing page section, your task is to suggest an appropriate image description and type that would make the section more engaging.

  Consider the context of the text and recommend an image that complements the content and enhances the overall user experience.

  Text Content: {{{sectionText}}}
  Given the section text, generate a creative imageDescription along with a fitting imageType (illustration, photograph, abstract art, etc.) to make the page more visually appealing:
  `, // Changed the prompt to request both imageDescription and imageType
});

const generateImageSectionsFlow = ai.defineFlow(
  {
    name: 'generateImageSectionsFlow',
    inputSchema: GenerateImageSectionsInputSchema,
    outputSchema: GenerateImageSectionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
