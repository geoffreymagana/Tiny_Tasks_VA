
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Library, Rss } from 'lucide-react';

export default function BlogPage() {
  // Placeholder blog posts
  const posts = [
    { id: 1, title: "Maximizing Productivity with a Virtual Assistant", excerpt: "Discover how a VA can transform your workday and help you achieve more...", date: "October 26, 2023", category: "Productivity", slug: "/blog/maximizing-productivity" },
    { id: 2, title: "Top 10 Tasks to Delegate to Your VA Today", excerpt: "Free up your schedule by offloading these common tasks to your virtual assistant...", date: "October 20, 2023", category: "Delegation", slug: "/blog/top-10-tasks" },
    { id: 3, title: "Choosing the Right Virtual Assistant for Your Business", excerpt: "Not all VAs are created equal. Here's how to find the perfect match for your needs...", date: "October 15, 2023", category: "Hiring", slug: "/blog/choosing-right-va" },
  ];

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <div key={post.id} className="bg-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <h2 className="font-headline text-2xl text-primary mb-2">{post.title}</h2>
              <p className="text-sm text-muted-foreground mb-1">{post.date} - {post.category}</p>
              <p className="text-foreground/80 mb-4 flex-grow">{post.excerpt}</p>
              <Button asChild variant="link" className="text-accent p-0 justify-start mt-auto">
                {/* Link to a non-existent page for now, as full blog post pages are not implemented */}
                <Link href={post.slug}>Read More &rarr;</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
            <p className="text-foreground/70">
                More articles coming soon. Stay tuned!
            </p>
            <Button variant="outline" className="mt-4">
                <Rss className="mr-2 h-4 w-4" /> Subscribe to Updates (Coming Soon)
            </Button>
        </div>

      </main>
      <Footer />
    </div>
  );
}
