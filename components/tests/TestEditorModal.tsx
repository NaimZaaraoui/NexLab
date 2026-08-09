'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Layers, Plus, Save, Settings2 } from 'lucide-react';
import { RESULT_TYPES, type CategoryOption, type TestFormState, type TestWithInventory, type TestsLabSettings } from '@/components/tests/types';
import { validateFormula } from '@/lib/clinical/calculated-tests';
import { LoincCombobox } from '@/components/tests/LoincCombobox';

interface TestEditorModalProps {
  open: boolean;
  editingTestId: string | null;
  form: TestFormState;
  isSexBased: boolean;
  categories: CategoryOption[];
  tests: TestWithInventory[];
  labSettings: TestsLabSettings;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFormChange: (next: TestFormState) => void;
  onSexBasedChange: (value: boolean) => void;
}

export function TestEditorModal({
  open,
  editingTestId,
  form,
  isSexBased,
  categories,
  tests,
  labSettings,
  onClose,
  onSubmit,
  onFormChange,
  onSexBasedChange,
}: TestEditorModalProps) {
  const formulaValidation = !form.isGroup && form.resultType === 'calculated'
    ? validateFormula(form.formula, tests.filter((test) => test.id !== editingTestId), form.code)
    : null;

  const handleSubmit = (event: React.FormEvent | React.MouseEvent) => {
    event.preventDefault();
    if (form.unit && (form.resultType === 'numeric' || form.resultType === 'calculated') && !form.isGroup) {
      const currentUnits = labSettings.clinical_units?.split(',').map(s => s.trim()) || [];
      const newUnit = form.unit.trim();
      if (newUnit && !currentUnits.includes(newUnit)) {
        const updatedUnits = [...currentUnits, newUnit].join(', ');
        fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: { clinical_units: updatedUnits } }),
        }).catch(() => {});
      }
    }
    onSubmit(event as React.FormEvent);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0 overflow-hidden">
        <DialogHeader className="flex items-start justify-between border-b border-[var(--color-border)] p-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${editingTestId ? 'bg-[var(--color-surface-muted)] text-[var(--color-text)]' : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'}`}>
              {editingTestId ? <Settings2 size={22} /> : <Plus size={22} />}
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-[var(--color-text)] sm:text-2xl">
                {editingTestId ? 'Modifier' : 'Ajouter'} test
              </DialogTitle>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Configurez les parametres de l&apos;analyse biologique.</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-[var(--color-surface)] p-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onFormChange({
                ...form,
                isGroup: false,
                resultType: form.resultType === 'text' ? 'numeric' : form.resultType,
              })}
              className={`rounded-xl border p-4 text-xs font-black uppercase tracking-[0.08em] transition-all ${!form.isGroup ? 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'}`}
            >
              Individuel
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ ...form, isGroup: true, resultType: 'text', unit: '', minValue: '', maxValue: '' })}
              className={`rounded-xl border p-4 text-xs font-black uppercase tracking-[0.08em] transition-all ${form.isGroup ? 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'}`}
            >
              Panel / Bilan
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">Code local</label>
              <input
                value={form.code}
                onChange={(event) => onFormChange({ ...form, code: event.target.value.toUpperCase() })}
                placeholder="Ex: HEMO"
                className="input-premium h-11 bg-[var(--color-surface)] uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">Code LOINC (Optionnel)</label>
              <LoincCombobox
                value={form.loincCode}
                onChange={(val) => onFormChange({ ...form, loincCode: val })}
              />
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">Nom complet</label>
              <input
                value={form.name}
                onChange={(event) => onFormChange({ ...form, name: event.target.value })}
                placeholder="Ex: Hemoglobine Glyquee"
                className="input-premium h-11 bg-[var(--color-surface)]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-xs font-black uppercase tracking-[0.08em] text-slate-500">Categorie</label>
              <select
                value={form.categoryId}
                onChange={(event) => onFormChange({ ...form, categoryId: event.target.value })}
                className="input-premium h-11 bg-[var(--color-surface)]"
              >
                <option value="">Selectionner...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-xs font-black uppercase tracking-[0.08em] text-slate-500">Panel Parent</label>
              <select
                value={form.parentId}
                onChange={(event) => onFormChange({ ...form, parentId: event.target.value })}
                className="input-premium h-11 bg-[var(--color-surface)]"
              >
                <option value="">-- Racine (Catalogue principal) --</option>
                {tests.filter((test) => test.isGroup && test.id !== editingTestId).map((panel) => (
                  <option key={panel.id} value={panel.id}>
                    {panel.code} - {panel.name}
                  </option>
                ))}
              </select>
            </div>
            {!form.isGroup && (
              <div className="space-y-2">
                <label className="ml-1 text-xs font-black uppercase tracking-[0.08em] text-slate-500">Type de Resultat</label>
                <select
                  value={form.resultType}
                  onChange={(event) => onFormChange({ ...form, resultType: event.target.value })}
                  className="input-premium h-11 bg-[var(--color-surface)]"
                >
                  {RESULT_TYPES.map((resultType) => (
                    <option key={resultType.value} value={resultType.value}>{resultType.label}</option>
                  ))}
                </select>
              </div>
            )}
            {form.resultType === 'dropdown' && !form.isGroup && (
              <div className="space-y-2">
                <label className="ml-1 text-xs font-black uppercase tracking-[0.08em] text-slate-500">Options (separees par virgule)</label>
                <input
                  value={form.options}
                  onChange={(event) => onFormChange({ ...form, options: event.target.value })}
                  placeholder="Ex: Positif, Negatif"
                  className="input-premium h-11 bg-[var(--color-surface)]"
                />
              </div>
            )}
            {form.resultType === 'calculated' && !form.isGroup && (
              <div className="space-y-2 md:col-span-2">
                <label className="ml-1 text-xs font-black uppercase tracking-[0.08em] text-slate-500">Formule</label>
                <textarea
                  value={form.formula}
                  onChange={(event) => onFormChange({ ...form, formula: event.target.value })}
                  placeholder="Ex: (HGB / HCT) * 100"
                  className="input-premium min-h-[96px] bg-[var(--color-surface)] p-3 font-mono text-sm"
                />
                <div className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-xs">
                  <p className="font-semibold text-[var(--color-text-secondary)]">
                    Utilisez les codes des tests avec seulement `+ - * / ( )`.
                  </p>
                  <p className={formulaValidation?.valid ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {formulaValidation?.valid
                      ? (form.formula?.trim().toUpperCase() === 'AUTO' ? 'Algorithme natif complexe sélectionné.' : `Dépendances détectées: ${formulaValidation.dependencies.join(', ')}`)
                      : (formulaValidation?.error || 'La formule est obligatoire.')}
                  </p>
                  <div className="h-px w-full bg-[var(--color-border)] opacity-50 my-2"></div>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    <span className="font-bold text-indigo-600">💡 Astuce : </span>
                    Pour les formules médicales internes complexes (ex: eGFR, Indices Hématologiques, Formule Leucocytaire), saisissez simplement le mot <code className="bg-[var(--color-surface-muted)] px-1.5 py-0.5 rounded font-mono font-bold text-indigo-700">AUTO</code>.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="ml-1 text-xs font-black uppercase tracking-[0.08em] text-slate-500">Echantillon</label>
              <select
                value={form.sampleType}
                onChange={(event) => onFormChange({ ...form, sampleType: event.target.value, sampleContainer: '' })}
                className="input-premium h-11 bg-[var(--color-surface)]"
              >
                <option value="">Selectionner...</option>
                {labSettings.sample_types.split(',').map((sample) => {
                  const value = sample.trim();
                  return <option key={value} value={value}>{value}</option>;
                })}
              </select>
            </div>
            {['Sang total', 'Sérum', 'Plasma'].includes(form.sampleType) && (
              <div className="space-y-2">
                <label className="ml-1 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                  Tube / Contenant
                </label>
                <select
                  value={form.sampleContainer}
                  onChange={(event) => onFormChange({ ...form, sampleContainer: event.target.value })}
                  className="input-premium h-11 bg-[var(--color-surface)]"
                >
                  <option value="">Non spécifié</option>
                  {labSettings.sample_containers.split(',').map((c) => {
                    const value = c.trim();
                    return <option key={value} value={value}>{value}</option>;
                  })}
                </select>
                <p className="ml-1 text-xs text-[var(--color-text-secondary)]">
                  Tube spécifique requis pour ce test (ex: EDTA pour NFS, Citrate pour coagulation)
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label className="ml-1 text-xs font-black uppercase tracking-[0.08em] text-slate-500">Montant ({labSettings.amount_unit})</label>
              <input
                type="number"
                value={form.price}
                onChange={(event) => onFormChange({ ...form, price: event.target.value })}
                placeholder="0"
                className="input-premium h-11 bg-[var(--color-surface)] text-[var(--color-accent)]"
              />
            </div>
            {!form.isGroup && (
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => onFormChange({ ...form, isOptional: !form.isOptional })}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                    form.isOptional
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-[11px] font-black uppercase tracking-[0.08em]">Résultat optionnel</p>
                    <p className="mt-0.5 text-xs">
                      Si activé, ce test ne bloquera pas la validation même si son résultat est vide
                      (ex: DFG calculé par script, dépend de l&apos;âge du patient)
                    </p>
                  </div>
                  <div className={`ml-4 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center ${
                    form.isOptional ? 'border-amber-500 bg-amber-500' : 'border-[var(--color-border)]'
                  }`}>
                    {form.isOptional && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>

          {!form.isGroup && (form.resultType === 'numeric' || form.resultType === 'calculated') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <h4 className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">Parametres Physico-chimiques</h4>
                <button
                  type="button"
                  onClick={() => onSexBasedChange(!isSexBased)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${isSexBased ? 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'}`}
                >
                  <Layers size={12} />
                  Plages par sexe
                </button>
              </div>

              <div className="grid grid-cols-2 items-end gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[var(--color-accent)] uppercase tracking-[0.08em] ml-1 text-center block">Unite</label>
                  <input list="clinical-units" value={form.unit} onChange={(event) => onFormChange({ ...form, unit: event.target.value })} placeholder="g/L" className="input-premium h-12 bg-[var(--color-surface)] text-center font-black" />
                  <datalist id="clinical-units">
                    {labSettings.clinical_units?.split(',').map((u) => {
                      const val = u.trim();
                      return val ? <option key={val} value={val} /> : null;
                    })}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-emerald-600 uppercase tracking-[0.08em] ml-1 text-center block">Min Std</label>
                  <input step="0.01" type="number" value={form.minValue} onChange={(event) => onFormChange({ ...form, minValue: event.target.value })} placeholder="0.00" className="input-premium h-12 bg-[var(--color-surface)] text-center font-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-rose-600 uppercase tracking-[0.08em] ml-1 text-center block">Max Std</label>
                  <input step="0.01" type="number" value={form.maxValue} onChange={(event) => onFormChange({ ...form, maxValue: event.target.value })} placeholder="∞" className="input-premium h-12 bg-[var(--color-surface)] text-center font-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-[0.08em] ml-1 text-center block">Dec</label>
                  <select value={form.decimals} onChange={(event) => onFormChange({ ...form, decimals: event.target.value })} className="input-premium h-12 bg-[var(--color-surface)] text-center font-black">
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>

                {isSexBased && (
                  <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-indigo-100/50">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-400 uppercase tracking-[0.08em] ml-1 text-center block">H Min</label>
                      <input step="0.01" type="number" value={form.minValueM} onChange={(event) => onFormChange({ ...form, minValueM: event.target.value })} placeholder="Min H" className="input-premium h-12 bg-[var(--color-surface)] text-center font-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-400 uppercase tracking-[0.08em] ml-1 text-center block">H Max</label>
                      <input step="0.01" type="number" value={form.maxValueM} onChange={(event) => onFormChange({ ...form, maxValueM: event.target.value })} placeholder="Max H" className="input-premium h-12 bg-[var(--color-surface)] text-center font-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-rose-400 uppercase tracking-[0.08em] ml-1 text-center block">F Min</label>
                      <input step="0.01" type="number" value={form.minValueF} onChange={(event) => onFormChange({ ...form, minValueF: event.target.value })} placeholder="Min F" className="input-premium h-12 bg-[var(--color-surface)] text-center font-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-rose-400 uppercase tracking-[0.08em] ml-1 text-center block">F Max</label>
                      <input step="0.01" type="number" value={form.maxValueF} onChange={(event) => onFormChange({ ...form, maxValueF: event.target.value })} placeholder="Max F" className="input-premium h-12 bg-[var(--color-surface)] text-center font-black" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <button onClick={onClose} className="btn-secondary-md">
            Annuler
          </button>
          <button onClick={handleSubmit} className="btn-primary-md min-w-[160px] justify-center">
            <Save size={16} /> <span>Enregistrer</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
