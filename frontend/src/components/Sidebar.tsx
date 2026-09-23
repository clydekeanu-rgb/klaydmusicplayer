import React from 'react';
import { Compass, Heart, History, ListMusic, Radio } from 'lucide-react';
import { Track } from '../types';

export type NavTab = 'explore' | 'favorites' | 'history' | 'queue';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  favoritesCount: number;
  currentTrack: Track | null;
  onOpenFullPlayer: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  favoritesCount,
  currentTrack,
  onOpenFullPlayer,
}) => {
  const navItems = [
    { id: 'explore' as NavTab, label: 'Explore & Search', icon: Compass },
    { id: 'favorites' as NavTab, label: 'Favorites', icon: Heart, badge: favoritesCount > 0 ? favoritesCount : undefined },
    { id: 'history' as NavTab, label: 'Recently Played', icon: History },
    { id: 'queue' as NavTab, label: 'Playing Queue', icon: ListMusic },
  ];

  return (
    <aside className="w-64 border-r border-white/[0.06] bg-[#09090f]/50 backdrop-blur-xl hidden md:flex flex-col justify-between p-4 select-none shrink-0">
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-white/35 mb-2">
            Library
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-red-500/15 via-rose-500/10 to-transparent text-white border border-rose-500/20 shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-rose-400 stroke-[2.2]' : 'text-white/40 group-hover:text-white/70'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Smart Radio Info Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
            <span>Smart Radio Active</span>
          </div>
          <p className="text-[11px] text-white/45 leading-relaxed">
            klyd dynamically queues recommended tracks using YouTube Music machine intelligence.
          </p>
        </div>
      </div>

      {/* Mini Now-Playing Artwork in Sidebar */}
      {currentTrack && (
        <div
          onClick={onOpenFullPlayer}
          className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06] cursor-pointer transition-all flex items-center gap-3 group shadow-lg"
        >
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-11 h-11 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform border border-white/10"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate group-hover:text-rose-300 transition-colors">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-white/45 truncate mt-0.5 font-medium">{currentTrack.artist}</p>
          </div>
        </div>
      )}
    </aside>
  );
};
