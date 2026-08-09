import { getCalculatedTests, getAllNumericTests } from '@/app/actions/formulas';
import { getCategories, getLabSettings, getTests } from '@/app/actions/tests';
import { FormulasPageClient } from './FormulasPageClient';

export default async function FormulasPage() {
  const [formulas, numericTests, categories, labSettings, allTests] = await Promise.all([
    getCalculatedTests(),
    getAllNumericTests(),
    getCategories(),
    getLabSettings(),
    getTests(),
  ]);

  return (
    <FormulasPageClient
      initialFormulas={formulas}
      initialNumericTests={numericTests}
      initialCategories={categories}
      initialLabSettings={labSettings}
      initialAllTests={allTests}
    />
  );
}
