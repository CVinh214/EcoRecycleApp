import { useState, useEffect, useMemo } from 'react';
import { Gift, Coins, ShoppingBag, Award, Coffee, Leaf, TrendingUp, Ticket, CheckCircle, AlertCircle, Flame, Target, Clock, QrCode, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useApp } from '../contexts/AppContext';

// Simple QR Code generator component
const QRCodeDisplay = ({ value }: { value: string }) => {
  const size = 120;
  const cells = 21;
  const cellSize = size / cells;
  
  // Create deterministic pattern based on value
  const pattern = useMemo(() => {
    const result: boolean[][] = [];
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0;
    }
    
    for (let i = 0; i < cells; i++) {
      result[i] = [];
      for (let j = 0; j < cells; j++) {
        // Position detection patterns (corners)
        if ((i < 7 && j < 7) || (i < 7 && j >= cells - 7) || (i >= cells - 7 && j < 7)) {
          const isOuter = i === 0 || i === 6 || j === 0 || j === 6 || 
                          (i < 7 && (j === cells - 7 || j === cells - 1)) ||
                          (j < 7 && (i === cells - 7 || i === cells - 1)) ||
                          (i >= cells - 7 && (j === 0 || j === 6));
          const isInner = (i >= 2 && i <= 4 && j >= 2 && j <= 4) ||
                          (i >= 2 && i <= 4 && j >= cells - 5 && j <= cells - 3) ||
                          (i >= cells - 5 && i <= cells - 3 && j >= 2 && j <= 4);
          result[i][j] = isOuter || isInner;
        } else {
          result[i][j] = ((hash >> ((i * cells + j) % 32)) & 1) === 1;
        }
      }
    }
    return result;
  }, [value]);

  return (
    <svg width={size} height={size} className="mx-auto">
      <rect width={size} height={size} fill="white" />
      {pattern.map((row, i) =>
        row.map((cell, j) =>
          cell ? (
            <rect
              key={`${i}-${j}`}
              x={j * cellSize}
              y={i * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  );
};

// Skeleton component
const Skeleton = ({ className }: { className: string }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
);

// Calculate days left for coupon
const getDaysLeft = (expiryDate: string) => {
  const today = new Date();
  const [day, month, year] = expiryDate.split('.').map(Number);
  const expiry = new Date(year, month - 1, day);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysLeft;
};

export default function Rewards() {
  const { t } = useLanguage();
  const { userStats, pointHistory, coupons, buyCoupon, redeemCoupon } = useApp();
  const [activeTab, setActiveTab] = useState<'shop' | 'history' | 'coupons'>('shop');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high'>('default');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [expiringNotification, setExpiringNotification] = useState<any>(null);

  const currentPoints = userStats.points;

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Check for expiring coupons notification
  useEffect(() => {
    const checkExpiringCoupons = () => {
      const expiringSoon = coupons.find(coupon => {
        if (coupon.used) return false;
        const daysLeft = getDaysLeft(coupon.expiryDate);
        return daysLeft <= 7 && daysLeft > 0;
      });
      
      if (expiringSoon) {
        setExpiringNotification(expiringSoon);
      }
    };
    
    checkExpiringCoupons();
  }, [coupons]);

  const shopItems = [
    {
      id: 1,
      name: 'Highlands Coffee Americano',
      points: 4500,
      category: t('rewards.category.coupons'),
      icon: Coffee,
      image: '☕',
      stock: 'unlimited',
      isHot: true,
    },
    {
      id: 2,
      name: 'Túi vải thân thiện môi trường',
      points: 2000,
      category: t('rewards.category.ecoGoods'),
      icon: ShoppingBag,
      image: '🛍️',
      stock: 12,
      isHot: false,
    },
    {
      id: 3,
      name: 'Bộ bàn chải tre',
      points: 1500,
      category: t('rewards.category.ecoGoods'),
      icon: Leaf,
      image: '🪥',
      stock: 8,
      isHot: false,
    },
    {
      id: 4,
      name: 'Bình giữ nhiệt',
      points: 3500,
      category: t('rewards.category.ecoGoods'),
      icon: Coffee,
      image: '🥤',
      stock: 5,
      isHot: true,
    },
    {
      id: 5,
      name: 'Chứng chỉ Bảo vệ Môi trường',
      points: 1000,
      category: t('rewards.category.certificate'),
      icon: Award,
      image: '📜',
      stock: 'unlimited',
      isHot: false,
    },
    {
      id: 6,
      name: 'VinMart Voucher 100.000đ',
      points: 5000,
      category: t('rewards.category.coupons'),
      icon: Ticket,
      image: '🎫',
      stock: 'unlimited',
      isHot: false,
    },
  ];

  // Hot items
  const hotItems = shopItems.filter(item => item.isHot);

  // Find next affordable item for progress bar
  const nextAffordableItem = useMemo(() => {
    const affordable = shopItems
      .filter(item => item.points > currentPoints)
      .sort((a, b) => a.points - b.points);
    return affordable[0] || null;
  }, [currentPoints]);

  const progressToNext = nextAffordableItem 
    ? (currentPoints / nextAffordableItem.points) * 100 
    : 100;

  const pointsNeeded = nextAffordableItem 
    ? nextAffordableItem.points - currentPoints 
    : 0;

  const categories = [t('common.all'), t('rewards.category.coupons'), t('rewards.category.ecoGoods'), t('rewards.category.certificate')];
  const [activeCategory, setActiveCategory] = useState(t('common.all'));

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = activeCategory === t('common.all')
      ? shopItems
      : shopItems.filter(item => item.category === activeCategory);
    
    if (sortBy === 'price-low') {
      items = [...items].sort((a, b) => a.points - b.points);
    } else if (sortBy === 'price-high') {
      items = [...items].sort((a, b) => b.points - a.points);
    }
    
    return items;
  }, [activeCategory, sortBy, t]);

  const handlePurchase = (item: any) => {
    setSelectedItem(item);
    setShowPurchaseModal(true);
    setPurchaseSuccess(false);
    setPurchaseError(false);
  };

  const confirmPurchase = () => {
    if (selectedItem) {
      const success = buyCoupon(selectedItem.name, selectedItem.image, selectedItem.points);
      if (success) {
        setPurchaseSuccess(true);
        setTimeout(() => {
          setShowPurchaseModal(false);
          setPurchaseSuccess(false);
        }, 2000);
      } else {
        setPurchaseError(true);
      }
    }
  };

  const handleShowQR = (coupon: any) => {
    setSelectedCoupon(coupon);
    setShowQRModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-4">
      {/* Expiring Coupon Notification */}
      <AnimatePresence>
        {expiringNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 bg-orange-500 text-white px-4 py-3 z-50 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <span className="text-sm">
                Coupon "{expiringNotification.name}" {t('rewards.expiringSoon')}! {t('rewards.expiresIn')} {getDaysLeft(expiringNotification.expiryDate)} {t('rewards.days')}
              </span>
            </div>
            <button onClick={() => setExpiringNotification(null)}>
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className={`bg-green-600 text-white px-6 pt-8 pb-6 rounded-b-3xl ${expiringNotification ? 'mt-12' : ''}`}>
        <div className="flex items-center gap-3 mb-6">
          <Gift className="w-8 h-8" />
          <h1>{t('rewards.title')}</h1>
        </div>

        {/* Points Balance */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-green-100 mb-1">
                <Coins className="w-4 h-4" />
                <span className="text-sm">{t('rewards.balance')}</span>
              </div>
              <p className="text-3xl font-bold">{currentPoints.toLocaleString()}P</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>

          {/* Progress to next reward */}
          {nextAffordableItem && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-1 text-green-100">
                  <Target className="w-4 h-4" />
                  <span>{t('rewards.nextReward')}</span>
                </div>
                <span className="text-white text-xs">{nextAffordableItem.image} {nextAffordableItem.name}</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                  className="bg-white h-2 rounded-full"
                />
              </div>
              <p className="text-green-100 text-xs mt-1">
                {t('rewards.pointsNeeded')} <span className="text-white font-semibold">{pointsNeeded.toLocaleString()}P</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex gap-2">
          {['shop', 'history', 'coupons'].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors relative ${
                activeTab === tab
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {tab === 'shop' && t('rewards.shop')}
              {tab === 'history' && t('rewards.history')}
              {tab === 'coupons' && (
                <>
                  {t('rewards.myCoupons')}
                  {coupons.filter(c => !c.used).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {coupons.filter(c => !c.used).length}
                    </span>
                  )}
                </>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Shop Tab */}
      {activeTab === 'shop' && (
        <div className="px-6 py-4 space-y-4">
          {isLoading ? (
            <>
              {/* Skeleton Loading */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="w-20 h-8 rounded-full flex-shrink-0" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200">
                    <Skeleton className="w-16 h-16 mx-auto mb-3 rounded-full" />
                    <Skeleton className="w-full h-4 mb-2" />
                    <Skeleton className="w-2/3 h-4 mb-3" />
                    <Skeleton className="w-full h-10 rounded-lg" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Hot Items Section */}
              {hotItems.length > 0 && activeCategory === t('common.all') && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-800">Hot Items</h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {hotItems.map((item) => (
                      <motion.div
                        key={`hot-${item.id}`}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePurchase(item)}
                        className="flex-shrink-0 w-40 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-3 cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Flame className="w-3 h-3" /> HOT
                          </span>
                        </div>
                        <div className="text-4xl text-center mb-2">{item.image}</div>
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-orange-600 font-semibold">{item.points.toLocaleString()}P</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Filter + Sort */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
                  {categories.map((cat) => (
                    <motion.button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                        activeCategory === cat
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {cat}
                    </motion.button>
                  ))}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="ml-2 px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="default">{t('rewards.default')}</option>
                  <option value="price-low">{t('rewards.priceLow')}</option>
                  <option value="price-high">{t('rewards.priceHigh')}</option>
                </select>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 gap-4">
                {filteredItems.map((item, index) => {
                  const canAfford = currentPoints >= item.points;
                  const pointsNeededForItem = item.points - currentPoints;
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm relative"
                    >
                      {item.isHot && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                          🔥
                        </span>
                      )}
                      <div className="text-5xl text-center mb-3">{item.image}</div>
                      <h3 className="text-sm font-medium mb-2 min-h-[40px] line-clamp-2">{item.name}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-green-600 font-semibold">{item.points.toLocaleString()}P</span>
                        {item.stock !== 'unlimited' && (
                          <span className="text-xs text-gray-500">{t('rewards.stock')} {item.stock}</span>
                        )}
                      </div>
                      
                      {/* Show points needed */}
                      {!canAfford && (
                        <p className="text-xs text-orange-600 mb-2 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {t('rewards.pointsNeeded')} {pointsNeededForItem.toLocaleString()}P
                        </p>
                      )}
                      
                      <motion.button
                        onClick={() => handlePurchase(item)}
                        disabled={!canAfford}
                        whileTap={canAfford ? { scale: 0.95 } : {}}
                        className={`w-full py-2 rounded-lg transition-colors ${
                          canAfford
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? t('rewards.exchange') : t('rewards.notEnoughPoints')}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <Skeleton className="w-20 h-5 mb-2" />
                      <Skeleton className="w-full h-4" />
                    </div>
                    <Skeleton className="w-16 h-6" />
                  </div>
                </div>
              ))}
            </div>
          ) : pointHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-gray-500 font-medium mb-2">{t('rewards.noHistory')}</h3>
              <p className="text-gray-400 text-sm">{t('dashboard.startRecycling')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pointHistory.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.type === 'earned'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-sm text-gray-500">{item.date}</span>
                    </div>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        item.type === 'earned' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.points > 0 ? '+' : ''}{item.points.toLocaleString()}P
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t('rewards.balance2')} {item.balance.toLocaleString()}P</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl p-5 border-2 border-gray-200">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="w-full h-5 mb-2" />
                      <Skeleton className="w-2/3 h-4 mb-1" />
                      <Skeleton className="w-1/2 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-gray-500 font-medium mb-2">{t('rewards.noCoupons')}</h3>
              <p className="text-gray-400 text-sm mb-4">{t('rewards.exchange')}!</p>
              <button
                onClick={() => setActiveTab('shop')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('rewards.shop')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon, index) => {
                const daysLeft = getDaysLeft(coupon.expiryDate);
                const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
                const isExpired = daysLeft <= 0;
                
                return (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-2xl p-5 border-2 ${
                      coupon.used || isExpired
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : isExpiringSoon
                        ? 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200'
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{coupon.image}</div>
                      <div className="flex-1">
                        <h3 className={coupon.used ? 'text-gray-500' : 'text-gray-900'}>{coupon.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{t('rewards.exchange')}: {coupon.purchaseDate}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <p className={`text-sm ${isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                            {isExpired ? t('rewards.expired') : `${t('rewards.expiresIn')} ${daysLeft} ${t('rewards.days')}`}
                          </p>
                        </div>
                      </div>
                      {coupon.used ? (
                        <div className="bg-gray-400 text-white px-3 py-1 rounded-full text-sm">
                          {t('rewards.usedComplete')}
                        </div>
                      ) : isExpired ? (
                        <div className="bg-red-400 text-white px-3 py-1 rounded-full text-sm">
                          {t('rewards.expired')}
                        </div>
                      ) : (
                        <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                          {t('rewards.available')}
                        </div>
                      )}
                    </div>
                    {!coupon.used && !isExpired && (
                      <div className="flex gap-2 mt-4">
                        <button 
                          onClick={() => handleShowQR(coupon)}
                          className="flex-1 flex items-center justify-center gap-2 bg-white border border-green-300 text-green-700 py-2 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                          {t('rewards.showQR')}
                        </button>
                        <button 
                          onClick={() => redeemCoupon(coupon.id)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          {t('rewards.use')}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center px-6 z-50"
            onClick={() => setShowPurchaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
            >
              {purchaseSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('rewards.exchange')} {t('camera.success')}</h3>
                  <p className="text-gray-600">{t('rewards.myCoupons')}</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">{selectedItem.image}</div>
                    <h3 className="mb-2">{selectedItem.name}</h3>
                    <p className="text-gray-600">{t('rewards.confirmExchange')}</p>
                  </div>

                  {purchaseError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-700 text-sm">{t('rewards.notEnoughPoints')}!</span>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">{t('rewards.requiredPoints')}</span>
                      <span className="text-green-600 font-semibold">{selectedItem.points.toLocaleString()}P</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">{t('rewards.balance')}</span>
                      <span>{currentPoints.toLocaleString()}P</span>
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                      <span>{t('rewards.afterBalance')}</span>
                      <span className={`font-semibold ${currentPoints >= selectedItem.points ? 'text-green-600' : 'text-red-600'}`}>
                        {(currentPoints - selectedItem.points).toLocaleString()}P
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPurchaseModal(false)}
                      className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={confirmPurchase}
                      disabled={currentPoints < selectedItem.points}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {t('rewards.exchange')}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedCoupon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center px-6 z-50"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm text-center"
            >
              <h3 className="font-semibold mb-2">{selectedCoupon.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{t('rewards.showQR')}</p>
              
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 mb-4">
                <QRCodeDisplay value={`ECOAPP-COUPON-${selectedCoupon.id}-${selectedCoupon.name}`} />
              </div>
              
              <p className="text-xs text-gray-400 mb-4">
                {t('rewards.couponCode')}: ECOAPP-{String(selectedCoupon.id).padStart(6, '0')}
              </p>
              
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors"
              >
                {t('common.close')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
