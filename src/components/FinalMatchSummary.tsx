import React from 'react';
import { PlayerConfig, SlabData, GameMode } from '../types/game';
import { Trophy, Award, Clock, Heart, ShieldAlert, Zap, RotateCcw, ArrowRight } from 'lucide-react';

interface FinalMatchSummaryProps {
  slabs: SlabData[];
  players: PlayerConfig[];
  gameMode: GameMode;
  onRemixMatch: () => void;
  onReturnLobby: () => void;
}

export const FinalMatchSummary: React.FC<FinalMatchSummaryProps> = ({
  slabs,
  players,
  gameMode,
  onRemixMatch,
  onReturnLobby,
}) => {
  // Aggregate scores for each player (both as runner and as designer)
  const playerStats = players.map(p => {
    // Slabs run by this player
    const runSlab = slabs.find(s => s.runnerId === p.id);
    const runResult = runSlab?.runResult;

    // Slab created by this player
    const createdSlab = slabs.find(s => s.creatorId === p.id);
    const createdResult = createdSlab?.runResult;

    const runnerScore = runResult?.runnerScore || 0;
    const designerScore = createdResult?.designerScore || 0;
    const totalScore = runnerScore + designerScore;

    return {
      player: p,
      runSlab,
      createdSlab,
      runResult,
      runnerScore,
      designerScore,
      totalScore,
      won: runResult?.won || false,
      livesRemaining: runResult?.livesRemaining || 0,
      completionTime: runResult?.completionTime || 0,
      comboMax: runResult?.comboMax || 1,
      trapsTriggered: runResult?.trapsTriggered || 0,
    };
  });

  // Rank players by total score
  const ranked = [...playerStats].sort((a, b) => b.totalScore - a.totalScore);
  const champion = ranked[0];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Champion Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan-500/10 blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold mb-3">
          <Trophy className="w-4 h-4" />
          MATCH CHAMPION
        </div>

        <h1 className="text-4xl font-black text-white tracking-tight mb-1">
          {champion.player.name}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Dominated the 4-Slab Challenge Cycle with {champion.totalScore.toLocaleString()} Total Points
        </p>

        {/* Podium Top 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          {ranked.map((stat, idx) => (
            <div
              key={stat.player.id}
              className={`p-4 rounded-2xl border transition-all ${
                idx === 0
                  ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-slate-400">
                  RANK #{idx + 1}
                </span>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stat.player.color }}
                ></span>
              </div>

              <div className="font-bold text-white text-base truncate">
                {stat.player.name}
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-400 font-mono">
                <div className="flex justify-between">
                  <span>Runner Pts:</span>
                  <span className="text-white font-bold">{stat.runnerScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Architect Pts:</span>
                  <span className="text-cyan-400 font-bold">{stat.designerScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 text-slate-200">
                  <span>Total:</span>
                  <span className="text-amber-400 font-bold">{stat.totalScore.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete 4-Slab Visual Journey Map */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
              EXPEDITION LOG
            </div>
            <h2 className="text-lg font-bold text-white">
              The 4-Slab Challenge Journey
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Circular Handover Loop
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {slabs.map((slab, i) => {
            const creator = players.find(p => p.id === slab.creatorId)!;
            const runner = players.find(p => p.id === slab.runnerId)!;
            const res = slab.runResult;

            return (
              <div
                key={slab.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-cyan-400 font-bold">SLAB #{i + 1}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    res?.won ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}>
                    {res?.won ? 'SURVIVED' : 'FALLEN'}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="text-slate-400">
                    Architect: <span className="text-white font-semibold">{creator.name}</span>
                  </div>
                  <div className="text-slate-400">
                    Runner: <span className="text-white font-semibold">{runner.name}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-400">
                  <div>Time: {res?.completionTime ? `${res.completionTime.toFixed(1)}s` : '--'}</div>
                  <div>Lives: {res?.livesRemaining ?? 0}/3</div>
                  <div>Traps: {res?.trapsTriggered ?? 0}</div>
                  <div>Combo: x{res?.comboMax ?? 1}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match Actions */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={onReturnLobby}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
        >
          Return to Lobby
        </button>

        <button
          onClick={onRemixMatch}
          className="px-6 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <RotateCcw className="w-4 h-4" />
          Remix Another 4-Player Match
        </button>
      </div>
    </div>
  );
};
