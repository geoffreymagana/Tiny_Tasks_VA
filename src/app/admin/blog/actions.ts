
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import slugify from 'slugify';

export interface BlogPost {
  id?: string;
  title: string;
  content: string; // Markdown
  category: string;
  excerpt: string;
  slug: string;
  status: 'draft' | 'published';
  authorId: string;
  authorName?: string;
  createdAt: any; 
  updatedAt: any; 
  publishedAt?: any; 
}

export interface BlogOperationResult {
  success: boolean;
  message: string;
  postId?: string;
  slug?: string;
}

export interface SaveBlogPostServerData {
  title: string;
  content: string;
  category: string;
  excerpt: string;
  status: 'draft' | 'published';
}

export interface UpdateBlogPostServerData extends SaveBlogPostServerData {
  // Currently identical to SaveBlogPostServerData, can be expanded if needed
}


async function isSlugUnique(slug: string, currentPostId?: string): Promise<boolean> {
  let q = query(collection(db, 'blogPosts'), where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return true;
  }
  // If we are checking for an update, and the found slug belongs to the current post, it's still "unique" in this context
  if (currentPostId && querySnapshot.docs[0].id === currentPostId) {
    return true;
  }
  return false;
}

async function generateUniqueSlug(title: string, currentPostId?: string): Promise<string> {
  let slug = slugify(title, { lower: true, strict: true });
  let counter = 1;
  let uniqueSlug = slug;
  while (!(await isSlugUnique(uniqueSlug, currentPostId))) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}

export async function getBlogPostAction(postId: string): Promise<BlogPost | null> {
  try {
    const postDocRef = doc(db, 'blogPosts', postId);
    const postDocSnap = await getDoc(postDocRef);

    if (!postDocSnap.exists()) {
      return null;
    }

    const data = postDocSnap.data();
    const convertTimestamp = (timestamp: any) => {
        if (timestamp instanceof Timestamp) {
          return timestamp.toDate().toISOString();
        }
        if (typeof timestamp === 'string') return timestamp; // Already a string
        if (timestamp && typeof timestamp.toDate === 'function') { // Handle Firestore ServerTimestamp placeholder
            return new Date().toISOString(); // Fallback to current date if it's a pending server timestamp
        }
        return timestamp; // Or null/undefined
    };
    
    return {
      id: postDocSnap.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      publishedAt: data.publishedAt ? convertTimestamp(data.publishedAt) : null,
    } as BlogPost;

  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}


export async function saveBlogPostAction(
  serverData: SaveBlogPostServerData,
  authorId: string
): Promise<BlogOperationResult> {
  if (!authorId) {
    return { success: false, message: 'Author ID not provided.' };
  }

  const userDocRef = doc(db, 'users', authorId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
    return { success: false, message: 'User does not have admin privileges or account not found.' };
  }
  
  const userData = userDoc.data();

  try {
    const slug = await generateUniqueSlug(serverData.title);

    const newPost: Omit<BlogPost, 'id'> = {
      title: serverData.title,
      content: serverData.content,
      category: serverData.category,
      excerpt: serverData.excerpt,
      status: serverData.status,
      slug,
      authorId: authorId,
      authorName: userData.displayName || userData.email || 'Admin',
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

export async function updateBlogPostAction(
  postId: string,
  serverData: UpdateBlogPostServerData,
  authorId: string
): Promise<BlogOperationResult> {
  if (!authorId) {
    return { success: false, message: 'Author ID not provided for update.' };
  }

  const userDocRef = doc(db, 'users', authorId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
    return { success: false, message: 'User does not have admin privileges or account not found for update.' };
  }

  const postRef = doc(db, 'blogPosts', postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    return { success: false, message: 'Blog post not found for update.' };
  }

  try {
    const existingPostData = postSnap.data() as BlogPost;
    let slug = existingPostData.slug;

    if (serverData.title !== existingPostData.title) {
      slug = await generateUniqueSlug(serverData.title, postId);
    }

    const updatedPostData: Partial<BlogPost> = {
      title: serverData.title,
      content: serverData.content,
      category: serverData.category,
      excerpt: serverData.excerpt,
      status: serverData.status,
      slug,
      updatedAt: serverTimestamp(),
    };

    if (serverData.status === 'published' && existingPostData.status !== 'published') {
      updatedPostData.publishedAt = serverTimestamp();
    } else if (serverData.status === 'draft' && existingPostData.status === 'published') {
      updatedPostData.publishedAt = null; // Or keep existing, depends on logic. Let's make it null to reflect draft status.
    }
    
    await updateDoc(postRef, updatedPostData);
    return { success: true, message: 'Blog post updated successfully!', postId, slug };
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    return { success: false, message: error.message || 'Failed to update blog post.' };
  }
}

export async function deleteBlogPostAction(
  postId: string,
  authorId: string
): Promise<BlogOperationResult> {
  if (!authorId) {
    return { success: false, message: 'Author ID not provided for deletion.' };
  }

  const userDocRef = doc(db, 'users', authorId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
    return { success: false, message: 'User does not have admin privileges or account not found for deletion.' };
  }
  
  try {
    const postRef = doc(db, 'blogPosts', postId);
    await deleteDoc(postRef);
    return { success: true, message: 'Blog post deleted successfully!' };
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    return { success: false, message: error.message || 'Failed to delete blog post.' };
  }
}
