export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border/40 py-8 bg-secondary/50">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        <p>&copy; {currentYear} Tiny Tasks. All rights reserved.</p>
        <p className="mt-1">Designed with <span className="text-accent">♥</span> for simplicity and productivity.</p>
      </div>
    </footer>
  );
}
