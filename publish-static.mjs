import fs from 'node:fs';
import path from 'node:path';

const output = 'dist';
const assetsOutput = path.join(output, 'assets');
let html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');

if (!fs.existsSync(assetsOutput)) throw new Error('Vite asset directory is missing');
fs.rmSync('assets', { recursive: true, force: true });
fs.cpSync(assetsOutput, 'assets', { recursive: true });

const charsetTag = /<meta charset="UTF-8"\s*\/?>/i;
if (!charsetTag.test(html)) throw new Error('Charset metadata missing from built HTML');
const policy = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src data: https://lh3.googleusercontent.com; connect-src https://api-worker.kocakhakan99.workers.dev https://xabfflmujxejqzhphpkh.supabase.co; font-src data:; object-src 'none'; base-uri 'none'; form-action 'none'";
html = html.replace(charsetTag, (tag) => `${tag}<meta http-equiv="Content-Security-Policy" content="${policy}">`);

for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (url.startsWith('http:') || url.startsWith('https:')) {
    throw new Error(`Built HTML references a remote asset: ${url}`);
  }
  const relative = url.replace(/^\.\//, '');
  if (relative.startsWith('assets/') && !fs.existsSync(relative)) {
    throw new Error(`Built asset is missing: ${relative}`);
  }
}

if (!html.includes('Content-Security-Policy')) throw new Error('CSP missing from built HTML');
if (/<script\b[^>]*\bsrc="https?:/i.test(html)) throw new Error('Remote scripts are not allowed');

fs.writeFileSync('index.html', html);
fs.writeFileSync('index-online.html', html);
