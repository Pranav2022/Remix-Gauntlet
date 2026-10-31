import React from 'react';
import { PlayerConfig, SlabData } from '../types/game';
import { EyeOff, Clock, ShieldAlert, Zap, ArrowRight } from 'lucide-react';

interface CuriosityIntroModalProps {
  isOpen: boolean;
  onStartRun: () => void;
  slab: SlabData;
  creator: PlayerConfig;
  runner: PlayerConfig;
  timeLimit: number;
}

export const CuriosityIntroModal: React.FC<CuriosityIntroModalProps> = ({
  isOpen,
  onStartRun,
  slab,
  creator,
  runner,
  timeLimit,
}) => {
  if (!isOpen) return null;

  const trapCount = slab.hurdles.filter(h => h.isTrap || h.type === 'trap_floor').length;
  const shortcutCount = slab.hurdles.filter(h => h.isShortcut).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-8 shadow-2xl relative text-slate-100 text-center">
        {/* Creator Identity */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4"
          style={{ backgroundColor: creator.accentBg, color: creator.borderCol, border: `1px solid ${creator.borderCol}40` }}>
          <span>SLAB ARCHITECT: {creator.name.toUpperCase()}</span>
        </div>

        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          {creator.name}&apos;s Gauntlet
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          <span className="font-semibold text-white">{runner.name}</span> must infiltrate and survive this slab. Layout is classified under fog of war.
        </p>

        {/* Curiosity Mystery Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 mb-6 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-cyan-400" />
              Observed Layout
            </span>
            <span className="text-sm font-mono text-cyan-400 font-bold tracking-wider">
              CLASSIFIED (???)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Time Allowance
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {timeLimit}s
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Trap Signatures
              </div>
              <div className="text-lg font-bold font-mono text-rose-400">
                {trapCount > 0 ? `${trapCount} Armed` : 'Unknown'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Potential Shortcuts: {shortcutCount > 0 ? 'Detected' : 'None Detected'}</span>
            <span>Lives: 3 ♥ ♥ ♥</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 italic mb-6">
          &ldquo;What did they place around the first corner?&rdquo;
        </div>

        <button
          onClick={onStartRun}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-[0.99]"
        >
          <span>Begin Infiltration Run</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
