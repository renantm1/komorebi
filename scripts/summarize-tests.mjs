import {readFile,appendFile} from 'node:fs/promises';
const [path,title='Testes do navegador']=process.argv.slice(2);
const clean=text=>String(text).replace(/\x1b\[[0-9;]*m/g,'').slice(0,9000);
const escape=text=>clean(text).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');
const annotation=message=>console.log(`::error title=${escape(title)}::${escape(message)}`);
let report;
try{report=JSON.parse(await readFile(path,'utf8'));}catch(error){console.log(`::warning::${escape('Relatório ainda não gerado: '+path+' · '+error.message)}`);process.exit(0);}
const lines=['## '+title,''];
for(const error of report.errors??[]){annotation(error.message??error);lines.push('```text',clean(error.message??error),'```');}
function visit(suite){for(const spec of suite.specs??[])for(const test of spec.tests??[])for(const result of test.results??[]){lines.push(`- ${result.status==='passed'?'✅':'❌'} ${spec.title} (${result.status})`);for(const error of result.errors??[]){annotation(spec.title+'\n'+(error.message??error));lines.push('','```text',clean(error.message??error),'```','');}}for(const child of suite.suites??[])visit(child);}
for(const suite of report.suites??[])visit(suite);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
