import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Coins, Package } from 'lucide-react';

interface MatchResultModalProps {
  matchResult: 'win' | 'loss' | null;
  lastRank: number | null;
  onContinue: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  matchResult,
  lastRank,
  onContinue
}) => {
  return (
    <AnimatePresence>
      {matchResult && (
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
            <h2 className={`text-4xl font-black uppercase italic tracking-tighter ${matchResult === 'win' ? 'text-yellow-400' : 'text-red-500'}`}>
              {lastRank ? (lastRank === 1 ? '¡VICTORIA!' : `PUESTO #${lastRank}`) : (matchResult === 'win' ? '¡VICTORIA!' : 'DERROTA')}
            </h2>
            
            <div className="flex justify-center relative">
              {matchResult === 'win' ? (
                <>
                  <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full" />
                  <Trophy className="w-24 h-24 text-yellow-400 relative z-10" />
                </>
              ) : (
                <X className="w-24 h-24 text-red-500" />
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase opacity-50 mb-1 tracking-widest">Recompensa</p>
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-xl font-black italic">
                    {lastRank 
                      ? (lastRank <= 4 ? `+${10 - lastRank * 2}` : `-${lastRank}`) 
                      : (matchResult === 'win' ? '+8' : '-4')}
                  </span>
                </div>
              </div>
              
              {lastRank && (
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="w-5 h-5 text-blue-400" />
                    <span className="text-lg font-black uppercase italic">+{Math.max(0, 50 - lastRank * 5)} Créditos</span>
                  </div>
                </div>
              )}
              
              {matchResult === 'win' && (
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-center gap-2">
                    <Package className="w-5 h-5 text-purple-400" />
                    <span className="text-lg font-black uppercase italic">Bonus: 1 Caída</span>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={onContinue}
              className="bg-blue-500 hover:bg-blue-400 text-white p-4 rounded-2xl font-black uppercase text-xl shadow-[0_6px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all"
            >
              CONTINUAR
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
