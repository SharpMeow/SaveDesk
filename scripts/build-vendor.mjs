import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const result=await build({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'inline',outfile:'vendor/supabase.mjs',metafile:true});
const packages=new Set(Object.keys(result.metafile.inputs).filter(p=>p.startsWith('node_modules/')).map(p=>p.split('/').slice(1,p.split('/')[1].startsWith('@')?3:2).join('/')));
let notices='Bundled Supabase client dependencies\n\n';
for(const name of [...packages].sort()){
 const info=JSON.parse(await readFile(`node_modules/${name}/package.json`,'utf8'));
 let license;for(const path of ['LICENSE','LICENSE.md','LICENSE.txt']){try{license=await readFile(`node_modules/${name}/${path}`,'utf8');break;}catch{}}
 if(!license)throw Error(`Missing license for ${name}`);
 notices+=`${name}@${info.version}\n${license}\n\n`;
}
await writeFile('vendor/SUPABASE-LICENSES.txt',notices);
const hash=createHash('sha256').update(await readFile('vendor/supabase.mjs')).digest('hex');
await writeFile('vendor/supabase.sha256',hash+'  vendor/supabase.mjs\n');
