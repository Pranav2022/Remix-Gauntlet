import React from 'react';
import { LEVEL_TIERS } from '../utils/progression';
import { UserProfile } from '../types/game';
import { CheckCircle2, Lock, Zap, Gauge, ArrowRight } from 'lucide-react';

interface LevelProgressionViewProps {
  profile: UserProfile;
  selectedTier: number;
  onSelectTier: (tier: number) => void;
  onBackToLobby: () => void;
}

export const LevelProgressionView: React.FC<LevelProgressionViewProps> = ({
  profile,
  selectedTier,
  onSelectTier,
  onBackToLobby,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">
          GLOBAL LEVEL PROGRESSION HIERARCHY
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          Level Progression & 100% Difficulty Tiers
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl">
          Upgrade difficulty levels based on player engagement, match completions, and architect rating. At 100% Maximum Difficulty, hazards require high precision yet are guaranteed 100% beatable.
        </p>

        {/* Current XP Progress */}
        <div className="pt-2">
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span>Current Experience: {profile.xp} XP</span>
            <span>Active Tier: {profile.levelTier} / 5</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (profile.xp / 1800) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tier Cards Grid */}
      <div className="space-y-4">
        {LEVEL_TIERS.map(tier => {
          const isUnlocked = profile.xp >= tier.requiredXp;
          const isSelected = selectedTier === tier.tier;

          return (
            <div
              key={tier.tier}
              onClick={() => isUnlocked && onSelectTier(tier.tier)}
              className={`p-6 rounded-2xl border transition-all ${
                isUnlocked ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
              } ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-500 shadow-xl shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : isUnlocked
                        ? 'bg-slate-800 text-slate-200'
                        : 'bg-slate-950 text-slate-600'
                    }`}
                  >
                    L{tier.tier}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{tier.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          Active For Match
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-slate-400">{tier.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <div className="text-slate-500">Budget Limit</div>
                    <div className="text-cyan-400 font-bold">{tier.budgetAllowance} pts</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500">Req. XP</div>
                    <div className="text-white font-bold">{tier.requiredXp}</div>
                  </div>
                </div>
              </div>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                {tier.features.map(f => (
                  <span
                    key={f}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-start">
        <button
          onClick={onBackToLobby}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          ← Return to Lobby
        </button>
      </div>
    </div>
  );
};
