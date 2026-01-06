export type VIPType = 'free' | 'vip_7' | 'vip_30' | 'vip_lifetime';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  vipType: VIPType;
  vipExpiresAt: Date | null;
  downloadsThisWeek: number;
  totalDownloads: number;
  weekStartDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: 'windows' | 'driver' | 'software' | 'courses' | 'movies';
  type: 'free' | 'vip';
  downloadLink: string;
  imageUrl?: string;
  size?: string;
  views: number;
  downloads: number;
  quality?: '720p' | '1080p' | '4K';
  createdAt: Date;
  updatedAt: Date;
}

export interface DownloadRecord {
  id: string;
  userId: string;
  contentId: string;
  downloadedAt: Date;
}

export interface SiteStats {
  totalUsers: number;
  totalViews: number;
  totalDownloads: number;
  monthlyUsers: { month: string; count: number }[];
}

export const VIP_LIMITS = {
  free: 3,
  vip_7: Infinity,
  vip_30: Infinity,
  vip_lifetime: Infinity,
} as const;

export const VIP_LABELS: Record<VIPType, string> = {
  free: 'Free',
  vip_7: 'VIP 7 Days',
  vip_30: 'VIP 30 Days',
  vip_lifetime: 'VIP Lifetime',
};
