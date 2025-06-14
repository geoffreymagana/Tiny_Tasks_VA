
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
import { 
  Zap, Users2, Rocket, Palette as PaletteIconLucide, 
  Briefcase, Mail, Plane, FileText as FileTextLucide, 
  Share2, BarChartBig, PenSquare, Megaphone,
  Image as ImageIconLucide, Presentation, BotMessageSquare, Lightbulb,
  CalendarDays, Users, Phone, Video, MessageSquare as MessageCircleIcon, FileTextIcon, ListChecks, CheckSquare, MonitorSmartphone, Slack, Trello, ThumbsUp, TrendingUp, Brush, LayoutGrid, Crop, ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { getSectionDataAction, type SectionData } from '@/app/admin/cms/actions'; // Updated import

interface StaticSectionContent {
  id: string;
  defaultTitle: string;
  defaultText: string;
  imagePlacement?: 'left' | 'right';
  cta?: { text: string; href: string };
  icon?: React.ReactNode;
  imageDescriptionForHint: string; 
}

// Static definitions for section structure and default content
const staticSectionsData: StaticSectionContent[] = [
  {
    id: 'hero',
    defaultTitle: 'Your Dedicated Virtual Assistant for Effortless Productivity',
    defaultText: "Tiny Tasks provides expert virtual assistance to manage your workload, streamline operations, and free up your time for what matters most. Smart, reliable, and tailored to your needs.",
    imagePlacement: 'right',
    cta: { text: 'Get Started', href: '/auth' },
    imageDescriptionForHint: "professional virtual assistant",
  },
  {
    id: 'onboarding-overview',
    defaultTitle: 'Our Simple Onboarding Process',
    defaultText: "Getting started with Tiny Tasks is seamless. We'll understand your needs, match you with the perfect virtual assistant, and integrate them into your workflow for immediate impact. Our clear steps ensure you're supported from discovery to ongoing success.",
    imagePlacement: 'left',
    cta: { text: 'View Detailed Onboarding', href: '/onboarding-steps' },
    imageDescriptionForHint: "onboarding steps",
  },
   {
    id: 'services-intro',
    defaultTitle: 'Expert VA Support Tailored For You',
    defaultText: "Our virtual assistants offer a wide array of services. We match you with skilled VAs ready to tackle your specific business needs and challenges.",
    imagePlacement: 'left',
    imageDescriptionForHint: "virtual assistance services",
  },
  {
    id: 'tools',
    defaultTitle: 'Our Versatile Toolkit',
    defaultText: "We leverage the best tools to deliver exceptional virtual assistance, ensuring seamless collaboration and top-notch results for your projects.",
    imagePlacement: 'right',
    imageDescriptionForHint: "business tools collage",
  },
  {
    id: 'pricing',
    defaultTitle: 'Transparent VA Pricing',
    defaultText: "Our clear pricing plans ensure you find the perfect fit for your business needs.",
    imagePlacement: 'left',
    imageDescriptionForHint: "pricing plans KES",
  },
  {
    id: 'testimonials',
    defaultTitle: 'Client Success Stories',
    defaultText: "Visually representing client satisfaction through placeholder imagery.",
    imagePlacement: 'right',
    imageDescriptionForHint: "happy clients",
  },
  {
    id: 'blog-intro',
    defaultTitle: "Insights & Productivity Tips",
    defaultText: "Explore our latest articles for expert advice on virtual assistance, business growth, and mastering your workday.",
    imagePlacement: 'right',
    imageDescriptionForHint: "blog ideas",
  },
  {
    id: 'cta',
    defaultTitle: "Ready to Delegate, Grow, and Thrive?",
    defaultText: "Partner with Tiny Tasks and discover the power of expert virtual assistance. Let's discuss your needs and tailor a solution that propels your business forward. Get started today!",
    imagePlacement: 'right', // Image is on the right of the form, text on left
    imageDescriptionForHint: "business collaboration",
  },
];

// Static data for elements not directly managed by CMS text fields (like feature cards, specific service items)
const services = [
  {
    mainIcon: <Briefcase size={32} />,
    title: "Executive Assistance",
    description: "Professional administrative support to keep your business running smoothly and efficiently.",
    serviceItems: [
      { icon: <CalendarDays size={18}/>, text: "Calendar & Schedule Management" },
      { icon: <Mail size={18}/>, text: "Email Management & Correspondence" },
      { icon: <Plane size={18}/>, text: "Travel Arrangements" },
      { icon: <FileTextLucide size={18}/>, text: "Document Preparation" },
    ],
    learnMoreLink: "/services/executive-assistance",
  },
  {
    mainIcon: <Share2 size={32} />,
    title: "Social Media Management",
    description: "Strategic social media support to grow your online presence and engagement effectively.",
    serviceItems: [
      { icon: <PenSquare size={18}/>, text: "Content Creation & Curation" },
      { icon: <Users2 size={18}/>, text: "Community Engagement" },
      { icon: <BarChartBig size={18}/>, text: "Analytics & Reporting" },
      { icon: <Megaphone size={18}/>, text: "Ad Campaign Support" },
    ],
    learnMoreLink: "/services/social-media-management", 
  },
  {
    mainIcon: <PaletteIconLucide size={32} />,
    title: "Graphic Design Support",
    description: "Creative design solutions to enhance your brand's visual identity and marketing materials.",
    serviceItems: [
      { icon: <ImageIconLucide size={18}/>, text: "Social Media Graphics" },
      { icon: <Presentation size={18}/>, text: "Presentation Design" },
      { icon: <FileTextIcon size={18}/>, text: "Marketing Material Layouts" },
      { icon: <PaletteIconLucide size={18}/>, text: "Basic Brand Asset Creation" },
    ],
    learnMoreLink: "/services/graphic-design-support",
  },
];

const features = [
  {
    icon: <Zap size={28} />,
    title: "Boost Your Productivity",
    description: "Our VAs handle time-consuming tasks, allowing you to focus on core business activities and strategic growth.",
  },
  {
    icon: <Users2 size={28} />, 
    title: "Access Specialized Skills",
    description: "Tap into a wide range of expertise, from administrative support to social media and design, without hiring full-time.",
  },
  {
    icon: <Rocket size={28} />, 
    title: "Flexible & Scalable Support",
    description: "Adjust your VA services as your business needs change, ensuring you always have the right level of support.",
  },
];

const improvedCopyData = {
  originalTitle: "Need Help With Your Tasks?",
  originalText: "Our virtual assistants can do many things for your business. They are good at managing tasks and can help you every day.",
  improvedTitle: "Unlock Peak Efficiency with Expert Virtual Assistance",
  improvedText: "Tiny Tasks empowers your business by connecting you with skilled virtual assistants. We streamline your operations, manage critical tasks, and provide dedicated support, freeing you to concentrate on high-impact activities and achieve your strategic objectives.",
};

const toolsDataStatic = {
  title: "Tools We Master for Your Success",
  description: "Our virtual assistants are proficient with a wide array of industry-standard tools to seamlessly integrate into your workflows and boost productivity.",
  categories: [
    {
      name: "Communication",
      icon: <MessageCircleIcon size={24} className="text-accent" />,
      tools: [
        { name: "Skype", icon: <Phone size={18} /> },
        { name: "Zoom", icon: <Video size={18} /> },
        { name: "Microsoft Teams", icon: <Users size={18} /> },
        { name: "Slack", icon: <Slack size={18} /> },
      ],
    },
    { name: "Calendar Management", icon: <CalendarDays size={24} className="text-accent" />, tools: [ { name: "Calendly", icon: <CalendarDays size={18} /> }, { name: "Google Calendar", icon: <CalendarDays size={18} /> }, ], },
    { name: "Email Management", icon: <Mail size={24} className="text-accent" />, tools: [{ name: "Zoho Mail", icon: <Mail size={18} /> }], },
    { name: "Social Media", icon: <Share2 size={24} className="text-accent" />, tools: [ { name: "Canva", icon: <PaletteIconLucide size={18} /> }, { name: "Meta Business Suite", icon: <MonitorSmartphone size={18} /> }, ], },
    { name: "Project Management", icon: <ListChecks size={24} className="text-accent" />, tools: [ { name: "Notion", icon: <FileTextIcon size={18} /> }, { name: "Trello", icon: <Trello size={18} /> }, { name: "Todoist", icon: <CheckSquare size={18} /> }, ], },
  ],
};

const pricingDataStatic = {
  title: "Flexible Pricing for Every Need",
  description: "Choose a plan that fits your business goals and budget. All prices are in Kenyan Shillings (KES). Note: These are example prices, please update with your actual rates.",
  tiers: [
    { tier: "Essential VA Support", price: "KES 15,000/month", description: "Perfect for individuals or small businesses needing core administrative help.", features: ["10 hours of VA support", "Basic Admin Tasks", "Email Management (limited)", "Scheduling Assistance"], isPopular: false, ctaLink: "/auth" },
    { tier: "Growth VA Package", price: "KES 35,000/month", description: "Ideal for growing businesses needing consistent, broader support.", features: ["25 hours of VA support", "Advanced Admin Tasks", "Social Media Scheduling", "Calendar Management", "Client Communication"], isPopular: true, ctaLink: "/auth" },
    { tier: "Premium VA Partnership", price: "KES 60,000/month", description: "Comprehensive support for established businesses and executives.", features: ["50 hours of VA support", "Dedicated VA", "Project Management Support", "Graphic Design Basics", "Full Email & Calendar Control", "Priority Support"], isPopular: false, ctaLink: "/auth" },
  ],
};

const testimonialsDataStatic = {
  title: "Hear From Our Happy Clients",
  description: "Discover how Tiny Tasks has helped businesses like yours save time, reduce stress, and achieve their goals.",
  reviews: [
    { name: "Aisha K.", role: "Founder, Bloom Creatives", testimonial: "Tiny Tasks revolutionized how I manage my workload. My VA is proactive, efficient, and a true asset to my business!", avatarFallback: "AK", rating: 5 },
    { name: "David M.", role: "Consultant, Peak Solutions", testimonial: "The onboarding was seamless, and my assistant got up to speed incredibly fast. I can finally focus on strategy instead of being bogged down in admin.", avatarFallback: "DM", rating: 5 },
    { name: "Sarah L.", role: "E-commerce Store Owner", testimonial: "From social media to customer support, my VA handles it all. Sales are up, and my stress levels are way down. Highly recommend!", avatarFallback: "SL", rating: 4 },
  ],
};


export default async function HomePage() {
  
  const fetchedSectionData: Record<string, SectionData | null> = {};
  for (const section of staticSectionsData) {
    fetchedSectionData[section.id] = await getSectionDataAction(section.id);
  }

  const getDynamicOrStaticContent = (sectionId: string, field: 'title' | 'text') => {
    const dynamicData = fetchedSectionData[sectionId];
    const staticSection = staticSectionsData.find(s => s.id === sectionId);

    if (field === 'title') {
      return dynamicData?.title || staticSection?.defaultTitle || '';
    }
    if (field === 'text') {
      return dynamicData?.text || staticSection?.defaultText || '';
    }
    return '';
  };
  
  const getAiImageInfoForSection = (staticSection: StaticSectionContent): AiImageInfo => {
    const dynamicData = fetchedSectionData[staticSection.id];
    return {
      imageDataURI: dynamicData?.imageUrl || null,
      description: staticSection.imageDescriptionForHint, // Alt text from static data
      placeholderHint: staticSection.imageDescriptionForHint 
    };
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {staticSectionsData.map((section) => (
          <AiImageSection
            key={section.id}
            title={getDynamicOrStaticContent(section.id, 'title')}
            text={getDynamicOrStaticContent(section.id, 'text')}
            imageInfo={getAiImageInfoForSection(section)}
            imagePlacement={section.imagePlacement}
            className={section.id === 'hero' ? 'bg-gradient-to-b from-background to-secondary/30' : ''}
            titleClassName={section.id === 'hero' ? 'text-5xl md:text-6xl lg:text-7xl' : (section.id === 'services-intro' || section.id === 'tools' || section.id === 'pricing' || section.id === 'testimonials' || section.id === 'blog-intro' ? 'text-3xl text-center md:text-left' : '')}
            textClassName={(section.id === 'services-intro' || section.id === 'tools' || section.id === 'pricing' || section.id === 'testimonials' || section.id === 'blog-intro' ? 'text-center md:text-left' : '')}
            imageContainerClassName={(section.id === 'blog-intro' ? 'max-w-md ml-auto' : '')}
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

        <section id="services" className="py-16 md:py-24">
          <div className="container mx-auto text-center">
             <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
              Our Virtual Assistant Services
            </h2>
            <p className="text-lg text-foreground/80 mb-12 max-w-3xl mx-auto">
              Comprehensive VA solutions designed to streamline your business operations, manage your tasks effectively, and free up your valuable time so you can focus on strategic growth.
            </p>
            {/* The "Expert VA Support Tailored For You" AiImageSection is now part of the main loop above */}
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
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

        <section id="tools-static" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <BotMessageSquare className="h-12 w-12 text-accent mx-auto mb-4" />
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                {toolsDataStatic.title}
              </h2>
              <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                {toolsDataStatic.description}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {toolsDataStatic.categories.map((category) => (
                <div key={category.name} className="p-6 bg-card rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center mb-4">
                    {category.icon}
                    <h3 className="font-headline text-xl text-primary ml-3">{category.name}</h3>
                  </div>
                  <ul className="space-y-2">
                    {category.tools.map(tool => (
                      <li key={tool.name} className="flex items-center text-foreground/80">
                        <span className="mr-2 text-primary/70">{tool.icon}</span>
                        {tool.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {/* The AiImageSection for "tools" is handled in the main loop */}
          </div>
        </section>

        <section id="pricing-static" className="py-16 md:py-24 bg-secondary/50">
          <div className="container mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <Lightbulb className="h-12 w-12 text-accent mx-auto mb-4" />
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                {pricingDataStatic.title}
              </h2>
              <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                {pricingDataStatic.description}
              </p>
            </div>
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
             {/* The AiImageSection for "pricing" is handled in the main loop */}
          </div>
        </section>

        <section id="testimonials-static" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <Users2 className="h-12 w-12 text-accent mx-auto mb-4" />
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                {testimonialsDataStatic.title}
              </h2>
              <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                {testimonialsDataStatic.description}
              </p>
            </div>
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
              {testimonialsDataStatic.reviews.map((review) => (
                <TestimonialCard
                  key={review.name}
                  name={review.name}
                  role={review.role}
                  testimonial={review.testimonial}
                  avatarFallback={review.avatarFallback}
                  rating={review.rating}
                />
              ))}
            </div>
            {/* The AiImageSection for "testimonials" is handled in the main loop */}
          </div>
        </section>

        <section id="blog-intro-wrapper" className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto">
             {/* The AiImageSection for "blog-intro" is handled in the main loop */}
            <div className="text-center md:text-left mt-8 md:mt-0"> {/* Adjustments for layout if AiImageSection handles text */}
                 <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/blog">
                    Explore Our Blog <Rocket className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
            </div>
          </div>
        </section>


        <section id="cta-wrapper" className="py-20 md:py-28 bg-gradient-to-r from-primary to-blue-800 text-primary-foreground">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div>
                    {/* Title and Text for CTA are now rendered by AiImageSection from the loop */}
                    <ContactForm />
                </div>
                <div className="hidden md:flex justify-center items-center">
                     {/* The AiImageSection for "cta" is handled in the main loop, no need to repeat image logic here, only text if not part of AiImageSection */}
                </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
