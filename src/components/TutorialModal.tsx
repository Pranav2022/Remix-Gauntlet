import React from 'react';
import { GameMode } from '../types/game';
import { X, Wrench, Play, ShieldAlert, Sparkles, Footprints, AlertTriangle } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode: GameMode;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  gameMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-cyan-400 font-mono mb-1">
            Rules of Engagement
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {gameMode === 'mutant_lab' ? 'Mutant Lab Escape' : 'Heist Remix'} Tutorial
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            One player creates a challenge — another player must survive it!
          </p>
        </div>

        {/* 4-Player Cycle Banner */}
        <div className="mb-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2 flex items-center gap-2">
            <Footprints className="w-4 h-4 text-cyan-400" />
            Core 4-Player Loop Sequence
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-center">
              <div className="font-bold">Player 1</div>
              <div className="text-[10px] text-cyan-400/80 mt-0.5">Builds for P2</div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-center">
              <div className="font-bold">Player 2</div>
              <div className="text-[10px] text-rose-400/80 mt-0.5">Builds for P3</div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-center">
              <div className="font-bold">Player 3</div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">Builds for P4</div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 text-center">
              <div className="font-bold">Player 4</div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">Builds for P1</div>
            </div>
          </div>
        </div>

        {/* Game Specific Guide */}
        {gameMode === 'mutant_lab' ? (
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm mb-2">
                <Wrench className="w-4 h-4" />
                BUILD PHASE
              </div>
              <ul className="text-xs space-y-2 text-slate-300">
                <li>• Choose obstacles from your catalog budget (100 pts).</li>
                <li>• Drag & drop onto your slab with real-time preview.</li>
                <li>• Rotate or adjust speed to tune difficulty up to 100%.</li>
                <li>• Click <span className="text-cyan-300 font-bold">Confirm Placement</span> to lock it in before picking the next.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                <Play className="w-4 h-4" />
                RUN PHASE
              </div>
              <ul className="text-xs space-y-2 text-slate-300">
                <li>• Reach the <span className="text-emerald-400 font-bold">EXIT</span> before time expires (A/D or Arrows to move, Space/W to jump).</li>
                <li>• 3 Lives available. Checkpoints save your progress.</li>
                <li>• Build your <span className="text-cyan-300 font-bold">COMBO</span> with continuous jumps and dodging!</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-2">
                <Wrench className="w-4 h-4" />
                BUILD PHASE
              </div>
              <ul className="text-xs space-y-2 text-slate-300">
                <li>• Design the vault with security lasers, cameras, and guards.</li>
                <li>• Add sabotaged vent shortcuts or deceptive dead-ends.</li>
                <li>• Place the <span className="text-amber-300 font-bold">Target Gem</span> anywhere on the slab.</li>
                <li>• Confirm each obstacle one-by-one to spend your budget.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                <Play className="w-4 h-4" />
                RUN PHASE
              </div>
              <ul className="text-xs space-y-2 text-slate-300">
                <li>• Sneak past patrolling sentries and sweeping camera cones.</li>
                <li>• Infiltrate deep, grab the <span className="text-amber-300 font-bold">Target Gem</span>, and extract to the exit!</li>
                <li>• WASD/Arrows to move, Shift/Sneak to bypass acoustic sensors.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Trap System & 100% Difficulty Callout */}
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200 space-y-1.5 mb-6">
          <div className="font-semibold flex items-center gap-1.5 text-rose-300">
            <AlertTriangle className="w-4 h-4" />
            CRITICAL: THE TRAP SYSTEM & 100% DIFFICULTY
          </div>
          <p>
            Stepping on a <span className="font-semibold text-white">Trap Floor</span> activates a 4–5 second stasis lockdown with an audible countdown (<span className="font-mono text-rose-400">4... 3... 2... 1...</span>). It tests your nerve and reaction rather than instant death!
          </p>
          <p className="text-rose-300/80">
            At 100% Extreme Difficulty, all hazards are intense and tight, but guaranteed 100% beatable through timing and skill.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
          >
            Got It, Let's Play
          </button>
        </div>
      </div>
    </div>
  );
};
