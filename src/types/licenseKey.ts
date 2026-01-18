export type KeyStatus = 'active' | 'used' | 'expired' | 'revoked';
export type KeyType = 'vip_7' | 'vip_30' | 'vip_lifetime';

export interface LicenseKey {
  id: string;
  key: string;
  keyType: KeyType;
  status: KeyStatus;
  usedBy: string | null; // user uid
  usedByEmail: string | null;
  usedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null; // For keys that have expiration date before use
  note?: string;
}

export const KEY_TYPE_LABELS: Record<KeyType, string> = {
  vip_7: 'VIP 7 Days',
  vip_30: 'VIP 30 Days',
  vip_lifetime: 'VIP Lifetime',
};

export const KEY_STATUS_LABELS: Record<KeyStatus, string> = {
  active: 'Active',
  used: 'Used',
  expired: 'Expired',
  revoked: 'Revoked',
};
