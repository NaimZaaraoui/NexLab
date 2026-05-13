import '@/app/globals.css';

export default function DiagnosticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-muted)]">
      {children}
    </div>
  );
}