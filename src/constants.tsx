import React from 'react';
import { Brawler, Rarity, GameMode } from './types';
import { Users, Zap, Target, Shield } from 'lucide-react';

export const RARITY_COSTS: Record<Rarity, number> = {
  'Común': 0,
  'Raro': 250,
  'Súper Raro': 450,
  'Épico': 950,
  'Mítico': 1900,
  'Legendario': 3800,
};

export const RARITY_COLORS: Record<Rarity | 'Ultra', string> = {
  'Común': '#9ca3af', // gray-400
  'Raro': '#3b82f6', // blue-500
  'Súper Raro': '#10b981', // emerald-500
  'Épico': '#a855f7', // purple-500
  'Mítico': '#ef4444', // red-500
  'Legendario': '#f59e0b', // amber-500
  'Ultra': '#f43f5e', // rose-500
};

export const GAME_MODES: { id: GameMode; name: string; icon: React.ReactNode; color: string; description: string }[] = [
  { id: 'Atrapagemas', name: 'Atrapagemas', icon: <Zap className="w-6 h-6" />, color: 'bg-purple-500', description: '¡Recoge 10 gemas y mantenlas para ganar!' },
  { id: 'Noqueo', name: 'Noqueo', icon: <Target className="w-6 h-6" />, color: 'bg-orange-500', description: 'Elimina a todos los oponentes.' },
  { id: 'Supervivencia', name: 'Supervivencia', icon: <Shield className="w-6 h-6" />, color: 'bg-green-500', description: 'Sé el último brawler en pie.' },
  { id: 'Balón Brawl', name: 'Balón Brawl', icon: <Users className="w-6 h-6" />, color: 'bg-blue-500', description: '¡Marca dos goles para ganar!' },
];

const BRAWLER_NAMES = [
  "Shelly", "Colt", "Nita", "Bull", "Jessie", "Brock", "Dynamike", "Bo", "Tick", "8-Bit",
  "Emz", "Stu", "El Primo", "Barley", "Poco", "Rosa", "Rico", "Darryl", "Penny", "Carl",
  "Jacky", "Gus", "Piper", "Pam", "Frank", "Bibi", "Bea", "Nani", "Edgar", "Griff",
  "Grom", "Bonnie", "Mortis", "Tara", "Gene", "Max", "Mr. P", "Sprout", "Byron", "Squeak",
  "Spike", "Crow", "Leon", "Sandy", "Amber", "Meg", "Gale", "Surge", "Colette", "Lou",
  "Colonel Ruffs", "Belle", "Buzz", "Ash", "Lola", "Fang", "Eve", "Janet", "Otis", "Sam",
  "Buster", "Mandy", "Gray", "R-T", "Willow", "Maisie", "Hank", "Cordelius", "Doug", "Pearl",
  "Chuck", "Charlie", "Mico", "Kit", "Larry & Lawrie", "Melodie", "Angelo", "Draco", "Lily", "Berry",
  "Clancy", "Moe", "Kenji", "Juju", "Ollie", "Vex", "Nova", "Zane", "Kira", "Rift",
  "Shadow", "Blaze", "Frost", "Volt", "Terra", "Aqua", "Aero", "Lux", "Nyx", "Eon"
];

export const BRAWLERS: Brawler[] = BRAWLER_NAMES.map((name, index) => {
  let rarity: Rarity = 'Común';
  if (index < 10) rarity = 'Común';
  else if (index < 30) rarity = 'Raro';
  else if (index < 50) rarity = 'Súper Raro';
  else if (index < 75) rarity = 'Épico';
  else if (index < 90) rarity = 'Mítico';
  else rarity = 'Legendario';

  // Generate stats based on rarity and index
  const baseHp = 3000 + (index * 20);
  const baseDamage = 800 + (index * 10);
  
  return {
    id: `brawler-${index}`,
    name,
    rarity,
    description: `Un brawler de tipo ${rarity} con habilidades únicas y un estilo de combate especializado.`,
    image: `https://picsum.photos/seed/${name}/400/400`,
    stats: {
      hp: baseHp,
      damage: baseDamage,
      speed: 3 + (Math.random() * 2),
      range: 4 + (Math.random() * 4),
    }
  };
});

