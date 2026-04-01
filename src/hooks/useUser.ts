import { useState, useEffect } from 'react';
import { UserState, Brawler, DropTier } from '../types';
import { BRAWLERS, RARITY_COSTS } from '../constants';

const INITIAL_USER: UserState = {
  credits: 0,
  unlockedBrawlers: [BRAWLERS[0].id],
  dailyDropsRemaining: 50,
  lastLogin: new Date().toDateString(),
  selectedBrawlerId: BRAWLERS[0].id,
  trophies: 0,
  claimedMilestones: [],
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
        dailyDropsRemaining: 50,
        lastLogin: today,
      }));
    }
  }, [user.lastLogin]);

  const awardWinTrophies = () => {
    setUser(prev => ({ ...prev, trophies: prev.trophies + 8 }));
  };

  const awardLossTrophies = () => {
    setUser(prev => ({ ...prev, trophies: Math.max(0, prev.trophies - 4) }));
  };

  const awardShowdownResults = (rank: number) => {
    const trophyChange = rank <= 4 ? (10 - rank * 2) : -rank;
    const creditReward = Math.max(0, 50 - rank * 5);
    
    setUser(prev => ({ 
      ...prev, 
      trophies: Math.max(0, prev.trophies + trophyChange),
      credits: prev.credits + creditReward
    }));
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
    setUser, // Exporting for complex updates
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
