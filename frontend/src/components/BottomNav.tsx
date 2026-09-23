import React from 'react';
import { Compass, Search, Heart, ListMusic } from 'lucide-react';

export type MobileTab = 'explore' | 'search' | 'library' | 'queue';

interface BottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  favoritesCount: number;
  queueCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  favoritesCount,
  queueCount,
}) => {
  const tabs = [
    {
      id: 'explore' as MobileTab,
      label: 'Explore',
      icon: Compass,
    },
    {
      id: 'search' as MobileTab,
      label: 'Search',
      icon: Search,
    },
    {
      id: 'library' as MobileTab,
      label: 'Library',
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
    },
    {
      id: 'queue' as MobileTab,
      label: 'Queue',
      icon: ListMusic,
      badge: queueCount > 0 ? queueCount : undefined,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090f]/90 backdrop-blur-2xl border-t border-white/[0.08] px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] select-none">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all relative group ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-tr from-red-500/20 to-rose-500/20 text-rose-400 scale-105'
                      : 'group-hover:scale-105'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                </div>
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md shadow-rose-500/30">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight font-medium transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-white/45'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
