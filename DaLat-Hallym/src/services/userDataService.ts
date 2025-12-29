// User Data Service - Quản lý dữ liệu người dùng với localStorage

export interface UserStats {
  points: number;
  totalKg: number;
  goalKg: number;
  streak: number;
  lastActive: string;
}

export interface RecyclingRecord {
  id: string;
  itemName: string;
  category: string;
  weight: number;
  points: number;
  co2Reduction: number;
  timestamp: string;
}

export interface PointHistory {
  id: string;
  date: string;
  type: 'earned' | 'used';
  description: string;
  points: number;
  balance: number;
}

export interface Coupon {
  id: string;
  name: string;
  purchaseDate: string;
  expiryDate: string;
  used: boolean;
  image: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const STORAGE_KEYS = {
  USER_STATS: 'ecoapp_user_stats',
  RECYCLING_RECORDS: 'ecoapp_recycling_records',
  POINT_HISTORY: 'ecoapp_point_history',
  COUPONS: 'ecoapp_coupons',
  BADGES: 'ecoapp_badges',
};

// Default values
const DEFAULT_USER_STATS: UserStats = {
  points: 3240,
  totalKg: 12.4,
  goalKg: 20,
  streak: 7,
  lastActive: new Date().toISOString().split('T')[0],
};

const DEFAULT_BADGES: Badge[] = [
  { id: '1', name: '7 ngày liên tiếp', icon: 'Flame', color: 'orange', unlocked: true, unlockedAt: '2024-12-20' },
  { id: '2', name: 'Đạt 100kg', icon: 'Trophy', color: 'yellow', unlocked: true, unlockedAt: '2024-12-15' },
  { id: '3', name: 'Eco Master', icon: 'Award', color: 'purple', unlocked: true, unlockedAt: '2024-12-10' },
  { id: '4', name: '1000 điểm', icon: 'Medal', color: 'blue', unlocked: false },
  { id: '5', name: '30 ngày liên tiếp', icon: 'Crown', color: 'yellow', unlocked: false },
];

// Get data from localStorage
export function getUserStats(): UserStats {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_STATS);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(DEFAULT_USER_STATS));
  return DEFAULT_USER_STATS;
}

export function getRecyclingRecords(): RecyclingRecord[] {
  const stored = localStorage.getItem(STORAGE_KEYS.RECYCLING_RECORDS);
  return stored ? JSON.parse(stored) : [];
}

export function getPointHistory(): PointHistory[] {
  const stored = localStorage.getItem(STORAGE_KEYS.POINT_HISTORY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Default history
  const defaultHistory: PointHistory[] = [
    { id: '1', date: '26.12.2024', type: 'earned', description: 'Phân loại chai nhựa', points: 15, balance: 3240 },
    { id: '2', date: '25.12.2024', type: 'earned', description: 'Phân loại cốc giấy', points: 12, balance: 3225 },
    { id: '3', date: '24.12.2024', type: 'used', description: 'Mua túi vải', points: -2000, balance: 3213 },
    { id: '4', date: '23.12.2024', type: 'earned', description: 'Phân loại lon nhôm', points: 20, balance: 5213 },
    { id: '5', date: '22.12.2024', type: 'earned', description: 'Phân loại chai thủy tinh', points: 18, balance: 5193 },
  ];
  localStorage.setItem(STORAGE_KEYS.POINT_HISTORY, JSON.stringify(defaultHistory));
  return defaultHistory;
}

export function getCoupons(): Coupon[] {
  const stored = localStorage.getItem(STORAGE_KEYS.COUPONS);
  if (stored) {
    return JSON.parse(stored);
  }
  const defaultCoupons: Coupon[] = [
    { id: '1', name: 'Chứng chỉ Bảo vệ Môi trường', purchaseDate: '15.12.2024', expiryDate: '15.03.2025', used: false, image: '📜' },
    { id: '2', name: 'Túi vải', purchaseDate: '10.12.2024', expiryDate: '10.02.2025', used: true, image: '🛍️' },
  ];
  localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(defaultCoupons));
  return defaultCoupons;
}

export function getBadges(): Badge[] {
  const stored = localStorage.getItem(STORAGE_KEYS.BADGES);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(DEFAULT_BADGES));
  return DEFAULT_BADGES;
}

// Update functions
export function updateUserStats(updates: Partial<UserStats>): UserStats {
  const current = getUserStats();
  const updated = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(updated));
  return updated;
}

export function addRecyclingRecord(record: Omit<RecyclingRecord, 'id' | 'timestamp'>): RecyclingRecord {
  const records = getRecyclingRecords();
  const newRecord: RecyclingRecord = {
    ...record,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  records.unshift(newRecord);
  localStorage.setItem(STORAGE_KEYS.RECYCLING_RECORDS, JSON.stringify(records));
  
  // Update user stats
  const stats = getUserStats();
  updateUserStats({
    points: stats.points + record.points,
    totalKg: stats.totalKg + record.weight,
  });
  
  // Add to point history
  addPointHistory({
    type: 'earned',
    description: `Phân loại ${record.itemName}`,
    points: record.points,
  });
  
  // Check badges
  checkAndUnlockBadges();
  
  return newRecord;
}

export function addPointHistory(entry: Omit<PointHistory, 'id' | 'date' | 'balance'>): PointHistory {
  const history = getPointHistory();
  const stats = getUserStats();
  const newEntry: PointHistory = {
    ...entry,
    id: Date.now().toString(),
    date: new Date().toLocaleDateString('vi-VN'),
    balance: stats.points,
  };
  history.unshift(newEntry);
  localStorage.setItem(STORAGE_KEYS.POINT_HISTORY, JSON.stringify(history));
  return newEntry;
}

export function purchaseCoupon(name: string, image: string, pointsCost: number): Coupon | null {
  const stats = getUserStats();
  if (stats.points < pointsCost) {
    return null;
  }
  
  // Deduct points
  updateUserStats({ points: stats.points - pointsCost });
  
  // Add coupon
  const coupons = getCoupons();
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 3);
  
  const newCoupon: Coupon = {
    id: Date.now().toString(),
    name,
    image,
    purchaseDate: new Date().toLocaleDateString('vi-VN'),
    expiryDate: expiry.toLocaleDateString('vi-VN'),
    used: false,
  };
  coupons.unshift(newCoupon);
  localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  
  // Add to history
  addPointHistory({
    type: 'used',
    description: `Đổi ${name}`,
    points: -pointsCost,
  });
  
  return newCoupon;
}

export function useCoupon(couponId: string): boolean {
  const coupons = getCoupons();
  const index = coupons.findIndex(c => c.id === couponId);
  if (index === -1 || coupons[index].used) {
    return false;
  }
  coupons[index].used = true;
  localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  return true;
}

export function checkAndUnlockBadges(): Badge[] {
  const stats = getUserStats();
  const badges = getBadges();
  let updated = false;
  
  badges.forEach(badge => {
    if (badge.unlocked) return;
    
    let shouldUnlock = false;
    switch (badge.id) {
      case '4': // 1000 points
        shouldUnlock = stats.points >= 1000;
        break;
      case '5': // 30 day streak
        shouldUnlock = stats.streak >= 30;
        break;
    }
    
    if (shouldUnlock) {
      badge.unlocked = true;
      badge.unlockedAt = new Date().toISOString().split('T')[0];
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
  }
  
  return badges;
}

// Daily data for chart (last 7 days)
export function getWeeklyData(language: string = 'vi'): { day: string; kg: number; date: string }[] {
  const records = getRecyclingRecords();
  const now = new Date();
  const days: { day: string; kg: number; date: string }[] = [];
  
  // Day abbreviations by language
  const dayNames: Record<string, string[]> = {
    vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ko: ['일', '월', '화', '수', '목', '금', '토']
  };
  
  const names = dayNames[language] || dayNames.vi;
  
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - i);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayRecords = records.filter(r => {
      const date = new Date(r.timestamp);
      return date >= targetDate && date < nextDate;
    });
    
    const totalKg = dayRecords.reduce((sum, r) => sum + r.weight, 0);
    const dayName = names[targetDate.getDay()];
    
    // Generate sample data if no records exist
    const sampleKg = i === 0 ? 0 : (1 + Math.random() * 4);
    
    days.push({
      day: dayName,
      kg: Number((totalKg || sampleKg).toFixed(1)),
      date: `${targetDate.getDate()}/${targetDate.getMonth() + 1}`
    });
  }
  
  return days;
}

// Get comparison with previous week
export function getWeekComparison(): { thisWeek: number; lastWeek: number; percentChange: number } {
  const records = getRecyclingRecords();
  const now = new Date();
  
  // This week (last 7 days)
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  
  // Last week (7-14 days ago)
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(lastWeekStart.getDate() - 14);
  
  const thisWeekRecords = records.filter(r => {
    const date = new Date(r.timestamp);
    return date >= thisWeekStart;
  });
  
  const lastWeekRecords = records.filter(r => {
    const date = new Date(r.timestamp);
    return date >= lastWeekStart && date < thisWeekStart;
  });
  
  const thisWeek = thisWeekRecords.reduce((sum, r) => sum + r.weight, 0) || 12.5;
  const lastWeek = lastWeekRecords.reduce((sum, r) => sum + r.weight, 0) || 10.2;
  
  const percentChange = lastWeek > 0 
    ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) 
    : 0;
  
  return {
    thisWeek: Number(thisWeek.toFixed(1)),
    lastWeek: Number(lastWeek.toFixed(1)),
    percentChange
  };
}

// Reset all data (for testing)
export function resetAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}
