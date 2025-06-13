
import { generateImageSections, GenerateImageSectionsOutput } from '@/ai/flows/generate-image-sections';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AiImageSection } from '@/components/ui/ai-image-section';
import { ImprovedCopyDisplay } from '@/components/ui/improved-copy-display';
import { FeatureCard } from '@/components/ui/feature-card';
import { ServiceCard } from '@/components/ui/service-card';
import { PricingCard } from '@/components/ui/pricing-card';
import { TestimonialCard } from '@/components/ui/testimonial-card';
import { ContactForm } from '@/components/ui/contact-form';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, Zap, Users2, Rocket, Palette, Brain,
  Briefcase, Database, Mail, Settings, Plane, Heart, BookOpenCheck,
  Share2, BarChartBig, PenSquare, MessageCircle, Megaphone,
  Image as ImageIconLucide, MonitorPlay, Presentation, LayoutGrid, Laptop, Wrench, PackageCheck, Settings2, FileText, Globe, CheckSquare, MessageSquareIcon, BarChart2, MonitorSmartphone,
  Slack, CalendarDays, Trello, ListChecks, Users, Phone, Video, MessageCircle as MessageCircleIcon, FileTextIcon, PaletteIcon, BotMessageSquare, Lightbulb
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
    aiTextForImage: "A dynamic and modern illustration of a focused professional at a clean desk, with subtle digital icons representing virtual assistant tasks (calendar, email, charts) seamlessly integrated around them, conveying efficiency and support.",
  },
  {
    id: 'onboarding-overview',
    title: 'Our Simple Onboarding Process',
    text: "Getting started with Tiny Tasks is seamless. We'll understand your needs, match you with the perfect virtual assistant, and integrate them into your workflow for immediate impact. Our clear steps ensure you're supported from discovery to ongoing success.",
    imagePlacement: 'left',
    cta: { text: 'View Detailed Onboarding', href: '/onboarding-steps' },
    aiTextForImage: "Illustration of a smooth, step-by-step onboarding process for virtual assistant services. Show icons for 'discovery call', 'matching', 'integration', and 'support', connected by a clear path.",
  },
];

const services = [
  {
    mainIcon: <Briefcase size={32} />,
    title: "Executive Assistance",
    description: "Professional administrative support to keep your business running smoothly and efficiently.",
    serviceItems: [
      { icon: <CalendarDays size={18}/>, text: "Calendar & Schedule Management" },
      { icon: <Mail size={18}/>, text: "Email Management & Correspondence" },
      { icon: <Plane size={18}/>, text: "Travel Arrangements" },
      { icon: <FileText size={18}/>, text: "Document Preparation" },
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
    learnMoreLink: "/#services", // Placeholder, create /services/social-media later
  },
  {
    mainIcon: <Palette size={32} />,
    title: "Graphic Design Support",
    description: "Creative design solutions to enhance your brand's visual identity and marketing materials.",
    serviceItems: [
      { icon: <ImageIconLucide size={18}/>, text: "Social Media Graphics" },
      { icon: <Presentation size={18}/>, text: "Presentation Design" },
      { icon: <FileTextIcon size={18}/>, text: "Marketing Material Layouts" },
      { icon: <PaletteIcon size={18}/>, text: "Basic Brand Asset Creation" },
    ],
    learnMoreLink: "/#services", // Placeholder, create /services/graphic-design later
  },
];

const features = [
  {
    icon: <Zap size={28} />,
    title: "Boost Your Productivity",
    description: "Our VAs handle time-consuming tasks, allowing you to focus on core business activities and strategic growth.",
  },
  {
    icon: <PackageCheck size={28} />,
    title: "Access Specialized Skills",
    description: "Tap into a wide range of expertise, from administrative support to social media and design, without hiring full-time.",
  },
  {
    icon: <Users2 size={28} />,
    title: "Flexible & Scalable Support",
    description: "Adjust your VA services as your business needs change, ensuring you always have the right level of support.",
  },
];

const improvedCopyData = {
  originalTitle: "Need Help With Your Tasks?",
  originalText: "Our virtual assistants can do many things for your business. They are good at managing tasks and can help you every day.",
  improvedTitle: "Unlock Peak Efficiency with Expert Virtual Assistance",
  improvedText: "Tiny Tasks empowers your business by connecting you with skilled virtual assistants. We streamline your operations, manage critical tasks, and provide dedicated support, freeing you to concentrate on high-impact activities and achieve your strategic objectives.",
  aiTextForImage: "A visual metaphor of a key unlocking a complex gear system, symbolizing how virtual assistants unlock business efficiency and smooth operations. Use a clean, modern style.",
};

const ctaSectionData = {
  title: "Ready to Delegate, Grow, and Thrive?",
  text: "Partner with Tiny Tasks and discover the power of expert virtual assistance. Let's discuss your needs and tailor a solution that propels your business forward. Get started today!",
  aiTextForImage: "An inspiring image of diverse business professionals collaborating effectively, with subtle digital network lines connecting them, symbolizing teamwork and VA support fostering growth.",
};

const toolsData = {
  title: "Tools We Master for Your Success",
  description: "Our virtual assistants are proficient with a wide array of industry-standard tools to seamlessly integrate into your workflows and boost productivity.",
  categories: [
    {
      name: "Communication",
      icon: <MessageSquareIcon size={24} className="text-accent" />,
      tools: [
        { name: "Skype", icon: <Phone size={18} /> },
        { name: "Zoom", icon: <Video size={18} /> },
        { name: "Microsoft Teams", icon: <Users size={18} /> },
        { name: "Slack", icon: <Slack size={18} /> },
      ],
    },
    {
      name: "Calendar Management",
      icon: <CalendarDays size={24} className="text-accent" />,
      tools: [
        { name: "Calendly", icon: <CalendarDays size={18} /> },
        { name: "Google Calendar", icon: <CalendarDays size={18} /> },
      ],
    },
    {
      name: "Email Management",
      icon: <Mail size={24} className="text-accent" />,
      tools: [{ name: "Zoho Mail", icon: <Mail size={18} /> }],
    },
    {
      name: "Social Media",
      icon: <Share2 size={24} className="text-accent" />,
      tools: [
        { name: "Canva", icon: <PaletteIcon size={18} /> },
        { name: "Meta Business Suite", icon: <MonitorSmartphone size={18} /> },
      ],
    },
    {
      name: "Project Management",
      icon: <ListChecks size={24} className="text-accent" />,
      tools: [
        { name: "Notion", icon: <FileTextIcon size={18} /> },
        { name: "Trello", icon: <Trello size={18} /> },
        { name: "Todoist", icon: <CheckSquare size={18} /> },
      ],
    },
  ],
  aiTextForImage: "A dynamic collage of popular business software logos (like Slack, Zoom, Google Calendar, Trello, Canva) arranged neatly, symbolizing a VA's toolkit.",
};

const pricingData = {
  title: "Flexible Pricing for Every Need",
  description: "Choose a plan that fits your business goals and budget. All prices are in Kenyan Shillings (KES). Note: These are example prices, please update with your actual rates.",
  tiers: [
    {
      tier: "Essential VA Support",
      price: "KES 15,000/month",
      description: "Perfect for individuals or small businesses needing core administrative help.",
      features: ["10 hours of VA support", "Basic Admin Tasks", "Email Management (limited)", "Scheduling Assistance"],
      isPopular: false,
    },
    {
      tier: "Growth VA Package",
      price: "KES 35,000/month",
      description: "Ideal for growing businesses needing consistent, broader support.",
      features: ["25 hours of VA support", "Advanced Admin Tasks", "Social Media Scheduling", "Calendar Management", "Client Communication"],
      isPopular: true,
    },
    {
      tier: "Premium VA Partnership",
      price: "KES 60,000/month",
      description: "Comprehensive support for established businesses and executives.",
      features: ["50 hours of VA support", "Dedicated VA", "Project Management Support", "Graphic Design Basics", "Full Email & Calendar Control", "Priority Support"],
      isPopular: false,
    },
  ],
  aiTextForImage: "Three distinct pricing plan cards with Kenyan Shilling currency symbols, showcasing different levels of virtual assistant services. Clean, modern, and trustworthy design.",
};

const testimonialsData = {
  title: "Hear From Our Happy Clients",
  description: "Discover how Tiny Tasks has helped businesses like yours save time, reduce stress, and achieve their goals.",
  reviews: [
    { name: "Aisha K.", role: "Founder, Bloom Creatives", testimonial: "Tiny Tasks revolutionized how I manage my workload. My VA is proactive, efficient, and a true asset to my business!", avatarFallback: "AK", rating: 5 },
    { name: "David M.", role: "Consultant, Peak Solutions", testimonial: "The onboarding was seamless, and my assistant got up to speed incredibly fast. I can finally focus on strategy instead of being bogged down in admin.", avatarFallback: "DM", rating: 5 },
    { name: "Sarah L.", role: "E-commerce Store Owner", testimonial: "From social media to customer support, my VA handles it all. Sales are up, and my stress levels are way down. Highly recommend!", avatarFallback: "SL", rating: 4 },
  ],
  aiTextForImage: "A diverse group of happy business professionals looking at a screen or interacting positively, with speech bubbles indicating positive feedback. Warm and trustworthy feel.",
};

const blogIntroData = {
  title: "Insights & Productivity Tips",
  description: "Explore our latest articles for expert advice on virtual assistance, business growth, and mastering your workday.",
  aiTextForImage: "An open notebook with a pen and a cup of coffee, with icons representing ideas and learning, symbolizing a blog or knowledge sharing.",
};

// Helper function to generate image sections and handle errors
async function safeGenerateImage(sectionId: string, text: string): Promise<GenerateImageSectionsOutput | null> {
  try {
    // Adding a small delay to slightly stagger individual calls within a Promise.all, though Promise.all itself parallelizes.
    // This is a minor attempt and might not fully resolve strict rate limits.
    // await new Promise(resolve => setTimeout(resolve, 50)); 
    return await generateImageSections({ sectionText: text });
  } catch (err) {
    console.error(`Failed to generate image for ${sectionId}:`, err);
    return null;
  }
}

export default async function HomePage() {
  // Fetch images in smaller, sequential batches
  const [heroImage, onboardingOverviewImage] = await Promise.all([
    safeGenerateImage('hero', sectionsData.find(s => s.id === 'hero')?.aiTextForImage || sectionsData.find(s => s.id === 'hero')?.text || ''),
    safeGenerateImage('onboarding-overview', sectionsData.find(s => s.id === 'onboarding-overview')?.aiTextForImage || sectionsData.find(s => s.id === 'onboarding-overview')?.text || ''),
  ]);

  const [featuresImage, servicesIntroImage] = await Promise.all([
    safeGenerateImage('features', `Features overview showcasing streamlined processes, expert task management, and dedicated assistant partnerships for virtual assistants. ${features.map(f => `${f.title}: ${f.description}`).join(' ')}`),
    safeGenerateImage('services-intro', `Overview of virtual assistant services including executive assistance, social media management, and graphic design, emphasizing comprehensive business support. ${services.map(s => `${s.title}: ${s.description} ${s.serviceItems.map(si => si.text).join(', ')}`).join('; ')}`),
  ]);
  
  const [improvedCopyImage, toolsImage] = await Promise.all([
    safeGenerateImage('improved-copy', improvedCopyData.aiTextForImage),
    safeGenerateImage('tools', toolsData.aiTextForImage),
  ]);

  const [pricingImage, testimonialsImage] = await Promise.all([
    safeGenerateImage('pricing', pricingData.aiTextForImage),
    safeGenerateImage('testimonials', testimonialsData.aiTextForImage),
  ]);

  const [blogIntroImage, ctaImage] = await Promise.all([
    safeGenerateImage('blog-intro', blogIntroData.aiTextForImage),
    safeGenerateImage('cta', ctaSectionData.aiTextForImage),
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
            {featuresImage && (
               <div className="mt-12 max-w-3xl mx-auto">
                 <AiImageSection
                    title="Visually Unified Experience"
                    text="Our AI helps select imagery that complements our features, ensuring a cohesive and engaging user experience across the platform when highlighting our VA capabilities."
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
              Comprehensive VA solutions designed to streamline your business operations, manage your tasks effectively, and free up your valuable time so you can focus on strategic growth.
            </p>
            {servicesIntroImage && (
              <div className="mb-12 md:mb-16 max-w-4xl mx-auto">
                <AiImageSection
                  title="Expert VA Support Tailored For You"
                  text="Our virtual assistants offer a wide array of services. We match you with skilled VAs ready to tackle your specific business needs and challenges."
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
                  learnMoreLink={service.learnMoreLink}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* Improved Copy Display Section */}
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
                {improvedCopyImage && (
                    <div className="mt-12 max-w-2xl mx-auto">
                         <AiImageSection
                            title="Visualizing Our VA Commitment"
                            text="AI helps us select visuals that underscore our dedication to providing impactful and efficient virtual assistant solutions for your business."
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

        {/* Tools Section */}
        <section id="tools" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <BotMessageSquare className="h-12 w-12 text-accent mx-auto mb-4" />
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                {toolsData.title}
              </h2>
              <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                {toolsData.description}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {toolsData.categories.map((category) => (
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
             {toolsImage && (
              <div className="mt-12 max-w-3xl mx-auto">
                <AiImageSection
                  title="Our Versatile Toolkit"
                  text="We leverage the best tools to deliver exceptional virtual assistance, ensuring seamless collaboration and top-notch results for your projects."
                  aiImage={toolsImage}
                  imagePlacement="right"
                  className="py-0"
                  titleClassName="text-3xl text-center md:text-left"
                  textClassName="text-center md:text-left"
                />
              </div>
            )}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 bg-secondary/50">
          <div className="container mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <Lightbulb className="h-12 w-12 text-accent mx-auto mb-4" />
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                {pricingData.title}
              </h2>
              <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                {pricingData.description}
              </p>
            </div>
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {pricingData.tiers.map((tier) => (
                <PricingCard
                  key={tier.tier}
                  tier={tier.tier}
                  price={tier.price}
                  description={tier.description}
                  features={tier.features}
                  isPopular={tier.isPopular}
                />
              ))}
            </div>
            {pricingImage && (
              <div className="mt-16 max-w-4xl mx-auto">
                <AiImageSection
                  title="Transparent VA Pricing"
                  text="Our AI-assisted visual design helps present our virtual assistant pricing plans clearly, ensuring you find the perfect fit for your business needs."
                  aiImage={pricingImage}
                  imagePlacement="left"
                  className="py-0"
                  titleClassName="text-3xl text-center md:text-left"
                  textClassName="text-center md:text-left"
                />
              </div>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <Users2 className="h-12 w-12 text-accent mx-auto mb-4" />
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                {testimonialsData.title}
              </h2>
              <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                {testimonialsData.description}
              </p>
            </div>
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
              {testimonialsData.reviews.map((review) => (
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
            {testimonialsImage && (
              <div className="mt-16 max-w-3xl mx-auto">
                <AiImageSection
                  title="Client Success Stories"
                  text="Visually representing client satisfaction, our AI helps choose images that reflect the positive impact of our virtual assistant services."
                  aiImage={testimonialsImage}
                  imagePlacement="right"
                  className="py-0"
                  titleClassName="text-3xl text-center md:text-left"
                  textClassName="text-center md:text-left"
                />
              </div>
            )}
          </div>
        </section>

         {/* Blog Intro Section */}
        <section id="blog-intro" className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                  {blogIntroData.title}
                </h2>
                <p className="text-lg text-foreground/80 mb-6 leading-relaxed">
                  {blogIntroData.description}
                </p>
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/blog">
                    Explore Our Blog <Rocket className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              {blogIntroImage && (
                <div className="mt-8 md:mt-0">
                  <AiImageSection
                    title=""
                    text=""
                    aiImage={blogIntroImage}
                    imagePlacement="right" 
                    className="py-0 !shadow-none"
                    titleClassName="hidden"
                    textClassName="hidden" 
                    imageContainerClassName="max-w-md ml-auto"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Call to Action Section with Contact Form */}
        <section id="cta" className="py-20 md:py-28 bg-gradient-to-r from-primary to-blue-800 text-primary-foreground">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div>
                    <h2 className="font-headline text-4xl md:text-5xl font-bold !text-primary-foreground mb-4">
                        {ctaSectionData.title}
                    </h2>
                    <p className="text-lg !text-primary-foreground/90 leading-relaxed mb-8">
                        {ctaSectionData.text}
                    </p>
                    <ContactForm />
                </div>
                {ctaImage && (
                    <div className="hidden md:flex justify-center items-center">
                         <AiImageSection
                            title=""
                            text=""
                            aiImage={ctaImage}
                            imagePlacement="right"
                            className="py-0 !bg-transparent !shadow-none"
                            titleClassName="hidden"
                            textClassName="hidden"
                            imageContainerClassName="!p-0"
                        />
                    </div>
                )}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}

    