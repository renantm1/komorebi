import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFile, mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const temporary = await mkdtemp(join(tmpdir(), 'komorebi-offline-'));
try {
 await build({ configFile: false, base: './', define: { 'import.meta.env.VITE_OFFLINE_PACKAGE': 'true' }, plugins: [viteSingleFile()], build: { outDir: temporary, emptyOutDir: true } });
 let html = await readFile(join(temporary,'index.html'),'utf8');
 html=html.replace(/<link[^>]+rel="(?:icon|apple-touch-icon)"[^>]*>/g,'');
 const favicon=(await readFile(resolve('public/favicon.svg'))).toString('base64');
 html=html.replace('</head>',`<link rel="icon" href="data:image/svg+xml;base64,${favicon}"></head>`);
 const instructions='<!doctype html><html lang="pt-BR"><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Komorebi — arquivo offline</title><body style="font:18px system-ui;max-width:650px;margin:50px auto;padding:20px;background:#faf0d8;color:#4d6344"><h1>Seu Komorebi offline</h1><p>Abra <strong>komorebi-offline.html</strong> no Chrome, Edge, Firefox ou Safari de um computador. O jogo, a arte e a música estão dentro do arquivo; não precisa instalar servidor nem ficar conectado.</p><p>Guarde o arquivo no mesmo lugar e use o mesmo navegador para continuar. O progresso do site não é transferido automaticamente para o arquivo. Limpar os dados do navegador pode apagar o progresso.</p><p>No Android ou iPhone, abra <a href="https://renantm1.github.io/komorebi/">o site do jogo</a> e instale pela tela inicial.</p></body></html>';
 await mkdir(resolve('dist/downloads'),{recursive:true});
 await writeFile(resolve('dist/downloads/komorebi-offline.html'),html);
 await writeFile(resolve('dist/downloads/como-jogar.html'),instructions);
 console.log(`Arquivo offline: dist/downloads/komorebi-offline.html (${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MB)`);
} finally { await rm(temporary,{recursive:true,force:true}); }
