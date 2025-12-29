import { useState, useRef, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, School, MapPin, Crown, Flame, ChevronDown, Target, Zap, Star, X, Lock, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserStats, getBadges, Badge as BadgeType } from '../services/userDataService';

export default function Ranking() {
  const { t } = useLanguage();
  const [timeFilter, setTimeFilter] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [groupFilter, setGroupFilter] = useState<'individual' | 'class' | 'neighborhood'>('individual');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const myRankRef = useRef<HTMLDivElement>(null);

  // Load real user data
  const [userStats, setUserStats] = useState(getUserStats());
  const [userBadges, setUserBadges] = useState<BadgeType[]>(getBadges());

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUserStats(getUserStats());
    setUserBadges(getBadges());
    setIsRefreshing(false);
  };

  // Scroll to my position
  const scrollToMyRank = () => {
    myRankRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const badges = [
    { id: '1', name: t('ranking.badge.streak7'), icon: Flame, color: 'orange', unlocked: userBadges.find(b => b.id === '1')?.unlocked ?? false, description: 'Phân loại rác 7 ngày liên tiếp', condition: 'Streak >= 7 ngày', unlockedAt: userBadges.find(b => b.id === '1')?.unlockedAt },
    { id: '2', name: t('ranking.badge.kg100'), icon: Trophy, color: 'yellow', unlocked: userBadges.find(b => b.id === '2')?.unlocked ?? false, description: 'Tổng cộng phân loại được 100kg rác', condition: 'Tổng kg >= 100', unlockedAt: userBadges.find(b => b.id === '2')?.unlockedAt },
    { id: '3', name: t('ranking.badge.master'), icon: Award, color: 'purple', unlocked: userBadges.find(b => b.id === '3')?.unlocked ?? false, description: 'Đạt cấp độ Eco Master', condition: 'Hoàn thành 50 lần phân loại', unlockedAt: userBadges.find(b => b.id === '3')?.unlockedAt },
    { id: '4', name: t('ranking.badge.points1000'), icon: Medal, color: 'blue', unlocked: userBadges.find(b => b.id === '4')?.unlocked ?? false, description: 'Tích lũy được 1000 điểm thưởng', condition: 'Điểm >= 1000', progress: Math.min(100, (userStats.points / 1000) * 100) },
    { id: '5', name: t('ranking.badge.streak30'), icon: Crown, color: 'yellow', unlocked: userBadges.find(b => b.id === '5')?.unlocked ?? false, description: 'Phân loại rác 30 ngày liên tiếp', condition: 'Streak >= 30 ngày', progress: Math.min(100, (userStats.streak / 30) * 100) },
  ];

  const weeklyIndividual = [
    { rank: 1, name: 'Nguyễn Văn An', points: 2850, kg: 42.5, avatar: '🌟', change: 0 },
    { rank: 2, name: 'Trần Thị Bình', points: 2640, kg: 38.2, avatar: '🌿', change: 1 },
    { rank: 3, name: 'Lê Hoàng Cường', points: 2420, kg: 35.8, avatar: '♻️', change: -1 },
    { rank: 4, name: 'Phạm Thị Dung', points: 2180, kg: 32.4, avatar: '🌍', change: 0 },
    { rank: 5, name: `${t('ranking.you')} (${t('dashboard.username')})`, points: userStats.points, kg: userStats.totalKg, avatar: '👤', change: 2, isMe: true },
    { rank: 6, name: 'Võ Minh Quân', points: 1820, kg: 26.3, avatar: '🎯', change: -1 },
    { rank: 7, name: 'Đặng Thị Hoa', points: 1680, kg: 24.1, avatar: '⭐', change: 1 },
  ];

  const monthlyIndividual = [
    { rank: 1, name: 'Nguyễn Văn An', points: 12450, kg: 186.2, avatar: '🌟', change: 0 },
    { rank: 2, name: 'Trần Thị Bình', points: 11320, kg: 168.4, avatar: '🌿', change: 0 },
    { rank: 3, name: `${t('ranking.you')} (${t('dashboard.username')})`, points: userStats.points * 4, kg: userStats.totalKg * 4, avatar: '👤', change: 1, isMe: true },
    { rank: 4, name: 'Lê Hoàng Cường', points: 10240, kg: 152.6, avatar: '♻️', change: -1 },
    { rank: 5, name: 'Phạm Thị Dung', points: 9680, kg: 142.3, avatar: '🌍', change: 0 },
  ];

  const allTimeIndividual = [
    { rank: 1, name: 'Nguyễn Văn An', points: 58450, kg: 876.2, avatar: '🌟', change: 0 },
    { rank: 2, name: 'Trần Thị Bình', points: 52320, kg: 784.4, avatar: '🌿', change: 0 },
    { rank: 3, name: 'Lê Hoàng Cường', points: 48240, kg: 722.6, avatar: '♻️', change: 0 },
    { rank: 4, name: `${t('ranking.you')} (${t('dashboard.username')})`, points: userStats.points * 12, kg: userStats.totalKg * 12, avatar: '👤', change: 2, isMe: true },
    { rank: 5, name: 'Phạm Thị Dung', points: 35680, kg: 532.3, avatar: '🌍', change: -1 },
  ];

  const classRanking = [
    { rank: 1, name: 'Lớp 10A2', points: 48650, members: 32, avatar: '🏆', change: 0 },
    { rank: 2, name: 'Lớp 9B3', points: 45200, members: 30, avatar: '🥈', change: 0 },
    { rank: 3, name: 'Lớp 11C1', points: 42800, members: 28, avatar: '🥉', change: 0 },
  ];

  const neighborhoodRanking = [
    { rank: 1, name: 'Phường 1 - Đà Lạt', points: 185400, members: 1240, avatar: '🏙️', change: 0 },
    { rank: 2, name: 'Phường 2 - Đà Lạt', points: 172300, members: 1180, avatar: '🌆', change: 0 },
    { rank: 3, name: 'Phường 3 - Đà Lạt', points: 168900, members: 1320, avatar: '🏘️', change: 0 },
  ];

  const getRankingData = () => {
    if (groupFilter === 'class') return classRanking;
    if (groupFilter === 'neighborhood') return neighborhoodRanking;
    if (timeFilter === 'alltime') return allTimeIndividual;
    return timeFilter === 'weekly' ? weeklyIndividual : monthlyIndividual;
  };

  const rankingData = getRankingData();

  // Find user's rank
  const myRankData = rankingData.find((item: any) => item.isMe);
  const myRank = myRankData?.rank || 0;
  const unlockedBadgeCount = badges.filter(b => b.unlocked).length;

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-4">
      {/* Header */}
      <div className="bg-green-600 text-white px-6 pt-8 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <h1>{t('ranking.title')}</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* My Stats Card */}
        {groupFilter === 'individual' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <p className="text-white/80 text-sm">{t('ranking.yourRank')}</p>
                  <p className="text-2xl font-bold">#{myRank}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-white/80 text-xs">{t('ranking.points')}</p>
                  <p className="font-semibold">{userStats.points.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/80 text-xs">{t('common.kg')}</p>
                  <p className="font-semibold">{userStats.totalKg.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/80 text-xs">🔥 {t('ranking.streak')}</p>
                  <p className="font-semibold">{userStats.streak}</p>
                </div>
              </div>
            </div>

            {myRankData?.change !== undefined && myRankData.change !== 0 && (
              <div className={`mt-2 text-sm flex items-center gap-1 ${myRankData.change > 0 ? 'text-green-300' : 'text-red-300'}`}>
                <TrendingUp className={`w-4 h-4 ${myRankData.change < 0 ? 'rotate-180' : ''}`} />
                <span>{myRankData.change > 0 ? '+' : ''}{myRankData.change} {t('ranking.vsLastWeek')}</span>
              </div>
            )}

            <button
              onClick={scrollToMyRank}
              className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              {t('ranking.viewMyPosition')}
            </button>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="space-y-3">
          {/* Group Filter */}
          <div className="flex gap-2">
            <motion.button
              onClick={() => setGroupFilter('individual')}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${groupFilter === 'individual'
                  ? 'bg-white text-green-700'
                  : 'bg-white/20 text-white'
                }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              {t('ranking.individual')}
            </motion.button>
            <motion.button
              onClick={() => setGroupFilter('class')}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${groupFilter === 'class'
                  ? 'bg-white text-green-700'
                  : 'bg-white/20 text-white'
                }`}
            >
              <School className="w-4 h-4 inline mr-2" />
              {t('ranking.class')}
            </motion.button>
            <motion.button
              onClick={() => setGroupFilter('neighborhood')}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${groupFilter === 'neighborhood'
                  ? 'bg-white text-green-700'
                  : 'bg-white/20 text-white'
                }`}
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              {t('ranking.neighborhood')}
            </motion.button>
          </div>

          {/* Time Filter - Only for Individual */}
          {groupFilter === 'individual' && (
            <div className="flex gap-2">
              <motion.button
                onClick={() => setTimeFilter('weekly')}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${timeFilter === 'weekly'
                    ? 'bg-white text-green-700'
                    : 'bg-white/20 text-white'
                  }`}
              >
                {t('ranking.weekly')}
              </motion.button>
              <motion.button
                onClick={() => setTimeFilter('monthly')}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${timeFilter === 'monthly'
                    ? 'bg-white text-green-700'
                    : 'bg-white/20 text-white'
                  }`}
              >
                {t('ranking.monthly')}
              </motion.button>
              <motion.button
                onClick={() => setTimeFilter('alltime')}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${timeFilter === 'alltime'
                    ? 'bg-white text-green-700'
                    : 'bg-white/20 text-white'
                  }`}
              >
                {t('ranking.allTime')}
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {/* Skeleton Loading */}
        {isLoading ? (
          <>
            {/* Skeleton Podium */}
            <div className="flex items-end justify-center gap-3 mb-6">
              <div className="flex-1 text-center">
                <div className="bg-gray-200 animate-pulse rounded-t-2xl h-32"></div>
                <div className="bg-gray-300 animate-pulse h-20 rounded-b-xl"></div>
              </div>
              <div className="flex-1 text-center">
                <div className="bg-gray-200 animate-pulse rounded-t-2xl h-40"></div>
                <div className="bg-gray-300 animate-pulse h-28 rounded-b-xl"></div>
              </div>
              <div className="flex-1 text-center">
                <div className="bg-gray-200 animate-pulse rounded-t-2xl h-28"></div>
                <div className="bg-gray-300 animate-pulse h-16 rounded-b-xl"></div>
              </div>
            </div>
            {/* Skeleton List */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full"></div>
                <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="flex items-end justify-center gap-3 mb-6">
              {/* 2nd Place */}
              {rankingData[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex-1 text-center"
                >
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl pt-4 pb-2 px-3">
                    <div className="text-4xl mb-2">{rankingData[1].avatar}</div>
                    <p className="text-sm mb-1 truncate">{rankingData[1].name}</p>
                    <p className="text-green-600">{rankingData[1].points.toLocaleString()}P</p>
                  </div>
                  <div className="bg-gray-300 h-20 rounded-b-xl flex items-center justify-center">
                    <span className="text-2xl text-gray-600">2</span>
                  </div>
                </motion.div>
              )}

              {/* 1st Place */}
              {rankingData[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 text-center"
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  </motion.div>
                  <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-t-2xl pt-4 pb-2 px-3 relative overflow-hidden">
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    />
                    <div className="text-4xl mb-2 relative">{rankingData[0].avatar}</div>
                    <p className="text-sm mb-1 truncate relative">{rankingData[0].name}</p>
                    <p className="text-green-600 font-semibold relative">{rankingData[0].points.toLocaleString()}P</p>
                  </div>
                  <div className="bg-yellow-400 h-28 rounded-b-xl flex items-center justify-center">
                    <span className="text-2xl text-yellow-800 font-bold">1</span>
                  </div>
                </motion.div>
              )}

              {/* 3rd Place */}
              {rankingData[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex-1 text-center"
                >
                  <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-t-2xl pt-4 pb-2 px-3">
                    <div className="text-4xl mb-2">{rankingData[2].avatar}</div>
                    <p className="text-sm mb-1 truncate">{rankingData[2].name}</p>
                    <p className="text-green-600">{rankingData[2].points.toLocaleString()}P</p>
                  </div>
                  <div className="bg-amber-400 h-16 rounded-b-xl flex items-center justify-center">
                    <span className="text-2xl text-amber-800">3</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Ranking List */}
            <div className="space-y-2">
              {rankingData.slice(3).map((item: any, index) => (
                <motion.div
                  key={index}
                  ref={item.isMe ? myRankRef : null}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 3) * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl ${item.isMe
                      ? 'bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-300 shadow-md'
                      : 'bg-white border border-gray-200'
                    }`}
                >
                  <span className={`text-xl w-8 text-center font-semibold ${getRankColor(item.rank)}`}>
                    {item.rank}
                  </span>

                  <div className="text-3xl">{item.avatar}</div>

                  <div className="flex-1">
                    <p className={`font-medium ${item.isMe ? 'text-green-700' : ''}`}>
                      {item.name}
                      {item.isMe && <span className="ml-2 text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full">{t('ranking.you')}</span>}
                    </p>
                    <div className="flex gap-4 mt-1">
                      <p className="text-sm text-gray-600">{item.points.toLocaleString()}P</p>
                      {item.kg !== undefined && (
                        <p className="text-sm text-green-600">{item.kg.toFixed(1)}{t('common.kg')}</p>
                      )}
                      {item.members !== undefined && (
                        <p className="text-sm text-gray-600">{item.members} {t('ranking.members')}</p>
                      )}
                    </div>
                  </div>

                  {item.change !== undefined && item.change !== 0 && (
                    <div className={`flex items-center gap-1 ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <TrendingUp className={`w-4 h-4 ${item.change < 0 ? 'rotate-180' : ''}`} />
                      <span className="text-sm">{Math.abs(item.change)}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Badge Showcase */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3>{t('ranking.badges')}</h3>
                <span className="text-sm text-gray-500">{unlockedBadgeCount}/{badges.length} {t('ranking.unlocked')}</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {badges.map((badge, index) => {
                  const Icon = badge.icon;
                  const colorMap: any = {
                    orange: 'from-orange-400 to-orange-500',
                    yellow: 'from-yellow-400 to-yellow-500',
                    purple: 'from-purple-400 to-purple-500',
                    blue: 'from-blue-400 to-blue-500',
                  };

                  return (
                    <motion.button
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedBadge(badge)}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 relative ${badge.unlocked
                            ? `bg-gradient-to-br ${colorMap[badge.color]} shadow-lg`
                            : 'bg-gray-200'
                          }`}
                      >
                        {!badge.unlocked && (
                          <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                            <Lock className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <Icon className={`w-6 h-6 ${badge.unlocked ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <p className={`text-xs text-center line-clamp-2 ${badge.unlocked ? 'text-gray-700' : 'text-gray-400'}`}>
                        {badge.name}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
            >
              {/* Badge Header */}
              <div className={`p-6 text-center ${selectedBadge.unlocked
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                  : 'bg-gray-100 text-gray-700'
                }`}>
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 ${selectedBadge.unlocked
                    ? `bg-gradient-to-br ${selectedBadge.color === 'orange' ? 'from-orange-400 to-orange-500' :
                      selectedBadge.color === 'yellow' ? 'from-yellow-400 to-yellow-500' :
                        selectedBadge.color === 'purple' ? 'from-purple-400 to-purple-500' :
                          'from-blue-400 to-blue-500'
                    } shadow-lg`
                    : 'bg-gray-200'
                  }`}>
                  {(() => {
                    const Icon = selectedBadge.icon;
                    return <Icon className={`w-10 h-10 ${selectedBadge.unlocked ? 'text-white' : 'text-gray-400'}`} />;
                  })()}
                </div>

                <h3 className="text-xl font-bold">{selectedBadge.name}</h3>
                {selectedBadge.unlocked ? (
                  <p className="text-sm text-white/80 flex items-center justify-center gap-1 mt-1">
                    <Check className="w-4 h-4" /> {t('ranking.unlocked')}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                    <Lock className="w-4 h-4" /> {t('ranking.locked')}
                  </p>
                )}
              </div>

              {/* Badge Content */}
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('encyclopedia.detail')}</p>
                  <p className="text-gray-700">{selectedBadge.description}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('encyclopedia.classificationReason')}</p>
                  <p className="text-gray-700 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    {selectedBadge.condition}
                  </p>
                </div>

                {selectedBadge.unlocked && selectedBadge.unlockedAt && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('ranking.unlocked')}</p>
                    <p className="text-gray-700">{selectedBadge.unlockedAt}</p>
                  </div>
                )}

                {!selectedBadge.unlocked && selectedBadge.progress !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{t('ranking.progress')}</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedBadge.progress}%` }}
                        className="bg-green-500 h-3 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{selectedBadge.progress.toFixed(0)}%</p>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
