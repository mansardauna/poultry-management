const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const docsDir = path.join(publicDir, 'docs');

if (fs.existsSync(docsDir)) {
  const files = fs.readdirSync(docsDir);
  for (const file of files) {
    const src = path.join(docsDir, file);
    const dest = path.join(publicDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      console.log(`Synced ${file} to public/`);
    }
  }
}
console.log('Image sync completed!');
