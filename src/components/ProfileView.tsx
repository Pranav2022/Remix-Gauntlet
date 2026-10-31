import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { saveStoredProfile } from '../utils/progression';
import { Award, Shield, Zap, Skull, Trophy, Check, UserCheck, Flame } from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onBackToLobby: () => void;
}

const AVATAR_OPTIONS = [
  { id: 'cyber_runner', label: 'Cyber Runner', desc: 'Speed and kinetic reflex specialist' },
  { id: 'mutant_subject', label: 'Subject 89', desc: 'Genetically altered platform jumper' },
  { id: 'stealth_ghost', label: 'Stealth Ghost', desc: 'Shadow infiltrator & vent crawler' },
  { id: 'vault_specialist', label: 'Master Cracker', desc: 'Electronic security bypass expert' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  onBackToLobby,
}) => {
  const [name, setName] = useState(profile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    const updated: UserProfile = {
      ...profile,
      name,
      avatar: selectedAvatar,
    };
    saveStoredProfile(updated);
    onUpdateProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-xl shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl font-black text-cyan-300 font-mono">
                {name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                OPERATIVE DOSSIER · TIER {profile.levelTier}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {profile.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Identity Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Codename
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Avatar Archetype
            </label>
            <select
              value={selectedAvatar}
              onChange={e => setSelectedAvatar(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
            >
              {AVATAR_OPTIONS.map(a => (
                <option key={a.id} value={a.id}>
                  {a.label} — {a.desc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Combat & Architecture Career Records */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Matches
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {profile.matchesPlayed}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            Runs Conquered
          </div>
          <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
            {profile.runsCompleted}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            Traps Mastered
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-1">
            {profile.trapsMastered}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            Architect Rating
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {profile.designerRating}
          </div>
        </div>
      </div>

      {/* Unlocked Badges */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="text-xs font-mono uppercase tracking-widest text-slate-400">
          ACHIEVEMENT MEDALS
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.unlockedBadges.map(badge => (
            <div
              key={badge}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200 flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{badge}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-start">
        <button
          onClick={onBackToLobby}
          className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          ← Return to Lobby
        </button>
      </div>
    </div>
  );
};
