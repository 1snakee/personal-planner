import { useState } from 'react';
import { NotesTab } from './components/NotesTab';
import { GymTab } from './components/GymTab';
import { FinanceTab } from './components/FinanceTab';
import { InsightsTab } from './components/InsightsTab';
import { FileText, Dumbbell, Wallet, BarChart3 } from 'lucide-react';

type TabType = 'notes' | 'gym' | 'finance' | 'insights';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('notes');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'notes':
        return <NotesTab />;
      case 'gym':
        return <GymTab />;
      case 'finance':
        return <FinanceTab />;
      case 'insights':
        return <InsightsTab />;
      default:
        return <NotesTab />;
    }
  };

  const tabs = [
    { id: 'notes' as TabType, label: 'Notes', icon: FileText },
    { id: 'gym' as TabType, label: 'Gym', icon: Dumbbell },
    { id: 'finance' as TabType, label: 'Finance', icon: Wallet },
    { id: 'insights' as TabType, label: 'Insights', icon: BarChart3 }
  ];

  return (
    <div className="w-full h-[100dvh] flex flex-col overflow-hidden bg-white dark:bg-[#121212] text-[#1A1A1A] dark:text-[#F3F4F6] pt-[env(safe-area-inset-top)] select-none relative">
      
      {/* Content Frame */}
      <div className="flex-1 overflow-hidden relative">
        <div key={activeTab} className="w-full h-full animate-fade-in-up">
          {renderActiveTab()}
        </div>
      </div>

      {/* Floating Glassmorphism Bottom-Bar */}
      <div className="absolute bottom-0 left-0 right-0 w-full px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pointer-events-none flex justify-center" style={{ zIndex: 50 }}>
        <nav className="w-full max-w-md bg-white/70 dark:bg-[#121212]/70 backdrop-blur-md border border-gray-200/50 dark:border-[#2D3748]/50 rounded-2xl p-2 pointer-events-auto shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <div className="grid grid-cols-4 w-full h-14 relative">
            
            {/* Sliding Active Highlight */}
            <div 
              className="absolute top-0 bottom-0 left-0 w-1/4 transition-transform duration-300 ease-out z-0"
              style={{ transform: `translateX(${tabs.findIndex(t => t.id === activeTab) * 100}%)` }}
            >
              <div className="w-full h-full bg-accent-sage/10 rounded-xl" />
            </div>

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex flex-col items-center justify-center relative w-full h-full z-10"
                  aria-label={`Switch to ${tab.label}`}
                >
                  <div className="flex flex-col items-center justify-center w-full h-full rounded-xl">
                    <Icon 
                      size={22} 
                      className={`transition-colors duration-200 ease-in-out ${isActive ? 'text-accent-sage' : 'text-gray-400 dark:text-gray-500'}`} 
                    />
                    <span className={`text-[10px] font-medium tracking-wide mt-1 transition-colors duration-200 ease-in-out ${
                      isActive ? 'text-accent-sage' : 'text-gray-400 dark:text-gray-500 opacity-80'
                    }`}>
                      {tab.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default App;

