
'use server';
/**
 * @fileOverview An AI flow to generate an image based on a description.
 *
 * - generateDescribedImageFlow - A function that generates an image from a text description.
 * - GenerateDescribedImageInput - The input type for the generateDescribedImageFlow function.
 * - GenerateDescribedImageOutput - The return type for the generateDescribedImageFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDescribedImageInputSchema = z.object({
  imageDescription: z.string().describe('A textual description of the image to be generated.'),
});
export type GenerateDescribedImageInput = z.infer<typeof GenerateDescribedImageInputSchema>;

const GenerateDescribedImageOutputSchema = z.object({
  imageDataURI: z
    .string()
    .describe(
      "The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."
    )
    .nullable(),
});
export type GenerateDescribedImageOutput = z.infer<typeof GenerateDescribedImageOutputSchema>;

export async function generateDescribedImage(input: GenerateDescribedImageInput): Promise<GenerateDescribedImageOutput> {
  return generateDescribedImageFlow(input);
}

const generateDescribedImageFlow = ai.defineFlow(
  {
    name: 'generateDescribedImageFlow',
    inputSchema: GenerateDescribedImageInputSchema,
    outputSchema: GenerateDescribedImageOutputSchema,
  },
  async (input) => {
    try {
      const {mediaArr} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // Ensure this exact model for image generation
        prompt: input.imageDescription,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // Must include both TEXT and IMAGE
        },
      });

      if (mediaArr && mediaArr.length > 0 && mediaArr[0].url) {
        return { imageDataURI: mediaArr[0].url };
      }
      console.warn('Image generation did not return a valid media URL for description:', input.imageDescription);
      return { imageDataURI: null };
    } catch (error) {
      console.error('Error generating image in generateDescribedImageFlow:', error);
      return { imageDataURI: null };
    }
  }
);
