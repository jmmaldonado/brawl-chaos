import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { GameMode } from '../../types';

interface GameModesViewProps {
  gameModes: any[];
  onBack: () => void;
  onSelect: (modeId: GameMode) => void;
}

export const GameModesView: React.FC<GameModesViewProps> = ({
  gameModes,
  onBack,
  onSelect
}) => {
  return (
    <motion.div 
      key="modes"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="absolute inset-0 bg-slate-950 z-20 flex flex-col"
    >
      <div className="p-4 flex items-center gap-4 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Modos de Juego</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {gameModes.map(mode => (
          <button 
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={`${mode.color} p-4 rounded-[24px] flex items-center gap-4 group hover:scale-[1.02] transition-all shadow-2xl text-left relative overflow-hidden`}
          >
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 -skew-x-12 translate-x-1/2" />
            <div className="bg-white/20 p-4 rounded-[16px] relative z-10">
              {mode.icon}
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black uppercase italic tracking-tight">{mode.name}</h3>
              <p className="opacity-80 font-bold text-sm">{mode.description}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};
