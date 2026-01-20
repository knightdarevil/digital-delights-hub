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
import { LicenseKey, KeyType, KeyStatus, DeviceInfo } from '@/types/licenseKey';

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

const parseDevices = (devicesData: any[]): DeviceInfo[] => {
  if (!devicesData || !Array.isArray(devicesData)) return [];
  return devicesData.map(d => ({
    deviceId: d.deviceId || '',
    deviceName: d.deviceName || 'Unknown Device',
    softwareName: d.softwareName || 'Unknown',
    activatedAt: d.activatedAt?.toDate?.() || new Date(d.activatedAt) || new Date(),
    lastSeenAt: d.lastSeenAt?.toDate?.() || new Date(d.lastSeenAt) || new Date(),
    platform: d.platform || 'unknown',
  }));
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
      maxDevices: doc.data().maxDevices || 1,
      devices: parseDevices(doc.data().devices || []),
    })) as LicenseKey[];
  },

  async getKeyByCode(keyCode: string): Promise<LicenseKey | null> {
    const q = query(
      collection(db, 'licenseKeys'),
      where('key', '==', keyCode.toUpperCase())
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      usedAt: data.usedAt?.toDate() || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || null,
      maxDevices: data.maxDevices || 1,
      devices: parseDevices(data.devices || []),
    } as LicenseKey;
  },

  async createKey(keyType: KeyType, note?: string, expiresAt?: Date, maxDevices: number = 1): Promise<LicenseKey> {
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
      maxDevices,
      devices: [],
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'licenseKeys'), keyData);
    
    return {
      id: docRef.id,
      ...keyData,
      createdAt: new Date(),
      expiresAt: expiresAt || null,
      devices: [],
    } as LicenseKey;
  },

  async createMultipleKeys(keyType: KeyType, count: number, note?: string, maxDevices: number = 1): Promise<LicenseKey[]> {
    const keys: LicenseKey[] = [];
    for (let i = 0; i < count; i++) {
      const key = await this.createKey(keyType, note, undefined, maxDevices);
      keys.push(key);
    }
    return keys;
  },

  async updateKeyStatus(id: string, status: KeyStatus): Promise<void> {
    const docRef = doc(db, 'licenseKeys', id);
    await updateDoc(docRef, { status });
  },

  async updateMaxDevices(id: string, maxDevices: number): Promise<void> {
    const docRef = doc(db, 'licenseKeys', id);
    await updateDoc(docRef, { maxDevices });
  },

  async removeDevice(keyId: string, deviceId: string): Promise<void> {
    const key = await this.getKeyById(keyId);
    if (!key) throw new Error('Key not found');
    
    const updatedDevices = key.devices.filter(d => d.deviceId !== deviceId);
    const docRef = doc(db, 'licenseKeys', keyId);
    await updateDoc(docRef, { 
      devices: updatedDevices,
      status: updatedDevices.length === 0 ? 'active' : 'used'
    });
  },

  async getKeyById(id: string): Promise<LicenseKey | null> {
    const docRef = doc(db, 'licenseKeys', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      usedAt: data.usedAt?.toDate() || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || null,
      maxDevices: data.maxDevices || 1,
      devices: parseDevices(data.devices || []),
    } as LicenseKey;
  },

  async revokeKey(id: string): Promise<void> {
    const docRef = doc(db, 'licenseKeys', id);
    await updateDoc(docRef, { status: 'revoked' });
  },

  async deleteKey(id: string): Promise<void> {
    const docRef = doc(db, 'licenseKeys', id);
    await deleteDoc(docRef);
  },

  async useKey(keyCode: string, userId: string, userEmail: string, deviceInfo?: Partial<DeviceInfo>): Promise<{ success: boolean; message: string; keyType?: KeyType }> {
    const key = await this.getKeyByCode(keyCode);
    
    if (!key) {
      return { success: false, message: 'Invalid key' };
    }
    
    if (key.status === 'revoked') {
      return { success: false, message: 'Key has been revoked' };
    }
    
    if (key.status === 'expired') {
      return { success: false, message: 'Key has expired' };
    }
    
    if (key.expiresAt && new Date() > key.expiresAt) {
      await this.updateKeyStatus(key.id, 'expired');
      return { success: false, message: 'Key has expired' };
    }

    // Check device limit
    if (deviceInfo?.deviceId) {
      const existingDevice = key.devices.find(d => d.deviceId === deviceInfo.deviceId);
      
      if (!existingDevice && key.devices.length >= key.maxDevices) {
        return { 
          success: false, 
          message: `Device limit reached (${key.maxDevices} device${key.maxDevices > 1 ? 's' : ''} max)` 
        };
      }
    }
    
    const docRef = doc(db, 'licenseKeys', key.id);
    
    // Update or add device
    let updatedDevices = [...key.devices];
    if (deviceInfo?.deviceId) {
      const existingIndex = updatedDevices.findIndex(d => d.deviceId === deviceInfo.deviceId);
      const now = new Date();
      
      if (existingIndex >= 0) {
        updatedDevices[existingIndex] = {
          ...updatedDevices[existingIndex],
          lastSeenAt: now,
          softwareName: deviceInfo.softwareName || updatedDevices[existingIndex].softwareName,
        };
      } else {
        updatedDevices.push({
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName || 'Unknown Device',
          softwareName: deviceInfo.softwareName || 'Unknown Software',
          activatedAt: now,
          lastSeenAt: now,
          platform: deviceInfo.platform || 'unknown',
        });
      }
    }

    // Only set usedAt on first activation (when key was 'active')
    const updateData: any = {
      status: 'used',
      usedBy: userId,
      usedByEmail: userEmail,
      devices: updatedDevices.map(d => ({
        ...d,
        activatedAt: Timestamp.fromDate(d.activatedAt),
        lastSeenAt: Timestamp.fromDate(d.lastSeenAt),
      })),
    };
    
    // Only set usedAt if this is the first activation
    if (key.status === 'active') {
      updateData.usedAt = serverTimestamp();
    }
    
    await updateDoc(docRef, updateData);
    
    return { success: true, message: 'Key activated successfully', keyType: key.keyType };
  },
};
