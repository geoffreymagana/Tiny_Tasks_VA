
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, UserPlus, Zap, MessageSquareHeart } from 'lucide-react';
import { AiImageSection, AiImageInfo } from '@/components/ui/ai-image-section'; // Updated import
import { generateImageSections } from '@/ai/flows/generate-image-sections';
import { generateDescribedImage } from '@/ai/flows/generate-described-image-flow'; // New import

export default async function OnboardingStepsPage() {
  const pageContentText = "Step 1: Discovery Call. We start with a friendly chat to learn about your business, challenges, and the specific tasks you'd like to delegate. This helps us understand your goals and how our virtual assistants can best support you. Step 2: Assistant Matching. Based on your requirements, we meticulously match you with a virtual assistant whose skills and experience align perfectly with your needs. Step 3: Integration & Kick-off. We facilitate a smooth integration of your new VA into your existing workflows and tools. Step 4: Ongoing Support & Feedback. Our commitment doesn't end once you're onboarded. We provide ongoing support and regularly check in.";
  
  let onboardingImageInfo: AiImageInfo | null = null;
  const aiPromptForDescription = `Visual representation of a smooth and collaborative onboarding process for virtual assistant services, emphasizing clarity and partnership. ${pageContentText}`;

  try {
    const descriptionResult = await generateImageSections({ sectionText: aiPromptForDescription });
    let description: string | null = null;
    let imageType: string | null = null;
    let imageDataURI: string | null = null;

    if (descriptionResult?.imageDescription) {
      description = descriptionResult.imageDescription;
      imageType = descriptionResult.imageType;
      
      const imageGenResult = await generateDescribedImage({ imageDescription: description });
      if (imageGenResult?.imageDataURI) {
        imageDataURI = imageGenResult.imageDataURI;
      } else {
        console.warn(`Actual image generation failed for onboarding page. Description was: "${description}"`);
      }
    } else {
      console.warn(`No image description generated for onboarding page. Using prompt substring as fallback description.`);
      description = aiPromptForDescription.substring(0,100);
    }
    onboardingImageInfo = { imageDataURI, description, imageType };

  } catch (err) {
    console.error("Failed to generate image info for onboarding page:", err);
    onboardingImageInfo = { imageDataURI: null, description: aiPromptForDescription.substring(0,100), imageType: null };
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto py-12 md:py-20">
        <div className="mb-8">
          <Button variant="outline" asChild>
            <Link href="/#onboarding-overview">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-12 text-center">
          Our Seamless Onboarding Process
        </h1>

        {onboardingImageInfo && (
          <div className="mb-12 md:mb-16 max-w-3xl mx-auto">
            <AiImageSection
              title=""
              text="We guide you every step of the way to ensure a successful partnership with your virtual assistant."
              imageInfo={onboardingImageInfo}
              imagePlacement="right"
              className="py-0 !pt-0"
              titleClassName="hidden"
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="p-6 border rounded-xl shadow-lg bg-card hover:shadow-xl transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UserPlus size={24} />
              </div>
              <div>
                <h2 className="font-headline text-2xl text-primary mb-2">Step 1: Discovery Call</h2>
                <p className="text-foreground/80">We start with a friendly chat to learn about your business, challenges, and the specific tasks you'd like to delegate. This helps us understand your goals and how our virtual assistants can best support you.</p>
              </div>
            </div>
          </div>

          <div className="p-6 border rounded-xl shadow-lg bg-card hover:shadow-xl transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <div>
                <h2 className="font-headline text-2xl text-primary mb-2">Step 2: Assistant Matching</h2>
                <p className="text-foreground/80">Based on your requirements, we meticulously match you with a virtual assistant whose skills and experience align perfectly with your needs. We ensure a great fit for a productive long-term partnership.</p>
              </div>
            </div>
          </div>

          <div className="p-6 border rounded-xl shadow-lg bg-card hover:shadow-xl transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="font-headline text-2xl text-primary mb-2">Step 3: Integration & Kick-off</h2>
                <p className="text-foreground/80">We facilitate a smooth integration of your new VA into your existing workflows and tools. A kick-off meeting is scheduled to set expectations, define communication channels, and get started on your tasks.</p>
              </div>
            </div>
          </div>

          <div className="p-6 border rounded-xl shadow-lg bg-card hover:shadow-xl transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquareHeart size={24} />
              </div>
              <div>
                <h2 className="font-headline text-2xl text-primary mb-2">Step 4: Ongoing Support & Feedback</h2>
                <p className="text-foreground/80">Our commitment doesn't end once you're onboarded. We provide ongoing support and regularly check in to ensure you're satisfied with our services. We value your feedback for continuous improvement.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-12 md:mt-16">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
                <Link href="/#cta">Begin Your VA Partnership</Link>
            </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
