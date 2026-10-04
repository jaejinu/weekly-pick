import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
await build({stdin:{contents:"export { createClient } from '@supabase/supabase-js';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,outfile:'js/vendor/supabase.js',legalComments:'linked'});
const packages=['@supabase/supabase-js','@supabase/auth-js','@supabase/functions-js','@supabase/postgrest-js','@supabase/realtime-js','@supabase/storage-js','@supabase/phoenix','iceberg-js'];
const notices=await Promise.all(packages.map(async name=>{
 const root='node_modules/'+name+'/', metadata=JSON.parse(await readFile(root+'package.json','utf8'));
 const license=await readFile(root+(name==='@supabase/phoenix'?'LICENSE.md':'LICENSE'),'utf8');
 return name+' '+metadata.version+'\n\n'+license;
}));
await writeFile('js/vendor/THIRD-PARTY-NOTICES.txt',notices.join('\n\n---\n\n'));
