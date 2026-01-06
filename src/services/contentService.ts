import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ContentItem, DownloadRecord } from '@/types/user';

const CONTENTS_COLLECTION = 'contents';
const DOWNLOADS_COLLECTION = 'downloads';

export const contentService = {
  // Get all contents by category
  async getByCategory(category: string, pageSize: number = 10, page: number = 1): Promise<ContentItem[]> {
    const q = query(
      collection(db, CONTENTS_COLLECTION),
      where('category', '==', category),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as ContentItem[];
  },

  // Get top viewed contents
  async getTopViewed(category: string, count: number = 4): Promise<ContentItem[]> {
    const q = query(
      collection(db, CONTENTS_COLLECTION),
      where('category', '==', category),
      orderBy('views', 'desc'),
      limit(count)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as ContentItem[];
  },

  // Search contents
  async search(searchTerm: string): Promise<ContentItem[]> {
    const q = query(
      collection(db, CONTENTS_COLLECTION),
      orderBy('title'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    const term = searchTerm.toLowerCase();
    
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as ContentItem;
      })
      .filter(item => 
        item.title?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term)
      );
  },

  // Get single content
  async getById(id: string): Promise<ContentItem | null> {
    const docRef = doc(db, CONTENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate(),
      updatedAt: docSnap.data().updatedAt?.toDate(),
    } as ContentItem;
  },

  // Increment view count
  async incrementViews(id: string): Promise<void> {
    const docRef = doc(db, CONTENTS_COLLECTION, id);
    await updateDoc(docRef, {
      views: increment(1)
    });
  },

  // Record download and increment count
  async recordDownload(userId: string, contentId: string): Promise<void> {
    // Add download record
    await addDoc(collection(db, DOWNLOADS_COLLECTION), {
      userId,
      contentId,
      downloadedAt: serverTimestamp(),
    });

    // Increment download count on content
    const contentRef = doc(db, CONTENTS_COLLECTION, contentId);
    await updateDoc(contentRef, {
      downloads: increment(1)
    });

    // Increment user's download count
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      downloadsThisWeek: increment(1),
      totalDownloads: increment(1),
    });
  },

  // Admin: Create content
  async create(content: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'downloads'>): Promise<string> {
    const docRef = await addDoc(collection(db, CONTENTS_COLLECTION), {
      ...content,
      views: 0,
      downloads: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Admin: Update content
  async update(id: string, content: Partial<ContentItem>): Promise<void> {
    const docRef = doc(db, CONTENTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...content,
      updatedAt: serverTimestamp(),
    });
  },

  // Admin: Delete content
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, CONTENTS_COLLECTION, id));
  },

  // Admin: Get all contents
  async getAll(): Promise<ContentItem[]> {
    const q = query(
      collection(db, CONTENTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as ContentItem[];
  },
};
