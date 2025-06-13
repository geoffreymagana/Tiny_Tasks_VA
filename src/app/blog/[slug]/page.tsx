
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

interface BlogSlugPageProps {
  params: {
    slug: string;
  };
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
    
    const convertTimestamp = (timestamp: any) => {
        if (timestamp instanceof Timestamp) {
          return timestamp.toDate().toISOString();
        }
        return timestamp;
    };

    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      publishedAt: data.publishedAt ? convertTimestamp(data.publishedAt) : null,
    } as BlogPost;

  } catch (error) {
    console.error("Error fetching blog post by slug:", error);
    return null;
  }
}

export default async function BlogSlugPage({ params }: BlogSlugPageProps) {
  const post = await getBlogPostBySlug(params.slug);

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
          
          {/* Add featured image here if you implement it */}
          {/* {post.featuredImageUrl && <Image src={post.featuredImageUrl} alt={post.title} width={800} height={400} className="rounded-lg mb-8 object-cover" />} */}

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

// Optional: Add generateStaticParams if you want to pre-render blog posts at build time
// export async function generateStaticParams() {
//   const postsCollection = collection(db, 'blogPosts');
//   const q = query(postsCollection, where('status', '==', 'published'));
//   const postsSnapshot = await getDocs(q);
//   return postsSnapshot.docs.map(doc => ({
//     slug: doc.data().slug as string,
//   }));
// }
