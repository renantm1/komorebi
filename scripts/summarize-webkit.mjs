import {readFile,appendFile} from 'node:fs/promises';
let report;
try {report=JSON.parse(await readFile('test-results/webkit-results.json','utf8'));}catch{process.exit(0);}
const lines=['## Verificação do iPhone com WebKit',''];
function visit(suite){for(const spec of suite.specs??[])for(const test of spec.tests??[])for(const result of test.results??[]){lines.push(`- ${result.status==='passed'?'✅':'❌'} ${spec.title} (${result.status})`);for(const error of result.errors??[])lines.push('','```text',(error.message??'').replace(/\x1b\[[0-9;]*m/g,'').slice(0,6000),'```','');}for(const child of suite.suites??[])visit(child);}
for(const suite of report.suites??[])visit(suite);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
