import React, { useState } from 'react';
import { GameMode, PlayerConfig, SlabData, SlabRunResult, UserProfile } from './types/game';
import { INITIAL_PLAYERS, createInitialSlabs, generateBotSlab } from './utils/gameDefaults';
import { getStoredProfile, addMatchRewards } from './utils/progression';
import { LEVEL_TIERS } from './utils/progression';
import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { BuilderCanvas } from './components/BuilderCanvas';
import { RunnerCanvas } from './components/RunnerCanvas';
import { CuriosityIntroModal } from './components/CuriosityIntroModal';
import { PostRunRevealModal } from './components/PostRunRevealModal';
import { FinalMatchSummary } from './components/FinalMatchSummary';
import { ProfileView } from './components/ProfileView';
import { LevelProgressionView } from './components/LevelProgressionView';
import { TutorialModal } from './components/TutorialModal';

export default function App() {
  // Navigation & View
  const [currentView, setCurrentView] = useState<
    'lobby' | 'profile' | 'levels' | 'design_phase' | 'play_phase' | 'final_match_summary'
  >('lobby');

  // Selected Game Mode
  const [gameMode, setGameMode] = useState<GameMode>('mutant_lab');

  // Players Configuration
  const [players, setPlayers] = useState<PlayerConfig[]>(INITIAL_PLAYERS);
  const [isSoloBotMode, setIsSoloBotMode] = useState<boolean>(false);

  // Level Progression & Tier
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [userProfile, setUserProfile] = useState<UserProfile>(getStoredProfile);

  // Active Match State
  const [slabs, setSlabs] = useState<SlabData[]>(() =>
    createInitialSlabs('mutant_lab', LEVEL_TIERS[0].budgetAllowance)
  );

  // Phase Progress Trackers
  const [designSlabIndex, setDesignSlabIndex] = useState<number>(0); // 0 to 3 (P1 -> P2 -> P3 -> P4)
  const [playSlabIndex, setPlaySlabIndex] = useState<number>(0);     // 0 to 3 (P2 runs Slab 1, etc.)

  // Modals
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showCuriosityIntro, setShowCuriosityIntro] = useState<boolean>(false);
  const [showPostRunReveal, setShowPostRunReveal] = useState<boolean>(false);
  const [currentRunResult, setCurrentRunResult] = useState<SlabRunResult | null>(null);

  // Time limit based on active tier
  const activeTierInfo = LEVEL_TIERS.find(t => t.tier === selectedTier) || LEVEL_TIERS[0];
  const roundTimeLimit = selectedTier === 1 ? 60 : selectedTier === 2 ? 50 : selectedTier === 3 ? 45 : selectedTier === 4 ? 40 : 38;

  // Toggle Solo Mode vs 4 Human Pass & Play
  const handleToggleSoloBotMode = (solo: boolean) => {
    setIsSoloBotMode(solo);
    setPlayers(prev =>
      prev.map((p, idx) => ({
        ...p,
        isBot: solo ? idx > 0 : false, // P1 is human, P2/P3/P4 are bots in solo mode
      }))
    );
  };

  const handleUpdatePlayer = (index: number, updated: PlayerConfig) => {
    setPlayers(prev => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  // Start 4-Player Match
  const handleStartMatch = () => {
    const freshSlabs = createInitialSlabs(gameMode, activeTierInfo.budgetAllowance);

    // If bots exist, populate bot slabs smartly
    const preparedSlabs = freshSlabs.map((s, idx) => {
      const creator = players[idx];
      if (creator.isBot) {
        return generateBotSlab(creator, gameMode, s);
      }
      return s;
    });

    setSlabs(preparedSlabs);
    setDesignSlabIndex(0);
    setPlaySlabIndex(0);
    setCurrentView('design_phase');
  };

  // Confirm Slab from Builder Canvas
  const handleConfirmSlab = (updatedSlab: SlabData) => {
    setSlabs(prev => {
      const next = [...prev];
      next[designSlabIndex] = updatedSlab;
      return next;
    });

    // Check if next slab creator is a human or if we've completed all 4 slabs
    if (designSlabIndex < 3) {
      const nextIndex = designSlabIndex + 1;
      const nextCreator = players[nextIndex];

      // If next creator is a bot, it was already generated, or skip
      if (nextCreator.isBot && isSoloBotMode) {
        // Fast-forward through bot designers
        let forwardIndex = nextIndex;
        while (forwardIndex < 4 && players[forwardIndex].isBot) {
          forwardIndex++;
        }
        if (forwardIndex >= 4) {
          // All 4 slabs are designed! Move to Play Phase!
          setCurrentView('play_phase');
          setPlaySlabIndex(0);
          setShowCuriosityIntro(true);
          return;
        } else {
          setDesignSlabIndex(forwardIndex);
        }
      } else {
        setDesignSlabIndex(nextIndex);
      }
    } else {
      // All 4 slabs designed! Move to Phase 2: PLAY!
      setCurrentView('play_phase');
      setPlaySlabIndex(0);
      setShowCuriosityIntro(true);
    }
  };

  // Finish Run for the active slab
  const handleFinishRun = (result: SlabRunResult) => {
    setCurrentRunResult(result);
    // Attach result to the active slab
    setSlabs(prev => {
      const next = [...prev];
      next[playSlabIndex] = {
        ...next[playSlabIndex],
        runResult: result,
      };
      return next;
    });

    setShowPostRunReveal(true);
  };

  // Proceed after 5-second countdown in PostRunReveal
  const handleProceedAfterReveal = () => {
    setShowPostRunReveal(false);

    if (playSlabIndex < 3) {
      const nextPlayIndex = playSlabIndex + 1;
      setPlaySlabIndex(nextPlayIndex);
      setShowCuriosityIntro(true); // show curiosity teaser for next player's slab
    } else {
      // All 4 runs completed! Award XP & Show Final Match Summary
      const runsWon = slabs.filter(s => s.runResult?.won).length;
      const highestCombo = Math.max(...slabs.map(s => s.runResult?.comboMax || 1));
      const totalScore = slabs.reduce((sum, s) => sum + (s.runResult?.runnerScore || 0), 0);

      const { updatedProfile } = addMatchRewards(userProfile, {
        runsWon,
        trapsTriggered: slabs.reduce((sum, s) => sum + (s.runResult?.trapsTriggered || 0), 0),
        trapsAvoided: slabs.filter(s => (s.runResult?.trapsTriggered || 0) === 0).length,
        highestCombo,
        totalScore,
      });

      setUserProfile(updatedProfile);
      setCurrentView('final_match_summary');
    }
  };

  // Active Slab & Players in current view
  const currentDesignSlab = slabs[designSlabIndex];
  const designCreator = players[designSlabIndex];
  const designTargetRunner = players[(designSlabIndex + 1) % 4];

  const currentPlaySlab = slabs[playSlabIndex];
  const playCreator = players[currentPlaySlab.creatorId === 'p1' ? 0 : currentPlaySlab.creatorId === 'p2' ? 1 : currentPlaySlab.creatorId === 'p3' ? 2 : 3];
  const playRunner = players[currentPlaySlab.runnerId === 'p1' ? 0 : currentPlaySlab.runnerId === 'p2' ? 1 : currentPlaySlab.runnerId === 'p3' ? 2 : 3];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Bar adhering to Top Bar contract */}
      <Navbar
        currentView={currentView}
        gameMode={gameMode}
        onSelectView={view => {
          if (currentView === 'design_phase' || currentView === 'play_phase') {
            if (confirm('Leave current match and return to lobby?')) {
              setCurrentView(view);
            }
          } else {
            setCurrentView(view);
          }
        }}
        onSelectGame={mode => {
          setGameMode(mode);
          setSlabs(createInitialSlabs(mode, activeTierInfo.budgetAllowance));
        }}
        onOpenTutorial={() => setShowTutorial(true)}
        activeMatchInProgress={currentView === 'design_phase' || currentView === 'play_phase'}
      />

      {/* Main View Port */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col items-center justify-start">
        {/* LOBBY VIEW */}
        {currentView === 'lobby' && (
          <Lobby
            gameMode={gameMode}
            onSelectGame={mode => {
              setGameMode(mode);
              setSlabs(createInitialSlabs(mode, activeTierInfo.budgetAllowance));
            }}
            players={players}
            onUpdatePlayer={handleUpdatePlayer}
            selectedTier={selectedTier}
            onSelectTier={setSelectedTier}
            isSoloBotMode={isSoloBotMode}
            onToggleSoloBotMode={handleToggleSoloBotMode}
            onStartMatch={handleStartMatch}
            onOpenTutorial={() => setShowTutorial(true)}
          />
        )}

        {/* PROFILE DOSSIER VIEW */}
        {currentView === 'profile' && (
          <ProfileView
            profile={userProfile}
            onUpdateProfile={setUserProfile}
            onBackToLobby={() => setCurrentView('lobby')}
          />
        )}

        {/* LEVEL PROGRESSION HIERARCHY */}
        {currentView === 'levels' && (
          <LevelProgressionView
            profile={userProfile}
            selectedTier={selectedTier}
            onSelectTier={setSelectedTier}
            onBackToLobby={() => setCurrentView('lobby')}
          />
        )}

        {/* PHASE 1: 4-PLAYER SLAB DESIGN */}
        {currentView === 'design_phase' && currentDesignSlab && (
          <div className="w-full space-y-4 animate-in fade-in duration-200">
            {/* Sequential Design Stepper Tracker */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono max-w-6xl mx-auto">
              <span className="text-slate-400 font-bold uppercase">
                PHASE 1: SLAB ARCHITECTURE ({designSlabIndex + 1} OF 4)
              </span>
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`px-3 py-1 rounded-lg border font-bold ${
                      idx === designSlabIndex
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : idx < designSlabIndex
                        ? 'bg-slate-800 text-emerald-400 border-emerald-800'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    P{idx + 1} Slab
                  </div>
                ))}
              </div>
            </div>

            <BuilderCanvas
              key={`builder_${currentDesignSlab.id}_${designSlabIndex}`}
              slab={currentDesignSlab}
              creator={designCreator}
              runner={designTargetRunner}
              gameMode={gameMode}
              onConfirmSlab={handleConfirmSlab}
            />
          </div>
        )}

        {/* PHASE 2: 4-PLAYER SLAB RUNS */}
        {currentView === 'play_phase' && currentPlaySlab && (
          <div className="w-full space-y-4 animate-in fade-in duration-200">
            {/* Sequential Play Loop Stepper */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono max-w-6xl mx-auto">
              <span className="text-slate-400 font-bold uppercase">
                PHASE 2: SURVIVAL RUN ({playSlabIndex + 1} OF 4)
              </span>
              <div className="flex items-center gap-2">
                {[
                  { c: 'P1', r: 'P2' },
                  { c: 'P2', r: 'P3' },
                  { c: 'P3', r: 'P4' },
                  { c: 'P4', r: 'P1' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`px-2.5 py-1 rounded-lg border font-bold ${
                      idx === playSlabIndex
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : idx < playSlabIndex
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-slate-950 text-slate-600 border-slate-800'
                    }`}
                  >
                    {item.c} ➔ {item.r}
                  </div>
                ))}
              </div>
            </div>

            <RunnerCanvas
              key={`runner_${currentPlaySlab.id}_${playSlabIndex}`}
              slab={currentPlaySlab}
              creator={playCreator}
              runner={playRunner}
              gameMode={gameMode}
              timeLimit={roundTimeLimit}
              onFinishRun={handleFinishRun}
            />
          </div>
        )}

        {/* FINAL 4-PLAYER MATCH CONCLUSION SUMMARY */}
        {currentView === 'final_match_summary' && (
          <FinalMatchSummary
            slabs={slabs}
            players={players}
            gameMode={gameMode}
            onRemixMatch={handleStartMatch}
            onReturnLobby={() => setCurrentView('lobby')}
          />
        )}
      </main>

      {/* CURIOSITY INTRO MODAL (Before each player runs) */}
      {showCuriosityIntro && currentPlaySlab && (
        <CuriosityIntroModal
          isOpen={showCuriosityIntro}
          onStartRun={() => setShowCuriosityIntro(false)}
          slab={currentPlaySlab}
          creator={playCreator}
          runner={playRunner}
          timeLimit={roundTimeLimit}
        />
      )}

      {/* POST RUN REVEAL MODAL (What was hidden + 5s countdown) */}
      {showPostRunReveal && currentPlaySlab && currentRunResult && (
        <PostRunRevealModal
          isOpen={showPostRunReveal}
          onProceed={handleProceedAfterReveal}
          slab={currentPlaySlab}
          creator={playCreator}
          runner={playRunner}
          result={currentRunResult}
          roundIndex={playSlabIndex}
        />
      )}

      {/* QUICK INTERACTIVE TUTORIAL MODAL */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameMode={gameMode}
      />
    </div>
  );
}
