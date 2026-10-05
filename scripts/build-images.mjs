import { readdirSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const source = fileURLToPath(new URL('../assets/images/', import.meta.url));
const output = path.join(source, 'responsive');
mkdirSync(output, { recursive: true });
for (const file of readdirSync(source).filter(name => /^ex-.*\.webp$/.test(name)).sort()) {
  for (const width of [320, 640, 960]) {
    const result = spawnSync('cwebp', ['-quiet', '-q', '82', '-m', '6', '-resize', String(width), '0',
      path.join(source, file), '-o', path.join(output, file.replace('.webp', `-${width}.webp`))], { stdio: 'inherit' });
    if (result.error) throw new Error('cwebp is required to rebuild responsive images.', { cause: result.error });
    if (result.status !== 0) throw new Error(`Image conversion failed: ${file} (${width}px)`);
  }
}
console.log('Built 320/640/960px WebP variants; originals preserved.');
