import { readFile, mkdir, writeFile } from 'node:fs/promises';
const names = ['template', 'catalog', 'channel', 'generation-record'];
let source = '// Generated from schemas/*.schema.json; run node scripts/generate-schemas.mjs.\n';
for (const name of names) {
  const schema = JSON.parse(
    await readFile(new URL(`../schemas/${name}.schema.json`, import.meta.url), 'utf8'),
  );
  const key = name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  source += `export const ${key}Schema = ${JSON.stringify(schema, null, 2)} as const;\n`;
}
await mkdir(new URL('../cli/src/core/protocol/', import.meta.url), { recursive: true });
await writeFile(new URL('../cli/src/core/protocol/schemas.generated.ts', import.meta.url), source);
