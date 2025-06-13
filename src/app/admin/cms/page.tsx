
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { generateDescribedImage, type GenerateDescribedImageOutput } from '@/ai/flows/generate-described-image-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { ImageIcon, FileText, Loader2, Eye, Clock, BookOpen } from 'lucide-react';

interface PastBlogPost {
  id: string;
  title: string;
  postedTime: string;
  reads: number;
  slug: string;
}

const pastPostsData: PastBlogPost[] = [
  { id: '1', title: "Maximizing Productivity with a VA", postedTime: "2 days ago", reads: 120, slug: "/blog/maximizing-productivity" },
  { id: '2', title: "Top 10 Tasks to Delegate", postedTime: "5 days ago", reads: 250, slug: "/blog/top-10-tasks" },
  { id: '3', title: "Choosing the Right Virtual Assistant", postedTime: "1 week ago", reads: 95, slug: "/blog/choosing-right-va" },
  { id: '4', title: "AI in Virtual Assistance", postedTime: "2 weeks ago", reads: 310, slug: "/blog/ai-in-va" },
];


const CmsPage: FC = () => {
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

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content Area (Blog Editor / Tools) - Takes up more space */}
      <div className="flex-grow lg:w-2/3 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BookOpen className="mr-2 h-6 w-6 text-accent" /> Blog Content Management</CardTitle>
            <CardDescription>Create, edit, and manage your website's blog posts here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild size="lg">
              <Link href="/admin/blog/create">Create New Blog Post</Link>
            </Button>
            <div className="mt-4 p-4 border rounded-md bg-muted/50">
              <p className="text-muted-foreground">The main blog post editor or a list of posts with edit/delete options will appear here. For now, use the button above to create new posts.</p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ImageIcon className="mr-2 h-6 w-6 text-accent" /> AI Image Generation Tool</CardTitle>
            <CardDescription>Generate images using AI based on a text description for your content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageDescCms">Image Description</Label>
              <Input
                id="imageDescCms"
                placeholder="e.g., A futuristic cityscape at sunset"
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                disabled={isGeneratingImage}
              />
            </div>
            <Button onClick={handleGenerateImage} disabled={isGeneratingImage}>
              {isGeneratingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
      </div>

      {/* Right Sidebar for Past Blogs */}
      <div className="lg:w-1/3 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Past Blog Posts</CardTitle>
            <CardDescription>Quick overview of recently published articles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastPostsData.length > 0 ? (
              pastPostsData.map(post => (
                <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-primary mb-1">{post.title}</h4>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>{post.postedTime}</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="mr-1 h-3 w-3" />
                      <span>{post.reads} reads</span>
                    </div>
                  </div>
                  <Button variant="link" size="sm" asChild className="p-0 h-auto text-accent">
                    <Link href={post.slug}>Read More &rarr;</Link>
                  </Button>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No blog posts published yet.</p>
            )}
             <Button variant="outline" className="w-full mt-4">View All Posts (coming soon)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CmsPage;
