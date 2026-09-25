const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
  console.error('[post-build-web] dist directory not found!');
  process.exit(1);
}

// 1. Crear CNAME para GitHub Pages
fs.writeFileSync(path.join(distDir, 'CNAME'), 'autolari.larico.net\n', 'utf8');
console.log('✓ CNAME creado: autolari.larico.net');

// 2. Crear .nojekyll para que GitHub Pages no ignore la carpeta _expo/
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');
console.log('✓ .nojekyll creado (habilita _expo/)');

// 3. Mejorar index.html con meta referrer no-referrer y theme-color
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('name="referrer"')) {
    html = html.replace(
      '<head>',
      '<head>\n    <meta name="referrer" content="no-referrer" />\n    <meta name="theme-color" content="#080A0E" />'
    );
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('✓ Meta tags optimizados en index.html');
  }

  // 4. Crear 404.html como fallback SPA para GitHub Pages
  fs.writeFileSync(path.join(distDir, '404.html'), html, 'utf8');
  console.log('✓ 404.html creado para fallback SPA');
}

// 5. Crear .gitignore en dist para que git nunca ignore las fuentes en assets/node_modules
fs.writeFileSync(path.join(distDir, '.gitignore'), '!*\n!**/*\n!node_modules/\n!**/node_modules/**\n', 'utf8');
console.log('✓ .gitignore optimizado en dist');

// 6. Copiar favicon oficial a dist
const faviconSource = path.join(__dirname, '..', 'assets', 'favicon.png');
if (fs.existsSync(faviconSource)) {
  fs.copyFileSync(faviconSource, path.join(distDir, 'favicon.ico'));
  fs.copyFileSync(faviconSource, path.join(distDir, 'favicon.png'));
  console.log('✓ Favicon oficial copiado a dist');
}

console.log('🎉 Build web listo para publicar en GitHub Pages (autolari.larico.net)!');
