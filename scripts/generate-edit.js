const fs = require('fs');
const path = require('path');

const uploadPath = path.join(__dirname, '..', 'src', 'pages', 'admin', 'product', 'upload.tsx');
const editPath = path.join(__dirname, '..', 'src', 'pages', 'admin', 'product', 'edit', '[id].tsx');

let code = fs.readFileSync(uploadPath, 'utf8');

// 1. Change component name
code = code.replace(/const UploadProductPage = \(\) => {/g, 'const EditProductPage = () => {\n  const router = useRouter();\n  const { id } = router.query;\n  const [isSaving, setIsSaving] = useState(false);\n  const [initialFormData, setInitialFormData] = useState<any>(null);\n  const [initialImages, setInitialImages] = useState<string[]>([]);');
code = code.replace(/export default UploadProductPage;/g, 'export default EditProductPage;');

// 2. Add useEffect for fetching data
const fetchEffect = `
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(\`/api/products/\${id}\`),
          fetch('/api/categories')
        ]);
        
        if (prodRes.ok) {
          const data = await prodRes.json();
          const cats = await catRes.json();
          setCategories(cats);
          
          const loadedData = {
            name: data.name || '',
            code: data.code || '',
            nameZh: data.nameZh || '',
            nameMs: data.nameMs || '',
            description: data.description || '',
            descriptionZh: data.descriptionZh || '',
            descriptionMs: data.descriptionMs || '',
            category: data.category || '',
            videoUrl: data.videoUrl || '',
            stock: String(data.stock || '0'),
            price: String(data.price || '0'),
            sellerPrice: String(data.sellerPrice || ''),
            promotion: String(data.promotion || ''),
            boxPrice: String(data.boxPrice || ''),
            itemsPerBox: String(data.itemsPerBox || ''),
            boxSellerPrice: String(data.boxSellerPrice || ''),
            boxPromotion: String(data.boxPromotion || ''),
            bundleQuantity: String(data.bundleQuantity || ''),
            bundlePrice: String(data.bundlePrice || ''),
            bundleSellerPrice: String(data.bundleSellerPrice || ''),
            bundlePromotion: String(data.bundlePromotion || ''),
            status: data.status || 'Live',
          };
          setFormData(loadedData);
          setInitialFormData(loadedData);
          
          if (data.images) {
            setPreviews(data.images);
            setUploadedImages(data.images);
            setInitialImages(data.images);
          }
        } else {
          alert(t('product_not_found') || 'Product not found');
          router.push('/admin/product');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, t]);
`;
// Replace the old useEffect
code = code.replace(/useEffect\(\(\) => \{\n    const fetchCategories = async \(\) => \{[\s\S]*?\}, \[\]\);/, fetchEffect);

// 3. Change submit logic
const submitLogic = `
    setIsSaving(true);
    try {
      const response = await fetch(\`/api/products/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, images: uploadedImages }),
      });
      if (response.ok) {
        router.push('/admin/product');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };
`;
code = code.replace(/setIsLoading\(true\);\n    try \{[\s\S]*?setIsLoading\(false\);\n    \}\n  \};/, submitLogic.trim());

// 4. Update the UI text
code = code.replace(/t\('upload_new_item'\)/g, "`${t('edit_product') || 'Edit Product'}: ${formData.name}`");
code = code.replace(/<h1 className="text-3xl font-black italic uppercase tracking-tight text-zinc-900">.*?<\/h1>/, '<h1 className="text-3xl font-black italic uppercase tracking-tight text-zinc-900">{`${t(\'edit_product\') || \'Edit Product\'}: ${formData.name}`}</h1>');

// Update the save button safely
const saveBtnStart = code.lastIndexOf('<button \n                type="submit" \n                disabled={isLoading}');
if (saveBtnStart !== -1) {
  const saveBtnEnd = code.indexOf('</button>', saveBtnStart) + 9;
  const newSaveBtn = `<button 
                type="submit" 
                disabled={isSaving || !initialFormData || (
                  JSON.stringify(formData) === JSON.stringify(initialFormData) &&
                  JSON.stringify(uploadedImages) === JSON.stringify(initialImages)
                )}
                className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold text-[13px] hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Package size={16} />
                    Save Changes
                  </>
                )}
              </button>`;
  code = code.slice(0, saveBtnStart) + newSaveBtn + code.slice(saveBtnEnd);
}

// Fix router.push disabled
code = code.replace(/disabled=\{isLoading\}\n(.*?)Cancel/g, "disabled={isSaving}\n$1Cancel");

// Add isLoading state correctly
code = code.replace(/const \[isLoading, setIsLoading\] = useState\(false\);/, 'const [isLoading, setIsLoading] = useState(true);');

// Handle the early return for loading
const earlyReturn = `
  if (isLoading) {
    return (
      <AdminLayout title={t('edit_product') || 'Edit Product'}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-zinc-500 font-black uppercase tracking-[0.3em] animate-pulse">{t('loading_product_data') || 'LOADING PRODUCT...'}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
`;
code = code.replace(/  return \(/, earlyReturn);

fs.writeFileSync(editPath, code);
console.log('Fully generated edit/[id].tsx based on upload.tsx');
