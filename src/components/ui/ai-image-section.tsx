import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GenerateImageSectionsOutput } from '@/ai/flows/generate-image-sections';

interface AiImageSectionProps {
  title: string;
  text: string;
  aiImage: GenerateImageSectionsOutput | null;
  imagePlacement?: 'left' | 'right';
  children?: React.ReactNode; // For additional content like buttons
  className?: string;
  titleClassName?: string;
  textClassName?: string;
  imageContainerClassName?: string;
}

export function AiImageSection({
  title,
  text,
  aiImage,
  imagePlacement = 'right',
  children,
  className,
  titleClassName,
  textClassName,
  imageContainerClassName,
}: AiImageSectionProps) {
  const imageWidth = 500;
  const imageHeight = 350;

  const imageKeywords = aiImage?.imageDescription 
    ? aiImage.imageDescription.split(' ').slice(0, 2).join(' ') 
    : 'abstract design';

  return (
    <section className={cn('py-12 md:py-20', className)}>
      <div className="container mx-auto">
        <div
          className={cn(
            'grid md:grid-cols-2 gap-8 md:gap-12 items-center',
            imagePlacement === 'left' ? 'md:grid-flow-col-dense' : ''
          )}
        >
          <div className={cn(imagePlacement === 'left' ? 'md:col-start-1' : 'md:col-start-1', 'space-y-6')}>
            <h2 className={cn('font-headline text-4xl md:text-5xl font-bold text-primary', titleClassName)}>
              {title}
            </h2>
            <p className={cn('text-lg text-foreground/80 leading-relaxed', textClassName)}>
              {text}
            </p>
            {children}
          </div>
          <div className={cn(
              imagePlacement === 'left' ? 'md:col-start-2' : 'md:col-start-2',
              'flex justify-center items-center',
              imageContainerClassName
            )}>
            {aiImage ? (
              <Card className="overflow-hidden shadow-2xl rounded-xl w-full max-w-lg transform hover:scale-105 transition-transform duration-300">
                <CardContent className="p-0">
                  <Image
                    src={`https://placehold.co/${imageWidth}x${imageHeight}.png`}
                    alt={aiImage.imageDescription}
                    width={imageWidth}
                    height={imageHeight}
                    className="object-cover w-full h-auto"
                    data-ai-hint={imageKeywords}
                    priority={imagePlacement === 'right'} // Example: prioritize hero image if it's on the right initially
                  />
                  <div className="p-4 bg-muted/50">
                    <p className="text-xs text-muted-foreground italic">
                      AI Suggested Image Type: {aiImage.imageType}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div 
                className={`w-full max-w-lg h-[${imageHeight}px] bg-muted rounded-xl shadow-lg flex items-center justify-center`}
                style={{minHeight: `${imageHeight}px`}}
              >
                <p className="text-muted-foreground">Image loading...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
