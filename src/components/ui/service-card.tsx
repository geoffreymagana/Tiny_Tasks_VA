
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

interface ServiceItem {
  icon: React.ReactNode;
  text: string;
}

interface ServiceCardProps {
  mainIcon: React.ReactNode;
  title: string;
  description: string;
  serviceItems: ServiceItem[];
  className?: string;
}

export function ServiceCard({ mainIcon, title, description, serviceItems, className }: ServiceCardProps) {
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
        <ul className="space-y-2">
          {serviceItems.map((item, index) => (
            <li key={index} className="flex items-center text-foreground/80">
              <span className="mr-2 text-accent">{item.icon}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
