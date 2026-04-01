import { useState } from 'react';
import { DropTier, Brawler, UserState } from '../types';
import { BRAWLERS } from '../constants';

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
  const [isShuffling, setIsShuffling] = useState(false);
  const [dropTier, setDropTier] = useState<DropTier>('Raro');
  const [dropAttempts, setDropAttempts] = useState(0);
  const [dropResult, setDropResult] = useState<{ type: 'credits' | 'brawler'; value: any } | null>(null);

  const getRandomTier = (): DropTier => {
    const rand = Math.random();
    if (rand < 0.45) return 'Raro';
    if (rand < 0.70) return 'Súper Raro';
    if (rand < 0.85) return 'Épico';
    if (rand < 0.94) return 'Mítico';
    if (rand < 0.98) return 'Legendario';
    return 'Ultra';
  };

  const startOpening = () => {
    setIsOpening(true);
    setDropTier('Raro');
    setDropAttempts(3);
    setDropResult(null);
    setIsShuffling(false);
  };

  const rollDrop = () => {
    if (dropAttempts <= 0 || isShuffling) return;
    
    setIsShuffling(true);
    setDropAttempts(prev => prev - 1);
    
    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      setDropTier(TIERS[Math.floor(Math.random() * TIERS.length)]);
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        setDropTier(getRandomTier());
        setIsShuffling(false);
      }
    }, 80);
  };

  const finishDrop = () => {
    if (isShuffling) return;
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
    isShuffling,
    dropTier,
    dropAttempts,
    dropResult,
    startOpening,
    rollDrop,
    finishDrop,
    closeDrop
  };
}
