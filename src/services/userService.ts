import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, VIPType } from '@/types/user';

export const userService = {
  async getAllUsers(): Promise<UserProfile[]> {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id,
      vipExpiresAt: doc.data().vipExpiresAt?.toDate() || null,
      weekStartDate: doc.data().weekStartDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as UserProfile[];
  },

  async getUser(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      ...data,
      uid: docSnap.id,
      vipExpiresAt: data.vipExpiresAt?.toDate() || null,
      weekStartDate: data.weekStartDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserProfile;
  },

  async updateVIPStatus(uid: string, vipType: VIPType): Promise<void> {
    const docRef = doc(db, 'users', uid);
    
    let vipExpiresAt: Date | null = null;
    
    if (vipType === 'vip_7') {
      vipExpiresAt = new Date();
      vipExpiresAt.setDate(vipExpiresAt.getDate() + 7);
    } else if (vipType === 'vip_30') {
      vipExpiresAt = new Date();
      vipExpiresAt.setDate(vipExpiresAt.getDate() + 30);
    } else if (vipType === 'vip_lifetime') {
      vipExpiresAt = null; // Never expires
    }
    
    await updateDoc(docRef, {
      vipType,
      vipExpiresAt: vipExpiresAt ? Timestamp.fromDate(vipExpiresAt) : null,
      updatedAt: serverTimestamp(),
    });
  },

  async updateRole(uid: string, role: 'user' | 'admin'): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      role,
      updatedAt: serverTimestamp(),
    });
  },
};
