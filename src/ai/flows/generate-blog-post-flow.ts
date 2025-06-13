
'use server';
/**
 * @fileOverview An AI flow to generate a blog post from a topic, category, and keywords.
 *
 * - generateBlogPost - A function that generates blog post content.
 * - GenerateBlogPostInput - The input type for the generateBlogPost function.
 * - GenerateBlogPostOutput - The return type for the generateBlogPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateBlogPostInputSchema = z.object({
  topic: z.string().describe('The main topic of the blog post.'),
  category: z.string().describe('The category for the blog post.'),
  keywords: z.array(z.string()).describe('A list of keywords to focus on.'),
});
export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;

export const GenerateBlogPostOutputSchema = z.object({
  title: z.string().describe('A compelling title for the blog post.'),
  content: z.string().describe('The full content of the blog post in Markdown format.'),
  excerpt: z.string().describe('A short summary or excerpt of the blog post (around 50-100 words).'),
});
export type GenerateBlogPostOutput = z.infer<typeof GenerateBlogPostOutputSchema>;

export async function generateBlogPost(input: GenerateBlogPostInput): Promise<GenerateBlogPostOutput> {
  return generateBlogPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBlogPostPrompt',
  input: {schema: GenerateBlogPostInputSchema},
  output: {schema: GenerateBlogPostOutputSchema},
  prompt: `You are an expert blog post writer specializing in creating engaging and informative content.
  Your task is to write a blog post based on the provided topic, category, and keywords.

  Topic: {{{topic}}}
  Category: {{{category}}}
  Keywords: {{#each keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Instructions:
  1.  Generate a compelling and SEO-friendly 'title' for the blog post.
  2.  Write well-structured 'content' for the blog post in Markdown format. Ensure it is informative, engaging, and relevant to the topic, category, and keywords. Aim for at least 300-500 words.
  3.  Create a concise 'excerpt' (around 50-100 words) that summarizes the blog post and entices readers.

  Please provide the output in the specified JSON format.
  `,
});

const generateBlogPostFlow = ai.defineFlow(
  {
    name: 'generateBlogPostFlow',
    inputSchema: GenerateBlogPostInputSchema,
    outputSchema: GenerateBlogPostOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI did not return an output for blog post generation.');
    }
    return output;
  }
);
