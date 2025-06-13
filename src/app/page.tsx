
import { generateImageSections, GenerateImageSectionsOutput } from '@/ai/flows/generate-image-sections';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AiImageSection } from '@/components/ui/ai-image-section';
import { ImprovedCopyDisplay } from '@/components/ui/improved-copy-display';
import { FeatureCard } from '@/components/ui/feature-card';
import { ServiceCard } from '@/components/ui/service-card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, Zap, Users2, Rocket, Palette, Brain,
  Briefcase, Database, Mail, Settings, Plane, Heart, BookOpenCheck,
  Share2, BarChartBig, PenSquare, MessageCircle, Megaphone,
  Image as ImageIcon, MonitorPlay, Presentation, LayoutGrid, Laptop, Wrench, PackageCheck, Settings2, FileText, Globe, CheckSquare, MessageSquare, BarChart2, MonitorSmartphone
} from 'lucide-react';
import Link from 'next/link';

interface SectionContent {
  id: string;
  title: string;
  text: string;
  imagePlacement?: 'left' | 'right';
  cta?: { text: string; href: string };
  icon?: React.ReactNode;
  aiTextForImage?: string;
}

const sectionsData: SectionContent[] = [
  {
    id: 'hero',
    title: 'Your Dedicated Virtual Assistant for Effortless Productivity',
    text: "Tiny Tasks provides expert virtual assistance to manage your workload, streamline operations, and free up your time for what matters most. Smart, reliable, and tailored to your needs.",
    imagePlacement: 'right',
    cta: { text: 'Get Started', href: '#cta' },
  },
  {
    id: 'onboarding-overview',
    title: 'Our Simple Onboarding Process',
    text: "Getting started with Tiny Tasks is seamless. We'll understand your needs, match you with the perfect assistant, and integrate them into your workflow for immediate impact. Our clear steps ensure you're supported from discovery to ongoing success.",
    imagePlacement: 'left',
    cta: { text: 'View Detailed Steps', href: '/onboarding-steps' }
  },
];

const services = [
  {
    mainIcon: <CheckSquare size={32} />,
    title: "Executive Assistance",
    description: "Professional administrative support to keep your business running smoothly.",
    serviceItems: [
      { icon: <Briefcase size={18}/>, text: "Executive Support" },
      { icon: <Database size={18}/>, text: "Data Entry & Processing" },
      { icon: <Mail size={18}/>, text: "Email & Calendar Management" },
      { icon: <Settings size={18}/>, text: "Project Management" },
      { icon: <Plane size={18}/>, text: "Travel Booking" },
      { icon: <Users2 size={18}/>, text: "HR & Customer Support" },
      { icon: <Heart size={18}/>, text: "Personal Assistance" },
      { icon: <BookOpenCheck size={18}/>, text: "Bookkeeping" },
    ],
  },
  {
    mainIcon: <Share2 size={32} />,
    title: "Social Media Management",
    description: "Strategic social media management to grow your online presence and engagement.",
    serviceItems: [
      { icon: <BarChartBig size={18}/>, text: "Social Media Strategy" },
      { icon: <Share2 size={18}/>, text: "Social Media Management" },
      { icon: <PenSquare size={18}/>, text: "Blog & Copywriting" },
      { icon: <Mail size={18}/>, text: "Email Newsletters" },
      { icon: <MessageCircle size={18}/>, text: "Online Engagement" },
      { icon: <Megaphone size={18}/>, text: "Online Advertising" },
    ],
  },
  {
    mainIcon: <Palette size={32} />,
    title: "Graphic Design",
    description: "Creative design solutions to enhance your brand and marketing materials.",
    serviceItems: [
      { icon: <ImageIcon size={18}/>, text: "Custom Branded Graphics" },
      { icon: <MonitorPlay size={18}/>, text: "Social Media & Web Images" },
      { icon: <Presentation size={18}/>, text: "Promotional Materials" },
      { icon: <LayoutGrid size={18}/>, text: "UX/UI Design" },
      { icon: <Laptop size={18}/>, text: "Custom Website Design" },
      { icon: <Wrench size={18}/>, text: "Website Maintenance" },
    ],
  },
];

const features = [
  {
    icon: <Zap size={28} />,
    title: "Streamlined Processes",
    description: "Efficient workflows and clear communication channels ensure your tasks are handled smoothly.",
  },
  {
    icon: <PackageCheck size={28} />, // Changed from CheckCircle2 for variety
    title: "Expert Task Management",
    description: "Our VAs are skilled in organizing, prioritizing, and executing tasks to meet your deadlines.",
  },
  {
    icon: <Users2 size={28} />,
    title: "Dedicated Assistant Partnership",
    description: "Build a strong, collaborative relationship with a VA committed to your success.",
  },
];

const improvedCopyData = {
  originalTitle: "Why Choose Our VA Service?",
  originalText: "Our virtual assistants help you manage your business tasks. They are efficient and offer many ways to support your daily operations and growth.",
  improvedTitle: "Elevate Your Business with Expert VA Support",
  improvedText: "Experience transformative productivity with Tiny Tasks. Our dedicated virtual assistants provide comprehensive support, from critical administrative tasks to strategic project execution, empowering you to achieve your goals with unparalleled efficiency and focus.",
  aiTextForImage: "A dynamic illustration showcasing a business professional effortlessly juggling multiple tasks with the support of a discreet virtual assistant, symbolizing partnership, efficiency and growth.",
};

const ctaSectionData = {
  title: "Ready to Delegate and Grow?",
  text: "Partner with Tiny Tasks and discover the power of expert virtual assistance. Get started today and reclaim your focus to drive your business forward!",
  aiTextForImage: "An inspiring image of a business owner looking towards a bright horizon, symbolizing growth and new opportunities, with subtle digital overlays representing VA support.",
};


export default async function HomePage() {
  const sectionImagePromises = sectionsData.map(section => 
    generateImageSections({ sectionText: section.aiTextForImage || section.text })
      .catch(err => { console.error(`Failed to generate image for ${section.id}:`, err); return null; })
  );
  
  const featuresSectionText = features.map(f => `${f.title}: ${f.description}`).join(' ');
  const featuresImagePromise = generateImageSections({ sectionText: `Features overview showcasing streamlined processes, expert task management, and dedicated assistant partnerships. ${featuresSectionText}` })
    .catch(err => { console.error(`Failed to generate image for features section:`, err); return null; });

  const servicesSectionCombinedText = services.map(s => `${s.title}: ${s.description} ${s.serviceItems.map(si => si.text).join(', ')}`).join('; ');
  const servicesIntroImagePromise = generateImageSections({ sectionText: `Overview of virtual assistant services including executive assistance, social media management, and graphic design, emphasizing comprehensive business support. ${servicesSectionCombinedText}` })
    .catch(err => { console.error(`Failed to generate image for services intro:`, err); return null; });

  const improvedCopyImagePromise = generateImageSections({ sectionText: improvedCopyData.aiTextForImage })
    .catch(err => { console.error(`Failed to generate image for improved copy section:`, err); return null; });

  const ctaImagePromise = generateImageSections({ sectionText: ctaSectionData.aiTextForImage })
    .catch(err => { console.error(`Failed to generate image for CTA section:`, err); return null; });

  const [
    heroImage,
    onboardingOverviewImage,
    servicesIntroImage,
    featuresImage,
    improvedCopyImage,
    ctaImage
  ] = await Promise.all([
    ...sectionImagePromises,
    servicesIntroImagePromise,
    featuresImagePromise,
    improvedCopyImagePromise,
    ctaImagePromise
  ]);

  const sectionImages: Record<string, GenerateImageSectionsOutput | null> = {
    hero: heroImage,
    'onboarding-overview': onboardingOverviewImage,
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
              Why Partner With Tiny Tasks?
            </h2>
            <p className="text-lg text-foreground/80 mb-12 max-w-2xl mx-auto">
              Our virtual assistant service is built on a foundation of trust, efficiency, and a genuine desire to help your business thrive.
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

        {/* Services Section */}
        <section id="services" className="py-16 md:py-24">
          <div className="container mx-auto text-center">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
              Our Virtual Assistant Services
            </h2>
            <p className="text-lg text-foreground/80 mb-12 max-w-3xl mx-auto">
              Comprehensive solutions designed to streamline your business operations, manage your tasks, and free up your valuable time so you can focus on growth.
            </p>
            {servicesIntroImage && (
              <div className="mb-12 md:mb-16 max-w-4xl mx-auto">
                <AiImageSection
                  title="Expert Support Tailored For You"
                  text="Our virtual assistants offer a wide array of services. We match you with skilled professionals ready to tackle your specific business needs."
                  aiImage={servicesIntroImage}
                  imagePlacement="left" 
                  className="py-0 !pt-0 text-left"
                  titleClassName="text-3xl text-center md:text-left"
                  textClassName="text-center md:text-left"
                />
              </div>
            )}
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <ServiceCard
                  key={service.title}
                  mainIcon={service.mainIcon}
                  title={service.title}
                  description={service.description}
                  serviceItems={service.serviceItems}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* Improved Copy Display Section */}
        <section id="copy-comparison" className="py-16 md:py-24  bg-secondary/30">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                        Our Approach: Clear Value, Real Impact
                    </h2>
                    <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                        We believe in transparent communication and delivering tangible results. See how we articulate the value of our virtual assistant services.
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
                            title="Visualizing Our Commitment"
                            text="AI helps us select visuals that underscore our dedication to providing impactful and efficient virtual assistant solutions."
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
                Begin Your VA Partnership <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </AiImageSection>
        </section>

      </main>
      <Footer />
    </div>
  );
}
