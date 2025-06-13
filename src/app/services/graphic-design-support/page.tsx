
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowLeft, Palette as PaletteIcon, Image as ImageIcon, Presentation, FileText as FileTextIcon, 
  Brush, LayoutGrid, Video, ShoppingCart 
} from 'lucide-react';
import { AiImageSection, AiImageInfo } from '@/components/ui/ai-image-section';

export default function GraphicDesignSupportPage() {
  
  const graphicDesignImageInfo: AiImageInfo = { 
    imageDataURI: null, 
    description: "A creative and modern visual showcasing various graphic design elements like color palettes, typography, and illustrations, representing professional design services.",
    placeholderHint: "graphic design creative" 
  };

  const tasks = [
    { icon: <ImageIcon size={20} />, text: "Social Media Graphics & Templates" },
    { icon: <Presentation size={20} />, text: "Presentation Design & Enhancement" },
    { icon: <FileTextIcon size={20} />, text: "Marketing Collateral (Flyers, Brochures - Basic Layout)" },
    { icon: <PaletteIcon size={20} />, text: "Brand Asset Creation (Logos, Color Palettes - Simple)" },
    { icon: <Brush size={20} />, text: "Basic Photo Editing & Retouching" },
    { icon: <LayoutGrid size={20} />, text: "Infographic Design (Simple)" },
    { icon: <Video size={20} />, text: "Short Video/Reel Graphics (Static elements)" },
    { icon: <ShoppingCart size={20} />, text: "E-commerce Product Image Enhancements (Basic)" },
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
                Creative Graphic Design Support
            </h1>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                Bring your brand to life with stunning visuals. Our graphic design support services provide creative solutions for your marketing materials, social media presence, presentations, and more, ensuring a consistent and impactful brand identity.
            </p>
        </div>

        <div className="mb-12 md:mb-16 max-w-4xl mx-auto">
          <AiImageSection
            title=""
            text=""
            imageInfo={graphicDesignImageInfo}
            imagePlacement="right"
            className="py-0 !pt-0"
            titleClassName="hidden" 
            textClassName="hidden"
          />
        </div>

        <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl text-primary mb-8 text-center md:text-left">Our Design Capabilities</h2>
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
                <Link href="/auth">Elevate Your Brand Visually</Link>
            </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
