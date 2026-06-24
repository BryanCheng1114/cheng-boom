const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // We need to find the start of the form
  const formStart = code.indexOf('<form ');
  if (formStart === -1) {
    console.log('No form found in ' + filePath);
    return;
  }
  
  // Find the exact line after `<form ... className="space-y-6 relative">`
  const formTagEnd = code.indexOf('>', formStart) + 1;
  
  // Also find the error message block if it exists
  const errorMsgEnd = code.indexOf('{/* Product Information */}', formTagEnd);
  
  if (errorMsgEnd === -1) {
    console.log('No product info block found in ' + filePath);
    return;
  }
  
  // Extract all the blocks
  function extractBlock(startStr, endStr) {
    const start = code.indexOf(startStr);
    if (start === -1) return '';
    let end = code.indexOf(endStr, start);
    if (end === -1) end = code.indexOf('{/* Bottom Actions Row */}');
    return code.slice(start, end).trim();
  }

  const blockInfo = extractBlock('{/* Product Information */}', '{/* Visual Assets */}');
  const blockPhotos = extractBlock('{/* Visual Assets */}', '{/* Single Item Pricing & Stock */}');
  const blockSingle = extractBlock('{/* Single Item Pricing & Stock */}', '{/* Per Box Pricing & Stock */}');
  const blockBox = extractBlock('{/* Per Box Pricing & Stock */}', '{/* Bundle Pricing Section */}');
  const blockBundle = extractBlock('{/* Bundle Pricing Section */}', '{/* Listing Status */}');
  const blockStatus = extractBlock('{/* Listing Status */}', '{/* Bottom Actions Row */}');

  // If we couldn't find them, maybe the order was different
  if (!blockInfo || !blockPhotos || !blockSingle || !blockStatus) {
    console.log('Failed to extract blocks correctly for ' + filePath);
    return;
  }

  // Rewrite the classes of the blocks to fit the new design (p-6 instead of p-8 rounded-[48px])
  function fixClasses(blockText) {
    return blockText
      .replace(/bg-white\s+p-8\s+rounded-\[48px\]\s+border\s+border-zinc-100\s+shadow-xl/g, 'bg-white p-6 md:p-8 rounded-[20px] border border-zinc-200 shadow-sm')
      .replace(/text-\[10px\] font-black uppercase tracking-\[0\.3em\] text-zinc-500/g, 'text-[16px] font-bold text-zinc-900');
  }

  const newLayout = `
          <div className="flex flex-col lg:flex-row gap-6 mt-6">
            {/* Left Column */}
            <div className="flex-1 space-y-6">
              ${fixClasses(blockInfo)}
              ${fixClasses(blockSingle)}
              ${fixClasses(blockBox)}
              ${fixClasses(blockBundle)}
            </div>

            {/* Right Column */}
            <div className="w-full lg:w-[360px] xl:w-[400px] space-y-6">
              ${fixClasses(blockPhotos)}
              ${fixClasses(blockStatus)}
            </div>
          </div>
`;

  // We need to replace everything from errorMsgEnd to the start of {/* Bottom Actions Row */}
  const beforeBlocks = code.slice(0, code.indexOf('{/* Product Information */}'));
  const afterBlocksStart = code.indexOf('{/* Bottom Actions Row */}');
  
  if (afterBlocksStart === -1) {
    console.log('Could not find bottom actions row in ' + filePath);
    return;
  }
  
  const afterBlocks = code.slice(afterBlocksStart);
  
  const finalCode = beforeBlocks + newLayout + '\n          ' + afterBlocks;
  
  fs.writeFileSync(filePath, finalCode);
  console.log('Successfully updated ' + filePath);
}

const uploadPath = path.join(__dirname, '..', 'src', 'pages', 'admin', 'product', 'upload.tsx');
const editPath = path.join(__dirname, '..', 'src', 'pages', 'admin', 'product', 'edit', '[id].tsx');

processFile(uploadPath);
processFile(editPath);
