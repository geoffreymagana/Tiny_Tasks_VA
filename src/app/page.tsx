

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AiImageSection, AiImageInfo } from '@/components/ui/ai-image-section';
import { ImprovedCopyDisplay } from '@/components/ui/improved-copy-display';
import { FeatureCard } from '@/components/ui/feature-card';
import { ServiceCard } from '@/components/ui/service-card';
import { PricingCard } from '@/components/ui/pricing-card';
import { TestimonialCard } from '@/components/ui/testimonial-card';
import { ContactForm } from '@/components/ui/contact-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { 
  Zap, Users2, Rocket, Palette as PaletteIconLucide, 
  Briefcase, Mail, Plane, FileText as FileTextLucide, 
  Share2, BarChartBig, PenSquare, Megaphone,
  Image as ImageIconLucide, Presentation, BotMessageSquare, Lightbulb,
  CalendarDays, Users, Phone, Video, MessageSquare as MessageCircleIcon, FileTextIcon, ListChecks, CheckSquare, MonitorSmartphone, Slack, Trello, ThumbsUp, TrendingUp, Brush, LayoutGrid, Crop, ShoppingCart, Aperture
} from 'lucide-react';
import Link from 'next/link';
import { getSectionDataAction, type SectionData, getPortfolioItemsAction, type PortfolioItem, getBrandLogosAction, type BrandLogoItem, getTestimonialsAction, type TestimonialItem } from '@/app/admin/cms/actions';
import { BrandMarquee } from '@/components/ui/brand-marquee';
import { ToolsShowcase } from '@/components/ui/tools-showcase';

interface StaticSectionContent {
  id: string;
  defaultTitle: string;
  defaultText: string;
  imagePlacement?: 'left' | 'right';
  cta?: { text: string; href: string };
  icon?: React.ReactNode;
  imageDescriptionForHint: string; 
  defaultIsVisible: boolean;
  defaultImagePlacement: 'left' | 'right';
  defaultIsImageVisible: boolean;
  defaultTextAlign: 'left' | 'center';
}

const cmsSectionsConfig: StaticSectionContent[] = [
  {
    id: 'hero',
    defaultTitle: 'Your Dedicated Virtual Assistant for Effortless Productivity',
    defaultText: "Tiny Tasks provides expert virtual assistance to manage your workload, streamline operations, and free up your time for what matters most. Smart, reliable, and tailored to your needs.",
    cta: { text: 'Get Started', href: '/auth' },
    imageDescriptionForHint: "professional virtual assistant",
    defaultIsVisible: true,
    defaultImagePlacement: 'right',
    defaultIsImageVisible: true,
    defaultTextAlign: 'left',
  },
  {
    id: 'onboarding-overview',
    defaultTitle: 'Our Simple Onboarding Process',
    defaultText: "Getting started with Tiny Tasks is seamless. We'll understand your needs, match you with the perfect virtual assistant, and integrate them into your workflow for immediate impact. Our clear steps ensure you're supported from discovery to ongoing success.",
    cta: { text: 'View Detailed Onboarding', href: '/onboarding-steps' },
    imageDescriptionForHint: "onboarding steps",
    defaultIsVisible: true,
    defaultImagePlacement: 'left',
    defaultIsImageVisible: true,
    defaultTextAlign: 'left',
  },
   {
    id: 'services-intro',
    defaultTitle: 'Expert VA Support Tailored For You',
    defaultText: "Our virtual assistants offer a wide array of services. We match you with skilled VAs ready to tackle your specific business needs and challenges.",
    imageDescriptionForHint: "virtual assistance services",
    defaultIsVisible: true,
    defaultImagePlacement: 'right',
    defaultIsImageVisible: true,
    defaultTextAlign: 'left',
  },
  {
    id: 'tools', 
    defaultTitle: 'Our Versatile Toolkit',
    defaultText: "We leverage the best tools to deliver exceptional virtual assistance, ensuring seamless collaboration and top-notch results for your projects.",
    imageDescriptionForHint: "business tools collage",
    defaultIsVisible: true,
    defaultImagePlacement: 'left',
    defaultIsImageVisible: true,
    defaultTextAlign: 'center',
  },
  {
    id: 'portfolio-intro',
    defaultTitle: 'Our Recent Work & Case Studies',
    defaultText: "Explore a selection of projects where Tiny Tasks has made a significant impact, delivering quality and driving growth for our clients.",
    imageDescriptionForHint: "portfolio showcase design",
    defaultIsVisible: true,
    defaultImagePlacement: 'right',
    defaultIsImageVisible: true,
    defaultTextAlign: 'left',
  },
  {
    id: 'brand-marquee-intro',
    defaultTitle: 'Trusted By Leading Businesses',
    defaultText: "We're proud to have partnered with a diverse range of companies, helping them achieve their goals with our dedicated virtual assistant services.",
    imageDescriptionForHint: "brand logos collage",
    defaultIsVisible: true,
    defaultImagePlacement: 'left',
    defaultIsImageVisible: true,
    defaultTextAlign: 'center',
  },
  {
    id: 'pricing', 
    defaultTitle: 'Transparent VA Pricing',
    defaultText: "Our clear pricing plans ensure you find the perfect fit for your business needs.",
    imageDescriptionForHint: "pricing plans KES",
    defaultIsVisible: true,
    defaultImagePlacement: 'right',
    defaultIsImageVisible: true,
    defaultTextAlign: 'left',
  },
  {
    id: 'testimonials', 
    defaultTitle: 'Client Success Stories',
    defaultText: "Hear from businesses that have transformed their productivity and growth with Tiny Tasks.",
    imageDescriptionForHint: "happy clients",
    defaultIsVisible: true,
    defaultImagePlacement: 'left',
    defaultIsImageVisible: true,
    defaultTextAlign: 'left',
  },
  {
    id: 'blog-intro',
    defaultTitle: "Insights & Productivity Tips",
    defaultText: "Explore our latest articles for expert advice on virtual assistance, business growth, and mastering your workday. Discover trends, tools, and strategies to optimize your operations.",
    imageDescriptionForHint: "blog ideas desk",
    cta: { text: 'Explore Our Blog', href: '/blog' },
    defaultIsVisible: true,
    defaultImagePlacement: 'right',
    defaultIsImageVisible: true,
    defaultTextAlign: 'left',
  },
  {
    id: 'cta', 
    defaultTitle: "Ready to Delegate, Grow, and Thrive?",
    defaultText: "Partner with Tiny Tasks and discover the power of expert virtual assistance. Let's discuss your needs and tailor a solution that propels your business forward. Get started today!",
    imageDescriptionForHint: "business collaboration handshake",
    defaultIsVisible: true,
    defaultImagePlacement: 'left',
    defaultIsImageVisible: true,
    defaultTextAlign: 'left',
  },
];

const features = [
  { icon: <Zap size={28} />, title: "Boost Your Productivity", description: "Our VAs handle time-consuming tasks, allowing you to focus on core business activities and strategic growth.", },
  { icon: <Users2 size={28} />,  title: "Access Specialized Skills", description: "Tap into a wide range of expertise, from administrative support to social media and design, without hiring full-time.", },
  { icon: <Rocket size={28} />,  title: "Flexible & Scalable Support", description: "Adjust your VA services as your business needs change, ensuring you always have the right level of support.", },
];

const services = [
  { mainIcon: <Briefcase size={32} />, title: "Executive Assistance", description: "Professional administrative support to keep your business running smoothly and efficiently.", serviceItems: [ { icon: <CalendarDays size={18}/>, text: "Calendar & Schedule Management" }, { icon: <Mail size={18}/>, text: "Email Management & Correspondence" }, { icon: <Plane size={18}/>, text: "Travel Arrangements" }, { icon: <FileTextLucide size={18}/>, text: "Document Preparation" }, ], learnMoreLink: "/services/executive-assistance", },
  { mainIcon: <Share2 size={32} />, title: "Social Media Management", description: "Strategic social media support to grow your online presence and engagement effectively.", serviceItems: [ { icon: <PenSquare size={18}/>, text: "Content Creation & Curation" }, { icon: <Users2 size={18}/>, text: "Community Engagement" }, { icon: <BarChartBig size={18}/>, text: "Analytics & Reporting" }, { icon: <Megaphone size={18}/>, text: "Ad Campaign Support" }, ], learnMoreLink: "/services/social-media-management",  },
  { mainIcon: <PaletteIconLucide size={32} />, title: "Graphic Design Support", description: "Creative design solutions to enhance your brand's visual identity and marketing materials.", serviceItems: [ { icon: <ImageIconLucide size={18}/>, text: "Social Media Graphics" }, { icon: <Presentation size={18}/>, text: "Presentation Design" }, { icon: <FileTextIcon size={18}/>, text: "Marketing Material Layouts" }, { icon: <PaletteIconLucide size={18}/>, text: "Basic Brand Asset Creation" }, ], learnMoreLink: "/services/graphic-design-support", },
];

const improvedCopyData = {
  originalTitle: "Need Help With Your Tasks?",
  originalText: "Our virtual assistants can do many things for your business. They are good at managing tasks and can help you every day.",
  improvedTitle: "Unlock Peak Efficiency with Expert Virtual Assistance",
  improvedText: "Tiny Tasks empowers your business by connecting you with skilled virtual assistants. We streamline your operations, manage critical tasks, and provide dedicated support, freeing you to concentrate on high-impact activities and achieve your strategic objectives.",
};

const pricingDataStatic = {
  tiers: [
    { tier: "Essential VA Support", price: "KES 15,000/month", description: "Perfect for individuals or small businesses needing core administrative help.", features: ["10 hours of VA support", "Basic Admin Tasks", "Email Management (limited)", "Scheduling Assistance"], isPopular: false, ctaLink: "/auth" },
    { tier: "Growth VA Package", price: "KES 35,000/month", description: "Ideal for growing businesses needing consistent, broader support.", features: ["25 hours of VA support", "Advanced Admin Tasks", "Social Media Scheduling", "Calendar Management", "Client Communication"], isPopular: true, ctaLink: "/auth" },
    { tier: "Premium VA Partnership", price: "KES 60,000/month", description: "Comprehensive support for established businesses and executives.", features: ["50 hours of VA support", "Dedicated VA", "Project Management Support", "Graphic Design Basics", "Full Email & Calendar Control", "Priority Support"], isPopular: false, ctaLink: "/auth" },
  ],
};


export default async function HomePage() {
  
  const fetchedSectionData: Record<string, SectionData | null> = {};
  for (const section of cmsSectionsConfig) {
    fetchedSectionData[section.id] = await getSectionDataAction(section.id);
  }

  const portfolioItems: PortfolioItem[] = await getPortfolioItemsAction();
  const visiblePortfolioItems = portfolioItems.filter(item => item.isVisible !== false);

  const brandLogos: BrandLogoItem[] = await getBrandLogosAction();
  const visibleBrandLogos = brandLogos.filter(logo => logo.isVisible !== false);

  const testimonials: TestimonialItem[] = await getTestimonialsAction();
  const visibleTestimonials = testimonials.filter(item => item.isVisible !== false);


  const getSectionContent = (sectionId: string, field: 'title' | 'text' | 'imageUrl' | 'isVisible' | 'imagePlacement' | 'isImageVisible' | 'textAlign') => {
    const cmsData = fetchedSectionData[sectionId];
    const staticConfig = cmsSectionsConfig.find(s => s.id === sectionId);

    if (!staticConfig) return field === 'isVisible' || field === 'isImageVisible' ? true : (field === 'imageUrl' ? null : (field === 'imagePlacement' ? 'right' : (field === 'textAlign' ? 'left' : ''))); 

    switch (field) {
      case 'title':
        return cmsData?.title ?? staticConfig.defaultTitle;
      case 'text':
        return cmsData?.text ?? staticConfig.defaultText;
      case 'imageUrl':
        return cmsData?.imageUrl ?? null;
      case 'isVisible':
        return cmsData?.isVisible === undefined ? staticConfig.defaultIsVisible : cmsData.isVisible;
      case 'imagePlacement':
        return cmsData?.imagePlacement ?? staticConfig.defaultImagePlacement;
      case 'isImageVisible':
        return cmsData?.isImageVisible === undefined ? staticConfig.defaultIsImageVisible : cmsData.isImageVisible;
      case 'textAlign':
        return cmsData?.textAlign ?? staticConfig.defaultTextAlign;
      default:
        return '';
    }
  };

  const renderAiImageSection = (sectionId: string) => {
    const staticConfig = cmsSectionsConfig.find(s => s.id === sectionId);
    if (!staticConfig) return null;

    const isVisible = getSectionContent(sectionId, 'isVisible') as boolean;
    if (!isVisible) return null;

    const title = getSectionContent(sectionId, 'title') as string;
    const text = getSectionContent(sectionId, 'text') as string;
    const imageUrl = getSectionContent(sectionId, 'imageUrl') as string | null;
    const imagePlacement = getSectionContent(sectionId, 'imagePlacement') as 'left' | 'right';
    const isImageVisible = getSectionContent(sectionId, 'isImageVisible') as boolean;
    const textAlign = getSectionContent(sectionId, 'textAlign') as 'left' | 'center';
    
    const imageInfo: AiImageInfo = {
      imageDataURI: imageUrl,
      description: staticConfig.imageDescriptionForHint,
      placeholderHint: staticConfig.imageDescriptionForHint
    };

    let titleClass = '';
    if (sectionId === 'hero') {
      titleClass = isImageVisible ? 'text-5xl md:text-6xl' : 'text-5xl md:text-7xl lg:text-8xl';
    } else if (['services-intro', 'tools', 'pricing', 'testimonials', 'blog-intro', 'portfolio-intro', 'brand-marquee-intro'].includes(sectionId)) {
        titleClass = `text-4xl md:text-5xl`;
    }

    let textClass = ['services-intro', 'tools', 'pricing', 'testimonials', 'blog-intro', 'portfolio-intro', 'brand-marquee-intro'].includes(sectionId) ? `text-lg max-w-3xl ${textAlign === 'center' ? 'mx-auto' : ''}` : '';
    
    if (sectionId === 'cta') {
        titleClass = 'text-4xl md:text-5xl';
        textClass = 'text-lg';
    }

    let sectionSpecificImageContainerClass = '';
    if (sectionId === 'blog-intro' && staticConfig.imagePlacement === 'right') { 
        sectionSpecificImageContainerClass = 'max-w-md'; 
    } else if (sectionId === 'blog-intro' && staticConfig.imagePlacement === 'left') {
        sectionSpecificImageContainerClass = 'max-w-md';
    }

    return (
      <AiImageSection
        key={sectionId}
        id={sectionId}
        title={title}
        text={text}
        imageInfo={imageInfo}
        imagePlacement={imagePlacement}
        isImageVisible={isImageVisible}
        textAlign={textAlign}
        className={sectionId === 'hero' ? 'bg-gradient-to-b from-background to-secondary/30 !mt-[-4rem] pt-16 md:pt-20' : ''}
        titleClassName={titleClass}
        textClassName={textClass}
        imageContainerClassName={sectionSpecificImageContainerClass}
      >
        {staticConfig.cta && (
          <Button asChild size="lg" className="mt-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href={staticConfig.cta.href}>
              {staticConfig.cta.text} <Rocket className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        )}
      </AiImageSection>
    );
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        
        {renderAiImageSection('hero')}

        <section id="features" className="py-16 md:py-24 bg-secondary/50">
          <div className="container mx-auto text-center">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
              Why Partner With Tiny Tasks?
            </h2>
            <p className="text-lg text-foreground/80 mb-12 max-w-3xl mx-auto">
              Our virtual assistant service is built on a foundation of trust, efficiency, and a genuine desire to help your business thrive by providing expert VA support.
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
          </div>
        </section>

        {renderAiImageSection('onboarding-overview')}
        
        {renderAiImageSection('services-intro')}
        {getSectionContent('services-intro', 'isVisible') && (
            <section id="services-cards" className="py-16 md:py-24">
            <div className="container mx-auto">
                <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {services.map((service) => (
                    <ServiceCard
                    key={service.title}
                    mainIcon={service.mainIcon}
                    title={service.title}
                    description={service.description}
                    serviceItems={service.serviceItems}
                    learnMoreLink={service.learnMoreLink}
                    />
                ))}
                </div>
            </div>
            </section>
        )}
        
        <section id="copy-comparison" className="py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                        Our Approach: Clear Value, Real Impact with VAs
                    </h2>
                    <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                        We believe in transparent communication and delivering tangible results. See how we articulate the value of our expert virtual assistant services.
                    </p>
                </div>
                <ImprovedCopyDisplay
                    originalTitle={improvedCopyData.originalTitle}
                    originalText={improvedCopyData.originalText}
                    improvedTitle={improvedCopyData.improvedTitle}
                    improvedText={improvedCopyData.improvedText}
                />
            </div>
        </section>

        {getSectionContent('tools', 'isVisible') && (
            <section className="py-12 md:py-20" id="tools">
                <div className="container mx-auto text-center">
                    <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                        {getSectionContent('tools', 'title') as string}
                    </h2>
                    <p className="text-lg text-foreground/80 mb-12 max-w-3xl mx-auto">
                        {getSectionContent('tools', 'text') as string}
                    </p>
                    <ToolsShowcase />
                </div>
            </section>
        )}

        {renderAiImageSection('portfolio-intro')}
        {(getSectionContent('portfolio-intro', 'isVisible') as boolean) && (
            <section id="portfolio-items" className="py-16 md:py-24 bg-secondary/30">
                <div className="container mx-auto">
                {visiblePortfolioItems.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {visiblePortfolioItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="aspect-[3/2] relative w-full bg-muted">
                            <Image
                            src={item.imageUrl || "https://placehold.co/600x400.png"}
                            alt={item.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            data-ai-hint={item.imageHint || "portfolio project"}
                            />
                        </div>
                        <CardContent className="p-6">
                            <h3 className="font-headline text-xl text-primary mb-2">{item.title}</h3>
                            <p className="text-sm text-foreground/70">{item.description}</p>
                        </CardContent>
                        </Card>
                    ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground text-lg">Our portfolio is currently being updated. Check back soon!</p>
                )}
                <div className="text-center mt-12">
                    <Button variant="outline" size="lg" disabled>View Full Portfolio (Coming Soon)</Button>
                </div>
                </div>
            </section>
        )}

        {renderAiImageSection('brand-marquee-intro')}
        {(getSectionContent('brand-marquee-intro', 'isVisible') as boolean) && (
          <section id="brand-marquee-items" className="py-16 md:py-20 bg-background">
            <div className="container mx-auto">
              {visibleBrandLogos.length > 0 ? (
                <BrandMarquee logos={visibleBrandLogos} />
              ) : (
                <p className="text-center text-muted-foreground text-lg">Our valued partners and clients will be showcased here soon.</p>
              )}
            </div>
          </section>
        )}

        {renderAiImageSection('pricing')}
        {getSectionContent('pricing', 'isVisible') && (
            <section id="pricing-static" className="py-16 md:py-24 bg-secondary/30"> {/* Alternating background */}
            <div className="container mx-auto">
                <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {pricingDataStatic.tiers.map((tier) => (
                    <PricingCard
                    key={tier.tier}
                    tier={tier.tier}
                    price={tier.price}
                    description={tier.description}
                    features={tier.features}
                    isPopular={tier.isPopular}
                    ctaLink={tier.ctaLink}
                    />
                ))}
                </div>
            </div>
            </section>
        )}
        
        {renderAiImageSection('testimonials')}
        {getSectionContent('testimonials', 'isVisible') && visibleTestimonials.length > 0 && (
            <section id="testimonials-static" className="py-16 md:py-24 bg-background"> {/* Alternating background */}
            <div className="container mx-auto">
                <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
                {visibleTestimonials.map((review) => (
                    <TestimonialCard
                      key={review.id}
                      name={review.name}
                      role={review.role}
                      testimonial={review.testimonial}
                      avatarSrc={review.avatarUrl || undefined}
                      avatarFallback={review.name.split(' ').map(n => n[0]).join('')}
                      rating={review.rating}
                    />
                ))}
                </div>
            </div>
            </section>
        )}

        {renderAiImageSection('blog-intro')}
        
        {(getSectionContent('cta', 'isVisible') as boolean) && (
          <section key="cta" id="cta" className="py-20 md:py-28 bg-gradient-to-r from-primary to-blue-800 text-primary-foreground">
            <div className="container mx-auto">
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <div className={cmsSectionsConfig.find(s => s.id === 'cta')?.imagePlacement === 'right' ? 'md:order-first' : ''}>
                      <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6">{getSectionContent('cta', 'title') as string}</h2>
                      <p className="text-lg leading-relaxed mb-8">{getSectionContent('cta', 'text') as string}</p>
                      <ContactForm />
                  </div>
                  <div className={`hidden md:flex justify-center items-center ${cmsSectionsConfig.find(s => s.id === 'cta')?.imagePlacement === 'right' ? 'md:order-last' : ''}`}>
                        <AiImageSection
                          title="" 
                          text=""
                          imageInfo={{
                              imageDataURI: getSectionContent('cta', 'imageUrl') as string | null,
                              description: cmsSectionsConfig.find(s => s.id === 'cta')?.imageDescriptionForHint || '',
                              placeholderHint: cmsSectionsConfig.find(s => s.id === 'cta')?.imageDescriptionForHint
                          }}
                          imagePlacement="right" // This prop on AiImageSection itself dictates its internal image/text order
                          isImageVisible={getSectionContent('cta', 'isImageVisible') as boolean}
                          className="!p-0" 
                          titleClassName="hidden"
                          textClassName="hidden"
                        />
                  </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
