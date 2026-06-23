const fs = require('fs');
let content = fs.readFileSync('src/pages/shop/[id].tsx', 'utf8');

if (!content.includes('Heart')) {
  content = content.replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"]/, (match, p1) => {
    if (!p1.includes('Heart')) return `import {${p1}, Heart} from 'lucide-react'`;
    return match;
  });
  fs.writeFileSync('src/pages/shop/[id].tsx', content);
  console.log('Added Heart import');
} else {
  console.log('Heart already imported');
}
