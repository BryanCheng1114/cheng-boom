const fs = require('fs');
let content = fs.readFileSync('src/pages/shop/[id].tsx', 'utf8');

// 1. Move breadcrumb out of the main container and remove card wrap
// Find the start of the min-h-screen
const topHeaderStart = content.indexOf('<div className="min-h-screen bg-white"><div className="w-full max-w-7xl mx-auto');
if (topHeaderStart !== -1) {
  content = content.replace(
    /<div className="min-h-screen bg-white"><div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">/,
    `<div className="min-h-screen bg-white">`
  );
  
  // Replace the breadcrumb wrapper
  content = content.replace(
    /<div className="hidden lg:flex items-center justify-between gap-4 mb-8">([\s\S]*?)<\/div>\s*<div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 items-stretch bg-white  rounded-2xl p-6 lg:p-8 border border-zinc-200 shadow-sm">/,
    `<div className="w-full bg-zinc-50 border-b border-zinc-200 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
$1
        </div>
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 items-start">`
  );
}

// 2. Product Image square and no border radius
content = content.replace(
  /className="flex-1 aspect-square lg:aspect-auto lg:h-full min-h-0 rounded-xl overflow-hidden shadow-sm bg-white  border border-zinc-200  cursor-zoom-in group relative"/,
  `className="flex-1 aspect-square min-h-0 rounded-none overflow-hidden bg-white border border-zinc-200 cursor-zoom-in group relative"`
);
content = content.replace(/relative w-20 h-20 rounded-xl overflow-hidden/g, 'relative w-20 h-20 rounded-none overflow-hidden');


// 3. Right side: Title text black
content = content.replace(
  /<h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-normal leading-tight mb-2 line-clamp-2">/,
  `<h1 className="text-2xl md:text-3xl font-bold text-black tracking-normal leading-tight mb-2">`
);

fs.writeFileSync('src/pages/shop/[id].tsx', content);
console.log('Done part 1');
