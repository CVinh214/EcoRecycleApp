import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  UserStats,
  RecyclingRecord,
  PointHistory,
  Coupon,
  Badge,
  getUserStats,
  getPointHistory,
  getCoupons,
  getBadges,
  getWeeklyData,
  getWeekComparison,
  addRecyclingRecord,
  purchaseCoupon,
  useCoupon,
  updateUserStats,
  getRecyclingRecords,
} from '../services/userDataService';

// Notification type
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'achievement' | 'reminder' | 'reward' | 'tip';
  read: boolean;
  timestamp: string;
}

// User Level calculation
export interface UserLevel {
  level: number;
  title: string;
  currentXP: number;
  nextLevelXP: number;
  progress: number;
}

const calculateUserLevel = (points: number, totalKg: number): UserLevel => {
  const xp = points + Math.floor(totalKg * 100);
  const levels = [
    { level: 1, title: 'Người mới', xp: 0 },
    { level: 2, title: 'Người bắt đầu', xp: 500 },
    { level: 3, title: 'Eco Warrior', xp: 1500 },
    { level: 4, title: 'Eco Champion', xp: 3500 },
    { level: 5, title: 'Eco Master', xp: 7000 },
    { level: 6, title: 'Eco Legend', xp: 15000 },
  ];
  
  let currentLevel = levels[0];
  let nextLevel = levels[1];
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].xp) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || { ...levels[i], xp: levels[i].xp + 10000 };
      break;
    }
  }
  
  const currentXP = xp - currentLevel.xp;
  const nextLevelXP = nextLevel.xp - currentLevel.xp;
  
  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentXP,
    nextLevelXP,
    progress: (currentXP / nextLevelXP) * 100,
  };
};

// Default notifications
const getDefaultNotifications = (): Notification[] => [
  {
    id: '1',
    title: '🎉 Streak 7 ngày!',
    message: 'Bạn đã tái chế 7 ngày liên tiếp. Tiếp tục phát huy!',
    type: 'achievement',
    read: false,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    title: '🎁 Phần thưởng mới',
    message: 'Bạn có thể đổi Coffee Voucher với 4500 điểm',
    type: 'reward',
    read: false,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    title: '💡 Mẹo hôm nay',
    message: 'Rửa sạch chai nhựa trước khi bỏ vào thùng tái chế',
    type: 'tip',
    read: true,
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
];

interface AppContextType {
  // User Stats
  userStats: UserStats;
  pointHistory: PointHistory[];
  coupons: Coupon[];
  badges: Badge[];
  weeklyData: { day: string; kg: number; date: string }[];
  weekComparison: { thisWeek: number; lastWeek: number; percentChange: number };
  recentRecords: RecyclingRecord[];
  notifications: Notification[];
  userLevel: UserLevel;
  
  // Actions
  recordRecycling: (record: Omit<RecyclingRecord, 'id' | 'timestamp'>) => void;
  buyCoupon: (name: string, image: string, points: number) => boolean;
  redeemCoupon: (couponId: string) => boolean;
  refreshData: (language?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userStats, setUserStats] = useState<UserStats>(getUserStats());
  const [pointHistory, setPointHistory] = useState<PointHistory[]>(getPointHistory());
  const [coupons, setCoupons] = useState<Coupon[]>(getCoupons());
  const [badges, setBadges] = useState<Badge[]>(getBadges());
  const [weeklyData, setWeeklyData] = useState<{ day: string; kg: number; date: string }[]>(getWeeklyData());
  const [weekComparison, setWeekComparison] = useState(getWeekComparison());
  const [recentRecords, setRecentRecords] = useState<RecyclingRecord[]>(getRecyclingRecords().slice(0, 3));
  const [notifications, setNotifications] = useState<Notification[]>(getDefaultNotifications());

  const userLevel = calculateUserLevel(userStats.points, userStats.totalKg);

  const refreshData = useCallback((language?: string) => {
    setUserStats(getUserStats());
    setPointHistory(getPointHistory());
    setCoupons(getCoupons());
    setBadges(getBadges());
    setWeeklyData(getWeeklyData(language));
    setWeekComparison(getWeekComparison());
    setRecentRecords(getRecyclingRecords().slice(0, 3));
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const recordRecycling = useCallback((record: Omit<RecyclingRecord, 'id' | 'timestamp'>) => {
    addRecyclingRecord(record);
    refreshData();
  }, [refreshData]);

  const buyCoupon = useCallback((name: string, image: string, points: number): boolean => {
    const result = purchaseCoupon(name, image, points);
    if (result) {
      refreshData();
      return true;
    }
    return false;
  }, [refreshData]);

  const redeemCoupon = useCallback((couponId: string): boolean => {
    const result = useCoupon(couponId);
    if (result) {
      refreshData();
      return true;
    }
    return false;
  }, [refreshData]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return (
    <AppContext.Provider value={{
      userStats,
      pointHistory,
      coupons,
      badges,
      weeklyData,
      weekComparison,
      recentRecords,
      notifications,
      userLevel,
      recordRecycling,
      buyCoupon,
      redeemCoupon,
      refreshData,
      markNotificationRead,
      markAllNotificationsRead,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
