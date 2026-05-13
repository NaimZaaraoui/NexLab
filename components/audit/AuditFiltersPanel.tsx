'use client';

import { Download, RefreshCw, Search } from 'lucide-react';

interface AuditFiltersPanelProps {
  query: string;
  action: string;
  moduleName: string;
  entity: string;
  severity: string;
  from: string;
  to: string;
  pageSize: number;
  csvExportHref: string;
  onQueryChange: (value: string) => void;
  onActionChange: (value: string) => void;
  onModuleNameChange: (value: string) => void;
  onEntityChange: (value: string) => void;
  onSeverityChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onPageSizeChange: (value: number) => void;
  onFilter: () => void;
  onReset: () => void;
}

export function AuditFiltersPanel(props: AuditFiltersPanelProps) {
  const {
    query,
    action,
    moduleName,
    entity,
    severity,
    from,
    to,
    pageSize,
    csvExportHref,
    onQueryChange,
    onActionChange,
    onModuleNameChange,
    onEntityChange,
    onSeverityChange,
    onFromChange,
    onToChange,
    onPageSizeChange,
    onFilter,
    onReset,
  } = props;

  return (
    <section className="rounded-2xl border bg-[var(--color-surface)] p-5 shadow-[0_6px_18px_rgba(15,31,51,0.04)]">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-8">
        <label className="xl:col-span-2">
          <span className="form-label mb-1.5">Recherche</span>
          <div className="input-premium flex h-11 items-center gap-2">
            <Search size={16} className="text-[var(--color-text-soft)]" />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Utilisateur, action, ID..." className="w-full border-none bg-transparent outline-none" />
          </div>
        </label>
        <label>
          <span className="form-label mb-1.5">Module</span>
          <select value={moduleName} onChange={(event) => onModuleNameChange(event.target.value)} className="input-premium h-11">
            <option value="">Tous</option>
            <option value="qc">QC</option>
            <option value="inventory">Inventaire</option>
            <option value="database">Base de données</option>
            <option value="temperature">Températures</option>
            <option value="analyses">Analyses</option>
            <option value="patients">Patients</option>
            <option value="tests">Tests</option>
            <option value="users">Utilisateurs</option>
            <option value="settings">Paramètres</option>
          </select>
        </label>
        <label>
          <span className="form-label mb-1.5">Action</span>
          <input value={action} onChange={(event) => onActionChange(event.target.value)} className="input-premium h-11" placeholder="ex: user.create" />
        </label>
        <label>
          <span className="form-label mb-1.5">Entité</span>
          <input value={entity} onChange={(event) => onEntityChange(event.target.value)} className="input-premium h-11" placeholder="ex: user" />
        </label>
        <label>
          <span className="form-label mb-1.5">Criticité</span>
          <select value={severity} onChange={(event) => onSeverityChange(event.target.value)} className="input-premium h-11">
            <option value="">Toutes</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </label>
        <label>
          <span className="form-label mb-1.5">Du</span>
          <input type="date" value={from} onChange={(event) => onFromChange(event.target.value)} className="input-premium h-11" />
        </label>
        <label>
          <span className="form-label mb-1.5">Au</span>
          <input type="date" value={to} onChange={(event) => onToChange(event.target.value)} className="input-premium h-11" />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-4">
        <label className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-soft)]">Par page</span>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="input-premium h-10 w-24">
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button onClick={onFilter} className="btn-secondary-sm bg-slate-900 text-white hover:bg-slate-800">
          <Search size={16} />
          Filtrer
        </button>
        <button onClick={onReset} className="btn-secondary-sm">
          <RefreshCw size={16} />
          Réinitialiser
        </button>
        <a href={csvExportHref} className="btn-secondary-sm">
          <Download size={16} />
          Export CSV
        </a>
      </div>
    </section>
  );
}
