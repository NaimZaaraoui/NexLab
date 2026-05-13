'use client';

import { 
  RefreshCw, 
  User as UserIcon, 
  Key,
  UserCheck,
  UserX,
  Settings
} from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PageBackLink } from '@/components/ui/PageBackLink';
import { useUsersManager } from '@/components/users/useUsersManager';
import { UserCreateForm } from '@/components/users/UserCreateForm';

const ROLE_CONFIG: Record<string, { label: string; class: string }> = {
  ADMIN: { label: 'Administrateur', class: 'bg-[var(--color-surface-muted)] text-[var(--color-text)] border-[var(--color-border)]' },
  MEDECIN: { label: 'Médecin', class: 'bg-[var(--color-surface-muted)] text-[var(--color-text)] border-[var(--color-border)]' },
  TECHNICIEN: { label: 'Technicien', class: 'bg-[var(--color-surface-muted)] text-[var(--color-text)] border-[var(--color-border)]' },
  RECEPTIONNISTE: { label: 'Réceptionniste', class: 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border-[var(--color-border)]' },
};

export default function UsersManagementPage() {
  const state = useUsersManager();

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <PageBackLink href="/" />
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Gestion des utilisateurs</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">Gérer les accès et rôles du personnel du laboratoire.</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-[var(--color-text-soft)]">
            <Settings className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">Mode administrateur</span>
          </div>
        </div>
      </section>

      <div className="space-y-8">
        {/* Section A: User List */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-5">
              <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2">
                <UserIcon size={18} className="text-[var(--color-text-soft)]" />
                Liste du Personnel
              </h3>
              <button 
                onClick={state.fetchUsers}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              >
                <RefreshCw size={16} className={state.loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="overflow-x-auto">
              {state.loading ? (
                <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                  <RefreshCw size={40} className="animate-spin text-indigo-500" />
                  <p className="font-bold uppercase tracking-widest text-xs">Chargement des données...</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left">
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Utilisateur</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Rôle</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Statut</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {state.users.map((user) => (
                      <tr key={user.id} className={`group transition-colors ${!user.isActive ? 'bg-[var(--color-surface-muted)]/55 opacity-70' : 'hover:bg-[var(--color-surface-muted)]/35'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-bold ${user.isActive ? 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]' : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-slate-400'}`}>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--color-text)]">{user.name}</p>
                              <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`status-pill border ${ROLE_CONFIG[user.role]?.class || 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border-[var(--color-border)]'}`}>
                            {ROLE_CONFIG[user.role]?.label || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.isActive ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)]">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                              Actif
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              Désactivé
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => state.handleResetPassword(user)}
                              title="Réinitialiser MDP"
                              className="rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-soft)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                            >
                              <Key size={16} />
                            </button>
                            
                            {/* Protection: Ne pas pouvoir se désactiver soi-même ou le dernier admin */}
                            {!(user.id === state.currentUserId || (user.role === 'ADMIN' && state.adminCount <= 1 && user.isActive)) && (
                              <button 
                                onClick={() => state.handleToggleActive(user)}
                                title={user.isActive ? "Désactiver" : "Activer"}
                                className="rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-soft)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                              >
                                {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Section B: Create User Form */}
        <div className="space-y-6">
          <UserCreateForm onUserCreated={state.fetchUsers} />
        </div>
      </div>

      <ConfirmationModal
        isOpen={state.confirmModal.isOpen}
        onClose={state.closeConfirmModal}
        onConfirm={state.confirmModal.action}
        title={state.confirmModal.title}
        message={state.confirmModal.message}
        type={state.confirmModal.type}
        icon={state.confirmModal.icon}
      />
    </div>
  );
}
