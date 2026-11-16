// Runs the schema and permission checks against every migration, in order, using the
// PGlite package (PostgreSQL in WebAssembly) installed as a root devDependency.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'supabase/migrations');
const migrations = readdirSync(dir)
  .filter(f => f.endsWith('.sql'))
  .sort()
  .map(f => path.join(dir, f));
const r = spawnSync(
  process.execPath,
  [path.join(root, 'supabase/tests/schema.test.mjs'), root, ...migrations],
  { stdio: 'inherit' }
);
process.exit(r.status ?? 1);
