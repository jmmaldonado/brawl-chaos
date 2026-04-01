import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Play, Users, Package } from 'lucide-react';
import { Brawler, UserState } from '../../types';
import { CachedAvatar } from '../common/CachedAvatar';

interface HomeViewProps {
  selectedBrawler: Brawler;
  selectedMode: string;
  gameModes: any[];
  user: UserState;
  onShowModes: () => void;
  onPlay: () => void;
  onShowBrawlers: () => void;
  onStartDrop: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  selectedBrawler,
  selectedMode,
  gameModes,
  user,
  onShowModes,
  onPlay,
  onShowBrawlers,
  onStartDrop
}) => {
  const currentMode = gameModes.find(m => m.id === selectedMode);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col items-center justify-center p-4 gap-8"
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative z-0"
        >
          <CachedAvatar 
            name={selectedBrawler.name}
            alt={selectedBrawler.name}
            className="w-40 h-40 object-cover rounded-[24px] border-4 border-white/5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 px-4 py-1.5 rounded-xl border-2 border-white/10 shadow-2xl">
            <span className="font-black text-lg tracking-tighter uppercase italic whitespace-nowrap">{selectedBrawler.name}</span>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button 
          onClick={onShowModes}
          className={`${currentMode?.color} p-3 rounded-2xl flex items-center justify-between group hover:brightness-110 transition-all shadow-2xl active:scale-95`}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              {currentMode?.icon}
            </div>
            <div className="text-left">
              <p className="text-[8px] opacity-70 font-black uppercase tracking-widest">Modo Actual</p>
              <p className="text-base font-black uppercase italic tracking-tight">{selectedMode}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <button 
          onClick={onPlay}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 p-4 rounded-2xl flex items-center justify-center gap-3 shadow-[0_6px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none transition-all"
        >
          <Play className="w-6 h-6 fill-current" />
          <span className="text-2xl font-black uppercase italic tracking-tighter">¡JUGAR!</span>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onShowBrawlers}
            className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-[24px] border-2 border-white/5 flex flex-col items-center gap-2 transition-all active:scale-95"
          >
            <Users className="w-6 h-6 text-blue-400" />
            <span className="font-black uppercase text-[10px] tracking-widest">Brawlers</span>
          </button>
          <button 
            onClick={onStartDrop}
            disabled={user.dailyDropsRemaining <= 0}
            className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-[24px] border-2 border-white/5 flex flex-col items-center gap-2 transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Package className="w-6 h-6 text-purple-400 relative z-10" />
            <div className="flex flex-col items-center relative z-10">
              <span className="font-black uppercase text-[10px] tracking-widest">Caída Caótica</span>
              <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">{user.dailyDropsRemaining} DISPONIBLES</span>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
