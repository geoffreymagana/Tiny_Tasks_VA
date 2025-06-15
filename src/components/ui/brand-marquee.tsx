
"use client";

import type { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BrandLogoItem } from '@/app/admin/cms/actions'; // Ensure this path is correct

interface BrandMarqueeProps {
  logos: BrandLogoItem[];
  className?: string;
}

export const BrandMarquee: FC<BrandMarqueeProps> = ({ logos, className }) => {
  if (!logos || logos.length === 0) {
    return null;
  }

  return (
    <div className={cn("py-8 md:py-12 bg-secondary/30", className)}>
      <div className="container mx-auto">
        {/* Optional: Add a title for the marquee section if not handled by AiImageSection above it
        <h3 className="text-2xl font-semibold text-center text-primary mb-8">Our Valued Clients & Partners</h3> 
        */}
        <div className="overflow-x-auto pb-4 -mb-4">
          <div className="flex space-x-8 md:space-x-12 items-center justify-start md:justify-center">
            {logos.map((logo) => (
              <div key={logo.id || logo.name} className="flex-shrink-0">
                {logo.websiteUrl ? (
                  <Link href={logo.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${logo.name}`}>
                    <Image
                      src={logo.logoUrl}
                      alt={`${logo.name} logo`}
                      width={120} // Adjust for desired logo size
                      height={60} // Adjust for desired logo size
                      className="object-contain h-10 md:h-12 filter grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  </Link>
                ) : (
                  <Image
                    src={logo.logoUrl}
                    alt={`${logo.name} logo`}
                    width={120}
                    height={60}
                    className="object-contain h-10 md:h-12 filter grayscale"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
