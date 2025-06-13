
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormItem } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Bot, CheckCircle, Wand2 } from 'lucide-react';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { saveBlogPostAction, type SaveBlogPostResult, type SaveBlogPostServerData } from '../actions';
import { generateBlogPost, type GenerateBlogPostInput } from '@/ai/flows/generate-blog-post-flow';
import { improveBlogPostContent, type ImproveBlogPostContentInput } from '@/ai/flows/improve-blog-content-flow';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const blogPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be 150 characters or less"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  category: z.string().min(2, "Category is required").max(50, "Category must be 50 characters or less"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters").max(300, "Excerpt must be 300 characters or less"),
  status: z.enum(['draft', 'published'], { required_error: "Status is required" }),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

const aiGenerateSchema = z.object({
  topic: z.string().min(3, "Topic is required"),
  category: z.string().min(2, "Category is required"),
  keywords: z.string().min(2, "Keywords are required (comma-separated)"),
});
type AiGenerateFormValues = z.infer<typeof aiGenerateSchema>;


const CreateBlogPage: FC = () => {
  const { toast } = useToast();
  const { user: firebaseUser } = useAdminAuth(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);
  const [isImprovingAiContent, setIsImprovingAiContent] = useState(false);
  const [aiDialogGenerateOpen, setAiDialogGenerateOpen] = useState(false);

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: '',
      content: '',
      category: '',
      excerpt: '',
      status: 'draft',
    },
  });

  const aiGenerateForm = useForm<AiGenerateFormValues>({
    resolver: zodResolver(aiGenerateSchema),
    defaultValues: { topic: '', category: '', keywords: '' },
  });

  const handleSavePost: SubmitHandler<BlogPostFormValues> = async (data) => {
    setIsSubmitting(true);

    if (!firebaseUser || !firebaseUser.uid) {
      toast({ title: 'Authentication Error', description: 'User not authenticated. Please log in again.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    const serverActionData: SaveBlogPostServerData = {
      ...data, 
      authorId: firebaseUser.uid,
    };

    const result: SaveBlogPostResult = await saveBlogPostAction(serverActionData);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      form.reset();
      // Optionally redirect: router.push(`/admin/blog/edit/${result.postId}`);
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleGenerateWithAi: SubmitHandler<AiGenerateFormValues> = async (aiData) => {
    setIsGeneratingAiContent(true);
    try {
      const input: GenerateBlogPostInput = {
        topic: aiData.topic,
        category: aiData.category,
        keywords: aiData.keywords.split(',').map(k => k.trim()).filter(k => k),
      };
      const output = await generateBlogPost(input);
      form.setValue('title', output.title);
      form.setValue('content', output.content);
      form.setValue('excerpt', output.excerpt);
      form.setValue('category', aiData.category); 
      toast({ title: 'AI Content Generated', description: 'Blog fields populated.' });
      setAiDialogGenerateOpen(false); 
      aiGenerateForm.reset();
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      toast({ title: 'AI Generation Failed', description: error.message || 'Could not generate content.', variant: 'destructive' });
    }
    setIsGeneratingAiContent(false);
  };

  const handleImproveWithAi = async () => {
    setIsImprovingAiContent(true);
    const currentTitle = form.getValues('title');
    const currentContent = form.getValues('content');

    if (!currentTitle.trim() || !currentContent.trim()) {
      toast({ title: 'Missing Content', description: 'Title and Content are needed to improve.', variant: 'destructive' });
      setIsImprovingAiContent(false);
      return;
    }

    try {
      const input: ImproveBlogPostContentInput = { currentTitle, currentContent };
      const output = await improveBlogPostContent(input);
      form.setValue('title', output.improvedTitle);
      form.setValue('content', output.improvedContent);
      toast({ title: 'AI Content Improved', description: 'Title and Content updated.' });
    } catch (error: any) {
      console.error("AI Improvement Error:", error);
      toast({ title: 'AI Improvement Failed', description: error.message || 'Could not improve content.', variant: 'destructive' });
    }
    setIsImprovingAiContent(false);
  };


  return (
    <TooltipProvider>
      <div>
        <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/cms">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to CMS
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Create New Blog Post</CardTitle>
            <CardDescription>Fill in the details below to publish a new article. Use AI tools to assist you!</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSavePost)} className="space-y-6">
              
              <Dialog open={aiDialogGenerateOpen} onOpenChange={setAiDialogGenerateOpen}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Generate Blog Post with AI</DialogTitle>
                    <DialogDescription>
                      Provide a topic, category, and keywords for the AI to generate a draft.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={aiGenerateForm.handleSubmit(handleGenerateWithAi)} className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="aiTopic">Topic</Label>
                      <Input id="aiTopic" {...aiGenerateForm.register('topic')} placeholder="e.g., The Future of Remote Work" disabled={isGeneratingAiContent} />
                      {aiGenerateForm.formState.errors.topic && <p className="text-sm text-destructive mt-1">{aiGenerateForm.formState.errors.topic.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="aiCategory">Category</Label>
                      <Input id="aiCategory" {...aiGenerateForm.register('category')} placeholder="e.g., Productivity" disabled={isGeneratingAiContent} />
                        {aiGenerateForm.formState.errors.category && <p className="text-sm text-destructive mt-1">{aiGenerateForm.formState.errors.category.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="aiKeywords">Keywords (comma-separated)</Label>
                      <Input id="aiKeywords" {...aiGenerateForm.register('keywords')} placeholder="e.g., virtual assistant, efficiency, tasks" disabled={isGeneratingAiContent} />
                        {aiGenerateForm.formState.errors.keywords && <p className="text-sm text-destructive mt-1">{aiGenerateForm.formState.errors.keywords.message}</p>}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="outline" disabled={isGeneratingAiContent}>Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isGeneratingAiContent}>
                        {isGeneratingAiContent ? <LottieLoader className="mr-2" size={20} /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isGeneratingAiContent ? 'Generating...' : 'Generate Draft'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                <Label htmlFor="blogTitle">Post Title</Label>
                <Input id="blogTitle" placeholder="Enter a catchy title" {...form.register('title')} disabled={isSubmitting} />
                {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="blogCategory">Category</Label>
                <Input id="blogCategory" placeholder="e.g., Productivity, Technology" {...form.register('category')} disabled={isSubmitting} />
                {form.formState.errors.category && <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="blogContent">Content (Markdown supported)</Label>
                <Textarea
                  id="blogContent"
                  placeholder="Write your amazing blog post here..."
                  {...form.register('content')}
                  disabled={isSubmitting}
                  rows={20}
                  className="min-h-[400px] pr-12" 
                />
                {form.formState.errors.content && <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>}
                
                <div className="absolute bottom-5 right-3 flex flex-col space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        disabled={isGeneratingAiContent || isSubmitting} 
                        onClick={() => setAiDialogGenerateOpen(true)}
                      >
                        <Bot className="h-4 w-4" />
                        <span className="sr-only">Generate content with AI</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate with AI</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={handleImproveWithAi} 
                        disabled={isImprovingAiContent || isSubmitting}
                      >
                        {isImprovingAiContent ? <LottieLoader size={16} /> : <Wand2 className="h-4 w-4" />}
                        <span className="sr-only">Improve content with AI</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Improve with AI</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blogExcerpt">Excerpt (Short Summary)</Label>
                <Textarea id="blogExcerpt" placeholder="A brief summary to entice readers..." {...form.register('excerpt')} disabled={isSubmitting} rows={3} />
                {form.formState.errors.excerpt && <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                      disabled={isSubmitting}
                    >
                      <FormItem className="flex items-center space-x-2">
                        <RadioGroupItem value="draft" id="draft" />
                        <Label htmlFor="draft">Draft</Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <RadioGroupItem value="published" id="published" />
                        <Label htmlFor="published">Published</Label>
                      </FormItem>
                    </RadioGroup>
                  )}
                />
                {form.formState.errors.status && <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>}
              </div>
              
              <Button type="submit" disabled={isSubmitting || isGeneratingAiContent || isImprovingAiContent || !firebaseUser} size="lg">
                {isSubmitting ? <LottieLoader className="mr-2" size={20} /> : <CheckCircle className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Saving...' : (form.getValues('status') === 'published' ? 'Publish Post' : 'Save Draft')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default CreateBlogPage;
