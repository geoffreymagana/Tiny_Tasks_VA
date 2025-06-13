
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
// Removed GenerateImageSectionsOutput import as it's replaced by AiImageInfo

export interface AiImageInfo {
  imageDataURI: string | null;
  description: string | null; // For alt text and data-ai-hint
  imageType: string | null; // Optional: To display 'AI Suggested Image Type' if needed
}

interface AiImageSectionProps {
  title: string;
  text: string;
  imageInfo: AiImageInfo | null;
  imagePlacement?: 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  textClassName?: string;
  imageContainerClassName?: string;
  contentContainerClassName?: string;
}

export function AiImageSection({
  title,
  text,
  imageInfo,
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

  const imageAlt = imageInfo?.description || title || 'AI generated image';
  const imageHintKeywords = imageInfo?.description
    ? imageInfo.description.split(' ').slice(0, 2).join(' ')
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
            {imageInfo?.imageDataURI ? (
              <Card className="overflow-hidden shadow-2xl rounded-xl w-full max-w-lg transform hover:scale-105 transition-transform duration-300">
                <CardContent className="p-4"> {/* Added padding here */}
                  <Image
                    src={imageInfo.imageDataURI}
                    alt={imageAlt}
                    width={imageWidth}
                    height={imageHeight}
                    className="object-cover w-full h-auto aspect-[500/350] rounded-md" // Added rounded-md if desired within padding
                    data-ai-hint={imageHintKeywords}
                    priority={imagePlacement === 'right' && title.toLowerCase().includes('hero')}
                  />
                  {imageInfo.imageType && (
                    <p className="mt-2 text-xs text-muted-foreground italic text-center">
                      Suggested type: {imageInfo.imageType}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card 
                className={`w-full max-w-lg bg-card rounded-xl shadow-lg flex items-center justify-center p-4`} // Added p-4 for consistency
                style={{aspectRatio: `${imageWidth}/${imageHeight}`, minHeight: `auto`}}
              >
                <div className="text-center">
                  <p className="text-muted-foreground">{imageInfo?.description ? `Generating image for: "${imageInfo.description.substring(0,50)}..."` : 'Image loading...'}</p>
                  {imageInfo?.description && !imageInfo.imageDataURI && (
                     <p className="text-xs text-muted-foreground italic mt-1">Image generation might take a moment or has failed.</p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
