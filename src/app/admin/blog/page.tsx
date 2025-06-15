
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getAllBlogPostsAdminAction, deleteBlogPostAction, type BlogPost, type BlogOperationResult } from './actions';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { PlusCircle, Eye, Edit3, Trash2, MoreVertical, ShieldAlert, ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const BlogPostsAdminPage: FC = () => {
  const { toast } = useToast();
  const { user: firebaseUser } = useAdminAuth();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const posts = await getAllBlogPostsAdminAction();
      setBlogPosts(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      toast({ title: "Error", description: "Could not fetch blog posts.", variant: "destructive" });
    } finally {
      setIsLoadingPosts(false);
    }
  }, [toast]);

  useEffect(() => {
    if (firebaseUser) {
      fetchPosts();
    }
  }, [firebaseUser, fetchPosts]);

  const handleDeletePost = (post: BlogPost) => {
    setPostToDelete(post);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete || !postToDelete.id || !firebaseUser?.uid) {
      toast({ title: 'Error', description: 'Post ID missing or user not authenticated.', variant: 'destructive'});
      setPostToDelete(null);
      return;
    }
    setIsDeletingPost(true);
    const result: BlogOperationResult = await deleteBlogPostAction(postToDelete.id, firebaseUser.uid);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      fetchPosts(); // Refresh list
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsDeletingPost(false);
    setPostToDelete(null);
  };

  const getStatusBadgeVariant = (status: 'draft' | 'published') => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <TooltipProvider>
    <div className="space-y-8">
        <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/cms">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to CMS
          </Link>
        </Button>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center"><BookOpen className="mr-2 h-6 w-6 text-accent" /> All Blog Posts</CardTitle>
            <CardDescription>Manage all blog articles, including drafts and published posts.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/blog/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Post
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingPosts ? (
            <div className="flex justify-center items-center py-10">
              <LottieLoader size={48} />
              <p className="ml-2">Loading posts...</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-muted-foreground">No blog posts found.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/blog/create"><PlusCircle className="mr-2 h-4 w-4" /> Create your first post</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-xs truncate" title={post.title}>{post.title}</TableCell>
                    <TableCell>{post.category}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", getStatusBadgeVariant(post.status))}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{post.authorName || 'N/A'}</TableCell>
                    <TableCell>
                      {post.updatedAt ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{format(parseISO(post.updatedAt), 'MMM dd, yyyy')}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{format(parseISO(post.updatedAt), 'PPP p')}</p>
                            {post.publishedAt && <p>Published: {format(parseISO(post.publishedAt), 'PPP p')}</p>}
                          </TooltipContent>
                        </Tooltip>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Post Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {post.status === 'published' && (
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${post.slug}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" /> View Public Post
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/blog/edit/${post.id}`}>
                              <Edit3 className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDeletePost(post)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {postToDelete && (
        <AlertDialog open={!!postToDelete} onOpenChange={(isOpen) => { if (!isOpen) setPostToDelete(null); }}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-destructive"/>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the blog post titled &quot;{postToDelete.title}&quot;.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPostToDelete(null)} disabled={isDeletingPost}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={confirmDeletePost}
                    disabled={isDeletingPost}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                {isDeletingPost ? <LottieLoader className="mr-2" size={16} /> : null}
                {isDeletingPost ? 'Deleting...' : 'Delete Post'}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
    </TooltipProvider>
  );
};

export default BlogPostsAdminPage;

