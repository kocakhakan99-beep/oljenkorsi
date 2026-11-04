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
h = h.replace(
  '<meta charset="UTF-8">',
  "<meta charset=\"UTF-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'\">",
);
h = h.replace(/^[ \t]+$/gm, '');
fs.rmSync('dist', { recursive: true });
fs.mkdirSync('dist');
fs.writeFileSync('dist/Taloussuunnittelu.html', h);
fs.writeFileSync('Taloussuunnittelu.html', h);
