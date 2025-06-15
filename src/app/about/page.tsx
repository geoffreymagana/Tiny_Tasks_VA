
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Users, Target, Eye } from 'lucide-react';
import { getSectionDataAction, type SectionData } from '@/app/admin/cms/actions';
import ReactMarkdown from 'react-markdown';

export default async function AboutUsPage() {
  const sectionId = 'about-us-content';
  const aboutContent: SectionData | null = await getSectionDataAction(sectionId);

  const defaultTitle = "About Tiny Tasks";
  const defaultText = "Founded with a passion for productivity and a commitment to excellence, Tiny Tasks is dedicated to providing top-tier virtual assistant services. We empower businesses and entrepreneurs by handling their time-consuming tasks, allowing them to focus on growth and innovation. Our team of skilled virtual assistants is meticulously selected and trained to offer a wide range of services, tailored to meet the unique needs of each client. At Tiny Tasks, we believe in building strong partnerships based on trust, reliability, and exceptional service. Our mission is to make your work life simpler and more productive, one task at a time.";
  const defaultBannerDescription = "A professional and modern visual representing the Tiny Tasks team or company values, suitable for a website banner.";
  const defaultBannerPlaceholderHint = "company office banner";

  const titleToDisplay = aboutContent?.title || defaultTitle;
  const textToDisplay = aboutContent?.text || defaultText;
  const bannerImageUrl = aboutContent?.imageUrl;
  const isVisible = aboutContent?.isVisible === undefined ? true : aboutContent.isVisible;

  if (!isVisible) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto py-12 md:py-20 text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">Content Currently Unavailable</h1>
          <p className="text-lg text-foreground/80 mb-8">The 'About Us' page is currently not visible. Please check back later or contact support.</p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go to Homepage
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow"> 
        
        <section className="relative w-full h-56 md:h-72 lg:h-[400px] bg-secondary/30">
          {bannerImageUrl ? (
            <Image
              src={bannerImageUrl}
              alt={titleToDisplay || defaultBannerDescription}
              fill
              style={{ objectFit: 'cover' }}
              priority
              data-ai-hint={defaultBannerPlaceholderHint} 
            />
          ) : (
            <Image
              src={`https://placehold.co/1600x400.png`} 
              alt={defaultBannerDescription}
              fill
              style={{ objectFit: 'cover' }}
              priority
              data-ai-hint={defaultBannerPlaceholderHint}
            />
          )}
        </section>

        <div className="container mx-auto"> 
          <div className="py-8 md:py-12">
            <div className="mb-8">
              <Button variant="outline" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Link>
              </Button>
            </div>

            <section className="max-w-3xl mx-auto bg-card p-6 md:p-10 rounded-xl shadow-xl mb-16 md:mb-24 relative z-10 -mt-20 md:-mt-28">
               <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-8 text-center">
                {titleToDisplay}
              </h1>
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
                  }}
                >
                  {textToDisplay}
                </ReactMarkdown>
              </div>
            </section>

            <section className="py-16 md:py-20 bg-secondary/10 rounded-xl">
              <div className="container mx-auto"> 
                <div className="grid md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
                  <div className="bg-card p-8 rounded-xl shadow-lg">
                    <Target className="h-12 w-12 text-accent mb-4" />
                    <h2 className="font-headline text-3xl text-primary mb-3">Our Mission</h2>
                    <p className="text-foreground/80">
                      To empower businesses and individuals by providing reliable, efficient, and high-quality virtual assistant services, freeing up their time to focus on what truly matters for their growth and success.
                    </p>
                  </div>
                  <div className="bg-card p-8 rounded-xl shadow-lg">
                    <Eye className="h-12 w-12 text-accent mb-4" />
                    <h2 className="font-headline text-3xl text-primary mb-3">Our Vision</h2>
                    <p className="text-foreground/80">
                      To be the leading virtual assistant service provider, recognized for our commitment to client success, innovation in service delivery, and fostering a supportive environment for our talented VAs.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
