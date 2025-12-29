import { useState, useEffect, useCallback } from 'react';
import { Search, Recycle, Leaf, AlertTriangle, Trash2, Wine, ArrowLeft, ExternalLink, Bot, Loader2, Clock, X, TrendingUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { searchRecyclingInfo, getSearchHistory, clearSearchHistory, popularSearches, SearchHistoryItem } from '../services/aiService';

export default function Encyclopedia() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Refresh history after AI search
  const refreshHistory = () => {
    setSearchHistory(getSearchHistory());
  };

  const items = [
    {
      id: 1,
      name: t('item.plasticBottle'),
      category: t('encyclopedia.category.recycle'),
      icon: Recycle,
      color: 'blue',
      binType: 'Thùng chuyên dụng nhựa',
      co2Reduction: 2.3,
      reason: 'Nhựa có thể được tái chế để giảm sử dụng dầu thô và tạo ra sản phẩm mới.',
      benefit: 'Tái chế 1kg giảm 2.3kg CO₂, tiết kiệm 1.5L dầu thô',
      steps: ['Làm rỗng', 'Gỡ nhãn', 'Rửa sạch', 'Tách nắp'],
    },
    {
      id: 2,
      name: t('item.foodWaste'),
      category: t('encyclopedia.category.organic'),
      icon: Leaf,
      color: 'green',
      binType: 'Thùng chuyên dụng thực phẩm',
      co2Reduction: 0.5,
      reason: 'Rác thực phẩm có thể được ủ phân để cải thiện đất và giảm khí mêtan.',
      benefit: 'Xử lý 1kg giảm 85% khí mêtan, tạo 0.3kg phân bón',
      steps: ['Loại nước', 'Tách tạp chất', 'Gỡ túi nilon', 'Dùng túi chuyên dụng'],
    },
    {
      id: 3,
      name: t('item.battery'),
      category: t('encyclopedia.category.hazardous'),
      icon: AlertTriangle,
      color: 'red',
      binType: 'Thùng chất nguy hại chuyên dụng',
      co2Reduction: 0,
      reason: 'Pin chứa kim loại nặng, cần xử lý riêng để ngăn ô nhiễm đất và nước ngầm.',
      benefit: 'Ngăn ô nhiễm thủy ngân, cadmium và bảo vệ đất',
      steps: ['Bỏ vào túi trong suốt', 'Thả vào thùng chuyên dụng', 'Cẩn thận với pin bị vỡ'],
    },
    {
      id: 4,
      name: t('item.paperCup'),
      category: t('encyclopedia.category.recycle'),
      icon: Recycle,
      color: 'blue',
      binType: 'Thùng chuyên dụng giấy',
      co2Reduction: 1.8,
      reason: 'Cốc giấy được tái chế thành bột giấy để làm sản phẩm giấy mới.',
      benefit: 'Tái chế 1kg bảo vệ 17 cây, tiết kiệm 31L nước',
      steps: ['Làm rỗng', 'Rửa sạch', 'Loại nước', 'Ép lại và bỏ'],
    },
    {
      id: 5,
      name: t('item.styrofoam'),
      category: t('encyclopedia.category.recycle'),
      icon: Recycle,
      color: 'blue',
      binType: 'Thùng chuyên dụng xốp',
      co2Reduction: 3.1,
      reason: 'Xốp có thể được tái chế thành vật liệu xây dựng hoặc khung ảnh.',
      benefit: 'Tái chế 1kg tiết kiệm 1.2L dầu',
      steps: ['Loại tạp chất', 'Gỡ băng keo', 'Rửa sạch', 'Nén lại và bỏ'],
    },
    {
      id: 6,
      name: t('item.plasticBag'),
      category: t('encyclopedia.category.other'),
      icon: Trash2,
      color: 'gray',
      binType: 'Thùng chuyên dụng túi nilon',
      co2Reduction: 1.2,
      reason: 'Túi nilon được phân loại riêng để tái chế thành sản phẩm túi mới.',
      benefit: 'Tái chế 1kg tiết kiệm 0.8L dầu',
      steps: ['Loại tạp chất', 'Rửa sạch', 'Buộc lại và bỏ'],
    },
  ];

  const [aiSearchResult, setAiSearchResult] = useState<string | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [autoSearchTriggered, setAutoSearchTriggered] = useState(false);

  const filteredItems = searchQuery
    ? items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const categories = [
    { name: t('common.all'), color: 'gray', icon: Search },
    { name: t('encyclopedia.category.recycle'), color: 'blue', icon: Recycle },
    { name: t('encyclopedia.category.organic'), color: 'green', icon: Leaf },
    { name: t('encyclopedia.category.hazardous'), color: 'red', icon: AlertTriangle },
    { name: t('encyclopedia.category.other'), color: 'gray', icon: Trash2 },
  ];

  const [activeCategory, setActiveCategory] = useState(t('common.all'));

  const categoryFiltered = activeCategory === t('common.all')
    ? filteredItems
    : filteredItems.filter(item => item.category === activeCategory);

  // Auto search with AI when no local results
  useEffect(() => {
    if (searchQuery.trim() && categoryFiltered.length === 0 && !isAiSearching && !aiSearchResult && !autoSearchTriggered) {
      const timer = setTimeout(() => {
        setAutoSearchTriggered(true);
        handleAiSearch();
      }, 800); // Đợi 800ms sau khi user ngừng gõ
      return () => clearTimeout(timer);
    }
  }, [searchQuery, categoryFiltered.length, isAiSearching, aiSearchResult, autoSearchTriggered]);

  // Reset auto search trigger when query changes
  useEffect(() => {
    setAutoSearchTriggered(false);
  }, [searchQuery]);

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    setShowSuggestions(false);
    try {
      const result = await searchRecyclingInfo(searchQuery);
      setAiSearchResult(result);
      refreshHistory();
    } catch (error) {
      setAiSearchResult('Không thể tìm kiếm. Vui lòng thử lại.');
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setAiSearchResult(null);
    // Trigger AI search immediately for suggestions
    setTimeout(() => {
      setAutoSearchTriggered(true);
    }, 100);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  // Filter suggestions based on input
  const filteredSuggestions = searchQuery.trim()
    ? popularSearches.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    : popularSearches.slice(0, 6);

  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-green-600 text-white px-6 pt-8 pb-6">
        <h1 className="mb-4">{t('encyclopedia.title')}</h1>
        
        {/* Search Bar */}
        <div className="relative flex gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('encyclopedia.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setAiSearchResult(null); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyPress={(e) => e.key === 'Enter' && handleAiSearch()}
              className={`w-full pl-12 ${searchQuery ? 'pr-10' : 'pr-4'} py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300`}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setAiSearchResult(null); setShowSuggestions(false); }}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleAiSearch}
            disabled={isAiSearching || !searchQuery.trim()}
            className="bg-white/20 backdrop-blur-sm px-4 rounded-xl hover:bg-white/30 transition-colors disabled:opacity-50"
            title={t('encyclopedia.aiSearch')}
          >
            {isAiSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
          </button>
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && !aiSearchResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-6 right-6 top-full mt-2 bg-white rounded-xl shadow-lg z-50 overflow-hidden"
            >
              {/* Search History */}
              {searchHistory.length > 0 && !searchQuery && (
                <div className="border-b border-gray-100">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t('encyclopedia.searchHistory')}
                    </span>
                    <button
                      onClick={handleClearHistory}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {t('encyclopedia.clearHistory')}
                    </button>
                  </div>
                  {searchHistory.slice(0, 5).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(item.query)}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{item.query}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <div className="px-4 py-2 bg-gray-50">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {searchQuery ? t('encyclopedia.popularSearches') : t('encyclopedia.popularSearches')}
                  </span>
                </div>
                <div className="p-2 flex flex-wrap gap-2">
                  {filteredSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowSuggestions(false)}
                className="w-full py-2 text-center text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-100"
              >
                {t('common.close')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Filter */}
      <div className="px-6 py-4 border-b border-gray-100 overflow-x-auto">
        <div className="flex gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.name}
                onClick={() => { setActiveCategory(cat.name); setAiSearchResult(null); }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === cat.name
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{cat.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* AI Search Result */}
      {aiSearchResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-green-600" />
            <h3 className="text-green-800 font-medium">{t('encyclopedia.aiResult')}</h3>
            <button 
              onClick={() => setAiSearchResult(null)}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {aiSearchResult}
          </div>
        </motion.div>
      )}

      {/* Items List */}
      <div className="px-6 py-4 space-y-3">
        {categoryFiltered.map((item, index) => {
          const Icon = item.icon;
          const colors = colorMap[item.color as keyof typeof colorMap];
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className={`w-full ${colors.bg} ${colors.border} border rounded-xl p-4 hover:shadow-md transition-shadow text-left`}
            >
              <div className="flex items-start gap-4">
                <div className={`${colors.badge} rounded-full p-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className={colors.text}>{item.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.binType}</p>
                  {item.co2Reduction > 0 && (
                    <p className="text-xs text-green-600 mt-2">
                      CO₂ {item.co2Reduction}{t('common.kg')} {t('camera.co2Reduction')}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </div>
            </motion.button>
          );
        })}

        {categoryFiltered.length === 0 && !aiSearchResult && (
          <div className="text-center py-12">
            {isAiSearching ? (
              <>
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600 font-medium">{t('encyclopedia.searching')}</p>
                <p className="text-gray-400 text-sm mt-1">{t('common.search')}</p>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('encyclopedia.noResults')}</p>
                {searchQuery && (
                  <button
                    onClick={handleAiSearch}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Bot className="w-4 h-4" />
                    {t('encyclopedia.aiSearch')} "{searchQuery}"
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 z-10">
                <button onClick={() => setSelectedItem(null)} className="p-2">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2>{t('encyclopedia.detail')}</h2>
              </div>

              <div className="px-6 py-6 space-y-6">
                {/* Item Header */}
                <div className={`${colorMap[selectedItem.color as keyof typeof colorMap].bg} ${colorMap[selectedItem.color as keyof typeof colorMap].border} border rounded-2xl p-5`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${colorMap[selectedItem.color as keyof typeof colorMap].badge} rounded-full p-4`}>
                      {(() => {
                        const Icon = selectedItem.icon;
                        return <Icon className="w-6 h-6" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <span className={`${colorMap[selectedItem.color as keyof typeof colorMap].badge} px-3 py-1 rounded-full text-sm inline-block mb-2`}>
                        {selectedItem.category}
                      </span>
                      <h3 className={colorMap[selectedItem.color as keyof typeof colorMap].text}>{selectedItem.name}</h3>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-current border-opacity-20">
                    <p className="text-sm mb-1">{t('encyclopedia.disposalLocation')}</p>
                    <p className={colorMap[selectedItem.color as keyof typeof colorMap].text}>{selectedItem.binType}</p>
                  </div>
                </div>

                {/* Classification Reason */}
                <div>
                  <h3 className="mb-3">{t('encyclopedia.classificationReason')}</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedItem.reason}</p>
                </div>

                {/* Environmental Benefit */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="text-green-800 mb-2">{t('encyclopedia.environmentalBenefit')}</h3>
                  <p className="text-green-700">{selectedItem.benefit}</p>
                </div>

                {/* Processing Steps */}
                <div>
                  <h3 className="mb-3">{t('encyclopedia.processingMethod')}</h3>
                  <div className="space-y-2">
                    {selectedItem.steps.map((step: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        <span className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
