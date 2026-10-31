import React, { useState, useRef, useEffect } from 'react';
import { PlayerConfig, SlabData, HurdleDefinition, HurdleInstance, GameMode } from '../types/game';
import { getHurdlesForGame, calculateDifficultyRating } from '../utils/hurdleCatalog';
import { sound } from '../utils/audio';
import {
  Wrench,
  Check,
  RotateCw,
  Gauge,
  Eye,
  EyeOff,
  Zap,
  Trash2,
  Undo2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Gem
} from 'lucide-react';

interface BuilderCanvasProps {
  slab: SlabData;
  creator: PlayerConfig;
  runner: PlayerConfig;
  gameMode: GameMode;
  onConfirmSlab: (updatedSlab: SlabData) => void;
}

export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  slab,
  creator,
  runner,
  gameMode,
  onConfirmSlab,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Placed hurdles on this slab
  const [hurdles, setHurdles] = useState<HurdleInstance[]>(slab.hurdles || []);
  const [budgetRemaining, setBudgetRemaining] = useState<number>(slab.budgetRemaining);

  // Placement Workflow State:
  // Step 1: Browsing Catalog (selectedHurdleDef === null)
  // Step 2 & 3: Selected Hurdle, positioning / previewing on canvas
  const [selectedHurdleDef, setSelectedHurdleDef] = useState<HurdleDefinition | null>(null);

  // Preview placement parameters
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number }>({ x: 300, y: 250 });
  const [previewRotation, setPreviewRotation] = useState<number>(0);
  const [previewSpeed, setPreviewSpeed] = useState<number>(1.2);
  const [previewTiming, setPreviewTiming] = useState<number>(2.0);
  const [previewIsHidden, setPreviewIsHidden] = useState<boolean>(false);
  const [previewIsShortcut, setPreviewIsShortcut] = useState<boolean>(false);

  // Gem location for Heist (Designer can reposition it!)
  const [gemPos, setGemPos] = useState<{ x: number; y: number }>(
    slab.gemPos || { x: 480, y: 160 }
  );

  const [isDraggingPreview, setIsDraggingPreview] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const catalog = getHurdlesForGame(gameMode);
  const difficultyRating = calculateDifficultyRating(hurdles);

  // Sync canvas dimensions
  const CANVAS_WIDTH = 920;
  const CANVAS_HEIGHT = 460;

  // Render canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Background Grid & Architecture
      ctx.fillStyle = gameMode === 'mutant_lab' ? '#090d16' : '#0a0d14';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid lines
      ctx.strokeStyle = gameMode === 'mutant_lab' ? 'rgba(6, 182, 212, 0.07)' : 'rgba(245, 158, 11, 0.07)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // 2. Base Ground / Ceiling Slabs for Mutant Lab
      if (gameMode === 'mutant_lab') {
        // Main bottom runway
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 410, CANVAS_WIDTH, 50);

        // Tech floor highlight
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, 410, CANVAS_WIDTH, 3);

        // Toxic Acid Pit in center floor
        ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
        ctx.fillRect(280, 425, 360, 35);
        ctx.fillStyle = '#10b981';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('⚠ BIO-TOXIC HAZARD BASIN', 380, 445);
      } else {
        // Heist Vault Boundary Perimeter
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);

        // High security vault zones
        ctx.fillStyle = 'rgba(245, 158, 11, 0.03)';
        ctx.fillRect(360, 40, 240, 380);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(360, 40, 240, 380);
        ctx.setLineDash([]);
      }

      // 3. START Zone
      const startX = slab.startPos.x;
      const startY = slab.startPos.y;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(startX - 25, startY - 35, 50, 70, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('START', startX, startY - 42);

      // 4. EXIT Zone
      const exitX = slab.exitPos.x;
      const exitY = slab.exitPos.y;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(exitX - 25, exitY - 35, 50, 70, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', exitX, exitY - 42);

      // 5. Gem Pedestal in Heist Mode
      if (gameMode === 'heist_vault') {
        ctx.save();
        ctx.translate(gemPos.x, gemPos.y);
        // Pedestal base
        ctx.fillStyle = '#475569';
        ctx.fillRect(-18, 10, 36, 14);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-14, 0, 28, 10);
        // Glowing Gem
        const pulse = Math.sin(time * 3) * 3;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15 + pulse;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(12, -4);
        ctx.lineTo(0, 8);
        ctx.lineTo(-12, -4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('TARGET GEM', gemPos.x, gemPos.y - 22);
      }

      // 6. Draw Already Placed Hurdles
      hurdles.forEach((h, index) => {
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate((h.rotation * Math.PI) / 180);

        drawHurdleVisual(ctx, h, time, false);

        ctx.restore();

        // Index / cost badge
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`#${index + 1} (${h.cost}pt)`, h.x, h.y - h.height / 2 - 6);

        if (h.isShortcut) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('⚡ SHORTCUT', h.x, h.y + h.height / 2 + 12);
        }
      });

      // 7. Draw Live Ghost Placement Preview (if active)
      if (selectedHurdleDef) {
        ctx.save();
        ctx.translate(previewPos.x, previewPos.y);
        ctx.rotate((previewRotation * Math.PI) / 180);

        // Bounding highlight box
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          -selectedHurdleDef.width / 2 - 4,
          -selectedHurdleDef.height / 2 - 4,
          selectedHurdleDef.width + 8,
          selectedHurdleDef.height + 8
        );
        ctx.setLineDash([]);

        // Render preview instance
        const previewInstance: HurdleInstance = {
          id: 'preview',
          type: selectedHurdleDef.type,
          x: previewPos.x,
          y: previewPos.y,
          width: selectedHurdleDef.width,
          height: selectedHurdleDef.height,
          rotation: previewRotation,
          speed: previewSpeed,
          timing: previewTiming,
          range: 80,
          isTrap: selectedHurdleDef.type === 'trap_floor',
          isHidden: previewIsHidden,
          isShortcut: previewIsShortcut,
          cost: selectedHurdleDef.cost,
          difficultyWeight: selectedHurdleDef.difficultyWeight,
        };

        drawHurdleVisual(ctx, previewInstance, time, true);
        ctx.restore();

        // Movement / Drag guide
        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('DRAG TO POSITION', previewPos.x, previewPos.y - selectedHurdleDef.height / 2 - 14);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    hurdles,
    selectedHurdleDef,
    previewPos,
    previewRotation,
    previewSpeed,
    previewTiming,
    previewIsHidden,
    previewIsShortcut,
    gemPos,
    gameMode,
    slab.startPos,
    slab.exitPos,
  ]);

  // Helper visual renderer
  const drawHurdleVisual = (
    ctx: CanvasRenderingContext2D,
    h: HurdleInstance,
    time: number,
    isPreview: boolean
  ) => {
    const alpha = isPreview ? 0.75 : 1.0;
    ctx.globalAlpha = alpha;

    const hw = h.width / 2;
    const hh = h.height / 2;

    switch (h.type) {
      case 'moving_platform':
      case 'disappearing_platform':
      case 'fake_platform': {
        const isFlicker = h.type === 'fake_platform' && Math.sin(time * 12) > 0.85;
        ctx.fillStyle = isFlicker ? 'rgba(56, 189, 248, 0.4)' : '#334155';
        ctx.strokeStyle = h.type === 'fake_platform' ? '#38bdf8' : '#0284c7';
        ctx.lineWidth = 2;
        ctx.fillRect(-hw, -hh, h.width, h.height);
        ctx.strokeRect(-hw, -hh, h.width, h.height);
        // Track motion arrows
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-8, -2, 16, 4);
        break;
      }
      case 'falling_platform': {
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-hw, -hh, h.width, h.height);
        ctx.strokeRect(-hw, -hh, h.width, h.height);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-10, -2, 20, 3);
        break;
      }
      case 'spikes': {
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
      }
      case 'laser_barrier':
      case 'security_laser': {
        const isOff = !isPreview && Math.sin(time * h.speed * 2) < -0.3;
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
      }
      case 'security_camera': {
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Vision Cone sweeping
        const sweepAngle = Math.sin(time * h.speed) * 0.5;
        ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 80, sweepAngle - 0.4, sweepAngle + 0.4);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'patrol_guard': {
        // Guard body
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Flashlight Cone
        const patrolOffset = Math.sin(time * h.speed) * 30;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 75, -0.35, 0.35);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'trap_floor': {
        // TRAP SYSTEM: Cryo-Stasis
        ctx.fillStyle = h.isHidden ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.25)';
        ctx.strokeStyle = h.isHidden ? '#38bdf8' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.fillRect(-hw, -hh, h.width, h.height);
        ctx.strokeRect(-hw, -hh, h.width, h.height);
        // Warning Icon
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('CRYO-TRAP', 0, 3);
        break;
      }
      case 'rotating_obstacle': {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 4;
        const bladeAngle = time * h.speed * 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(bladeAngle) * 36, Math.sin(bladeAngle) * 36);
        ctx.lineTo(-Math.cos(bladeAngle) * 36, -Math.sin(bladeAngle) * 36);
        ctx.stroke();
        break;
      }
      case 'mutant_creature': {
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-8, -4, 4, 4);
        ctx.fillRect(4, -4, 4, 4);
        break;
      }
      case 'crusher': {
        ctx.fillStyle = '#475569';
        ctx.fillRect(-hw, -hh, h.width, 20);
        // Piston rod
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-6, -hh + 20, 12, h.height - 20);
        // Stomp plate
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-hw, hh - 12, h.width, 12);
        break;
      }
      case 'checkpoint': {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('CP', 0, 4);
        break;
      }
      default: {
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-hw, -hh, h.width, h.height);
        ctx.strokeRect(-hw, -hh, h.width, h.height);
      }
    }

    ctx.globalAlpha = 1.0;
  };

  // Canvas Mouse Interactions for Drag & Positioning
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (selectedHurdleDef) {
      // Check if clicked near preview
      const dist = Math.hypot(mouseX - previewPos.x, mouseY - previewPos.y);
      if (dist < 50 || true) {
        setIsDraggingPreview(true);
        setDragOffset({ x: mouseX - previewPos.x, y: mouseY - previewPos.y });
        setPreviewPos({ x: mouseX, y: mouseY });
      }
    } else if (gameMode === 'heist_vault') {
      // Allow dragging gem pedestal
      const gemDist = Math.hypot(mouseX - gemPos.x, mouseY - gemPos.y);
      if (gemDist < 30) {
        setIsDraggingPreview(true);
        setDragOffset({ x: mouseX - gemPos.x, y: mouseY - gemPos.y });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingPreview) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = Math.max(30, Math.min(CANVAS_WIDTH - 30, e.clientX - rect.left));
    const mouseY = Math.max(30, Math.min(CANVAS_HEIGHT - 30, e.clientY - rect.top));

    if (selectedHurdleDef) {
      setPreviewPos({ x: Math.round(mouseX / 10) * 10, y: Math.round(mouseY / 10) * 10 });
    } else if (gameMode === 'heist_vault') {
      setGemPos({ x: Math.round(mouseX / 10) * 10, y: Math.round(mouseY / 10) * 10 });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingPreview(false);
  };

  // STEP 2: Select Hurdle from Catalog
  const handleSelectHurdle = (h: HurdleDefinition) => {
    if (budgetRemaining < h.cost) return;

    setSelectedHurdleDef(h);
    // Sensible initial placement
    const count = hurdles.length;
    const xPos = 200 + (count % 4) * 140;
    const yPos = gameMode === 'mutant_lab' ? 320 - (count % 3) * 60 : 200 + (count % 3) * 60;

    setPreviewPos({ x: xPos, y: yPos });
    setPreviewRotation(0);
    setPreviewSpeed(1.2);
    setPreviewTiming(2.0);
    setPreviewIsHidden(false);
    setPreviewIsShortcut(false);

    sound.playConfirm();
  };

  // STEP 4: Confirm Placement
  const handleConfirmPlacement = () => {
    if (!selectedHurdleDef) return;

    const newHurdle: HurdleInstance = {
      id: `hurdle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: selectedHurdleDef.type,
      x: previewPos.x,
      y: previewPos.y,
      width: selectedHurdleDef.width,
      height: selectedHurdleDef.height,
      rotation: previewRotation,
      speed: previewSpeed,
      timing: previewTiming,
      range: 80,
      isTrap: selectedHurdleDef.type === 'trap_floor',
      isHidden: previewIsHidden,
      isShortcut: previewIsShortcut,
      cost: selectedHurdleDef.cost,
      difficultyWeight: selectedHurdleDef.difficultyWeight,
    };

    setHurdles(prev => [...prev, newHurdle]);
    setBudgetRemaining(prev => Math.max(0, prev - selectedHurdleDef.cost));
    setSelectedHurdleDef(null);

    sound.playConfirm();
  };

  // Cancel preview
  const handleCancelPlacement = () => {
    setSelectedHurdleDef(null);
  };

  // Undo last placed hurdle
  const handleUndo = () => {
    if (hurdles.length === 0) return;
    const last = hurdles[hurdles.length - 1];
    setHurdles(prev => prev.slice(0, -1));
    setBudgetRemaining(prev => Math.min(slab.totalBudget, prev + last.cost));
    sound.playLand();
  };

  // Clear all
  const handleClear = () => {
    setHurdles([]);
    setBudgetRemaining(slab.totalBudget);
    setSelectedHurdleDef(null);
  };

  // Finalize Slab Handover
  const handleFinalizeSlab = () => {
    const updatedSlab: SlabData = {
      ...slab,
      hurdles,
      budgetRemaining,
      difficultyRating,
      gemPos: gameMode === 'heist_vault' ? gemPos : undefined,
    };
    onConfirmSlab(updatedSlab);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Slab Header: Clearly displays whose slab is being designed */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm shadow-md"
            style={{ backgroundColor: creator.accentBg, color: creator.borderCol, border: `1.5px solid ${creator.borderCol}` }}
          >
            {creator.id.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                BUILD MODE · {gameMode === 'mutant_lab' ? 'MUTANT LAB' : 'HEIST VAULT'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                {creator.name}&apos;s Slab
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Design Gauntlet for <span style={{ color: runner.borderCol }}>{runner.name}</span>
            </h2>
          </div>
        </div>

        {/* Difficulty Budget & Gauge */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-xs text-slate-400">Difficulty Budget</div>
            <div className="text-lg font-bold font-mono text-cyan-400">
              {budgetRemaining} <span className="text-slate-500 font-normal">/ {slab.totalBudget} pts</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800"></div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Challenge Rating</div>
            <div className="text-lg font-bold font-mono text-amber-400 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-400" />
              {difficultyRating}% {difficultyRating === 100 ? 'Extreme' : difficultyRating >= 75 ? 'Hard' : difficultyRating >= 50 ? 'Medium' : 'Easy'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Canvas */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              className="w-full h-auto cursor-crosshair block select-none"
            />

            {/* Instruction Overlay on Canvas */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300 pointer-events-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              {selectedHurdleDef
                ? `STEP 3: Drag & Adjust [${selectedHurdleDef.name}], then Confirm below.`
                : 'STEP 1: Select a hurdle from the catalog to place.'}
            </div>

            {gameMode === 'heist_vault' && (
              <div className="absolute top-3 right-3 bg-amber-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-amber-800/60 text-[11px] text-amber-300 flex items-center gap-1.5">
                <Gem className="w-3.5 h-3.5 text-amber-400" />
                Target Gem Draggable
              </div>
            )}
          </div>

          {/* Canvas Actions Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={hurdles.length === 0}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo Last
              </button>
              <button
                onClick={handleClear}
                disabled={hurdles.length === 0}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-300 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Slab
              </button>
              <span className="text-slate-500 font-mono pl-2">
                Placed: {hurdles.length} Hurdles
              </span>
            </div>

            <button
              onClick={handleFinalizeSlab}
              disabled={hurdles.length < 2 || !!selectedHurdleDef}
              className="px-4 py-2 rounded-lg font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Finish Slab & Handover</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Hurdle Catalog & Adjustment Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* STEP 3: Active Hurdle Adjustment & Confirmation Panel */}
          {selectedHurdleDef ? (
            <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-800/80 text-slate-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-cyan-800/60 pb-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                    STEP 3 · ADJUST HURDLE
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {selectedHurdleDef.name}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded font-mono text-xs font-bold bg-cyan-900 text-cyan-200 border border-cyan-700">
                  {selectedHurdleDef.cost} pts
                </span>
              </div>

              <p className="text-xs text-slate-300">
                {selectedHurdleDef.description}
              </p>

              {/* Controls */}
              <div className="space-y-3 pt-1">
                {selectedHurdleDef.canRotate && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Orientation</span>
                    <button
                      onClick={() => setPreviewRotation(r => (r + 90) % 360)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 flex items-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotate ({previewRotation}°)
                    </button>
                  </div>
                )}

                {selectedHurdleDef.canAdjustSpeed && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Speed / Velocity</span>
                      <span className="font-mono text-cyan-400">{previewSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="2.2"
                      step="0.2"
                      value={previewSpeed}
                      onChange={e => setPreviewSpeed(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}

                {/* Secret Disguise / Trap Toggle */}
                {selectedHurdleDef.canHide && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Disguised / Secret</span>
                    <button
                      onClick={() => setPreviewIsHidden(h => !h)}
                      className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                        previewIsHidden
                          ? 'bg-amber-950 border-amber-700 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {previewIsHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {previewIsHidden ? 'Hidden Clue' : 'Visible'}
                    </button>
                  </div>
                )}

                {/* Shortcut Route Toggle */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Route Type</span>
                  <button
                    onClick={() => setPreviewIsShortcut(s => !s)}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                      previewIsShortcut
                        ? 'bg-sky-950 border-sky-700 text-sky-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {previewIsShortcut ? 'Risky Shortcut' : 'Standard Path'}
                  </button>
                </div>
              </div>

              {/* STEP 4: Confirm Placement Button */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={handleConfirmPlacement}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <Check className="w-4 h-4" />
                  Confirm Hurdle Placement
                </button>
                <button
                  onClick={handleCancelPlacement}
                  className="py-2.5 px-3 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* STEP 1: Hurdle Catalog Grid */
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[460px]">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    STEP 1 · SELECT HURDLE
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Obstacle Catalog
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {catalog.length} Available
                </span>
              </div>

              <div className="overflow-y-auto pr-1 space-y-2 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
                {catalog.map(item => {
                  const affordable = budgetRemaining >= item.cost;
                  const isTrap = item.type === 'trap_floor';

                  return (
                    <button
                      key={item.type}
                      onClick={() => handleSelectHurdle(item)}
                      disabled={!affordable}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                        affordable
                          ? isTrap
                            ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-600 hover:bg-rose-950/40 text-slate-200'
                            : 'bg-slate-950/60 border-slate-800 hover:border-cyan-500 hover:bg-slate-900 text-slate-200'
                          : 'opacity-40 border-slate-900 bg-slate-950/30 cursor-not-allowed text-slate-500'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-white">
                            {item.name}
                          </span>
                          {isTrap && (
                            <span className="text-[9px] font-mono text-rose-400 bg-rose-950/80 px-1 rounded">
                              TRAP
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {item.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {item.cost} pt
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
