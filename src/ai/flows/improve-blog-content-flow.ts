
'use server';
/**
 * @fileOverview An AI flow to improve existing blog post title and content.
 *
 * - improveBlogPostContent - A function that refines blog post content.
 * - ImproveBlogPostContentInput - The input type for the improveBlogPostContent function.
 * - ImproveBlogPostContentOutput - The return type for the improveBlogPostContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveBlogPostContentInputSchema = z.object({
  currentTitle: z.string().describe('The current title of the blog post.'),
  currentContent: z.string().describe('The current content of the blog post in Markdown format.'),
});
export type ImproveBlogPostContentInput = z.infer<typeof ImproveBlogPostContentInputSchema>;

const ImproveBlogPostContentOutputSchema = z.object({
  improvedTitle: z.string().describe('An improved and more engaging title for the blog post.'),
  improvedContent: z.string().describe('The improved and refined content of the blog post in Markdown format.'),
});
export type ImproveBlogPostContentOutput = z.infer<typeof ImproveBlogPostContentOutputSchema>;

export async function improveBlogPostContent(input: ImproveBlogPostContentInput): Promise<ImproveBlogPostContentOutput> {
  return improveBlogPostContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveBlogPostContentPrompt',
  input: {schema: ImproveBlogPostContentInputSchema},
  output: {schema: ImproveBlogPostContentOutputSchema},
  prompt: `You are an expert editor tasked with improving a blog post.
  Review the current title and content, then provide enhanced versions.

  Current Title: {{{currentTitle}}}
  Current Content (Markdown):
  {{{currentContent}}}

  Instructions:
  1.  Generate an 'improvedTitle' that is more compelling, SEO-friendly, and accurately reflects the content.
  2.  Provide 'improvedContent' in Markdown format. Focus on clarity, engagement, grammar, flow, and structure. You can rephrase, expand, or condense sections as needed to enhance quality.

  Please provide the output in the specified JSON format.
  `,
});

const improveBlogPostContentFlow = ai.defineFlow(
  {
    name: 'improveBlogPostContentFlow',
    inputSchema: ImproveBlogPostContentInputSchema,
    outputSchema: ImproveBlogPostContentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
     if (!output) {
      throw new Error('AI did not return an output for blog content improvement.');
    }
    return output;
  }
);
