import { PlayerConfig, SlabData, GameMode, HurdleInstance } from '../types/game';
import { HURDLE_CATALOG, calculateDifficultyRating } from './hurdleCatalog';

export const INITIAL_PLAYERS: PlayerConfig[] = [
  {
    id: 'p1',
    name: 'Cipher (P1)',
    avatar: 'cyber_runner',
    color: '#06b6d4', // cyan-500
    accentBg: 'rgba(6, 182, 212, 0.15)',
    borderCol: '#22d3ee',
    isBot: false,
  },
  {
    id: 'p2',
    name: 'Valkyrie (P2)',
    avatar: 'mutant_subject',
    color: '#f43f5e', // rose-500
    accentBg: 'rgba(244, 63, 94, 0.15)',
    borderCol: '#fb7185',
    isBot: false,
    botPersonality: 'trap_master',
  },
  {
    id: 'p3',
    name: 'Specter (P3)',
    avatar: 'stealth_ghost',
    color: '#10b981', // emerald-500
    accentBg: 'rgba(16, 185, 129, 0.15)',
    borderCol: '#34d399',
    isBot: false,
    botPersonality: 'speed_demon',
  },
  {
    id: 'p4',
    name: 'Titan (P4)',
    avatar: 'vault_specialist',
    color: '#f59e0b', // amber-500
    accentBg: 'rgba(245, 158, 11, 0.15)',
    borderCol: '#fbbf24',
    isBot: false,
    botPersonality: 'fortress',
  },
];

export function createInitialSlabs(gameMode: GameMode, budgetLimit: number = 100): SlabData[] {
  // 4 slabs matching the exact circular loop:
  // P1 creates -> P2 plays
  // P2 creates -> P3 plays
  // P3 creates -> P4 plays
  // P4 creates -> P1 plays
  return [
    {
      id: 'slab_1',
      creatorId: 'p1',
      runnerId: 'p2',
      gameMode,
      hurdles: [],
      budgetRemaining: budgetLimit,
      totalBudget: budgetLimit,
      difficultyRating: 25,
      startPos: { x: 50, y: gameMode === 'mutant_lab' ? 380 : 250 },
      exitPos: { x: 860, y: gameMode === 'mutant_lab' ? 380 : 250 },
      gemPos: gameMode === 'heist_vault' ? { x: 450, y: 150 } : undefined,
      checkpoints: [{ x: 460, y: gameMode === 'mutant_lab' ? 380 : 250 }],
    },
    {
      id: 'slab_2',
      creatorId: 'p2',
      runnerId: 'p3',
      gameMode,
      hurdles: [],
      budgetRemaining: budgetLimit,
      totalBudget: budgetLimit,
      difficultyRating: 25,
      startPos: { x: 50, y: gameMode === 'mutant_lab' ? 380 : 250 },
      exitPos: { x: 860, y: gameMode === 'mutant_lab' ? 380 : 250 },
      gemPos: gameMode === 'heist_vault' ? { x: 450, y: 150 } : undefined,
      checkpoints: [{ x: 460, y: gameMode === 'mutant_lab' ? 380 : 250 }],
    },
    {
      id: 'slab_3',
      creatorId: 'p3',
      runnerId: 'p4',
      gameMode,
      hurdles: [],
      budgetRemaining: budgetLimit,
      totalBudget: budgetLimit,
      difficultyRating: 25,
      startPos: { x: 50, y: gameMode === 'mutant_lab' ? 380 : 250 },
      exitPos: { x: 860, y: gameMode === 'mutant_lab' ? 380 : 250 },
      gemPos: gameMode === 'heist_vault' ? { x: 450, y: 150 } : undefined,
      checkpoints: [{ x: 460, y: gameMode === 'mutant_lab' ? 380 : 250 }],
    },
    {
      id: 'slab_4',
      creatorId: 'p4',
      runnerId: 'p1',
      gameMode,
      hurdles: [],
      budgetRemaining: budgetLimit,
      totalBudget: budgetLimit,
      difficultyRating: 25,
      startPos: { x: 50, y: gameMode === 'mutant_lab' ? 380 : 250 },
      exitPos: { x: 860, y: gameMode === 'mutant_lab' ? 380 : 250 },
      gemPos: gameMode === 'heist_vault' ? { x: 450, y: 150 } : undefined,
      checkpoints: [{ x: 460, y: gameMode === 'mutant_lab' ? 380 : 250 }],
    },
  ];
}

/**
 * Intelligent Bot slab architect.
 * Constructs fair, chaseable, beatable challenges with proper spacing,
 * traps, shortcuts, and checkpoints according to personality and budget.
 */
export function generateBotSlab(
  creator: PlayerConfig,
  gameMode: GameMode,
  slab: SlabData
): SlabData {
  const catalog = HURDLE_CATALOG.filter(h => h.game === gameMode || h.game === 'both');
  const hurdles: HurdleInstance[] = [];
  let budget = slab.totalBudget;

  const personality = creator.botPersonality || 'balanced';

  if (gameMode === 'mutant_lab') {
    // 1. Moving Platform at mid-left
    const p1 = catalog.find(h => h.type === 'moving_platform')!;
    hurdles.push({
      id: `bot_h_${Date.now()}_1`,
      type: p1.type,
      x: 200,
      y: 340,
      width: p1.width,
      height: p1.height,
      rotation: 0,
      speed: personality === 'speed_demon' ? 1.6 : 1.2,
      timing: 2.0,
      range: 80,
      isTrap: false,
      isHidden: false,
      isShortcut: false,
      cost: p1.cost,
      difficultyWeight: p1.difficultyWeight,
    });
    budget -= p1.cost;

    // 2. Laser Barrier or Centrifuge at mid
    const laser = catalog.find(h => h.type === 'laser_barrier')!;
    hurdles.push({
      id: `bot_h_${Date.now()}_2`,
      type: laser.type,
      x: 340,
      y: 280,
      width: laser.width,
      height: laser.height,
      rotation: 0,
      speed: 1.0,
      timing: 2.5,
      range: 0,
      isTrap: false,
      isHidden: false,
      isShortcut: false,
      cost: laser.cost,
      difficultyWeight: laser.difficultyWeight,
    });
    budget -= laser.cost;

    // 3. Mandatory Cryo-Stasis TRAP FLOOR
    const trap = catalog.find(h => h.type === 'trap_floor')!;
    hurdles.push({
      id: `bot_h_${Date.now()}_3`,
      type: trap.type,
      x: 460,
      y: 390,
      width: trap.width,
      height: trap.height,
      rotation: 0,
      speed: 1.0,
      timing: 1.0,
      range: 0,
      isTrap: true,
      isHidden: true, // Sneaky disguise!
      isShortcut: true,
      cost: trap.cost,
      difficultyWeight: trap.difficultyWeight,
    });
    budget -= trap.cost;

    // 4. Checkpoint
    const cp = catalog.find(h => h.type === 'checkpoint')!;
    hurdles.push({
      id: `bot_h_${Date.now()}_4`,
      type: cp.type,
      x: 520,
      y: 360,
      width: cp.width,
      height: cp.height,
      rotation: 0,
      speed: 1.0,
      timing: 1.0,
      range: 0,
      isTrap: false,
      isHidden: false,
      isShortcut: false,
      cost: cp.cost,
      difficultyWeight: cp.difficultyWeight,
    });
    budget -= cp.cost;

    // 5. Mutant Creature or Crusher near the exit
    const mutant = catalog.find(h => h.type === 'mutant_creature')!;
    if (budget >= mutant.cost) {
      hurdles.push({
        id: `bot_h_${Date.now()}_5`,
        type: mutant.type,
        x: 680,
        y: 365,
        width: mutant.width,
        height: mutant.height,
        rotation: 0,
        speed: 1.3,
        timing: 2.0,
        range: 70,
        isTrap: false,
        isHidden: false,
        isShortcut: false,
        cost: mutant.cost,
        difficultyWeight: mutant.difficultyWeight,
      });
      budget -= mutant.cost;
    }
  } else {
    // --- HEIST VAULT ---
    // 1. Infrared Security Laser
    const laser = catalog.find(h => h.type === 'security_laser')!;
    hurdles.push({
      id: `bot_h_${Date.now()}_1`,
      type: laser.type,
      x: 220,
      y: 190,
      width: laser.width,
      height: laser.height,
      rotation: 0,
      speed: 1.2,
      timing: 2.0,
      range: 60,
      isTrap: false,
      isHidden: false,
      isShortcut: false,
      cost: laser.cost,
      difficultyWeight: laser.difficultyWeight,
    });
    budget -= laser.cost;

    // 2. Patrolling Vault Guard
    const guard = catalog.find(h => h.type === 'patrol_guard')!;
    hurdles.push({
      id: `bot_h_${Date.now()}_2`,
      type: guard.type,
      x: 390,
      y: 240,
      width: guard.width,
      height: guard.height,
      rotation: 0,
      speed: 1.1,
      timing: 2.5,
      range: 90,
      isTrap: false,
      isHidden: false,
      isShortcut: false,
      cost: guard.cost,
      difficultyWeight: guard.difficultyWeight,
    });
    budget -= guard.cost;

    // 3. Security Camera
    const camera = catalog.find(h => h.type === 'security_camera')!;
    hurdles.push({
      id: `bot_h_${Date.now()}_3`,
      type: camera.type,
      x: 580,
      y: 160,
      width: camera.width,
      height: camera.height,
      rotation: 90,
      speed: 1.0,
      timing: 3.0,
      range: 0,
      isTrap: false,
      isHidden: false,
      isShortcut: false,
      cost: camera.cost,
      difficultyWeight: camera.difficultyWeight,
    });
    budget -= camera.cost;

    // 4. Trap Floor
    const trap = catalog.find(h => h.type === 'trap_floor')!;
    hurdles.push({
      id: `bot_h_${Date.now()}_4`,
      type: trap.type,
      x: 480,
      y: 290,
      width: trap.width,
      height: trap.height,
      rotation: 0,
      speed: 1.0,
      timing: 1.0,
      range: 0,
      isTrap: true,
      isHidden: true,
      isShortcut: true,
      cost: trap.cost,
      difficultyWeight: trap.difficultyWeight,
    });
    budget -= trap.cost;

    // 5. Gem Pedestal placed strategically
    const gem = catalog.find(h => h.type === 'gem_pedestal')!;
    hurdles.push({
      id: `bot_h_${Date.now()}_5`,
      type: gem.type,
      x: 500,
      y: 140,
      width: gem.width,
      height: gem.height,
      rotation: 0,
      speed: 1.0,
      timing: 1.0,
      range: 0,
      isTrap: false,
      isHidden: false,
      isShortcut: false,
      cost: 0,
      difficultyWeight: gem.difficultyWeight,
    });
  }

  const diffRating = calculateDifficultyRating(hurdles);

  return {
    ...slab,
    hurdles,
    budgetRemaining: budget,
    difficultyRating: diffRating,
  };
}
