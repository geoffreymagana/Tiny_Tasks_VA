
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface AiImageInfo {
  imageDataURI?: string | null; // Made optional for when it's not generated
  description: string | null;
  imageType?: string | null;
  placeholderHint?: string; // New prop for placeholder.co hint
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

  const imageAlt = imageInfo?.description || title || 'Placeholder image';
  
  // Prioritize placeholderHint, then description, then a generic hint
  const hintDescription = imageInfo?.placeholderHint || imageInfo?.description || "website section";
  const imageHintKeywords = hintDescription
    ? hintDescription.split(' ').slice(0, 2).join(' ')
    : 'abstract design';
  
  const placeholderImageUrl = `https://placehold.co/${imageWidth}x${imageHeight}.png`;

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
                <CardContent className="p-4">
                  <Image
                    src={imageInfo.imageDataURI}
                    alt={imageAlt}
                    width={imageWidth}
                    height={imageHeight}
                    className="object-cover w-full h-auto aspect-[500/350] rounded-md"
                    data-ai-hint={imageHintKeywords} // Still useful if admin replaces it later
                    priority={imagePlacement === 'right' && title.toLowerCase().includes('hero')}
                  />
                  {imageInfo.imageType && (
                    <p className="mt-2 text-xs text-muted-foreground italic text-center">
                      Suggested type (for AI generation): {imageInfo.imageType}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Always show placeholder if no imageDataURI
              <Card 
                className={`w-full max-w-lg bg-card rounded-xl shadow-lg flex items-center justify-center p-4`}
                style={{aspectRatio: `${imageWidth}/${imageHeight}`, minHeight: `auto`}}
              >
                <Image
                    src={placeholderImageUrl}
                    alt={imageAlt}
                    width={imageWidth}
                    height={imageHeight}
                    className="object-cover w-full h-auto aspect-[500/350] rounded-md"
                    data-ai-hint={imageHintKeywords}
                  />
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
