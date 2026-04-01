import React, { useEffect, useRef, useState } from 'react';
import { Brawler } from '../types';
import { BRAWLERS } from '../constants';
import { getAvatar } from '../utils/avatarCache';
import { Star, X, Skull, Trophy } from 'lucide-react';

interface GameProps {
  playerBrawler: Brawler;
  onFinish: (rank: number) => void;
  onExit: () => void;
}

interface Entity {
  x: number;
  y: number;
  radius: number;
  color: string;
  hp: number;
  maxHp: number;
  team: 'player' | 'enemy';
  id: string;
  brawler: Brawler;
  powerCubes: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  team: 'player' | 'enemy';
  isSuper?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Box {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  radius: number;
}

interface PowerCube {
  x: number;
  y: number;
  radius: number;
}

export const ShowdownGame: React.FC<GameProps> = ({ playerBrawler, onFinish, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [rank, setRank] = useState(11);
  const [remaining, setRemaining] = useState(11);
  const [superCharge, _setSuperCharge] = useState(0);
  const superChargeRef = useRef(0);
  const setSuperCharge = (val: number | ((prev: number) => number)) => {
    if (typeof val === 'function') {
      const newVal = val(superChargeRef.current);
      superChargeRef.current = newVal;
      _setSuperCharge(newVal);
    } else {
      superChargeRef.current = val;
      _setSuperCharge(val);
    }
  };
  const [gasRadius, setGasRadius] = useState(2000);
  
  const keys = useRef<Set<string>>(new Set());
  const mousePos = useRef({ x: 0, y: 0 });
  const lastShot = useRef(0);
  const superRequested = useRef(false);
  const joystick = useRef({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, touchId: null as number | null });
  const finishCalled = useRef(false);
  const brawlerImages = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    // Preload images
    const loadImages = async () => {
      const images: Record<string, HTMLImageElement> = {};
      const toLoad = [playerBrawler, ...BRAWLERS.slice(0, 15)];
      
      for (const b of toLoad) {
        const img = new Image();
        img.src = await getAvatar(b.name);
        img.referrerPolicy = 'no-referrer';
        await new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        images[b.id] = img;
      }
      brawlerImages.current = images;
    };
    loadImages();

    // Game Objects
    const player: Entity = {
      x: width / 2,
      y: height / 2,
      radius: 25,
      color: '#3b82f6',
      hp: playerBrawler.stats.hp,
      maxHp: playerBrawler.stats.hp,
      team: 'player',
      id: playerBrawler.id,
      brawler: playerBrawler,
      powerCubes: 0
    };

    const enemies: Entity[] = Array.from({ length: 10 }).map((_, i) => {
      const b = BRAWLERS[Math.floor(Math.random() * BRAWLERS.length)];
      const angle = (i / 10) * Math.PI * 2;
      const dist = 800 + Math.random() * 400;
      return {
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        radius: 25,
        color: '#ef4444',
        hp: b.stats.hp,
        maxHp: b.stats.hp,
        team: 'enemy',
        id: b.id + i,
        brawler: b,
        powerCubes: 0
      };
    });

    const boxes: Box[] = Array.from({ length: 15 }).map(() => ({
      x: (Math.random() - 0.5) * 2000 + width / 2,
      y: (Math.random() - 0.5) * 2000 + height / 2,
      hp: 6000,
      maxHp: 6000,
      radius: 30
    }));

    const powerCubes: PowerCube[] = [];
    const projectiles: Projectile[] = [];
    const particles: Particle[] = [];
    const gasParticles: Particle[] = [];
    let currentGasRadius = 2500;
    let gasDamageTimer = 0;
    let shakeAmount = 0;

    const shootAt = (tx: number, ty: number, isSuper = false) => {
      const now = Date.now();
      if (!isSuper && now - lastShot.current < 500) return;
      if (isSuper && superChargeRef.current < 100) return;
      
      if (!isSuper) lastShot.current = now;
      else {
        setSuperCharge(0);
      }

      const angle = Math.atan2(ty - player.y, tx - player.x);
      const cubeBonus = 1 + player.powerCubes * 0.1;
      
      projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * (isSuper ? 15 : 12),
        vy: Math.sin(angle) * (isSuper ? 15 : 12),
        damage: (isSuper ? playerBrawler.stats.damage * 2.5 : playerBrawler.stats.damage) * cubeBonus,
        team: 'player',
        isSuper
      });

      // Recoil particles
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: player.x, y: player.y,
          vx: -Math.cos(angle) * (Math.random() * 5),
          vy: -Math.sin(angle) * (Math.random() * 5),
          life: 1, color: '#fbbf24'
        });
      }
    };

    const shootSuper = () => {
      // Auto-aim for Super: find the nearest alive enemy
      let nearestDist = Infinity;
      let targetX = mousePos.current.x;
      let targetY = mousePos.current.y;

      enemies.forEach(e => {
        if (e.hp <= 0) return;
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          targetX = e.x;
          targetY = e.y;
        }
      });

      shootAt(targetX, targetY, true);
    };

    let animationFrame: number;

    const update = () => {
      if (gameState !== 'playing') return;

      // Gas Shrinking
      currentGasRadius -= 0.5;
      setGasRadius(currentGasRadius);

      // Gas Particles
      if (Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        gasParticles.push({
          x: width / 2 + Math.cos(angle) * currentGasRadius,
          y: height / 2 + Math.sin(angle) * currentGasRadius,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
          color: 'rgba(34, 197, 94, 0.4)'
        });
      }

      for (let i = gasParticles.length - 1; i >= 0; i--) {
        const p = gasParticles[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.01;
        if (p.life <= 0) gasParticles.splice(i, 1);
      }

      // Gas Damage
      gasDamageTimer++;
      if (gasDamageTimer > 60) {
        const distToCenter = Math.hypot(player.x - width / 2, player.y - height / 2);
        if (distToCenter > currentGasRadius) {
          player.hp -= 1000;
          shakeAmount = 15;
        }
        enemies.forEach(e => {
          const d = Math.hypot(e.x - width / 2, e.y - height / 2);
          if (d > currentGasRadius) e.hp -= 1000;
        });
        gasDamageTimer = 0;
      }

      if (shakeAmount > 0) shakeAmount *= 0.9;

      // Movement
      let dx = 0, dy = 0;
      if (superRequested.current) {
        shootSuper();
        superRequested.current = false;
      }

      if (keys.current.has('KeyW') || keys.current.has('ArrowUp')) dy -= 1;
      if (keys.current.has('KeyS') || keys.current.has('ArrowDown')) dy += 1;
      if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) dx -= 1;
      if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) dx += 1;

      if (joystick.current.active) {
        const jdx = joystick.current.currentX - joystick.current.startX;
        const jdy = joystick.current.currentY - joystick.current.startY;
        const dist = Math.hypot(jdx, jdy);
        if (dist > 5) { dx = jdx / dist; dy = jdy / dist; }
      }

      const speed = playerBrawler.stats.speed;
      if (dx !== 0 || dy !== 0) {
        const mag = Math.hypot(dx, dy);
        player.x += (dx / mag) * speed;
        player.y += (dy / mag) * speed;
      }

      // Enemy AI
      enemies.forEach(e => {
        if (e.hp <= 0) return;
        
        // Move towards center if in gas
        const distToCenter = Math.hypot(e.x - width / 2, e.y - height / 2);
        if (distToCenter > currentGasRadius - 100) {
          const angle = Math.atan2(height / 2 - e.y, width / 2 - e.x);
          e.x += Math.cos(angle) * e.brawler.stats.speed;
          e.y += Math.sin(angle) * e.brawler.stats.speed;
        } else {
          // Move towards player if close
          const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
          if (distToPlayer < 400) {
            const angle = Math.atan2(player.y - e.y, player.x - e.x);
            e.x += Math.cos(angle) * e.brawler.stats.speed * 0.5;
            e.y += Math.sin(angle) * e.brawler.stats.speed * 0.5;

            // Shoot at player
            if (Math.random() < 0.02) {
              const cubeBonus = 1 + e.powerCubes * 0.1;
              projectiles.push({
                x: e.x, y: e.y,
                vx: Math.cos(angle) * 10,
                vy: Math.sin(angle) * 10,
                damage: e.brawler.stats.damage * cubeBonus,
                team: 'enemy'
              });
            }
          }
        }
      });

      // Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -2000 || p.x > 4000 || p.y < -2000 || p.y > 4000) {
          projectiles.splice(i, 1);
          continue;
        }

        if (p.team === 'player') {
          // Hit enemies
          enemies.forEach(e => {
            if (e.hp <= 0) return;
            const dist = Math.hypot(p.x - e.x, p.y - e.y);
            if (dist < e.radius + 10) {
              e.hp -= p.damage;
              if (!p.isSuper) setSuperCharge(prev => Math.min(100, prev + 15));
              projectiles.splice(i, 1);
              if (e.hp <= 0) {
                powerCubes.push({ x: e.x, y: e.y, radius: 15 });
                setRemaining(prev => prev - 1);
              }
            }
          });
          // Hit boxes
          boxes.forEach((b, idx) => {
            if (b.hp <= 0) return;
            const dist = Math.hypot(p.x - b.x, p.y - b.y);
            if (dist < b.radius + 10) {
              b.hp -= p.damage;
              projectiles.splice(i, 1);
              if (b.hp <= 0) {
                powerCubes.push({ x: b.x, y: b.y, radius: 15 });
                boxes.splice(idx, 1);
              }
            }
          });
        } else {
          // Hit player
          const dist = Math.hypot(p.x - player.x, p.y - player.y);
          if (dist < player.radius + 10) {
            player.hp -= p.damage;
            shakeAmount = 10;
            projectiles.splice(i, 1);
          }
        }
      }

      // Collect Power Cubes
      for (let i = powerCubes.length - 1; i >= 0; i--) {
        const c = powerCubes[i];
        const dist = Math.hypot(player.x - c.x, player.y - c.y);
        if (dist < player.radius + 20) {
          player.powerCubes++;
          player.maxHp += 400;
          player.hp += 400;
          powerCubes.splice(i, 1);
        }
      }

      // Check Win/Loss
      if (player.hp <= 0 && gameState === 'playing' && !finishCalled.current) {
        finishCalled.current = true;
        const aliveCount = enemies.filter(e => e.hp > 0).length + 1;
        setRank(aliveCount);
        setGameState('finished');
        setTimeout(() => onFinish(aliveCount), 1500);
      }
      
      const aliveEnemies = enemies.filter(e => e.hp > 0).length;
      if (aliveEnemies === 0 && gameState === 'playing' && !finishCalled.current) {
        finishCalled.current = true;
        setRank(1);
        setGameState('finished');
        setTimeout(() => onFinish(1), 1500);
      }

      setRemaining(aliveEnemies + 1);

      // Draw
      ctx.clearRect(0, 0, width, height);
      
      // Camera follow
      ctx.save();
      const sx = (Math.random() - 0.5) * shakeAmount;
      const sy = (Math.random() - 0.5) * shakeAmount;
      ctx.translate(width / 2 - player.x + sx, height / 2 - player.y + sy);

      // Draw Gas
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, currentGasRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
      ctx.lineWidth = 20;
      ctx.stroke();
      
      // Draw outer gas
      ctx.fillStyle = 'rgba(20, 83, 45, 0.3)';
      ctx.beginPath();
      ctx.rect(-2000, -2000, 6000, 6000);
      ctx.arc(width / 2, height / 2, currentGasRadius, 0, Math.PI * 2, true);
      ctx.fill();

      // Gas smoke
      gasParticles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 40 * p.life, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Boxes
      boxes.forEach(b => {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2);
        ctx.strokeStyle = '#451a03';
        ctx.strokeRect(b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2);
        
        // HP Bar
        const hpWidth = (b.hp / b.maxHp) * 60;
        ctx.fillStyle = '#333';
        ctx.fillRect(b.x - 30, b.y - 50, 60, 6);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(b.x - 30, b.y - 50, hpWidth, 6);
      });

      // Draw Power Cubes
      powerCubes.forEach(c => {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      });

      // Draw Enemies
      enemies.forEach(e => {
        if (e.hp <= 0) return;
        const img = brawlerImages.current[e.brawler.id];
        if (img) {
          ctx.drawImage(img, e.x - 30, e.y - 30, 60, 60);
        } else {
          ctx.fillStyle = e.color;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
        }

        // HP Bar
        const hpWidth = (e.hp / e.maxHp) * 60;
        ctx.fillStyle = '#333';
        ctx.fillRect(e.x - 30, e.y - 50, 60, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x - 30, e.y - 50, hpWidth, 6);
        
        // Cubes count
        if (e.powerCubes > 0) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`⚡ ${e.powerCubes}`, e.x - 15, e.y + 50);
        }
      });

      // Draw Player
      const pImg = brawlerImages.current[player.id];
      if (pImg) {
        ctx.drawImage(pImg, player.x - 30, player.y - 30, 60, 60);
      } else {
        ctx.fillStyle = player.color;
        ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();
      }

      // Player HP Bar
      const pHPWidth = (player.hp / player.maxHp) * 60;
      ctx.fillStyle = '#333';
      ctx.fillRect(player.x - 30, player.y - 50, 60, 6);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(player.x - 30, player.y - 50, pHPWidth, 6);
      
      if (player.powerCubes > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`⚡ ${player.powerCubes}`, player.x - 15, player.y + 50);
      }

      // Projectiles
      projectiles.forEach(p => {
        ctx.fillStyle = p.isSuper ? '#fbbf24' : (p.team === 'player' ? '#fff' : '#ef4444');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.isSuper ? 12 : 8, 0, Math.PI * 2);
        ctx.fill();
        if (p.isSuper) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#fbbf24';
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });

      ctx.restore();

      animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);

    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX + player.x - width / 2, y: e.clientY + player.y - height / 2 };
    };
    const handleClick = () => shootAt(mousePos.current.x, mousePos.current.y);

    const handleTouchStart = (e: TouchEvent) => {
      // Prevent default to avoid scrolling/zooming
      if ((e.target as HTMLElement).tagName === 'CANVAS') {
        e.preventDefault();
      }

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        
        // Check if touch is on HUD elements
        const target = touch.target as HTMLElement;
        if (target.closest('button') || target.closest('.hud-element')) {
          continue;
        }

        if (touch.clientX < width / 2 && joystick.current.touchId === null) {
          joystick.current = { 
            active: true, 
            startX: touch.clientX, 
            startY: touch.clientY, 
            currentX: touch.clientX, 
            currentY: touch.clientY,
            touchId: touch.identifier 
          };
        } else {
          mousePos.current = { x: touch.clientX + player.x - width / 2, y: touch.clientY + player.y - height / 2 };
          shootAt(mousePos.current.x, mousePos.current.y);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (joystick.current.active && touch.identifier === joystick.current.touchId) {
          joystick.current.currentX = touch.clientX;
          joystick.current.currentY = touch.clientY;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystick.current.touchId) {
          joystick.current.active = false;
          joystick.current.touchId = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [gameState]);

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-hidden touch-none">
      <canvas ref={canvasRef} className="block" />

      {/* HUD */}
      <div className="hud-element absolute top-3 left-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
          <Skull className="w-4 h-4 text-red-500" />
          <span className="text-lg font-bold text-white font-mono">{remaining}</span>
          <span className="text-[10px] text-white/50 uppercase tracking-widest ml-1">Brawlers</span>
        </div>
      </div>

      {/* Super Button */}
      <div className="absolute bottom-8 right-8 flex flex-col items-center gap-4">
        <div className="relative">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle 
              cx="40" cy="40" r="36" fill="transparent" stroke="#fbbf24" strokeWidth="6" 
              strokeDasharray={Math.PI * 72} 
              strokeDashoffset={Math.PI * 72 * (1 - superCharge / 100)}
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${superCharge >= 100 ? 'bg-yellow-500 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'bg-slate-800 border-white/10 opacity-50'}`}
              onPointerDown={(e) => { e.stopPropagation(); if (superCharge >= 100) superRequested.current = true; }}
            >
              <Star className={`w-7 h-7 ${superCharge >= 100 ? 'text-slate-950 fill-current' : 'text-white/30'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Exit Button */}
      <button 
        onPointerDown={(e) => { e.stopPropagation(); onExit(); }}
        className="absolute top-3 right-3 p-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-white/10 text-white/50 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Game Over Text */}
      {gameState === 'finished' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h1 className={`text-4xl font-black italic uppercase tracking-tighter ${rank === 1 ? 'text-yellow-400' : 'text-red-500'} animate-bounce`}>
              {rank === 1 ? '¡VICTORIA!' : 'ELIMINADO'}
            </h1>
            <p className="text-xl font-black text-white uppercase tracking-widest mt-2">Puesto #{rank}</p>
          </div>
        </div>
      )}

      {/* Joystick Hint */}
      <div className="absolute bottom-8 left-8 pointer-events-none opacity-30">
        <div className="w-20 h-20 border-4 border-dashed border-white/20 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
};
