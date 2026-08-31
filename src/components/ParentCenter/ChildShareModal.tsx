import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  Sparkles,
  QrCode,
  HeartHandshake,
  GraduationCap,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { KidProfile, ParentConfig, UserProfile } from '../../types';
import { createChildShareCode } from '../../utils/familySharing';
import { soundFx } from '../../utils/audio';

interface ChildShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  kid: KidProfile | null;
  config: ParentConfig;
  userProfile?: UserProfile | null;
}

export const ChildShareModal: React.FC<ChildShareModalProps> = ({
  isOpen,
  onClose,
  kid,
  config,
  userProfile,
}) => {
  const [shareCode, setShareCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    if (isOpen && kid) {
      generateCode();
    }
  }, [isOpen, kid]);

  if (!isOpen || !kid) return null;

  const generateCode = async () => {
    setIsGenerating(true);
    const result = await createChildShareCode(kid, config, userProfile);
    setShareCode(result.code);
    setIsGenerating(false);
  };

  const handleCopyCode = () => {
    if (!shareCode) return;
    navigator.clipboard.writeText(shareCode);
    setCopiedCode(true);
    soundFx.playCorrect();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const inviteText = `Hallo! Hier ist der BrainBoss-Lerncode für ${kid.name} (${kid.schoolGrade ? `${kid.schoolGrade}. Klasse` : 'Grundstufe'}):
⭐ Freigabecode: ${shareCode}
Gib diesen Code im BrainBoss Elternbereich unter "Familie & Teilen" ein, um ${kid.name}s Lernfortschritte, Hausaufgaben und Tests zu begleiten! 🚀`;

  const handleCopyInviteMessage = () => {
    navigator.clipboard.writeText(inviteText);
    setCopiedMessage(true);
    soundFx.playCorrect();
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-2xl shadow-inner">
              {kid.avatar || '🚀'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">
                  {kid.name} mit Eltern / Familie teilen
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {kid.schoolGrade ? `${kid.schoolGrade}. Klasse` : 'Schüler'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ermöglicht Partnern, Großeltern oder Lehrkräften den Zugriff auf dieses Profil
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playPop();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Code Box */}
        <div className="bg-slate-950/80 border border-sky-500/30 rounded-xl p-4 mb-5 text-center relative">
          <p className="text-[11px] font-semibold tracking-wider text-sky-400 uppercase mb-1">
            Persönlicher Kind-Freigabecode
          </p>
          <div className="flex items-center justify-center gap-3 my-2">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-linear-to-r from-sky-400 via-indigo-300 to-purple-400 select-all">
              {isGenerating ? 'GENERIEREN...' : shareCode || 'KID-CODE-1234'}
            </span>
            <button
              onClick={generateCode}
              title="Neuen Code generieren"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                copiedCode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Code kopiert!' : 'Code kopieren'}</span>
            </button>

            <button
              onClick={handleCopyInviteMessage}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                copiedMessage
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {copiedMessage ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedMessage ? 'Nachricht kopiert!' : 'Einladungstext kopieren'}</span>
            </button>
          </div>
        </div>

        {/* Benefits & Info */}
        <div className="space-y-2.5 mb-5 text-xs text-slate-300 bg-slate-800/40 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Echtzeit-Synchronisierung:</strong> Beide Elternteile sehen sofort gelöste Aufgaben, erreichte Level ({kid.level || 1}), XP ({kid.xp || 0}) und gesammelte Münzen.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <GraduationCap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Aufgaben & Tests gemeinsam steuern:</strong> Beide Elternteile können {kid.name} Hausaufgaben zuweisen und Testergebnisse einsehen.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <HeartHandshake className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              <strong>Kein Passwort nötig:</strong> Das zweite Elternteil gibt den Freigabecode einfach im Menü <em>"Familie & Teilen"</em> ein.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              soundFx.playPop();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
