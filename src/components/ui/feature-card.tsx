import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <Card className={cn('text-center shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1', className)}>
      <CardHeader className="flex flex-col items-center">
        <div className="mb-4 p-3 bg-accent/20 rounded-full text-accent">
          {icon}
        </div>
        <CardTitle className="font-headline text-2xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/80">{description}</p>
      </CardContent>
    </Card>
  );
}
