import fs from 'node:fs';
let h = fs.readFileSync('dist/index.html', 'utf8');
h = h.replace(
  /<script[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (_, s) =>
    '<script>' +
    fs.readFileSync('dist/' + s.replace(/^\.\//, ''), 'utf8').replaceAll('</script', '<\\/script') +
    '</script>',
);
h = h.replace(
  /<link[^>]*href="([^"]+\.css)"[^>]*>/g,
  (_, s) => '<style>' + fs.readFileSync('dist/' + s.replace(/^\.\//, ''), 'utf8') + '</style>',
);
let scripts = [];
h = h.replace(/<script>[\s\S]*?<\/script>/g, (s) => {
  scripts.push(s);
  return '';
});
h = h.replace('</body>', () => scripts.join('') + '</body>');
const charsetTag = /<meta charset="UTF-8"\s*\/?>/i;
if (!charsetTag.test(h)) throw new Error('Charset metadata missing from standalone HTML');
h = h.replace(
  charsetTag,
  '<meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; connect-src https://openrouter.ai https://api-worker.kocakhakan99.workers.dev; font-src data:; object-src \'none\'; base-uri \'none\'; form-action \'none\'">',
);
if (!h.includes('Content-Security-Policy')) throw new Error('CSP missing from standalone HTML');
if (!h.includes('font-src data:') || !/data:font\/woff2;base64,/.test(h)) {
  throw new Error('Standalone HTML must embed its local font as a data URI');
}
if (/<script\b[^>]*\bsrc=|<link\b[^>]*\bhref=/i.test(h)) {
  throw new Error('Standalone HTML must not reference external scripts or stylesheets');
}
h = h.replace(/^[ \t]+$/gm, '');
fs.writeFileSync('index.html', h);
// Säilytä aiemman verkkotiedoston osoite yhteensopivuussyistä.
fs.writeFileSync('index-online.html', h);
fs.rmSync('dist', { recursive: true });
