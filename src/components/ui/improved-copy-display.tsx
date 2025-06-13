"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lightbulb } from "lucide-react";

interface ImprovedCopyDisplayProps {
  originalTitle: string;
  originalText: string;
  improvedTitle: string;
  improvedText: string;
  className?: string;
}

export function ImprovedCopyDisplay({
  originalTitle,
  originalText,
  improvedTitle,
  improvedText,
  className,
}: ImprovedCopyDisplayProps) {
  return (
    <div className={`grid md:grid-cols-2 gap-8 items-start ${className}`}>
      <Card className="shadow-lg transform hover:scale-[1.01] transition-transform duration-300">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-muted-foreground">{originalTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{originalText}</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary to-blue-800 text-primary-foreground shadow-xl transform hover:scale-[1.01] transition-transform duration-300">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-6 w-6 text-yellow-400" />
            <CardTitle className="font-headline text-2xl">{improvedTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p>{improvedText}</p>
        </CardContent>
      </Card>
    </div>
  );
}
