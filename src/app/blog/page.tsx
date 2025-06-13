
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Library, Rss, CalendarDays, Tag } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost } from '@/app/admin/blog/actions'; // Re-using the interface

async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    const postsCollection = collection(db, 'blogPosts');
    const q = query(postsCollection, where('status', '==', 'published'), orderBy('publishedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamps to serializable dates if necessary
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
    });
  } catch (error) {
    console.error("Error fetching published blog posts:", error);
    return []; // Return empty array on error
  }
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <Library className="h-16 w-16 text-accent mx-auto mb-4" />
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
            Tiny Tasks Blog
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Insights, tips, and best practices for leveraging virtual assistance to grow your business and enhance productivity.
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <div key={post.id} className="bg-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                <h2 className="font-headline text-2xl text-primary mb-2">{post.title}</h2>
                <div className="text-xs text-muted-foreground mb-2 space-x-3">
                  {post.publishedAt && (
                    <span className="inline-flex items-center">
                      <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                      {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  )}
                  {post.category && (
                    <span className="inline-flex items-center">
                      <Tag className="mr-1.5 h-3.5 w-3.5" />
                     {post.category}
                    </span>
                  )}
                </div>
                <p className="text-foreground/80 mb-4 flex-grow">{post.excerpt}</p>
                <Button asChild variant="link" className="text-accent p-0 justify-start mt-auto font-semibold">
                  <Link href={`/blog/${post.slug}`}>Read More &rarr;</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">No blog posts published yet. Check back soon!</p>
          </div>
        )}

        <div className="text-center mt-16">
            <Button variant="outline" disabled>
                <Rss className="mr-2 h-4 w-4" /> Subscribe to Updates (Coming Soon)
            </Button>
        </div>

      </main>
      <Footer />
    </div>
  );
}
