
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { generateDescribedImage, type GenerateDescribedImageOutput } from '@/ai/flows/generate-described-image-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { ImageIcon, Eye, Clock, BookOpen, Edit3, Trash2 } from 'lucide-react';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost } from '@/app/admin/blog/actions';

const CmsPage: FC = () => {
  const { toast } = useToast();
  const [imageDescription, setImageDescription] = useState('');
  const [generatedImage, setGeneratedImage] = useState<GenerateDescribedImageOutput | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useEffect(() => {
    setIsLoadingPosts(true);
    const postsCollection = collection(db, 'blogPosts');
    const q = query(postsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const posts: BlogPost[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate().toISOString() : data.publishedAt,
        } as BlogPost);
      });
      setBlogPosts(posts);
      setIsLoadingPosts(false);
    }, (error) => {
      console.error("Error fetching blog posts:", error);
      toast({ title: "Error", description: "Could not fetch blog posts.", variant: "destructive" });
      setIsLoadingPosts(false);
    });

    return () => unsubscribe();
  }, [toast]);


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
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ImageIcon className="mr-2 h-6 w-6 text-accent" /> AI Image Generation Tool</CardTitle>
            <CardDescription>Generate images using AI based on a text description for your content. (e.g., for blog featured images)</CardDescription>
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
              {isGeneratingImage ? <LottieLoader className="mr-2" size={20} /> : null}
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

      <div className="lg:w-1/3 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Blog Posts Overview</CardTitle>
            <CardDescription>Recently created or updated articles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingPosts ? (
              <div className="flex justify-center items-center h-32">
                <LottieLoader size={48} className="text-primary" />
              </div>
            ) : blogPosts.length > 0 ? (
              blogPosts.slice(0, 5).map(post => ( 
                <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-primary mb-1 truncate" title={post.title}>{post.title}</h4>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>{post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {post.status}
                    </span>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button variant="outline" size="sm" asChild className="text-accent">
                      <Link href={`/blog/${post.slug}`} target="_blank" title="View Post">
                        <Eye className="mr-1 h-3 w-3" /> View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" disabled title="Edit Post (Coming Soon)">
                       <Edit3 className="mr-1 h-3 w-3" /> Edit
                    </Button>
                     <Button variant="outline" size="sm" disabled  className="text-destructive" title="Delete Post (Coming Soon)">
                       <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No blog posts found.</p>
            )}
             <Button variant="outline" className="w-full mt-4" disabled>View All Posts (coming soon)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CmsPage;
