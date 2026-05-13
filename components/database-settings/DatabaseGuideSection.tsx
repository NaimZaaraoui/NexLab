export function DatabaseGuideSection() {
  return (
    <>
      <section className="bento-panel p-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Bonnes pratiques</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Crée une sauvegarde avant une migration, un import massif ou une maintenance sensible. Les téléchargements et
            restaurations sont journalisés dans l&apos;audit.
          </p>
        </div>
        <div className="mt-4 rounded-2xl border bg-[var(--color-surface)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Checklist opérateur</h3>
          <div className="mt-3 space-y-2 text-sm text-[var(--color-text-soft)]">
            <p>1. Vérifier qu&apos;un backup récent existe.</p>
            <p>2. Vérifier qu&apos;un bundle de reprise récent existe.</p>
            <p>3. Tester régulièrement un backup ou un bundle sans restaurer.</p>
            <p>4. Faire une vraie restauration de test à intervalles réguliers sur une machine de validation.</p>
          </div>
        </div>
      </section>

      <section className="bento-panel p-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Guide d&apos;installation des sauvegardes</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Un guide complet est disponible dans le fichier{' '}
            <span className="font-semibold text-[var(--color-text)]">`BACKUP_SETUP.md`</span> à la racine du projet.
          </p>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <article className="rounded-2xl border bg-[var(--color-surface)] p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Linux</h3>
            <p className="mt-2 text-sm text-[var(--color-text-soft)]">
              Utilise <span className="font-semibold text-[var(--color-text)]">cron</span> pour lancer le backup chaque nuit.
            </p>
            <code className="mt-3 block overflow-x-auto rounded-xl bg-slate-950 px-3 py-3 text-xs text-slate-100">
              0 2 * * * cd /chemin/vers/nexlab &amp;&amp; npm run backup:run &gt;&gt; backups/backup.log 2&gt;&amp;1
            </code>
          </article>

          <article className="rounded-2xl border bg-[var(--color-surface)] p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Windows</h3>
            <p className="mt-2 text-sm text-[var(--color-text-soft)]">
              Utilise le <span className="font-semibold text-[var(--color-text)]">Planificateur de tâches</span> avec un script{' '}
              <code>.bat</code>.
            </p>
            <code className="mt-3 block overflow-x-auto rounded-xl bg-slate-950 px-3 py-3 text-xs text-slate-100">
              cd /d C:\nexlab{'\n'}npm run backup:run &gt;&gt; backups\backup.log 2&gt;&amp;1
            </code>
          </article>

          <article className="rounded-2xl border bg-[var(--color-surface)] p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">macOS</h3>
            <p className="mt-2 text-sm text-[var(--color-text-soft)]">
              Utilise <span className="font-semibold text-[var(--color-text)]">launchd</span> ou cron selon le poste
              d&apos;installation.
            </p>
            <code className="mt-3 block overflow-x-auto rounded-xl bg-slate-950 px-3 py-3 text-xs text-slate-100">
              0 2 * * * cd /Users/installateur/nexlab &amp;&amp; npm run backup:run &gt;&gt; backups/backup.log 2&gt;&amp;1
            </code>
          </article>
        </div>
      </section>
    </>
  );
}
