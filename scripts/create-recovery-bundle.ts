import 'dotenv/config';
import { createRecoveryBundle } from '@/lib/recovery-bundles';

async function main() {
  const bundle = await createRecoveryBundle();
  console.log(`Recovery bundle created: ${bundle.fileName}`);
  console.log(`Path: ${bundle.absolutePath}`);
  console.log(`Size: ${bundle.size} bytes`);
}

main().catch((error) => {
  console.error('Recovery bundle creation failed:', error);
  process.exit(1);
});
