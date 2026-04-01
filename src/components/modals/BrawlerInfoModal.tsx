import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Swords, Move, Ruler } from 'lucide-react';
import { Brawler } from '../../types';
import { RARITY_COLORS } from '../../constants';

interface BrawlerInfoModalProps {
  brawler: Brawler | null;
  onClose: () => void;
}

export const BrawlerInfoModal: React.FC<BrawlerInfoModalProps> = ({
  brawler,
  onClose
}) => {
  return (
    <AnimatePresence>
      {brawler && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-slate-900 p-6 rounded-[32px] border-2 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-sm w-full relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center gap-4">
              <img 
                src={brawler.image} 
                alt={brawler.name} 
                className="w-40 h-40 object-cover rounded-[24px] border-4 border-white/10 shadow-2xl"
                referrerPolicy="no-referrer"
              />
              
              <div className="text-center w-full">
                <span className="px-4 py-1 rounded-full font-black uppercase tracking-[0.2em] text-[10px] border-2 mb-2 inline-block" style={{ borderColor: RARITY_COLORS[brawler.rarity], color: RARITY_COLORS[brawler.rarity] }}>
                  {brawler.rarity}
                </span>
                <h3 className="text-3xl font-black uppercase italic mb-4 tracking-tighter">{brawler.name}</h3>
                
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="bg-slate-800/50 p-2 rounded-2xl border border-white/5 flex flex-col items-center gap-0.5">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-[8px] font-black uppercase opacity-50">Salud</span>
                    <span className="text-sm font-black">{brawler.stats.hp}</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-2xl border border-white/5 flex flex-col items-center gap-0.5">
                    <Swords className="w-4 h-4 text-orange-500" />
                    <span className="text-[8px] font-black uppercase opacity-50">Daño</span>
                    <span className="text-sm font-black">{brawler.stats.damage}</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-2xl border border-white/5 flex flex-col items-center gap-0.5">
                    <Move className="w-4 h-4 text-blue-500" />
                    <span className="text-[8px] font-black uppercase opacity-50">Velocidad</span>
                    <span className="text-sm font-black">{brawler.stats.speed.toFixed(1)}</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-2xl border border-white/5 flex flex-col items-center gap-0.5">
                    <Ruler className="w-4 h-4 text-green-500" />
                    <span className="text-[8px] font-black uppercase opacity-50">Alcance</span>
                    <span className="text-sm font-black">{brawler.stats.range.toFixed(1)}</span>
                  </div>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed px-2">{brawler.description}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
