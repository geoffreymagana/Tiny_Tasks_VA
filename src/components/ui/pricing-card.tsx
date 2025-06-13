
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PricingCardProps {
  tier: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

export function PricingCard({ tier, price, description, features, isPopular = false, ctaText = "Get Started", ctaLink = "/#cta" }: PricingCardProps) {
  return (
    <Card className={cn(
      'shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col',
      isPopular ? 'border-2 border-accent transform scale-105' : 'border-border'
    )}>
      {isPopular && (
        <div className="bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider text-center py-1.5 rounded-t-md">
          Most Popular
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl text-primary">{tier}</CardTitle>
        <p className="text-4xl font-bold text-accent my-2">{price}</p>
        <CardDescription className="text-foreground/70">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-foreground/80">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild size="lg" className={cn('w-full', isPopular ? 'bg-accent hover:bg-accent/90' : 'bg-primary hover:bg-primary/90')}>
          <Link href={ctaLink}>{ctaText}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
