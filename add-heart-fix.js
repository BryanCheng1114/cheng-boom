const fs = require('fs');
let content = fs.readFileSync('src/pages/shop/[id].tsx', 'utf8');

// Find the lucide-react import and add Heart if it's missing from the import list
content = content.replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"]/, (match, p1) => {
  if (!p1.includes('Heart')) {
    return `import {${p1}, Heart} from 'lucide-react'`;
  }
  return match;
});

fs.writeFileSync('src/pages/shop/[id].tsx', content);
console.log('Fixed Heart import');
