'use client';

import { useState } from 'react';
import { UserPlus, RefreshCw, Shield, XCircle } from 'lucide-react';

interface Props {
  onUserCreated: () => void;
}

export function UserCreateForm({ onUserCreated }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'TECHNICIEN',
    password: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      setFormData({ name: '', email: '', role: 'TECHNICIEN', password: '' });
      onUserCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
        <UserPlus size={20} className="text-[var(--color-text-soft)]" />
        Nouveau Compte
      </h3>

      <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2 ml-1">Nom complet</label>
          <input 
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="input-premium h-12"
            placeholder="Jean Dupont"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2 ml-1">Email personnel</label>
          <input 
            type="email" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="input-premium h-12"
            placeholder="j.dupont@nexlab.local"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2 ml-1">Rôle système</label>
          <select 
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            className="input-premium h-12 appearance-none cursor-pointer"
            required
          >
            <option value="TECHNICIEN">Technicien</option>
            <option value="MEDECIN">Médecin / Biologiste</option>
            <option value="RECEPTIONNISTE">Réceptionniste</option>
            <option value="ADMIN">Administrateur</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2 ml-1">Mot de passe initial</label>
          <input 
            type="password" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="input-premium h-12"
            placeholder="••••••••"
            required
            minLength={8}
          />
          <p className="text-[10px] text-slate-400 mt-2 ml-1 flex items-center gap-1">
            <Shield size={10} />
            L&apos;utilisateur devra le changer au 1er accès
          </p>
        </div>

        {error && (
          <div className="xl:col-span-2 flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <XCircle size={16} className="shrink-0 text-[var(--color-text-soft)]" />
            <p className="text-xs font-semibold text-[var(--color-text)]">{error}</p>
          </div>
        )}

        <button 
          type="submit" 
          disabled={submitLoading}
          className="btn-primary-md xl:col-span-2 w-full text-sm font-semibold"
        >
          {submitLoading ? <RefreshCw className="animate-spin mx-auto" size={18} /> : 'Créer le Compte'}
        </button>
      </form>
    </div>
  );
}
