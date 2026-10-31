export type GameMode = 'mutant_lab' | 'heist_vault';

export type PlayerId = 'p1' | 'p2' | 'p3' | 'p4';

export interface PlayerConfig {
  id: PlayerId;
  name: string;
  avatar: string;
  color: string;
  accentBg: string;
  borderCol: string;
  isBot: boolean;
  botPersonality?: 'balanced' | 'trap_master' | 'speed_demon' | 'fortress';
}

export type HurdleCategory = 'hazard' | 'platform' | 'movement' | 'trap' | 'security' | 'passage';

export type HurdleType =
  // Mutant Lab
  | 'moving_platform'
  | 'spikes'
  | 'falling_platform'
  | 'rotating_obstacle'
  | 'laser_barrier'
  | 'gap'
  | 'moving_wall'
  | 'mutant_creature'
  | 'crusher'
  | 'push_mechanism'
  | 'low_gravity_section'
  | 'high_speed_section'
  | 'disappearing_platform'
  | 'fake_platform'
  | 'narrow_passage'
  // Heist
  | 'vault_door'
  | 'security_laser'
  | 'security_camera'
  | 'patrol_guard'
  | 'locked_door'
  | 'alarm_zone'
  | 'hidden_passage'
  | 'pressure_plate'
  | 'timed_door'
  | 'gem_pedestal'
  | 'fake_passage'
  // Universal
  | 'trap_floor'
  | 'checkpoint';

export interface HurdleDefinition {
  type: HurdleType;
  name: string;
  category: HurdleCategory;
  cost: number;
  description: string;
  width: number;
  height: number;
  game: 'mutant_lab' | 'heist_vault' | 'both';
  difficultyWeight: number;
  canRotate?: boolean;
  canAdjustSpeed?: boolean;
  canHide?: boolean;
}

export interface HurdleInstance {
  id: string;
  type: HurdleType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  speed: number;    // speed multiplier 0.8 - 2.0
  timing: number;   // phase/cycle in seconds
  range: number;    // patrol or movement range
  isTrap: boolean;
  isHidden: boolean;
  isShortcut: boolean;
  cost: number;
  difficultyWeight: number;
  extraMeta?: Record<string, unknown>;
}

export interface SlabData {
  id: string;
  creatorId: PlayerId;
  runnerId: PlayerId;
  gameMode: GameMode;
  hurdles: HurdleInstance[];
  budgetRemaining: number;
  totalBudget: number;
  difficultyRating: number; // 25, 50, 75, 100
  startPos: { x: number; y: number };
  exitPos: { x: number; y: number };
  gemPos?: { x: number; y: number };
  checkpoints: { x: number; y: number }[];
  runResult?: SlabRunResult;
}

export interface SlabRunResult {
  won: boolean;
  completionTime: number;
  livesRemaining: number;
  trapsTriggered: number;
  obstaclesAvoided: number;
  damageTaken: number;
  guardDetections: number;
  comboMax: number;
  gemCollected?: boolean;
  runnerScore: number;
  designerScore: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  levelTier: number; // 1 to 5
  xp: number;
  matchesPlayed: number;
  runsCompleted: number;
  trapsMastered: number;
  stealthWins: number;
  designerRating: number;
  unlockedBadges: string[];
}

export interface LevelTierInfo {
  tier: number;
  name: string;
  description: string;
  requiredXp: number;
  budgetAllowance: number;
  unlockedHurdlesCount: number;
  maxDifficultyAllowed: number;
  features: string[];
}
