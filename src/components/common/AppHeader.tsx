import React from 'react';
import { Trophy, Coins, Package, Settings } from 'lucide-react';
import { UserState } from '../../types';

interface AppHeaderProps {
  user: UserState;
  onTrophyRoad: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user, onTrophyRoad }) => {
  return (
    <header className="p-4 flex justify-between items-center bg-slate-900/80 border-b border-white/5 backdrop-blur-xl z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={onTrophyRoad}
          className="flex flex-col group hover:scale-105 transition-transform"
        >
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 group-hover:text-yellow-500 transition-colors">Camino del Caos</span>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-black text-xl italic tracking-tighter text-yellow-500">{user.trophies}</span>
          </div>
        </button>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">Créditos</span>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-blue-400" />
            <span className="font-black text-xl italic tracking-tighter text-blue-400">{user.credits}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="bg-slate-800/50 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-400" />
          <span className="font-black text-sm">{user.dailyDropsRemaining}</span>
        </div>
        <button className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl border border-white/5 transition-all">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
