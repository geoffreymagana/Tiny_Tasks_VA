
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ServiceItem {
  icon: React.ReactNode;
  text: string;
}

interface ServiceCardProps {
  mainIcon: React.ReactNode;
  title: string;
  description: string;
  serviceItems: ServiceItem[];
  learnMoreLink?: string;
  className?: string;
}

export function ServiceCard({ mainIcon, title, description, serviceItems, learnMoreLink, className }: ServiceCardProps) {
  return (
    <Card className={cn('text-left shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1 flex flex-col', className)}>
      <CardHeader className="flex flex-col items-start">
        <div className="mb-4 p-3 bg-accent/20 rounded-full text-accent">
          {mainIcon}
        </div>
        <CardTitle className="font-headline text-2xl text-primary">{title}</CardTitle>
        <CardDescription className="text-foreground/70 mt-1">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-2 mb-6">
          {serviceItems.map((item, index) => (
            <li key={index} className="flex items-center text-foreground/80">
              <span className="mr-2 text-accent">{item.icon}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </CardContent>
      {learnMoreLink && (
        <div className="p-6 pt-0 mt-auto">
          <Button asChild variant="outline" className="w-full">
            <Link href={learnMoreLink}>
              Learn More <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </Card>
  );
}
