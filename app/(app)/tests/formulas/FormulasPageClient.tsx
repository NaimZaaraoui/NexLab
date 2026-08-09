'use client';

import { useState, useTransition, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Info,
  Loader2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { PageBackLink } from '@/components/ui/PageBackLink';
import { TestEditorModal } from '@/components/tests/TestEditorModal';
import { NotificationToast } from '@/components/ui/notification-toast';
import {
  createTestAction,
  updateTestAction,
  getCategories,
  getLabSettings,
} from '@/app/actions/tests';
import type { FormulaWithStatus } from '@/app/actions/formulas';
import { testFormulaLive, getCalculatedTests } from '@/app/actions/formulas';
import { extractFormulaDependencies } from '@/lib/clinical/calculated-tests';
import type {
  CategoryOption,
  TestFormState,
  TestWithInventory,
  TestsLabSettings,
} from '@/components/tests/types';
import { EMPTY_TEST_FORM } from '@/components/tests/types';

type NumericTest = { id: string; code: string; name: string };

/* ─── Status config ─────────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  valid: {
    label: 'Valide',
    icon: CheckCircle2,
    row: 'border-l-emerald-400 bg-emerald-50/30',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon_color: 'text-emerald-500',
  },
  broken: {
    label: 'Brisée',
    icon: XCircle,
    row: 'border-l-red-400 bg-red-50/30',
    badge: 'bg-red-50 text-red-700 border-red-200',
    icon_color: 'text-red-500',
  },
  empty: {
    label: 'Non configurée',
    icon: AlertTriangle,
    row: 'border-l-amber-400 bg-amber-50/30',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon_color: 'text-amber-500',
  },
} as const;

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function FormulaStatusBadge({ status }: { status: FormulaWithStatus['status'] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.badge}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function DependencyTag({ code, broken }: { code: string; broken: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-mono font-semibold border ${broken
        ? 'bg-red-50 text-red-700 border-red-300 line-through opacity-60'
        : 'bg-slate-100 text-slate-700 border-slate-200'
      }`}>
      {broken && <AlertTriangle size={9} />}
      {code}
    </span>
  );
}

function LiveTester({
  formula,
  decimals,
  numericTests,
}: {
  formula: string;
  decimals: number;
  numericTests: NumericTest[];
}) {
  const deps = formula ? extractFormulaDependencies(formula) : [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [liveResult, setLiveResult] = useState<{ ok: boolean; result?: string; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTest = useCallback(() => {
    startTransition(async () => {
      const result = await testFormulaLive(formula, values, decimals);
      setLiveResult(result);
    });
  }, [formula, values, decimals]);

  if (deps.length === 0) {
    return (
      <p className="text-xs text-[var(--color-text-secondary)] italic">
        Aucune dépendance détectée — vérifiez la formule.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {deps.map((dep) => {
          const test = numericTests.find((t) => t.code === dep);
          return (
            <div key={dep} className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                {test ? `${dep} — ${test.name}` : dep}
              </label>
              <input
                type="number"
                step="any"
                value={values[dep] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [dep]: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm font-mono tabular-nums focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleTest}
          disabled={isPending}
          className="btn-primary h-8 gap-1.5 text-xs"
        >
          {isPending ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          Calculer
        </button>
        {liveResult && (
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold ${liveResult.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
            }`}>
            {liveResult.ok ? (
              <>
                <CheckCircle2 size={14} />
                Résultat : <span className="font-mono font-black">{liveResult.result}</span>
              </>
            ) : (
              <>
                <XCircle size={14} />
                {liveResult.error}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FormulaRow({
  formula,
  numericTests,
  isExpanded,
  onToggle,
  onEdit,
}: {
  formula: FormulaWithStatus;
  numericTests: NumericTest[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (formula: FormulaWithStatus) => void;
}) {
  const cfg = STATUS_CONFIG[formula.status];
  const Icon = cfg.icon;

  return (
    <div className={`border-l-4 rounded-r-xl border border-[var(--color-border)] overflow-hidden transition-shadow ${cfg.row} ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-3.5 text-left"
      >
        <Icon size={16} className={`shrink-0 ${cfg.icon_color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-black text-[var(--color-text)]">{formula.code}</span>
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
            <span className="text-sm font-semibold text-[var(--color-text)]">{formula.name}</span>
            {formula.categoryName && (
              <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-full px-2 py-0.5">
                {formula.categoryName}
              </span>
            )}
          </div>
          {formula.options && (
            <code className="mt-1 block text-[12px] font-mono text-slate-500 truncate max-w-lg">
              {formula.options}
            </code>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {formula.dependencies.length > 0 && (
            <span className="text-[11px] text-[var(--color-text-secondary)]">
              {formula.dependencies.length} dép.
            </span>
          )}
          <FormulaStatusBadge status={formula.status} />
          <ChevronRight
            size={16}
            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 space-y-5">
          {/* Formula display */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
                Formule
              </h4>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(formula); }}
                className="btn-secondary h-7 gap-1 text-xs"
              >
                <Pencil size={11} />
                Modifier
              </button>
            </div>
            {formula.options ? (
              <code className="block rounded-lg border border-[var(--color-border)] bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-800">
                {formula.options}
              </code>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-sm text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  Aucune formule configurée.
                </p>
              </div>
            )}
          </div>

          {/* Dependencies */}
          {formula.dependencies.length > 0 && (
            <div>
              <h4 className="mb-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
                Dépendances ({formula.dependencies.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {formula.dependencies.map((dep) => (
                  <DependencyTag key={dep} code={dep} broken={formula.brokenDeps.includes(dep)} />
                ))}
              </div>
              {formula.brokenDeps.length > 0 && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1.5">
                  <XCircle size={12} />
                  Les tests barrés sont introuvables dans le catalogue.
                </p>
              )}
            </div>
          )}

          {/* Live tester */}
          <div>
            <h4 className="mb-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
              Testeur en direct
            </h4>
            <LiveTester formula={formula.options ?? ''} decimals={formula.decimals ?? 2} numericTests={numericTests} />
          </div>

          {formula.unit && (
            <p className="text-xs text-[var(--color-text-secondary)]">
              Unité : <strong>{formula.unit}</strong> · Décimales : <strong>{formula.decimals ?? 2}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────────── */

export function FormulasPageClient({
  initialFormulas,
  initialNumericTests,
  initialCategories,
  initialLabSettings,
  initialAllTests,
}: {
  initialFormulas: FormulaWithStatus[];
  initialNumericTests: NumericTest[];
  initialCategories: CategoryOption[];
  initialLabSettings: TestsLabSettings;
  initialAllTests: TestWithInventory[];
}) {
  const [formulas, setFormulas] = useState(initialFormulas);
  const [allTests, setAllTests] = useState(initialAllTests);
  const [categories] = useState(initialCategories);
  const [labSettings] = useState(initialLabSettings);
  const [numericTests] = useState(initialNumericTests);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  // Editor modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [form, setForm] = useState<TestFormState>({ ...EMPTY_TEST_FORM, resultType: 'calculated' });
  const [isSexBased, setIsSexBased] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleRefresh = () => {
    startRefresh(async () => {
      const fresh = await getCalculatedTests();
      setFormulas(fresh);
    });
  };

  // Open modal for new formula
  const handleNew = () => {
    setEditingTestId(null);
    setForm({ ...EMPTY_TEST_FORM, resultType: 'calculated' });
    setIsSexBased(false);
    setShowModal(true);
  };

  // Open modal for existing formula
  const handleEdit = useCallback((formula: FormulaWithStatus) => {
    const test = allTests.find((t) => t.id === formula.id);
    if (!test) return;
    setEditingTestId(test.id);
    setForm({
      code: test.code,
      loincCode: test.loincCode || '',
      name: test.name,
      unit: test.unit || '',
      minValue: test.minValue?.toString() || '',
      maxValue: test.maxValue?.toString() || '',
      minValueM: test.minValueM?.toString() || '',
      maxValueM: test.maxValueM?.toString() || '',
      minValueF: test.minValueF?.toString() || '',
      maxValueF: test.maxValueF?.toString() || '',
      decimals: test.decimals?.toString() || '1',
      resultType: 'calculated',
      formula: test.options || '',
      categoryId: test.categoryId || '',
      parentId: test.parentId || '',
      options: test.options || '',
      isGroup: false,
      isOptional: test.isOptional ?? false,
      sampleType: test.sampleType || '',
      sampleContainer: test.sampleContainer || '',
      price: test.price?.toString() || '0',
    });
    setIsSexBased(!!(test.minValueM || test.maxValueM || test.minValueF || test.maxValueF));
    setShowModal(true);
  }, [allTests]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setEditingTestId(null);
    setForm({ ...EMPTY_TEST_FORM, resultType: 'calculated' });
    setIsSexBased(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) {
      showNotification('error', 'Code et nom sont obligatoires');
      return;
    }

    const result = editingTestId
      ? await updateTestAction({ ...form, id: editingTestId } as unknown as Parameters<typeof updateTestAction>[0])
      : await createTestAction(form as unknown as Parameters<typeof createTestAction>[0]);

    if (result && 'success' in result && result.success) {
      showNotification('success', editingTestId ? 'Formule modifiée' : 'Test calculé créé');
      handleClose();
      // Refresh data
      startRefresh(async () => {
        const fresh = await getCalculatedTests();
        setFormulas(fresh);
      });
    } else if (result && 'error' in result) {
      showNotification('error', result.error || 'Erreur serveur');
    }
  }, [form, editingTestId, showNotification, handleClose]);

  const filtered = formulas.filter((f) => {
    const q = search.toLowerCase();
    return (
      !q ||
      f.code.toLowerCase().includes(q) ||
      f.name.toLowerCase().includes(q) ||
      f.options?.toLowerCase().includes(q) ||
      f.dependencies.some((d) => d.toLowerCase().includes(q))
    );
  });

  const stats = {
    total: formulas.length,
    valid: formulas.filter((f) => f.status === 'valid').length,
    broken: formulas.filter((f) => f.status === 'broken').length,
    empty: formulas.filter((f) => f.status === 'empty').length,
  };

  return (
    <div className="mx-auto max-w-screen-xl space-y-6 pb-16">
      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}

      {/* Header */}
      <section className="bento-panel px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <PageBackLink href="/tests" />
            <div className="mt-3 flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <FlaskConical size={22} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--color-text)]">Formules de calcul</h1>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                  Visualisez, testez et gérez tous les tests calculés automatiquement.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap self-start md:self-center">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-secondary h-9 gap-1.5 text-xs"
            >
              {isRefreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Actualiser
            </button>
            <button
              onClick={handleNew}
              className="btn-primary h-9 gap-1.5 text-xs"
            >
              <Plus size={14} />
              Nouveau test calculé
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-[var(--color-text)]', bg: 'bg-[var(--color-surface-muted)]' },
          { label: 'Valides', value: stats.valid, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Brisées', value: stats.broken, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Non config.', value: stats.empty, color: 'text-amber-700', bg: 'bg-amber-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`bento-panel px-4 py-3 ${bg}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Broken formula alert */}
      {stats.broken > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">
            <strong>{stats.broken} formule{stats.broken > 1 ? 's' : ''} brisée{stats.broken > 1 ? 's' : ''}</strong> — les tests sources référencés sont introuvables. Cliquez sur la ligne puis &quot;Modifier&quot; pour corriger.
          </p>
        </div>
      )}

      {/* Search + list */}
      <section className="bento-panel">
        <div className="border-b border-[var(--color-border)] px-5 py-3">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par code, nom, formule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-8 pr-3 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
            />
          </div>
        </div>

        <div className="space-y-2 p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-[var(--color-text-secondary)]">
              <FlaskConical size={32} className="opacity-30" />
              <p className="text-sm font-semibold">Aucun test calculé trouvé</p>
              <button onClick={handleNew} className="btn-primary h-9 gap-1.5 text-xs">
                <Plus size={14} />
                Créer le premier test calculé
              </button>
            </div>
          ) : (
            filtered.map((formula) => (
              <FormulaRow
                key={formula.id}
                formula={formula}
                numericTests={numericTests}
                isExpanded={expandedId === formula.id}
                onToggle={() => setExpandedId(expandedId === formula.id ? null : formula.id)}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <div className="border-t border-[var(--color-border)] px-5 py-3 flex items-center gap-1.5">
            <Info size={12} className="text-slate-400" />
            <p className="text-xs text-[var(--color-text-secondary)]">
              {filtered.length} formule{filtered.length > 1 ? 's' : ''} · Cliquez sur une ligne pour voir les détails et tester.
            </p>
          </div>
        )}
      </section>

      {/* TestEditorModal */}
      <TestEditorModal
        open={showModal}
        editingTestId={editingTestId}
        form={form}
        isSexBased={isSexBased}
        categories={categories}
        tests={allTests}
        labSettings={labSettings}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onFormChange={setForm}
        onSexBasedChange={setIsSexBased}
      />
    </div>
  );
}
