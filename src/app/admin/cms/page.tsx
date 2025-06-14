
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Clock, BookOpen, Edit3, Trash2, ImagePlus, Save, XCircle, Images } from 'lucide-react';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost, BlogOperationResult } from '@/app/admin/blog/actions';
import { deleteBlogPostAction } from '@/app/admin/blog/actions';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Added AlertDialogTrigger here
} from "@/components/ui/alert-dialog";
import { getSectionImageAction, updateSectionImageAction, type SectionImageOperationResult } from './actions';

interface ManagedSection {
  id: string;
  name: string;
  description: string;
  currentImageUrl: string | null;
  newImageUrl: string; // For input field
  isLoading: boolean;
  placeholderHint?: string;
}

// Define the sections that appear on the homepage or other key public pages
const initialManagedSections: Omit<ManagedSection, 'currentImageUrl' | 'newImageUrl' | 'isLoading'>[] = [
  { id: 'hero', name: 'Hero Section', description: 'Main banner image on the homepage.', placeholderHint: 'professional virtual assistant' },
  { id: 'onboarding-overview', name: 'Onboarding Overview Section', description: 'Image for the onboarding process summary.', placeholderHint: 'onboarding steps' },
  { id: 'services-intro', name: 'Services Introduction', description: 'Introductory image for the services area.', placeholderHint: 'virtual assistance services' },
  { id: 'tools', name: 'Tools We Master Section', description: 'Visual for the tools showcase.', placeholderHint: 'business tools collage' },
  { id: 'pricing', name: 'Pricing Section Image', description: 'Contextual image for pricing plans.', placeholderHint: 'pricing plans KES' },
  { id: 'testimonials', name: 'Testimonials Section Image', description: 'Background or illustrative image for testimonials.', placeholderHint: 'happy clients' },
  { id: 'blog-intro', name: 'Blog Introduction Image', description: 'Image for the blog preview section on homepage.', placeholderHint: 'blog ideas' },
  { id: 'cta', name: 'Call to Action Section Image', description: 'Visual for the main contact/CTA block.', placeholderHint: 'business collaboration' },
  // Add other AiImageSection ids from your src/app/page.tsx or other relevant pages
];


const CmsPage: FC = () => {
  const { toast } = useToast();
  const { user: firebaseUser } = useAdminAuth();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  const [managedSections, setManagedSections] = useState<ManagedSection[]>(
    initialManagedSections.map(s => ({ ...s, currentImageUrl: null, newImageUrl: '', isLoading: false }))
  );

  const fetchAllSectionImages = useCallback(async () => {
    if (!firebaseUser) return;
    setManagedSections(prev => prev.map(s => ({ ...s, isLoading: true })));
    const updates = await Promise.all(
      initialManagedSections.map(async (section) => {
        const imageInfo = await getSectionImageAction(section.id);
        return {
          ...section,
          currentImageUrl: imageInfo?.imageUrl || null,
          newImageUrl: imageInfo?.imageUrl || '',
          isLoading: false,
        };
      })
    );
    setManagedSections(updates);
  }, [firebaseUser]);

  useEffect(() => {
    fetchAllSectionImages();
  }, [fetchAllSectionImages]);


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


  const handleDeletePostWithConfirmation = async () => {
    if (!postToDelete || !postToDelete.id || !firebaseUser?.uid) {
      toast({ title: 'Error', description: 'Post ID missing or user not authenticated.', variant: 'destructive'});
      setPostToDelete(null);
      return;
    }
    setIsDeletingPost(true);
    const result: BlogOperationResult = await deleteBlogPostAction(postToDelete.id, firebaseUser.uid);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsDeletingPost(false);
    setPostToDelete(null); 
  };

  const handleImageUrlChange = (sectionId: string, value: string) => {
    setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, newImageUrl: value } : s));
  };

  const handleSaveSectionImage = async (sectionId: string) => {
    if (!firebaseUser?.uid) {
      toast({ title: "Authentication Error", description: "Admin not authenticated.", variant: "destructive" });
      return;
    }
    const section = managedSections.find(s => s.id === sectionId);
    if (!section) return;

    setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, isLoading: true } : s));
    
    const result: SectionImageOperationResult = await updateSectionImageAction(sectionId, section.newImageUrl, firebaseUser.uid);
    
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, currentImageUrl: result.imageUrl || null, isLoading: false } : s));
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
      setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, isLoading: false } : s));
    }
  };
  
  const handleClearSectionImage = async (sectionId: string) => {
    if (!firebaseUser?.uid) {
      toast({ title: "Authentication Error", description: "Admin not authenticated.", variant: "destructive" });
      return;
    }
     setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, isLoading: true } : s));
    
    const result: SectionImageOperationResult = await updateSectionImageAction(sectionId, null, firebaseUser.uid);
    
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, currentImageUrl: null, newImageUrl: '', isLoading: false } : s));
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
      setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, isLoading: false } : s));
    }
  };


  return (
    <AlertDialog open={!!postToDelete} onOpenChange={(isOpen) => { if (!isOpen) setPostToDelete(null); }}>
      <div className="flex flex-col gap-8"> {/* Changed to flex-col for main layout */}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Images className="mr-2 h-6 w-6 text-accent" /> Manage Website Section Images</CardTitle>
            <CardDescription>Update images for key sections of your public website by providing image URLs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {managedSections.map((section) => (
              <Card key={section.id} className="p-4 shadow-md">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-lg font-semibold text-primary">{section.name}</CardTitle>
                  <CardDescription className="text-xs">{section.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                    {section.currentImageUrl ? (
                      <Image src={section.currentImageUrl} alt={`Current ${section.name} image`} layout="fill" objectFit="contain" />
                    ) : (
                       <Image src={`https://placehold.co/300x200.png?text=${section.placeholderHint || 'Placeholder'}`} alt="Placeholder" width={300} height={200} className="opacity-50" data-ai-hint={section.placeholderHint || "website section"}/>
                    )}
                     {section.isLoading && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                            <LottieLoader size={32}/>
                        </div>
                    )}
                  </div>
                  <Input
                    placeholder="Paste image URL here (e.g., https://example.com/image.png)"
                    value={section.newImageUrl}
                    onChange={(e) => handleImageUrlChange(section.id, e.target.value)}
                    disabled={section.isLoading || !firebaseUser}
                  />
                  <div className="flex gap-2 justify-end">
                     <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleClearSectionImage(section.id)}
                      disabled={section.isLoading || !firebaseUser || !section.currentImageUrl}
                    >
                      <XCircle className="mr-1 h-4 w-4"/> Clear Image
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleSaveSectionImage(section.id)}
                      disabled={section.isLoading || !firebaseUser || section.newImageUrl === section.currentImageUrl}
                    >
                      <Save className="mr-1 h-4 w-4"/> Save Image
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
        
        <Separator />

        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center"><BookOpen className="mr-2 h-6 w-6 text-accent" /> Blog Content Management</CardTitle>
                <CardDescription>Create, edit, and manage your website's blog posts here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <Button asChild size="lg">
                    <Link href="/admin/blog/create">Create New Blog Post</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                    The AI Image Generation tool has been moved to the <Button variant="link" asChild className="p-0 h-auto"><Link href="/admin/ai-tools">AI Tools page</Link></Button>.
                </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Website Pages Overview</CardTitle>
                    <CardDescription>Manage static pages of your website (Coming Soon).</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Functionality to edit pages like 'Homepage', 'About Us', 'Services' will be available here.</p>
                    <Button disabled className="mt-4">Manage Pages (Coming Soon)</Button>
                </CardContent>
            </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
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
                        <Button variant="outline" size="sm" asChild className="text-accent" disabled={post.status !== 'published'}>
                            <Link href={`/blog/${post.slug}`} target="_blank" title="View Post">
                            <Eye className="mr-1 h-3 w-3" /> View
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/blog/edit/${post.id}`} title="Edit Post">
                            <Edit3 className="mr-1 h-3 w-3" /> Edit
                            </Link>
                        </Button>
                        <AlertDialogTrigger asChild>
                            <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground" 
                            title="Delete Post" 
                            onClick={() => setPostToDelete(post)}
                            disabled={isDeletingPost && postToDelete?.id === post.id}
                            >
                            <Trash2 className="mr-1 h-3 w-3" /> Delete
                            </Button>
                        </AlertDialogTrigger>
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
        
        {postToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the blog post titled &quot;{postToDelete.title}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPostToDelete(null)} disabled={isDeletingPost}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeletePostWithConfirmation} 
                disabled={isDeletingPost} 
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isDeletingPost ? <LottieLoader className="mr-2" size={16} /> : null}
                {isDeletingPost ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </div>
    </AlertDialog>
  );
};

export default CmsPage;
