const fs = require('fs');
const path = require('path');

function doIt() {
  const uploadPath = path.join(__dirname, '..', 'src', 'pages', 'admin', 'product', 'upload.tsx');
  const editPath = path.join(__dirname, '..', 'src', 'pages', 'admin', 'product', 'edit', '[id].tsx');

  const uploadCode = fs.readFileSync(uploadPath, 'utf8');
  let editCode = fs.readFileSync(editPath, 'utf8');

  // Extract the return block from upload.tsx
  const uploadReturnMatches = [...uploadCode.matchAll(/  return \(/g)];
  const returnStart = uploadReturnMatches[uploadReturnMatches.length - 1].index; // The last 'return (' in upload.tsx
  const returnEnd = uploadCode.lastIndexOf('  );');
  if (returnStart === -1 || returnEnd === -1) {
    console.error('Could not find return block in upload.tsx');
    return;
  }
  
  let newReturnBlock = uploadCode.slice(returnStart, returnEnd + 4);

  // Apply transformations for Edit page
  newReturnBlock = newReturnBlock
    .replace(/t\('upload_new_item'\)/g, "`${t('edit_product')}: ${localizedFormName}`") // title
    .replace(/<h2 className="text-\[15px\] font-bold text-zinc-900">{t\('upload_new_item'\)}<\/h2>/, '<h2 className="text-[15px] font-bold text-zinc-900">{t(\'edit_product\')}: {localizedFormName}</h2>')
    .replace(/Add a new product to your inventory and set its pricing, stock, and categories\./, "Modify the product details, pricing, and status.")
    .replace(/isLoading/g, 'isSaving')
    .replace(/Confirm Upload/g, 'Save Changes');

  // Find the LAST return block in edit/[id].tsx
  const editReturnMatches = [...editCode.matchAll(/  return \(/g)];
  const editReturnStart = editReturnMatches[editReturnMatches.length - 1].index;
  const editReturnEnd = editCode.lastIndexOf('  );');
  
  if (editReturnStart === -1 || editReturnEnd === -1) {
    console.error('Could not find return block in edit/[id].tsx');
    return;
  }

  // Inject the new return block
  editCode = editCode.slice(0, editReturnStart) + newReturnBlock + editCode.slice(editReturnEnd + 4);

  fs.writeFileSync(editPath, editCode);
  console.log('Successfully updated edit/[id].tsx');
}

doIt();
