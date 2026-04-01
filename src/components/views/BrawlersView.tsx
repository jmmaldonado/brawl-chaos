import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Users, Info, Heart, Coins, Swords, Move, Ruler } from 'lucide-react';
import { Brawler, UserState } from '../../types';
import { RARITY_COSTS, RARITY_COLORS } from '../../constants';

interface BrawlersViewProps {
  user: UserState;
  brawlers: Brawler[];
  searchTerm: string;
  onSearch: (term: string) => void;
  onBack: () => void;
  onShowBrawlerInfo: (brawler: Brawler) => void;
  onUnlock: (brawler: Brawler) => void;
  onSelect: (brawler: Brawler) => void;
}

export const BrawlersView: React.FC<BrawlersViewProps> = ({
  user,
  brawlers,
  searchTerm,
  onSearch,
  onBack,
  onShowBrawlerInfo,
  onUnlock,
  onSelect
}) => {
  return (
    <motion.div 
      key="brawlers"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="absolute inset-0 bg-slate-950 z-20 flex flex-col"
    >
      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Colección</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="bg-slate-800 border-2 border-white/5 rounded-xl px-4 py-2 w-32 sm:w-48 focus:border-blue-500 outline-none transition-all font-bold text-sm"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-white/5">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="font-black text-sm">{user.unlockedBrawlers.length} / {brawlers.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
        {[...brawlers].sort((a, b) => {
          const aUnlocked = user.unlockedBrawlers.includes(a.id);
          const bUnlocked = user.unlockedBrawlers.includes(b.id);

          if (aUnlocked && !bUnlocked) return -1;
          if (!aUnlocked && bUnlocked) return 1;

          if (aUnlocked) {
            const aPower = a.stats.hp + a.stats.damage + (a.stats.speed * 100) + (a.stats.range * 100);
            const bPower = b.stats.hp + b.stats.damage + (b.stats.speed * 100) + (b.stats.range * 100);
            return bPower - aPower;
          } else {
            const aCost = RARITY_COSTS[a.rarity];
            const bCost = RARITY_COSTS[b.rarity];
            return aCost - bCost;
          }
        }).map(brawler => {
          const isUnlocked = user.unlockedBrawlers.includes(brawler.id);
          const isSelected = user.selectedBrawlerId === brawler.id;
          const cost = RARITY_COSTS[brawler.rarity];
          
          return (
            <motion.div 
              key={brawler.id}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`relative rounded-[24px]  border-4 transition-all duration-500 group ${isSelected ? 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'border-white/5 bg-slate-900/50 hover:border-white/20'}`}
            >
              <div className="aspect-[4/5] relative">
                <img 
                  src={brawler.image} 
                  alt={brawler.name} 
                  className={`w-full h-full object-cover transition-all duration-1000 ${!isUnlocked ? 'grayscale brightness-50 blur-lg' : ''}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] backdrop-blur-xl border border-white/20" style={{ backgroundColor: `${RARITY_COLORS[brawler.rarity]}44`, color: RARITY_COLORS[brawler.rarity] }}>
                    {brawler.rarity}
                  </span>
                </div>

                <button 
                  onClick={() => onShowBrawlerInfo(brawler)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-xl rounded-lg border border-white/10 hover:bg-black/80 transition-all"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 flex flex-col gap-3">
                <h3 className="text-lg font-black uppercase italic tracking-tighter truncate">{brawler.name}</h3>
                
              
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-lg border border-white/5">
                    <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                    <span className="text-[10px] font-black">{brawler.stats.hp}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-lg border border-white/5">
                    <Swords className="w-3 h-3 text-orange-500 fill-orange-500" />
                    <span className="text-[10px] font-black">{brawler.stats.damage}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-lg border border-white/5">
                    <Move className="w-3 h-3 text-blue-500 fill-blue-500" />
                    <span className="text-[10px] font-black">{brawler.stats.speed.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-lg border border-white/5">
                    <Ruler className="w-3 h-3 text-green-500 fill-green-500" />
                    <span className="text-[10px] font-black">{brawler.stats.range.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {!isUnlocked ? (
                    <button 
                      onClick={() => onUnlock(brawler)}
                      disabled={user.credits < cost}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-black py-2 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none transition-all uppercase italic text-xs tracking-tighter"
                    >
                      <Coins className="w-4 h-4" />
                      <span>{cost}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => onSelect(brawler)}
                      className={`w-full font-black py-2 rounded-xl transition-all text-xs uppercase italic tracking-tighter ${isSelected ? 'bg-green-500 text-white cursor-default' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {isSelected ? 'SELECCIONADO' : 'SELECCIONAR'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
