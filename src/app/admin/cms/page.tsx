
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; 
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Clock, BookOpen, Edit3, Trash2, ImagePlus, Save, XCircle, Images, EyeOff } from 'lucide-react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getSectionDataAction, updateSectionDataAction, type SectionData } from './actions';
import { cn } from '@/lib/utils';

interface ManagedSection {
  id: string;
  name: string;
  description: string;
  defaultTitle: string;
  defaultText: string;
  currentImageUrl: string | null;
  newImageUrl: string;
  currentTitle: string | null;
  newTitle: string;
  currentText: string | null;
  newText: string;
  currentIsVisible: boolean;
  newIsVisible: boolean;
  isLoading: boolean;
  placeholderHint?: string;
}

const initialStaticSectionsData: Omit<ManagedSection, 'currentImageUrl' | 'newImageUrl' | 'currentTitle' | 'newTitle' | 'currentText' | 'newText' | 'currentIsVisible' | 'newIsVisible' | 'isLoading'>[] = [
  { id: 'hero', name: 'Hero Section (Homepage)', description: 'Main banner and introduction on the homepage.', defaultTitle: 'Your Dedicated Virtual Assistant for Effortless Productivity', defaultText: "Tiny Tasks provides expert virtual assistance to manage your workload, streamline operations, and free up your time for what matters most. Smart, reliable, and tailored to your needs.", placeholderHint: 'professional virtual assistant', defaultIsVisible: true },
  { id: 'onboarding-overview', name: 'Onboarding Overview (Homepage)', description: 'Introduction to the client onboarding process.', defaultTitle: 'Our Simple Onboarding Process', defaultText: "Getting started with Tiny Tasks is seamless. We'll understand your needs, match you with the perfect virtual assistant, and integrate them into your workflow for immediate impact. Our clear steps ensure you're supported from discovery to ongoing success.", placeholderHint: 'onboarding steps', defaultIsVisible: true },
  { id: 'services-intro', name: 'Services Introduction (Homepage)', description: 'Introductory content for the main services area.', defaultTitle: 'Expert VA Support Tailored For You', defaultText: "Our virtual assistants offer a wide array of services. We match you with skilled VAs ready to tackle your specific business needs and challenges.", placeholderHint: 'virtual assistance services', defaultIsVisible: true },
  { id: 'tools', name: 'Tools We Master Section (Homepage)', description: 'Visual and text for the tools showcase.', defaultTitle: 'Our Versatile Toolkit', defaultText: "We leverage the best tools to deliver exceptional virtual assistance, ensuring seamless collaboration and top-notch results for your projects.", placeholderHint: 'business tools collage', defaultIsVisible: true },
  { id: 'portfolio-intro', name: 'Portfolio Introduction (Homepage)', description: 'Introductory content for the portfolio section.', defaultTitle: 'Our Recent Work & Case Studies', defaultText: "Explore a selection of projects where Tiny Tasks has made a significant impact, delivering quality and driving growth for our clients.", placeholderHint: 'portfolio showcase design', defaultIsVisible: true },
  { id: 'pricing', name: 'Pricing Section Intro (Homepage)', description: 'Contextual content for pricing plans.', defaultTitle: 'Transparent VA Pricing', defaultText: "Our clear pricing plans ensure you find the perfect fit for your business needs.", placeholderHint: 'pricing plans KES', defaultIsVisible: true },
  { id: 'testimonials', name: 'Testimonials Intro (Homepage)', description: 'Background or illustrative content for testimonials.', defaultTitle: 'Client Success Stories', defaultText: "Visually representing client satisfaction through placeholder imagery.", placeholderHint: 'happy clients', defaultIsVisible: true },
  { id: 'blog-intro', name: 'Blog Introduction (Homepage)', description: 'Content for the blog preview section on homepage.', defaultTitle: "Insights & Productivity Tips", defaultText: "Explore our latest articles for expert advice on virtual assistance, business growth, and mastering your workday.", placeholderHint: 'blog ideas', defaultIsVisible: true },
  { id: 'cta', name: 'Call to Action (Homepage)', description: 'Visual and text for the main contact/CTA block.', defaultTitle: "Ready to Delegate, Grow, and Thrive?", defaultText: "Partner with Tiny Tasks and discover the power of expert virtual assistance. Let's discuss your needs and tailor a solution that propels your business forward. Get started today!", placeholderHint: 'business collaboration', defaultIsVisible: true },
  { id: 'about-us-content', name: 'About Us Page Content', description: 'Main content for the About Us page, including banner.', defaultTitle: 'About Tiny Tasks', defaultText: "Founded with a passion for productivity and a commitment to excellence, Tiny Tasks is dedicated to providing top-tier virtual assistant services. Learn more about our mission, values, and the team that makes it all happen.", placeholderHint: 'team collaboration office', defaultIsVisible: true },
];


const convertDbTimestampToISOForCms = (dbTimestamp: any): string | null => {
  if (!dbTimestamp) return null;
  if (dbTimestamp instanceof Timestamp) { return dbTimestamp.toDate().toISOString(); }
  if (dbTimestamp instanceof Date) { return dbTimestamp.toISOString(); }
  if (typeof dbTimestamp === 'object' && dbTimestamp !== null && typeof dbTimestamp.seconds === 'number' && typeof dbTimestamp.nanoseconds === 'number') {
    try { return new Timestamp(dbTimestamp.seconds, dbTimestamp.nanoseconds).toDate().toISOString(); }
    catch (e) { console.warn("Error converting object with sec/ns to Timestamp for CMS:", e, dbTimestamp); return null; }
  }
  if (typeof dbTimestamp === 'object' && dbTimestamp !== null && typeof dbTimestamp.toDate === 'function') {
    try {
      const dateObj = dbTimestamp.toDate();
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) { return dateObj.toISOString(); }
      console.warn("toDate() did not return valid Date for CMS:", dbTimestamp);
      return new Date().toISOString();
    } catch (e) { console.warn("Failed to convert object with toDate method for CMS:", e, dbTimestamp); return null; }
  }
  if (typeof dbTimestamp === 'string') {
    const d = new Date(dbTimestamp);
    if (!isNaN(d.getTime())) { return d.toISOString(); }
    console.warn("Invalid date string for CMS:", dbTimestamp); return null;
  }
  console.warn("Unparseable timestamp for CMS:", dbTimestamp); return null;
};


const CmsPage: FC = () => {
  const { toast } = useToast();
  const { user: firebaseUser } = useAdminAuth();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  const [managedSections, setManagedSections] = useState<ManagedSection[]>(
    initialStaticSectionsData.map(s => ({ 
      ...s, 
      currentImageUrl: null, newImageUrl: '', 
      currentTitle: s.defaultTitle, newTitle: s.defaultTitle,
      currentText: s.defaultText, newText: s.defaultText,
      currentIsVisible: s.defaultIsVisible, newIsVisible: s.defaultIsVisible,
      isLoading: true 
    }))
  );

  const fetchAllSectionData = useCallback(async () => {
    if (!firebaseUser) return;
    
    const initialData = initialStaticSectionsData.map(s => ({
        ...s,
        currentImageUrl: null, newImageUrl: '',
        currentTitle: s.defaultTitle, newTitle: s.defaultTitle,
        currentText: s.defaultText, newText: s.defaultText,
        currentIsVisible: s.defaultIsVisible, newIsVisible: s.defaultIsVisible,
        isLoading: true,
    }));
    setManagedSections(initialData); 

    const updates = await Promise.all(
      initialStaticSectionsData.map(async (staticSection) => {
        const fetchedData: SectionData | null = await getSectionDataAction(staticSection.id);
        return {
          ...staticSection,
          currentImageUrl: fetchedData?.imageUrl ?? null,
          newImageUrl: fetchedData?.imageUrl ?? '',
          currentTitle: fetchedData?.title ?? staticSection.defaultTitle,
          newTitle: fetchedData?.title ?? staticSection.defaultTitle,
          currentText: fetchedData?.text ?? staticSection.defaultText,
          newText: fetchedData?.text ?? staticSection.defaultText,
          currentIsVisible: fetchedData?.isVisible === undefined ? staticSection.defaultIsVisible : fetchedData.isVisible,
          newIsVisible: fetchedData?.isVisible === undefined ? staticSection.defaultIsVisible : fetchedData.isVisible,
          isLoading: false,
        };
      })
    );
    setManagedSections(updates);
  }, [firebaseUser]);


  useEffect(() => {
    fetchAllSectionData();
  }, [fetchAllSectionData]);


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
          title: data.title || '',
          content: data.content || '',
          category: data.category || '',
          excerpt: data.excerpt || '',
          slug: data.slug || '',
          status: data.status || 'draft',
          authorId: data.authorId || '',
          authorName: data.authorName || null,
          createdAt: convertDbTimestampToISOForCms(data.createdAt),
          updatedAt: convertDbTimestampToISOForCms(data.updatedAt),
          publishedAt: data.publishedAt ? convertDbTimestampToISOForCms(data.publishedAt) : null,
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
  const handleTitleChange = (sectionId: string, value: string) => {
    setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, newTitle: value } : s));
  };
  const handleTextChange = (sectionId: string, value: string) => {
    setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, newText: value } : s));
  };
  const handleIsVisibleChange = (sectionId: string, checked: boolean) => {
    setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, newIsVisible: checked } : s));
  };

  const handleSaveSectionData = async (sectionId: string) => {
    if (!firebaseUser?.uid) {
      toast({ title: "Authentication Error", description: "Admin not authenticated.", variant: "destructive" });
      return;
    }
    const section = managedSections.find(s => s.id === sectionId);
    if (!section) return;

    setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, isLoading: true } : s));
    
    const dataToUpdate: { imageUrl?: string | null; title?: string | null; text?: string | null; isVisible?: boolean } = {};
    let changed = false;

    if (section.newImageUrl !== section.currentImageUrl) {
      dataToUpdate.imageUrl = section.newImageUrl.trim() === '' ? null : section.newImageUrl.trim();
      changed = true;
    }
    if (section.newTitle !== section.currentTitle) {
      dataToUpdate.title = section.newTitle.trim() === '' ? null : section.newTitle.trim();
      changed = true;
    }
    if (section.newText !== section.currentText) {
      dataToUpdate.text = section.newText.trim() === '' ? null : section.newText.trim();
      changed = true;
    }
    if (section.newIsVisible !== section.currentIsVisible) {
      dataToUpdate.isVisible = section.newIsVisible;
      changed = true;
    }
    
    if (!changed) {
        toast({ title: "No Changes", description: "No changes detected to save for this section." });
        setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, isLoading: false } : s));
        return;
    }

    const result: SectionOperationResult = await updateSectionDataAction(sectionId, dataToUpdate, firebaseUser.uid);
    
    if (result.success && result.sectionData) {
      toast({ title: "Success", description: result.message });
      setManagedSections(prev => prev.map(s => {
        if (s.id === sectionId) {
          return { 
            ...s, 
            currentImageUrl: result.sectionData!.hasOwnProperty('imageUrl') ? result.sectionData!.imageUrl : s.currentImageUrl,
            newImageUrl: result.sectionData!.hasOwnProperty('imageUrl') ? (result.sectionData!.imageUrl || '') : s.newImageUrl,
            currentTitle: result.sectionData!.hasOwnProperty('title') ? result.sectionData!.title : s.currentTitle,
            newTitle: result.sectionData!.hasOwnProperty('title') ? (result.sectionData!.title || s.defaultTitle) : s.newTitle,
            currentText: result.sectionData!.hasOwnProperty('text') ? result.sectionData!.text : s.currentText,
            newText: result.sectionData!.hasOwnProperty('text') ? (result.sectionData!.text || s.defaultText) : s.newText,
            currentIsVisible: result.sectionData!.hasOwnProperty('isVisible') ? (result.sectionData!.isVisible ?? true) : s.currentIsVisible,
            newIsVisible: result.sectionData!.hasOwnProperty('isVisible') ? (result.sectionData!.isVisible ?? true) : s.newIsVisible,
            isLoading: false 
          };
        }
        return s;
      }));
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
    
    const result: SectionOperationResult = await updateSectionDataAction(sectionId, { imageUrl: null }, firebaseUser.uid);
    
    if (result.success) {
      toast({ title: "Success", description: "Image cleared successfully." });
      setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, currentImageUrl: null, newImageUrl: '', isLoading: false } : s));
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
      setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, isLoading: false } : s));
    }
  };


  return (
    <AlertDialog open={!!postToDelete} onOpenChange={(isOpen) => { if (!isOpen) setPostToDelete(null); }}>
      <div className="flex flex-col gap-8"> 
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Images className="mr-2 h-6 w-6 text-accent" /> Manage Website Section Content</CardTitle>
            <CardDescription>
              Update images (use direct image links like from Unsplash: `https://images.unsplash.com/...` or `https://source.unsplash.com/...`), text, and visibility for key sections.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {managedSections.map((section) => (
              <Card key={section.id} className="p-4 shadow-md">
                <CardHeader className="p-0 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold text-primary">{section.name}</CardTitle>
                      <CardDescription className="text-xs">{section.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                        <Switch
                            id={`isVisible-${section.id}`}
                            checked={section.newIsVisible}
                            onCheckedChange={(checked) => handleIsVisibleChange(section.id, checked)}
                            disabled={section.isLoading || !firebaseUser}
                        />
                        <Label htmlFor={`isVisible-${section.id}`} className="text-sm">
                            {section.newIsVisible ? <Eye className="h-4 w-4 inline mr-1"/> : <EyeOff className="h-4 w-4 inline mr-1"/>}
                            {section.newIsVisible ? "Visible" : "Hidden"}
                        </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                      {section.currentImageUrl ? (
                        <Image 
                          src={section.currentImageUrl} 
                          alt={`Current ${section.name} image`} 
                          fill 
                          style={{ objectFit: 'contain' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={section.id === 'hero'} 
                        />
                      ) : (
                        <Image 
                          src={`https://placehold.co/300x200.png?text=${encodeURIComponent(section.placeholderHint || 'Placeholder')}`} 
                          alt="Placeholder" 
                          width={300} 
                          height={200} 
                          className="opacity-50" 
                          data-ai-hint={section.placeholderHint || "website section"}
                          style={{ objectFit: 'contain' }}
                          priority={section.id === 'hero'}
                        />
                      )}
                      {section.isLoading && (
                          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                              <LottieLoader size={32}/>
                          </div>
                      )}
                    </div>
                    <Label htmlFor={`imageUrl-${section.id}`}>Image URL (direct link: .jpg, .png)</Label>
                    <Input
                      id={`imageUrl-${section.id}`}
                      placeholder="Paste direct image URL (e.g., https://images.unsplash.com/...)"
                      value={section.newImageUrl}
                      onChange={(e) => handleImageUrlChange(section.id, e.target.value)}
                      disabled={section.isLoading || !firebaseUser}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleClearSectionImage(section.id)}
                      disabled={section.isLoading || !firebaseUser || !section.currentImageUrl}
                      className="w-full"
                    >
                      <XCircle className="mr-1 h-4 w-4"/> Clear Image
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`title-${section.id}`}>Section Title</Label>
                      <Input
                        id={`title-${section.id}`}
                        value={section.newTitle}
                        onChange={(e) => handleTitleChange(section.id, e.target.value)}
                        disabled={section.isLoading || !firebaseUser}
                        placeholder="Enter section title"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`text-${section.id}`}>Section Text</Label>
                      <Textarea
                        id={`text-${section.id}`}
                        value={section.newText}
                        onChange={(e) => handleTextChange(section.id, e.target.value)}
                        disabled={section.isLoading || !firebaseUser}
                        placeholder="Enter section text content"
                        rows={section.id === 'hero' ? 5 : 8} 
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-0 pt-4 mt-4 border-t flex justify-end">
                  <Button 
                    size="sm" 
                    onClick={() => handleSaveSectionData(section.id)}
                    disabled={
                        section.isLoading || 
                        !firebaseUser ||
                        (section.newImageUrl === section.currentImageUrl && 
                         section.newTitle === section.currentTitle &&
                         section.newText === section.currentText &&
                         section.newIsVisible === section.currentIsVisible)
                    }
                  >
                    {section.isLoading && <LottieLoader className="mr-1" size={16}/>}
                    <Save className="mr-1 h-4 w-4"/> Save Section
                  </Button>
                </CardFooter>
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Website Pages Overview</CardTitle>
                    <CardDescription>Manage static pages of your website (Coming Soon).</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Functionality to edit pages like 'About Us', 'Services' will be available here.</p>
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
                        <span className={cn(`px-2 py-0.5 rounded-full text-xs font-medium`, post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
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
    
