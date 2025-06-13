
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const CreateBlogPage: FC = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Error', description: 'Title and Content are required.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    // Placeholder for actual submission logic (e.g., to Firestore)
    console.log({ title, content });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    toast({ title: 'Success (Simulated)', description: 'Blog post created successfully.' });
    setTitle('');
    setContent('');
    setIsSubmitting(false);
    // Optionally redirect or update UI
  };

  return (
    <div>
      <Button variant="outline" asChild className="mb-6">
        <Link href="/admin">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">Create New Blog Post</CardTitle>
          <CardDescription>Fill in the details below to publish a new article.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="blogTitle">Post Title</Label>
              <Input
                id="blogTitle"
                placeholder="Enter a catchy title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                maxLength={150}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blogContent">Content</Label>
              <Textarea
                id="blogContent"
                placeholder="Write your amazing blog post here... Markdown could be supported in the future."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
                rows={15}
                className="min-h-[300px]"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting ? 'Publishing...' : 'Publish Post (Simulated)'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateBlogPage;
