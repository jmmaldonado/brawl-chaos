import React, { useEffect, useRef, useState } from 'react';
import { Brawler } from '../types';
import { BRAWLERS } from '../constants';
import { getAvatar } from '../utils/avatarCache';
import { Star, X, Trophy } from 'lucide-react';

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
  id: string;
  respawnTimer: number; // in frames
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ownerId: string | null;
  lastOwnerId: string | null;
  kickTimer: number;
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

export const BrawlBallGame: React.FC<GameProps> = ({ playerBrawler, onWin, onLoss, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'scored' | 'won' | 'lost'>('playing');
  const [playerScore, setPlayerScore] = useState(0);
  const [enemyScore, setEnemyScore] = useState(0);
  const [superCharge, _setSuperCharge] = useState(0);
  const superChargeRef = useRef(0);
  const setSuperCharge = (val: number) => {
    superChargeRef.current = val;
    _setSuperCharge(val);
  };

  const keys = useRef<Set<string>>(new Set());
  const mousePos = useRef({ x: 0, y: 0 });
  const lastShot = useRef(0);
  const superRequested = useRef(false);
  const joystick = useRef({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, touchId: null as number | null });
  const brawlerImages = useRef<Record<string, HTMLImageElement>>({});
  const [kills, setKills] = useState(0);
  const killsRef = useRef(0);
  
  const scoreRef = useRef({ player: 0, enemy: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    // Load images
    const loadImages = async () => {
      const images: Record<string, HTMLImageElement> = {};
      const toLoad = [playerBrawler, ...BRAWLERS.slice(0, 5)];
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

    // Teams setup
    const player: Entity = {
      x: width * 0.2, y: height / 2, radius: 35, color: '#3b82f6',
      hp: playerBrawler.stats.hp, maxHp: playerBrawler.stats.hp, team: 'player', id: playerBrawler.id, respawnTimer: 0
    };
    
    const partnerId = BRAWLERS[1].id;
    const partner: Entity = {
      x: width * 0.2, y: height / 4, radius: 35, color: '#60a5fa',
      hp: 4000, maxHp: 4000, team: 'player', id: partnerId, respawnTimer: 0
    };

    const enemies: Entity[] = [
      { x: width * 0.8, y: height / 4, radius: 35, color: '#ef4444', hp: 4000, maxHp: 4000, team: 'enemy', id: 'enemy-1', respawnTimer: 0 },
      { x: width * 0.8, y: height * 0.75, radius: 35, color: '#ef4444', hp: 4000, maxHp: 4000, team: 'enemy', id: 'enemy-2', respawnTimer: 0 },
    ];

    const ball: Ball = { x: width / 2, y: height / 2, vx: 0, vy: 0, radius: 20, ownerId: null, lastOwnerId: null, kickTimer: 0 };
    const projectiles: Projectile[] = [];
    const particles: { x: number, y: number, vx: number, vy: number, life: number, color: string }[] = [];

    const GOAL_WIDTH = 100;
    const GOAL_HEIGHT = 200;

    const resetPositions = () => {
      player.x = width * 0.2; player.y = height / 2; player.hp = player.maxHp;
      partner.x = width * 0.2; partner.y = height / 4; partner.hp = partner.maxHp;
      enemies[0].x = width * 0.8; enemies[0].y = height / 4; enemies[0].hp = enemies[0].maxHp;
      enemies[1].x = width * 0.8; enemies[1].y = height * 0.75; enemies[1].hp = enemies[1].maxHp;
      ball.x = width / 2; ball.y = height / 2; ball.vx = 0; ball.vy = 0; ball.ownerId = null;
      ball.lastOwnerId = null; ball.kickTimer = 0;
      projectiles.length = 0;
    };

    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    
    const shootAt = (tx: number, ty: number, isSuper = false) => {
      if (player.respawnTimer > 0) return;
      
      const actuallySuper = isSuper || (superRequested.current && superChargeRef.current >= 100);

      if (ball.ownerId === player.id) {
        // Kick ball instead
        const angle = Math.atan2(ty - player.y, tx - player.x);
        ball.vx = Math.cos(angle) * (actuallySuper ? 25 : 18);
        ball.vy = Math.sin(angle) * (actuallySuper ? 25 : 18);
        ball.ownerId = null;
        ball.lastOwnerId = player.id;
        ball.kickTimer = 20; // 20 frames of no-pickup for the kicker

        if (actuallySuper) {
          setSuperCharge(0);
          superRequested.current = false;
        }
        return;
      }

      const now = Date.now();
      if (!actuallySuper && now - lastShot.current < 400) return;
      if (actuallySuper && superChargeRef.current < 100) return;
      
      if (!actuallySuper) lastShot.current = now;
      else {
        setSuperCharge(0);
        superRequested.current = false;
      }

      const angle = Math.atan2(ty - player.y, tx - player.x);
      projectiles.push({
        x: player.x, y: player.y,
        vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12,
        damage: actuallySuper ? playerBrawler.stats.damage * 2.5 : playerBrawler.stats.damage,
        team: 'player', isSuper: actuallySuper
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) shootAt(mousePos.current.x, mousePos.current.y);
      if (e.button === 2) shootAt(mousePos.current.x, mousePos.current.y, true);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).tagName === 'CANVAS') e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.clientX < width / 2 && joystick.current.touchId === null) {
          joystick.current = { active: true, startX: touch.clientX, startY: touch.clientY, currentX: touch.clientX, currentY: touch.clientY, touchId: touch.identifier };
        } else {
          // Extra safety check for UI elements
          const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
          if (elementUnderTouch?.closest('button') || elementUnderTouch?.closest('.hud-element') || elementUnderTouch?.closest('.hud-button')) {
            continue;
          }

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
    window.addEventListener('contextmenu', e => e.preventDefault());

    let animationFrame: number;

    const update = () => {
      if (gameState !== 'playing') return;

      // Collision Resolution
      const allEntities = [player, partner, ...enemies];
      for (let i = 0; i < allEntities.length; i++) {
        for (let j = i + 1; j < allEntities.length; j++) {
          const e1 = allEntities[i];
          const e2 = allEntities[j];
          if (e1.respawnTimer > 0 || e2.respawnTimer > 0) continue;
          
          const dx = e2.x - e1.x;
          const dy = e2.y - e1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = e1.radius + e2.radius;
          
          if (dist < minDist) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            
            // Push them apart
            const ratio = 0.5;
            e1.x -= nx * overlap * ratio;
            e1.y -= ny * overlap * ratio;
            e2.x += nx * overlap * ratio;
            e2.y += ny * overlap * ratio;
          }
        }
      }

      // Player Movement
      let dx = 0, dy = 0;
      if (player.respawnTimer > 0) {
        player.respawnTimer--;
        if (player.respawnTimer === 0) {
          player.hp = player.maxHp;
          player.x = width * 0.15;
          player.y = height / 2;
        }
      } else {
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

        const speedScale = ball.ownerId === player.id ? 0.8 : 1.0;
        const speed = playerBrawler.stats.speed * speedScale;
        if (dx !== 0 || dy !== 0) {
          const mag = Math.hypot(dx, dy);
          player.x += (dx / mag) * speed;
          player.y += (dy / mag) * speed;
        }
      }
      player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

      // Ball Physics
      if (ball.ownerId) {
        const owner = [player, partner, ...enemies].find(e => e.id === ball.ownerId);
        if (owner) {
          ball.x = owner.x;
          ball.y = owner.y;
          ball.vx = 0;
          ball.vy = 0;
        }
      } else {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= 0.98;
        ball.vy *= 0.98;

        if (ball.x < ball.radius || ball.x > width - ball.radius) {
          ball.vx *= -0.8;
          ball.x = Math.max(ball.radius, Math.min(width - ball.radius, ball.x));
        }
        if (ball.y < ball.radius || ball.y > height - ball.radius) {
          ball.vy *= -0.8;
          ball.y = Math.max(ball.radius, Math.min(height - ball.radius, ball.y));
        }

        // Ball pick up
        if (ball.kickTimer > 0) ball.kickTimer--;

        allEntities.forEach(e => {
          if (e.respawnTimer <= 0) { // Can't pick up if "dead" respawning
            // Skip if it's the last owner and timer is active
            if (e.id === ball.lastOwnerId && ball.kickTimer > 0) return;

            const dist = Math.hypot(e.x - ball.x, e.y - ball.y);
            if (dist < e.radius + ball.radius) {
              ball.ownerId = e.id;
              ball.lastOwnerId = null;
              ball.kickTimer = 0;
            }
          }
        });
      }

      // Goal Detection
      if (ball.x < 50 && Math.abs(ball.y - height / 2) < GOAL_HEIGHT / 2) {
        scoreRef.current.enemy++;
        setEnemyScore(scoreRef.current.enemy);
        if (scoreRef.current.enemy >= 2) setGameState('lost');
        else {
          setGameState('scored');
          setTimeout(() => { setGameState('playing'); resetPositions(); }, 2000);
        }
      } else if (ball.x > width - 50 && Math.abs(ball.y - height / 2) < GOAL_HEIGHT / 2) {
        scoreRef.current.player++;
        setPlayerScore(scoreRef.current.player);
        if (scoreRef.current.player >= 2) setGameState('won');
        else {
          setGameState('scored');
          setTimeout(() => { setGameState('playing'); resetPositions(); }, 2000);
        }
      }

      // AI Logic
      [partner, ...enemies].forEach(ai => {
        if (ai.respawnTimer > 0) {
           ai.respawnTimer--;
           if (ai.respawnTimer === 0) {
             ai.hp = ai.maxHp;
             ai.x = ai.team === 'player' ? width * 0.15 : width * 0.85;
             ai.y = height / 2;
           }
           return;
        }

        if (ball.ownerId === ai.id) {
          // Carry to goal
          const tx = ai.team === 'player' ? width : 0;
          const ty = height / 2;
          const angle = Math.atan2(ty - ai.y, tx - ai.x);
          ai.x += Math.cos(angle) * 3;
          ai.y += Math.sin(angle) * 3;

          // Kick if close to goal
          const distToGoal = Math.hypot(tx - ai.x, ty - ai.y);
          if (distToGoal < 300 || Math.random() < 0.01) {
            ball.vx = Math.cos(angle) * 15;
            ball.vy = Math.sin(angle) * 15;
            ball.ownerId = null;
            ball.lastOwnerId = ai.id;
            ball.kickTimer = 20;
          }
        } else if (ball.ownerId === null) {
          // Seek ball
          const angle = Math.atan2(ball.y - ai.y, ball.x - ai.x);
          ai.x += Math.cos(angle) * 3.5;
          ai.y += Math.sin(angle) * 3.5;
        } else {
          // Attack ball owner or defend
          const target = [player, partner, ...enemies].find(e => e.id === ball.ownerId);
          if (target && target.team !== ai.team) {
            const angle = Math.atan2(target.y - ai.y, target.x - ai.x);
            ai.x += Math.cos(angle) * 3;
            ai.y += Math.sin(angle) * 3;
            if (Math.random() < 0.02) {
               projectiles.push({
                 x: ai.x, y: ai.y, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10,
                 damage: 800, team: ai.team
               });
            }
          } else {
             // Move to center
             const angle = Math.atan2(height/2 - ai.y, width/2 - ai.x);
             ai.x += Math.cos(angle) * 2;
             ai.y += Math.sin(angle) * 2;
          }
        }
      });

      // Projectiles & Particles update (reused from GemGrab)
       for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) { projectiles.splice(i, 1); continue; }

        const targets = p.team === 'player' ? enemies : [player, partner];
        targets.forEach(t => {
          if (t.respawnTimer > 0) return;
          const d = Math.hypot(p.x - t.x, p.y - t.y);
          if (d < t.radius + 10) {
            t.hp -= p.damage;
            if (p.team === 'player' && !p.isSuper) setSuperCharge(Math.min(100, superChargeRef.current + 15));
            projectiles.splice(i, 1);
            if (t.hp <= 0) {
               t.respawnTimer = 300; // 5 seconds at 60fps
               if (t.team === 'enemy') {
                 setKills(prev => prev + 1);
                 killsRef.current++;
               }
               if (ball.ownerId === t.id) ball.ownerId = null; // Drop ball on death
            }
          }
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, width, height);

      // Pitch lines
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.stroke();
      ctx.beginPath(); ctx.arc(width / 2, height / 2, 100, 0, Math.PI * 2); ctx.stroke();
      
      // Goals
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; ctx.fillRect(0, height / 2 - GOAL_HEIGHT / 2, 50, GOAL_HEIGHT);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; ctx.fillRect(width - 50, height / 2 - GOAL_HEIGHT / 2, 50, GOAL_HEIGHT);

      // Entities
      [player, partner, ...enemies].forEach(e => {
        ctx.save(); ctx.translate(e.x, e.y);
        
        if (e.respawnTimer > 0) {
          ctx.filter = 'grayscale(100%) opacity(50%)';
        }

        const img = brawlerImages.current[e.id] || brawlerImages.current[BRAWLERS[0].id];
        if (img) {
          ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.clip();
          ctx.drawImage(img, -e.radius, -e.radius, e.radius * 2, e.radius * 2);
        } else {
          ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
        }
        
        ctx.restore();

        if (e.respawnTimer > 0) {
          // Respawn Timer Text
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 24px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(Math.ceil(e.respawnTimer / 60).toString(), e.x, e.y + 10);
        } else {
          // HP Bar
          ctx.fillStyle = '#333'; ctx.fillRect(e.x - 35, e.y - 50, 70, 6);
          ctx.fillStyle = e.team === 'player' ? '#22c55e' : '#ef4444'; ctx.fillRect(e.x - 35, e.y - 50, (e.hp / e.maxHp) * 70, 6);
        }
      });

      // Ball
      ctx.fillStyle = '#fff'; ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Projectiles
      projectiles.forEach(p => {
        ctx.fillStyle = p.team === 'player' ? (p.isSuper ? '#fbbf24' : '#fff') : '#ef4444';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.isSuper ? 12 : 6, 0, Math.PI * 2); ctx.fill();
      });

      // Scoring overlay
      if (gameState === 'scored') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 80px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('¡GOL!', width / 2, height / 2);
      }
    };

    const loop = () => {
      update(); draw();
      animationFrame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleTouchStart); window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationFrame);
    };
  }, [gameState, playerBrawler]);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden touch-none">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/60 backdrop-blur-xl px-8 py-4 rounded-[24px] border-2 border-white/10 z-[110]">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Azul</span>
          <span className="text-3xl font-black text-white">{playerScore}</span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Rojo</span>
          <span className="text-3xl font-black text-white">{enemyScore}</span>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 flex flex-col gap-4 z-[110]">
        <div className="relative">
          <button 
            className={`hud-button w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${superCharge >= 100 ? 'bg-yellow-500 border-yellow-300' : 'bg-slate-800 border-white/10 opacity-50'}`}
            onPointerDown={(e) => { e.stopPropagation(); if (superCharge >= 100) superRequested.current = true; }}
          >
            <Star className={`w-8 h-8 pointer-events-none ${superCharge >= 100 ? 'text-slate-950 fill-current' : 'text-white/30'}`} />
          </button>
        </div>
      </div>

      <button onClick={onExit} className="absolute top-4 right-4 p-2 bg-white/10 rounded-xl border-2 border-white/10 z-[110]">
        <X className="w-6 h-6" />
      </button>

      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />

      {gameState === 'won' && (
        <div className="absolute inset-0 bg-blue-600/90 flex flex-col items-center justify-center z-[200]">
          <Trophy className="w-24 h-24 text-yellow-400 mb-4 animate-bounce" />
          <h1 className="text-6xl font-black italic uppercase">¡VICTORIA!</h1>
          <button onClick={() => onWin(killsRef.current)} className="mt-8 px-12 py-4 bg-white text-blue-600 rounded-full font-black uppercase text-xl hover:scale-105 transition-all">Continuar</button>
        </div>
      )}
      {gameState === 'lost' && (
        <div className="absolute inset-0 bg-red-600/90 flex flex-col items-center justify-center z-[200]">
          <X className="w-24 h-24 text-white mb-4 animate-pulse" />
          <h1 className="text-6xl font-black italic uppercase">DERROTA</h1>
          <button onClick={() => onLoss(killsRef.current)} className="mt-8 px-12 py-4 bg-white text-red-600 rounded-full font-black uppercase text-xl hover:scale-105 transition-all">Continuar</button>
        </div>
      )}
    </div>
  );
};
