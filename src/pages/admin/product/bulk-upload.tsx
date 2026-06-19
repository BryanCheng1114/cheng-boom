import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, Upload, AlertTriangle, CheckCircle, FileArchive, X, Download } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';

export default function BulkUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);
  const [previewImages, setPreviewImages] = useState<Record<string, { file: Blob; url: string }>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const downloadBulkTemplate = async () => {
    const XLSX = await import('xlsx');
    const templateData = [{
      'Code*': 'FW001',
      'Name_EN*': 'Example Firework',
      'Name_ZH': '示例烟花',
      'Category*': 'Cakes',
      'Description_EN*': 'A beautiful 25 shot cake.',
      'Description_ZH': '美丽的25发烟花。',
      'Video_URL': 'https://youtube.com/watch?v=...',
      'Stock*': 100,
      'Price*': 99.90,
      'Promotion_Price': 89.90,
      'Seller_Price': 79.90,
      'Items_Per_Box': 24,
      'Box_Price': 2000.00,
      'Box_Seller_Price': 1800.00,
      'Box_Promotion_Price': 1900.00,
      'Status': 'Live',
      'Image_Filename*': 'firework1.png'
    }];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bulk Upload Template');
    XLSX.writeFile(wb, 'product_bulk_upload_template.xlsx');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    if (!selected.name.endsWith('.zip')) {
      setErrorMsg('Please upload a valid .zip file containing the Excel template and images.');
      return;
    }
    
    setFile(selected);
    setErrorMsg('');
    setValidationErrors([]);
    setPreviewProducts([]);
    setPreviewImages({});
    setIsLoading(true);
    setProgress(10);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(selected);
      setProgress(30);
      
      let excelFile: any = null;
      const images: Record<string, { file: Blob; url: string }> = {};
      
      // First pass: find the excel file and extract images
      for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
        if (zipEntry.dir) continue;
        
        // Skip __MACOSX and hidden files
        if (relativePath.includes('__MACOSX/') || relativePath.split('/').pop()?.startsWith('.')) continue;

        const lowerPath = relativePath.toLowerCase();
        
        if (lowerPath.endsWith('.xlsx') || lowerPath.endsWith('.xls')) {
          excelFile = zipEntry;
        } else if (lowerPath.match(/\.(png|jpe?g|webp)$/i)) {
          const blob = await zipEntry.async('blob');
          const url = URL.createObjectURL(blob);
          const filename = relativePath.split('/').pop() || relativePath;
          images[filename] = { file: blob, url };
        }
      }
      
      if (!excelFile) {
        throw new Error('No Excel file (.xlsx) found in the ZIP package.');
      }
      
      setProgress(60);
      
      // Parse Excel
      const excelData = await excelFile.async('arraybuffer');
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(excelData, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setProgress(80);
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error('The Excel file is empty.');
      }
      
      // Validate and Map Data
      const errors: string[] = [];
      const parsedProducts = jsonData.map((row: any, index: number) => {
        const rowNum = index + 2; // +1 for 0-index, +1 for header
        
        // Handle optional * suffix gracefully if users didn't delete the asterisks
        const getValue = (key: string) => row[`${key}*`] !== undefined ? row[`${key}*`] : row[key];

        const filename = getValue('Image_Filename')?.trim();
        const nameEN = getValue('Name_EN');
        const code = getValue('Code');
        const category = getValue('Category');
        const stock = getValue('Stock');
        const price = getValue('Price');
        const descriptionEN = getValue('Description_EN');
        
        if (!nameEN) errors.push(`Row ${rowNum}: Missing Product Name (EN)`);
        if (!code) errors.push(`Row ${rowNum}: Missing Product Code`);
        if (!category) errors.push(`Row ${rowNum}: Missing Category`);
        if (!descriptionEN) errors.push(`Row ${rowNum}: Missing Description (EN)`);
        if (stock === undefined) errors.push(`Row ${rowNum}: Missing Stock`);
        if (price === undefined) errors.push(`Row ${rowNum}: Missing Price`);
        if (!filename) errors.push(`Row ${rowNum}: Missing Image_Filename`);
        
        let hasImage = false;
        if (filename && !images[filename]) {
          errors.push(`Row ${rowNum}: Image file "${filename}" not found in ZIP.`);
        } else if (filename && images[filename]) {
          hasImage = true;
        }
        
        return {
          rowNum,
          name: nameEN || '',
          nameZh: getValue('Name_ZH') || '',
          code: code || '',
          category: category || '',
          stock: Number(stock) || 0,
          price: Number(price) || 0,
          promotion: getValue('Promotion_Price') ? Number(getValue('Promotion_Price')) : null,
          sellerPrice: getValue('Seller_Price') ? Number(getValue('Seller_Price')) : null,
          itemsPerBox: getValue('Items_Per_Box') ? Number(getValue('Items_Per_Box')) : null,
          boxPrice: getValue('Box_Price') ? Number(getValue('Box_Price')) : null,
          boxSellerPrice: getValue('Box_Seller_Price') ? Number(getValue('Box_Seller_Price')) : null,
          boxPromotion: getValue('Box_Promotion_Price') ? Number(getValue('Box_Promotion_Price')) : null,
          status: getValue('Status') || 'Live',
          description: descriptionEN || '',
          descriptionZh: getValue('Description_ZH') || '',
          videoUrl: getValue('Video_URL') || '',
          imageFilename: filename || '',
          hasImage
        };
      });
      
      setValidationErrors(errors);
      setPreviewProducts(parsedProducts);
      setPreviewImages(images);
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to process the ZIP file.');
    } finally {
      setIsLoading(false);
      setProgress(100);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (validationErrors.length > 0) {
      if (!confirm('There are validation errors. Products with errors may fail to import. Do you want to proceed?')) {
        return;
      }
    }
    
    setIsConfirmed(true);
    setIsLoading(true);
    setProgress(0);
    setErrorMsg('');
    
    try {
      // Create FormData to send all data at once
      const formData = new FormData();
      
      // Only import products that have an image and required fields
      const validProducts = previewProducts.filter(p => 
        p.name && p.code && p.category && p.hasImage
      );
      
      if (validProducts.length === 0) {
        throw new Error('No valid products to import.');
      }
      
      formData.append('products', JSON.stringify(validProducts));
      
      // Append required images
      validProducts.forEach(p => {
        if (previewImages[p.imageFilename]) {
          formData.append(`image_${p.imageFilename}`, previewImages[p.imageFilename].file, p.imageFilename);
        }
      });
      
      setProgress(50);
      
      // Call backend
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      setProgress(100);
      
      if (response.ok) {
        setImportResult(result);
      } else {
        throw new Error(result.error || 'Failed to import products.');
      }
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Network error occurred during import.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout title="Bulk Upload">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/admin/product" className="p-3 hover:bg-zinc-500/10 text-zinc-500 rounded-full transition-all">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-zinc-900">Bulk Upload</h1>
        </div>

        {importResult ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[48px] border border-zinc-100 shadow-xl text-center space-y-8"
          >
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-[28px] flex items-center justify-center mx-auto border border-green-500/20">
              <CheckCircle size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900 mb-2">Import Completed</h2>
              <p className="text-zinc-500 font-medium">Your bulk upload has been processed.</p>
            </div>
            
            <div className="flex justify-center gap-8 py-8 border-y border-zinc-100 max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Success</p>
                <p className="text-4xl font-black text-green-500">{importResult.success}</p>
              </div>
              <div className="w-px bg-zinc-100" />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Failed</p>
                <p className="text-4xl font-black text-red-500">{importResult.failed}</p>
              </div>
            </div>

            {importResult && importResult.errors && importResult.errors.length > 0 && (
              <div className="text-left bg-red-50/50 rounded-3xl p-6 max-w-lg mx-auto border border-red-500/10">
                <p className="text-xs font-bold text-red-500 mb-3 uppercase tracking-wider">Error Details</p>
                <ul className="text-sm text-red-600/80 space-y-2 max-h-40 overflow-y-auto">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="flex gap-2"><AlertTriangle size={14} className="shrink-0 mt-0.5" /> {err}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              onClick={() => router.push('/admin/product')}
              className="px-10 py-4 bg-yellow-500 text-zinc-950 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-yellow-500/10"
            >
              Return to Inventory
            </button>
          </motion.div>
        ) : isConfirmed && isLoading ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[48px] border border-zinc-100 shadow-xl text-center space-y-8 flex flex-col items-center justify-center py-24"
          >
            <div className="w-24 h-24 border-4 border-zinc-100 border-t-yellow-500 rounded-full animate-spin mb-4" />
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900 mb-3">Importing Products</h2>
              <p className="text-zinc-500 font-medium max-w-sm mx-auto">Please wait while we upload your images and save the product data to the database. This may take a few moments.</p>
            </div>
            
            <div className="w-full max-w-md mx-auto bg-zinc-100 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Processing... {progress}%</p>
          </motion.div>
        ) : (
          <>
            {/* Upload Zone */}
            {!previewProducts.length && (
              <div className="bg-white p-8 rounded-[48px] border border-zinc-100 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Package size={18} /></div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Upload Package</h2>
                </div>
                
                <div 
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  className={`relative overflow-hidden h-64 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4 bg-zinc-50 cursor-pointer hover:border-yellow-500/50 transition-all group ${
                    errorMsg ? 'border-red-500 bg-red-50/50' : 'border-zinc-200'
                  }`}
                >
                  <div className="relative z-10 p-5 bg-white shadow-xl rounded-full text-zinc-400 group-hover:text-yellow-500 group-hover:scale-110 transition-all duration-300">
                    {isLoading ? <div className="w-8 h-8 border-2 border-zinc-950/20 border-t-yellow-500 rounded-full animate-spin" /> : <FileArchive size={32} strokeWidth={1.5} />}
                  </div>
                  <div className="relative z-10 text-center space-y-2">
                    <p className="text-sm font-black uppercase tracking-widest text-zinc-800">
                      {isLoading ? 'Processing ZIP...' : 'Click to Upload ZIP Package'}
                    </p>
                    <p className="text-xs text-zinc-500 font-medium max-w-xs mx-auto">
                      Package must contain the filled Excel template and all associated product images.
                    </p>
                  </div>
                  
                  {isLoading && (
                    <div className="absolute bottom-0 left-0 h-1 bg-yellow-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                  )}
                  
                  <input 
                    type="file" 
                    accept=".zip"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden" 
                  />
                </div>
                
                {errorMsg && (
                  <div className="mt-4 p-4 bg-red-500/10 text-red-600 rounded-2xl flex items-start gap-3 text-sm font-medium border border-red-500/20">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="h-px bg-zinc-200 flex-1"></div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">or</span>
                  <div className="h-px bg-zinc-200 flex-1"></div>
                </div>

                <div className="mt-8 flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-zinc-500 mb-4">Don't have the official template yet?</p>
                  <button 
                    onClick={downloadBulkTemplate}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full font-bold uppercase tracking-widest text-xs transition-colors border border-zinc-200"
                  >
                    <Download size={16} /> Download Official Template
                  </button>
                </div>
              </div>
            )}

            {/* Preview Zone */}
            {previewProducts.length > 0 && !isConfirmed && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Validation Summary */}
                <div className="bg-white p-8 rounded-[48px] border border-zinc-100 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><CheckCircle size={18} /></div>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Preview & Validation</h2>
                    </div>
                    <button 
                      onClick={() => setPreviewProducts([])}
                      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="mb-8 p-6 bg-red-50/50 rounded-3xl border border-red-500/20">
                      <h3 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} /> 
                        Found {validationErrors.length} Issue{validationErrors.length > 1 ? 's' : ''}
                      </h3>
                      <ul className="text-xs text-red-500/80 space-y-1.5 max-h-32 overflow-y-auto pr-4">
                        {validationErrors.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="overflow-x-auto rounded-2xl border border-zinc-100">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-zinc-50/80">
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Row</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Image</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Code</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Name (EN)</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Category</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Stock</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Price</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {previewProducts.map((p, i) => (
                          <tr key={i} className={`hover:bg-zinc-50/50 transition-colors ${!p.hasImage || !p.name || !p.code ? 'bg-red-50/30' : ''}`}>
                            <td className="px-6 py-4 text-xs font-bold text-zinc-400">{p.rowNum}</td>
                            <td className="px-6 py-4">
                              {p.hasImage && previewImages[p.imageFilename] ? (
                                <img src={previewImages[p.imageFilename].url} className="w-10 h-10 rounded-lg object-cover border border-zinc-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-500 flex items-center justify-center border border-red-200" title="Image missing">
                                  <X size={14} />
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-zinc-800">{p.code || <span className="text-red-400">Missing</span>}</td>
                            <td className="px-6 py-4 text-sm font-medium text-zinc-600">{p.name || <span className="text-red-400">Missing</span>}</td>
                            <td className="px-6 py-4 text-sm text-zinc-500">{p.category || '-'}</td>
                            <td className="px-6 py-4 text-sm font-bold text-zinc-700">{p.stock}</td>
                            <td className="px-6 py-4 text-sm font-bold text-zinc-700">RM {p.price.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'Hold' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-8 pt-8 border-t border-zinc-100">
                    <button 
                      onClick={() => setPreviewProducts([])}
                      disabled={isLoading}
                      className="w-1/3 py-5 bg-zinc-100 text-zinc-600 rounded-[24px] font-bold text-sm hover:bg-zinc-200 transition-all disabled:opacity-50"
                    >
                      Re-upload
                    </button>
                    <button 
                      onClick={handleConfirmImport}
                      disabled={isLoading || previewProducts.filter(p => p.hasImage && p.name && p.code).length === 0}
                      className="w-2/3 py-5 bg-yellow-500 text-zinc-950 rounded-[24px] font-bold text-sm hover:brightness-110 transition-all shadow-2xl shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                          <span className="opacity-80">Importing ({progress}%)...</span>
                        </>
                      ) : (
                        `Confirm Import (${previewProducts.filter(p => p.hasImage && p.name && p.code).length} Products)`
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
