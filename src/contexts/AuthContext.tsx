import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile, VIPType } from '@/types/user';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: boolean;
  isVIP: boolean;
  canDownload: boolean;
  remainingDownloads: number;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const profile: UserProfile = {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        vipType: data.vipType,
        vipExpiresAt: data.vipExpiresAt?.toDate() || null,
        downloadsThisWeek: data.downloadsThisWeek || 0,
        totalDownloads: data.totalDownloads || 0,
        weekStartDate: data.weekStartDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
      
      // Check if week needs to reset
      const now = new Date();
      const weekStart = new Date(profile.weekStartDate);
      const daysSinceWeekStart = Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceWeekStart >= 7) {
        await updateDoc(docRef, {
          downloadsThisWeek: 0,
          weekStartDate: serverTimestamp(),
        });
        profile.downloadsThisWeek = 0;
        profile.weekStartDate = now;
      }
      
      // Check VIP expiration
      if (profile.vipExpiresAt && profile.vipExpiresAt < now) {
        await updateDoc(docRef, {
          vipType: 'free',
          vipExpiresAt: null,
        });
        profile.vipType = 'free';
        profile.vipExpiresAt = null;
      }
      
      setUserProfile(profile);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserProfile(result.user.uid);
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(result.user, { displayName: name });
    
    const newProfile: Omit<UserProfile, 'vipExpiresAt' | 'weekStartDate' | 'createdAt' | 'updatedAt'> & {
      vipExpiresAt: null;
      weekStartDate: ReturnType<typeof serverTimestamp>;
      createdAt: ReturnType<typeof serverTimestamp>;
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      uid: result.user.uid,
      email: email,
      displayName: name,
      role: 'user',
      vipType: 'free',
      vipExpiresAt: null,
      downloadsThisWeek: 0,
      totalDownloads: 0,
      weekStartDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(doc(db, 'users', result.user.uid), newProfile);
    await fetchUserProfile(result.user.uid);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const isAdmin = userProfile?.role === 'admin';
  
  const isVIP = userProfile?.vipType !== 'free' && 
    (!userProfile?.vipExpiresAt || userProfile.vipExpiresAt > new Date());
  
  const remainingDownloads = userProfile 
    ? (isVIP ? Infinity : Math.max(0, 3 - userProfile.downloadsThisWeek))
    : 0;
  
  const canDownload = isVIP || remainingDownloads > 0;

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      login,
      register,
      logout,
      resetPassword,
      isAdmin,
      isVIP,
      canDownload,
      remainingDownloads,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
