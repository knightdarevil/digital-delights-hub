import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LicenseKey, KeyType, KeyStatus } from '@/types/licenseKey';

// Generate a random key like: XXXX-XXXX-XXXX-XXXX
const generateKeyCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return segments.join('-');
};

export const keyService = {
  async getAllKeys(): Promise<LicenseKey[]> {
    const q = query(
      collection(db, 'licenseKeys'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      usedAt: doc.data().usedAt?.toDate() || null,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate() || null,
    })) as LicenseKey[];
  },

  async getKeyByCode(keyCode: string): Promise<LicenseKey | null> {
    const q = query(
      collection(db, 'licenseKeys'),
      where('key', '==', keyCode.toUpperCase())
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      usedAt: data.usedAt?.toDate() || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || null,
    } as LicenseKey;
  },

  async createKey(keyType: KeyType, note?: string, expiresAt?: Date): Promise<LicenseKey> {
    const keyCode = generateKeyCode();
    
    const keyData = {
      key: keyCode,
      keyType,
      status: 'active' as KeyStatus,
      usedBy: null,
      usedByEmail: null,
      usedAt: null,
      note: note || null,
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'licenseKeys'), keyData);
    
    return {
      id: docRef.id,
      ...keyData,
      createdAt: new Date(),
      expiresAt: expiresAt || null,
    } as LicenseKey;
  },

  async createMultipleKeys(keyType: KeyType, count: number, note?: string): Promise<LicenseKey[]> {
    const keys: LicenseKey[] = [];
    for (let i = 0; i < count; i++) {
      const key = await this.createKey(keyType, note);
      keys.push(key);
    }
    return keys;
  },

  async updateKeyStatus(id: string, status: KeyStatus): Promise<void> {
    const docRef = doc(db, 'licenseKeys', id);
    await updateDoc(docRef, { status });
  },

  async revokeKey(id: string): Promise<void> {
    const docRef = doc(db, 'licenseKeys', id);
    await updateDoc(docRef, { status: 'revoked' });
  },

  async deleteKey(id: string): Promise<void> {
    const docRef = doc(db, 'licenseKeys', id);
    await deleteDoc(docRef);
  },

  async useKey(keyCode: string, userId: string, userEmail: string): Promise<{ success: boolean; message: string; keyType?: KeyType }> {
    const key = await this.getKeyByCode(keyCode);
    
    if (!key) {
      return { success: false, message: 'Invalid key' };
    }
    
    if (key.status !== 'active') {
      return { success: false, message: `Key is ${key.status}` };
    }
    
    if (key.expiresAt && new Date() > key.expiresAt) {
      await this.updateKeyStatus(key.id, 'expired');
      return { success: false, message: 'Key has expired' };
    }
    
    const docRef = doc(db, 'licenseKeys', key.id);
    await updateDoc(docRef, {
      status: 'used',
      usedBy: userId,
      usedByEmail: userEmail,
      usedAt: serverTimestamp(),
    });
    
    return { success: true, message: 'Key activated successfully', keyType: key.keyType };
  },
};
