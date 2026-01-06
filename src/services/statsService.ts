import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SiteStats } from '@/types/user';

export const statsService = {
  async getSiteStats(): Promise<SiteStats> {
    // Get total users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // Get all contents for views and downloads
    const contentsSnapshot = await getDocs(collection(db, 'contents'));
    let totalViews = 0;
    let totalDownloads = 0;
    
    contentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalViews += data.views || 0;
      totalDownloads += data.downloads || 0;
    });

    // Get monthly users (last 6 months)
    const monthlyUsers: { month: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthName = monthStart.toLocaleString('default', { month: 'short' });
      
      let count = 0;
      usersSnapshot.docs.forEach(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        if (createdAt && createdAt >= monthStart && createdAt <= monthEnd) {
          count++;
        }
      });
      
      monthlyUsers.push({ month: monthName, count });
    }

    return {
      totalUsers,
      totalViews,
      totalDownloads,
      monthlyUsers,
    };
  },

  async getUserStats(userId: string) {
    const downloadsSnapshot = await getDocs(
      query(
        collection(db, 'downloads'),
        where('userId', '==', userId),
        orderBy('downloadedAt', 'desc')
      )
    );

    return {
      totalDownloads: downloadsSnapshot.size,
      recentDownloads: downloadsSnapshot.docs.slice(0, 10).map(doc => ({
        id: doc.id,
        ...doc.data(),
        downloadedAt: doc.data().downloadedAt?.toDate(),
      })),
    };
  },
};
