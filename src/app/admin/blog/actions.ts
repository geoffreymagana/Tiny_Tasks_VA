
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

// Data structure expected by the server action from the client
export interface SaveBlogPostServerData {
  title: string;
  content: string;
  category: string;
  excerpt: string;
  status: 'draft' | 'published';
  authorId: string; // Author's UID passed from client
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
  serverData: SaveBlogPostServerData
): Promise<SaveBlogPostResult> {
  // auth.currentUser is unreliable in server actions.
  // We now rely on authorId passed from the client and verify the user's role.

  if (!serverData.authorId) {
    return { success: false, message: 'Author ID not provided.' };
  }

  // Verify the user's role using the passed authorId
  const userDocRef = doc(db, 'users', serverData.authorId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    return { success: false, message: 'User account not found.' };
  }
  
  const userData = userDoc.data();
  if (userData?.role !== 'admin') {
      return { success: false, message: 'User does not have admin privileges.' };
  }


  try {
    const slug = await generateUniqueSlug(serverData.title);

    const newPost: Omit<BlogPost, 'id'> = {
      title: serverData.title,
      content: serverData.content,
      category: serverData.category,
      excerpt: serverData.excerpt,
      status: serverData.status,
      slug,
      authorId: serverData.authorId, // Use the verified authorId
      authorName: userData.displayName || userData.email || 'Admin', // Get authorName from fetched userDoc
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (serverData.status === 'published') {
      newPost.publishedAt = serverTimestamp();
    }

    const docRef = await addDoc(collection(db, 'blogPosts'), newPost);
    return { success: true, message: 'Blog post saved successfully!', postId: docRef.id, slug: newPost.slug };
  } catch (error: any) {
    console.error('Error saving blog post:', error);
    return { success: false, message: error.message || 'Failed to save blog post.' };
  }
}

