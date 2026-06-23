const fs = require('fs');
let content = fs.readFileSync('src/pages/shop/[id].tsx', 'utf8');

// Find the import line for lucide-react
const match = content.match(/import \{([^}]+)\} from 'lucide-react'/);
if (match) {
  let imports = match[1];
  let changed = false;
  if (!imports.includes('ShoppingCart')) { imports += ', ShoppingCart'; changed = true; }
  if (!imports.includes('Zap')) { imports += ', Zap'; changed = true; }
  if (changed) {
    content = content.replace(match[0], `import {${imports}} from 'lucide-react'`);
    fs.writeFileSync('src/pages/shop/[id].tsx', content);
    console.log('Added missing imports');
  } else {
    console.log('Imports already exist');
  }
}
