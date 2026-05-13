import { InventoryModalShell } from '@/components/inventory/InventoryModalShell';
import type { TestOption } from '@/components/inventory/types';

interface Props {
  tests: TestOption[];
  testId: string;
  quantityPerTest: string;
  onTestIdChange: (v: string) => void;
  onQuantityPerTestChange: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function InventoryRuleModal({
  tests,
  testId,
  quantityPerTest,
  onTestIdChange,
  onQuantityPerTestChange,
  onClose,
  onSubmit,
}: Props) {
  return (
    <InventoryModalShell open={true} title="Ajouter une règle de consommation" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex min-h-full flex-col">
        <div className="grid flex-1 gap-4">
          <label className="grid gap-1">
            <span className="form-label">Test</span>
            <select
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={testId}
              onChange={(e) => onTestIdChange(e.target.value)}
            >
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.code} · {test.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="form-label">Quantité par analyse</span>
            <input
              type="number"
              step="0.01"
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={quantityPerTest}
              onChange={(e) => onQuantityPerTestChange(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
          <button className="btn-primary-md px-5" type="submit">Enregistrer</button>
        </div>
      </form>
    </InventoryModalShell>
  );
}
