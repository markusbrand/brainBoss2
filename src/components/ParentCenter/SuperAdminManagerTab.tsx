import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  Users,
  Search,
  CheckCircle,
  Clock,
  Sparkles,
  Mail,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { AuthorizedUser, UserRole } from '../../types';
import { SUPER_ADMIN_EMAIL } from '../../lib/firebase';
import {
  fetchAuthorizedUsers,
  addAuthorizedAdmin,
  removeAuthorizedAdmin,
} from '../../utils/storage';
import { soundFx } from '../../utils/audio';

interface SuperAdminManagerTabProps {
  currentEmail?: string;
}

export const SuperAdminManagerTab: React.FC<SuperAdminManagerTabProps> = ({ currentEmail }) => {
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('parent');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userToRevoke, setUserToRevoke] = useState<string | null>(null);

  const isSuperAdmin = Boolean(
    (SUPER_ADMIN_EMAIL && (currentEmail || '').toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) ||
    !SUPER_ADMIN_EMAIL
  );

  const loadList = async () => {
    setLoading(true);
    try {
      const list = await fetchAuthorizedUsers();
      setUsers(list);
    } catch (e) {
      console.error('Failed to load authorized users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setErrorMsg('Bitte gib eine gültige E-Mail-Adresse ein.');
      soundFx.playWrong();
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      soundFx.playPop();

      const updated = await addAuthorizedAdmin(newEmail.trim(), newRole, newName.trim(), newNotes.trim());
      setUsers(updated);
      setSuccessMsg(`Benutzer ${newEmail} wurde erfolgreich als ${newRole === 'super_admin' ? 'Administrator' : 'Elternteil'} autorisiert.`);
      soundFx.playCorrect();

      // Reset form
      setNewEmail('');
      setNewName('');
      setNewNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim Hinzufügen.');
      soundFx.playWrong();
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleRequestRemoveUser = (email: string) => {
    if (SUPER_ADMIN_EMAIL && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setErrorMsg('Der Hauptadministrator kann nicht gelöscht werden.');
      soundFx.playWrong();
      return;
    }
    soundFx.playPop();
    setUserToRevoke(email);
  };

  const handleConfirmRevoke = async () => {
    if (!userToRevoke) return;
    const email = userToRevoke;
    try {
      soundFx.playPop();
      const updated = await removeAuthorizedAdmin(email);
      setUsers(updated);
      setUserToRevoke(null);
      setSuccessMsg(`Autorisierung für ${email} widerrufen.`);
      soundFx.playCorrect();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim Entfernen.');
      soundFx.playWrong();
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-lg">Haupt-Administrator-Verwaltung</h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Aktives Hauptkonto: <span className="text-amber-300 font-mono font-medium">{currentEmail || 'Super Administrator'}</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 py-2 px-3.5 rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Autorisierte Konten: <strong className="text-white">{users.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add New Authorized Parent Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <UserPlus className="w-4 h-4 text-indigo-400" />
          <span>Neuen Administrator / Elternteil autorisieren</span>
        </div>

        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Google E-Mail-Adresse *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input_admin_email"
                  type="email"
                  required
                  placeholder="elternteil@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Name / Bezeichnung (optional)
              </label>
              <input
                id="input_admin_name"
                type="text"
                placeholder="z. B. Familie Müller / Fr. Gruber"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Rolle & Berechtigungsstufe
              </label>
              <select
                id="select_admin_role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="parent">Elternteil (Kinder, Klassen & Tests verwalten)</option>
                <option value="super_admin">Co-Administrator (Volle Systemrechte)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Notiz / Bemerkung (z. B. Schule, Klassenstufe, Telefon)
            </label>
            <input
              id="input_admin_notes"
              type="text"
              placeholder="z. B. Eltern von Lukas & Mia (3A & 4B)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              id="btn_add_authorized_user"
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Wird gespeichert...' : 'Benutzer freischalten'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Authorized Users List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Aktive & Autorisierte Konten ({filteredUsers.length})</span>
          </div>

          <div className="w-full sm:w-64 relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Suchen nach E-Mail, Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Lade Konten...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Keine autorisierten Benutzer gefunden.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => {
              const isRoot = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
              return (
                <div
                  key={user.email}
                  className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isRoot
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {isRoot ? '★' : user.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{user.displayName || user.email}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            isRoot
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : user.role === 'super_admin'
                              ? 'bg-purple-400/20 text-purple-300 border border-purple-400/30'
                              : 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                          }`}
                        >
                          {isRoot ? 'Haupt-Admin' : user.role === 'super_admin' ? 'Administrator' : 'Elternteil'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 font-mono">
                        <span>{user.email}</span>
                        {user.notes && (
                          <span className="text-slate-500 font-sans italic truncate max-w-xs">
                            — {user.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-[10px] text-slate-500">
                      Seit {new Date(user.createdAt).toLocaleDateString('de-DE')}
                    </span>

                    {!isRoot && (
                      <button
                        type="button"
                        onClick={() => handleRequestRemoveUser(user.email)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                        title="Zugriff widerrufen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revocation Confirmation Modal */}
      {userToRevoke && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Zugriff widerrufen?</h4>
                <p className="text-xs text-rose-300/80 font-medium">
                  Autorisierung für diesen Account entfernen
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Möchtest du die Berechtigung für <strong className="text-white font-mono">{userToRevoke}</strong> wirklich widerrufen? Dieser Benutzer verliert sofort den Zugang zum Elternbereich.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToRevoke(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Zugriff widerrufen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
