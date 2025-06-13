
"use client";

import { useState, type FC } from 'react';
import { generateDescribedImage, type GenerateDescribedImageOutput } from '@/ai/flows/generate-described-image-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { ImageIcon, FileText, Loader2 } from 'lucide-react';

const AdminDashboardPage: FC = () => {
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
    <div className="space-y-8">
      <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Admin Dashboard</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ImageIcon className="mr-2 h-6 w-6 text-accent" /> AI Image Generation</CardTitle>
          <CardDescription>Generate images using AI based on a text description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="imageDesc">Image Description</Label>
            <Input
              id="imageDesc"
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
              {/* In a real CMS, you'd have options to save this to Firebase Storage and associate with content */}
              <Button variant="outline" className="mt-4" onClick={() => navigator.clipboard.writeText(generatedImage.imageDataURI || '')}>
                Copy Data URI
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="mr-2 h-6 w-6 text-accent" /> Blog Management</CardTitle>
          <CardDescription>Create and manage blog posts for your website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild>
            <Link href="/admin/blog/create">Create New Blog Post</Link>
          </Button>
          <div className="mt-4 p-4 border rounded-md bg-muted/50">
            <p className="text-muted-foreground">Blog post listing will appear here.</p>
            {/* Placeholder for listing blog posts */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
