import { Home, Camera, Search, Trophy, Gift, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: 'dashboard' | 'camera' | 'encyclopedia' | 'ranking' | 'rewards' | 'map') => void;
}

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const { t } = useLanguage();
  
  const navItems = [
    { id: 'dashboard', icon: Home, label: t('nav.home') },
    { id: 'camera', icon: Camera, label: t('nav.camera') },
    { id: 'encyclopedia', icon: Search, label: t('nav.search') },
    { id: 'ranking', icon: Trophy, label: t('nav.ranking') },
    { id: 'rewards', icon: Gift, label: t('nav.rewards') },
    { id: 'map', icon: MapPin, label: t('nav.map') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-2 py-2">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-xs mt-1">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}