
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowLeft, Share2, PenSquare, Users2, BarChartBig, Megaphone, 
  CalendarDays, TrendingUp, MessageCircle as MessageCircleIcon 
} from 'lucide-react';
import { AiImageSection, AiImageInfo } from '@/components/ui/ai-image-section';

export default function SocialMediaManagementPage() {
  
  const socialMediaImageInfo: AiImageInfo = { 
    imageDataURI: null, 
    description: "A dynamic and engaging visual representing social media strategy, content creation, and audience interaction for brand growth.",
    placeholderHint: "social media strategy" 
  };

  const tasks = [
    { icon: <PenSquare size={20} />, text: "Content Strategy & Creation" },
    { icon: <CalendarDays size={20} />, text: "Content Scheduling & Posting" },
    { icon: <Users2 size={20} />, text: "Community Engagement & Management" },
    { icon: <Megaphone size={20} />, text: "Social Media Advertising Campaigns" },
    { icon: <BarChartBig size={20} />, text: "Performance Analytics & Reporting" },
    { icon: <TrendingUp size={20} />, text: "Trend Monitoring & Adaptation" },
    { icon: <MessageCircleIcon size={20} />, text: "Direct Message & Comment Handling" },
    { icon: <Share2 size={20} />, text: "Influencer Outreach & Collaboration (Basic)" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto py-12 md:py-20">
        <div className="mb-8">
          <Button variant="outline" asChild>
            <Link href="/#services">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
            </Link>
          </Button>
        </div>
        
        <div className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                Strategic Social Media Management
            </h1>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                Elevate your brand's online presence with our comprehensive social media management services. We create engaging content, foster community interaction, and drive meaningful results to help your business connect and grow.
            </p>
        </div>

        <div className="mb-12 md:mb-16 max-w-4xl mx-auto">
          <AiImageSection
            title=""
            text=""
            imageInfo={socialMediaImageInfo}
            imagePlacement="right"
            className="py-0 !pt-0"
            titleClassName="hidden" 
            textClassName="hidden"
          />
        </div>

        <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl text-primary mb-8 text-center md:text-left">How We Amplify Your Brand</h2>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                {tasks.map(task => (
                    <div key={task.text} className="flex items-start p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center mr-4">
                            {task.icon}
                        </div>
                        <p className="text-foreground/90">{task.text}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="text-center mt-12 md:mt-16">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
                <Link href="/auth">Boost Your Social Presence</Link>
            </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
