import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import Camera from './components/Camera';
import Encyclopedia from './components/Encyclopedia';
import Ranking from './components/Ranking';
import Rewards from './components/Rewards';
import Map from './components/Map';
import BottomNav from './components/BottomNav';
import AIAssistant, { AIFloatingButton } from './components/AIAssistant';
import { LanguageProvider } from './contexts/LanguageContext';
import { AppProvider } from './contexts/AppContext';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'camera' | 'encyclopedia' | 'ranking' | 'rewards' | 'map'>('dashboard');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard onNavigateToCamera={() => setCurrentScreen('camera')} onNavigateToSearch={() => setCurrentScreen('encyclopedia')} />;
      case 'camera':
        return <Camera onBack={() => setCurrentScreen('dashboard')} />;
      case 'encyclopedia':
        return <Encyclopedia />;
      case 'ranking':
        return <Ranking />;
      case 'rewards':
        return <Rewards />;
      case 'map':
        return <Map />;
      default:
        return <Dashboard onNavigateToCamera={() => setCurrentScreen('camera')} onNavigateToSearch={() => setCurrentScreen('encyclopedia')} />;
    }
  };

  return (
    <LanguageProvider>
      <AppProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-md mx-auto bg-white min-h-screen relative pb-20 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
            <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
            
            {/* AI Assistant */}
            <AIFloatingButton onClick={() => setShowAIAssistant(true)} />
            <AIAssistant isOpen={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
          </div>
        </div>
      </AppProvider>
    </LanguageProvider>
  );
}