import { LevelTierInfo, UserProfile } from '../types/game';

export const LEVEL_TIERS: LevelTierInfo[] = [
  {
    tier: 1,
    name: 'Level 1: Training',
    description: 'Generous timers, foundational platforms and basic obstacles to master movement mechanics.',
    requiredXp: 0,
    budgetAllowance: 100,
    unlockedHurdlesCount: 6,
    maxDifficultyAllowed: 50,
    features: [
      '60s Run Timer',
      'Basic Platforms & Spikes',
      'Infrared Tripwires & Vault Bulkheads',
      'Standard Checkpoints'
    ]
  },
  {
    tier: 2,
    name: 'Level 2: Beginner',
    description: 'Introduction of the Cryo-Stasis Trap Floor and pan-tilt security cameras.',
    requiredXp: 200,
    budgetAllowance: 105,
    unlockedHurdlesCount: 9,
    maxDifficultyAllowed: 75,
    features: [
      '50s Run Timer',
      'Trap Floor activated (4s freeze)',
      'Security Cameras & Moving Walls',
      'Decoy Hologram Platforms'
    ]
  },
  {
    tier: 3,
    name: 'Level 3: Advanced',
    description: 'High-speed kinetic boosters, centifuge rotating blades, and patrolling vault sentries.',
    requiredXp: 500,
    budgetAllowance: 110,
    unlockedHurdlesCount: 13,
    maxDifficultyAllowed: 90,
    features: [
      '45s Run Timer',
      'Armed Vault Sentry patrols',
      'Rotating Centrifuge Hazards',
      'Sabotaged Vent Duct shortcuts'
    ]
  },
  {
    tier: 4,
    name: 'Level 4: Extreme (100%)',
    description: 'Full 100% maximum difficulty enabled. Precision timing required, yet guaranteed 100% beatable.',
    requiredXp: 1000,
    budgetAllowance: 115,
    unlockedHurdlesCount: 17,
    maxDifficultyAllowed: 100,
    features: [
      '40s Run Timer',
      'Hydraulic Crushers & Bio-Mutant Crawlers',
      'Tight Timing & Narrow Conduits',
      '100% Extreme Difficulty unlocked'
    ]
  },
  {
    tier: 5,
    name: 'Level 5: Chaos',
    description: 'Unrestricted obstacle stacking, multiple synchronized traps, and master architect status.',
    requiredXp: 1800,
    budgetAllowance: 120,
    unlockedHurdlesCount: 20,
    maxDifficultyAllowed: 100,
    features: [
      '38s Run Timer',
      'Max Budget +20 Points',
      'Anti-Grav + Kinetic Booster Combos',
      'Chaos Architectural Mastery'
    ]
  }
];

const PROFILE_STORAGE_KEY = 'remix_gauntlet_profile_v1';

export function getStoredProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return getDefaultProfile();
  }
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse user profile', e);
  }
  return getDefaultProfile();
}

export function saveStoredProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function getDefaultProfile(): UserProfile {
  return {
    name: 'Agent Zero',
    avatar: 'cyber_runner',
    levelTier: 1,
    xp: 60,
    matchesPlayed: 0,
    runsCompleted: 0,
    trapsMastered: 0,
    stealthWins: 0,
    designerRating: 1200,
    unlockedBadges: ['Initiate']
  };
}

export function addMatchRewards(
  currentProfile: UserProfile,
  matchData: {
    runsWon: number;
    trapsTriggered: number;
    trapsAvoided: number;
    highestCombo: number;
    totalScore: number;
  }
): { updatedProfile: UserProfile; leveledUp: boolean; xpGained: number } {
  const xpGained = Math.round(
    100 +
    matchData.runsWon * 60 +
    matchData.highestCombo * 10 +
    matchData.trapsAvoided * 15 +
    Math.min(150, matchData.totalScore / 100)
  );

  const newXp = currentProfile.xp + xpGained;
  let newTier = currentProfile.levelTier;

  // Determine if unlocked higher tier
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (newXp >= LEVEL_TIERS[i].requiredXp) {
      newTier = Math.max(newTier, LEVEL_TIERS[i].tier);
      break;
    }
  }

  const leveledUp = newTier > currentProfile.levelTier;

  const updatedBadges = [...currentProfile.unlockedBadges];
  if (matchData.runsWon >= 4 && !updatedBadges.includes('Flawless Gauntlet')) {
    updatedBadges.push('Flawless Gauntlet');
  }
  if (matchData.highestCombo >= 5 && !updatedBadges.includes('Combo Virtuoso')) {
    updatedBadges.push('Combo Virtuoso');
  }
  if (newTier >= 4 && !updatedBadges.includes('Extreme Survivor')) {
    updatedBadges.push('Extreme Survivor');
  }

  const updatedProfile: UserProfile = {
    ...currentProfile,
    xp: newXp,
    levelTier: newTier,
    matchesPlayed: currentProfile.matchesPlayed + 1,
    runsCompleted: currentProfile.runsCompleted + matchData.runsWon,
    trapsMastered: currentProfile.trapsMastered + matchData.trapsAvoided,
    stealthWins: currentProfile.stealthWins + (matchData.runsWon > 0 ? 1 : 0),
    designerRating: currentProfile.designerRating + Math.round(matchData.totalScore / 250),
    unlockedBadges: updatedBadges
  };

  saveStoredProfile(updatedProfile);
  return { updatedProfile, leveledUp, xpGained };
}
