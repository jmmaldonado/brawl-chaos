import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Coins, Package } from 'lucide-react';

interface MatchResultModalProps {
  matchResult: 'win' | 'loss' | null;
  lastRank: number | null;
  rewards: { trophies: number, drops: number, credits: number } | null;
  onContinue: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  matchResult,
  lastRank,
  rewards,
  onContinue
}) => {
  if (!matchResult || !rewards) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-xl"
      >
        <motion.div 
          initial={{ scale: 0.5, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-slate-900 p-6 rounded-[40px] border-4 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-xs w-full text-center flex flex-col gap-6"
        >
          <div className="space-y-1">
            <h2 className={`text-4xl font-black uppercase italic tracking-tighter ${matchResult === 'win' ? 'text-yellow-400' : 'text-red-500'}`}>
              {lastRank ? (lastRank === 1 ? '¡VICTORIA!' : `PUESTO #${lastRank}`) : (matchResult === 'win' ? '¡VICTORIA!' : 'DERROTA')}
            </h2>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Resumen de Partida</p>
          </div>
          
          <div className="flex justify-center relative">
            {matchResult === 'win' ? (
              <>
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full" 
                />
                <Trophy className="w-24 h-24 text-yellow-400 relative z-10" />
              </>
            ) : (
              <X className="w-24 h-24 text-red-500" />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <span className="text-sm font-black text-white/60 uppercase">Trofeos</span>
              </div>
              <span className={`text-2xl font-black italic ${rewards.trophies >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {rewards.trophies >= 0 ? `+${rewards.trophies}` : rewards.trophies}
              </span>
            </div>
            
            {rewards.credits > 0 && (
              <div className="bg-slate-800/50 p-4 rounded-3xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm font-black text-white/60 uppercase">Créditos</span>
                </div>
                <span className="text-2xl font-black italic text-blue-400">+{rewards.credits}</span>
              </div>
            )}
            
            {rewards.drops > 0 && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="bg-purple-500/10 p-4 rounded-3xl border-2 border-purple-500/30 flex items-center justify-between relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-black text-purple-400 uppercase leading-none">Bonus Caótico</span>
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">¡Conseguido!</span>
                  </div>
                </div>
                <span className="text-3xl font-black italic text-purple-400">+{rewards.drops}</span>
              </motion.div>
            )}
          </div>

          <button 
            onClick={onContinue}
            className="group relative bg-blue-500 hover:bg-blue-400 text-white p-5 rounded-[24px] font-black uppercase text-xl shadow-[0_6px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
          >
            CONTINUAR
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.div>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

