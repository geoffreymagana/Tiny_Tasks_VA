
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Briefcase, CalendarClock, Mail, Settings, Users, FileText, Plane, PresentationChart, CheckSquare } from 'lucide-react';
import { AiImageSection, AiImageInfo } from '@/components/ui/ai-image-section';

export default function ExecutiveAssistancePage() { // Removed async
  const pageContentText = "Focus on your core business activities while our expert Executive Assistants handle your administrative, organizational, and technical tasks with precision and professionalism. We provide comprehensive support to streamline your workflow and boost your productivity. Our services include calendar management, email correspondence, travel arrangements, document preparation, meeting coordination, and much more, tailored to your specific needs.";
  
  const executiveAssistanceImageInfo: AiImageInfo = { 
    imageDataURI: null, 
    description: "Professional executive assistant organizing tasks and managing schedules efficiently in a modern office environment. Emphasize competence and reliability.",
    placeholderHint: "executive assistant office" 
  };

  const tasks = [
    { icon: <CalendarClock size={20} />, text: "Calendar & Schedule Management" },
    { icon: <Mail size={20} />, text: "Email Triage & Correspondence" },
    { icon: <Plane size={20} />, text: "Travel Planning & Booking" },
    { icon: <FileText size={20} />, text: "Document Preparation & Management" },
    { icon: <PresentationChart size={20} />, text: "Presentation Design & Support" },
    { icon: <Settings size={20} />, text: "Meeting Coordination & Minute Taking" },
    { icon: <Briefcase size={20} />, text: "Client & Stakeholder Communication" },
    { icon: <Users size={20} />, text: "CRM & Database Management" },
    { icon: <CheckSquare size={20} />, text: "Task & Project Tracking" },
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
                Expert Executive Assistance
            </h1>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                Delegate your administrative burden and reclaim your time with our professional executive assistant services. We handle the details so you can focus on strategic growth.
            </p>
        </div>

        <div className="mb-12 md:mb-16 max-w-4xl mx-auto">
          <AiImageSection
            title=""
            text=""
            imageInfo={executiveAssistanceImageInfo}
            imagePlacement="right"
            className="py-0 !pt-0"
            titleClassName="hidden" 
            textClassName="hidden"
          />
        </div>

        <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl text-primary mb-8 text-center md:text-left">How We Support You</h2>
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
                <Link href="/auth">Get Executive Support Today</Link>
            </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
