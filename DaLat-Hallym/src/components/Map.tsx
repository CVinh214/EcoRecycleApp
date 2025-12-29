import { useState, useEffect, useMemo } from 'react';
import { MapPin, Navigation, Recycle, Battery, Trash2, Wine, X, Clock, Info, Calendar, Search, Heart, Share2, Check, Loader2, ArrowUpDown, MapPinned, ExternalLink, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

// Types
interface Location {
  id: number;
  name: string;
  type: string;
  address: string;
  distance: string;
  distanceMeters: number;
  hours: string;
  items: string[];
  lat: number;
  lng: number;
  icon: any;
  color: string;
}

interface Campaign {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
  participants: number;
  maxParticipants: number;
}

// Helper: Calculate distance from coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper: Format distance
const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

// Favorites storage
const getFavorites = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem('map_favorites') || '[]');
  } catch {
    return [];
  }
};

const saveFavorites = (favorites: number[]) => {
  localStorage.setItem('map_favorites', JSON.stringify(favorites));
};

// Campaign registrations storage
const getRegistrations = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem('campaign_registrations') || '[]');
  } catch {
    return [];
  }
};

const saveRegistrations = (registrations: number[]) => {
  localStorage.setItem('campaign_registrations', JSON.stringify(registrations));
};

export default function Map() {
  const { t } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [registrations, setRegistrations] = useState<number[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showRegisterToast, setShowRegisterToast] = useState<string | null>(null);

  // Default user location (Dalat center)
  const defaultLocation = { lat: 11.9404, lng: 108.4583 };

  const baseLocations = [
    {
      id: 1,
      name: t('location.dalat1'),
      type: 'recycle',
      address: 'Đường Trần Phú, Phường 4, Đà Lạt, Lâm Đồng',
      hours: '09:00 - 18:00',
      items: ['Nhựa', 'Lon nhôm', 'Chai thủy tinh', 'Giấy'],
      lat: 11.9404,
      lng: 108.4583,
      icon: Recycle,
      color: 'blue',
    },
    {
      id: 2,
      name: t('location.dalat2'),
      type: 'battery',
      address: 'Hồ Xuân Hương, Phường 10, Đà Lạt, Lâm Đồng',
      hours: '24 giờ',
      items: ['Pin', 'Thiết bị điện tử nhỏ'],
      lat: 11.9345,
      lng: 108.4425,
      icon: Battery,
      color: 'red',
    },
    {
      id: 3,
      name: t('location.dalat3'),
      type: 'general',
      address: 'Đường Nguyễn Chí Thanh, Phường 1, Đà Lạt',
      hours: '08:00 - 20:00',
      items: ['Quần áo', 'Giày dép', 'Túi xách'],
      lat: 11.9465,
      lng: 108.4505,
      icon: Trash2,
      color: 'gray',
    },
    {
      id: 4,
      name: t('location.dalat4'),
      type: 'glass',
      address: 'Chợ Đà Lạt, Phường 1, Đà Lạt, Lâm Đồng',
      hours: '24 giờ',
      items: ['Chai thủy tinh'],
      lat: 11.9425,
      lng: 108.4445,
      icon: Wine,
      color: 'green',
    },
    {
      id: 5,
      name: 'Điểm thu gom Phường 3',
      type: 'recycle',
      address: 'Đường Phan Đình Phùng, Phường 3, Đà Lạt',
      hours: '07:00 - 19:00',
      items: ['Nhựa', 'Giấy', 'Kim loại'],
      lat: 11.9380,
      lng: 108.4520,
      icon: Recycle,
      color: 'blue',
    },
    {
      id: 6,
      name: 'Thùng pin Đại học Đà Lạt',
      type: 'battery',
      address: 'Số 1 Phù Đổng Thiên Vương, Phường 8, Đà Lạt',
      hours: '24 giờ',
      items: ['Pin', 'Ắc quy nhỏ'],
      lat: 11.9510,
      lng: 108.4400,
      icon: Battery,
      color: 'red',
    },
  ];

  // Calculate distances and create locations array
  const locations: Location[] = useMemo(() => {
    const refLocation = userLocation || defaultLocation;
    return baseLocations.map(loc => {
      const distanceMeters = calculateDistance(refLocation.lat, refLocation.lng, loc.lat, loc.lng);
      return {
        ...loc,
        distance: formatDistance(distanceMeters),
        distanceMeters,
      };
    });
  }, [userLocation, t]);

  const filterTypes = [
    { id: 'all', name: t('common.all'), icon: MapPin, color: 'green' },
    { id: 'recycle', name: t('map.type.recycle'), icon: Recycle, color: 'blue' },
    { id: 'battery', name: t('map.type.battery'), icon: Battery, color: 'red' },
    { id: 'glass', name: t('map.type.glass'), icon: Wine, color: 'green' },
    { id: 'general', name: t('map.type.general'), icon: Trash2, color: 'gray' },
  ];

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    let result = locations;
    
    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(loc => loc.type === filterType);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(loc => 
        loc.name.toLowerCase().includes(query) ||
        loc.address.toLowerCase().includes(query) ||
        loc.items.some(item => item.toLowerCase().includes(query))
      );
    }
    
    // Sort
    if (sortBy === 'distance') {
      result = [...result].sort((a, b) => a.distanceMeters - b.distanceMeters);
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }
    
    return result;
  }, [locations, filterType, searchQuery, sortBy]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: 1,
      title: 'Chiến dịch Môi trường Đà Lạt',
      date: '28.12.2024',
      location: 'Hồ Xuân Hương',
      description: 'Thử thách Không Nhựa',
      participants: 45,
      maxParticipants: 100,
    },
    {
      id: 2,
      title: 'Chương trình Giáo dục Tái chế',
      date: '30.12.2024',
      location: 'UBND Thành phố Đà Lạt',
      description: 'Phương pháp phân loại đúng',
      participants: 28,
      maxParticipants: 50,
    },
    {
      id: 3,
      title: 'Dọn dẹp Hồ Tuyền Lâm',
      date: '05.01.2025',
      location: 'Hồ Tuyền Lâm',
      description: 'Thu gom rác quanh hồ',
      participants: 67,
      maxParticipants: 150,
    },
  ]);

  const colorMap: Record<string, { bg: string; light: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    red: { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    green: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    gray: { bg: 'bg-gray-500', light: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  };

  // Load favorites and registrations
  useEffect(() => {
    setFavorites(getFavorites());
    setRegistrations(getRegistrations());
    
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Get user location
  const getUserLocation = () => {
    setGpsLoading(true);
    setGpsError(null);
    
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ GPS');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsLoading(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError(t('map.gpsError.denied'));
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError(t('map.gpsError.unavailable'));
            break;
          case error.TIMEOUT:
            setGpsError(t('map.gpsError.timeout'));
            break;
          default:
            setGpsError(t('map.gpsError.unknown'));
        }
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Toggle favorite
  const toggleFavorite = (locationId: number) => {
    const newFavorites = favorites.includes(locationId)
      ? favorites.filter(id => id !== locationId)
      : [...favorites, locationId];
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  // Register for campaign
  const registerCampaign = (campaignId: number) => {
    if (registrations.includes(campaignId)) {
      // Unregister
      const newRegistrations = registrations.filter(id => id !== campaignId);
      setRegistrations(newRegistrations);
      saveRegistrations(newRegistrations);
      setCampaigns(prev => prev.map(c => 
        c.id === campaignId ? { ...c, participants: c.participants - 1 } : c
      ));
      setShowRegisterToast(t('map.cancelRegistration'));
    } else {
      // Register
      const newRegistrations = [...registrations, campaignId];
      setRegistrations(newRegistrations);
      saveRegistrations(newRegistrations);
      setCampaigns(prev => prev.map(c => 
        c.id === campaignId ? { ...c, participants: c.participants + 1 } : c
      ));
      setShowRegisterToast(t('map.registerSuccess'));
    }
    setTimeout(() => setShowRegisterToast(null), 2000);
  };

  // Share location
  const shareLocation = async (location: Location) => {
    const shareData = {
      title: location.name,
      text: `${location.name} - ${location.address}`,
      url: `https://maps.google.com/?q=${location.lat},${location.lng}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      }
    } catch {
      // User cancelled or error
    }
  };

  // Open in Google Maps
  const openInMaps = (location: Location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gray-300 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-full mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-green-600 text-white px-6 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-white/30 rounded animate-pulse" />
            <div className="h-6 w-32 bg-white/30 rounded animate-pulse" />
          </div>
          <div className="w-full h-12 bg-white/20 rounded-xl animate-pulse" />
        </div>
        
        {/* Filter Skeleton */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        {/* Map Skeleton */}
        <div className="mx-6 mt-4 h-64 bg-gray-200 rounded-2xl animate-pulse" />

        {/* List Skeleton */}
        <div className="px-6 py-4 space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3" />
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-green-600 text-white px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8" />
            <h1>{t('map.title')}</h1>
          </div>
          
          {/* Sort Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSortBy(sortBy === 'distance' ? 'name' : 'distance')}
            className="bg-white/20 p-2 rounded-lg"
          >
            <ArrowUpDown className="w-5 h-5" />
          </motion.button>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
          <input
            type="text"
            placeholder={t('map.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/20 backdrop-blur-sm rounded-xl py-3 pl-12 pr-10 placeholder-white/60 text-white outline-none focus:bg-white/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          )}
        </div>
        
        {/* GPS Button */}
        <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={getUserLocation}
          disabled={gpsLoading}
          className="w-full bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-white/30 transition-colors active:bg-white/40 disabled:opacity-50"
        >
          {gpsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          <span>{userLocation ? t('map.updateLocation') : t('map.findLocation')}</span>
          {userLocation && <Check className="w-4 h-4 text-green-300" />}
        </motion.button>
        
        {gpsError && (
          <p className="text-white/80 text-sm mt-2 text-center">{gpsError}</p>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="px-6 py-4 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2">
          {filterTypes.map((type) => {
            const Icon = type.icon;
            return (
              <motion.button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  filterType === type.id
                    ? `${colorMap[type.color].bg} text-white`
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{type.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Sort Info & Favorites Filter */}
      <div className="px-6 py-2 flex items-center justify-between text-sm text-gray-500">
        <span>
          {t('map.sortBy')}: {sortBy === 'distance' ? `📍 ${t('map.sortDistance')}` : `🔤 ${t('map.sortName')}`}
        </span>
        {favorites.length > 0 && (
          <button
            onClick={() => setFilterType(filterType === 'favorites' ? 'all' : 'favorites' as any)}
            className="flex items-center gap-1 text-red-500"
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>{favorites.length} {t('map.favorites')}</span>
          </button>
        )}
      </div>

      {/* Interactive Map */}
      <div className="relative h-64 bg-gradient-to-br from-green-100 to-teal-100 mx-6 mt-2 rounded-2xl overflow-hidden border-2 border-green-200">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        
        {/* Dalat City Label */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
          <p className="text-xs text-gray-500">Đà Lạt, Lâm Đồng</p>
          <p className="text-sm">Việt Nam 🇻🇳</p>
        </div>

        {/* Open in Google Maps */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => window.open(`https://www.google.com/maps/search/recycling+point/@11.9404,108.4583,14z`, '_blank')}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md flex items-center gap-2 text-sm text-gray-700 hover:bg-white"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Google Maps</span>
        </motion.button>
        
        {/* Location Pins on Map */}
        {filteredLocations.slice(0, 6).map((loc, index) => {
          const Icon = loc.icon;
          const isFavorite = favorites.includes(loc.id);
          return (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="absolute cursor-pointer"
              style={{
                left: `${15 + (index % 3) * 30}%`,
                top: `${25 + Math.floor(index / 3) * 30}%`,
              }}
              onClick={() => setSelectedLocation(loc)}
            >
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`${colorMap[loc.color].bg} text-white p-3 rounded-full shadow-lg relative`}
              >
                <Icon className="w-5 h-5" />
                {isFavorite && (
                  <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5">
                    <Heart className="w-3 h-3 fill-white text-white" />
                  </div>
                )}
              </motion.div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full border-2 border-current"></div>
            </motion.div>
          );
        })}

        {/* Current Location Indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="bg-green-600 text-white p-2 rounded-full shadow-lg"
          >
            <MapPinned className="w-4 h-4" />
          </motion.div>
          <div className="absolute inset-0 bg-green-400/30 rounded-full animate-ping" />
        </div>

        {/* Location count badge */}
        <div className="absolute bottom-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm shadow-md">
          {filteredLocations.length} {t('map.points')}
        </div>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Location List */}
        <div>
          <h3 className="mb-3">{t('map.nearbyBins')} ({filteredLocations.length})</h3>
          
          {filteredLocations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('map.noResults')}</p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-green-600 mt-2"
                >
                  {t('map.clearFilter')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLocations.map((loc, index) => {
                const Icon = loc.icon;
                const colors = colorMap[loc.color];
                const isFavorite = favorites.includes(loc.id);
                return (
                  <motion.div
                    key={loc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`${colors.light} ${colors.border} border rounded-xl p-4 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => setSelectedLocation(loc)}
                        className={`${colors.bg} text-white p-3 rounded-full flex-shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0" onClick={() => setSelectedLocation(loc)}>
                        <div className="flex items-start justify-between mb-1">
                          <h3 className={`${colors.text} truncate pr-2`}>{loc.name}</h3>
                          <span className="text-sm text-gray-500 whitespace-nowrap">{loc.distance}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 truncate">{loc.address}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{loc.hours}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {loc.items.slice(0, 3).map((item, i) => (
                            <span key={i} className="bg-white px-2 py-1 rounded text-xs text-gray-600">
                              {item}
                            </span>
                          ))}
                          {loc.items.length > 3 && (
                            <span className="bg-white px-2 py-1 rounded text-xs text-gray-400">
                              +{loc.items.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleFavorite(loc.id)}
                          className={`p-2 rounded-full ${isFavorite ? 'bg-red-100' : 'bg-white'}`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => shareLocation(loc)}
                          className="p-2 rounded-full bg-white"
                        >
                          <Share2 className="w-4 h-4 text-gray-400" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Campaign Banners */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3>{t('map.campaigns')}</h3>
            <span className="text-sm text-gray-500">{campaigns.length} {t('map.events')}</span>
          </div>
          <div className="space-y-3">
            {campaigns.map((campaign, index) => {
              const isRegistered = registrations.includes(campaign.id);
              const isFull = campaign.participants >= campaign.maxParticipants;
              const progressPercent = (campaign.participants / campaign.maxParticipants) * 100;
              
              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4"
                >
                  <div className="flex gap-3">
                    <div className="bg-orange-100 p-3 rounded-full h-fit">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-orange-900 mb-1">{campaign.title}</h3>
                      <p className="text-sm text-orange-700 mb-2">{campaign.description}</p>
                      <div className="flex items-center gap-4 text-xs text-orange-600 mb-3">
                        <span>📅 {campaign.date}</span>
                        <span>📍 {campaign.location}</span>
                      </div>
                      
                      {/* Participants Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-orange-600 mb-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {campaign.participants}/{campaign.maxParticipants} {t('map.participants')}
                          </span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full bg-orange-500 rounded-full"
                          />
                        </div>
                      </div>
                      
                      {/* Register Button */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => registerCampaign(campaign.id)}
                        disabled={isFull && !isRegistered}
                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                          isRegistered
                            ? 'bg-green-500 text-white'
                            : isFull
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                      >
                        {isRegistered ? (
                          <span className="flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" />
                            {t('map.registered')}
                          </span>
                        ) : isFull ? (
                          t('map.full')
                        ) : (
                          t('map.register')
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            {t('map.linkCopied')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register Toast */}
      <AnimatePresence>
        {showRegisterToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {showRegisterToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Detail Modal */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end z-50"
            onClick={() => setSelectedLocation(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <h2>{t('map.detail')}</h2>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFavorite(selectedLocation.id)}
                    className={`p-2 rounded-full ${favorites.includes(selectedLocation.id) ? 'bg-red-100' : 'bg-gray-100'}`}
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(selectedLocation.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => shareLocation(selectedLocation)}
                    className="p-2 rounded-full bg-gray-100"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <button onClick={() => setSelectedLocation(null)} className="p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-6 space-y-6">
                {/* Header */}
                <div className={`${colorMap[selectedLocation.color].light} ${colorMap[selectedLocation.color].border} border rounded-2xl p-5`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${colorMap[selectedLocation.color].bg} text-white p-4 rounded-full`}>
                      {(() => {
                        const Icon = selectedLocation.icon;
                        return <Icon className="w-6 h-6" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <h3 className={colorMap[selectedLocation.color].text}>{selectedLocation.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{selectedLocation.address}</p>
                      <div className="flex items-center gap-2 mt-2 text-gray-600">
                        <Navigation className="w-4 h-4" />
                        <span className="text-sm">{selectedLocation.distance}</span>
                        {favorites.includes(selectedLocation.id) && (
                          <span className="flex items-center gap-1 text-red-500 text-sm ml-2">
                            <Heart className="w-3 h-3 fill-current" /> {t('map.favorite')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-current border-opacity-20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">{t('map.operatingHours')}</span>
                    </div>
                    <p className={colorMap[selectedLocation.color].text}>{selectedLocation.hours}</p>
                  </div>
                </div>

                {/* Accepted Items */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-gray-600" />
                    <h3>{t('map.acceptedItems')}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLocation.items.map((item: string, i: number) => (
                      <span key={i} className="bg-gray-100 px-4 py-2 rounded-lg text-gray-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mini Map Preview */}
                <div className="bg-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{t('map.coordinates')}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-mono">
                    {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => openInMaps(selectedLocation)}
                    className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-5 h-5" />
                    <span>{t('map.getDirections')}</span>
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => shareLocation(selectedLocation)}
                    className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>{t('map.shareLocation')}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
