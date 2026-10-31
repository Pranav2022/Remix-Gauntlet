import React, { useEffect, useState } from 'react';
import { PlayerConfig, SlabData, SlabRunResult } from '../types/game';
import { Trophy, Skull, Clock, Heart, Zap, ShieldAlert, Award, ArrowRight } from 'lucide-react';
import { sound } from '../utils/audio';

interface PostRunRevealModalProps {
  isOpen: boolean;
  onProceed: () => void;
  slab: SlabData;
  creator: PlayerConfig;
  runner: PlayerConfig;
  result: SlabRunResult;
  roundIndex: number; // 0 to 3
}

export const PostRunRevealModal: React.FC<PostRunRevealModalProps> = ({
  isOpen,
  onProceed,
  slab,
  creator,
  runner,
  result,
  roundIndex,
}) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }

    if (result.won) {
      sound.playWin();
    } else {
      sound.playLose();
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onProceed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onProceed, result.won]);

  if (!isOpen) return null;

  // Breakdown of what was hidden on the slab
  const movingCount = slab.hurdles.filter(h => h.type.includes('moving') || h.type === 'patrol_guard').length;
  const trapCount = slab.hurdles.filter(h => h.isTrap || h.type === 'trap_floor').length;
  const shortcutCount = slab.hurdles.filter(h => h.isShortcut || h.type === 'hidden_passage').length;
  const fakeCount = slab.hurdles.filter(h => h.type.includes('fake') || h.isHidden).length;
  const extremeCount = slab.hurdles.filter(h => h.cost >= 25).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100">
        {/* Big Win / Lose State Banner */}
        <div className="text-center mb-6">
          {result.won ? (
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold text-2xl tracking-wider animate-pulse">
              <Trophy className="w-7 h-7" />
              SLAB CONQUERED! WIN!
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-extrabold text-2xl tracking-wider animate-pulse">
              <Skull className="w-7 h-7" />
              INFILTRATION FAILED! LOSE
            </div>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Runner: <span className="font-semibold text-white">{runner.name}</span> · Architect: <span className="font-semibold text-white">{creator.name}</span>
          </p>
        </div>

        {/* Performance Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-center">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Time
            </div>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {result.completionTime.toFixed(1)}s
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Lives
            </div>
            <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
              {result.livesRemaining}/3
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Combo
            </div>
            <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
              x{result.comboMax}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              Score
            </div>
            <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
              {result.runnerScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* WHAT WAS HIDDEN REVEAL */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-5">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-2 flex items-center justify-between">
            <span>WHAT WAS HIDDEN ON THIS SLAB</span>
            <span className="text-slate-400 font-normal">Difficulty: {slab.difficultyRating}%</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-300">
            <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
              • {movingCount} Dynamic Hazards
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
              • {trapCount} Cryo-Stasis Traps
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
              • {shortcutCount} Risky Shortcuts
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
              • {fakeCount} Hidden / Decoys
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
              • {extremeCount} Extreme Hazards
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-amber-300">
              • Architect Pts: {result.designerScore}
            </div>
          </div>
        </div>

        {/* REVENGE / REMIX SUMMARY */}
        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 mb-6 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">REVENGE INTEL: </span>
            {result.trapsTriggered > 0
              ? `You were snared by ${creator.name}'s trap floor! Keep this pattern in mind when designing your next gauntlet.`
              : `You cleanly navigated ${creator.name}'s traps! Adapt their layout ideas to create even tighter corridors.`}
          </div>
        </div>

        {/* 5-SECOND COUNTDOWN TO NEXT ROUND */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-xs font-mono text-cyan-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            NEXT ROUND IN {countdown}...
          </div>

          <button
            onClick={onProceed}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Skip Timer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
