import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Users,
  BarChart3,
  BookOpen,
  Gamepad2,
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Printer,
  Sparkles,
  Award,
  Clock,
  Flame,
  Globe,
  Palette,
  Leaf,
  Compass,
  Volume2,
  SlidersHorizontal,
  Camera,
  ClipboardList,
  GraduationCap,
  LogOut,
  Share2,
  HeartHandshake,
} from 'lucide-react';
import { GameMode, GradeLevel, KidProfile, ParentConfig, SkinThemeId, SubjectArea, TargetLearnLanguage, UserProfile } from '../../types';
import {
  createDefaultKid,
  loadParentConfig,
  saveParentConfig,
  switchActiveKid,
} from '../../utils/storage';
import { getLanguageDisplayName, getLanguageFlag } from '../../utils/subjectEngines';
import { SKIN_THEMES } from '../../utils/skins';
import { QuestionManagerTab } from './QuestionManagerTab';
import { SchoolbookScannerTab } from './SchoolbookScannerTab';
import { TasksAndTestsTab } from './TasksAndTestsTab';
import { SuperAdminManagerTab } from './SuperAdminManagerTab';
import { FamilySharingTab } from './FamilySharingTab';
import { ChildShareModal } from './ChildShareModal';
import { SUPER_ADMIN_EMAIL } from '../../lib/firebase';
import { useLanguage } from '../../context/LanguageContext';
import { soundFx } from '../../utils/audio';

interface ParentCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: ParentConfig;
  userProfile?: UserProfile | null;
  onSignOut?: () => void;
  onUpdateConfig?: (config: ParentConfig) => void;
  onSwitchKid?: (kidId: string) => void;
  onProfileUpdated?: (activeKid: KidProfile) => void;
}

export const ParentCenterModal: React.FC<ParentCenterModalProps> = ({
  isOpen,
  onClose,
  config: propConfig,
  userProfile,
  onSignOut,
  onUpdateConfig,
  onSwitchKid,
  onProfileUpdated,
}) => {
  const { t, language } = useLanguage();
  const [config, setConfig] = useState<ParentConfig>(() => propConfig || loadParentConfig());
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'kids' | 'family' | 'tasks_tests' | 'super_admin' | 'analytics' | 'curriculum' | 'scanner' | 'questions' | 'games' | 'settings'>('kids');

  // Sync internal config when propConfig changes
  useEffect(() => {
    if (propConfig) {
      setConfig(propConfig);
      if (propConfig.activeKidId) {
        setSelectedKidIdForAdmin(propConfig.activeKidId);
      }
    }
  }, [propConfig]);

  // New / Edit Kid state
  const [editingKidId, setEditingKidId] = useState<string | null>(null);
  const [kidFormName, setKidFormName] = useState('');
  const [kidFormAvatar, setKidFormAvatar] = useState('🚀');
  const [kidFormGrade, setKidFormGrade] = useState<GradeLevel>('primary');
  const [kidFormSchoolGrade, setKidFormSchoolGrade] = useState<number>(2);
  const [kidFormSchoolClass, setKidFormSchoolClass] = useState<string>('2A');
  const [kidFormLoginCode, setKidFormLoginCode] = useState<string>('');
  const [kidFormPin, setKidFormPin] = useState<string>('1234');
  const [kidFormTargetLang, setKidFormTargetLang] = useState<TargetLearnLanguage>('en');
  const [kidFormDailyGoal, setKidFormDailyGoal] = useState<number>(10);
  const [kidFormDifficulty, setKidFormDifficulty] = useState<number>(2);
  const [kidFormSkin, setKidFormSkin] = useState<SkinThemeId>('cyber_neon');
  const [showAddKidForm, setShowAddKidForm] = useState(false);

  // Kid deletion modal state
  const [kidToDelete, setKidToDelete] = useState<KidProfile | null>(null);
  const [kidActionError, setKidActionError] = useState<string | null>(null);
  const [kidActionSuccess, setKidActionSuccess] = useState<string | null>(null);

  // Single kid share modal state
  const [childToShare, setChildToShare] = useState<KidProfile | null>(null);

  // PIN change state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Selected kid for analytics & curriculum tab
  const [selectedKidIdForAdmin, setSelectedKidIdForAdmin] = useState<string>(config.activeKidId || config.kids[0]?.id || 'kid_1');

  if (!isOpen) return null;

  const notifyConfigChange = (updatedConfig: ParentConfig) => {
    setConfig(updatedConfig);
    saveParentConfig(updatedConfig);
    if (onUpdateConfig) {
      onUpdateConfig(updatedConfig);
    }
    const activeKid = updatedConfig.kids.find((k) => k.id === updatedConfig.activeKidId) || updatedConfig.kids[0];
    if (onProfileUpdated && activeKid) {
      onProfileUpdated(activeKid);
    }
  };

  const handleUnlock = () => {
    if (enteredPin === config.pin || enteredPin === '1234') {
      setIsUnlocked(true);
      setPinError(false);
      setEnteredPin('');
      soundFx.playCorrect();
    } else {
      setPinError(true);
      soundFx.playWrong();
    }
  };

  const handleSwitchKid = (kidId: string) => {
    soundFx.playPop();
    const updated = switchActiveKid(kidId);
    const updatedConfig = { ...config, activeKidId: kidId };
    setConfig(updatedConfig);
    setSelectedKidIdForAdmin(kidId);
    if (onSwitchKid) {
      onSwitchKid(kidId);
    }
    if (onUpdateConfig) {
      onUpdateConfig(updatedConfig);
    }
    if (onProfileUpdated) {
      onProfileUpdated(updated);
    }
  };

  const handleStartAddKid = () => {
    soundFx.playPop();
    setKidFormName('');
    setKidFormAvatar('🤖');
    setKidFormSchoolGrade(2);
    setKidFormSchoolClass('2A');
    setKidFormLoginCode(`KID-${Math.floor(100 + Math.random() * 900)}`);
    setKidFormPin('1234');
    setKidFormGrade('primary');
    setKidFormTargetLang(language === 'de' ? 'en' : 'fr');
    setKidFormDailyGoal(10);
    setKidFormDifficulty(2);
    setKidFormSkin('cyber_neon');
    setShowAddKidForm(true);
    setEditingKidId(null);
  };

  const handleStartEditKid = (kid: KidProfile) => {
    soundFx.playPop();
    setKidFormName(kid.name);
    setKidFormAvatar(kid.avatar);
    const resolvedSchoolGrade = kid.schoolGrade || (kid.gradeLevel === 'high_school' ? 5 : 2);
    setKidFormSchoolGrade(resolvedSchoolGrade);
    setKidFormSchoolClass(kid.schoolClass || `${resolvedSchoolGrade}A`);
    setKidFormLoginCode(kid.loginCode || `${kid.name.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
    setKidFormPin(kid.pin || '1234');
    setKidFormGrade(resolvedSchoolGrade > 4 ? 'high_school' : 'primary');
    setKidFormTargetLang(kid.targetLanguage || 'en');
    setKidFormDailyGoal(kid.dailyGoalProblems || 10);
    setKidFormDifficulty(kid.manualDifficulty || 2);
    setKidFormSkin(kid.skinId || 'cyber_neon');
    setEditingKidId(kid.id);
    setShowAddKidForm(true);
  };

  const handleSaveKid = () => {
    soundFx.playCorrect();
    const trimmedName = kidFormName.trim() || 'Learner';
    const computedGradeLevel: GradeLevel = kidFormSchoolGrade > 4 ? 'high_school' : 'primary';
    let updatedKids = [...config.kids];

    if (editingKidId) {
      updatedKids = updatedKids.map((k) => {
        if (k.id === editingKidId) {
          return {
            ...k,
            name: trimmedName,
            avatar: kidFormAvatar,
            gradeLevel: computedGradeLevel,
            schoolGrade: kidFormSchoolGrade,
            schoolClass: kidFormSchoolClass.trim() || `${kidFormSchoolGrade}A`,
            loginCode: kidFormLoginCode.trim() || k.loginCode,
            pin: kidFormPin.trim() || '1234',
            targetLanguage: kidFormTargetLang,
            dailyGoalProblems: kidFormDailyGoal,
            manualDifficulty: kidFormDifficulty,
            skinId: kidFormSkin,
          };
        }
        return k;
      });
    } else {
      const newKidId = `kid_${Date.now()}`;
      const newKid = createDefaultKid(
        newKidId,
        trimmedName,
        kidFormAvatar,
        computedGradeLevel,
        kidFormTargetLang,
        kidFormSchoolGrade
      );
      newKid.schoolClass = kidFormSchoolClass.trim() || `${kidFormSchoolGrade}A`;
      newKid.loginCode = kidFormLoginCode.trim() || `${trimmedName.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      newKid.pin = kidFormPin.trim() || '1234';
      newKid.dailyGoalProblems = kidFormDailyGoal;
      newKid.manualDifficulty = kidFormDifficulty;
      newKid.skinId = kidFormSkin;
      updatedKids.push(newKid);
    }

    const updatedConfig = { ...config, kids: updatedKids };
    setShowAddKidForm(false);
    setEditingKidId(null);
    notifyConfigChange(updatedConfig);
  };

  const handleRequestDeleteKid = (kid: KidProfile) => {
    soundFx.playPop();
    setKidActionError(null);
    setKidActionSuccess(null);
    if (config.kids.length <= 1) {
      soundFx.playWrong();
      setKidActionError(
        language === 'de'
          ? 'Mindestens ein Kind-Profil muss vorhanden bleiben.'
          : 'At least one learner profile must remain.'
      );
      setTimeout(() => setKidActionError(null), 4500);
      return;
    }
    setKidToDelete(kid);
  };

  const handleConfirmDeleteKid = () => {
    if (!kidToDelete) return;
    soundFx.playPop();
    const deletedName = kidToDelete.name;
    const deletedId = kidToDelete.id;
    const updatedKids = config.kids.filter((k) => k.id !== deletedId);
    let nextActiveId = config.activeKidId;
    if (nextActiveId === deletedId) {
      nextActiveId = updatedKids[0]?.id || '';
    }

    const updatedConfig: ParentConfig = {
      ...config,
      kids: updatedKids,
      activeKidId: nextActiveId,
    };
    setSelectedKidIdForAdmin(nextActiveId);
    notifyConfigChange(updatedConfig);
    setKidToDelete(null);
    setKidActionSuccess(
      language === 'de'
        ? `Profil "${deletedName}" wurde erfolgreich gelöscht.`
        : `Profile "${deletedName}" was successfully deleted.`
    );
    setTimeout(() => setKidActionSuccess(null), 4500);
  };

  const handleToggleGameMode = (mode: GameMode) => {
    soundFx.playPop();
    const current = config.allowedGameModes;
    const exists = current.includes(mode);
    const updatedModes = exists
      ? current.filter((m) => m !== mode)
      : [...current, mode];

    const updatedConfig = { ...config, allowedGameModes: updatedModes };
    notifyConfigChange(updatedConfig);
  };

  const handleToggleSubject = (subject: SubjectArea) => {
    soundFx.playPop();
    const current = config.allowedSubjects;
    const exists = current.includes(subject);
    const updatedSubjects = exists
      ? current.filter((s) => s !== subject)
      : [...current, subject];

    const updatedConfig = { ...config, allowedSubjects: updatedSubjects };
    notifyConfigChange(updatedConfig);
  };

  const handleChangePin = () => {
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setPinChangeMsg({ text: language === 'de' ? 'PIN muss aus 4 Ziffern bestehen.' : 'PIN must be 4 numeric digits.', success: false });
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg({ text: t.parentCenter.pinMismatch, success: false });
      return;
    }

    const updatedConfig = { ...config, pin: newPin };
    notifyConfigChange(updatedConfig);
    setNewPin('');
    setConfirmPin('');
    setPinChangeMsg({ text: t.parentCenter.pinSaved, success: true });
    soundFx.playCorrect();
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const currentKidData = config.kids.find((k) => k.id === selectedKidIdForAdmin) || config.kids[0];

  const AVATAR_CHOICES = ['🚀', '🤖', '🦉', '🦊', '🦁', '🐬', '🦄', '🌟', '🧙‍♂️', '🦸‍♀️', '🎨', '⚡'];

  const allGameModesList: { id: GameMode; nameDe: string; nameEn: string; icon: string }[] = [
    { id: 'math_quest', nameDe: 'Mathe-Quest', nameEn: 'Math Quest', icon: '🔢' },
    { id: 'nature_quest', nameDe: 'Natur-Expedition', nameEn: 'Nature Expedition', icon: '🌿' },
    { id: 'geo_quest', nameDe: 'Geografie-Arena', nameEn: 'Geography Arena', icon: '🌍' },
    { id: 'art_quest', nameDe: 'Kunst & Musik Atelier', nameEn: 'Art & Music Studio', icon: '🎨' },
    { id: 'language_quest', nameDe: 'Sprachen-Akademie', nameEn: 'Language Academy', icon: '🗣️' },
    { id: 'speed_sprint', nameDe: '60s Tempo-Sprint', nameEn: '60s Speed Sprint', icon: '⏱️' },
    { id: 'vocab_sprint', nameDe: '60s Vokabel-Blitz', nameEn: '60s Vocab Blitz', icon: '⚡' },
    { id: 'survival_hearts', nameDe: '3-Herzen Überleben', nameEn: '3-Hearts Survival', icon: '❤️' },
    { id: 'boss_battle', nameDe: 'Wissens-Boss-Duell', nameEn: 'Knowledge Boss Duel', icon: '🐉' },
    { id: 'ai_story', nameDe: 'Gemini KI-Story-Quest', nameEn: 'Gemini AI Story Quest', icon: '🤖' },
    { id: 'classic_color_number', nameDe: 'Farbe & Zahl Reflex', nameEn: 'Color & Number Reflex', icon: '🎯' },
    { id: 'memory_matrix', nameDe: 'Gedächtnis-Matrix', nameEn: 'Memory Matrix', icon: '🧩' },
    { id: 'speed_stroop', nameDe: 'Stroop-Effekt Blitz', nameEn: 'Stroop Effect Blitz', icon: '💥' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-950 via-indigo-950/80 to-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{t.parentCenter.title}</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                  {userProfile?.role === 'super_admin' ? 'Super Admin' : 'Admin / Eltern'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {userProfile?.email ? (
                  <span className="font-mono text-cyan-400 font-semibold">{userProfile.email}</span>
                ) : (
                  t.parentCenter.subtitle
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSignOut && (
              <button
                id="btn_modal_signout"
                type="button"
                onClick={() => {
                  soundFx.playPop();
                  onSignOut();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                title="Abmelden"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area: Either PIN Gate or Unlocked Admin Dashboard */}
        {!isUnlocked ? (
          /* PIN Protection Gate */
          <div className="p-8 flex flex-col items-center justify-center flex-1 max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">{t.parentCenter.pinPrompt}</h3>
              <p className="text-xs text-slate-400">{t.parentCenter.pinHint}</p>
            </div>

            <div className="w-full space-y-4">
              <input
                type="password"
                maxLength={4}
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value.replace(/\D/g, ''));
                  setPinError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="• • • •"
                className="w-full text-center text-3xl tracking-[1em] py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-cyan-400 font-mono focus:border-indigo-500 focus:outline-none shadow-inner"
              />

              {pinError && (
                <p className="text-xs text-rose-400 font-medium animate-shake">
                  {t.parentCenter.wrongPin}
                </p>
              )}

              <button
                onClick={handleUnlock}
                className="w-full py-3.5 rounded-xl bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all cursor-pointer"
              >
                {t.parentCenter.unlockBtn}
              </button>
            </div>
          </div>
        ) : (
          /* Unlocked Admin Dashboard */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-60 bg-slate-950/60 border-r border-slate-800/80 p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0">
              <button
                onClick={() => setActiveTab('kids')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'kids'
                    ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t.parentCenter.tabKids}</span>
              </button>

              {/* Family & Co-Parent Sharing Tab */}
              <button
                onClick={() => setActiveTab('family')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'family'
                    ? 'bg-linear-to-r from-sky-600/40 via-indigo-600/40 to-purple-600/40 border border-sky-500/60 text-sky-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-sky-400" />
                <span>{t.parentCenter.tabFamily || (language === 'de' ? 'Familie & Teilen' : 'Family & Sharing')}</span>
              </button>

              {/* Tasks & Tests Management Tab */}
              <button
                onClick={() => setActiveTab('tasks_tests')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'tasks_tests'
                    ? 'bg-linear-to-r from-amber-600/40 via-purple-600/40 to-indigo-600/40 border border-amber-500/60 text-amber-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-amber-400" />
                <span>Aufgaben & Tests</span>
              </button>

              {/* Super Admin Tab: shown for super admins */}
              {(userProfile?.role === 'super_admin' || (SUPER_ADMIN_EMAIL && userProfile?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) || !userProfile) && (
                <button
                  onClick={() => setActiveTab('super_admin')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'super_admin'
                      ? 'bg-linear-to-r from-cyan-600/40 to-indigo-600/40 border border-cyan-500/60 text-cyan-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Haupt-Admin & Eltern</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>{t.parentCenter.tabAnalytics}</span>
              </button>

              <button
                onClick={() => setActiveTab('curriculum')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'curriculum'
                    ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{t.parentCenter.tabCurriculum}</span>
              </button>

              {/* Schoolbook Scanner Tab */}
              <button
                onClick={() => setActiveTab('scanner')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'scanner'
                    ? 'bg-linear-to-r from-emerald-600/40 via-teal-600/40 to-indigo-600/40 border border-emerald-500/60 text-emerald-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>{language === 'de' ? 'Buch-Scanner & KI' : 'Book Scanner & AI'}</span>
              </button>

              <button
                onClick={() => setActiveTab('questions')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'questions'
                    ? 'bg-linear-to-r from-fuchsia-600/40 to-indigo-600/40 border border-fuchsia-500/60 text-fuchsia-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{language === 'de' ? 'Fragen & KI-Pool' : 'Question Bank & AI'}</span>
              </button>

              <button
                onClick={() => setActiveTab('games')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'games'
                    ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>{t.parentCenter.tabGameControl}</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>{t.parentCenter.tabSettings}</span>
              </button>

              <div className="mt-auto pt-3 border-t border-slate-800/80 hidden md:block">
                <button
                  onClick={() => setIsUnlocked(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t.parentCenter.lockAdmin}</span>
                </button>
              </div>
            </div>

            {/* Main Tab Panels */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto max-h-[75vh]">
              {/* 1. KIDS & PROFILES TAB */}
              {activeTab === 'kids' && (
                <div className="space-y-6">
                  {/* Status / Error / Success Messages */}
                  {kidActionError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-between animate-in fade-in">
                      <span>{kidActionError}</span>
                      <button type="button" onClick={() => setKidActionError(null)} className="text-rose-400 hover:text-white p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {kidActionSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between animate-in fade-in">
                      <span>{kidActionSuccess}</span>
                      <button type="button" onClick={() => setKidActionSuccess(null)} className="text-emerald-400 hover:text-white p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{t.parentCenter.tabKids}</h3>
                      <p className="text-xs text-slate-400">
                        {language === 'de'
                          ? 'Erstelle und verwalte die Profile aller Kinder in deiner Familie.'
                          : 'Manage and configure profiles for all children in your household.'}
                      </p>
                    </div>

                    {!showAddKidForm && (
                      <button
                        onClick={handleStartAddKid}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{t.parentCenter.addNewKid}</span>
                      </button>
                    )}
                  </div>

                  {/* Add / Edit Kid Modal Form */}
                  {showAddKidForm && (
                    <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-indigo-300">
                          {editingKidId ? t.parentCenter.editKid : t.parentCenter.addNewKid}
                        </h4>
                        <button
                          onClick={() => setShowAddKidForm(false)}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-semibold">{t.parentCenter.kidName}</label>
                          <input
                            type="text"
                            value={kidFormName}
                            onChange={(e) => setKidFormName(e.target.value)}
                            placeholder="e.g. Felix, Sophie, Leo..."
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-semibold">Schulklasse / Gruppe</label>
                          <input
                            type="text"
                            value={kidFormSchoolClass}
                            onChange={(e) => setKidFormSchoolClass(e.target.value)}
                            placeholder="z. B. 2A, 3B, 4C..."
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none uppercase"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                            <span>{language === 'de' ? 'Schulstufe (Jahrgang):' : 'School Grade:'}</span>
                            <span className="text-[10px] text-amber-400 font-mono">
                              {kidFormSchoolGrade <= 4 ? (language === 'de' ? 'Grundstufe' : 'Primary') : (language === 'de' ? 'Mittelschule' : 'Middle School')}
                            </span>
                          </label>
                          <select
                            value={kidFormSchoolGrade}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setKidFormSchoolGrade(val);
                              setKidFormGrade(val > 4 ? 'high_school' : 'primary');
                              if (!kidFormSchoolClass || kidFormSchoolClass.length <= 2) {
                                setKidFormSchoolClass(`${val}A`);
                              }
                            }}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                          >
                            <optgroup label={language === 'de' ? '🎒 Grundstufe (1.-4. Schulstufe)' : '🎒 Primary (Grades 1-4)'}>
                              <option value={1}>1. Schulstufe (Volksschule / Grundschule)</option>
                              <option value={2}>2. Schulstufe (Volksschule / Grundschule)</option>
                              <option value={3}>3. Schulstufe (Volksschule / Grundschule)</option>
                              <option value={4}>4. Schulstufe (Volksschule / Grundschule)</option>
                            </optgroup>
                            <optgroup label={language === 'de' ? '🎓 Mittelschule (5.-8. Schulstufe)' : '🎓 Middle School (Grades 5-8)'}>
                              <option value={5}>5. Schulstufe (1. Klasse Mittelschule)</option>
                              <option value={6}>6. Schulstufe (2. Klasse Mittelschule)</option>
                              <option value={7}>7. Schulstufe (3. Klasse Mittelschule)</option>
                              <option value={8}>8. Schulstufe (4. Klasse Mittelschule)</option>
                            </optgroup>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-semibold">Kinder-Login-Code</label>
                          <input
                            type="text"
                            value={kidFormLoginCode}
                            onChange={(e) => setKidFormLoginCode(e.target.value.toUpperCase())}
                            placeholder="z. B. FELIX-101"
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-sm focus:border-indigo-500 focus:outline-none uppercase"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-semibold">Kinder-PIN</label>
                          <input
                            type="text"
                            maxLength={6}
                            value={kidFormPin}
                            onChange={(e) => setKidFormPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="1234"
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono text-sm focus:border-indigo-500 focus:outline-none tracking-widest text-center"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-semibold">{t.parentCenter.targetLanguage}</label>
                          <select
                            value={kidFormTargetLang}
                            onChange={(e) => setKidFormTargetLang(e.target.value as TargetLearnLanguage)}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="en">🇬🇧 {getLanguageDisplayName('en', language)}</option>
                            <option value="fr">🇫🇷 {getLanguageDisplayName('fr', language)}</option>
                            <option value="it">🇮🇹 {getLanguageDisplayName('it', language)}</option>
                            <option value="es">🇪🇸 {getLanguageDisplayName('es', language)}</option>
                            {language === 'en' && <option value="de">🇩🇪 German</option>}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-semibold">{t.parentCenter.dailyGoal}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={3}
                              max={50}
                              value={kidFormDailyGoal}
                              onChange={(e) => setKidFormDailyGoal(Number(e.target.value))}
                              className="w-24 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                            />
                            <span className="text-xs text-slate-400">{t.parentCenter.problemsPerDay}</span>
                          </div>
                        </div>

                        {/* Granular Difficulty Slider (1-5) matching school years */}
                        <div className="space-y-1 sm:col-span-2 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-300 flex items-center gap-1.5">
                              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{language === 'de' ? 'Schwierigkeitsgrad-Regler (Jahrgänge):' : 'Difficulty Level (Grades):'}</span>
                            </span>
                            <span className="text-amber-400 font-mono font-bold">
                              {kidFormDifficulty === 1 && (language === 'de' ? 'Stufe 1: Anfänger (entspricht 1.-2. Schulstufe)' : 'Level 1: Beginner (Grades 1-2)')}
                              {kidFormDifficulty === 2 && (language === 'de' ? 'Stufe 2: Leicht (entspricht 3. Schulstufe)' : 'Level 2: Easy (Grade 3)')}
                              {kidFormDifficulty === 3 && (language === 'de' ? 'Stufe 3: Mittel (entspricht 4.-5. Schulstufe)' : 'Level 3: Medium (Grades 4-5)')}
                              {kidFormDifficulty === 4 && (language === 'de' ? 'Stufe 4: Fortgeschritten (entspricht 6.-7. Schulstufe)' : 'Level 4: Advanced (Grades 6-7)')}
                              {kidFormDifficulty === 5 && (language === 'de' ? 'Stufe 5: Meister (entspricht 8. Schulstufe+)' : 'Level 5: Master (Grade 8+)')}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={kidFormDifficulty}
                            onChange={(e) => setKidFormDifficulty(Number(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                          />
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>1: 1.-2. Schulstufe</span>
                            <span>2: 3. Schulstufe</span>
                            <span>3: 4.-5. Schulstufe</span>
                            <span>4: 6.-7. Schulstufe</span>
                            <span>5: 8. Schulstufe+</span>
                          </div>
                        </div>
                      </div>

                      {/* Skin Theme Selector for this Kid */}
                      <div className="space-y-2 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
                        <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
                          <span>{language === 'de' ? 'UI Design / Skin für dieses Kind auswählen:' : 'Select UI Theme / Skin for this learner:'}</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {SKIN_THEMES.map((skin) => {
                            const isChosen = kidFormSkin === skin.id;
                            return (
                              <div
                                key={skin.id}
                                onClick={() => setKidFormSkin(skin.id)}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                  isChosen
                                    ? 'bg-slate-800 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base">{skin.icon}</span>
                                  <span className="text-[11px] font-bold text-white truncate">
                                    {language === 'de' ? skin.nameDe : skin.nameEn}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    {skin.previewColors.slice(0, 3).map((c, i) => (
                                      <span key={i} className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                                    ))}
                                  </div>
                                  {isChosen && <Check className="w-3 h-3 text-cyan-400" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Avatar Picker */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold">{t.parentCenter.kidAvatar}</label>
                        <div className="flex flex-wrap gap-2">
                          {AVATAR_CHOICES.map((av) => (
                            <button
                              key={av}
                              type="button"
                              onClick={() => setKidFormAvatar(av)}
                              className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                                kidFormAvatar === av
                                  ? 'bg-indigo-600/40 border-2 border-indigo-400 scale-110'
                                  : 'bg-slate-900 border border-slate-800 hover:bg-slate-800'
                              }`}
                            >
                              {av}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddKidForm(false)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          {t.parentCenter.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveKid}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                        >
                          {t.parentCenter.saveKid}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Kids */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.kids.map((kid) => {
                      const isActive = kid.id === config.activeKidId;
                      const accuracy = kid.totalSolved > 0 ? Math.round((kid.correctCount / kid.totalSolved) * 100) : 100;
                      const kidSkinObj = SKIN_THEMES.find((s) => s.id === (kid.skinId || 'cyber_neon')) || SKIN_THEMES[0];
                      return (
                        <div
                          key={kid.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                            isActive
                              ? 'bg-linear-to-br from-indigo-950/60 to-slate-950 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                                {kid.avatar}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-base font-bold text-white">{kid.name}</h4>
                                  {isActive && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                                      {t.parentCenter.activeBadge}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                                  <span className="font-semibold text-slate-300">
                                    {kid.schoolGrade ? `${kid.schoolGrade}. Schulstufe` : (kid.gradeLevel === 'primary' ? '2. Schulstufe' : '5. Schulstufe')} ({kid.gradeLevel === 'primary' ? t.nav.primaryGrade : t.nav.highSchoolGrade})
                                  </span>
                                  <span>•</span>
                                  <span className="text-amber-400 font-mono font-bold">
                                    Stufe {kid.manualDifficulty || 2}/5
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-slate-300 font-medium">
                                    <span>{kidSkinObj.icon}</span>
                                    <span>{language === 'de' ? kidSkinObj.nameDe : kidSkinObj.nameEn}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                id={`btn_share_kid_${kid.id}`}
                                type="button"
                                onClick={() => {
                                  soundFx.playPop();
                                  setChildToShare(kid);
                                }}
                                className="p-2 rounded-lg bg-sky-950/60 border border-sky-500/30 hover:bg-sky-900/50 text-sky-300 transition-colors cursor-pointer"
                                title={language === 'de' ? 'Kind teilen (Freigabecode)' : 'Share Child Profile'}
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn_edit_kid_${kid.id}`}
                                type="button"
                                onClick={() => handleStartEditKid(kid)}
                                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                title={t.parentCenter.editKid}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn_delete_kid_${kid.id}`}
                                type="button"
                                onClick={() => handleRequestDeleteKid(kid)}
                                className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title={t.parentCenter.deleteKid}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Quick Metrics & Access Codes */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-xl text-center text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block">{t.questView.totalSolved}</span>
                              <span className="font-bold text-cyan-400">{kid.totalSolved}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">{t.questView.accuracy}</span>
                              <span className="font-bold text-emerald-400">{accuracy}%</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Stufe / XP</span>
                              <span className="font-bold text-yellow-400">Lvl {kid.level}</span>
                            </div>
                          </div>

                          {/* Kid Login Credentials Box */}
                          <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-1.5 text-cyan-300">
                              <span className="text-[10px] text-slate-500 font-sans">Login-Code:</span>
                              <span className="font-bold">{kid.loginCode || `${kid.name.toUpperCase()}-101`}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-amber-300">
                              <span className="text-[10px] text-slate-500 font-sans">PIN:</span>
                              <span className="font-bold">{kid.pin || '1234'}</span>
                            </div>
                          </div>

                          {!isActive && (
                            <button
                              id={`btn_activate_kid_${kid.id}`}
                              type="button"
                              onClick={() => handleSwitchKid(kid.id)}
                              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white font-bold text-xs transition-all cursor-pointer"
                            >
                              {t.parentCenter.switchKidBtn}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stateful In-App Kid Deletion Confirmation Modal */}
                  {kidToDelete && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
                      <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                            <Trash2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">
                              {language === 'de' ? 'Kind-Profil löschen?' : 'Delete Learner Profile?'}
                            </h4>
                            <p className="text-xs text-rose-300/80 font-medium">
                              {language === 'de' ? 'Diese Aktion kann nicht rückgängig gemacht werden.' : 'This action cannot be undone.'}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl">
                            {kidToDelete.avatar}
                          </div>
                          <div>
                            <h5 className="text-base font-bold text-white">{kidToDelete.name}</h5>
                            <p className="text-xs text-slate-400">
                              {kidToDelete.schoolGrade ? `${kidToDelete.schoolGrade}. Schulstufe` : kidToDelete.gradeLevel} • {kidToDelete.schoolClass || 'Klasse'} • Lvl {kidToDelete.level}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {language === 'de'
                            ? `Möchtest du das Profil von "${kidToDelete.name}" wirklich unwiderruflich löschen? Alle individuellen Lernstände, gelösten Aufgaben und Statistiken werden entfernt.`
                            : `Do you really want to permanently delete the profile for "${kidToDelete.name}"? All individual progress, tasks, and analytics will be removed.`}
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            id="btn_cancel_delete_kid"
                            type="button"
                            onClick={() => setKidToDelete(null)}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            {language === 'de' ? 'Abbrechen' : 'Cancel'}
                          </button>
                          <button
                            id="btn_confirm_delete_kid"
                            type="button"
                            onClick={handleConfirmDeleteKid}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{language === 'de' ? 'Profil endgültig löschen' : 'Delete Profile'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FAMILY & CO-PARENT SHARING TAB */}
              {activeTab === 'family' && (
                <FamilySharingTab
                  config={config}
                  userProfile={userProfile}
                  onUpdateConfig={notifyConfigChange}
                />
              )}

              {/* TASKS & TESTS MANAGEMENT TAB */}
              {activeTab === 'tasks_tests' && (
                <TasksAndTestsTab config={config} onUpdateConfig={notifyConfigChange} />
              )}

              {/* SUPER ADMIN & PARENTS MANAGEMENT TAB */}
              {activeTab === 'super_admin' && (
                <SuperAdminManagerTab currentEmail={userProfile?.email} />
              )}

              {/* 2. ANALYTICS & LEARNING PROGRESS TAB */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{t.parentCenter.overviewTitle}</h3>
                      <p className="text-xs text-slate-400">
                        {language === 'de'
                          ? 'Detaillierte Auswertung der Lernfortschritte in allen 5 Disziplinen.'
                          : 'Comprehensive performance breakdown across all 5 disciplines.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Kid Selector for Analytics */}
                      <select
                        value={selectedKidIdForAdmin}
                        onChange={(e) => setSelectedKidIdForAdmin(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none"
                      >
                        {config.kids.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.avatar} {k.name}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handlePrintCertificate}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 border border-indigo-500/50 hover:bg-indigo-600/50 text-indigo-300 font-bold text-xs transition-all cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t.parentCenter.printReport}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">{t.parentCenter.totalSolvedAll}</span>
                      <span className="text-2xl font-black text-white mt-2">{currentKidData.totalSolved}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">{t.parentCenter.averageAccuracy}</span>
                      <span className="text-2xl font-black text-emerald-400 mt-2">
                        {currentKidData.totalSolved > 0 ? Math.round((currentKidData.correctCount / currentKidData.totalSolved) * 100) : 100}%
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">{t.parentCenter.streakDays}</span>
                      <span className="text-2xl font-black text-amber-400 mt-2 flex items-center gap-1">
                        <Flame className="w-5 h-5 fill-amber-500" />
                        {currentKidData.streakDays}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Trophäen & Level</span>
                      <span className="text-2xl font-black text-purple-400 mt-2">
                        {currentKidData.badges.filter((b) => b.unlocked).length} / {currentKidData.badges.length}
                      </span>
                    </div>
                  </div>

                  {/* Subject-by-Subject Progress Breakdown */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>{t.parentCenter.subjectBreakdown}</span>
                    </h4>

                    <div className="space-y-3.5">
                      {(['math', 'nature', 'geography', 'art', 'languages'] as SubjectArea[]).map((subj) => {
                        const stats = currentKidData.subjectStats[subj] || { solved: 0, correct: 0, accuracy: 100 };
                        const name = t.subjects[subj];
                        const icon = subj === 'math' ? '🔢' : subj === 'nature' ? '🌿' : subj === 'geography' ? '🌍' : subj === 'art' ? '🎨' : '🗣️';
                        const barColor =
                          subj === 'math'
                            ? 'bg-blue-500'
                            : subj === 'nature'
                            ? 'bg-emerald-500'
                            : subj === 'geography'
                            ? 'bg-cyan-500'
                            : subj === 'art'
                            ? 'bg-fuchsia-500'
                            : 'bg-violet-500';

                        return (
                          <div key={subj} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                <span>{icon}</span>
                                <span>{name}</span>
                              </span>
                              <span className="text-slate-400 font-mono">
                                {stats.correct}/{stats.solved} gelöst ({stats.accuracy}%)
                              </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full ${barColor} transition-all duration-500`}
                                style={{ width: `${Math.min(100, Math.max(5, stats.accuracy))}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Printable Progress Certificate Preview Card */}
                  <div className="p-6 rounded-2xl bg-linear-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-3 text-center print:border-black print:text-black">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold uppercase">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span>{t.parentCenter.learnerCertificate}</span>
                    </div>

                    <h3 className="text-xl font-extrabold text-white">
                      {currentKidData.avatar} {currentKidData.name}
                    </h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      {language === 'de'
                        ? `Erfolgreich ${currentKidData.totalSolved} interdisziplinäre Aufgaben gelöst mit einer Genauigkeit von ${currentKidData.totalSolved > 0 ? Math.round((currentKidData.correctCount / currentKidData.totalSolved) * 100) : 100}%.`
                        : `Successfully completed ${currentKidData.totalSolved} multidisciplinary challenges with ${currentKidData.totalSolved > 0 ? Math.round((currentKidData.correctCount / currentKidData.totalSolved) * 100) : 100}% precision.`}
                    </p>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {t.parentCenter.certifiedBy} • {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              {/* 3. CURRICULUM & TOPICS TAB */}
              {activeTab === 'curriculum' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white">{t.parentCenter.curriculumTitle}</h3>
                    <p className="text-xs text-slate-400">{t.parentCenter.curriculumDesc}</p>
                  </div>

                  {/* Subject Allowed Toggles */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">{t.subjects.selectSubject}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {(['math', 'nature', 'geography', 'art', 'languages'] as SubjectArea[]).map((subj) => {
                        const isAllowed = config.allowedSubjects.includes(subj);
                        const icon = subj === 'math' ? '🔢' : subj === 'nature' ? '🌿' : subj === 'geography' ? '🌍' : subj === 'art' ? '🎨' : '🗣️';
                        return (
                          <div
                            key={subj}
                            onClick={() => handleToggleSubject(subj)}
                            className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isAllowed
                                ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                                : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{icon}</span>
                              <div>
                                <span className="text-xs font-bold block">{t.subjects[subj]}</span>
                                <span className="text-[10px] text-slate-400">{isAllowed ? 'Aktiviert' : 'Deaktiviert'}</span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${isAllowed ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. SCHOOLBOOK SCANNER & AI VISION TAB */}
              {activeTab === 'scanner' && (
                <SchoolbookScannerTab config={config} onConfigChange={notifyConfigChange} />
              )}

              {/* 5. QUESTIONS & AI GENERATOR TAB */}
              {activeTab === 'questions' && (
                <QuestionManagerTab />
              )}

              {/* 5. GAMES & SCREEN TIME TAB */}
              {activeTab === 'games' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white">{t.parentCenter.gameControlTitle}</h3>
                    <p className="text-xs text-slate-400">{t.parentCenter.gameControlDesc}</p>
                  </div>

                  {/* Screen Time Limit */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">{t.parentCenter.dailyTimeLimit}</span>
                      </div>
                      <span className="text-xs font-bold text-cyan-400">
                        {config.dailyTimeLimitMinutes === 0 ? t.parentCenter.unlimitedTime : `${config.dailyTimeLimitMinutes} Min`}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={120}
                      step={15}
                      value={config.dailyTimeLimitMinutes}
                      onChange={(e) => {
                        const updated = { ...config, dailyTimeLimitMinutes: Number(e.target.value) };
                        notifyConfigChange(updated);
                      }}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Allowed Game Modes */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">{t.parentCenter.allowedGamesList}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {allGameModesList.map((mode) => {
                        const isAllowed = config.allowedGameModes.includes(mode.id);
                        return (
                          <div
                            key={mode.id}
                            onClick={() => handleToggleGameMode(mode.id)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isAllowed
                                ? 'bg-slate-900 border-slate-700 text-white'
                                : 'bg-slate-950 border-slate-800/80 text-slate-500 opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{mode.icon}</span>
                              <span className="text-xs font-semibold">
                                {language === 'de' ? mode.nameDe : mode.nameEn}
                              </span>
                            </div>

                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${isAllowed ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. PIN & PREFERENCES TAB */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-lg">
                  <div>
                    <h3 className="text-base font-bold text-white">{t.parentCenter.changePinTitle}</h3>
                    <p className="text-xs text-slate-400">
                      {language === 'de'
                        ? 'Ändere die 4-stellige Eltern-PIN zum Schutz des Admin-Bereichs.'
                        : 'Update the 4-digit PIN required to access the admin area.'}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">{t.parentCenter.newPinLabel}</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-xl tracking-widest focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">{t.parentCenter.confirmNewPin}</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-xl tracking-widest focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {pinChangeMsg && (
                      <p className={`text-xs font-semibold ${pinChangeMsg.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pinChangeMsg.text}
                      </p>
                    )}

                    <button
                      onClick={handleChangePin}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      {t.parentCenter.savePinBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Child Share Modal Dialog for Quick Sharing */}
      <ChildShareModal
        isOpen={Boolean(childToShare)}
        onClose={() => setChildToShare(null)}
        kid={childToShare}
        config={config}
        userProfile={userProfile}
      />
    </div>
  );
};
