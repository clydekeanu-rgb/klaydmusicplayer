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
    { id: 'history' as NavTab, label: 'History', icon: History },
    { id: 'queue' as NavTab, label: 'Playing Queue', icon: ListMusic },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-black/30 backdrop-blur-md hidden md:flex flex-col justify-between p-4 select-none shrink-0">
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
            Library
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm shadow-black/40'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-white/50'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-3 py-3 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/5">
          <div className="flex items-center gap-2 text-xs font-medium text-red-400 mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Smart Radio Enabled</span>
          </div>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Auto-queue automatically discovers and queues related tracks when your playlist ends.
          </p>
        </div>
      </div>

      {/* Mini Now-Playing Artwork in Sidebar */}
      {currentTrack && (
        <div
          onClick={onOpenFullPlayer}
          className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer transition-all flex items-center gap-3 group"
        >
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-12 h-12 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{currentTrack.title}</p>
            <p className="text-[11px] text-white/50 truncate">{currentTrack.artist}</p>
          </div>
        </div>
      )}
    </aside>
  );
};
