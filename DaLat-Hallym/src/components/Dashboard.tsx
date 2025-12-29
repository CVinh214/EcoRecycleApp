import { useState, useEffect } from 'react';
import { Camera, Search, Target, Leaf, TrendingUp, Award, Sparkles, Flame, Bell, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useApp } from '../contexts/AppContext';
import LanguageSelector from './LanguageSelector';

interface DashboardProps {
  onNavigateToCamera: () => void;
  onNavigateToSearch: () => void;
}

export default function Dashboard({ onNavigateToCamera, onNavigateToSearch }: DashboardProps) {
  const { t, language } = useLanguage();
  const { userStats, weeklyData, weekComparison, recentRecords, notifications, userLevel, refreshData } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Refresh data when language changes
  useEffect(() => {
    refreshData(language);
  }, [language, refreshData]);
  
  const currentPoints = userStats.points;
  const totalKg = userStats.totalKg;
  const goalKg = userStats.goalKg;
  const progressPercent = (totalKg / goalKg) * 100;
  const streak = userStats.streak;
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const todayTip = [t('dashboard.tip1'), t('dashboard.tip2'), t('dashboard.tip3')][new Date().getDate() % 3];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-4 overflow-y-auto">
      {/* Header */}
      <div className="bg-green-600 text-white px-6 pt-8 pb-6 rounded-b-3xl relative">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-green-100">{t('dashboard.greeting')}</p>
            <h1 className="mt-1">{t('dashboard.username')}</h1>
            {/* User Level + Streak */}
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-medium">
                Lv.{userLevel.level}
              </span>
              <span className="text-green-200 text-xs">{userLevel.title}</span>
              {/* Streak Badge */}
              <div className="flex items-center bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-2 py-0.5 gap-1">
                <Flame className="w-3 h-3 text-yellow-300" />
                <span className="text-xs font-bold">{streak}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            {/* Notification Bell */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative bg-white/20 backdrop-blur-sm rounded-full p-3"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Notifications Dropdown - Fixed position below header */}
        <AnimatePresence>
          {showNotifications && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setShowNotifications(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed left-4 right-4 top-20 bg-white rounded-2xl shadow-2xl z-50 max-w-md mx-auto overflow-hidden"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
              >
                <div className="p-3 border-b border-gray-100 bg-green-600 text-white">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    {t('notifications.title')}
                  </h3>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 border-b border-gray-100 ${!notif.read ? 'bg-green-50' : 'bg-white'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.read ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 leading-tight">{t(`notifications.${notif.id}.title`)}</p>
                          <p className="text-gray-500 text-xs mt-1 leading-relaxed">{t(`notifications.${notif.id}.message`)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Compact Stats Cards - 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-3"
          >
            <div className="flex items-center gap-2 text-green-100 mb-1">
              <Sparkles className="w-3 h-3" />
              <span className="text-xs">{t('dashboard.myPoints')}</span>
            </div>
            <p className="text-lg font-bold">{currentPoints.toLocaleString()}P</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-3"
          >
            <div className="flex items-center gap-2 text-green-100 mb-1">
              <Leaf className="w-3 h-3" />
              <span className="text-xs">{t('dashboard.monthlyTotal')}</span>
            </div>
            <p className="text-lg font-bold">{totalKg} {t('common.kg')}</p>
          </motion.div>
        </div>

        {/* Level Progress Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 bg-white/10 rounded-xl p-2"
        >
          <div className="flex justify-between text-xs text-green-100 mb-1">
            <span>Level {userLevel.level}</span>
            <span>{userLevel.currentXP}/{userLevel.nextLevelXP} XP</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${userLevel.progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-yellow-400 rounded-full"
            />
          </div>
        </motion.div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {/* Goal Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              <h3>{t('dashboard.goalProgress')}</h3>
            </div>
            <span className="text-green-600">{progressPercent.toFixed(0)}%</span>
          </div>
          
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
            />
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>{t('dashboard.current')} {totalKg}{t('common.kg')}</span>
            <span>{t('dashboard.goal')} {goalKg}{t('common.kg')}</span>
          </div>
        </motion.div>

        {/* Recent Activity */}
        {recentRecords.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('dashboard.recentActivity')}</h3>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {recentRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{record.itemName}</p>
                      <p className="text-xs text-gray-500">{record.weight}kg • {record.category}</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-semibold">+{record.points}P</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 7-Day Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3>{t('dashboard.weeklyTrend')}</h3>
            </div>
            {/* Week comparison badge */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              weekComparison.percentChange >= 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {weekComparison.percentChange >= 0 ? '↑' : '↓'} {Math.abs(weekComparison.percentChange)}%
            </div>
          </div>
          
          {/* Summary stats */}
          <div className="flex justify-between mb-3 text-sm">
            <div>
              <span className="text-gray-500">{t('dashboard.thisWeek')}:</span>
              <span className="font-bold text-green-600 ml-1">{weekComparison.thisWeek}kg</span>
            </div>
            <div>
              <span className="text-gray-500">{t('dashboard.lastWeek')}:</span>
              <span className="font-medium text-gray-600 ml-1">{weekComparison.lastWeek}kg</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}kg`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} kg`, t('dashboard.recycled')]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.date;
                  }
                  return label;
                }}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="kg" 
                stroke="#22c55e" 
                fillOpacity={1} 
                fill="url(#colorKg)" 
                strokeWidth={2}
                dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#16a34a', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          
          {/* Chart description */}
          <p className="text-xs text-gray-400 text-center mt-2">
            {t('dashboard.chartDescription')}
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            onClick={onNavigateToCamera}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-5 shadow-lg shadow-green-200 hover:shadow-xl transition-shadow active:shadow-md"
          >
            <Camera className="w-8 h-8 mb-2" />
            <p>{t('dashboard.cameraRecognition')}</p>
            <p className="text-xs text-green-100 mt-1">{t('dashboard.startRecycling')}</p>
          </motion.button>

          <motion.button
            onClick={onNavigateToSearch}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-5 shadow-lg shadow-blue-200 hover:shadow-xl transition-shadow active:shadow-md"
          >
            <Search className="w-8 h-8 mb-2" />
            <p>{t('dashboard.searchByName')}</p>
            <p className="text-xs text-blue-100 mt-1">{t('dashboard.findItems')}</p>
          </motion.button>
        </motion.div>

        {/* Daily Tip */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200"
        >
          <h3 className="text-amber-900 mb-2">{t('dashboard.dailyTip')}</h3>
          <p className="text-amber-800">{todayTip}</p>
        </motion.div>
      </div>
    </div>
  );
}
