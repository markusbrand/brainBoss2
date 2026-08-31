import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  Users,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  UserCheck,
  GraduationCap,
  Star,
  LogIn,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { signInWithGoogle, SUPER_ADMIN_EMAIL, setSavedChildSession, ChildSession } from '../../lib/firebase';
import { KidProfile, ParentConfig, UserProfile } from '../../types';
import { verifyChildLogin, loadParentConfig } from '../../utils/storage';
import { soundFx } from '../../utils/audio';

interface LoginScreenProps {
  onLoginSuccess?: (userProfile: UserProfile, activeKid?: KidProfile, user?: User) => void;
  onAdminLoggedIn?: (user: User, profile?: UserProfile) => void;
  onChildLoginSuccess?: (kid: KidProfile) => void;
  onChildLoggedIn?: (kid: KidProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onAdminLoggedIn,
  onChildLoginSuccess,
  onChildLoggedIn,
}) => {
  const [authTab, setAuthTab] = useState<'parent_google' | 'kid_code'>('parent_google');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Kid login inputs
  const [kidIdentifier, setKidIdentifier] = useState('');
  const [kidPin, setKidPin] = useState('');
  const [selectedKidQuick, setSelectedKidQuick] = useState<KidProfile | null>(null);

  const localConfig = loadParentConfig();

  // Handle Google Sign-In for Super Admin & Parents
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      soundFx.playPop();

      const { user, profile } = await signInWithGoogle();
      soundFx.playCorrect();

      // Find initial kid
      const activeKid = localConfig.kids.find((k) => k.id === localConfig.activeKidId) || localConfig.kids[0];
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(profile, activeKid, user);
      }
      if (typeof onAdminLoggedIn === 'function') {
        onAdminLoggedIn(user, profile);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMessage(
        err?.message?.includes('popup-closed-by-user')
          ? 'Anmeldefenster wurde geschlossen.'
          : 'Anmeldung fehlgeschlagen. Bitte stelle sicher, dass Popups erlaubt sind.'
      );
      soundFx.playWrong();
    } finally {
      setLoading(false);
    }
  };

  // Handle Child Direct Login
  const handleChildLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const identifier = selectedKidQuick ? selectedKidQuick.name : kidIdentifier;
    const codeOrPin = selectedKidQuick ? (kidPin || '1234') : (kidPin || kidIdentifier);

    if (!identifier && !codeOrPin) {
      setErrorMessage('Bitte gib deinen Namen, Code oder deine PIN ein.');
      soundFx.playWrong();
      return;
    }

    const result = verifyChildLogin(identifier, codeOrPin);
    if (result.success && result.kid) {
      soundFx.playCorrect();
      // Store child session
      const session: ChildSession = {
        kidId: result.kid.id,
        kidName: result.kid.name,
        parentUid: localConfig.ownerUid || 'local_parent',
        avatar: result.kid.avatar,
        schoolGrade: result.kid.schoolGrade,
        schoolClass: result.kid.schoolClass,
        loginCode: result.kid.loginCode,
        token: `child_${result.kid.id}_${Date.now()}`,
      };
      setSavedChildSession(session);
      if (typeof onChildLoginSuccess === 'function') {
        onChildLoginSuccess(result.kid);
      }
      if (typeof onChildLoggedIn === 'function') {
        onChildLoggedIn(result.kid);
      }
    } else {
      soundFx.playWrong();
      setErrorMessage(result.error || 'Login-Code oder PIN ist nicht korrekt.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div
        className="pointer-events-none fixed inset-0 opacity-25 z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 20%, #3b82f6 0%, transparent 45%), radial-gradient(circle at 75% 80%, #8b5cf6 0%, transparent 45%), radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 55%)',
        }}
      />

      {/* Main Container */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 shadow-lg shadow-cyan-500/25 mb-4">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            BrainBoss
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Die geschützte interdisziplinäre Lern- & Schularbeits-Plattform
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
          <button
            id="tab_auth_parent"
            type="button"
            onClick={() => {
              soundFx.playPop();
              setAuthTab('parent_google');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              authTab === 'parent_google'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Eltern / Admin</span>
          </button>

          <button
            id="tab_auth_kid"
            type="button"
            onClick={() => {
              soundFx.playPop();
              setAuthTab('kid_code');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              authTab === 'kid_code'
                ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-300" />
            <span>Kinder-Login</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Hinweis:</p>
              <p className="text-rose-300 text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 1. PARENT & SUPER ADMIN GOOGLE AUTH VIEW */}
        {authTab === 'parent_google' && (
          <div className="space-y-6">
            <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80 text-sm text-slate-300 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <UserCheck className="w-4 h-4" />
                <span>Sicherer Google-Zugang</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nur registrierte Eltern und Administratoren erhalten Zugriff. Der Haupt-Administrator verwaltet
                und autorisiert alle weiteren Elternkonten über das integrierte Eltern-Zentrum.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 py-1.5 px-3 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Rollenbasierte Rechte für Schulklassen, Tests & Aufgaben</span>
              </div>
            </div>

            <button
              id="btn_google_signin"
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-base shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Mit Google anmelden</span>
            </button>
          </div>
        )}

        {/* 2. CHILD DIRECT LOGIN VIEW */}
        {authTab === 'kid_code' && (
          <form onSubmit={handleChildLogin} className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-slate-300 font-medium">
                Wähle dein Profil oder gib deinen Kinder-Code ein:
              </p>
            </div>

            {/* Quick Profile Avatars */}
            {localConfig.kids && localConfig.kids.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {localConfig.kids.map((kid) => {
                  const isSelected = selectedKidQuick?.id === kid.id;
                  return (
                    <button
                      key={kid.id}
                      type="button"
                      onClick={() => {
                        soundFx.playPop();
                        setSelectedKidQuick(kid);
                        setKidIdentifier(kid.loginCode || kid.name);
                        setKidPin(kid.pin || '1234');
                      }}
                      className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-600/30 border-purple-500 ring-2 ring-purple-500/50 scale-105'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="text-3xl">{kid.avatar}</span>
                      <span className="font-bold text-sm text-white">{kid.name}</span>
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                        {kid.schoolClass || `${kid.schoolGrade || 2}. Klasse`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Manual Code / PIN Entry */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Kinder-Login-Code (z. B. FELIX-101)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input_kid_code"
                    type="text"
                    placeholder="z. B. FELIX-101 oder Name"
                    value={kidIdentifier}
                    onChange={(e) => setKidIdentifier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-purple-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Kinder-PIN (Standard: 1234)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input_kid_pin"
                    type="password"
                    maxLength={6}
                    placeholder="PIN (z. B. 1234)"
                    value={kidPin}
                    onChange={(e) => setKidPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-purple-500 font-mono tracking-widest text-center"
                  />
                </div>
              </div>
            </div>

            <button
              id="btn_kid_login_submit"
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <LogIn className="w-5 h-5" />
              <span>Jetzt ins Lern-Abenteuer starten!</span>
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
          <span>🔒 DSGVO-konform & sicher</span>
          <span>•</span>
          <span>🎓 Schulstufe 1 - 8</span>
          <span>•</span>
          <span>⚡ Echtzeit-Sync</span>
        </div>
      </div>
    </div>
  );
};
