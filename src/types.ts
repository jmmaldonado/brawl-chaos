
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
    projectileType?: 'normal' | 'fan' | 'burst' | 'big_slow';
    fireRate?: number;
  };
}

export interface CustomBrawlerStats {
  hpLevel: number;
  damageLevel: number;
  speedLevel: number;
  fireRateLevel: number;
}

export interface UserState {
  credits: number;
  unlockedBrawlers: string[]; // IDs
  dailyDropsRemaining: number;
  lastLogin: string;
  selectedBrawlerId: string;
  trophies: number;
  claimedMilestones: number[];
  winStreak: number;
  brawlBallWins: number;
  customBrawlerName?: string;
  customBrawlerStats?: CustomBrawlerStats;
}

export type GameMode = 'Noqueo' | 'Supervivencia' | 'Atrapagemas' | 'Balón Brawl';
