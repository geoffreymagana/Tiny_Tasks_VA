

"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form'; // Keep this for PortfolioItemForm and BrandLogoForm
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; 
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Clock, BookOpen, Edit3, Trash2, ImagePlus, Save, XCircle, Images, EyeOff, Briefcase, PlusCircle, Building, ShieldAlert, AlignLeft, AlignRight, ImageOff, UploadCloud, AlignCenter, TextCursorInput, Star, MessageSquare } from 'lucide-react';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogClose 
} from '@/components/ui/dialog'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  getSectionDataAction, 
  updateSectionDataAction, 
  type SectionData,
  addPortfolioItemAction,
  getPortfolioItemsAction,
  updatePortfolioItemAction,
  deletePortfolioItemAction,
  type PortfolioItem,
  type PortfolioOperationResult,
  addBrandLogoAction,
  getBrandLogosAction,
  updateBrandLogoAction,
  deleteBrandLogoAction,
  type BrandLogoItem,
  type BrandLogoOperationResult,
  addTestimonialAction,
  getTestimonialsAction,
  updateTestimonialAction,
  deleteTestimonialAction,
  type TestimonialItem,
  type TestimonialOperationResult,
} from './actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CldUploadButton } from 'next-cloudinary';
import type { CldUploadWidgetResults } from 'next-cloudinary';


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
  currentImagePlacement: 'left' | 'right';
  newImagePlacement: 'left' | 'right';
  currentIsImageVisible: boolean;
  newIsImageVisible: boolean;
  currentTextAlign: 'left' | 'center';
  newTextAlign: 'left' | 'center';
  isLoading: boolean;
  placeholderHint?: string;
  defaultIsVisible: boolean;
  defaultImagePlacement: 'left' | 'right';
  defaultIsImageVisible: boolean;
  defaultTextAlign: 'left' | 'center';
}

const initialStaticSectionsData: Omit<ManagedSection, 'currentImageUrl' | 'newImageUrl' | 'currentTitle' | 'newTitle' | 'currentText' | 'newText' | 'currentIsVisible' | 'newIsVisible' | 'currentImagePlacement' | 'newImagePlacement' | 'currentIsImageVisible' | 'newIsImageVisible' | 'currentTextAlign' | 'newTextAlign' | 'isLoading'>[] = [
  { id: 'hero', name: 'Hero Section (Homepage)', description: 'Main banner and introduction on the homepage.', defaultTitle: 'Your Dedicated Virtual Assistant for Effortless Productivity', defaultText: "Tiny Tasks provides expert virtual assistance to manage your workload, streamline operations, and free up your time for what matters most. Smart, reliable, and tailored to your needs.", placeholderHint: 'professional virtual assistant', defaultIsVisible: true, defaultImagePlacement: 'right', defaultIsImageVisible: true, defaultTextAlign: 'left' },
  { id: 'onboarding-overview', name: 'Onboarding Overview (Homepage)', description: 'Introduction to the client onboarding process.', defaultTitle: 'Our Simple Onboarding Process', defaultText: "Getting started with Tiny Tasks is seamless. We'll understand your needs, match you with the perfect virtual assistant, and integrate them into your workflow for immediate impact. Our clear steps ensure you're supported from discovery to ongoing success.", placeholderHint: 'onboarding steps', defaultIsVisible: true, defaultImagePlacement: 'left', defaultIsImageVisible: true, defaultTextAlign: 'left' },
  { id: 'services-intro', name: 'Services Introduction (Homepage)', description: 'Introductory content for the main services area.', defaultTitle: 'Expert VA Support Tailored For You', defaultText: "Our virtual assistants offer a wide array of services. We match you with skilled VAs ready to tackle your specific business needs and challenges.", placeholderHint: 'virtual assistance services', defaultIsVisible: true, defaultImagePlacement: 'right', defaultIsImageVisible: true, defaultTextAlign: 'center' },
  { id: 'tools', name: 'Tools We Master Section (Homepage)', description: 'Visual and text for the tools showcase.', defaultTitle: 'Our Versatile Toolkit', defaultText: "We leverage the best tools to deliver exceptional virtual assistance, ensuring seamless collaboration and top-notch results for your projects.", placeholderHint: 'business tools collage', defaultIsVisible: true, defaultImagePlacement: 'left', defaultIsImageVisible: true, defaultTextAlign: 'center' },
  { id: 'portfolio-intro', name: 'Portfolio Introduction (Homepage)', description: 'Introductory content for the portfolio section.', defaultTitle: 'Our Recent Work & Case Studies', defaultText: "Explore a selection of projects where Tiny Tasks has made a significant impact, delivering quality and driving growth for our clients.", placeholderHint: 'portfolio showcase design', defaultIsVisible: true, defaultImagePlacement: 'right', defaultIsImageVisible: true, defaultTextAlign: 'center' },
  { id: 'brand-marquee-intro', name: 'Brand Marquee Intro (Homepage)', description: "Title/text above the client logo scroll.", defaultTitle: 'Trusted By Leading Businesses', defaultText: "We're proud to have partnered with a diverse range of companies.", placeholderHint: 'brand logos collage', defaultIsVisible: true, defaultImagePlacement: 'left', defaultIsImageVisible: true, defaultTextAlign: 'center' },
  { id: 'pricing', name: 'Pricing Section Intro (Homepage)', description: 'Contextual content for pricing plans.', defaultTitle: 'Transparent VA Pricing', defaultText: "Our clear pricing plans ensure you find the perfect fit for your business needs.", placeholderHint: 'pricing plans KES', defaultIsVisible: true, defaultImagePlacement: 'right', defaultIsImageVisible: true, defaultTextAlign: 'center' },
  { id: 'testimonials', name: 'Testimonials Intro (Homepage)', description: 'Background or illustrative content for testimonials.', defaultTitle: 'Client Success Stories', defaultText: "Visually representing client satisfaction through placeholder imagery.", placeholderHint: 'happy clients', defaultIsVisible: true, defaultImagePlacement: 'left', defaultIsImageVisible: true, defaultTextAlign: 'center' },
  { id: 'blog-intro', name: 'Blog Introduction (Homepage)', description: 'Content for the blog preview section on homepage.', defaultTitle: "Insights & Productivity Tips", defaultText: "Explore our latest articles for expert advice on virtual assistance, business growth, and mastering your workday.", placeholderHint: 'blog ideas', defaultIsVisible: true, defaultImagePlacement: 'right', defaultIsImageVisible: true, defaultTextAlign: 'left' },
  { id: 'cta', name: 'Call to Action (Homepage)', description: 'Visual and text for the main contact/CTA block.', defaultTitle: "Ready to Delegate, Grow, and Thrive?", defaultText: "Partner with Tiny Tasks and discover the power of expert virtual assistance. Let's discuss your needs and tailor a solution that propels your business forward. Get started today!", placeholderHint: 'business collaboration', defaultIsVisible: true, defaultImagePlacement: 'left', defaultIsImageVisible: true, defaultTextAlign: 'left' },
  { id: 'about-us-content', name: 'About Us Page Content', description: 'Main content for the About Us page, including banner.', defaultTitle: 'About Tiny Tasks', defaultText: "Founded with a passion for productivity and a commitment to excellence, Tiny Tasks is dedicated to providing top-tier virtual assistant services. Learn more about our mission, values, and the team that makes it all happen.", placeholderHint: 'team collaboration office', defaultIsVisible: true, defaultImagePlacement: 'right', defaultIsImageVisible: true, defaultTextAlign: 'left' },
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

interface CmsNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  ref: React.RefObject<HTMLDivElement>;
}


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
      currentImagePlacement: s.defaultImagePlacement, newImagePlacement: s.defaultImagePlacement,
      currentIsImageVisible: s.defaultIsImageVisible, newIsImageVisible: s.defaultIsImageVisible,
      currentTextAlign: s.defaultTextAlign, newTextAlign: s.defaultTextAlign,
      isLoading: true 
    }))
  );

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [isPortfolioDialogOpEn, setIsPortfolioDialogOpen] = useState(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioItem | null>(null);
  const [portfolioItemToDelete, setPortfolioItemToDelete] = useState<PortfolioItem | null>(null);
  const [isProcessingPortfolio, setIsProcessingPortfolio] = useState(false);

  const [brandLogos, setBrandLogos] = useState<BrandLogoItem[]>([]);
  const [isLoadingBrandLogos, setIsLoadingBrandLogos] = useState(true);
  const [isBrandLogoDialogOpen, setIsBrandLogoDialogOpen] = useState(false);
  const [editingBrandLogo, setEditingBrandLogo] = useState<BrandLogoItem | null>(null);
  const [brandLogoToDelete, setBrandLogoToDelete] = useState<BrandLogoItem | null>(null);
  const [isProcessingBrandLogo, setIsProcessingBrandLogo] = useState(false);
  
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<TestimonialItem | null>(null);
  const [isProcessingTestimonial, setIsProcessingTestimonial] = useState(false);


  const [activeSection, setActiveSection] = useState('websiteContent');

  const websiteContentRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const brandLogosRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const blogRef = useRef<HTMLDivElement>(null);

  const cmsNavItems: CmsNavItem[] = [
    { id: 'websiteContent', label: 'Section Content', icon: <Images className="mr-2 h-5 w-5" />, ref: websiteContentRef },
    { id: 'portfolio', label: 'Portfolio Items', icon: <Briefcase className="mr-2 h-5 w-5" />, ref: portfolioRef },
    { id: 'brandLogos', label: 'Brand Logos', icon: <Building className="mr-2 h-5 w-5" />, ref: brandLogosRef },
    { id: 'testimonials', label: 'Testimonials', icon: <MessageSquare className="mr-2 h-5 w-5" />, ref: testimonialsRef },
    { id: 'blog', label: 'Blog Management', icon: <BookOpen className="mr-2 h-5 w-5" />, ref: blogRef },
  ];

  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement>, sectionId: string) => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
  };


  const fetchAllSectionData = useCallback(async () => {
    if (!firebaseUser) return;
    
    const initialData = initialStaticSectionsData.map(s => ({
        ...s,
        currentImageUrl: null, newImageUrl: '',
        currentTitle: s.defaultTitle, newTitle: s.defaultTitle,
        currentText: s.defaultText, newText: s.defaultText,
        currentIsVisible: s.defaultIsVisible, newIsVisible: s.defaultIsVisible,
        currentImagePlacement: s.defaultImagePlacement, newImagePlacement: s.defaultImagePlacement,
        currentIsImageVisible: s.defaultIsImageVisible, newIsImageVisible: s.defaultIsImageVisible,
        currentTextAlign: s.defaultTextAlign, newTextAlign: s.defaultTextAlign,
        isLoading: true,
    }));
    setManagedSections(initialData); 

    const updates = await Promise.all(
      initialStaticSectionsData.map(async (staticSection) => {
        const fetchedData: SectionData | null = await getSectionDataAction(staticSection.id);
        const imagePlacement = fetchedData?.imagePlacement ?? staticSection.defaultImagePlacement;
        const isImageVisible = fetchedData?.isImageVisible === undefined ? staticSection.defaultIsImageVisible : fetchedData.isImageVisible;
        const isVisible = fetchedData?.isVisible === undefined ? staticSection.defaultIsVisible : fetchedData.isVisible;
        const textAlign = fetchedData?.textAlign ?? staticSection.defaultTextAlign;
        return {
          ...staticSection,
          currentImageUrl: fetchedData?.imageUrl ?? null,
          newImageUrl: fetchedData?.imageUrl ?? '',
          currentTitle: fetchedData?.title ?? staticSection.defaultTitle,
          newTitle: fetchedData?.title ?? staticSection.defaultTitle,
          currentText: fetchedData?.text ?? staticSection.defaultText,
          newText: fetchedData?.text ?? staticSection.defaultText,
          currentIsVisible: isVisible,
          newIsVisible: isVisible,
          currentImagePlacement: imagePlacement,
          newImagePlacement: imagePlacement,
          currentIsImageVisible: isImageVisible,
          newIsImageVisible: isImageVisible,
          currentTextAlign: textAlign,
          newTextAlign: textAlign,
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

  const fetchPortfolioItems = useCallback(async () => {
    try {
      const items = await getPortfolioItemsAction();
      setPortfolioItems(items);
    } catch (error) {
      console.error("CMS Page: Error fetching portfolio items:", error);
      toast({ title: "Error", description: "Could not fetch portfolio items.", variant: "destructive" });
      setPortfolioItems([]);
    } finally {
       setIsLoadingPortfolio(false);
    }
  }, [toast]);

  useEffect(() => {
    if (firebaseUser) {
      setIsLoadingPortfolio(true);
      fetchPortfolioItems();
    }
  }, [firebaseUser, fetchPortfolioItems]);

  const handlePortfolioSave = async () => {
    setIsPortfolioDialogOpen(false);
    setEditingPortfolioItem(null);
    setIsLoadingPortfolio(true); 
    await fetchPortfolioItems(); 
  };

  const fetchBrandLogos = useCallback(async () => {
    try {
      const logos = await getBrandLogosAction();
      setBrandLogos(logos);
    } catch (error) {
      console.error("CMS Page: Error fetching brand logos:", error);
      toast({ title: "Error", description: "Could not fetch brand logos.", variant: "destructive" });
      setBrandLogos([]);
    } finally {
       setIsLoadingBrandLogos(false);
    }
  }, [toast]);
  
  const fetchTestimonials = useCallback(async () => {
    try {
      const items = await getTestimonialsAction();
      setTestimonials(items);
    } catch (error) {
      console.error("CMS Page: Error fetching testimonials:", error);
      toast({ title: "Error", description: "Could not fetch testimonials.", variant: "destructive" });
      setTestimonials([]);
    } finally {
       setIsLoadingTestimonials(false);
    }
  }, [toast]);

  useEffect(() => {
    if (firebaseUser) {
      setIsLoadingBrandLogos(true);
      fetchBrandLogos();
      setIsLoadingTestimonials(true);
      fetchTestimonials();
    }
  }, [firebaseUser, fetchBrandLogos, fetchTestimonials]);

  const handleBrandLogoSave = async () => {
    setIsBrandLogoDialogOpen(false);
    setEditingBrandLogo(null);
    setIsLoadingBrandLogos(true); 
    await fetchBrandLogos(); 
  };
  
  const handleTestimonialSave = async () => {
    setIsTestimonialDialogOpen(false);
    setEditingTestimonial(null);
    setIsLoadingTestimonials(true);
    await fetchTestimonials();
  };


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

  const handleImageUploadSuccess = (sectionId: string, result: CldUploadWidgetResults) => {
    if (typeof result.info === 'object' && result.info !== null && 'secure_url' in result.info) {
      const url = (result.info as { secure_url: string }).secure_url;
      setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, newImageUrl: url } : s));
      toast({ title: "Image Uploaded", description: "Image ready. Click 'Save Section' to apply." });
    }
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
   const handleImagePlacementChange = (sectionId: string, placement: 'left' | 'right') => {
    setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, newImagePlacement: placement } : s));
  };
  const handleIsImageVisibleChange = (sectionId: string, checked: boolean) => {
    setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, newIsImageVisible: checked } : s));
  };
   const handleTextAlignChange = (sectionId: string, align: 'left' | 'center') => {
    setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, newTextAlign: align } : s));
  };


  const handleSaveSectionData = async (sectionId: string) => {
    if (!firebaseUser?.uid) {
      toast({ title: "Authentication Error", description: "Admin not authenticated.", variant: "destructive" });
      return;
    }
    const section = managedSections.find(s => s.id === sectionId);
    if (!section) return;

    setManagedSections(prev => prev.map(s => s.id === sectionId ? { ...s, isLoading: true } : s));
    
    const dataToUpdate: Partial<SectionData> = {};
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
    if (section.newImagePlacement !== section.currentImagePlacement) {
      dataToUpdate.imagePlacement = section.newImagePlacement;
      changed = true;
    }
    if (section.newIsImageVisible !== section.currentIsImageVisible) {
      dataToUpdate.isImageVisible = section.newIsImageVisible;
      changed = true;
    }
    if (section.newTextAlign !== section.currentTextAlign) {
      dataToUpdate.textAlign = section.newTextAlign;
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
          const updatedSection: ManagedSection = { ...s, isLoading: false };
            if (result.sectionData!.hasOwnProperty('imageUrl')) {
                updatedSection.currentImageUrl = result.sectionData!.imageUrl;
                updatedSection.newImageUrl = result.sectionData!.imageUrl || '';
            }
            if (result.sectionData!.hasOwnProperty('title')) {
                updatedSection.currentTitle = result.sectionData!.title;
                updatedSection.newTitle = result.sectionData!.title || s.defaultTitle;
            }
            if (result.sectionData!.hasOwnProperty('text')) {
                updatedSection.currentText = result.sectionData!.text;
                updatedSection.newText = result.sectionData!.text || s.defaultText;
            }
            if (result.sectionData!.hasOwnProperty('isVisible')) {
                updatedSection.currentIsVisible = result.sectionData!.isVisible ?? s.defaultIsVisible;
                updatedSection.newIsVisible = result.sectionData!.isVisible ?? s.defaultIsVisible;
            }
            if (result.sectionData!.hasOwnProperty('imagePlacement')) {
                updatedSection.currentImagePlacement = result.sectionData!.imagePlacement ?? s.defaultImagePlacement;
                updatedSection.newImagePlacement = result.sectionData!.imagePlacement ?? s.defaultImagePlacement;
            }
             if (result.sectionData!.hasOwnProperty('isImageVisible')) {
                updatedSection.currentIsImageVisible = result.sectionData!.isImageVisible ?? s.defaultIsImageVisible;
                updatedSection.newIsImageVisible = result.sectionData!.isImageVisible ?? s.defaultIsImageVisible;
            }
            if (result.sectionData!.hasOwnProperty('textAlign')) {
                updatedSection.currentTextAlign = result.sectionData!.textAlign ?? s.defaultTextAlign;
                updatedSection.newTextAlign = result.sectionData!.textAlign ?? s.defaultTextAlign;
            }
          return updatedSection;
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

  const handleOpenPortfolioDialog = (item?: PortfolioItem) => {
    setEditingPortfolioItem(item || null);
    setIsPortfolioDialogOpen(true);
  };

  const handleDeletePortfolioItem = async () => {
    if (!portfolioItemToDelete || !firebaseUser?.uid) {
      toast({ title: "Error", variant: "destructive" }); 
      setPortfolioItemToDelete(null);
      return;
    }
    setIsProcessingPortfolio(true);
    const result = await deletePortfolioItemAction(portfolioItemToDelete.id!, firebaseUser.uid);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      await handlePortfolioSave();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setPortfolioItemToDelete(null);
    setIsProcessingPortfolio(false);
  };

  const handleOpenBrandLogoDialog = (logo?: BrandLogoItem) => {
    setEditingBrandLogo(logo || null);
    setIsBrandLogoDialogOpen(true);
  };

  const handleDeleteBrandLogo = async () => {
    if (!brandLogoToDelete || !firebaseUser?.uid) {
      toast({ title: "Error", variant: "destructive" });
      setBrandLogoToDelete(null);
      return;
    }
    setIsProcessingBrandLogo(true);
    const result = await deleteBrandLogoAction(brandLogoToDelete.id!, firebaseUser.uid);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      await handleBrandLogoSave();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setBrandLogoToDelete(null);
    setIsProcessingBrandLogo(false);
  };

  const handleOpenTestimonialDialog = (item?: TestimonialItem) => {
    setEditingTestimonial(item || null);
    setIsTestimonialDialogOpen(true);
  };

  const handleDeleteTestimonial = async () => {
    if (!testimonialToDelete || !firebaseUser?.uid) {
      toast({ title: "Error", variant: "destructive" });
      setTestimonialToDelete(null);
      return;
    }
    setIsProcessingTestimonial(true);
    const result = await deleteTestimonialAction(testimonialToDelete.id!, firebaseUser.uid);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      await handleTestimonialSave();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setTestimonialToDelete(null);
    setIsProcessingTestimonial(false);
  };



  return (
    <AlertDialog 
      open={!!postToDelete || !!portfolioItemToDelete || !!brandLogoToDelete || !!testimonialToDelete} 
      onOpenChange={(isOpen) => { 
        if (!isOpen) {
          setPostToDelete(null); 
          setPortfolioItemToDelete(null);
          setBrandLogoToDelete(null);
          setTestimonialToDelete(null);
        }
      }}
    >
      <TooltipProvider>
      <div className="flex flex-col md:flex-row gap-8 h-full">
        <aside className="md:w-64 lg:w-72 shrink-0">
          <Card className="sticky top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto">
            <CardHeader>
              <CardTitle>CMS Navigation</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <nav className="flex flex-col space-y-1">
                {cmsNavItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? 'secondary' : 'ghost'}
                    className="justify-start text-sm h-auto py-2.5 px-3"
                    onClick={() => scrollToSection(item.ref, item.id)}
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 min-w-0"> 
          <ScrollArea className="h-[calc(100vh-5.5rem)] md:h-[calc(100vh-6rem)]"> 
            <div className="space-y-12 pb-12 md:pr-4">
              <section id="websiteContent" ref={websiteContentRef} className="pt-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center"><Images className="mr-2 h-6 w-6 text-accent" /> Manage Website Section Content</CardTitle>
                    <CardDescription>
                      Update images, text, visibility, and layout for key sections.
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
                             <div className="space-y-2">
                                <Label className="text-sm font-medium">Layout & Visibility</Label>
                                <div className="flex items-center space-x-2">
                                  <Button variant={section.newImagePlacement === 'left' ? 'secondary' : 'outline'} size="sm" onClick={() => handleImagePlacementChange(section.id, 'left')} disabled={section.isLoading}> <AlignLeft className="mr-1 h-4 w-4" /> Img Left </Button>
                                  <Button variant={section.newImagePlacement === 'right' ? 'secondary' : 'outline'} size="sm" onClick={() => handleImagePlacementChange(section.id, 'right')} disabled={section.isLoading}> Img Right <AlignRight className="ml-1 h-4 w-4" /> </Button>
                                  <Switch id={`isImageVisible-${section.id}`} checked={section.newIsImageVisible} onCheckedChange={(checked) => handleIsImageVisibleChange(section.id, checked)} disabled={section.isLoading || !firebaseUser} />
                                  <Label htmlFor={`isImageVisible-${section.id}`}>{section.newIsImageVisible ? <ImagePlus className="h-4 w-4"/> : <ImageOff className="h-4 w-4"/>}</Label>
                                </div>
                             </div>
                             <div className="space-y-2">
                                <Label className="text-sm font-medium">Text Alignment</Label>
                                <div className="flex items-center space-x-2">
                                  <Button variant={section.newTextAlign === 'left' ? 'secondary' : 'outline'} size="sm" onClick={() => handleTextAlignChange(section.id, 'left')} disabled={section.isLoading}> <TextCursorInput className="mr-1 h-4 w-4" /> Align Left </Button>
                                  <Button variant={section.newTextAlign === 'center' ? 'secondary' : 'outline'} size="sm" onClick={() => handleTextAlignChange(section.id, 'center')} disabled={section.isLoading}> <AlignCenter className="mr-1 h-4 w-4" /> Align Center </Button>
                                </div>
                             </div>

                            <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                              <Image 
                                src={section.newImageUrl || `https://placehold.co/300x200.png?text=${encodeURIComponent(section.placeholderHint || 'Placeholder')}`} 
                                alt={`Current ${section.name} image`} 
                                fill
                                style={{ objectFit: 'contain' }}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority={section.id === 'hero'} 
                                key={section.newImageUrl || section.id}
                              />
                              {section.isLoading && (
                                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                                      <LottieLoader size={32}/>
                                  </div>
                              )}
                            </div>
                            <div className="flex space-x-2">
                                <CldUploadButton
                                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
                                    options={{
                                        folder: 'tiny-tasks-cms',
                                        tags: [section.id, 'cms-section'],
                                    }}
                                    onSuccess={(result) => handleImageUploadSuccess(section.id, result)}
                                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                                    disabled={section.isLoading || !firebaseUser}
                                >
                                    <UploadCloud className="mr-1 h-4 w-4"/> Upload Image
                                </CldUploadButton>
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
                                 section.newIsVisible === section.currentIsVisible &&
                                 section.newImagePlacement === section.currentImagePlacement &&
                                 section.newIsImageVisible === section.currentIsImageVisible &&
                                 section.newTextAlign === section.currentTextAlign
                                 )
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
              </section>
              
              <Separator />

              <section id="portfolio" ref={portfolioRef} className="pt-4">
                <Card>
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center"><Briefcase className="mr-2 h-6 w-6 text-accent" /> Manage Portfolio Items</CardTitle>
                      <CardDescription>Add, edit, or remove items from your website's portfolio.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenPortfolioDialog()}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Portfolio Item
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPortfolio ? (
                      <div className="flex justify-center items-center py-10"><LottieLoader size={48} /><p className="ml-2">Loading portfolio...</p></div>
                    ) : portfolioItems.length === 0 ? (
                      <p className="text-center text-muted-foreground py-10">No portfolio items yet. Click "Add Portfolio Item" to start.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/4">Image</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead>Visible</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {portfolioItems.map(item => (
                            <TableRow key={item.id} className={cn(!item.isVisible && "opacity-50")}>
                              <TableCell>
                                <Image src={item.imageUrl || "https://placehold.co/100x75.png"} alt={item.title} width={100} height={75} className="rounded-md object-cover bg-muted" data-ai-hint={item.imageHint || "portfolio project"}/>
                              </TableCell>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>{item.order}</TableCell>
                              <TableCell>{item.isVisible ? <Eye className="h-5 w-5 text-green-500"/> : <EyeOff className="h-5 w-5 text-muted-foreground"/>}</TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="outline" size="icon" onClick={() => handleOpenPortfolioDialog(item)}><Edit3 className="h-4 w-4"/></Button>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon" onClick={() => setPortfolioItemToDelete(item)}><Trash2 className="h-4 w-4"/></Button>
                                </AlertDialogTrigger>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </section>

              <Dialog open={isPortfolioDialogOpEn} onOpenChange={(open) => {
                  if (!open) {
                      setEditingPortfolioItem(null); 
                  }
                  setIsPortfolioDialogOpen(open);
              }}>
                <PortfolioItemForm
                  item={editingPortfolioItem}
                  adminUserId={firebaseUser?.uid || ''}
                  onSave={handlePortfolioSave}
                  onCancel={() => {setIsPortfolioDialogOpen(false); setEditingPortfolioItem(null);}}
                />
              </Dialog>
              
              <Separator />

              <section id="brandLogos" ref={brandLogosRef} className="pt-4">
                <Card>
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center"><Building className="mr-2 h-6 w-6 text-accent" /> Manage Brand Logos</CardTitle>
                      <CardDescription>Add, edit, or remove brand logos for the homepage marquee.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenBrandLogoDialog()}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Brand Logo
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingBrandLogos ? (
                      <div className="flex justify-center items-center py-10"><LottieLoader size={48} /><p className="ml-2">Loading brand logos...</p></div>
                    ) : brandLogos.length === 0 ? (
                      <p className="text-center text-muted-foreground py-10">No brand logos added yet.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/4">Logo</TableHead>
                            <TableHead>Brand Name</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead>Visible</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {brandLogos.map(logo => (
                            <TableRow key={logo.id} className={cn(!logo.isVisible && "opacity-50")}>
                              <TableCell>
                                <Image src={logo.logoUrl || "https://placehold.co/100x50.png?text=Logo"} alt={logo.name} width={100} height={50} className="rounded-md object-contain bg-muted/30 p-1" />
                              </TableCell>
                              <TableCell className="font-medium">{logo.name}</TableCell>
                              <TableCell>{logo.order}</TableCell>
                              <TableCell>{logo.isVisible ? <Eye className="h-5 w-5 text-green-500"/> : <EyeOff className="h-5 w-5 text-muted-foreground"/>}</TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="outline" size="icon" onClick={() => handleOpenBrandLogoDialog(logo)}><Edit3 className="h-4 w-4"/></Button>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon" onClick={() => setBrandLogoToDelete(logo)}><Trash2 className="h-4 w-4"/></Button>
                                </AlertDialogTrigger>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </section>

              <Dialog open={isBrandLogoDialogOpen} onOpenChange={(open) => {
                  if (!open) {
                      setEditingBrandLogo(null); 
                  }
                  setIsBrandLogoDialogOpen(open);
              }}>
                <BrandLogoForm
                  logoItem={editingBrandLogo}
                  adminUserId={firebaseUser?.uid || ''}
                  onSave={handleBrandLogoSave}
                  onCancel={() => {setIsBrandLogoDialogOpen(false); setEditingBrandLogo(null);}}
                />
              </Dialog>

              <Separator />

              <section id="testimonials" ref={testimonialsRef} className="pt-4">
                <Card>
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center"><MessageSquare className="mr-2 h-6 w-6 text-accent" /> Manage Testimonials</CardTitle>
                      <CardDescription>Add, edit, or remove client testimonials.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenTestimonialDialog()}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Testimonial
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTestimonials ? (
                      <div className="flex justify-center items-center py-10"><LottieLoader size={48} /><p className="ml-2">Loading testimonials...</p></div>
                    ) : testimonials.length === 0 ? (
                      <p className="text-center text-muted-foreground py-10">No testimonials yet. Click "Add Testimonial" to start.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Avatar</TableHead>
                            <TableHead>Name & Role</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Visible</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {testimonials.map(item => (
                            <TableRow key={item.id} className={cn(!item.isVisible && "opacity-50")}>
                              <TableCell>
                                <Image src={item.avatarUrl || "https://placehold.co/40x40.png"} alt={item.name} width={40} height={40} className="rounded-full object-cover bg-muted" data-ai-hint={item.avatarHint || "person headshot"}/>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.role}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 mr-1"/> {item.rating}/5
                                </div>
                              </TableCell>
                              <TableCell>{item.isVisible ? <Eye className="h-5 w-5 text-green-500"/> : <EyeOff className="h-5 w-5 text-muted-foreground"/>}</TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="outline" size="icon" onClick={() => handleOpenTestimonialDialog(item)}><Edit3 className="h-4 w-4"/></Button>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon" onClick={() => setTestimonialToDelete(item)}><Trash2 className="h-4 w-4"/></Button>
                                </AlertDialogTrigger>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </section>

              <Dialog open={isTestimonialDialogOpen} onOpenChange={(open) => {
                  if (!open) setEditingTestimonial(null);
                  setIsTestimonialDialogOpen(open);
              }}>
                <TestimonialForm
                  item={editingTestimonial}
                  adminUserId={firebaseUser?.uid || ''}
                  onSave={handleTestimonialSave}
                  onCancel={() => {setIsTestimonialDialogOpen(false); setEditingTestimonial(null);}}
                />
              </Dialog>


              <Separator />

              <section id="blog" ref={blogRef} className="pt-4">
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
                                <div className="flex space-x-1 mt-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" asChild={post.status === 'published'}>
                                                {post.status === 'published' ? (
                                                    <Link href={`/blog/${post.slug}`} target="_blank" aria-label="View Post">
                                                        <Eye className="h-4 w-4 text-accent" />
                                                    </Link>
                                                ) : (
                                                    <span className="cursor-not-allowed">
                                                         <Eye className="h-4 w-4 text-muted-foreground" />
                                                    </span>
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{post.status === 'published' ? "View Post" : "Post not published"}</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/admin/blog/edit/${post.id}`} aria-label="Edit Post">
                                                    <Edit3 className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Edit Post</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => setPostToDelete(post)}
                                                    disabled={isDeletingPost && postToDelete?.id === post.id}
                                                    aria-label="Delete Post"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Delete Post</p></TooltipContent>
                                    </Tooltip>
                                </div>
                            </Card>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No blog posts found.</p>
                        )}
                        <Button variant="outline" className="w-full mt-4" asChild>
                            <Link href="/admin/blog">View All Posts</Link>
                        </Button>
                        </CardContent>
                    </Card>
                    </div>
                </div>
              </section>
              
              <div className="h-20" /> {/* Spacer for bottom scroll */}
            </div>
          </ScrollArea>
        </main>
        
        {postToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <ShieldAlert className="mr-2 h-5 w-5 text-destructive"/> Are you sure you want to delete this post?
              </AlertDialogTitle>
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
        {portfolioItemToDelete && ( 
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-destructive"/>Delete Portfolio Item?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to delete the portfolio item: &quot;{portfolioItemToDelete?.title}&quot;? This action cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPortfolioItemToDelete(null)} disabled={isProcessingPortfolio}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDeletePortfolioItem}
                    disabled={isProcessingPortfolio}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                    {isProcessingPortfolio ? <LottieLoader size={16} className="mr-2"/> : null}
                    {isProcessingPortfolio ? "Deleting..." : "Delete"}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        )}
         {brandLogoToDelete && ( 
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-destructive"/>Delete Brand Logo?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to delete the brand logo: &quot;{brandLogoToDelete?.name}&quot;? This action cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setBrandLogoToDelete(null)} disabled={isProcessingBrandLogo}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDeleteBrandLogo}
                    disabled={isProcessingBrandLogo}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                    {isProcessingBrandLogo ? <LottieLoader size={16} className="mr-2"/> : null}
                    {isProcessingBrandLogo ? "Deleting..." : "Delete"}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        )}
         {testimonialToDelete && ( 
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-destructive"/>Delete Testimonial?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to delete the testimonial from &quot;{testimonialToDelete?.name}&quot;? This action cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setTestimonialToDelete(null)} disabled={isProcessingTestimonial}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDeleteTestimonial}
                    disabled={isProcessingTestimonial}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                    {isProcessingTestimonial ? <LottieLoader size={16} className="mr-2"/> : null}
                    {isProcessingTestimonial ? "Deleting..." : "Delete"}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        )}
      </div>
      </TooltipProvider>
    </AlertDialog>
  );
};

interface PortfolioItemFormProps {
  item: PortfolioItem | null;
  adminUserId: string;
  onSave: () => Promise<void>; 
  onCancel: () => void;
}

const PortfolioItemForm: FC<PortfolioItemFormProps> = ({ item, adminUserId, onSave, onCancel }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultValues = {
    title: item?.title || '',
    description: item?.description || '',
    imageUrl: item?.imageUrl || '',
    imageHint: item?.imageHint || '',
    order: item?.order || 0,
    isVisible: item?.isVisible === undefined ? true : item.isVisible,
  };

  const form = useForm({ defaultValues });

  useEffect(() => { 
    form.reset({
        title: item?.title || '',
        description: item?.description || '',
        imageUrl: item?.imageUrl || '',
        imageHint: item?.imageHint || '',
        order: item?.order || 0,
        isVisible: item?.isVisible === undefined ? true : item.isVisible,
    });
  }, [item, form]);

  const handleUploadSuccess = (result: CldUploadWidgetResults) => {
    if (typeof result.info === 'object' && result.info !== null && 'secure_url' in result.info) {
        form.setValue('imageUrl', (result.info as { secure_url: string }).secure_url, { shouldDirty: true });
        toast({ title: "Image Uploaded", description: "Image URL populated. Click 'Save' to confirm." });
    }
  };


  const handleSubmit = async (data: typeof defaultValues) => {
    if (!adminUserId) {
      toast({ title: 'Authentication Error', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const payload: Omit<PortfolioItem, 'id' | 'createdAt' | 'updatedAt'> = data;
    let result: PortfolioOperationResult;

    if (item?.id) {
      result = await updatePortfolioItemAction(item.id, payload, adminUserId);
    } else {
      result = await addPortfolioItemAction(payload, adminUserId);
    }

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      await onSave(); 
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{item ? 'Edit' : 'Add New'} Portfolio Item</DialogTitle>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <div><Label htmlFor="title">Title</Label><Input id="title" {...form.register('title')} disabled={isSubmitting} /></div>
        <div><Label htmlFor="description">Description</Label><Textarea id="description" {...form.register('description')} disabled={isSubmitting} /></div>
        <div className="space-y-2">
            <Label htmlFor="imageUrl">Image</Label>
            {form.watch('imageUrl') && <Image src={form.watch('imageUrl')} alt="Portfolio preview" width={120} height={90} className="rounded-md object-cover bg-muted"/>}
            <CldUploadButton
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                options={{ folder: 'tiny-tasks-portfolio', tags: ['portfolio'] }}
                onSuccess={handleUploadSuccess}
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                disabled={isSubmitting}
            >
                <UploadCloud className="mr-2 h-4 w-4"/> Upload Image
            </CldUploadButton>
            {/* The hidden input is no longer necessary as RHF handles state */}
        </div>
        <div><Label htmlFor="imageHint">Image AI Hint (1-2 keywords)</Label><Input id="imageHint" {...form.register('imageHint')} disabled={isSubmitting} placeholder="e.g. modern design"/></div>
        <div><Label htmlFor="order">Display Order</Label><Input id="order" type="number" {...form.register('order', { valueAsNumber: true })} disabled={isSubmitting} /></div>
        <div className="flex items-center space-x-2">
          <Switch id="isVisible" checked={form.watch('isVisible')} onCheckedChange={(checked) => form.setValue('isVisible', checked)} disabled={isSubmitting} />
          <Label htmlFor="isVisible">Visible on website</Label>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LottieLoader className="mr-2" size={16}/> : <Save className="mr-2 h-4 w-4"/>}
            {isSubmitting ? (item ? 'Saving...' : 'Adding...') : (item ? 'Save Changes' : 'Add Item')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};


interface BrandLogoFormProps {
  logoItem: BrandLogoItem | null;
  adminUserId: string;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

const BrandLogoForm: FC<BrandLogoFormProps> = ({ logoItem, adminUserId, onSave, onCancel }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultValues = {
    name: logoItem?.name || '',
    logoUrl: logoItem?.logoUrl || '',
    websiteUrl: logoItem?.websiteUrl || '',
    order: logoItem?.order || 0,
    isVisible: logoItem?.isVisible === undefined ? true : logoItem.isVisible,
  };

  const form = useForm({ defaultValues });

  useEffect(() => {
    form.reset({
        name: logoItem?.name || '',
        logoUrl: logoItem?.logoUrl || '',
        websiteUrl: logoItem?.websiteUrl || '',
        order: logoItem?.order || 0,
        isVisible: logoItem?.isVisible === undefined ? true : logoItem.isVisible,
    });
  }, [logoItem, form]);

  const handleUploadSuccess = (result: CldUploadWidgetResults) => {
    if (typeof result.info === 'object' && result.info !== null && 'secure_url' in result.info) {
        form.setValue('logoUrl', (result.info as { secure_url: string }).secure_url, { shouldDirty: true });
        toast({ title: "Image Uploaded", description: "Logo URL populated. Click 'Save' to confirm." });
    }
  };

  const handleSubmit = async (data: typeof defaultValues) => {
    if (!adminUserId) {
      toast({ title: 'Authentication Error', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const payload: Omit<BrandLogoItem, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        websiteUrl: data.websiteUrl || null, // Ensure null if empty string
    };
    let result: BrandLogoOperationResult;

    if (logoItem?.id) {
      result = await updateBrandLogoAction(logoItem.id, payload, adminUserId);
    } else {
      result = await addBrandLogoAction(payload, adminUserId);
    }

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      await onSave();
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{logoItem ? 'Edit' : 'Add New'} Brand Logo</DialogTitle>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <div><Label htmlFor="brandName">Brand Name</Label><Input id="brandName" {...form.register('name')} disabled={isSubmitting} placeholder="e.g. Acme Corp"/></div>
        <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo Image</Label>
            {form.watch('logoUrl') && <Image src={form.watch('logoUrl')} alt="Logo preview" width={100} height={50} className="rounded-md object-contain bg-muted/30 p-1"/>}
            <CldUploadButton
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                options={{ folder: 'tiny-tasks-brand-logos', tags: ['brand-logo'] }}
                onSuccess={handleUploadSuccess}
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                 disabled={isSubmitting}
            >
                <UploadCloud className="mr-2 h-4 w-4"/> Upload Logo
            </CldUploadButton>
        </div>
        <div><Label htmlFor="websiteUrl">Website URL (Optional)</Label><Input id="websiteUrl" {...form.register('websiteUrl')} disabled={isSubmitting} placeholder="https://acme.com"/></div>
        <div><Label htmlFor="brandOrder">Display Order</Label><Input id="brandOrder" type="number" {...form.register('order', { valueAsNumber: true })} disabled={isSubmitting} /></div>
        <div className="flex items-center space-x-2">
          <Switch id="brandIsVisible" checked={form.watch('isVisible')} onCheckedChange={(checked) => form.setValue('isVisible', checked)} disabled={isSubmitting} />
          <Label htmlFor="brandIsVisible">Visible in marquee</Label>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LottieLoader className="mr-2" size={16}/> : <Save className="mr-2 h-4 w-4"/>}
            {isSubmitting ? (logoItem ? 'Saving...' : 'Adding...') : (logoItem ? 'Save Changes' : 'Add Logo')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

interface TestimonialFormProps {
  item: TestimonialItem | null;
  adminUserId: string;
  onSave: () => Promise<void>; 
  onCancel: () => void;
}

const TestimonialForm: FC<TestimonialFormProps> = ({ item, adminUserId, onSave, onCancel }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultValues = {
    name: item?.name || '',
    role: item?.role || '',
    testimonial: item?.testimonial || '',
    avatarUrl: item?.avatarUrl || '',
    avatarHint: item?.avatarHint || 'person headshot',
    rating: item?.rating || 5,
    isVisible: item?.isVisible === undefined ? true : item.isVisible,
  };

  const form = useForm({ defaultValues });

  useEffect(() => { 
    form.reset({
        name: item?.name || '',
        role: item?.role || '',
        testimonial: item?.testimonial || '',
        avatarUrl: item?.avatarUrl || '',
        avatarHint: item?.avatarHint || 'person headshot',
        rating: item?.rating || 5,
        isVisible: item?.isVisible === undefined ? true : item.isVisible,
    });
  }, [item, form]);

  const handleUploadSuccess = (result: CldUploadWidgetResults) => {
    if (typeof result.info === 'object' && result.info !== null && 'secure_url' in result.info) {
        form.setValue('avatarUrl', (result.info as { secure_url: string }).secure_url, { shouldDirty: true });
        toast({ title: "Avatar Uploaded", description: "Image URL populated. Click 'Save' to confirm." });
    }
  };

  const handleSubmit = async (data: typeof defaultValues) => {
    if (!adminUserId) {
      toast({ title: 'Authentication Error', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const payload: Omit<TestimonialItem, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        avatarUrl: data.avatarUrl || null,
    };
    let result: TestimonialOperationResult;

    if (item?.id) {
      result = await updateTestimonialAction(item.id, payload, adminUserId);
    } else {
      result = await addTestimonialAction(payload, adminUserId);
    }

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      await onSave(); 
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{item ? 'Edit' : 'Add New'} Testimonial</DialogTitle>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <div><Label htmlFor="name">Client Name</Label><Input id="name" {...form.register('name')} disabled={isSubmitting} /></div>
        <div><Label htmlFor="role">Client Role/Company</Label><Input id="role" {...form.register('role')} disabled={isSubmitting} placeholder="e.g. CEO, Founder"/></div>
        <div><Label htmlFor="testimonial">Testimonial Text</Label><Textarea id="testimonial" {...form.register('testimonial')} disabled={isSubmitting} /></div>
        <div className="space-y-2">
            <Label>Avatar Image</Label>
            {form.watch('avatarUrl') && <Image src={form.watch('avatarUrl')} alt="Avatar preview" width={60} height={60} className="rounded-full object-cover bg-muted"/>}
            <CldUploadButton
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                options={{ folder: 'tiny-tasks-testimonials', tags: ['testimonial-avatar'] }}
                onSuccess={handleUploadSuccess}
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                disabled={isSubmitting}
            >
                <UploadCloud className="mr-2 h-4 w-4"/> Upload Avatar
            </CldUploadButton>
        </div>
        <div><Label htmlFor="avatarHint">Avatar AI Hint</Label><Input id="avatarHint" {...form.register('avatarHint')} disabled={isSubmitting} placeholder="e.g. person headshot"/></div>
        <div><Label>Rating (1-5)</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={cn("h-6 w-6 cursor-pointer", form.watch('rating') >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/50")}
                  onClick={() => form.setValue('rating', star, { shouldDirty: true })}
                />
              ))}
            </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="isVisible" checked={form.watch('isVisible')} onCheckedChange={(checked) => form.setValue('isVisible', checked)} disabled={isSubmitting} />
          <Label htmlFor="isVisible">Visible on website</Label>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LottieLoader className="mr-2" size={16}/> : <Save className="mr-2 h-4 w-4"/>}
            {isSubmitting ? 'Saving...' : 'Save Testimonial'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};



export default CmsPage;

