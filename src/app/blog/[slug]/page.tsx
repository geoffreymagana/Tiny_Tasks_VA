
import { use } from 'react'; // Import React.use
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Tag, UserCircle } from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost } from '@/app/admin/blog/actions';
import ReactMarkdown from 'react-markdown';
import { notFound } from 'next/navigation';

// This interface describes the shape of the params object *after* unwrapping.
interface ResolvedPageParams {
  slug: string;
}

// This interface describes the props object as received by the page component.
interface BlogSlugPageServerProps {
  params: any; 
}

async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const postsCollection = collection(db, 'blogPosts');
    const q = query(postsCollection, where('slug', '==', slug), where('status', '==', 'published'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    // More robust timestamp conversion
    const convertDbTimestampToISO = (dbTimestamp: any): string | null => {
      if (!dbTimestamp) return null;
      
      if (dbTimestamp instanceof Timestamp) { // Firebase v9 Timestamp
        return dbTimestamp.toDate().toISOString();
      }
      if (dbTimestamp instanceof Date) { // Plain JS Date
        return dbTimestamp.toISOString();
      }
      // Handle cases where timestamp might be an object with seconds/nanoseconds (e.g. after JSON stringify/parse)
      if (typeof dbTimestamp === 'object' && dbTimestamp !== null && 
          typeof dbTimestamp.seconds === 'number' && typeof dbTimestamp.nanoseconds === 'number') {
        try {
            return new Timestamp(dbTimestamp.seconds, dbTimestamp.nanoseconds).toDate().toISOString();
        } catch(e) {
            console.warn("Error converting object with sec/ns to Timestamp:", e, dbTimestamp);
            return null;
        }
      }
      // Handle Firestore ServerTimestamp placeholder or other objects with toDate()
      if (typeof dbTimestamp === 'object' && dbTimestamp !== null && typeof dbTimestamp.toDate === 'function') {
        try {
            return dbTimestamp.toDate().toISOString();
        } catch (e) {
            console.warn("Failed to convert object with toDate method:", e, dbTimestamp);
            // Fallback for uncommitted server timestamps or problematic objects
            return null; 
        }
      }
      // If it's already a string, try to parse it to ensure it's valid, then re-stringify to ISO
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

    // Ensure all fields from BlogPost interface are mapped, even if some are from data directly.
    const postData: BlogPost = {
      id: doc.id,
      title: data.title,
      content: data.content,
      category: data.category,
      excerpt: data.excerpt,
      slug: data.slug,
      status: data.status,
      authorId: data.authorId,
      authorName: data.authorName,
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

export default async function BlogSlugPage({ params: incomingParams }: BlogSlugPageServerProps) {
  const resolvedParams: ResolvedPageParams = use(incomingParams);
  const slug = resolvedParams.slug;

  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto py-12 md:py-16">
        <div className="mb-8">
          <Button variant="outline" asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Link>
          </Button>
        </div>

        <article className="max-w-3xl mx-auto bg-card p-6 md:p-10 rounded-xl shadow-xl">
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
      </main>
      <Footer />
    </div>
  );
}
