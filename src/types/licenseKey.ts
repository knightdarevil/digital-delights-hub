export type KeyStatus = 'active' | 'used' | 'expired' | 'revoked';
export type KeyType = 'vip_7' | 'vip_30' | 'vip_lifetime';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  softwareName: string; // Tên phần mềm đang sử dụng
  activatedAt: Date;
  lastSeenAt: Date;
  platform?: string; // windows, mac, android, ios
}

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
  maxDevices: number; // Số thiết bị tối đa có thể sử dụng cùng lúc
  devices: DeviceInfo[]; // Danh sách thiết bị đang sử dụng
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
