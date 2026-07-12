const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/context/LanguageContext.tsx');
let lines = fs.readFileSync(filePath, 'utf-8').split('\n');

let newLines = [];
let currentLang = null;
let seenKeys = new Set();
let skipMs = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  if (line.includes("type Language = 'en' | 'zh' | 'ms';")) {
    newLines.push("type Language = 'en' | 'zh';");
    continue;
  }

  if (line.trim().startsWith('ms: {')) {
    skipMs = true;
    braceCount = 1;
    continue;
  }
  
  if (skipMs) {
    if (line.includes('{')) braceCount += (line.match(/\{/g) || []).length;
    if (line.includes('}')) braceCount -= (line.match(/\}/g) || []).length;
    if (braceCount <= 0) skipMs = false;
    continue;
  }

  if (line.trim().startsWith('en: {') || line.trim().startsWith('zh: {')) {
    currentLang = line.trim().split(':')[0];
    seenKeys = new Set();
    newLines.push(line);
    continue;
  }

  if (currentLang && line.trim() === '},') {
    currentLang = null;
    newLines.push(line);
    continue;
  }

  if (currentLang) {
    const match = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (match) {
      const key = match[1];
      if (seenKeys.has(key)) {
        console.log(`Removing duplicate key in ${currentLang}: ${key}`);
        continue;
      } else {
        seenKeys.add(key);
      }
    }
  }

  newLines.push(line);
}

for (let i = newLines.length - 1; i >= 0; i--) {
  if (newLines[i].trim() === '},' && newLines[i+1] && newLines[i+1].trim() === '};') {
    newLines[i] = newLines[i].replace('},', '}');
    break;
  }
}

fs.writeFileSync(filePath, newLines.join('\n'));
console.log('Done!');
