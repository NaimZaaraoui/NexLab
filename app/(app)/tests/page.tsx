import { getTests, getCategories, getLabSettings } from '@/app/actions/tests';
import { TestsPageClient } from './TestsPageClient';

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [tests, categories, labSettings] = await Promise.all([
    getTests(params.category, params.q),
    getCategories(),
    getLabSettings(),
  ]);

  return (
    <TestsPageClient
      initialTests={tests}
      initialCategories={categories}
      initialLabSettings={labSettings}
    />
  );
}
