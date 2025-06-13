
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GenerateImageSectionsOutput } from '@/ai/flows/generate-image-sections';

interface AiImageSectionProps {
  title: string;
  text: string;
  aiImage: GenerateImageSectionsOutput | null;
  imagePlacement?: 'left' | 'right';
  children?: React.ReactNode; 
  className?: string;
  titleClassName?: string;
  textClassName?: string;
  imageContainerClassName?: string;
  contentContainerClassName?: string; // New prop for content alignment
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
  contentContainerClassName,
}: AiImageSectionProps) {
  const imageWidth = 500;
  const imageHeight = 350;

  const imageKeywords = aiImage?.imageDescription 
    ? aiImage.imageDescription.split(' ').slice(0, 2).join(' ') 
    : 'abstract design';

  const contentOrder = imagePlacement === 'left' ? 'md:order-last' : '';
  const imageOrder = imagePlacement === 'left' ? 'md:order-first' : '';

  return (
    <section className={cn('py-12 md:py-20', className)}>
      <div className="container mx-auto">
        <div
          className={cn(
            'grid md:grid-cols-2 gap-8 md:gap-12 items-center'
          )}
        >
          <div className={cn('space-y-6', contentOrder, contentContainerClassName)}>
            {title && (
              <h2 className={cn('font-headline text-4xl md:text-5xl font-bold text-primary', titleClassName)}>
                {title}
              </h2>
            )}
            {text && (
              <p className={cn('text-lg text-foreground/80 leading-relaxed', textClassName)}>
                {text}
              </p>
            )}
            {children}
          </div>
          <div className={cn(
              'flex justify-center items-center',
              imageOrder,
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
                    className="object-cover w-full h-auto aspect-[500/350]"
                    data-ai-hint={imageKeywords}
                    priority={imagePlacement === 'right' && title.toLowerCase().includes('hero')} 
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
                className={`w-full max-w-lg bg-muted rounded-xl shadow-lg flex items-center justify-center`}
                style={{aspectRatio: `${imageWidth}/${imageHeight}`, minHeight: `auto`}} // Use aspect ratio
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
