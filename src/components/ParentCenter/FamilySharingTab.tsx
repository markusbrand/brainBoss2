import React, { useState, useEffect } from 'react';
import {
  Users,
  Share2,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  HeartHandshake,
  Shield,
  GraduationCap,
  Cloud,
  ArrowRight,
  Sparkles,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Mail,
  UserCheck,
  QrCode,
} from 'lucide-react';
import { KidProfile, ParentConfig, UserProfile, FamilyMember, FamilyGroup } from '../../types';
import {
  initializeFamilyConfig,
  publishFamilyToCloud,
  lookupShareCode,
  joinFamilyWithCode,
  inviteCoParent,
  removeCoParentMember,
  updateFamilyCircleName,
  generateFamilyCode,
  CodeLookupResult,
} from '../../utils/familySharing';
import { ChildShareModal } from './ChildShareModal';
import { soundFx } from '../../utils/audio';

interface FamilySharingTabProps {
  config: ParentConfig;
  userProfile?: UserProfile | null;
  onUpdateConfig: (newConfig: ParentConfig) => void;
}

export const FamilySharingTab: React.FC<FamilySharingTabProps> = ({
  config,
  userProfile,
  onUpdateConfig,
}) => {
  // Ensure family details exist
  const [activeConfig, setActiveConfig] = useState<ParentConfig>(() =>
    initializeFamilyConfig(config, userProfile)
  );

  useEffect(() => {
    const initialized = initializeFamilyConfig(config, userProfile);
    setActiveConfig(initialized);
  }, [config, userProfile]);

  // Family name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [familyNameInput, setFamilyNameInput] = useState(activeConfig.familyName || 'Familienkreis');

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  // Single kid share modal
  const [selectedKidForShare, setSelectedKidForShare] = useState<KidProfile | null>(null);

  // Invite co-parent form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'coparent' | 'tutor'>('coparent');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ text: string; success: boolean } | null>(null);

  // Member deletion state
  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null);

  // Join family with code state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [lookupResult, setLookupResult] = useState<CodeLookupResult | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState<{ text: string; success: boolean } | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    soundFx.playPop();
    const res = await publishFamilyToCloud(activeConfig, userProfile);
    setIsSyncing(false);
    if (res.success) {
      soundFx.playCorrect();
      setSyncSuccess('Familienkreis & alle Kinderdaten erfolgreich mit der Cloud synchronisiert!');
      setTimeout(() => setSyncSuccess(null), 3500);
    } else {
      soundFx.playWrong();
      setSyncSuccess(res.error || 'Synchronisierung fehlgeschlagen.');
      setTimeout(() => setSyncSuccess(null), 4000);
    }
  };

  const handleSaveFamilyName = async () => {
    if (!familyNameInput.trim()) return;
    soundFx.playCorrect();
    const res = await updateFamilyCircleName(familyNameInput.trim(), activeConfig, userProfile);
    setActiveConfig(res.updatedConfig);
    onUpdateConfig(res.updatedConfig);
    setIsEditingName(false);
  };

  const handleRegenerateCode = async () => {
    soundFx.playPop();
    const newCode = generateFamilyCode();
    const updated = { ...activeConfig, familyShareCode: newCode };
    setActiveConfig(updated);
    onUpdateConfig(updated);
    await publishFamilyToCloud(updated, userProfile);
    soundFx.playCorrect();
  };

  const handleCopyCode = () => {
    if (!activeConfig.familyShareCode) return;
    navigator.clipboard.writeText(activeConfig.familyShareCode);
    setCopiedCode(true);
    soundFx.playCorrect();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyInviteLink = () => {
    const code = activeConfig.familyShareCode;
    const url = `${window.location.origin}/?joinFamily=${code}`;
    const text = `Hallo! Tritt unserem BrainBoss Familienkreis "${activeConfig.familyName}" bei:\n⭐ Familien-Code: ${code}\nLink: ${url}\nDamit haben wir gemeinsamen Zugriff auf alle Kinder, Lernfortschritte und Aufgaben!`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    soundFx.playCorrect();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    soundFx.playPop();

    const res = await inviteCoParent(inviteEmail, inviteName, inviteRole, activeConfig, userProfile);
    setInviteLoading(false);

    if (res.success) {
      soundFx.playCorrect();
      setActiveConfig(res.updatedConfig);
      onUpdateConfig(res.updatedConfig);
      setInviteFeedback({ text: res.message, success: true });
      setInviteEmail('');
      setInviteName('');
      setShowInviteForm(false);
      setTimeout(() => setInviteFeedback(null), 4000);
    } else {
      soundFx.playWrong();
      setInviteFeedback({ text: res.message, success: false });
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    soundFx.playPop();
    const res = await removeCoParentMember(memberToRemove.email, activeConfig, userProfile);
    setActiveConfig(res.updatedConfig);
    onUpdateConfig(res.updatedConfig);
    setMemberToRemove(null);
    soundFx.playCorrect();
  };

  const handleCheckJoinCode = async () => {
    if (!joinCodeInput.trim()) return;
    setIsCheckingCode(true);
    setLookupResult(null);
    setJoinFeedback(null);
    soundFx.playPop();

    const result = await lookupShareCode(joinCodeInput.trim());
    setIsCheckingCode(false);
    setLookupResult(result);

    if (result.type !== 'not_found') {
      soundFx.playCorrect();
    } else {
      soundFx.playWrong();
    }
  };

  const handleExecuteJoin = async () => {
    if (!joinCodeInput.trim()) return;
    setIsJoining(true);
    soundFx.playPop();

    const res = await joinFamilyWithCode(joinCodeInput.trim(), activeConfig, userProfile);
    setIsJoining(false);

    if (res.success && res.updatedConfig) {
      soundFx.playCorrect();
      setActiveConfig(res.updatedConfig);
      onUpdateConfig(res.updatedConfig);
      setJoinFeedback({ text: res.message, success: true });
      setLookupResult(null);
      setJoinCodeInput('');
      setTimeout(() => setJoinFeedback(null), 5000);
    } else {
      soundFx.playWrong();
      setJoinFeedback({ text: res.message, success: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {syncSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncSuccess}</span>
        </div>
      )}

      {inviteFeedback && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold animate-in fade-in ${
            inviteFeedback.success
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
          }`}
        >
          {inviteFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{inviteFeedback.text}</span>
        </div>
      )}

      {joinFeedback && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold animate-in fade-in ${
            joinFeedback.success
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
          }`}
        >
          {joinFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{joinFeedback.text}</span>
        </div>
      )}

      {/* Top Banner: Family Identity & Active Share Code */}
      <div className="bg-linear-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <HeartHandshake className="w-3 h-3 text-indigo-400" />
                Familienkreis & Co-Eltern
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Cloud className="w-2.5 h-2.5" />
                Live Sync
              </span>
            </div>

            {/* Editable Family Name */}
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={familyNameInput}
                  onChange={(e) => setFamilyNameInput(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-indigo-500 text-slate-100 text-base font-bold focus:outline-none"
                  placeholder="Familienname"
                  autoFocus
                />
                <button
                  onClick={handleSaveFamilyName}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-100">
                  {activeConfig.familyName || 'Familienkreis BrainBoss'}
                </h3>
                <button
                  onClick={() => {
                    setFamilyNameInput(activeConfig.familyName || 'Familienkreis');
                    setIsEditingName(true);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                  title="Familiennamen bearbeiten"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400 max-w-xl mt-1.5">
              Teile den Zugriff auf alle Kinderprofile mit deinem Partner, Co-Eltern oder Lehrkräften. Beide Elternteile sehen denselben Lernfortschritt, Level, Hausaufgaben und Tests in Echtzeit.
            </p>
          </div>

          {/* Family Share Code Card */}
          <div className="bg-slate-950/90 border border-indigo-500/40 rounded-xl p-4 min-w-[260px] text-center shadow-inner shrink-0">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
              Familien-Freigabecode
            </span>
            <div className="flex items-center justify-center gap-2 my-1">
              <span className="font-mono text-2xl font-black tracking-widest text-transparent bg-clip-text bg-linear-to-r from-indigo-300 via-sky-300 to-purple-300 select-all">
                {activeConfig.familyShareCode || 'FAM-12345'}
              </span>
              <button
                onClick={handleRegenerateCode}
                title="Neuen Code generieren"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              <button
                onClick={handleCopyCode}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  copiedCode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                }`}
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Kopiert!' : 'Code kopieren'}</span>
              </button>

              <button
                onClick={handleCopyInviteLink}
                className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
                title="Einladungstext mit Link kopieren"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Jetzt mit Cloud synchronisieren"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Freigegebene Kinder in diesem Familienkreis */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-sky-400" />
              Kinder in diesem Familienkreis ({activeConfig.kids?.length || 0})
            </h4>
            <p className="text-xs text-slate-400">
              Alle hier aufgeführten Kinder werden automatisch zwischen allen verbundenen Eltern synchronisiert.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(activeConfig.kids || []).map((kid) => (
            <div
              key={kid.id}
              className="bg-slate-950/80 border border-slate-800/80 hover:border-sky-500/40 rounded-xl p-3.5 transition flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                    {kid.avatar || '🚀'}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-100">{kid.name}</h5>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="text-sky-400 font-semibold">
                        {kid.schoolGrade ? `${kid.schoolGrade}. Klasse` : 'Grundstufe'}
                      </span>
                      {kid.schoolClass && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
                          {kid.schoolClass}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {kid.id === activeConfig.activeKidId && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Aktiv
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-[11px] text-slate-400 mb-3">
                <span>Stufe {kid.level || 1}</span>
                <span>{kid.xp || 0} XP</span>
                <span className="text-amber-400 font-semibold">{kid.coins || 0} 🪙</span>
              </div>

              <button
                onClick={() => {
                  soundFx.playPop();
                  setSelectedKidForShare(kid);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-bold transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Einzel-Code für {kid.name}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Verbundene Elternteile & Co-Parents */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Verbundene Eltern & Lehrkräfte ({activeConfig.familyMembers?.length || 1})
            </h4>
            <p className="text-xs text-slate-400">
              Personen, die Zugriff auf diese Kinder und deren Lernpläne haben.
            </p>
          </div>

          <button
            onClick={() => {
              soundFx.playPop();
              setShowInviteForm(!showInviteForm);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Elternteil per E-Mail einladen</span>
          </button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <form
            onSubmit={handleSendInvite}
            className="bg-slate-950/90 border border-indigo-500/40 rounded-xl p-4 mb-4 animate-in fade-in space-y-3"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Neues Elternteil / Partner einladen
              </h5>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
              >
                Schließen
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Name / Anzeigename
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="z.B. Papa Thomas"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="partner@beispiel.de"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Rolle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="coparent">Mit-Elternteil (Partner)</option>
                  <option value="tutor">Lehrkraft / Nachhilfe</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={inviteLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
              >
                {inviteLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                <span>Einladung hinzufügen</span>
              </button>
            </div>
          </form>
        )}

        {/* Member List */}
        <div className="space-y-2">
          {(activeConfig.familyMembers || []).map((member) => (
            <div
              key={member.email}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
                  {member.displayName?.slice(0, 2).toUpperCase() || 'EL'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">{member.displayName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        member.role === 'owner'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : member.role === 'coparent'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {member.role === 'owner'
                        ? 'Haupt-Elternteil'
                        : member.role === 'coparent'
                        ? 'Mit-Elternteil (Partner)'
                        : 'Lehrkraft / Nachhilfe'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{member.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {member.role !== 'owner' && (
                  <button
                    onClick={() => {
                      soundFx.playPop();
                      setMemberToRemove(member);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                    title="Mitglied entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Bestehender Familie beitreten (Join Family with Code) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            Bestehender Familie beitreten / Kind per Code verknüpfen
          </h4>
          <p className="text-xs text-slate-400">
            Hast du von deinem Partner oder einer Lehrkraft einen Freigabecode erhalten (z.B. <code>FAM-84920</code> oder <code>KID-FELIX-7892</code>)?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            placeholder="z.B. FAM-84920 oder KID-FELIX-7892"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm uppercase tracking-wider focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={handleCheckJoinCode}
            disabled={isCheckingCode || !joinCodeInput.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-sm"
          >
            {isCheckingCode ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Code prüfen</span>
          </button>
        </div>

        {/* Lookup Preview Card */}
        {lookupResult && lookupResult.type !== 'not_found' && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/40 animate-in fade-in">
            {lookupResult.type === 'family' ? (
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Familienkreis gefunden!
                </div>
                <div className="text-sm font-bold text-slate-100 mb-1">
                  {lookupResult.family.name}
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Erstellt von: <span className="font-mono text-slate-300">{lookupResult.family.ownerEmail}</span> • Enthält{' '}
                  <strong className="text-sky-300">{lookupResult.family.kids?.length || 0} Kinder</strong> (
                  {lookupResult.family.kids?.map((k) => k.name).join(', ') || 'keine'})
                </p>

                <button
                  onClick={handleExecuteJoin}
                  disabled={isJoining}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  {isJoining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HeartHandshake className="w-4 h-4" />}
                  <span>Familie beitreten & Kinder synchronisieren</span>
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Kind-Freigabe gefunden!
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                    {lookupResult.childInvite.kidAvatar || '🚀'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-100">
                      {lookupResult.childInvite.kidName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {lookupResult.childInvite.schoolGrade ? `${lookupResult.childInvite.schoolGrade}. Klasse` : 'Schüler'} aus {lookupResult.childInvite.familyName}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleExecuteJoin}
                  disabled={isJoining}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  {isJoining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{lookupResult.childInvite.kidName} als Kind importieren</span>
                </button>
              </div>
            )}
          </div>
        )}

        {lookupResult && lookupResult.type === 'not_found' && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{lookupResult.message}</span>
          </div>
        )}
      </div>

      {/* Child Share Modal Dialog */}
      <ChildShareModal
        isOpen={Boolean(selectedKidForShare)}
        onClose={() => setSelectedKidForShare(null)}
        kid={selectedKidForShare}
        config={activeConfig}
        userProfile={userProfile}
      />

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold mb-2">Mitglied entfernen?</h4>
            <p className="text-xs text-slate-300 mb-6">
              Möchtest du <strong>{memberToRemove.displayName}</strong> ({memberToRemove.email}) wirklich aus diesem Familienkreis entfernen? Diese Person verliert den gemeinsamen Zugriff auf die Kinder.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirmRemoveMember}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Mitglied entfernen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
