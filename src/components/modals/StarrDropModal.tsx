import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Coins, CheckCircle2, RotateCcw } from 'lucide-react';
import { DropTier, Brawler } from '../../types';
import { RARITY_COLORS } from '../../constants';
import { CachedAvatar } from '../common/CachedAvatar';

interface StarrDropModalProps {
  isOpening: boolean;
  isShuffling: boolean;
  dropTier: DropTier;
  dropAttempts: number;
  dropResult: { type: 'credits' | 'brawler'; value: any } | null;
  onRoll: () => void;
  onFinish: () => void;
  onClose: () => void;
}

export const StarrDropModal: React.FC<StarrDropModalProps> = ({
  isOpening,
  isShuffling,
  dropTier,
  dropAttempts,
  dropResult,
  onRoll,
  onFinish,
  onClose
}) => {
  const hasRolled = dropAttempts < 3;

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
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] blur-[150px] rounded-full transition-colors duration-500" 
              style={{ backgroundColor: `${RARITY_COLORS[dropTier as any] || '#3b82f6'}20` }}
            />
          </div>

          {!dropResult ? (
            <div className="relative flex flex-col items-center gap-12 w-full max-w-sm">
              <motion.div 
                animate={isShuffling ? { 
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 180, 270, 360],
                } : { 
                  scale: [1, 1.05, 1],
                  rotate: [0, -2, 2, 0]
                }}
                transition={isShuffling ? { 
                  scale: { repeat: Infinity, duration: 0.2 },
                  rotate: { repeat: Infinity, duration: 0.1, ease: "linear" }
                } : { 
                  repeat: Infinity, 
                  duration: 2 
                }}
                className="relative cursor-pointer"
                onClick={!isShuffling && dropAttempts > 0 ? onRoll : undefined}
              >
                <div 
                  className="w-48 h-48 rounded-[40px] flex items-center justify-center shadow-[0_0_100px_rgba(0,0,0,0.5)] relative z-10 border-[8px] border-white/20 transition-all duration-300"
                  style={{ backgroundColor: RARITY_COLORS[dropTier as any] || '#3b82f6' }}
                >
                  <Star className="w-24 h-24 text-white fill-current" />
                </div>
                <div 
                  className="absolute inset-0 blur-[40px] opacity-50 animate-pulse transition-all duration-300"
                  style={{ backgroundColor: RARITY_COLORS[dropTier as any] || '#3b82f6' }}
                />
              </motion.div>

              <div className="text-center z-10 w-full">
                <AnimatePresence mode="wait">
                  <motion.h2 
                    key={dropTier}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="text-6xl font-black uppercase italic mb-2 tracking-tighter" 
                    style={{ 
                      color: RARITY_COLORS[dropTier as any],
                      textShadow: `0 0 20px ${RARITY_COLORS[dropTier as any]}40`
                    }}
                  >
                    {dropTier}
                  </motion.h2>
                </AnimatePresence>
                
                {isShuffling ? (
                  <p className="text-xl font-black uppercase text-yellow-400 animate-bounce">Sorteando...</p>
                ) : (
                  <p className="text-sm font-black uppercase opacity-50 tracking-widest">
                    {hasRolled ? '¿Te gusta este resultado?' : '¡Tira para ver qué consigues!'}
                  </p>
                )}

                <div className="mt-8 flex flex-col gap-4">
                  {(!hasRolled || (hasRolled && dropAttempts > 0)) && (
                    <button 
                      onClick={onRoll}
                      disabled={isShuffling}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-800 text-slate-950 p-5 rounded-3xl font-black uppercase text-2xl tracking-tighter shadow-[0_8px_0_rgb(161,98,7)] disabled:shadow-none active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                    >
                      {isShuffling ? (
                        'Mezclando...'
                      ) : (
                        <>
                          <RotateCcw className="w-6 h-6" />
                          {hasRolled ? 'REINTENTAR' : 'LANZAR'}
                        </>
                      )}
                    </button>
                  )}

                  {hasRolled && !isShuffling && (
                    <button 
                      onClick={onFinish}
                      className="w-full bg-white hover:bg-slate-100 text-slate-950 p-5 rounded-3xl font-black uppercase text-2xl tracking-tighter shadow-[0_8px_0_rgb(203,213,225)] active:translate-y-1 active:shadow-none transition-all"
                    >
                      ABRIR RECOMPENSA
                    </button>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-center gap-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i <= dropAttempts ? 'w-8 bg-yellow-400' : 'w-2 bg-white/10'
                      }`} 
                    />
                  ))}
                  <span className="ml-2 font-black text-xs uppercase opacity-50 tracking-widest">
                    {dropAttempts} Intentos
                  </span>
                </div>
              </div>
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
