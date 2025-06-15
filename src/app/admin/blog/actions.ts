
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, updateDoc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
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
  authorName?: string | null; // Can be optional
  createdAt: string | null; 
  updatedAt: string | null; 
  publishedAt?: string | null; 
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

// Helper to convert various timestamp formats to ISO string or null
const convertDbTimestampToISO = (dbTimestamp: any): string | null => {
  if (!dbTimestamp) return null;
  
  if (dbTimestamp instanceof Timestamp) {
    return dbTimestamp.toDate().toISOString();
  }
  if (dbTimestamp instanceof Date) {
    return dbTimestamp.toISOString();
  }
  if (typeof dbTimestamp === 'object' && dbTimestamp !== null && 
      typeof dbTimestamp.seconds === 'number' && typeof dbTimestamp.nanoseconds === 'number') {
    try {
        return new Timestamp(dbTimestamp.seconds, dbTimestamp.nanoseconds).toDate().toISOString();
    } catch(e) {
        console.warn("Error converting object with sec/ns to Timestamp:", e, dbTimestamp);
        return null;
    }
  }
  if (typeof dbTimestamp === 'object' && dbTimestamp !== null && typeof dbTimestamp.toDate === 'function') {
    try {
        // Check if it's a server timestamp placeholder before committing
        if (Object.keys(dbTimestamp).length === 0) { // Heuristic for an uncommitted server timestamp
            return new Date().toISOString(); // Or null, or a specific string like 'Pending'
        }
        return dbTimestamp.toDate().toISOString();
    } catch (e) {
        console.warn("Failed to convert object with toDate method:", e, dbTimestamp);
        return new Date().toISOString(); // Fallback if toDate exists but fails (e.g. uncommitted server ts)
    }
  }
  if (typeof dbTimestamp === 'string') {
    const d = new Date(dbTimestamp);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
    console.warn("Invalid date string encountered:", dbTimestamp);
    return null; 
  }
  console.warn("Unparseable timestamp format encountered:", dbTimestamp);
  return null; 
};


export async function getBlogPostAction(postId: string): Promise<BlogPost | null> {
  try {
    const postDocRef = doc(db, 'blogPosts', postId);
    const postDocSnap = await getDoc(postDocRef);

    if (!postDocSnap.exists()) {
      return null;
    }

    const data = postDocSnap.data();
    
    return {
      id: postDocSnap.id,
      title: data.title || '',
      content: data.content || '',
      category: data.category || '',
      excerpt: data.excerpt || '',
      slug: data.slug || '',
      status: data.status || 'draft',
      authorId: data.authorId || '',
      authorName: data.authorName || null,
      createdAt: convertDbTimestampToISO(data.createdAt),
      updatedAt: convertDbTimestampToISO(data.updatedAt),
      publishedAt: data.publishedAt ? convertDbTimestampToISO(data.publishedAt) : null,
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

    // Fields that are part of BlogPost but not directly in SaveBlogPostServerData
    const newPostData = {
      title: serverData.title,
      content: serverData.content,
      category: serverData.category,
      excerpt: serverData.excerpt,
      status: serverData.status,
      slug,
      authorId: authorId,
      authorName: userData.displayName || userData.email || 'Admin',
      createdAt: serverTimestamp(), // Firestore will handle this
      updatedAt: serverTimestamp(), // Firestore will handle this
      publishedAt: serverData.status === 'published' ? serverTimestamp() : null, // Firestore will handle this
    };

    const docRef = await addDoc(collection(db, 'blogPosts'), newPostData);
    return { success: true, message: 'Blog post saved successfully!', postId: docRef.id, slug: newPostData.slug };
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
    const existingPostData = postSnap.data() as Omit<BlogPost, 'id'>; // Use Omit as id is not in data()
    let slug = existingPostData.slug;

    if (serverData.title !== existingPostData.title) {
      slug = await generateUniqueSlug(serverData.title, postId);
    }

    const updatedPostData: Partial<Omit<BlogPost, 'id'>> = { // Use Partial<Omit<...>>
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
      // Set to null if moving from published to draft
      updatedPostData.publishedAt = null;
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


export async function getAllBlogPostsAdminAction(): Promise<BlogPost[]> {
  try {
    const postsCollection = collection(db, 'blogPosts');
    const q = query(postsCollection, orderBy('updatedAt', 'desc')); // Order by most recently updated
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        content: data.content || '',
        category: data.category || '',
        excerpt: data.excerpt || '',
        slug: data.slug || '',
        status: data.status || 'draft',
        authorId: data.authorId || '',
        authorName: data.authorName || null,
        createdAt: convertDbTimestampToISO(data.createdAt),
        updatedAt: convertDbTimestampToISO(data.updatedAt),
        publishedAt: data.publishedAt ? convertDbTimestampToISO(data.publishedAt) : null,
      } as BlogPost;
    });
  } catch (error) {
    console.error("Error fetching all blog posts for admin:", error);
    return [];
  }
}
