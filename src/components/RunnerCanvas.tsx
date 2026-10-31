import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlayerConfig, SlabData, SlabRunResult, GameMode, HurdleInstance } from '../types/game';
import { sound } from '../utils/audio';
import { Heart, Clock, Zap, ShieldAlert, Award, Gem, Flag } from 'lucide-react';

interface RunnerCanvasProps {
  slab: SlabData;
  creator: PlayerConfig;
  runner: PlayerConfig;
  gameMode: GameMode;
  timeLimit: number;
  onFinishRun: (result: SlabRunResult) => void;
}

export const RunnerCanvas: React.FC<RunnerCanvasProps> = ({
  slab,
  creator,
  runner,
  gameMode,
  timeLimit,
  onFinishRun,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Run State
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [lives, setLives] = useState<number>(3);
  const [combo, setCombo] = useState<number>(1);
  const [maxCombo, setMaxCombo] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [checkpointReached, setCheckpointReached] = useState<boolean>(false);
  const [hasGem, setHasGem] = useState<boolean>(false);

  // TRAP SYSTEM STATE
  const [isTrapped, setIsTrapped] = useState<boolean>(false);
  const [trapSecondsLeft, setTrapSecondsLeft] = useState<number>(0);

  // Checkpoint banner feedback
  const [showCheckpointAlert, setShowCheckpointAlert] = useState<boolean>(false);

  // Metrics
  const metricsRef = useRef({
    trapsTriggered: 0,
    obstaclesAvoided: 0,
    damageTaken: 0,
    guardDetections: 0,
    startTime: Date.now(),
    ended: false,
  });

  // Runner Physical Position
  const playerRef = useRef({
    x: slab.startPos.x,
    y: slab.startPos.y,
    vx: 0,
    vy: 0,
    width: 22,
    height: gameMode === 'mutant_lab' ? 32 : 22,
    isGrounded: false,
    invincibleTimer: 0,
    lastCheckpoint: { x: slab.startPos.x, y: slab.startPos.y },
    discoveredX: 180, // Progressive reveal horizon
  });

  // Keyboard state
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const CANVAS_WIDTH = 920;
  const CANVAS_HEIGHT = 460;

  // Key event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Trap countdown interval
  useEffect(() => {
    if (!isTrapped || trapSecondsLeft <= 0) return;

    sound.playTrapCountdownTick(trapSecondsLeft);

    const timer = setTimeout(() => {
      if (trapSecondsLeft <= 1) {
        setIsTrapped(false);
        setTrapSecondsLeft(0);
      } else {
        setTrapSecondsLeft(trapSecondsLeft - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isTrapped, trapSecondsLeft]);

  // Finish run handler
  const completeRun = useCallback(
    (won: boolean) => {
      if (metricsRef.current.ended) return;
      metricsRef.current.ended = true;

      const completionTime = Math.min(
        timeLimit,
        (Date.now() - metricsRef.current.startTime) / 1000
      );

      // Score calculation
      const basePoints = won ? 5000 : 1000;
      const timeBonus = won ? Math.round(Math.max(0, timeLimit - completionTime) * 120) : 0;
      const livesBonus = lives * 800;
      const comboBonus = maxCombo * 250;
      const gemBonus = hasGem ? 2500 : 0;

      const finalRunnerScore = Math.max(
        0,
        basePoints + timeBonus + livesBonus + comboBonus + gemBonus - metricsRef.current.damageTaken * 300
      );

      // Designer Score: Rewards fair difficulty, creativity, trap engagement
      const designerPoints = Math.round(
        slab.difficultyRating * 40 +
        (won ? 2000 : 3500) +
        metricsRef.current.trapsTriggered * 600 +
        metricsRef.current.guardDetections * 400 +
        slab.hurdles.length * 200
      );

      const result: SlabRunResult = {
        won,
        completionTime,
        livesRemaining: lives,
        trapsTriggered: metricsRef.current.trapsTriggered,
        obstaclesAvoided: metricsRef.current.obstaclesAvoided,
        damageTaken: metricsRef.current.damageTaken,
        guardDetections: metricsRef.current.guardDetections,
        comboMax: maxCombo,
        gemCollected: hasGem,
        runnerScore: finalRunnerScore,
        designerScore: designerPoints,
      };

      onFinishRun(result);
    },
    [timeLimit, lives, maxCombo, hasGem, slab.difficultyRating, slab.hurdles.length, onFinishRun]
  );

  // Time countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          completeRun(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [completeRun]);

  // Main Game Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const gameLoop = () => {
      tick += 0.03;
      const p = playerRef.current;

      // Handle Invincibility Flicker
      if (p.invincibleTimer > 0) {
        p.invincibleTimer -= 1;
      }

      // 1. Controls & Physics Movement
      if (!isTrapped) {
        if (gameMode === 'mutant_lab') {
          // --- PLATFORMER PHYSICS ---
          const moveSpeed = 4.8;
          if (keysRef.current['a'] || keysRef.current['arrowleft']) {
            p.vx = -moveSpeed;
          } else if (keysRef.current['d'] || keysRef.current['arrowright']) {
            p.vx = moveSpeed;
          } else {
            p.vx *= 0.8;
          }

          // Jump
          if (
            (keysRef.current['w'] || keysRef.current['arrowup'] || keysRef.current[' ']) &&
            p.isGrounded
          ) {
            p.vy = -11.2;
            p.isGrounded = false;
            sound.playJump();
            setCombo(c => {
              const nc = c + 1;
              setMaxCombo(mc => Math.max(mc, nc));
              return nc;
            });
          }

          // Gravity
          p.vy += 0.58;
          p.x += p.vx;
          p.y += p.vy;

          // Main Ground Floor (Y = 410)
          const groundY = 410 - p.height;
          // Check if above toxic acid pit (280 to 640)
          const inAcidChasm = p.x > 280 && p.x < 640;

          if (p.y >= groundY) {
            if (inAcidChasm) {
              // Stepped into toxic hazard
              if (p.invincibleTimer <= 0) {
                takeHit();
              }
            } else {
              p.y = groundY;
              p.vy = 0;
              p.isGrounded = true;
            }
          }
        } else {
          // --- HEIST TOP-DOWN STEALTH PHYSICS ---
          const stealthSpeed = keysRef.current['shift'] ? 2.5 : 4.0;
          let dx = 0;
          let dy = 0;
          if (keysRef.current['w'] || keysRef.current['arrowup']) dy -= 1;
          if (keysRef.current['s'] || keysRef.current['arrowdown']) dy += 1;
          if (keysRef.current['a'] || keysRef.current['arrowleft']) dx -= 1;
          if (keysRef.current['d'] || keysRef.current['arrowright']) dx += 1;

          if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
          }

          p.x += dx * stealthSpeed;
          p.y += dy * stealthSpeed;

          // Wall boundaries
          p.x = Math.max(25, Math.min(CANVAS_WIDTH - 25, p.x));
          p.y = Math.max(25, Math.min(CANVAS_HEIGHT - 25, p.y));
        }
      } else {
        // Trapped in Cryo-Stasis
        p.vx = 0;
        p.vy = 0;
      }

      // Progressive reveal horizon (Curiosity System)
      p.discoveredX = Math.max(p.discoveredX, p.x + 220);

      // 2. Obstacle Collisions & Logic
      slab.hurdles.forEach(h => {
        const hw = h.width / 2;
        const hh = h.height / 2;

        // Moving obstacle offset calculation
        let curX = h.x;
        let curY = h.y;
        if (h.type === 'moving_platform') {
          curX += Math.sin(tick * h.speed) * 70;
        } else if (h.type === 'patrol_guard') {
          curX += Math.sin(tick * h.speed) * 80;
        } else if (h.type === 'mutant_creature') {
          curX += Math.sin(tick * h.speed) * 60;
        }

        const xDist = Math.abs(p.x - curX);
        const yDist = Math.abs(p.y - curY);

        // A. TRAP SYSTEM: Cryo-Stasis Trap Floor
        if (h.type === 'trap_floor') {
          if (xDist < hw && yDist < hh + 10) {
            if (!isTrapped && p.invincibleTimer <= 0) {
              triggerTrap();
            }
          }
        }

        // B. Checkpoint
        if (h.type === 'checkpoint') {
          if (xDist < 25 && yDist < 25) {
            if (!checkpointReached) {
              setCheckpointReached(true);
              p.lastCheckpoint = { x: curX, y: curY };
              setShowCheckpointAlert(true);
              sound.playCheckpoint();
              setScore(s => s + 500);
              setTimeout(() => setShowCheckpointAlert(false), 2500);
            }
          }
        }

        // C. Target Gem (Heist Mode)
        const activeGemPos = slab.gemPos || { x: 480, y: 160 };
        if (gameMode === 'heist_vault' && !hasGem) {
          const gDist = Math.hypot(p.x - activeGemPos.x, p.y - activeGemPos.y);
          if (gDist < 28) {
            setHasGem(true);
            sound.playGemSteal();
            setScore(s => s + 2000);
            setCombo(c => {
              const nc = c + 2;
              setMaxCombo(mc => Math.max(mc, nc));
              return nc;
            });
          }
        }

        // D. Platform Collision (Mutant Lab)
        if (
          gameMode === 'mutant_lab' &&
          (h.type === 'moving_platform' || h.type === 'falling_platform')
        ) {
          if (
            p.x > curX - hw &&
            p.x < curX + hw &&
            p.y + p.height >= curY - hh &&
            p.y + p.height <= curY + hh + 8 &&
            p.vy >= 0
          ) {
            p.y = curY - hh - p.height;
            p.vy = 0;
            p.isGrounded = true;
          }
        }

        // E. Lethal Hazards: Spikes, Centrifuge Blade, Laser, Mutant, Guard Vision
        if (p.invincibleTimer <= 0 && !isTrapped) {
          if (h.type === 'spikes' && xDist < hw - 4 && yDist < hh) {
            takeHit();
          } else if (h.type === 'rotating_obstacle' && Math.hypot(xDist, yDist) < 32) {
            takeHit();
          } else if (
            (h.type === 'laser_barrier' || h.type === 'security_laser') &&
            xDist < 12 &&
            yDist < hh
          ) {
            const isLaserActive = Math.sin(tick * h.speed * 2) >= -0.3;
            if (isLaserActive) {
              takeHit();
            }
          } else if (h.type === 'mutant_creature' && xDist < 24 && yDist < 20) {
            takeHit();
          } else if (h.type === 'patrol_guard') {
            // Guard Vision Beam Check
            const beamDist = Math.hypot(p.x - curX, p.y - curY);
            if (beamDist < 70) {
              metricsRef.current.guardDetections += 1;
              takeHit();
            }
          } else if (h.type === 'security_camera') {
            // Camera Vision Cone Check
            const camDist = Math.hypot(p.x - curX, p.y - curY);
            if (camDist < 75) {
              metricsRef.current.guardDetections += 1;
              takeHit();
            }
          }
        }
      });

      // 3. EXIT ZONE REACHED
      const exitDist = Math.hypot(p.x - slab.exitPos.x, p.y - slab.exitPos.y);
      if (exitDist < 35) {
        if (gameMode === 'heist_vault') {
          // Heist requires stealing the gem first!
          if (hasGem) {
            completeRun(true);
            return;
          }
        } else {
          completeRun(true);
          return;
        }
      }

      // 4. RENDERING CANVAS
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background
      ctx.fillStyle = gameMode === 'mutant_lab' ? '#090d16' : '#0a0d14';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Architecture Ground
      if (gameMode === 'mutant_lab') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 410, CANVAS_WIDTH, 50);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, 410, CANVAS_WIDTH, 3);
        // Toxic basin
        ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
        ctx.fillRect(280, 425, 360, 35);
      } else {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
      }

      // START & EXIT GATES
      drawGate(ctx, slab.startPos.x, slab.startPos.y, 'START', '#10b981');
      drawGate(ctx, slab.exitPos.x, slab.exitPos.y, 'EXIT', '#06b6d4');

      // TARGET GEM (Heist)
      if (gameMode === 'heist_vault' && !hasGem) {
        const gemP = slab.gemPos || { x: 480, y: 160 };
        ctx.save();
        ctx.translate(gemP.x, gemP.y);
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(10, -3);
        ctx.lineTo(0, 7);
        ctx.lineTo(-10, -3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // HURDLES RENDER
      slab.hurdles.forEach(h => {
        ctx.save();
        let curX = h.x;
        let curY = h.y;
        if (h.type === 'moving_platform') {
          curX += Math.sin(tick * h.speed) * 70;
        } else if (h.type === 'patrol_guard') {
          curX += Math.sin(tick * h.speed) * 80;
        } else if (h.type === 'mutant_creature') {
          curX += Math.sin(tick * h.speed) * 60;
        }

        ctx.translate(curX, curY);
        ctx.rotate((h.rotation * Math.PI) / 180);

        renderHurdleInGame(ctx, h, tick);
        ctx.restore();
      });

      // CURIOSITY SYSTEM: Fog of War Darkness Mask (Reveals dynamically as runner explores!)
      ctx.fillStyle = 'rgba(3, 7, 18, 0.92)';
      if (p.discoveredX < CANVAS_WIDTH) {
        ctx.fillRect(p.discoveredX, 0, CANVAS_WIDTH - p.discoveredX, CANVAS_HEIGHT);
        // Gradient edge
        const grad = ctx.createLinearGradient(p.discoveredX - 70, 0, p.discoveredX, 0);
        grad.addColorStop(0, 'rgba(3, 7, 18, 0)');
        grad.addColorStop(1, 'rgba(3, 7, 18, 0.92)');
        ctx.fillStyle = grad;
        ctx.fillRect(p.discoveredX - 70, 0, 70, CANVAS_HEIGHT);
      }

      // RUNNER PLAYER AVATAR
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.invincibleTimer % 4 < 2) {
        // Player Body
        ctx.fillStyle = runner.color;
        ctx.shadowColor = runner.borderCol;
        ctx.shadowBlur = 12;
        if (gameMode === 'mutant_lab') {
          ctx.beginPath();
          ctx.roundRect(-10, -2, 20, 32, 6);
          ctx.fill();
          // Runner visor
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-4, 4, 8, 4);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          // Flashlight/Sneak indicator
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-2, -8, 4, 4);
        }
      }
      ctx.restore();

      // TRAP VISUAL PRISON (If trapped)
      if (isTrapped) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 15;
        ctx.strokeRect(p.x - 22, p.y - 10, 44, 48);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.fillRect(p.x - 22, p.y - 10, 44, 48);
        ctx.restore();
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    isTrapped,
    gameMode,
    slab.hurdles,
    slab.startPos,
    slab.exitPos,
    slab.gemPos,
    checkpointReached,
    hasGem,
    runner.color,
    runner.borderCol,
    completeRun,
  ]);

  // Trap Activation Trigger
  const triggerTrap = () => {
    setIsTrapped(true);
    setTrapSecondsLeft(4); // 4-second stasis
    metricsRef.current.trapsTriggered += 1;
    setCombo(1); // breaks combo
    sound.playTrapAlert();
  };

  // Damage / Hit Trigger
  const takeHit = () => {
    metricsRef.current.damageTaken += 1;
    sound.playDamage();
    setCombo(1); // breaks combo

    setLives(l => {
      const nextLives = l - 1;
      if (nextLives <= 0) {
        completeRun(false);
        return 0;
      }
      // Respawn at last checkpoint
      playerRef.current.x = playerRef.current.lastCheckpoint.x;
      playerRef.current.y = playerRef.current.lastCheckpoint.y;
      playerRef.current.vx = 0;
      playerRef.current.vy = 0;
      playerRef.current.invincibleTimer = 45; // ~1.5s invincibility frames
      return nextLives;
    });
  };

  const drawGate = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    color: string
  ) => {
    ctx.fillStyle = `${color}25`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 25, y - 35, 50, 70, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 11px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 42);
  };

  const renderHurdleInGame = (
    ctx: CanvasRenderingContext2D,
    h: HurdleInstance,
    tick: number
  ) => {
    const hw = h.width / 2;
    const hh = h.height / 2;

    switch (h.type) {
      case 'moving_platform':
      case 'falling_platform':
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.fillRect(-hw, -hh, h.width, h.height);
        ctx.strokeRect(-hw, -hh, h.width, h.height);
        break;
      case 'spikes':
        ctx.fillStyle = '#e11d48';
        const teeth = 5;
        const toothW = h.width / teeth;
        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
          const sx = -hw + i * toothW;
          ctx.moveTo(sx, hh);
          ctx.lineTo(sx + toothW / 2, -hh);
          ctx.lineTo(sx + toothW, hh);
        }
        ctx.closePath();
        ctx.fill();
        break;
      case 'laser_barrier':
      case 'security_laser':
        const isOff = Math.sin(tick * h.speed * 2) < -0.3;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-hw, -hh, h.width, 10);
        ctx.fillRect(-hw, hh - 10, h.width, 10);
        if (!isOff) {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, -hh + 10);
          ctx.lineTo(0, hh - 10);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
        break;
      case 'patrol_guard':
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 75, -0.35, 0.35);
        ctx.closePath();
        ctx.fill();
        break;
      case 'security_camera':
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        const sweepAngle = Math.sin(tick * h.speed) * 0.5;
        ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 80, sweepAngle - 0.4, sweepAngle + 0.4);
        ctx.closePath();
        ctx.fill();
        break;
      case 'trap_floor':
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.fillRect(-hw, -hh, h.width, h.height);
        ctx.strokeRect(-hw, -hh, h.width, h.height);
        break;
      case 'checkpoint':
        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      default:
        ctx.fillStyle = '#334155';
        ctx.fillRect(-hw, -hh, h.width, h.height);
    }
  };

  // Virtual Controls for Mobile/Touch
  const triggerVirtualKey = (key: string, active: boolean) => {
    keysRef.current[key.toLowerCase()] = active;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3">
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm"
            style={{ backgroundColor: runner.accentBg, color: runner.borderCol, border: `1.5px solid ${runner.borderCol}` }}
          >
            {runner.id.toUpperCase()}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              RUN MODE · CHALLENGING {creator.name.toUpperCase()}
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{runner.name}</span>
              {gameMode === 'heist_vault' && (
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  hasGem
                    ? 'bg-amber-950 text-amber-300 border-amber-600 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {hasGem ? '💎 GEM SECURED! ESCAPE TO EXIT' : 'OBJECTIVE: STEAL THE GEM'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meters */}
        <div className="flex items-center gap-6">
          {/* Combo Multiplier */}
          <div className="text-center hidden sm:block">
            <div className="text-[10px] font-mono text-slate-400">COMBO</div>
            <div className={`text-base font-bold font-mono ${combo > 1 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
              x{combo}
            </div>
          </div>

          {/* Lives Counter */}
          <div className="text-center">
            <div className="text-[10px] font-mono text-slate-400">LIVES</div>
            <div className="flex items-center gap-1 text-rose-500 mt-0.5">
              {[...Array(3)].map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-700'}`}
                />
              ))}
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400">TIME</div>
            <div className={`text-xl font-bold font-mono ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
              {timeLeft}s
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-auto block select-none"
        />

        {/* TRAP SYSTEM DRAMATIC OVERLAY */}
        {isTrapped && (
          <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
            <div className="p-6 rounded-2xl bg-slate-950/90 border border-rose-500/80 shadow-2xl text-center space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold flex items-center justify-center gap-1.5 animate-bounce">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                TRAP ACTIVATED!
              </div>
              <h3 className="text-3xl font-extrabold text-white tracking-wider">
                CRYO-STASIS LOCKDOWN
              </h3>
              <p className="text-xs text-rose-300">
                Immobilized! Stasis dissipates in:
              </p>
              <div className="text-5xl font-black font-mono text-rose-400 pt-1">
                {trapSecondsLeft}...
              </div>
            </div>
          </div>
        )}

        {/* Checkpoint Feedback Alert */}
        {showCheckpointAlert && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top">
            <Flag className="w-4 h-4 text-emerald-400" />
            CHECKPOINT REACHED! PROGRESS SAVED
          </div>
        )}
      </div>

      {/* On-Screen Touch Controls (Mobile Friendly) */}
      <div className="flex sm:hidden items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => triggerVirtualKey('a', true)}
            onMouseUp={() => triggerVirtualKey('a', false)}
            onTouchStart={() => triggerVirtualKey('a', true)}
            onTouchEnd={() => triggerVirtualKey('a', false)}
            className="w-12 h-12 rounded-xl bg-slate-800 text-white font-bold active:bg-cyan-500 transition-colors flex items-center justify-center"
          >
            ←
          </button>
          <button
            onMouseDown={() => triggerVirtualKey('d', true)}
            onMouseUp={() => triggerVirtualKey('d', false)}
            onTouchStart={() => triggerVirtualKey('d', true)}
            onTouchEnd={() => triggerVirtualKey('d', false)}
            className="w-12 h-12 rounded-xl bg-slate-800 text-white font-bold active:bg-cyan-500 transition-colors flex items-center justify-center"
          >
            →
          </button>
        </div>

        <button
          onMouseDown={() => triggerVirtualKey(' ', true)}
          onMouseUp={() => triggerVirtualKey(' ', false)}
          onTouchStart={() => triggerVirtualKey(' ', true)}
          onTouchEnd={() => triggerVirtualKey(' ', false)}
          className="px-6 h-12 rounded-xl bg-cyan-500 text-slate-950 font-bold active:bg-cyan-400 transition-colors flex items-center justify-center"
        >
          {gameMode === 'mutant_lab' ? 'JUMP' : 'ACTION'}
        </button>
      </div>

      {/* Controls Hint */}
      <div className="text-center text-xs text-slate-500 hidden sm:block">
        {gameMode === 'mutant_lab'
          ? 'Use A/D or Arrow Keys to run · W / Space to Jump · Dodge spikes & timed hazards'
          : 'Use WASD / Arrow Keys to move · Hold Shift to Sneak · Steal Gem and reach EXIT'}
      </div>
    </div>
  );
};
