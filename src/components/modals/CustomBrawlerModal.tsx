import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Heart, Swords, Move, Ruler, Coins, Zap } from 'lucide-react';
import { UserState } from '../../types';
import { CachedAvatar } from '../common/CachedAvatar';

interface CustomBrawlerModalProps {
  user: UserState;
  onClose: () => void;
  onUpdateName: (name: string) => void;
  onUpgradeStat: (stat: keyof UserState['customBrawlerStats'], cost: number) => void;
}

export const CustomBrawlerModal: React.FC<CustomBrawlerModalProps> = ({ user, onClose, onUpdateName, onUpgradeStat }) => {
  const [editName, setEditName] = useState(user.customBrawlerName || 'Mi Brawler');
  const stats = user.customBrawlerStats || { hpLevel: 0, damageLevel: 0, speedLevel: 0, fireRateLevel: 0 };
  
  const getUpgradeCost = (level: number) => Math.floor(100 * Math.pow(1.5, level));

  const StatRow = ({ icon: Icon, color, label, level, statKey, currentValue }: any) => {
    const cost = getUpgradeCost(level);
    const canAfford = user.credits >= cost;
    
    return (
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-current fill-current" />
          </div>
          <div>
            <div className="text-xs text-white/50">{label}</div>
            <div className="font-black">Lvl {level} <span className="text-white/30 text-sm">({currentValue})</span></div>
          </div>
        </div>
        <button
          onClick={() => onUpgradeStat(statKey, cost)}
          disabled={!canAfford}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 disabled:opacity-50 hover:bg-yellow-400 text-black font-black rounded-lg transition-all active:scale-95 text-sm"
        >
          <Coins className="w-4 h-4" />
          <span>{cost}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-slate-900 border-2 border-white/10 rounded-[32px] p-6 w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6 text-center text-gradient bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">Custom Brawler</h2>

        <div className="flex flex-col items-center gap-6 overflow-y-auto">
          {/* Avatar Preview */}
          <div className="w-32 h-32 rounded-[24px] bg-slate-800 border-4 border-yellow-500 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.3)] relative">
             <CachedAvatar 
               name={editName}
               alt="Custom Brawler"
               className="w-full h-full object-cover"
               referrerPolicy="no-referrer"
             />
          </div>

          <div className="flex items-center gap-2 w-full">
            <input 
               value={editName}
               onChange={e => setEditName(e.target.value)}
               className="flex-1 bg-slate-800 border-2 border-white/10 rounded-xl px-4 py-2 text-center font-black focus:border-yellow-500 outline-none transition-all"
               placeholder="Nombre de tu brawler"
            />
            <button 
              onClick={() => onUpdateName(editName)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 font-black rounded-xl transition-all"
            >
              Guardar
            </button>
          </div>

          <div className="w-full h-px bg-white/10 my-2" />

          <div className="w-full flex items-center justify-between mb-2">
             <span className="text-white/50 text-sm font-bold uppercase tracking-wider">Mejoras</span>
             <div className="flex items-center gap-1.5 text-yellow-500 font-black">
                <Coins className="w-4 h-4" />
                <span>{user.credits}</span>
             </div>
          </div>

          <div className="flex flex-col w-full gap-3">
             <StatRow 
               icon={Heart} color="text-red-500 bg-red-500/20" 
               label="Salud (HP)" level={stats.hpLevel} statKey="hpLevel" 
               currentValue={3000 + (stats.hpLevel * 200)}
             />
             <StatRow 
               icon={Swords} color="text-orange-500 bg-orange-500/20" 
               label="Daño" level={stats.damageLevel} statKey="damageLevel" 
               currentValue={800 + (stats.damageLevel * 100)}
             />
             <StatRow 
               icon={Move} color="text-blue-500 bg-blue-500/20" 
               label="Velocidad" level={stats.speedLevel} statKey="speedLevel" 
               currentValue={(3.0 + (stats.speedLevel * 0.2)).toFixed(1)}
             />
             <StatRow 
               icon={Zap} color="text-purple-500 bg-purple-500/20" 
               label="Vel. Disparo MS (-)" level={stats.fireRateLevel} statKey="fireRateLevel" 
               currentValue={Math.max(100, 400 - (stats.fireRateLevel * 20))}
             />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
