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
  ChevronDown,
  Lock,
  Menu,
  X,
  Globe,
  SlidersHorizontal,
  Check,
  Award,
  LogOut,
  User,
} from 'lucide-react';
import { GradeLevel, KidProfile, PlayerProfile } from '../types';
import { soundFx } from '../utils/audio';
import { useLanguage } from '../context/LanguageContext';
import { getLanguageFlag } from '../utils/subjectEngines';

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
  userEmail?: string | null;
  isChildMode?: boolean;
  onSignOut?: () => void;
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
  userEmail,
  isChildMode = false,
  onSignOut,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [soundOn, setSoundOn] = useState(!isMuted && soundFx.isEnabled());
  const [showKidDropdown, setShowKidDropdown] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  const handleSoundToggle = () => {
    soundFx.playPop();
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
    setShowSettingsDrawer(false);
  };

  const xpPercentage = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));
  const hasUnclaimedQuests = profile.dailyQuests.some((q) => q.completed && !q.claimed);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Kid Avatar Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none group"
            onClick={() => handleTabChange('math')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-linear-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:scale-105 transition-transform">
              <span className="text-lg sm:text-xl font-black italic tracking-tighter text-white">bB</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">brainBoss</h1>
                <span className="px-1.5 py-0.2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded text-[9px] font-mono font-bold tracking-wider uppercase">
                  {t.nav.pro}
                </span>
              </div>
              <span className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest font-semibold">
                {t.nav.brandSub}
              </span>
            </div>
          </div>

          {/* Active Kid Profile Quick Switcher */}
          <div className="relative">
            <button
              id="nav-kid-switcher"
              onClick={() => setShowKidDropdown(!showKidDropdown)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 hover:border-indigo-400 text-white transition-all shadow-inner cursor-pointer"
              title={t.nav.switchKid}
            >
              <span className="text-base sm:text-lg">{profile.avatar || '🚀'}</span>
              <div className="text-left">
                <span className="text-xs font-bold block leading-tight truncate max-w-[80px] sm:max-w-[110px]">
                  {profile.name}
                </span>
                <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1">
                  <span>Lvl {profile.level}</span>
                  {profile.targetLanguage && (
                    <span className="hidden sm:inline">• {getLanguageFlag(profile.targetLanguage)}</span>
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
                        <span className="font-bold">{kid.name}</span>
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
                  className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 text-xs font-bold border border-indigo-500/40 transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.parentCenter.title}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <div className="hidden lg:flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => handleTabChange('math')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'math'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t.nav.questsTab}</span>
          </button>
          <button
            onClick={() => handleTabChange('achievements')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.nav.trophiesTab}</span>
          </button>
          <button
            onClick={() => handleTabChange('openspec')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'openspec'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>OpenSpec</span>
          </button>
        </div>

        {/* Right: Currency HUD, Reward Actions & Settings Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Unified Compact Player Currencies Capsule */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 bg-slate-950/80 border border-slate-800/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-inner text-xs font-mono font-bold">
            {/* Streak */}
            <div className="flex items-center gap-1 text-orange-400" title="Tages-Serie">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400/30 animate-pulse" />
              <span>{profile.streakDays}d</span>
            </div>
            <span className="text-slate-700">|</span>
            {/* Coins */}
            <div className="flex items-center gap-1 text-amber-400" title="Münzen">
              <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
              <span>{profile.coins}</span>
            </div>
            <span className="text-slate-700">|</span>
            {/* Gems */}
            <div className="flex items-center gap-1 text-cyan-400" title="Edelsteine">
              <Gem className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
              <span>{profile.gems}</span>
            </div>
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

          {/* Menu & Settings Toggle Button (Consolidates Audio, Lang, Skins, Parents) */}
          <button
            id="nav-menu-settings-btn"
            onClick={() => {
              soundFx.playPop();
              setShowSettingsDrawer(!showSettingsDrawer);
            }}
            className={`p-2 rounded-xl border transition-all shadow-md cursor-pointer ${
              showSettingsDrawer
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700/60 text-slate-200'
            }`}
            title={t.nav.menu}
          >
            {showSettingsDrawer ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Settings & Extra Options Modal Drawer */}
      {showSettingsDrawer && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
          onClick={() => setShowSettingsDrawer(false)}
        >
          <div
            className="w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{t.nav.menu}</h3>
                    <p className="text-[10px] font-mono text-slate-400">{profile.name} (Lvl {profile.level})</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* XP Level Progress Bar */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Level {profile.level}</span>
                  <span className="font-mono text-cyan-400">{profile.xp} / {profile.xpToNextLevel} XP</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${xpPercentage}%` }}
                  />
                </div>
              </div>

              {/* Quick Settings Group */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Grundeinstellungen
                </span>

                {/* Sound Audio FX Toggle */}
                <button
                  onClick={handleSoundToggle}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {soundOn ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-white block">Soundeffekte</span>
                      <span className="text-[10px] text-slate-400">{soundOn ? t.nav.soundOn : t.nav.soundMuted}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    soundOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {soundOn ? 'AN' : 'AUS'}
                  </span>
                </button>

                {/* App Mother Tongue Language Switcher */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>{t.nav.language}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        soundFx.playPop();
                        setLanguage('de');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        language === 'de'
                          ? 'bg-cyan-600/30 border-cyan-400 text-cyan-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🇩🇪</span>
                      <span>Deutsch</span>
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playPop();
                        setLanguage('en');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        language === 'en'
                          ? 'bg-cyan-600/30 border-cyan-400 text-cyan-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🇬🇧</span>
                      <span>English</span>
                    </button>
                  </div>
                </div>

                {/* UI Theme Skins */}
                {onOpenSkins && (
                  <button
                    onClick={() => {
                      setShowSettingsDrawer(false);
                      onOpenSkins();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-fuchsia-950/30 hover:bg-fuchsia-900/40 border border-fuchsia-500/30 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Palette className="w-4 h-4 text-fuchsia-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">Design & Skins</span>
                        <span className="text-[10px] text-fuchsia-300">Cyber Neon, Pixel Retro & mehr</span>
                      </div>
                    </div>
                    <span className="text-xs text-fuchsia-400 font-bold">&rarr;</span>
                  </button>
                )}
              </div>

              {/* Management & Admin Section */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Eltern & Verwaltung
                </span>

                {/* Parent Center Admin Button */}
                <button
                  onClick={() => {
                    setShowSettingsDrawer(false);
                    onOpenParentCenter();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/40 text-left transition-colors cursor-pointer shadow-lg"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{t.parentCenter.title}</span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-[9px] font-mono text-indigo-300 font-bold">
                          PIN
                        </span>
                      </div>
                      <span className="text-[10px] text-indigo-300">
                        {profile.schoolGrade ? `${profile.schoolGrade}. Schulstufe` : (profile.gradeLevel === 'primary' ? 'Grundstufe' : 'Mittelschule')} • Schulbuch-Scanner
                      </span>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-indigo-400" />
                </button>

                {/* Hall of Fame & Trophies */}
                <button
                  onClick={() => handleTabChange('achievements')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">{t.nav.trophiesTab}</span>
                      <span className="text-[10px] text-slate-400">Erfolge & Ruhmeshalle</span>
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 font-bold">&rarr;</span>
                </button>

                {/* OpenSpec Hub */}
                <button
                  onClick={() => handleTabChange('openspec')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FileCode2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">OpenSpec Studio</span>
                      <span className="text-[10px] text-slate-400">Pädagogische Spezifikation & Prompts</span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">&rarr;</span>
                </button>
              </div>

              {/* Account / Auth Session Info */}
              {(userEmail || isChildMode || onSignOut) && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Angemeldet als
                  </span>
                  <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-300 text-sm">
                        {isChildMode ? (profile.avatar || '🧒') : <User className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">
                          {isChildMode ? `${profile.name} (Kind-Modus)` : (userEmail || 'Eltern / Admin')}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {isChildMode ? `Klasse ${profile.schoolClass || '2A'}` : 'Google Auth'}
                        </span>
                      </div>
                    </div>

                    {onSignOut && (
                      <button
                        onClick={() => {
                          soundFx.playPop();
                          setShowSettingsDrawer(false);
                          onSignOut();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                        title="Abmelden"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Abmelden</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                brainBoss v3.0.0 Pro • Local First
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
