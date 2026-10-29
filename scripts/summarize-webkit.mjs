import {readFile,appendFile} from 'node:fs/promises';
const clean = text => String(text).replace(/\x1b\[[0-9;]*m/g,'').slice(0,9000);
function annotation(message){console.log(`::error title=Verificação WebKit::${clean(message).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A')}`);}
let report;
try {report=JSON.parse(await readFile('test-results/webkit-results.json','utf8'));}catch(error){annotation('O relatório do WebKit não foi gerado: '+error.message);process.exit(0);}
const lines=['## Verificação do iPhone com WebKit',''];
for(const error of report.errors??[]){annotation(error.message??error);lines.push('```text',clean(error.message??error),'```');}
function visit(suite){for(const spec of suite.specs??[])for(const test of spec.tests??[])for(const result of test.results??[]){lines.push(`- ${result.status==='passed'?'✅':'❌'} ${spec.title} (${result.status})`);for(const error of result.errors??[]){annotation(spec.title+'\n'+(error.message??error));lines.push('','```text',clean(error.message??error),'```','');}}for(const child of suite.suites??[])visit(child);}
for(const suite of report.suites??[])visit(suite);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
