import React, { useEffect, useRef, useState } from 'react';
import { Brawler } from '../types';
import { BRAWLERS } from '../constants';
import { getAvatar } from '../utils/avatarCache';
import { Star, X } from 'lucide-react';

interface GameProps {
  playerBrawler: Brawler;
  onWin: (kills: number) => void;
  onLoss: (kills: number) => void;
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
  gems: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  team: 'player' | 'enemy';
  radius?: number;
}

interface Gem {
  x: number;
  y: number;
  radius: number;
}

export const GemGrabGame: React.FC<GameProps> = ({ playerBrawler, onWin, onLoss, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [playerGems, setPlayerGems] = useState(0);
  const [enemyGems, setEnemyGems] = useState(0);
  const [countdown, _setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const countdownStartTime = useRef<number | null>(null);
  const setCountdown = (val: number | null) => {
    countdownRef.current = val;
    _setCountdown(val);
  };
  const [superCharge, _setSuperCharge] = useState(0);
  const superChargeRef = useRef(0);
  const setSuperCharge = (val: number) => {
    superChargeRef.current = val;
    _setSuperCharge(val);
  };
  const [kills, setKills] = useState(0);
  const killsRef = useRef(0);



  const keys = useRef<Set<string>>(new Set());
  const mousePos = useRef({ x: 0, y: 0 });
  const lastShot = useRef(0);
  const superRequested = useRef(false);
  const joystick = useRef({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, touchId: null as number | null });
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
      const toLoad = [playerBrawler, ...BRAWLERS.slice(0, 5)]; // Load some brawlers for enemies
      
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

    const player: Entity & { superCharge: number } = {
      x: width / 4,
      y: height / 2,
      radius: 35,
      color: '#3b82f6',
      hp: playerBrawler.stats.hp,
      maxHp: playerBrawler.stats.hp,
      team: 'player',
      gems: 0,
      superCharge: 0
    };

    const enemies: Entity[] = [
      { x: width * 0.75, y: height / 4, radius: 35, color: '#ef4444', hp: 4000, maxHp: 4000, team: 'enemy', gems: 0 },
      { x: width * 0.75, y: height / 2, radius: 35, color: '#ef4444', hp: 4000, maxHp: 4000, team: 'enemy', gems: 0 },
      { x: width * 0.75, y: height * 0.75, radius: 35, color: '#ef4444', hp: 4000, maxHp: 4000, team: 'enemy', gems: 0 },
    ];

    const projectiles: (Projectile & { isSuper?: boolean })[] = [];
    const gems: Gem[] = [];
    const particles: { x: number, y: number, vx: number, vy: number, life: number, color: string }[] = [];
    let gemSpawnTimer = 0;

    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) shoot();
      if (e.button === 2) shootSuper();
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Prevent default to avoid scrolling/zooming, but only if we are on the canvas
      if ((e.target as HTMLElement).tagName === 'CANVAS') {
        e.preventDefault();
      }

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        
        // Check if touch is on HUD elements (like Super button or Exit button)
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
          // If the touch was NOT on a button (already handled by the target.closest check)
          // but we want to be extra safe for elements that might not be detected as buttons
          const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
          if (elementUnderTouch?.closest('button') || elementUnderTouch?.closest('.hud-element') || elementUnderTouch?.closest('.hud-button')) {
            continue;
          }

          // Shoot if touch is on the right side or if joystick is already active elsewhere
          mousePos.current = { x: touch.clientX, y: touch.clientY };
          shootAt(touch.clientX, touch.clientY);
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
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    window.addEventListener('contextmenu', e => e.preventDefault());

    const shootAt = (tx: number, ty: number, isSuper = false) => {
      const now = Date.now();
      const fireRate = playerBrawler.stats.fireRate || 400;
      if (!isSuper && now - lastShot.current < fireRate) return;
      
      if (isSuper && superChargeRef.current < 100) return;
      
      if (!isSuper) lastShot.current = now;
      else {
        setSuperCharge(0);
      }

      const angle = Math.atan2(ty - player.y, tx - player.x);
      const pType = isSuper ? 'normal' : (playerBrawler.stats.projectileType || 'normal');
      const baseDamage = isSuper ? playerBrawler.stats.damage * 2.5 : playerBrawler.stats.damage;

      if (pType === 'fan') {
         [-0.2, 0, 0.2].forEach(offset => {
           projectiles.push({
             x: player.x, y: player.y,
             vx: Math.cos(angle + offset) * 12, vy: Math.sin(angle + offset) * 12,
             damage: baseDamage, team: 'player', isSuper
           });
         });
      } else if (pType === 'burst') {
         for (let i=0; i<3; i++) {
           setTimeout(() => {
             projectiles.push({
               x: player.x, y: player.y,
               vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12,
               damage: baseDamage, team: 'player', isSuper
             });
           }, i * 150);
         }
      } else if (pType === 'big_slow') {
         projectiles.push({
             x: player.x, y: player.y,
             vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6,
             damage: baseDamage * 2, team: 'player', isSuper,
             radius: 20
         });
      } else {
         projectiles.push({
             x: player.x, y: player.y,
             vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12,
             damage: baseDamage, team: 'player', isSuper
         });
      }

      // Recoil effect
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: player.x,
          y: player.y,
          vx: -Math.cos(angle) * (Math.random() * 5),
          vy: -Math.sin(angle) * (Math.random() * 5),
          life: 1,
          color: '#fbbf24'
        });
      }
    };

    const shoot = () => shootAt(mousePos.current.x, mousePos.current.y);
    const shootSuper = () => {
      // Auto-aim for Super: find the nearest enemy
      let nearestDist = Infinity;
      let targetX = mousePos.current.x;
      let targetY = mousePos.current.y;

      enemies.forEach(e => {
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

      // Movement logic
      let dx = 0;
      let dy = 0;

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
        if (dist > 5) {
          dx = jdx / dist;
          dy = jdy / dist;
        }
      }

      const speed = playerBrawler.stats.speed;
      if (dx !== 0 || dy !== 0) {
        const mag = Math.hypot(dx, dy);
        player.x += (dx / mag) * speed;
        player.y += (dy / mag) * speed;
      }

      // Clamp player
      player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

      // Gem Spawning
      gemSpawnTimer++;
      if (gemSpawnTimer > 250) {
        gems.push({
          x: width / 2 + (Math.random() - 0.5) * 200,
          y: height / 2 + (Math.random() - 0.5) * 200,
          radius: 12
        });
        gemSpawnTimer = 0;
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          projectiles.splice(i, 1);
          continue;
        }

        if (p.team === 'player') {
          enemies.forEach(e => {
            const projRad = p.radius || (p.isSuper ? 12 : 6);
            const dist = Math.hypot(p.x - e.x, p.y - e.y);
            if (dist < e.radius + projRad) {
              e.hp -= p.damage;
              
              // Charge super on hit
              if (!p.isSuper) {
                setSuperCharge(Math.min(100, superChargeRef.current + 15));
              }

              // Hit particles
              for (let j = 0; j < 8; j++) {
                particles.push({
                  x: p.x, y: p.y,
                  vx: (Math.random() - 0.5) * 10,
                  vy: (Math.random() - 0.5) * 10,
                  life: 0.8, color: '#ef4444'
                });
              }

              if (!p.isSuper) projectiles.splice(i, 1);
              
                if (e.hp <= 0) {
                  setKills(prev => prev + 1);
                  killsRef.current++;
                  for (let j = 0; j < e.gems; j++) {
                  gems.push({ x: e.x + (Math.random() - 0.5) * 60, y: e.y + (Math.random() - 0.5) * 60, radius: 12 });
                }
                e.gems = 0;
                e.hp = e.maxHp;
                e.x = width * 0.85;
                e.y = Math.random() * height;
              }
            }
          });
        } else {
          const dist = Math.hypot(p.x - player.x, p.y - player.y);
          if (dist < player.radius + 10) {
            player.hp -= p.damage;
            projectiles.splice(i, 1);
            
            // Screen shake effect (simulated by moving player slightly)
            player.x += (Math.random() - 0.5) * 10;
            player.y += (Math.random() - 0.5) * 10;

            if (player.hp <= 0) {
               for (let j = 0; j < player.gems; j++) {
                gems.push({ x: player.x + (Math.random() - 0.5) * 60, y: player.y + (Math.random() - 0.5) * 60, radius: 12 });
              }
              player.gems = 0;
              setPlayerGems(0);
              player.hp = player.maxHp;
              player.x = width / 4;
              player.y = height / 2;
            }
          }
        }
      }

      // Enemy AI
      enemies.forEach(e => {
        const targetX = width / 2;
        const targetY = height / 2;
        const angle = Math.atan2(targetY - e.y, targetX - e.x);
        e.x += Math.cos(angle) * 2.5;
        e.y += Math.sin(angle) * 2.5;

        if (Math.random() < 0.015) {
          const shootAngle = Math.atan2(player.y - e.y, player.x - e.x);
          projectiles.push({
            x: e.x, y: e.y,
            vx: Math.cos(shootAngle) * 8,
            vy: Math.sin(shootAngle) * 8,
            damage: 600, team: 'enemy'
          });
        }
      });

      // Gem Collection
      for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        const distP = Math.hypot(player.x - g.x, player.y - g.y);
        if (distP < player.radius + g.radius) {
          player.gems++;
          setPlayerGems(prev => prev + 1);
          gems.splice(i, 1);
          continue;
        }

        enemies.forEach(e => {
          const distE = Math.hypot(e.x - g.x, e.y - g.y);
          if (distE < e.radius + g.radius) {
            e.gems++;
            setEnemyGems(enemies.reduce((acc, curr) => acc + curr.gems, 0));
            gems.splice(i, 1);
          }
        });
      }

      const totalEnemyGems = enemies.reduce((acc, curr) => acc + curr.gems, 0);
      const isPlayerWinning = player.gems >= 10 && player.gems > totalEnemyGems;
      const isEnemyWinning = totalEnemyGems >= 10 && totalEnemyGems > player.gems;
      
      if (isPlayerWinning || isEnemyWinning) {
        if (countdownStartTime.current === null) {
          countdownStartTime.current = Date.now();
          setCountdown(15);
        } else {
          const now = Date.now();
          const elapsed = Math.floor((now - (countdownStartTime.current as number)) / 1000);
          const currentCount = Math.max(0, 15 - elapsed);
          
          if (currentCount !== countdownRef.current) {
            setCountdown(currentCount);
          }
        }
      } else {
        countdownStartTime.current = null;
        if (countdownRef.current !== null) {
          setCountdown(null);
        }
      }
    };



    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 2;
      for (let x = 0; x < width; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Particles
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Gems
      gems.forEach(g => {
        ctx.shadowBlur = 15; ctx.shadowColor = '#a855f7';
        ctx.fillStyle = '#a855f7';
        ctx.beginPath(); 
        ctx.moveTo(g.x, g.y - g.radius);
        ctx.lineTo(g.x + g.radius, g.y);
        ctx.lineTo(g.x, g.y + g.radius);
        ctx.lineTo(g.x - g.radius, g.y);
        ctx.closePath();
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Projectiles
      projectiles.forEach(p => {
        const pr = p.radius || (p.isSuper ? 12 : 6);
        ctx.fillStyle = p.team === 'player' ? (p.isSuper ? '#f43f5e' : '#fbbf24') : '#ef4444';
        ctx.beginPath(); ctx.arc(p.x, p.y, pr, 0, Math.PI * 2); ctx.fill();
        if (p.isSuper) {
          ctx.shadowBlur = 20; ctx.shadowColor = '#f43f5e';
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0;

      // Entities
      [player, ...enemies].forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(0, e.radius, e.radius * 0.8, e.radius * 0.3, 0, 0, Math.PI * 2); ctx.fill();

        // Brawler Image or Circle
        const img = brawlerImages.current[e.team === 'player' ? playerBrawler.id : 'brawler-1'];
        if (img) {
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, -e.radius, -e.radius, e.radius * 2, e.radius * 2);
        } else {
          ctx.fillStyle = e.color;
          ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
        }
        
        ctx.restore();

        // HP Bar
        const barWidth = 70;
        const barHeight = 8;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 25, barWidth, barHeight);
        ctx.fillStyle = e.team === 'player' ? '#10b981' : '#f43f5e';
        ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 25, (e.hp / e.maxHp) * barWidth, barHeight);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(e.x - barWidth / 2, e.y - e.radius - 25, barWidth, barHeight);

        // Gem Count
        if (e.gems > 0) {
          ctx.fillStyle = '#a855f7';
          ctx.font = 'black 14px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(`💎 ${e.gems}`, e.x, e.y + e.radius + 25);
        }
      });

      // Joystick UI
      if (joystick.current.active) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(joystick.current.startX, joystick.current.startY, 50, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath(); ctx.arc(joystick.current.currentX, joystick.current.currentY, 30, 0, Math.PI * 2); ctx.fill();
      }
    };

    const loop = () => {
      update();
      draw();
      animationFrame = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      cancelAnimationFrame(animationFrame);
    };
  }, [gameState, playerBrawler]); // Removed countdown to prevent game reset every second

  useEffect(() => {
    if (countdown === 0) {
      if (playerGems >= enemyGems) {

        setGameState('won');
        onWin(killsRef.current);
      } else {
        setGameState('lost');
        onLoss(killsRef.current);
      }
    }
  }, [countdown, playerGems, enemyGems, onWin, onLoss]);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden touch-none">
      {/* HUD */}
      <div className="hud-element absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-[24px] border-2 border-white/10 shadow-2xl z-[110]">
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">Tus Gemas</span>
          <span className="text-2xl font-black text-white italic">{playerGems}</span>
        </div>
        
        {countdown !== null && (
          <div className="flex flex-col items-center px-6 border-x-2 border-white/10">
            <span className="text-[8px] font-black text-yellow-400 uppercase tracking-[0.2em]">Final</span>
            <span className="text-4xl font-black text-yellow-400 animate-pulse italic">{countdown}</span>
          </div>
        )}
        
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-black text-red-400 uppercase tracking-[0.2em]">Enemigos</span>
          <span className="text-2xl font-black text-white italic">{enemyGems}</span>
        </div>
      </div>

      {/* Super Button (Mobile) */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-4 z-[110]">
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full animate-pulse pointer-events-none" />

          <button 
            className={`hud-button w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${superCharge >= 100 ? 'bg-yellow-500 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'bg-slate-800 border-white/10 opacity-50'}`}
            onPointerDown={(e) => { 
                e.stopPropagation(); 
                if (superCharge >= 100) {
                    superRequested.current = true;
                }
            }}
          >
            <Star className={`w-8 h-8 pointer-events-none ${superCharge >= 100 ? 'text-slate-950 fill-current' : 'text-white/30'}`} />
          </button>
          {/* Super Charge Ring */}
          <svg className="absolute inset-0 -rotate-90 w-16 h-16 pointer-events-none">
            <circle 
              cx="32" cy="32" r="28" 
              fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" 
            />
            <circle 
              cx="32" cy="32" r="28" 
              fill="none" stroke="#fbbf24" strokeWidth="3" 
              strokeDasharray={176}
              strokeDashoffset={176 - (176 * superCharge) / 100}
              className="transition-all duration-300"
            />
          </svg>
        </div>
      </div>

      <button 
        onPointerDown={(e) => { e.stopPropagation(); onExit(); }}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl border-2 border-white/10 transition-all z-[110]"
      >
        <X className="w-5 h-5" />
      </button>

      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />

    </div>
  );
};
