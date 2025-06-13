
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import slugify from 'slugify';
import type { User } from 'firebase/auth';

export interface BlogPost {
  id?: string;
  title: string;
  content: string; // Markdown
  category: string;
  excerpt: string;
  slug: string;
  status: 'draft' | 'published';
  authorId: string;
  authorName?: string; // Optional: denormalize for easier display
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  publishedAt?: any; // Firestore Timestamp, optional
}

export interface SaveBlogPostResult {
  success: boolean;
  message: string;
  postId?: string;
  slug?: string;
}

async function isSlugUnique(slug: string): Promise<boolean> {
  const q = query(collection(db, 'blogPosts'), where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
}

async function generateUniqueSlug(title: string): Promise<string> {
  let slug = slugify(title, { lower: true, strict: true });
  let counter = 1;
  let uniqueSlug = slug;
  while (!(await isSlugUnique(uniqueSlug))) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}


export async function saveBlogPostAction(
  data: Omit<BlogPost, 'id' | 'slug' | 'authorId' | 'createdAt' | 'updatedAt' | 'publishedAt'> & { currentSlug?: string }
): Promise<SaveBlogPostResult> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, message: 'User not authenticated.' };
  }
  // Basic role check - ideally, a more robust check via custom claims or admin SDK on backend
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
      return { success: false, message: 'User does not have admin privileges.' };
  }


  try {
    const slug = await generateUniqueSlug(data.title);

    const newPost: Omit<BlogPost, 'id'> = {
      ...data,
      slug,
      authorId: user.uid,
      authorName: user.displayName || user.email || 'Admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (data.status === 'published') {
      newPost.publishedAt = serverTimestamp();
    }

    const docRef = await addDoc(collection(db, 'blogPosts'), newPost);
    return { success: true, message: 'Blog post saved successfully!', postId: docRef.id, slug: newPost.slug };
  } catch (error: any) {
    console.error('Error saving blog post:', error);
    return { success: false, message: error.message || 'Failed to save blog post.' };
  }
}
