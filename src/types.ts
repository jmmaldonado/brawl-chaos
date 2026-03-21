
export type Rarity = 'Común' | 'Raro' | 'Súper Raro' | 'Épico' | 'Mítico' | 'Legendario';
export type DropTier = 'Raro' | 'Súper Raro' | 'Épico' | 'Mítico' | 'Legendario' | 'Ultra';

export interface Brawler {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  image: string;
  stats: {
    hp: number;
    damage: number;
    speed: number;
    range: number;
  };
}

export interface UserState {
  credits: number;
  unlockedBrawlers: string[]; // IDs
  dailyDropsRemaining: number;
  lastLogin: string;
  selectedBrawlerId: string;
  trophies: number;
  claimedMilestones: number[];
}

export type GameMode = 'Noqueo' | 'Supervivencia' | 'Atrapagemas' | 'Balón Brawl';
