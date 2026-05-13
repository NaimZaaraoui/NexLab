import { Calculator, Info } from 'lucide-react';
import type { CbcIndexResult } from '@/lib/calculations';

interface Props {
  indices: CbcIndexResult[];
  mode?: 'screen' | 'print';
}

const GROUP_LABELS: Record<CbcIndexResult['group'], string> = {
  microcytosis: 'Indices de discrimination des microcytoses',
  inflammation: 'Indices inflammatoires',
};

const GROUP_HELP: Record<CbcIndexResult['group'], string> = {
  microcytosis: "Affiché uniquement si le VGM est inférieur à 80 fL.",
  inflammation: "Calculs disponibles quand neutrophiles, lymphocytes, monocytes et plaquettes sont présents.",
};

export function CbcIndicesPanel({ indices, mode = 'screen' }: Props) {
  if (indices.length === 0) return null;

  const groups = (['microcytosis', 'inflammation'] as const)
    .map((group) => ({ group, items: indices.filter((index) => index.group === group) }))
    .filter(({ items }) => items.length > 0);

  const isPrint = mode === 'print';

  return (
    <div className={isPrint ? 'px-1 py-2' : 'py-2'}>
      <div className={isPrint ? 'mb-5 flex items-center gap-3' : 'mb-5 flex items-center gap-3'}>
        <div className={isPrint ? 'flex h-8 w-8 items-center justify-center rounded-md bg-black/5 text-black' : 'flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-accent)]'}>
          <Calculator size={isPrint ? 16 : 18} />
        </div>
        <div>
          <h3 className={isPrint ? 'text-sm font-black uppercase tracking-[0.22em] text-black' : 'text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]'}>
            Indices NFS calculés
          </h3>
          {!isPrint && (
            <p className="text-xs text-[var(--color-text-soft)]">
              Ces valeurs sont dérivées des paramètres CBC déjà saisis.
            </p>
          )}
        </div>
      </div>

      <div className={isPrint ? 'space-y-5' : 'space-y-4'}>
        {groups.map(({ group, items }) => (
          <section
            key={group}
            className={isPrint ? 'break-inside-avoid' : 'rounded-2xl border bg-[var(--color-surface)] p-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]'}
          >
            <div className={isPrint ? 'mb-3 flex items-center gap-3' : 'mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'}>
              <div className="flex items-center gap-2">
                <span className={isPrint ? 'text-[11px] font-black uppercase tracking-[0.2em] text-black/70' : 'text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]'}>
                  {GROUP_LABELS[group]}
                </span>
                {!isPrint && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-soft)]" title={GROUP_HELP[group]}>
                    <Info size={12} />
                  </span>
                )}
              </div>
              {!isPrint && <p className="text-xs text-[var(--color-text-soft)]">{GROUP_HELP[group]}</p>}
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className={isPrint ? 'bg-black/5' : 'bg-[var(--color-surface-muted)]/60'}>
                  <th className="py-2.5 pl-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 print:text-black/70">Indice</th>
                  <th className="py-2.5 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 print:text-black/70">Valeur</th>
                  <th className="py-2.5 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 print:text-black/70">Référence</th>
                  <th className="py-2.5 pr-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 print:text-black/70">Interprétation</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="even:bg-[var(--color-surface-muted)]/30 print:even:bg-black/2">
                    <td className="py-3 pl-3 align-top">
                      <div className="flex flex-col gap-0.5">
                        <span className={isPrint ? 'text-[12px] font-bold text-black' : 'text-sm font-semibold text-[var(--color-text)]'}>{item.name}</span>
                        <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400 print:text-black/45">{item.formula}</span>
                      </div>
                    </td>
                    <td className={isPrint ? 'py-3 align-top text-[13px] font-black text-black' : 'py-3 align-top text-sm font-bold text-[var(--color-text)]'}>
                      {item.displayValue}
                    </td>
                    <td className="py-3 align-top text-xs font-semibold text-[var(--color-text-soft)] print:text-black/70">
                      {item.reference}
                    </td>
                    <td className="py-3 pr-3 align-top max-w-[180px]">
                      <span className={item.isAlert ? 'text-xs font-bold text-rose-700 print:text-black' : 'text-xs font-semibold text-[var(--color-text-soft)] print:text-black/70'}>
                        {item.interpretation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <p className={isPrint ? 'mt-6 text-[10px] font-medium text-black/55 leading-relaxed' : 'mt-4 text-xs text-[var(--color-text-soft)]'}>
        Indices calculés automatiquement ; interprétation à confronter au contexte clinique et aux examens complémentaires.
      </p>
    </div>
  );
}
