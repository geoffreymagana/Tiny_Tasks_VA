
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  name: string;
  role: string;
  testimonial: string;
  avatarSrc?: string;
  avatarFallback: string;
  rating?: number;
}

export function TestimonialCard({ name, role, testimonial, avatarSrc, avatarFallback, rating = 5 }: TestimonialCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card p-6 rounded-xl">
      <CardContent className="p-0">
        {rating > 0 && (
          <div className="flex mb-3">
            {Array.from({ length: rating }).map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            ))}
            {Array.from({ length: 5 - rating }).map((_, i) => (
              <Star key={i+rating} className="h-5 w-5 text-yellow-400" />
            ))}
          </div>
        )}
        <p className="text-foreground/80 italic mb-4">&ldquo;{testimonial}&rdquo;</p>
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={avatarSrc || `https://placehold.co/40x40.png`} alt={name} data-ai-hint="professional portrait" />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-primary">{name}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
