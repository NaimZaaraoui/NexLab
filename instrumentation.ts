export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { checkDatabaseIntegrity } = await import('./lib/database-integrity');
    checkDatabaseIntegrity();
  }
}
