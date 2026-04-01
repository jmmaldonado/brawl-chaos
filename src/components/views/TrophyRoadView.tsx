import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Trophy, Coins, CheckCircle2 } from 'lucide-react';
import { UserState } from '../../types';

interface TrophyRoadViewProps {
  user: UserState;
  milestones: any[];
  onBack: () => void;
  onClaim: (milestone: any) => void;
}

export const TrophyRoadView: React.FC<TrophyRoadViewProps> = ({
  user,
  milestones,
  onBack,
  onClaim
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 bg-slate-950 z-30 flex flex-col"
    >
      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Camino del Caos</h2>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-white/5">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="font-black text-sm">{user.trophies} Trofeos</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-12 pb-20">
        <div className="w-full max-w-2xl relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-4 bg-slate-900 -translate-x-1/2 rounded-full overflow-hidden border-4 border-white/5">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${Math.min(100, (user.trophies / 1000) * 100)}%` }}
              className="w-full bg-gradient-to-b from-blue-600 to-purple-600 shadow-[0_0_30px_rgba(37,99,235,0.5)]"
            />
          </div>

          <div className="space-y-32 relative">
            {milestones.map((milestone, idx) => {
              const isReached = user.trophies >= milestone.trophies;
              const isClaimed = user.claimedMilestones.includes(milestone.trophies);
              
              return (
                <motion.div 
                  key={milestone.trophies}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`flex items-center gap-4 ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${idx % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <div className="text-xl font-black text-white italic mb-1">{milestone.trophies} 🏆</div>
                    <div className="text-blue-400 font-black uppercase text-[8px] tracking-[0.2em]">Meta de Trofeos</div>
                  </div>

                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 rotate-45 transition-all duration-500 ${isReached ? 'bg-yellow-500 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-slate-900 border-white/10'}`}>
                      <Trophy className={`w-6 h-6 -rotate-45 ${isReached ? 'text-slate-950' : 'text-slate-800'}`} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className={`p-4 rounded-2xl border transition-all duration-500 ${isReached ? 'bg-slate-900 border-blue-500/50 shadow-xl' : 'bg-slate-900/50 border-white/5 opacity-50'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Coins className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-lg font-black text-white">+{milestone.reward}</div>
                            <div className="text-[8px] text-blue-400 uppercase font-black tracking-widest">Créditos</div>
                          </div>
                        </div>
                        {isReached && !isClaimed && (
                          <button 
                            onClick={() => onClaim(milestone)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black italic uppercase hover:bg-blue-500 transition-all hover:scale-110 active:scale-95 text-xs shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                          >
                            Reclamar
                          </button>
                        )}
                        {isClaimed && (
                          <div className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-xl font-black uppercase italic flex items-center gap-2 text-[10px]">
                            <CheckCircle2 className="w-4 h-4" />
                            Reclamado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
