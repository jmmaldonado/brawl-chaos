import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Coins, CheckCircle2 } from 'lucide-react';
import { DropTier, Brawler } from '../../types';
import { RARITY_COLORS } from '../../constants';
import { CachedAvatar } from '../common/CachedAvatar';

interface StarrDropModalProps {
  isOpening: boolean;
  dropTier: DropTier;
  dropAttempts: number;
  dropResult: { type: 'credits' | 'brawler'; value: any } | null;
  onEvolve: () => void;
  onFinish: () => void;
  onClose: () => void;
}

export const StarrDropModal: React.FC<StarrDropModalProps> = ({
  isOpening,
  dropTier,
  dropAttempts,
  dropResult,
  onEvolve,
  onFinish,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isOpening && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-8 overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-500/10 blur-[150px] rounded-full animate-pulse" />
          </div>

          {!dropResult ? (
            <div className="relative flex flex-col items-center gap-8">
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, -2, 2, 0]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="relative cursor-pointer"
                onClick={onEvolve}
              >
                <div 
                  className="w-48 h-48 rounded-[40px] flex items-center justify-center shadow-[0_0_100px_rgba(0,0,0,0.5)] relative z-10 border-[8px] border-white/20"
                  style={{ backgroundColor: RARITY_COLORS[dropTier as any] || '#3b82f6' }}
                >
                  <Star className="w-24 h-24 text-white fill-current" />
                </div>
                <div 
                  className="absolute inset-0 blur-[40px] opacity-50 animate-pulse"
                  style={{ backgroundColor: RARITY_COLORS[dropTier as any] || '#3b82f6' }}
                />
              </motion.div>

              <div className="text-center z-10">
                <h2 className="text-4xl font-black uppercase italic mb-2 tracking-tighter" style={{ color: RARITY_COLORS[dropTier as any] }}>
                  {dropTier}
                </h2>
                <p className="text-sm font-black uppercase opacity-50 tracking-widest">¡Toca para evolucionar!</p>
                {dropAttempts > 0 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-4 bg-white/10 px-4 py-2 rounded-full border-2 border-white/10"
                  >
                    <span className="font-black text-xl text-yellow-400 italic">{dropAttempts}</span>
                    <span className="ml-2 font-black text-[8px] opacity-70 uppercase tracking-widest">Intentos Extra</span>
                  </motion.div>
                )}
              </div>

              <button 
                onClick={onFinish}
                className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-full font-black uppercase tracking-[0.3em] text-[10px] border-2 border-white/10 transition-all active:scale-95"
              >
                ABRIR AHORA
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="relative flex flex-col items-center gap-8 max-w-xs w-full text-center"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-yellow-400/20 blur-[100px] rounded-full group-hover:bg-yellow-400/30 transition-all duration-700" />
                {dropResult.type === 'credits' ? (
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-40 h-40 bg-blue-500 rounded-[40px] flex items-center justify-center shadow-2xl border-8 border-white/20">
                      <Coins className="w-20 h-20 text-white" />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-6xl font-black italic tracking-tighter text-blue-400">+{dropResult.value}</span>
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-400/70">Créditos</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="relative">
                      <CachedAvatar 
                        name={(dropResult.value as Brawler).name} 
                        alt={(dropResult.value as Brawler).name}
                        className="w-48 h-48 object-cover rounded-[48px] border-8 border-yellow-500 shadow-2xl"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 px-6 py-2 rounded-2xl border-4 border-slate-950 shadow-xl">
                        <span className="text-xl font-black uppercase italic tracking-tighter text-slate-950 whitespace-nowrap">¡NUEVO BRAWLER!</span>
                      </div>
                    </div>
                    <h3 className="text-4xl font-black uppercase italic mt-6 tracking-tighter">{(dropResult.value as Brawler).name}</h3>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 w-full mt-8">
                <div className="bg-white/5 p-4 rounded-3xl border-2 border-white/10 flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <span className="font-black uppercase italic tracking-tighter text-green-500">Recompensa añadida</span>
                </div>
                
                <button 
                  onClick={onClose}
                  className="bg-white text-slate-950 p-5 rounded-3xl font-black uppercase text-2xl tracking-tighter shadow-[0_8px_0_rgb(203,213,225)] active:translate-y-1 active:shadow-none transition-all"
                >
                  CONTINUAR
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
