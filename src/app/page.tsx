import { generateImageSections, GenerateImageSectionsOutput } from '@/ai/flows/generate-image-sections';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AiImageSection } from '@/components/ui/ai-image-section';
import { ImprovedCopyDisplay } from '@/components/ui/improved-copy-display';
import { FeatureCard } from '@/components/ui/feature-card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Zap, Users2, Rocket, Palette, Brain } from 'lucide-react';
import Link from 'next/link';

interface SectionContent {
  id: string;
  title: string;
  text: string;
  imagePlacement?: 'left' | 'right';
  cta?: { text: string; href: string };
  icon?: React.ReactNode;
}

const sectionsData: SectionContent[] = [
  {
    id: 'hero',
    title: 'Tiny Tasks: Conquer Your Day',
    text: "Effortlessly manage your daily to-dos with Tiny Tasks. Smart, simple, and beautifully designed to keep you focused and elevate your productivity to new heights.",
    imagePlacement: 'right',
    cta: { text: 'Get Started Free', href: '#cta' },
  },
  {
    id: 'how-it-works',
    title: 'Simple Steps to Success',
    text: "1. Create a task with a clear, concise description. \n2. Set a due date and priority to stay organized. \n3. Mark as complete and feel the satisfaction. \nTiny Tasks makes productivity that straightforward and enjoyable.",
    imagePlacement: 'left',
    cta: { text: 'Learn More', href: '#features' }
  },
];

const features = [
  {
    icon: <Zap size={28} />,
    title: "Intuitive Design",
    description: "Navigate effortlessly with our clean, user-friendly interface. Designed for focus and efficiency.",
  },
  {
    icon: <CheckCircle2 size={28} />,
    title: "Smart Organization",
    description: "Prioritize tasks, set deadlines, and categorize your to-dos for ultimate clarity and control.",
  },
  {
    icon: <Users2 size={28} />,
    title: "Collaborate Easily",
    description: "Share tasks and projects with your team, family, or friends. Productivity is better together.",
  },
];

const improvedCopyData = {
  originalTitle: "Why Tiny Tasks?",
  originalText: "Our app helps you organize tasks. It's easy to use and has many features that will make you more productive every day.",
  improvedTitle: "Unlock Peak Productivity",
  improvedText: "Experience seamless task management with an intuitive interface and powerful features designed to streamline your workflow and boost your efficiency beyond expectations.",
  aiTextForImage: "A dynamic illustration showcasing organized sticky notes transforming into a clear, digital task list, symbolizing efficiency and clarity with a touch of creative flair.",
};

const ctaSectionData = {
  title: "Ready to Transform Your Productivity?",
  text: "Join thousands of users simplifying their lives and achieving more with Tiny Tasks. Sign up today for a free trial and experience the difference!",
  aiTextForImage: "An inviting, abstract background with soft violet and dark blue gradients, conveying a sense of innovation and compelling action towards a brighter, more organized future.",
};


export default async function HomePage() {
  const sectionImagePromises = sectionsData.map(section => 
    generateImageSections({ sectionText: section.text })
      .catch(err => { console.error(`Failed to generate image for ${section.id}:`, err); return null; })
  );
  
  const featuresSectionText = features.map(f => `${f.title}: ${f.description}`).join(' ');
  const featuresImagePromise = generateImageSections({ sectionText: `Features overview: ${featuresSectionText}` })
    .catch(err => { console.error(`Failed to generate image for features section:`, err); return null; });

  const improvedCopyImagePromise = generateImageSections({ sectionText: improvedCopyData.aiTextForImage })
    .catch(err => { console.error(`Failed to generate image for improved copy section:`, err); return null; });

  const ctaImagePromise = generateImageSections({ sectionText: ctaSectionData.aiTextForImage })
    .catch(err => { console.error(`Failed to generate image for CTA section:`, err); return null; });

  const [
    heroImage,
    howItWorksImage,
    featuresImage,
    improvedCopyImage,
    ctaImage
  ] = await Promise.all([
    ...sectionImagePromises,
    featuresImagePromise,
    improvedCopyImagePromise,
    ctaImagePromise
  ]);

  const sectionImages: Record<string, GenerateImageSectionsOutput | null> = {
    hero: heroImage,
    'how-it-works': howItWorksImage,
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {sectionsData.map((section) => (
          <AiImageSection
            key={section.id}
            title={section.title}
            text={section.text}
            aiImage={sectionImages[section.id]}
            imagePlacement={section.imagePlacement}
            className={section.id === 'hero' ? 'bg-gradient-to-b from-background to-secondary/30' : ''}
            titleClassName={section.id === 'hero' ? 'text-5xl md:text-6xl lg:text-7xl' : ''}
          >
            {section.cta && (
              <Button asChild size="lg" className="mt-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href={section.cta.href}>
                  {section.cta.text} <Rocket className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </AiImageSection>
        ))}

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-secondary/50">
          <div className="container mx-auto text-center">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
              Features That Shine
            </h2>
            <p className="text-lg text-foreground/80 mb-12 max-w-2xl mx-auto">
              Tiny Tasks is packed with features designed to make your life easier and more productive. Here’s a glimpse of what we offer.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
            {featuresImage && (
               <div className="mt-12 max-w-3xl mx-auto">
                 <AiImageSection
                    title="Visually Unified Experience"
                    text="Our AI helps select imagery that complements our features, ensuring a cohesive and engaging user experience across the platform."
                    aiImage={featuresImage}
                    imagePlacement="right" 
                    className="py-0"
                    titleClassName="text-3xl text-center md:text-left"
                    textClassName="text-center md:text-left"
                 />
               </div>
            )}
          </div>
        </section>
        
        {/* Improved Copy Display Section */}
        <section id="copy-comparison" className="py-16 md:py-24">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                        Crafted with Care: Our Copy Evolution
                    </h2>
                    <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                        We believe in clear, compelling communication. See how we refine our messaging, powered by smart insights and a touch of AI creativity for visuals.
                    </p>
                </div>
                <ImprovedCopyDisplay
                    originalTitle={improvedCopyData.originalTitle}
                    originalText={improvedCopyData.originalText}
                    improvedTitle={improvedCopyData.improvedTitle}
                    improvedText={improvedCopyData.improvedText}
                />
                {improvedCopyImage && (
                    <div className="mt-12 max-w-2xl mx-auto">
                         <AiImageSection
                            title="Visualizing the Message"
                            text="AI helps us find the perfect visual to accompany our carefully crafted words, making the message even more impactful."
                            aiImage={improvedCopyImage}
                            imagePlacement="left"
                            className="py-0"
                            titleClassName="text-3xl text-center md:text-left"
                            textClassName="text-center md:text-left"
                         />
                    </div>
                )}
            </div>
        </section>

        {/* Call to Action Section */}
        <section id="cta" className="bg-gradient-to-r from-primary to-blue-800 text-primary-foreground">
           <AiImageSection
            title={ctaSectionData.title}
            text={ctaSectionData.text}
            aiImage={ctaImage}
            imagePlacement="right"
            className="py-20 md:py-28"
            titleClassName="!text-primary-foreground"
            textClassName="!text-primary-foreground/90"
          >
            <Button asChild size="lg" className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105">
              <Link href="#">
                Start Your Free Trial Today <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </AiImageSection>
        </section>

      </main>
      <Footer />
    </div>
  );
}
