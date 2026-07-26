import { BatchEntry } from '@/components/analyses/BatchEntry';

export const metadata = {
  title: 'Saisie en Série | NEXLAB',
};

export default function BatchPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)]">
      <BatchEntry />
    </div>
  );
}
