import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  GameMode,
  GradeLevel,
  KidProfile,
  MathTopic,
  ParentConfig,
  PlayerProfile,
  SubjectArea,
  TargetLearnLanguage,
} from './types';
import {
  loadParentConfig,
  saveParentConfig,
  loadPlayerProfile,
  savePlayerProfile,
  addXPAndCoins,
  updateGameStats,
  usePowerUpItem,
  claimDailyQuest,
  getActiveKidProfile,
  fetchRemoteDbData,
} from './utils/storage';
import { soundFx } from './utils/audio';
import { Navbar } from './components/Navbar';
import { MathQuestView } from './components/MathGame/MathQuestView';
import { MathPlayScreen } from './components/MathGame/MathPlayScreen';
import { AiStoryQuestScreen } from './components/MathGame/AiStoryQuestScreen';
import { ClassicColorNumberGame } from './components/BrainGames/ClassicColorNumberGame';
import { MemoryMatrixGame } from './components/BrainGames/MemoryMatrixGame';
import { SpeedStroopGame } from './components/BrainGames/SpeedStroopGame';
import { RewardChestModal } from './components/Rewards/RewardChestModal';
import { DailyQuestsModal } from './components/Rewards/DailyQuestsModal';
import { PowerUpShopModal } from './components/Shop/PowerUpShopModal';
import { AchievementsView } from './components/Achievements/AchievementsView';
import { OpenSpecHub } from './components/OpenSpec/OpenSpecHub';
import { BrandAssetGallery } from './components/VisualAssets/BrandAssetGallery';
import { ParentCenterModal } from './components/ParentCenter/ParentCenterModal';
import { SkinSelectorModal } from './components/Skins/SkinSelectorModal';
import { getSkinTheme, SkinThemeId } from './utils/skins';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { t, language } = useLanguage();
  const [parentConfig, setParentConfig] = useState<ParentConfig>(loadParentConfig);
  const [profile, setProfile] = useState<KidProfile>(() => getActiveKidProfile(loadParentConfig()));
  
  const [activeTab, setActiveTab] = useState<'math' | 'achievements' | 'openspec' | 'assets' | 'parents'>('math');
  const [activeSubject, setActiveSubject] = useState<SubjectArea>('math');
  const [activeGameMode, setActiveGameMode] = useState<GameMode | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<TargetLearnLanguage>(
    profile.targetLanguage || (language === 'de' ? 'en' : 'fr')
  );

  // Modals
  const [showChestModal, setShowChestModal] = useState(false);
  const [showDailyQuestsModal, setShowDailyQuestsModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showParentCenterModal, setShowParentCenterModal] = useState(false);
  const [showSkinModal, setShowSkinModal] = useState(false);

  // Sound Mute State
  const [soundMuted, setSoundMuted] = useState(soundFx.isMuted());

  // Active Skin Object
  const currentSkin = getSkinTheme(profile.skinId || 'cyber_neon');

  // Handle Skin Selection
  const handleSelectSkin = (skinId: SkinThemeId) => {
    soundFx.playCorrect();
    const updatedKid: KidProfile = { ...profile, skinId };
    setProfile(updatedKid);
    savePlayerProfile(updatedKid);
    const updatedKids = parentConfig.kids.map((k) => (k.id === updatedKid.id ? updatedKid : k));
    const updatedConfig = { ...parentConfig, kids: updatedKids };
    setParentConfig(updatedConfig);
    saveParentConfig(updatedConfig);
  };

  // Initial sync with remote PostgreSQL database if hosted
  useEffect(() => {
    fetchRemoteDbData().then((hasUpdates) => {
      if (hasUpdates) {
        const freshConfig = loadParentConfig();
        setParentConfig(freshConfig);
        setProfile(getActiveKidProfile(freshConfig));
      }
    });
  }, []);

  // Keep target language in sync if profile changes
  useEffect(() => {
    if (profile.targetLanguage) {
      setSelectedTargetLanguage(profile.targetLanguage);
    }
  }, [profile.id, profile.targetLanguage]);

  // Toggle Sound
  const handleToggleSound = () => {
    const isMuted = soundFx.toggleMute();
    setSoundMuted(isMuted);
    if (!isMuted) soundFx.playPop();
  };

  // Switch Active Kid Profile
  const handleSwitchKid = (kidId: string) => {
    soundFx.playPop();
    const updatedConfig: ParentConfig = {
      ...parentConfig,
      activeKidId: kidId,
    };
    setParentConfig(updatedConfig);
    saveParentConfig(updatedConfig);
    const kid = updatedConfig.kids.find((k) => k.id === kidId);
    if (kid) {
      setProfile(kid);
      savePlayerProfile(kid);
    }
  };

  // Update Parent Config (from Parent Center)
  const handleUpdateParentConfig = (updated: ParentConfig) => {
    setParentConfig(updated);
    saveParentConfig(updated);
    const activeKid = getActiveKidProfile(updated);
    setProfile(activeKid);
    savePlayerProfile(activeKid);
  };

  // Toggle Grade Level (Primary vs High School)
  const handleToggleGrade = (grade: GradeLevel) => {
    soundFx.playPop();
    const updatedKid: KidProfile = { ...profile, gradeLevel: grade };
    setProfile(updatedKid);
    savePlayerProfile(updatedKid);
    // Also sync in parentConfig
    const updatedKids = parentConfig.kids.map((k) => (k.id === updatedKid.id ? updatedKid : k));
    const updatedConfig = { ...parentConfig, kids: updatedKids };
    setParentConfig(updatedConfig);
    saveParentConfig(updatedConfig);
  };

  // Start a specific Game across any subject
  const handleStartGame = (
    mode: GameMode,
    topic: string = 'all',
    subject: SubjectArea = activeSubject,
    targetLang?: TargetLearnLanguage
  ) => {
    setSelectedTopic(topic);
    setActiveSubject(subject);
    if (targetLang) {
      setSelectedTargetLanguage(targetLang);
    }
    setActiveGameMode(mode);
  };

  // Exit from active game to main screen
  const handleExitGame = () => {
    setActiveGameMode(null);
  };

  // Update stats from gameplay
  const handleUpdateGameplayStats = (
    xpEarned: number,
    coinsEarned: number,
    isCorrect: boolean,
    mode: GameMode,
    score?: number
  ) => {
    let updated = profile;
    if (xpEarned > 0 || coinsEarned > 0) {
      const result = addXPAndCoins(updated, xpEarned, coinsEarned);
      updated = result.profile as KidProfile;

      // Check level up celebration
      if (result.leveledUp) {
        soundFx.playLevelUp();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
        });
      }
    }

    updated = updateGameStats(updated, isCorrect, mode, score) as KidProfile;
    setProfile(updated);

    // Sync in parent config list
    const updatedKids = parentConfig.kids.map((k) => (k.id === updated.id ? updated : k));
    const updatedConfig = { ...parentConfig, kids: updatedKids };
    setParentConfig(updatedConfig);
    saveParentConfig(updatedConfig);
  };

  // Use power-up item
  const handleUsePowerUp = (powerUpKey: keyof PlayerProfile['powerUps']): boolean => {
    const { profile: updated, success } = usePowerUpItem(profile, powerUpKey);
    if (success) {
      const updatedKid = updated as KidProfile;
      setProfile(updatedKid);
      const updatedKids = parentConfig.kids.map((k) => (k.id === updatedKid.id ? updatedKid : k));
      const updatedConfig = { ...parentConfig, kids: updatedKids };
      setParentConfig(updatedConfig);
      saveParentConfig(updatedConfig);
    }
    return success;
  };

  // Buy power-up from Shop
  const handleBuyPowerUp = (
    powerUpKey: keyof PlayerProfile['powerUps'],
    costCoins: number,
    costGems: number
  ) => {
    if (profile.coins < costCoins || profile.gems < costGems) return;

    const updated: KidProfile = {
      ...profile,
      coins: profile.coins - costCoins,
      gems: profile.gems - costGems,
      powerUps: {
        ...profile.powerUps,
        [powerUpKey]: (profile.powerUps[powerUpKey] || 0) + 1,
      },
    };
    setProfile(updated);
    savePlayerProfile(updated);

    const updatedKids = parentConfig.kids.map((k) => (k.id === updated.id ? updated : k));
    const updatedConfig = { ...parentConfig, kids: updatedKids };
    setParentConfig(updatedConfig);
    saveParentConfig(updatedConfig);
  };

  // Award loot from chest
  const handleAwardChestLoot = (
    coinDelta: number,
    gemDelta: number,
    powerUp?: keyof PlayerProfile['powerUps']
  ) => {
    const updated: KidProfile = {
      ...profile,
      coins: Math.max(0, profile.coins + coinDelta),
      gems: profile.gems + gemDelta,
      powerUps: powerUp
        ? {
            ...profile.powerUps,
            [powerUp]: (profile.powerUps[powerUp] || 0) + 1,
          }
        : profile.powerUps,
    };
    setProfile(updated);
    savePlayerProfile(updated);

    const updatedKids = parentConfig.kids.map((k) => (k.id === updated.id ? updated : k));
    const updatedConfig = { ...parentConfig, kids: updatedKids };
    setParentConfig(updatedConfig);
    saveParentConfig(updatedConfig);
  };

  // Claim Daily Quest
  const handleClaimDailyQuest = (questId: string) => {
    const updated = claimDailyQuest(profile, questId) as KidProfile;
    setProfile(updated);
    const updatedKids = parentConfig.kids.map((k) => (k.id === updated.id ? updated : k));
    const updatedConfig = { ...parentConfig, kids: updatedKids };
    setParentConfig(updatedConfig);
    saveParentConfig(updatedConfig);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500 selection:text-slate-950 flex flex-col relative overflow-x-hidden">
      {/* Immersive Ambient Glow Backdrop */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20 z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 25%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 75%, #8b5cf6 0%, transparent 50%), radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 60%)',
        }}
      />

      {/* Universal Top Navigation with Profile Switcher & Parents Center */}
      <Navbar
        profile={profile}
        kids={parentConfig.kids}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveGameMode(null);
          setActiveTab(tab);
        }}
        onSwitchKid={handleSwitchKid}
        onOpenParentCenter={() => {
          soundFx.playPop();
          setShowParentCenterModal(true);
        }}
        onOpenSkins={() => {
          soundFx.playPop();
          setShowSkinModal(true);
        }}
        onToggleGrade={handleToggleGrade}
        onOpenChest={() => {
          soundFx.playPop();
          setShowChestModal(true);
        }}
        onOpenDailyQuests={() => {
          soundFx.playPop();
          setShowDailyQuestsModal(true);
        }}
        onOpenShop={() => {
          soundFx.playPop();
          setShowShopModal(true);
        }}
        isMuted={soundMuted}
        onToggleMute={handleToggleSound}
      />

      {/* Main Container Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-5 pb-8 relative z-10">
        {/* Active Game Views */}
        {activeGameMode === 'math_quest' ||
        activeGameMode === 'nature_quest' ||
        activeGameMode === 'geo_quest' ||
        activeGameMode === 'art_quest' ||
        activeGameMode === 'language_quest' ||
        activeGameMode === 'speed_sprint' ||
        activeGameMode === 'vocab_sprint' ||
        activeGameMode === 'survival_hearts' ||
        activeGameMode === 'boss_battle' ? (
          <MathPlayScreen
            profile={profile}
            mode={activeGameMode}
            subject={activeSubject}
            topic={selectedTopic}
            targetLanguage={selectedTargetLanguage}
            onExit={handleExitGame}
            onUpdateStats={handleUpdateGameplayStats}
            onUsePowerUp={handleUsePowerUp}
          />
        ) : activeGameMode === 'ai_story' ? (
          <AiStoryQuestScreen
            profile={profile}
            onExit={handleExitGame}
            onUpdateStats={handleUpdateGameplayStats}
          />
        ) : activeGameMode === 'classic_color_number' ? (
          <ClassicColorNumberGame
            profile={profile}
            onExit={handleExitGame}
            onUpdateStats={handleUpdateGameplayStats}
          />
        ) : activeGameMode === 'memory_matrix' ? (
          <MemoryMatrixGame
            profile={profile}
            onExit={handleExitGame}
            onUpdateStats={handleUpdateGameplayStats}
          />
        ) : activeGameMode === 'speed_stroop' ? (
          <SpeedStroopGame
            profile={profile}
            onExit={handleExitGame}
            onUpdateStats={handleUpdateGameplayStats}
          />
        ) : (
          /* Primary Tabs Views */
          <div>
            {activeTab === 'math' && (
              <MathQuestView
                profile={profile}
                activeSubject={activeSubject}
                onSelectSubject={setActiveSubject}
                onStartGame={handleStartGame}
                onOpenAiStory={() => setActiveGameMode('ai_story')}
                onUpdateTargetLanguage={(lang) => {
                  setSelectedTargetLanguage(lang);
                  const updatedKid: KidProfile = { ...profile, targetLanguage: lang };
                  setProfile(updatedKid);
                  savePlayerProfile(updatedKid);
                  const updatedKids = parentConfig.kids.map((k) =>
                    k.id === updatedKid.id ? updatedKid : k
                  );
                  const updatedConfig = { ...parentConfig, kids: updatedKids };
                  setParentConfig(updatedConfig);
                  saveParentConfig(updatedConfig);
                }}
              />
            )}
            {activeTab === 'achievements' && <AchievementsView profile={profile} />}
            {activeTab === 'openspec' && <OpenSpecHub />}
            {activeTab === 'assets' && <BrandAssetGallery />}
          </div>
        )}
      </main>

      {/* Mission Controller Intel Footer */}
      <footer className="h-14 bg-slate-950/90 border-t border-slate-800/80 px-4 sm:px-8 flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase tracking-[0.2em] relative z-10">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t.footer.missionControl}</span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:inline text-cyan-400 font-bold">
            {profile.gradeLevel === 'primary' ? t.footer.primaryRecon : t.footer.highSchoolRecon}
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-slate-500">
          <button
            onClick={() => setShowParentCenterModal(true)}
            className="hidden sm:flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
          >
            <span>🛡️</span>
            <span>{t.parentCenter.title}</span>
          </button>
          <span className="hover:text-cyan-400 transition-colors">{t.footer.openSpecReady}</span>
          <span className="text-slate-600">v3.0.0 Multi-Subject</span>
        </div>
      </footer>

      {/* Modals */}
      <ParentCenterModal
        isOpen={showParentCenterModal}
        onClose={() => setShowParentCenterModal(false)}
        config={parentConfig}
        onUpdateConfig={handleUpdateParentConfig}
        onSwitchKid={handleSwitchKid}
        onProfileUpdated={(activeKid) => {
          setProfile(activeKid);
          savePlayerProfile(activeKid);
        }}
      />

      <RewardChestModal
        isOpen={showChestModal}
        onClose={() => setShowChestModal(false)}
        profile={profile}
        onAwardLoot={handleAwardChestLoot}
      />

      <DailyQuestsModal
        isOpen={showDailyQuestsModal}
        onClose={() => setShowDailyQuestsModal(false)}
        profile={profile}
        onClaimQuest={handleClaimDailyQuest}
      />

      <PowerUpShopModal
        isOpen={showShopModal}
        onClose={() => setShowShopModal(false)}
        profile={profile}
        onBuyPowerUp={handleBuyPowerUp}
      />

      <SkinSelectorModal
        isOpen={showSkinModal}
        onClose={() => setShowSkinModal(false)}
        activeKid={profile}
        onSelectSkin={handleSelectSkin}
      />
    </div>
  );
}
