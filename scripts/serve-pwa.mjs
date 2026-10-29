import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json', '.woff':'font/woff', '.woff2':'font/woff2' };
// Deliberately serve under the same subdirectory as GitHub Pages.
http.createServer(async (req, res) => {
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  if (path === '/') { res.writeHead(302, { Location: '/komorebi/' }).end(); return; }
  if (!path.startsWith('/komorebi/')) { res.writeHead(404).end(); return; }
  const file = resolve(root, path.slice('/komorebi/'.length) || 'index.html');
  if (!file.startsWith(root + '/')) { res.writeHead(403).end(); return; }
  try { const data = await readFile(file); res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(data); }
  catch { res.writeHead(404).end('Not found'); }
}).listen(Number(process.env.PWA_PORT || 4175), '127.0.0.1');
