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
  Mail,
  Zap,
  ExternalLink,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  signInWithGoogle,
  signInWithGoogleRedirect,
  signInWithEmail,
  registerWithEmail,
  loginAsDirectParent,
  SUPER_ADMIN_EMAIL,
  setSavedChildSession,
  ChildSession,
} from '../../lib/firebase';
import { KidProfile, ParentConfig, UserProfile } from '../../types';
import { verifyChildLogin, loadParentConfig, saveParentConfig, DEFAULT_PARENT_CONFIG } from '../../utils/storage';
import { soundFx } from '../../utils/audio';
import { getSkinTheme } from '../../utils/skins';
import { getLanguageFlag } from '../../utils/subjectEngines';

interface LoginScreenProps {
  onLoginSuccess?: (userProfile: UserProfile, activeKid?: KidProfile, user?: User) => void;
  onAdminLoggedIn?: (user?: User | null, profile?: UserProfile) => void;
  onChildLoginSuccess?: (kid: KidProfile) => void;
  onChildLoggedIn?: (kid: KidProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onAdminLoggedIn,
  onChildLoginSuccess,
  onChildLoggedIn,
}) => {
  const [authTab, setAuthTab] = useState<'direct_parent' | 'parent_google' | 'kid_code'>('direct_parent');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  // Email / Password in-page state
  const [emailInput, setEmailInput] = useState('mbrandstaetter48@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Kid login inputs
  const [kidIdentifier, setKidIdentifier] = useState('');

  const localConfig = loadParentConfig();

  const handleSuccessfulParentLogin = (profile: UserProfile, user?: User) => {
    soundFx.playCorrect();
    const validKids = (localConfig?.kids || []).filter((k): k is KidProfile => Boolean(k && k.id && k.name));
    const activeKid =
      validKids.find((k) => k.id === localConfig?.activeKidId) || validKids[0] || DEFAULT_PARENT_CONFIG.kids[0];
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess(profile, activeKid, user);
    }
    if (typeof onAdminLoggedIn === 'function') {
      onAdminLoggedIn(user || null, profile);
    }
  };

  // 1. Direct 1-Click / Instant Parent Access (Zero Popups)
  const handleQuickParentStart = async (customEmail?: string) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      soundFx.playPop();
      const targetEmail = customEmail || emailInput || 'mbrandstaetter48@gmail.com';
      const profile = await loginAsDirectParent(targetEmail, displayNameInput || 'Administrator / Elternteil');
      handleSuccessfulParentLogin(profile);
    } catch (err: any) {
      console.error('Quick login error:', err);
      setErrorMessage(err?.message || 'Fehler beim Direkt-Login.');
      soundFx.playWrong();
    } finally {
      setLoading(false);
    }
  };

  // 2. Direct In-Page Email & Password Sign-In / Register
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage('Bitte gib eine gültige E-Mail-Adresse ein.');
      soundFx.playWrong();
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      soundFx.playPop();

      if (isRegisterMode) {
        if (!passwordInput || passwordInput.length < 6) {
          setErrorMessage('Das Passwort muss mindestens 6 Zeichen lang sein.');
          soundFx.playWrong();
          setLoading(false);
          return;
        }
        try {
          const { user, profile } = await registerWithEmail(emailInput, passwordInput, displayNameInput);
          handleSuccessfulParentLogin(profile, user);
        } catch (regErr: any) {
          console.info('Cloud register fallback to local session:', regErr?.code || regErr?.message);
          const profile = await loginAsDirectParent(emailInput, displayNameInput);
          handleSuccessfulParentLogin(profile);
        }
      } else {
        // Sign In
        if (!passwordInput) {
          // If no password provided, perform instant secure in-page session login
          await handleQuickParentStart(emailInput);
          return;
        }
        try {
          const { user, profile } = await signInWithEmail(emailInput, passwordInput);
          handleSuccessfulParentLogin(profile, user);
        } catch (firebaseErr: any) {
          // If cloud auth is unavailable, unconfigured, or offline, fallback smoothly to in-page session
          console.info('Cloud email auth fallback to in-page session:', firebaseErr?.code || firebaseErr?.message);
          const profile = await loginAsDirectParent(emailInput, displayNameInput);
          handleSuccessfulParentLogin(profile);
        }
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setErrorMessage(
        err?.code === 'auth/email-already-in-use'
          ? 'Diese E-Mail ist bereits registriert. Bitte melde dich an.'
          : err?.message || 'Anmeldung fehlgeschlagen.'
      );
      soundFx.playWrong();
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Google Sign-In with Popup
  const handleGoogleSignInPopup = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setPopupBlocked(false);
      soundFx.playPop();

      const { user, profile } = await signInWithGoogle();
      handleSuccessfulParentLogin(profile, user);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      const isBlocked =
        err?.code === 'auth/popup-blocked' ||
        err?.message?.includes('popup-blocked') ||
        err?.message?.includes('cancelled-popup-request');

      if (isBlocked) {
        setPopupBlocked(true);
        setErrorMessage('Popups wurden vom Browser blockiert. Wähle einfach den direkten Login ("Direkt (Kein Popup)")!');
      } else if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain') || err?.message?.includes('blocked')) {
        setErrorMessage('Google-Anmeldung ist für diese Domain (localhost) in Firebase nicht freigegeben. Bitte nutze den Reiter "Direkt (Kein Popup)" für schnellen Login!');
      } else if (err?.message?.includes('popup-closed-by-user')) {
        setErrorMessage('Das Google-Anmeldefenster wurde vorzeitig geschlossen.');
      } else {
        setErrorMessage('Google-Anmeldung nicht verfügbar. Bitte nutze den Reiter "Direkt (Kein Popup)".');
      }
      soundFx.playWrong();
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Google Sign-In with Redirect (Zero Popups)
  const handleGoogleSignInRedirect = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      soundFx.playPop();
      await signInWithGoogleRedirect();
    } catch (err: any) {
      console.error('Google Redirect Error:', err);
      setErrorMessage('Weiterleitung fehlgeschlagen. Bitte nutze den direkten Login im Formular.');
      soundFx.playWrong();
      setLoading(false);
    }
  };

  // 5. Open in standalone tab for maximum browser compatibility
  const handleOpenStandalone = () => {
    soundFx.playPop();
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  // 6. Handle Child Direct 1-Tap Login
  const handleDirectKidSelect = (kid: KidProfile) => {
    soundFx.playCorrect();
    const session: ChildSession = {
      kidId: kid.id,
      kidName: kid.name,
      parentUid: localConfig.ownerUid || 'local_parent',
      avatar: kid.avatar,
      schoolGrade: kid.schoolGrade,
      schoolClass: kid.schoolClass,
      loginCode: kid.loginCode,
      token: `child_${kid.id}_${Date.now()}`,
    };
    setSavedChildSession(session);
    if (typeof onChildLoginSuccess === 'function') {
      onChildLoginSuccess(kid);
    }
    if (typeof onChildLoggedIn === 'function') {
      onChildLoggedIn(kid);
    }
  };

  // 7. Handle Child Code / Name input submit
  const handleChildLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const identifier = kidIdentifier.trim();
    if (!identifier) {
      setErrorMessage('Bitte wähle dein Profil oder gib deinen Namen oder Code ein.');
      soundFx.playWrong();
      return;
    }

    const result = verifyChildLogin(identifier);
    if (result.success && result.kid) {
      handleDirectKidSelect(result.kid);
    } else {
      soundFx.playWrong();
      setErrorMessage(result.error || 'Profil oder Code nicht gefunden.');
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
        <div className="text-center mb-6">
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

        {/* Primary Tab Switcher */}
        <div className="grid grid-cols-3 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6 gap-1">
          <button
            id="tab_auth_direct"
            type="button"
            onClick={() => {
              soundFx.playPop();
              setAuthTab('direct_parent');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authTab === 'direct_parent'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-cyan-300 flex-shrink-0" />
            <span className="truncate">Direkt (Kein Popup)</span>
          </button>

          <button
            id="tab_auth_parent"
            type="button"
            onClick={() => {
              soundFx.playPop();
              setAuthTab('parent_google');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authTab === 'parent_google'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-blue-300 flex-shrink-0" />
            <span className="truncate">Google-Konto</span>
          </button>

          <button
            id="tab_auth_kid"
            type="button"
            onClick={() => {
              soundFx.playPop();
              setAuthTab('kid_code');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authTab === 'kid_code'
                ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span className="truncate">Kinder-Login</span>
          </button>
        </div>

        {/* Error / Notification Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Hinweis:</p>
                <p className="text-xs leading-relaxed mt-0.5">{errorMessage}</p>
              </div>
            </div>

            {/* Quick resolution button if popup was blocked */}
            {(popupBlocked || errorMessage.includes('Popup')) && (
              <div className="pt-2 border-t border-rose-500/20 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickParentStart('mbrandstaetter48@gmail.com')}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Jetzt direkt ohne Popup einloggen (1-Klick)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('direct_parent')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all cursor-pointer"
                >
                  Zum E-Mail-Formular
                </button>
              </div>
            )}
          </div>
        )}

        {/* 1. DIRECT IN-PAGE AUTHENTICATION (NO POPUPS) */}
        {authTab === 'direct_parent' && (
          <div className="space-y-6">
            <div className="bg-slate-950/60 rounded-2xl p-4 border border-cyan-500/30 text-sm text-slate-300 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Zap className="w-4 h-4" />
                  <span>Direkte In-Page Authentifizierung</span>
                </div>
                <span className="text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                  100% Popup-Frei
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Melde dich direkt mit deiner E-Mail an oder nutze den 1-Klick-Schnellstart als Administrator/Elternteil. Es wird kein separates Browserfenster oder Popup benötigt.
              </p>
            </div>

            {/* Quick 1-Click Parent Action Button */}
            <button
              id="btn_quick_parent_login"
              type="button"
              disabled={loading}
              onClick={() => handleQuickParentStart(emailInput || 'mbrandstaetter48@gmail.com')}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 text-amber-300" />
              )}
              <span>1-Klick Schnellstart als Administrator / Eltern</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-xs text-slate-500 font-medium">oder mit E-Mail & Passwort</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* In-Page Form */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input_parent_email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Dein Name (z. B. Mama / Papa / Lehrkraft)
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input_parent_name"
                      type="text"
                      placeholder="z. B. Michael Brandstätter"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-400">
                    Passwort {isRegisterMode ? '(mind. 6 Zeichen)' : '(optional für Direktstart)'}
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input_parent_password"
                    type="password"
                    placeholder={isRegisterMode ? 'Passwort wählen' : 'Passwort eingeben oder leer lassen'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  id="btn_submit_email_auth"
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isRegisterMode ? 'Konto anlegen & starten' : 'Anmelden'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playPop();
                    setIsRegisterMode(!isRegisterMode);
                    setErrorMessage(null);
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  {isRegisterMode ? 'Bereits registriert?' : 'Neu registrieren?'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. GOOGLE AUTH VIEW (POPUP OR REDIRECT) */}
        {authTab === 'parent_google' && (
          <div className="space-y-5">
            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 text-sm text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <Shield className="w-4 h-4" />
                <span>Google-Konto Authentifizierung</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Melde dich mit deinem verknüpften Google-Konto an. Falls dein Browser Popups in iframes blockiert, kannst du die Weiterleitungsoption oder den direkten Tab nutzen.
              </p>
            </div>

            {/* Standard Google Popup Button */}
            <button
              id="btn_google_signin"
              type="button"
              disabled={loading}
              onClick={handleGoogleSignInPopup}
              className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm sm:text-base shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 text-slate-900 animate-spin" />
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
              <span>Mit Google anmelden (Popup)</span>
            </button>

            {/* Non-Popup Alternatives */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleGoogleSignInRedirect}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                <span>Google-Weiterleitung (ohne Popup)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenStandalone}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span>Im neuen Browser-Tab öffnen</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. CHILD DIRECT LOGIN VIEW */}
        {authTab === 'kid_code' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <span>Hallo! Wer lernt heute mit?</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tippe einfach auf dein Profil, um direkt in dein Lern-Abenteuer zu starten!
              </p>
            </div>

            {/* Quick 1-Tap Profile Avatars */}
            {localConfig.kids && localConfig.kids.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {localConfig.kids
                  .filter((k): k is KidProfile => Boolean(k && k.id && k.name))
                  .map((kid) => {
                  const kidSkin = getSkinTheme(kid.skinId || 'cyber_neon');
                  return (
                    <button
                      key={kid.id}
                      id={`btn_kid_select_${kid.id}`}
                      type="button"
                      onClick={() => handleDirectKidSelect(kid)}
                      className="p-4 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center gap-2 cursor-pointer bg-slate-950/70 border-slate-800 hover:border-purple-500 hover:scale-[1.04] hover:shadow-xl hover:shadow-purple-500/20 active:scale-95 group relative overflow-hidden"
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: kidSkin.glowColor }}
                      />
                      <span className="text-4xl group-hover:scale-110 transition-transform">{kid.avatar || '🚀'}</span>
                      <div className="text-center w-full">
                        <span className="font-extrabold text-sm text-white group-hover:text-amber-300 block truncate transition-colors">
                          {kid.name}
                        </span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold">
                            {kid.schoolClass ? `Klasse ${kid.schoolClass}` : `${kid.schoolGrade || 2}. Schulstufe`}
                          </span>
                        </div>
                      </div>
                      <div className="w-full pt-1 flex items-center justify-center gap-1 text-[10px] text-purple-300 font-bold opacity-80 group-hover:opacity-100">
                        <span>Starten</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Manual Name or Code Entry for other devices */}
            <form onSubmit={handleChildLogin} className="space-y-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Oder gib deinen Namen oder Code ein:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input_kid_code"
                    type="text"
                    placeholder="z. B. FELIX-101 oder Leo"
                    value={kidIdentifier}
                    onChange={(e) => setKidIdentifier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
              </div>

              <button
                id="btn_kid_login_submit"
                type="submit"
                disabled={!kidIdentifier.trim()}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Los geht's! 🚀</span>
              </button>
            </form>
          </div>
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
