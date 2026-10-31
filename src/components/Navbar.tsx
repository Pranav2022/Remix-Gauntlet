import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Shield, HelpCircle } from 'lucide-react';
import { GameMode } from '../types/game';

interface NavbarProps {
  currentView: string;
  gameMode: GameMode;
  onSelectView: (view: 'lobby' | 'profile' | 'levels') => void;
  onSelectGame: (mode: GameMode) => void;
  onOpenTutorial: () => void;
  activeMatchInProgress: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  gameMode,
  onSelectView,
  onSelectGame,
  onOpenTutorial,
  activeMatchInProgress,
}) => {
  const [muted, setMuted] = useState(sound.getMuted());

  const handleToggleSound = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
  };

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectView('lobby')}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_10px_#22d3ee]"></span>
          Remix Gauntlet
        </button>
        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
          {gameMode === 'mutant_lab' ? 'MUTANT LAB' : 'HEIST REMIX'}
        </span>
      </div>

      {/* Zone 2: 4-5 single line text links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => {
            onSelectGame('mutant_lab');
            onSelectView('lobby');
          }}
          className={`whitespace-nowrap shrink-0 transition-colors ${
            gameMode === 'mutant_lab' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Mutant Lab
        </button>
        <button
          onClick={() => {
            onSelectGame('heist_vault');
            onSelectView('lobby');
          }}
          className={`whitespace-nowrap shrink-0 transition-colors ${
            gameMode === 'heist_vault' ? 'text-amber-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Heist Remix
        </button>
        <button
          onClick={() => onSelectView('lobby')}
          className={`whitespace-nowrap shrink-0 transition-colors ${
            currentView === 'lobby' ? 'text-white font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Lobby
        </button>
        <button
          onClick={() => onSelectView('levels')}
          className={`whitespace-nowrap shrink-0 transition-colors ${
            currentView === 'levels' ? 'text-white font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Level Tiers
        </button>
        <button
          onClick={() => onSelectView('profile')}
          className={`whitespace-nowrap shrink-0 transition-colors ${
            currentView === 'profile' ? 'text-white font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Profile
        </button>
      </nav>

      {/* Zone 3: 1 primary action cluster */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenTutorial}
          className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-900"
          title="How to play"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={handleToggleSound}
          className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-900"
          title={muted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {activeMatchInProgress ? (
          <button
            onClick={() => onSelectView('lobby')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors whitespace-nowrap shrink-0"
          >
            Quit Match
          </button>
        ) : (
          <button
            onClick={() => onSelectView('lobby')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            Quick Match
          </button>
        )}
      </div>
    </header>
  );
};
