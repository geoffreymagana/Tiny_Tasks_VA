
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();
  return (
    <footer className={cn("border-t border-border/40 py-8 bg-secondary/50", className)}>
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        <p>&copy; {currentYear} Tiny Tasks. All rights reserved.</p>
        <p className="mt-1">Designed with <span className="text-accent">♥</span> for simplicity and productivity.</p>
      </div>
    </footer>
  );
}
