import { useState, useEffect } from 'react';
import { UserState, Brawler, DropTier } from '../types';
import { BRAWLERS, RARITY_COSTS } from '../constants';

const INITIAL_USER: UserState = {
  credits: 0,
  unlockedBrawlers: [BRAWLERS[0].id],
  dailyDropsRemaining: 5,
  lastLogin: new Date().toDateString(),
  selectedBrawlerId: BRAWLERS[0].id,
  trophies: 0,
  claimedMilestones: [],
  winStreak: 0,
};

export function useUser() {
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem('brawl_chaos_user');
    if (saved) return JSON.parse(saved);
    return INITIAL_USER;
  });

  useEffect(() => {
    localStorage.setItem('brawl_chaos_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (user.lastLogin !== today) {
      setUser(prev => ({
        ...prev,
        dailyDropsRemaining: 5,
        lastLogin: today,
        winStreak: 0, // Reset streak daily too? Or keep it? Let's keep it but reset drops
      }));
    }
  }, [user.lastLogin]);

  const awardWinTrophies = (kills: number = 0) => {
    const newStreak = (user.winStreak || 0) + 1;
    let dropsToAdd = 2; // Victoria base
    
    // Streak reward: Every 3 wins, +5 drops
    if (newStreak > 0 && newStreak % 3 === 0) {
      dropsToAdd += 5;
    }

    // Kills reward: +1 drop every 5 kills
    const killDrops = Math.floor(kills / 5);
    dropsToAdd += killDrops;

    setUser(prev => ({ 
      ...prev, 
      trophies: prev.trophies + 8,
      winStreak: newStreak,
      dailyDropsRemaining: prev.dailyDropsRemaining + dropsToAdd,
      credits: prev.credits + 20 // Bonus credits for win
    }));

    return { trophies: 8, drops: dropsToAdd, credits: 20 };
  };


  const awardLossTrophies = (kills: number = 0) => {
    const killDrops = Math.floor(kills / 5);
    setUser(prev => ({ 
      ...prev, 
      trophies: Math.max(0, prev.trophies - 4),
      winStreak: 0,
      dailyDropsRemaining: prev.dailyDropsRemaining + killDrops
    }));
    return { trophies: -4, drops: killDrops, credits: 0 };
  };


  const awardShowdownResults = (rank: number, kills: number = 0) => {
    const trophyChange = rank <= 4 ? (10 - rank * 2) : -rank;
    const creditReward = Math.max(0, 50 - rank * 5);
    
    let dropsToAdd = 0;
    if (rank === 1) dropsToAdd = 3;
    else if (rank <= 3) dropsToAdd = 2;
    else if (rank <= 4) dropsToAdd = 1;

    // Kills reward: +1 drop every 2 kills in Showdown (harder to kill)
    const killDrops = Math.floor(kills / 2);
    dropsToAdd += killDrops;

    const isWin = rank <= 4;
    const newStreak = isWin ? (user.winStreak || 0) + 1 : 0;
    
    if (isWin && newStreak > 0 && newStreak % 3 === 0) {
      dropsToAdd += 5;
    }
    
    setUser(prev => ({ 
      ...prev, 
      trophies: Math.max(0, prev.trophies + trophyChange),
      credits: prev.credits + creditReward,
      dailyDropsRemaining: prev.dailyDropsRemaining + dropsToAdd,
      winStreak: newStreak
    }));

    return { trophies: trophyChange, drops: dropsToAdd, credits: creditReward };
  };


  const claimMilestone = (trophies: number, reward: number) => {
    if (user.trophies >= trophies && !user.claimedMilestones.includes(trophies)) {
      setUser(prev => ({
        ...prev,
        credits: prev.credits + reward,
        claimedMilestones: [...prev.claimedMilestones, trophies]
      }));
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
      return true;
    }
    return false;
  };

  const deductDailyDrop = () => {
    setUser(prev => ({ ...prev, dailyDropsRemaining: Math.max(0, prev.dailyDropsRemaining - 1) }));
  };

  const addReward = (type: 'credits' | 'brawler', value: number | Brawler) => {
    if (type === 'credits') {
      setUser(prev => ({ ...prev, credits: prev.credits + (value as number) }));
    } else if (type === 'brawler') {
      const brawler = value as Brawler;
      setUser(prev => ({ ...prev, unlockedBrawlers: [...prev.unlockedBrawlers, brawler.id] }));
    }
  };

  const setSelectedBrawlerId = (id: string) => {
    setUser(prev => ({ ...prev, selectedBrawlerId: id }));
  };

  return {
    user,
    setUser,
    awardWinTrophies,
    awardLossTrophies,
    awardShowdownResults,
    claimMilestone,
    unlockBrawler,
    deductDailyDrop,
    addReward,
    setSelectedBrawlerId
  };
}
