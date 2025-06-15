
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CalendarDays, Tag, UserCircle } from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost } from '@/app/admin/blog/actions';
import { getSectionDataAction, type SectionData } from '@/app/admin/cms/actions';
import ReactMarkdown from 'react-markdown';
import { notFound } from 'next/navigation';

interface BlogSlugPageProps {
  params: { slug: string };
}

const convertDbTimestampToISO = (dbTimestamp: any): string | null => {
  if (!dbTimestamp) return null;
  if (dbTimestamp instanceof Timestamp) {
    return dbTimestamp.toDate().toISOString();
  }
  if (dbTimestamp instanceof Date) {
    return dbTimestamp.toISOString();
  }
  if (typeof dbTimestamp === 'object' && dbTimestamp !== null && 
      typeof dbTimestamp.seconds === 'number' && typeof dbTimestamp.nanoseconds === 'number') {
    try {
        return new Timestamp(dbTimestamp.seconds, dbTimestamp.nanoseconds).toDate().toISOString();
    } catch(e) {
        console.warn("Error converting object with sec/ns to Timestamp:", e, dbTimestamp);
        return null;
    }
  }
  if (typeof dbTimestamp === 'object' && dbTimestamp !== null && typeof dbTimestamp.toDate === 'function') {
    try {
        const dateObj = dbTimestamp.toDate();
        if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
             return dateObj.toISOString();
        }
        console.warn("toDate() did not return a valid Date. It might be an uncommitted ServerTimestamp:", dbTimestamp);
        return new Date().toISOString(); 
    } catch (e) {
        console.warn("Failed to convert object with toDate method:", e, dbTimestamp);
        return null; 
    }
  }
  if (typeof dbTimestamp === 'string') {
    const d = new Date(dbTimestamp);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
    console.warn("Invalid date string encountered in getBlogPostBySlug:", dbTimestamp);
    return null; 
  }
  console.warn("Unparseable timestamp format encountered in getBlogPostBySlug:", dbTimestamp);
  return null; 
};


async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const postsCollection = collection(db, 'blogPosts');
    const q = query(postsCollection, where('slug', '==', slug), where('status', '==', 'published'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    
    const postData: BlogPost = {
      id: docSnap.id,
      title: data.title || '',
      content: data.content || '',
      category: data.category || '',
      excerpt: data.excerpt || '',
      slug: data.slug || '',
      status: data.status || 'draft', 
      authorId: data.authorId || '',
      authorName: data.authorName || null,
      createdAt: convertDbTimestampToISO(data.createdAt),
      updatedAt: convertDbTimestampToISO(data.updatedAt),
      publishedAt: data.publishedAt ? convertDbTimestampToISO(data.publishedAt) : null,
    };
    return postData;

  } catch (error) {
    console.error("Error fetching blog post by slug:", error);
    return null;
  }
}

export default async function BlogSlugPage({ params }: BlogSlugPageProps) {
  const slug = params.slug;
  const post = await getBlogPostBySlug(slug);

  // Fetch general banner image (e.g., from 'about-us-content' or a dedicated 'blog-banner' section)
  const bannerContent: SectionData | null = await getSectionDataAction('about-us-content'); 
  const bannerImageUrl = bannerContent?.imageUrl;
  const defaultBannerDescription = "Tiny Tasks Blog Banner";
  const defaultBannerPlaceholderHint = "blog article banner";


  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="relative w-full h-56 md:h-72 lg:h-[350px] bg-secondary/30">
          {bannerImageUrl ? (
            <Image
              src={bannerImageUrl}
              alt={defaultBannerDescription}
              fill
              style={{ objectFit: 'cover' }}
              priority
              data-ai-hint={defaultBannerPlaceholderHint} 
            />
          ) : (
            <Image
              src={`https://placehold.co/1600x350.png`} 
              alt={defaultBannerDescription}
              fill
              style={{ objectFit: 'cover' }}
              priority
              data-ai-hint={defaultBannerPlaceholderHint}
            />
          )}
        </section>

        <div className="container mx-auto">
            <div className="mb-8 mt-8 md:mt-0"> {/* Adjust mt for non-overlap or keep for overlap */}
            <Button variant="outline" asChild>
                <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
                </Link>
            </Button>
            </div>

            <article className="max-w-3xl mx-auto bg-card p-6 md:p-10 rounded-xl shadow-xl relative z-10 -mt-16 md:-mt-24 mb-12">
            <header className="mb-8">
                <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
                {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {post.publishedAt && (
                    <span className="inline-flex items-center">
                    <CalendarDays className="mr-1.5 h-4 w-4" />
                    Published on {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                )}
                {post.category && (
                    <span className="inline-flex items-center">
                    <Tag className="mr-1.5 h-4 w-4" />
                    {post.category}
                    </span>
                )}
                {post.authorName && (
                    <span className="inline-flex items-center">
                    <UserCircle className="mr-1.5 h-4 w-4" />
                    By {post.authorName}
                    </span>
                )}
                </div>
            </header>
            
            <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90">
                <ReactMarkdown
                components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold my-4 text-primary" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold my-4 text-primary" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold my-3 text-primary" {...props} />,
                    p: ({node, ...props}) => <p className="my-4 leading-relaxed" {...props} />,
                    a: ({node, ...props}) => <a className="text-accent hover:underline" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 my-4 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-4 space-y-1" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-accent pl-4 italic my-4 text-muted-foreground" {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                            <pre className="bg-muted/50 p-4 rounded-md overflow-x-auto my-4"><code className={`language-${match[1]}`} {...props}>{children}</code></pre>
                        ) : (
                            <code className="bg-muted/50 px-1 py-0.5 rounded-sm font-code text-sm" {...props}>{children}</code>
                        )
                    }
                }}
                >
                {post.content}
                </ReactMarkdown>
            </div>
            </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const postsCollection = collection(db, 'blogPosts');
    const q = query(postsCollection, where('status', '==', 'published'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      slug: doc.data().slug,
    }));
  } catch (error) {
    console.error("Error fetching slugs for generateStaticParams:", error);
    return [];
  }
}
