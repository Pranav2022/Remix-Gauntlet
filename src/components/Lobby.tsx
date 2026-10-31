import React from 'react';
import { PlayerConfig, GameMode, LevelTierInfo } from '../types/game';
import { LEVEL_TIERS } from '../utils/progression';
import { Sparkles, Users, Bot, Shield, Trophy, Play, CheckCircle2, Flame, Wrench } from 'lucide-react';

interface LobbyProps {
  gameMode: GameMode;
  onSelectGame: (mode: GameMode) => void;
  players: PlayerConfig[];
  onUpdatePlayer: (index: number, updated: PlayerConfig) => void;
  selectedTier: number;
  onSelectTier: (tier: number) => void;
  isSoloBotMode: boolean;
  onToggleSoloBotMode: (solo: boolean) => void;
  onStartMatch: () => void;
  onOpenTutorial: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  gameMode,
  onSelectGame,
  players,
  onUpdatePlayer,
  selectedTier,
  onSelectTier,
  isSoloBotMode,
  onToggleSoloBotMode,
  onStartMatch,
  onOpenTutorial,
}) => {
  const currentTierInfo = LEVEL_TIERS.find(t => t.tier === selectedTier) || LEVEL_TIERS[0];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Hero Welcome & Game Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mutant Lab Escape Card */}
        <div
          onClick={() => onSelectGame('mutant_lab')}
          className={`cursor-pointer p-6 rounded-3xl border transition-all relative overflow-hidden ${
            gameMode === 'mutant_lab'
              ? 'bg-gradient-to-br from-cyan-950/60 to-slate-900 border-cyan-500 shadow-xl shadow-cyan-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
              GAME 1 · PLATFORM GAUNTLET
            </span>
            {gameMode === 'mutant_lab' && (
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            )}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Mutant Lab Escape
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Remix a platform gauntlet together, then make a run for it. Design collapsing grates, centrifuge blades, and bio-toxic hazards.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
            <span>• 14 Obstacle Types</span>
            <span>• Cryo-Stasis Traps</span>
          </div>
        </div>

        {/* Heist Remix Card */}
        <div
          onClick={() => onSelectGame('heist_vault')}
          className={`cursor-pointer p-6 rounded-3xl border transition-all relative overflow-hidden ${
            gameMode === 'heist_vault'
              ? 'bg-gradient-to-br from-amber-950/60 to-slate-900 border-amber-500 shadow-xl shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono tracking-widest text-amber-400 font-bold uppercase">
              GAME 2 · STEALTH INFILTRATION
            </span>
            {gameMode === 'heist_vault' && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
            )}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Heist Remix
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Design the vault, add a guard, sabotage a passage, steal the gem. Position sentries, sweep security cones, and crack the vault.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
            <span>• Top-Down Stealth</span>
            <span>• Custom Gem Placement</span>
          </div>
        </div>
      </div>

      {/* 4-Player Roster Configurator */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              MATCH SETUP
            </div>
            <h3 className="text-lg font-bold text-white">
              The 4-Player Roster & Slabs
            </h3>
          </div>

          {/* Solo Mode vs Local Pass & Play toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => onToggleSoloBotMode(false)}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                !isSoloBotMode
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              4 Human Pass & Play
            </button>
            <button
              onClick={() => onToggleSoloBotMode(true)}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                isSoloBotMode
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Solo (P1 vs 3 AI Architects)
            </button>
          </div>
        </div>

        {/* 4 Player Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {players.map((p, idx) => {
            const targetRunner = players[(idx + 1) % 4];

            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  ></span>
                  <span className="text-[10px] font-mono text-slate-400">
                    SLAB #{idx + 1}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={p.name}
                    onChange={e =>
                      onUpdatePlayer(idx, { ...p, name: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900 space-y-0.5">
                  <div>Designs: <span className="text-white font-semibold">Slab {idx + 1}</span></div>
                  <div>Runs: <span className="text-cyan-400 font-semibold">{players[(idx + 3) % 4].name}&apos;s Slab</span></div>
                  <div>Target: <span className="text-amber-400 font-semibold">{targetRunner.name}</span></div>
                </div>

                {p.isBot && (
                  <div className="text-[10px] font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40 inline-block">
                    AI Architect ({p.botPersonality || 'Balanced'})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Level Progression & Difficulty Selector */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              DIFFICULTY RULES
            </div>
            <h3 className="text-base font-bold text-white">
              Active Tier: {currentTierInfo.name}
            </h3>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Budget: {currentTierInfo.budgetAllowance} pts
          </span>
        </div>

        {/* Tier Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {LEVEL_TIERS.map(tier => (
            <button
              key={tier.tier}
              onClick={() => onSelectTier(tier.tier)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedTier === tier.tier
                  ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold">Tier {tier.tier}</div>
              <div className="text-[10px] text-slate-400 truncate">{tier.name.split(':')[1]}</div>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          {currentTierInfo.description} (100% Extreme remains chaseable & technically beatable).
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={onOpenTutorial}
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span>View Quick Builder & Runner Guide</span>
        </button>

        <button
          onClick={onStartMatch}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 active:scale-[0.99]"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>START 4-PLAYER MATCH</span>
        </button>
      </div>
    </div>
  );
};
