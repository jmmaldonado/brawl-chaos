import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Settings, 
  Play, 
  Package, 
  Coins, 
  ChevronRight, 
  ChevronLeft,
  X,
  Zap,
  Star,
  Shield,
  Target,
  Info,
  Heart,
  Swords,
  Move,
  Ruler,
  Search,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { Brawler, UserState, GameMode, DropTier } from './types';
import { BRAWLERS, RARITY_COSTS, RARITY_COLORS } from './constants';
import { GemGrabGame } from './components/GemGrabGame';
import { ShowdownGame } from './components/ShowdownGame';

const GAME_MODES: { id: GameMode; name: string; icon: React.ReactNode; color: string; description: string }[] = [
  { id: 'Atrapagemas', name: 'Atrapagemas', icon: <Zap className="w-6 h-6" />, color: 'bg-purple-500', description: '¡Recoge 10 gemas y mantenlas para ganar!' },
  { id: 'Noqueo', name: 'Noqueo', icon: <Target className="w-6 h-6" />, color: 'bg-orange-500', description: 'Elimina a todos los oponentes.' },
  { id: 'Supervivencia', name: 'Supervivencia', icon: <Shield className="w-6 h-6" />, color: 'bg-green-500', description: 'Sé el último brawler en pie.' },
  { id: 'Balón Brawl', name: 'Balón Brawl', icon: <Users className="w-6 h-6" />, color: 'bg-blue-500', description: '¡Marca dos goles para ganar!' },
];

export default function App() {
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem('brawl_chaos_user');
    if (saved) return JSON.parse(saved);
    return {
      credits: 0,
      unlockedBrawlers: [BRAWLERS[0].id],
      dailyDropsRemaining: 50,
      lastLogin: new Date().toDateString(),
      selectedBrawlerId: BRAWLERS[0].id,
      trophies: 0,
      claimedMilestones: [],
    };
  });

  const [view, setView] = useState<'home' | 'brawlers' | 'modes' | 'game' | 'trophyRoad'>('home');
  const [selectedMode, setSelectedMode] = useState<GameMode>('Atrapagemas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpeningDrop, setIsOpeningDrop] = useState(false);
  const [dropTier, setDropTier] = useState<DropTier>('Raro');
  const [dropAttempts, setDropAttempts] = useState(0);
  const [dropResult, setDropResult] = useState<{ type: 'credits' | 'brawler'; value: any } | null>(null);
  const [matchResult, setMatchResult] = useState<'win' | 'loss' | null>(null);
  const [lastRank, setLastRank] = useState<number | null>(null);
  const [showBrawlerInfo, setShowBrawlerInfo] = useState<Brawler | null>(null);

  useEffect(() => {
    localStorage.setItem('brawl_chaos_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (user.lastLogin !== today) {
      setUser(prev => ({
        ...prev,
        dailyDropsRemaining: 50,
        lastLogin: today,
      }));
    }
  }, [user.lastLogin]);

  const filteredBrawlers = BRAWLERS.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const trophyRoadMilestones = [
    { trophies: 10, reward: 100, type: 'credits' },
    { trophies: 50, reward: 250, type: 'credits' },
    { trophies: 100, reward: 500, type: 'credits' },
    { trophies: 250, reward: 1000, type: 'credits' },
    { trophies: 500, reward: 2000, type: 'credits' },
    { trophies: 1000, reward: 5000, type: 'credits' },
  ];

  const claimMilestone = (milestone: typeof trophyRoadMilestones[0]) => {
    if (user.trophies >= milestone.trophies && !user.claimedMilestones.includes(milestone.trophies)) {
      setUser(prev => ({
        ...prev,
        credits: prev.credits + milestone.reward,
        claimedMilestones: [...prev.claimedMilestones, milestone.trophies]
      }));
    }
  };

  const selectedBrawler = BRAWLERS.find(b => b.id === user.selectedBrawlerId) || BRAWLERS[0];

  const handlePlay = () => {
    setView('game');
  };

  const onGameWin = () => {
    setLastRank(null);
    setMatchResult('win');
    setUser(prev => ({ ...prev, trophies: prev.trophies + 8 }));
    setView('home');
  };

  const onGameLoss = () => {
    setLastRank(null);
    setMatchResult('loss');
    setUser(prev => ({ ...prev, trophies: Math.max(0, prev.trophies - 4) }));
    setView('home');
  };

  const onShowdownFinish = (rank: number) => {
    const trophyChange = rank <= 4 ? (10 - rank * 2) : -rank;
    const creditReward = Math.max(0, 50 - rank * 5);
    
    setLastRank(rank);
    setMatchResult(rank <= 4 ? 'win' : 'loss');
    setUser(prev => ({ 
      ...prev, 
      trophies: Math.max(0, prev.trophies + trophyChange),
      credits: prev.credits + creditReward
    }));
    setView('home');
  };

  const startDropOpening = () => {
    if (user.dailyDropsRemaining <= 0 && !matchResult) return;
    
    setIsOpeningDrop(true);
    setDropTier('Raro');
    setDropAttempts(0);
    setDropResult(null);
    
    if (!matchResult) {
      setUser(prev => ({ ...prev, dailyDropsRemaining: prev.dailyDropsRemaining - 1 }));
    }
  };

  const evolveDrop = () => {
    const tiers: DropTier[] = ['Raro', 'Súper Raro', 'Épico', 'Mítico', 'Legendario', 'Ultra'];
    const currentIndex = tiers.indexOf(dropTier);
    const success = Math.random() < 0.3;
    
    if (success && currentIndex < tiers.length - 1) {
      const nextTier = tiers[currentIndex + 1];
      setDropTier(nextTier);
      if (nextTier === 'Súper Raro') {
        setDropAttempts(50);
      }
    } else {
      if (dropAttempts > 0) {
        setDropAttempts(prev => prev - 1);
      } else {
        finishDrop();
      }
    }
  };

  const finishDrop = () => {
    const rewards: Record<DropTier, { minCredits: number; maxCredits: number; brawlerChance: number }> = {
      'Raro': { minCredits: 10, maxCredits: 25, brawlerChance: 0.01 },
      'Súper Raro': { minCredits: 25, maxCredits: 60, brawlerChance: 0.03 },
      'Épico': { minCredits: 60, maxCredits: 150, brawlerChance: 0.08 },
      'Mítico': { minCredits: 150, maxCredits: 400, brawlerChance: 0.15 },
      'Legendario': { minCredits: 400, maxCredits: 1000, brawlerChance: 0.30 },
      'Ultra': { minCredits: 1000, maxCredits: 3000, brawlerChance: 0.60 },
    };

    const config = rewards[dropTier];
    const isBrawler = Math.random() < config.brawlerChance;

    if (isBrawler) {
      const locked = BRAWLERS.filter(b => !user.unlockedBrawlers.includes(b.id));
      if (locked.length > 0) {
        const brawler = locked[Math.floor(Math.random() * locked.length)];
        setDropResult({ type: 'brawler', value: brawler });
        setUser(prev => ({ ...prev, unlockedBrawlers: [...prev.unlockedBrawlers, brawler.id] }));
      } else {
        const credits = Math.floor(Math.random() * (config.maxCredits - config.minCredits)) + config.minCredits;
        setDropResult({ type: 'credits', value: credits });
        setUser(prev => ({ ...prev, credits: prev.credits + credits }));
      }
    } else {
      const credits = Math.floor(Math.random() * (config.maxCredits - config.minCredits)) + config.minCredits;
      setDropResult({ type: 'credits', value: credits });
      setUser(prev => ({ ...prev, credits: prev.credits + credits }));
    }
  };

  const unlockBrawler = (brawler: Brawler) => {
    const cost = RARITY_COSTS[brawler.rarity];
    if (user.credits >= cost && !user.unlockedBrawlers.includes(brawler.id)) {
      setUser(prev => ({
        ...prev,
        credits: prev.credits - cost,
        unlockedBrawlers: [...prev.unlockedBrawlers, brawler.id],
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-slate-900/80 border-b border-white/5 backdrop-blur-xl z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('trophyRoad')}
            className="flex flex-col group hover:scale-105 transition-transform"
          >
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 group-hover:text-yellow-500 transition-colors">Camino del Caos</span>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-black text-xl italic tracking-tighter text-yellow-500">{user.trophies}</span>
            </div>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">Créditos</span>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-blue-400" />
              <span className="font-black text-xl italic tracking-tighter text-blue-400">{user.credits}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/50 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" />
            <span className="font-black text-sm">{user.dailyDropsRemaining}</span>
          </div>
          <button className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl border border-white/5 transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
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
                  <img 
                    src={selectedBrawler.image}
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
                  onClick={() => setView('modes')}
                  className={`${GAME_MODES.find(m => m.id === selectedMode)?.color} p-3 rounded-2xl flex items-center justify-between group hover:brightness-110 transition-all shadow-2xl active:scale-95`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      {GAME_MODES.find(m => m.id === selectedMode)?.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] opacity-70 font-black uppercase tracking-widest">Modo Actual</p>
                      <p className="text-base font-black uppercase italic tracking-tight">{selectedMode}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={handlePlay}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 p-4 rounded-2xl flex items-center justify-center gap-3 shadow-[0_6px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none transition-all"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span className="text-2xl font-black uppercase italic tracking-tighter">¡JUGAR!</span>
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setView('brawlers')}
                    className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-[24px] border-2 border-white/5 flex flex-col items-center gap-2 transition-all active:scale-95"
                  >
                    <Users className="w-6 h-6 text-blue-400" />
                    <span className="font-black uppercase text-[10px] tracking-widest">Brawlers</span>
                  </button>
                  <button 
                    onClick={startDropOpening}
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
          )}

          {view === 'trophyRoad' && (
            <motion.div 
              key="trophyRoad"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950 z-30 flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView('home')} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">
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
                  {/* Progress Line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-4 bg-slate-900 -translate-x-1/2 rounded-full overflow-hidden border-4 border-white/5">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.min(100, (user.trophies / 1000) * 100)}%` }}
                      className="w-full bg-gradient-to-b from-blue-600 to-purple-600 shadow-[0_0_30px_rgba(37,99,235,0.5)]"
                    />
                  </div>

                  <div className="space-y-32 relative">
                    {trophyRoadMilestones.map((milestone, idx) => {
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
                                    onClick={() => claimMilestone(milestone)}
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
          )}

          {view === 'brawlers' && (
            <motion.div 
              key="brawlers"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="absolute inset-0 bg-slate-950 z-20 flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView('home')} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">
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
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-800 border-2 border-white/5 rounded-xl px-4 py-2 w-32 sm:w-48 focus:border-blue-500 outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-white/5">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="font-black text-sm">{user.unlockedBrawlers.length} / {BRAWLERS.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                {filteredBrawlers.map(brawler => {
                  const isUnlocked = user.unlockedBrawlers.includes(brawler.id);
                  const isSelected = user.selectedBrawlerId === brawler.id;
                  const cost = RARITY_COSTS[brawler.rarity];
                  
                  return (
                    <motion.div 
                      key={brawler.id}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className={`relative rounded-[24px] overflow-hidden border-4 transition-all duration-500 group ${isSelected ? 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'border-white/5 bg-slate-900/50 hover:border-white/20'}`}
                    >
                      <div className="aspect-[4/5] relative">
                        <img 
                          src={brawler.image} 
                          alt={brawler.name} 
                          className={`w-full h-full object-cover transition-all duration-1000 ${!isUnlocked ? 'grayscale brightness-50 blur-lg' : 'group-hover:scale-110'}`}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                        
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] backdrop-blur-xl border border-white/20" style={{ backgroundColor: `${RARITY_COLORS[brawler.rarity]}44`, color: RARITY_COLORS[brawler.rarity] }}>
                            {brawler.rarity}
                          </span>
                        </div>

                        <button 
                          onClick={() => setShowBrawlerInfo(brawler)}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-xl rounded-lg border border-white/10 hover:bg-black/80 transition-all"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-3 flex flex-col gap-3">
                        <h3 className="text-lg font-black uppercase italic tracking-tighter truncate">{brawler.name}</h3>
                        
                        {isUnlocked && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-lg border border-white/5">
                              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                              <span className="text-[10px] font-black">{brawler.stats.hp}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-lg border border-white/5">
                              <Zap className="w-3 h-3 text-orange-500 fill-orange-500" />
                              <span className="text-[10px] font-black">{brawler.stats.damage}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          {!isUnlocked ? (
                            <button 
                              onClick={() => unlockBrawler(brawler)}
                              disabled={user.credits < cost}
                              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-black py-2 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none transition-all uppercase italic text-xs tracking-tighter"
                            >
                              <Coins className="w-4 h-4" />
                              <span>{cost}</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                setUser(prev => ({ ...prev, selectedBrawlerId: brawler.id }));
                                setView('home');
                              }}
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
          )}

          {view === 'modes' && (
            <motion.div 
              key="modes"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="absolute inset-0 bg-slate-950 z-20 flex flex-col"
            >
              <div className="p-4 flex items-center gap-4 border-b border-white/5">
                <button onClick={() => setView('home')} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Modos de Juego</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {GAME_MODES.map(mode => (
                  <button 
                    key={mode.id}
                    onClick={() => {
                      setSelectedMode(mode.id);
                      setView('home');
                    }}
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
          )}

          {view === 'game' && selectedMode === 'Atrapagemas' && (
            <GemGrabGame 
              playerBrawler={selectedBrawler}
              onWin={onGameWin}
              onLoss={onGameLoss}
              onExit={() => setView('home')}
            />
          )}

          {view === 'game' && selectedMode === 'Supervivencia' && (
            <ShowdownGame 
              playerBrawler={selectedBrawler}
              onFinish={onShowdownFinish}
              onExit={() => setView('home')}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Brawler Info Modal */}
      <AnimatePresence>
        {showBrawlerInfo && (
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
                onClick={() => setShowBrawlerInfo(null)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center gap-4">
                <img 
                  src={showBrawlerInfo.image} 
                  alt={showBrawlerInfo.name} 
                  className="w-40 h-40 object-cover rounded-[24px] border-4 border-white/10 shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                
                <div className="text-center w-full">
                  <span className="px-4 py-1 rounded-full font-black uppercase tracking-[0.2em] text-[10px] border-2 mb-2 inline-block" style={{ borderColor: RARITY_COLORS[showBrawlerInfo.rarity], color: RARITY_COLORS[showBrawlerInfo.rarity] }}>
                    {showBrawlerInfo.rarity}
                  </span>
                  <h3 className="text-3xl font-black uppercase italic mb-4 tracking-tighter">{showBrawlerInfo.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-slate-800/50 p-2 rounded-2xl border border-white/5 flex flex-col items-center gap-0.5">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-[8px] font-black uppercase opacity-50">Salud</span>
                      <span className="text-sm font-black">{showBrawlerInfo.stats.hp}</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-2xl border border-white/5 flex flex-col items-center gap-0.5">
                      <Swords className="w-4 h-4 text-orange-500" />
                      <span className="text-[8px] font-black uppercase opacity-50">Daño</span>
                      <span className="text-sm font-black">{showBrawlerInfo.stats.damage}</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-2xl border border-white/5 flex flex-col items-center gap-0.5">
                      <Move className="w-4 h-4 text-blue-500" />
                      <span className="text-[8px] font-black uppercase opacity-50">Velocidad</span>
                      <span className="text-sm font-black">{showBrawlerInfo.stats.speed.toFixed(1)}</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-2xl border border-white/5 flex flex-col items-center gap-0.5">
                      <Ruler className="w-4 h-4 text-green-500" />
                      <span className="text-[8px] font-black uppercase opacity-50">Alcance</span>
                      <span className="text-sm font-black">{showBrawlerInfo.stats.range.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm leading-relaxed px-2">{showBrawlerInfo.description}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Result Modal */}
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
                onClick={() => {
                  if (matchResult === 'win') {
                    startDropOpening();
                  }
                  setMatchResult(null);
                }}
                className="bg-blue-500 hover:bg-blue-400 text-white p-4 rounded-2xl font-black uppercase text-xl shadow-[0_6px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all"
              >
                CONTINUAR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop Opening Modal */}
      <AnimatePresence>
        {isOpeningDrop && (
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
                  onClick={evolveDrop}
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
                  onClick={finishDrop}
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
                {dropResult.type === 'credits' ? (
                  <>
                    <div className="bg-yellow-500 p-8 rounded-[40px] shadow-[0_0_100px_rgba(234,179,8,0.3)] border-[8px] border-white/20">
                      <Coins className="w-24 h-24 text-slate-950" />
                    </div>
                    <div>
                      <h3 className="text-5xl font-black text-yellow-400 mb-2 italic tracking-tighter">+{dropResult.value}</h3>
                      <p className="text-lg font-black uppercase opacity-50 tracking-widest">Créditos</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <img 
                        src={dropResult.value.image} 
                        alt={dropResult.value.name}
                        className="w-48 h-48 object-cover rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border-[8px] border-white/20"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -top-4 -right-4 bg-yellow-500 p-3 rounded-full shadow-2xl border-2 border-slate-950">
                        <Star className="w-6 h-6 text-slate-950 fill-current" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase mb-1 tracking-widest" style={{ color: RARITY_COLORS[dropResult.value.rarity] }}>
                        {dropResult.value.rarity}
                      </p>
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter">{dropResult.value.name}</h3>
                      <p className="text-xs font-bold opacity-50 mt-2 uppercase tracking-widest">¡NUEVO BRAWLER!</p>
                    </div>
                  </>
                )}

                <button 
                  onClick={() => setIsOpeningDrop(false)}
                  className="mt-4 bg-blue-500 hover:bg-blue-400 text-white px-10 py-4 rounded-2xl font-black uppercase text-xl shadow-[0_6px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all"
                >
                  ¡GENIAL!
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
