const fs = require('fs');
let content = fs.readFileSync('src/pages/shop/[id].tsx', 'utf8');

// 1. Price restructuring
content = content.replace(
  /<div className="relative flex flex-col justify-center py-2">([\s\S]*?)<\/div>\n\s*\}\)/,
  `<div className="relative flex flex-col justify-center py-2">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Active Price */}
                  <span className="text-3xl sm:text-4xl font-black text-orange-500 tracking-tight">
                    {currentDisplayPrice ? (
                      \`RM \${currentDisplayPrice.toFixed(2)}\`
                    ) : (
                      minPrice === maxPrice ? \`RM \${minPrice.toFixed(2)}\` : \`RM \${minPrice.toFixed(2)} - RM \${maxPrice.toFixed(2)}\`
                    )}
                  </span>
                  
                  {/* Strike Through */}
                  {currentDisplayPrice ? (
                    currentStrikePrice && (
                      <span className="text-lg text-zinc-400 line-through font-medium">
                        RM {currentStrikePrice.toFixed(2)}
                      </span>
                    )
                  ) : (
                    hasAnyDiscount && (
                      <span className="text-lg text-zinc-400 line-through font-medium">
                        {minOriginal === maxOriginal ? \`RM \${minOriginal.toFixed(2)}\` : \`RM \${minOriginal.toFixed(2)} - RM \${maxOriginal.toFixed(2)}\`}
                      </span>
                    )
                  )}

                  {/* Discount Pill */}
                  {currentDisplayPrice ? (
                    currentStrikePrice && (
                      <span className="text-sm font-bold text-white bg-orange-500 px-2 py-0.5 rounded-md shadow-sm">
                        {selectedVariant === 'Single' ? \`-\${singleSavingsPercent}%\` : \`-\${boxSavingsPercent}%\`}
                      </span>
                    )
                  ) : (
                    hasAnyDiscount && maxSavingsPercent > 0 && (
                      <span className="text-sm font-bold text-white bg-orange-500 px-2 py-0.5 rounded-md shadow-sm">
                        {minPrice === maxPrice ? \`-\${maxSavingsPercent}%\` : \`Up to -\${maxSavingsPercent}%\`}
                      </span>
                    )
                  )}
                </div>

                {/* Move Description here */}
                {translatedDesc && (
                  <div className="mt-4 mb-2">
                    <p className="text-sm text-zinc-600 line-clamp-4 whitespace-pre-wrap leading-relaxed">{translatedDesc}</p>
                    <a href="#description" onClick={(e) => { e.preventDefault(); document.getElementById('description-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-bold text-blue-600 hover:underline mt-1 inline-block">View more</a>
                  </div>
                )}
              </div>
              )}`
);

// 2. Variation buttons
content = content.replace(
  /<div className="flex flex-wrap gap-4">([\s\S]*?)<\/div>\n\s*<\/div>\n\s*\)}/,
  `<div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        onClick={() => {
                          setSelectedVariant('Single');
                          setLocalQty(1);
                          setShowVariantError(false);
                        }}
                        className={\`h-12 rounded-full border transition-all flex items-center justify-center text-sm font-bold \${selectedVariant === 'Single' ? 'border-orange-500 bg-orange-500 text-white shadow-md' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}\`}
                      >
                        {locale === 'zh' ? '单品' : locale === 'ms' ? 'Satu' : 'Single'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVariant('Box');
                          setLocalQty(1);
                          setShowVariantError(false);
                        }}
                        className={\`h-12 rounded-full border transition-all flex items-center justify-center text-sm font-bold \${selectedVariant === 'Box' ? 'border-orange-500 bg-orange-500 text-white shadow-md' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}\`}
                      >
                        Box ({product.itemsPerBox} Items)
                      </button>
                    </div>
                  </div>
                )}`
);

// 3. Quantity less height & round
content = content.replace(/border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50 h-12/g, 'border border-zinc-200 rounded-full overflow-hidden bg-zinc-50 h-10 w-32');
content = content.replace(/w-12 h-12 flex items-center/g, 'flex-1 h-10 flex items-center');
content = content.replace(/h-12 flex items-center justify-center border-x border-zinc-200 bg-white/g, 'h-10 w-10 shrink-0 flex items-center justify-center border-x border-zinc-200 bg-white');

// 4. Action Buttons icons and less bold
content = content.replace(/bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-full font-black text-\[15px\]/g, 'bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-full font-semibold text-[15px]');
content = content.replace(/bg-primary text-black rounded-full font-black text-\[15px\]/g, 'bg-orange-500 text-white rounded-full font-semibold text-[15px]');
content = content.replace(/\{t\.productDetail\?\.addToCart \|\| \(locale === 'zh' \? '加入购物车' : locale === 'ms' \? 'Tambah ke Troli' : 'ADD TO CART'\)\}/g, '<ShoppingCart size={18} /> {t.productDetail?.addToCart || (locale === "zh" ? "加入购物车" : locale === "ms" ? "Tambah ke Troli" : "Add to Cart")}');
content = content.replace(/\{locale === 'zh' \? '立即购买' : locale === 'ms' \? 'Beli Sekarang' : 'BUY NOW'\}/g, '<Zap size={18} /> {locale === "zh" ? "立即购买" : locale === "ms" ? "Beli Sekarang" : "Buy Now"}');

// 5. Add id to description section for scrolling
content = content.replace(/<section className="bg-white rounded-2xl p-8 md:p-10 border border-zinc-200 shadow-sm">/, '<section id="description-section" className="bg-white rounded-2xl p-8 md:p-10 border border-zinc-200 shadow-sm">');

fs.writeFileSync('src/pages/shop/[id].tsx', content);
console.log('Done part 2');
