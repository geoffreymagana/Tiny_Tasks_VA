
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { generateDescribedImage, type GenerateDescribedImageOutput } from '@/ai/flows/generate-described-image-flow';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { Sparkles, Wand2, Palette, FileEdit, AlignLeft, Languages, BarChartBig, Code2, Puzzle, Bot, GitFork, Book, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  isNew?: boolean;
  href?: string;
}

const ToolCard: FC<ToolCardProps> = ({ icon, name, description, isNew, href }) => {
  const CardContentWrapper = href ? Link : 'div';
  return (
    <CardContentWrapper href={href || '#'} className={cn(
      "block p-0", 
      href && "hover:shadow-lg transition-shadow rounded-lg"
    )}>
      <div className="flex items-center space-x-4 p-4 bg-card rounded-lg border h-full">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-muted rounded-md text-primary">
          {icon}
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-primary">
            {name}
            {isNew && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">NEW</span>}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {href && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
      </div>
    </CardContentWrapper>
  );
};

const AiToolsPage: FC = () => {
  const { toast } = useToast();
  const [imageDescription, setImageDescription] = useState('');
  const [generatedImage, setGeneratedImage] = useState<GenerateDescribedImageOutput | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleGenerateImage = async () => {
    if (!imageDescription.trim()) {
      toast({ title: 'Error', description: 'Please enter an image description.', variant: 'destructive' });
      return;
    }
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    try {
      const result = await generateDescribedImage({ imageDescription });
      if (result && result.imageDataURI) {
        setGeneratedImage(result);
        toast({ title: 'Success', description: 'Image generated successfully.' });
      } else {
        toast({ title: 'Image Generation Failed', description: 'Could not generate image. The model might have returned no content or an error occurred.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to generate image.', variant: 'destructive' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const tools = [
    { name: 'AI Image Generation', description: 'Create images from text prompts.', icon: <Palette size={20}/>, isNew: false, href: '#image-generator-tool' },
    { name: 'Content Improver', description: 'Refine and enhance your writing.', icon: <FileEdit size={20}/>, isNew: true },
    { name: 'Text Summarizer', description: 'Get concise summaries of long texts.', icon: <AlignLeft size={20}/> },
    { name: 'Translation Service', description: 'Translate text between languages.', icon: <Languages size={20}/>, isNew: true },
    { name: 'Data Analyzer', description: 'Uncover insights from your data.', icon: <BarChartBig size={20}/> },
    { name: 'Next.js Code Helper', description: 'Snippets & tips for Next.js.', icon: <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12.004 24.002C5.381 24.002 0 18.625 0 12.002S5.381.002 12.004.002C18.623.002 24 5.378 24 12.002s-5.377 12-11.996 12.002zM11.45 7.65H8.695l6.18 8.726h2.71L11.45 7.65zM12.003 0C5.376 0 0 5.376 0 12.003s5.376 12.004 12.003 12.004S24.002 18.625 24.002 12.003C24.002 5.376 18.625 0 12.003 0zm.57 14.293V7.71h-1.137v8.39l3.28-4.662h1.19l-3.333 4.852z"/></svg>, isNew: true },
    { name: 'VS Code Assistant', description: 'Productivity tools for VS Code.', icon: <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M23.15 2.937l-4.687-2.07L1.303 8.103.147 12l1.156 3.897 17.16 7.236 4.687-2.07 1.156-9.112zm-1.938 8.11L19.375 4.4l-3.126 1.39L9.874 12l6.375 6.21 3.125 1.39 1.838-6.643zM2.97 12l5.812-4.39L3.313 4.47l-.344 7.53z"/></svg> },
    { name: 'ChatGPT Prompter', description: 'Craft better prompts for ChatGPT.', icon: <Bot size={20}/> },
    { name: 'Genkit Flow Visualizer', description: 'Visualize and manage Genkit flows.', icon: <GitFork size={20}/> },
    { name: 'GitHub Repo Analyzer', description: 'Get insights on GitHub repositories.', icon: <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.3 24 12 .001 5.67.297 12 .297z"/></svg> },
  ];

  return (
    <div className="space-y-8">
      <Card id="image-generator-tool">
        <CardHeader>
          <CardTitle className="flex items-center"><Wand2 className="mr-2 h-6 w-6 text-accent" /> AI Image Generation Tool</CardTitle>
          <CardDescription>Generate images using AI based on a text description. Useful for blog posts, social media, or creative inspiration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="imageDescAiTools">Image Description</Label>
            <Input
              id="imageDescAiTools"
              placeholder="e.g., A serene beach at sunset with palm trees"
              value={imageDescription}
              onChange={(e) => setImageDescription(e.target.value)}
              disabled={isGeneratingImage}
            />
          </div>
          <Button onClick={handleGenerateImage} disabled={isGeneratingImage}>
            {isGeneratingImage ? <LottieLoader className="mr-2" size={20} /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isGeneratingImage ? 'Generating...' : 'Generate Image'}
          </Button>

          {generatedImage?.imageDataURI && (
            <div className="mt-6 border p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-primary">Generated Image:</h3>
              <Image
                src={generatedImage.imageDataURI}
                alt={imageDescription || 'AI Generated Image'}
                width={500}
                height={350}
                className="rounded-md object-contain border"
              />
              <p className="text-xs text-muted-foreground mt-2 break-all">
                Data URI (first 100 chars): {generatedImage.imageDataURI.substring(0, 100)}...
              </p>
              <Button variant="outline" className="mt-4" onClick={() => navigator.clipboard.writeText(generatedImage.imageDataURI || '')}>
                Copy Data URI
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-secondary/30">
        <CardHeader>
          <CardTitle className="flex items-center"><Puzzle className="mr-2 h-6 w-6 text-accent" />Explore Other AI Tools & Integrations</CardTitle>
          <CardDescription>Discover more tools to enhance your productivity and creativity. Click to learn more (placeholders).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search integrations..." className="pl-10" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map(tool => (
              <ToolCard key={tool.name} {...tool} />
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t">
            <Button variant="outline">
              <Book className="mr-2 h-4 w-4" /> Documentation
            </Button>
            <Button variant="default">
              All Integrations <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiToolsPage;

    