import React, { useState } from 'react';
import {
  Sparkles,
  Trophy,
  ShoppingBag,
  Gift,
  Volume2,
  VolumeX,
  FileCode2,
  Flame,
  Coins,
  Gem,
  GraduationCap,
  LayoutGrid,
  Palette,
  Shield,
  Users,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { GradeLevel, KidProfile, PlayerProfile } from '../types';
import { soundFx } from '../utils/audio';
import { useLanguage } from '../context/LanguageContext';
import { getLanguageDisplayName, getLanguageFlag } from '../utils/subjectEngines';

interface NavbarProps {
  profile: PlayerProfile;
  kids?: KidProfile[];
  activeTab: 'math' | 'achievements' | 'openspec' | 'assets' | 'parents' | string;
  onSelectTab?: (tab: 'math' | 'achievements' | 'openspec' | 'assets' | 'parents') => void;
  setActiveTab?: (tab: string) => void;
  onOpenShop: () => void;
  onOpenDailyQuests: () => void;
  onOpenAchievements?: () => void;
  onOpenRewardChest?: () => void;
  onOpenChest?: () => void;
  onOpenOpenSpec?: () => void;
  onOpenParentCenter: () => void;
  onOpenSkins?: () => void;
  onSwitchKid?: (kidId: string) => void;
  onToggleGrade: (grade: GradeLevel) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  kids = [],
  activeTab,
  onSelectTab,
  setActiveTab,
  onOpenShop,
  onOpenDailyQuests,
  onOpenAchievements,
  onOpenRewardChest,
  onOpenChest,
  onOpenOpenSpec,
  onOpenParentCenter,
  onOpenSkins,
  onSwitchKid,
  onToggleGrade,
  isMuted = false,
  onToggleMute,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [soundOn, setSoundOn] = useState(!isMuted && soundFx.isEnabled());
  const [showKidDropdown, setShowKidDropdown] = useState(false);

  const handleSoundToggle = () => {
    if (onToggleMute) {
      onToggleMute();
      setSoundOn(!soundOn);
    } else {
      const next = soundFx.toggleSound();
      setSoundOn(next);
    }
  };

  const handleTabChange = (tab: 'math' | 'achievements' | 'openspec' | 'assets' | 'parents') => {
    soundFx.playPop();
    if (onSelectTab) onSelectTab(tab);
    if (setActiveTab) setActiveTab(tab);
  };

  const xpPercentage = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));
  const hasUnclaimedQuests = profile.dailyQuests.some((q) => q.completed && !q.claimed);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-6 flex-wrap md:flex-nowrap">
        {/* Brand Logo & Title */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group select-none"
          onClick={() => handleTabChange('math')}
        >
          <div className="w-10 h-10 bg-linear-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.35)] group-hover:scale-105 transition-transform">
            <span className="text-xl font-black italic tracking-tighter text-white">bB</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold tracking-tight text-white">brainBoss</h1>
              <span className="px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded text-[9px] font-mono font-bold tracking-wider uppercase">
                {t.nav.pro}
              </span>
            </div>
            <span className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest font-semibold">
              {t.nav.brandSub}
            </span>
          </div>
        </div>

        {/* Active Kid Profile Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowKidDropdown(!showKidDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 hover:border-indigo-400 text-white transition-all shadow-inner cursor-pointer"
            title={t.nav.switchKid}
          >
            <span className="text-lg">{profile.avatar || '🚀'}</span>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold block leading-tight">{profile.name}</span>
              <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1">
                <span>Lvl {profile.level}</span>
                {profile.targetLanguage && (
                  <span>• {getLanguageFlag(profile.targetLanguage)}</span>
                )}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {showKidDropdown && (
            <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800">
                {t.nav.switchKid}
              </div>
              <div className="space-y-1 my-1 max-h-48 overflow-y-auto">
                {kids.map((kid) => (
                  <button
                    key={kid.id}
                    onClick={() => {
                      setShowKidDropdown(false);
                      if (onSwitchKid) onSwitchKid(kid.id);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      kid.id === profile.id
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{kid.avatar}</span>
                      <span>{kid.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Lvl {kid.level}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowKidDropdown(false);
                  onOpenParentCenter();
                }}
                className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.parentCenter.title}</span>
              </button>
            </div>
          )}
        </div>

        {/* Grade Badge (Set by Parents in Profile - Locked for Kid) */}
        <div
          id="grade-badge-locked"
          onClick={onOpenParentCenter}
          title={language === 'de' ? 'Schulstufe wird von den Eltern im Profil verwaltet (Klicken für Elternbereich)' : 'School grade is configured by parents in profile (Click for Parent Center)'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer order-3 md:order-2 shadow-inner group"
        >
          {profile.gradeLevel === 'primary' ? (
            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
              <span>🎒</span>
              <span>{profile.schoolGrade ? `${profile.schoolGrade}. Schulstufe` : t.nav.primaryGrade}</span>
              <span className="text-[10px] text-slate-500 font-normal">({t.nav.primaryGrade})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold">
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>{profile.schoolGrade ? `${profile.schoolGrade}. Schulstufe` : t.nav.highSchoolGrade}</span>
              <span className="text-[10px] text-slate-500 font-normal">({t.nav.highSchoolGrade})</span>
            </div>
          )}
          <Lock className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors ml-0.5" />
        </div>

        {/* Navigation Tabs (Direct in Nav) */}
        <div className="hidden xl:flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 order-2">
          <button
            onClick={() => handleTabChange('math')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'math'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.nav.questsTab}</span>
          </button>
          <button
            onClick={() => handleTabChange('achievements')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>{t.nav.trophiesTab}</span>
          </button>
          <button
            onClick={() => handleTabChange('openspec')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'openspec'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.nav.openSpecTab}</span>
          </button>
          <button
            onClick={() => handleTabChange('assets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'assets'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>{t.nav.designTokensTab}</span>
          </button>
        </div>

        {/* Player HUD Stats, Language Switcher & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 order-2 md:order-3">
          {/* Skins / UI Theme Button */}
          {onOpenSkins && (
            <button
              id="nav-skins-btn"
              onClick={() => {
                soundFx.playPop();
                onOpenSkins();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600/40 border border-fuchsia-500/40 text-fuchsia-300 font-bold text-xs transition-all shadow-sm cursor-pointer"
              title={language === 'de' ? 'UI Design & Skins' : 'UI Themes & Skins'}
            >
              <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="hidden sm:inline">{language === 'de' ? 'Skins' : 'Skins'}</span>
            </button>
          )}

          {/* Parents Center (Admin Mode) Button */}
          <button
            id="nav-parent-center-btn"
            onClick={() => {
              soundFx.playPop();
              onOpenParentCenter();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 font-bold text-xs transition-all shadow-sm cursor-pointer"
            title={t.parentCenter.title}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">{t.nav.parentAdmin}</span>
          </button>

          {/* Language Switcher Selector (DE / EN) */}
          <div
            id="nav-language-switcher"
            className="flex items-center bg-slate-950/90 p-0.5 rounded-xl border border-slate-800/90 shadow-inner"
            title={t.nav.switchLanguage}
          >
            <button
              id="lang-btn-de"
              onClick={() => {
                soundFx.playPop();
                setLanguage('de');
              }}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                language === 'de'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Deutsch (Standard)"
            >
              <span>🇩🇪</span>
              <span className="hidden sm:inline">DE</span>
            </button>
            <button
              id="lang-btn-en"
              onClick={() => {
                soundFx.playPop();
                setLanguage('en');
              }}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
            >
              <span>🇬🇧</span>
              <span className="hidden sm:inline">EN</span>
            </button>
          </div>

          {/* Level & XP Gauge */}
          <div className="hidden lg:flex flex-col items-end bg-slate-950/60 border border-slate-800/80 px-2.5 py-1 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                Lvl {profile.level}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">
                {profile.xp}/{profile.xpToNextLevel} XP
              </span>
            </div>
            <div className="w-28 h-1.5 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
          </div>

          {/* Currency: Coins */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl text-xs font-mono font-bold text-amber-400 shadow-inner">
            <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            <span>{profile.coins}</span>
          </div>

          {/* Currency: Gems */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl text-xs font-mono font-bold text-cyan-400 shadow-inner">
            <Gem className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
            <span>{profile.gems}</span>
          </div>

          {/* Streak Flame */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl text-xs font-mono font-bold text-orange-400 shadow-inner">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400/30 animate-pulse" />
            <span>{profile.streakDays}d</span>
          </div>

          {/* Daily Quests Button */}
          <button
            id="nav-daily-quests-btn"
            onClick={() => {
              soundFx.playPop();
              onOpenDailyQuests();
            }}
            className="relative p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 hover:border-pink-500/50 text-slate-200 transition-all shadow-md cursor-pointer"
            title={t.nav.dailyQuests}
          >
            <Gift className="w-4 h-4 text-pink-400" />
            {hasUnclaimedQuests && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping" />
            )}
            {hasUnclaimedQuests && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full" />
            )}
          </button>

          {/* Mystery Chest Button */}
          <button
            id="nav-reward-chest-btn"
            onClick={() => {
              soundFx.playPop();
              if (onOpenChest) onOpenChest();
              else if (onOpenRewardChest) onOpenRewardChest();
            }}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 hover:border-amber-500/50 text-amber-400 transition-all shadow-md cursor-pointer"
            title={t.nav.mysteryChest}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>

          {/* Power-up Shop */}
          <button
            id="nav-shop-btn"
            onClick={() => {
              soundFx.playPop();
              onOpenShop();
            }}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 hover:border-indigo-500/50 text-slate-200 transition-all shadow-md cursor-pointer"
            title={t.nav.shop}
          >
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
          </button>

          {/* Sound FX Toggle */}
          <button
            id="nav-sound-toggle-btn"
            onClick={handleSoundToggle}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 text-slate-200 transition-all shadow-md cursor-pointer"
            title={soundOn ? t.nav.soundOn : t.nav.soundMuted}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
