import { useState } from 'react';
import { DropTier, Brawler, UserState } from '../types';
import { BRAWLERS, RARITY_COLORS } from '../constants';

const REWARDS: Record<DropTier, { minCredits: number; maxCredits: number; brawlerChance: number }> = {
  'Raro': { minCredits: 10, maxCredits: 25, brawlerChance: 0.01 },
  'Súper Raro': { minCredits: 25, maxCredits: 60, brawlerChance: 0.03 },
  'Épico': { minCredits: 60, maxCredits: 150, brawlerChance: 0.08 },
  'Mítico': { minCredits: 150, maxCredits: 400, brawlerChance: 0.15 },
  'Legendario': { minCredits: 400, maxCredits: 1000, brawlerChance: 0.30 },
  'Ultra': { minCredits: 1000, maxCredits: 3000, brawlerChance: 0.60 },
};

const TIERS: DropTier[] = ['Raro', 'Súper Raro', 'Épico', 'Mítico', 'Legendario', 'Ultra'];

export function useStarrDrop(user: UserState, onReward: (type: 'credits' | 'brawler', value: any) => void) {
  const [isOpening, setIsOpening] = useState(false);
  const [dropTier, setDropTier] = useState<DropTier>('Raro');
  const [dropAttempts, setDropAttempts] = useState(0);
  const [dropResult, setDropResult] = useState<{ type: 'credits' | 'brawler'; value: any } | null>(null);

  const startOpening = () => {
    setIsOpening(true);
    setDropTier('Raro');
    setDropAttempts(0);
    setDropResult(null);
  };

  const evolveDrop = () => {
    const currentIndex = TIERS.indexOf(dropTier);
    const success = Math.random() < 0.3;
    
    if (success && currentIndex < TIERS.length - 1) {
      const nextTier = TIERS[currentIndex + 1];
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
    const config = REWARDS[dropTier];
    const isBrawler = Math.random() < config.brawlerChance;

    if (isBrawler) {
      const locked = BRAWLERS.filter(b => !user.unlockedBrawlers.includes(b.id));
      if (locked.length > 0) {
        const brawler = locked[Math.floor(Math.random() * locked.length)];
        setDropResult({ type: 'brawler', value: brawler });
        onReward('brawler', brawler);
      } else {
        const credits = Math.floor(Math.random() * (config.maxCredits - config.minCredits)) + config.minCredits;
        setDropResult({ type: 'credits', value: credits });
        onReward('credits', credits);
      }
    } else {
      const credits = Math.floor(Math.random() * (config.maxCredits - config.minCredits)) + config.minCredits;
      setDropResult({ type: 'credits', value: credits });
      onReward('credits', credits);
    }
  };

  const closeDrop = () => {
    setIsOpening(false);
  };

  return {
    isOpening,
    dropTier,
    dropAttempts,
    dropResult,
    startOpening,
    evolveDrop,
    finishDrop,
    closeDrop
  };
}
