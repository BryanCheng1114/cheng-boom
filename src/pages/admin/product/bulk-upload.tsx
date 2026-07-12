import React, { useState, useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, Upload, AlertTriangle, CheckCircle, FileArchive, X, Download } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';

export default function BulkUploadPage() {
  const { t } = useLanguage();
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
    setIsLoading(true);
    try {
      // Fetch categories
      const res = await fetch('/api/categories');
      let categories: any[] = [];
      if (res.ok) {
        categories = await res.json();
      }
      
      const categoryNames = categories.map(c => c.name);
      if (categoryNames.length === 0) categoryNames.push('Cakes', 'Fountains', 'Sparklers'); // Fallback

      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Bulk Upload Template');

      // Define columns
      const headers = [
        'Code*', 'Name_EN*', 'Name_ZH', 'Category*', 'Description_EN*', 'Description_ZH',
        'Video_URL', 'Stock*', 'Price*', 'Promotion_Price', 'Seller_Price',
        'Items_Per_Box', 'Box_Price', 'Box_Seller_Price', 'Box_Promotion_Price',
        'Bundle_Quantity', 'Bundle_Price', 'Bundle_Seller_Price', 'Bundle_Promotion_Price',
        'Status', 'Image_Filename*'
      ];

      ws.addRow(headers);
      
      const sampleRow = [
        'FW001', 'Example Firework', '示例烟花', categoryNames[0] || 'Cakes', 'A beautiful 25 shot cake.', '美丽的25发烟花。',
        'https://youtube.com/watch?v=...', 100, 99.90, 89.90, 79.90,
        24, 2000.00, 1800.00, 1900.00,
        4, 350.00, 300.00, 320.00,
        'Live', 'firework1.png'
      ];
      
      ws.addRow(sampleRow);

      // Add data validation for the first 1000 rows
      for (let i = 2; i <= 1001; i++) {
        ws.getCell(`D${i}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`"${categoryNames.join(',')}"`],
          showErrorMessage: true,
          errorStyle: 'error',
          errorTitle: 'Invalid Category',
          error: 'Please select a category from the dropdown list.'
        };

        ws.getCell(`T${i}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['"Live,Hold"'],
          showErrorMessage: true,
          errorStyle: 'error',
          errorTitle: 'Invalid Status',
          error: 'Please select either Live or Hold.'
        };
      }

      // Format headers
      ws.getRow(1).font = { bold: true };
      ws.columns.forEach(column => {
        column.width = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'product_bulk_upload_template.xlsx');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate template.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    
    if (!selected.name.endsWith('.zip')) {
      setErrorMsg(t('invalid_zip_err') || 'Please upload a valid .zip file containing the Excel template and images.');
      setFile(null);
      return;
    }
    
    setFile(selected);
    setErrorMsg('');
  };

  const handleProcessFile = async () => {
    if (!file) {
      setErrorMsg(t('please_select_file') || 'Please select a single file...');
      return;
    }

    setValidationErrors([]);
    setPreviewProducts([]);
    setPreviewImages({});
    setIsLoading(true);
    setProgress(10);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
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
        throw new Error(t('no_excel_err') || 'No Excel file (.xlsx) found in the ZIP package.');
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
        throw new Error(t('empty_excel_err') || 'The Excel file is empty.');
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
          bundleQuantity: getValue('Bundle_Quantity') ? Number(getValue('Bundle_Quantity')) : null,
          bundlePrice: getValue('Bundle_Price') ? Number(getValue('Bundle_Price')) : null,
          bundleSellerPrice: getValue('Bundle_Seller_Price') ? Number(getValue('Bundle_Seller_Price')) : null,
          bundlePromotion: getValue('Bundle_Promotion_Price') ? Number(getValue('Bundle_Promotion_Price')) : null,
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
      setProgress(100);
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
    <AdminLayout title="Bulk Upload" hideTitle={true}>
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-6 mb-8 pt-2 pl-4">
          <Link href="/admin/product" className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-[28px] font-black italic uppercase tracking-tight text-zinc-900">{t('bulk_upload') || 'Bulk Upload'}</h1>
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
              <h2 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900 mb-2">{t('import_completed') || 'Import Completed'}</h2>
              <p className="text-zinc-500 font-medium">{t('bulk_upload_processed') || 'Your bulk upload has been processed.'}</p>
            </div>
            
            <div className="flex justify-center gap-8 py-8 border-y border-zinc-100 max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{t('success_label') || 'Success'}</p>
                <p className="text-4xl font-black text-green-500">{importResult.success}</p>
              </div>
              <div className="w-px bg-zinc-100" />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{t('failed_label') || 'Failed'}</p>
                <p className="text-4xl font-black text-red-500">{importResult.failed}</p>
              </div>
            </div>

            {importResult && importResult.errors && importResult.errors.length > 0 && (
              <div className="text-left bg-red-50/50 rounded-3xl p-6 max-w-lg mx-auto border border-red-500/10">
                <p className="text-xs font-bold text-red-500 mb-3 uppercase tracking-wider">{t('error_details') || 'Error Details'}</p>
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
            >{t('return_to_inventory') || 'Return to Inventory'}</button>
          </motion.div>
        ) : isConfirmed && isLoading ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[48px] border border-zinc-100 shadow-xl text-center space-y-8 flex flex-col items-center justify-center py-24"
          >
            <div className="w-24 h-24 border-4 border-zinc-100 border-t-yellow-500 rounded-full animate-spin mb-4" />
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900 mb-3">{t('importing_products') || 'Importing Products'}</h2>
              <p className="text-zinc-500 font-medium max-w-sm mx-auto">{t('importing_products_desc') || 'Please wait while we upload your images and save the product data to the database. This may take a few moments.'}</p>
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
              <div className="bg-white p-6 rounded-md border border-zinc-200 shadow-sm w-full">
                <div className="mb-6">
                  <label className="block text-[13px] font-medium text-zinc-700 mb-1">
                    {t('source_file') || 'Source File'} <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="flex">
                    <div className="flex-1 border border-zinc-300 border-r-0 rounded-l-md px-3 py-2 bg-white text-sm text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap">
                      {file ? file.name : (t('please_select_file') || 'Please select a single file...')}
                    </div>
                    <button 
                      onClick={() => !isLoading && fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="px-4 py-2 bg-[#12B981] hover:bg-[#10a774] text-white rounded-r-md font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50 border border-[#12B981]"
                    >
                      <span className="text-lg">📁</span> {t('browse') || 'Browse...'}
                    </button>
                    <input 
                      type="file" 
                      accept=".zip"
                      ref={fileInputRef}
                      onChange={handleFilePick}
                      className="hidden" 
                    />
                  </div>
                </div>

                <div className="mb-16">
                  <button 
                    onClick={downloadBulkTemplate}
                    disabled={isLoading}
                    className="text-[#3B82F6] hover:underline text-[13px]"
                  >
                    {t('download_quick_import_template') || 'Download quick import file'}
                  </button>
                </div>
                
                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded flex items-start gap-2 text-sm border border-red-100">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <p>{errorMsg}</p>
                  </div>
                )}
                
                {isLoading && (
                  <div className="mb-4 h-1 w-full bg-zinc-100 rounded overflow-hidden">
                     <div className="h-full bg-[#12B981] transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-zinc-100">
                  <button 
                    onClick={handleProcessFile}
                    disabled={isLoading || !file}
                    className="px-6 py-2 bg-[#4B5563] hover:bg-[#374151] text-white rounded text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <span className="text-lg">💾</span> {t('upload_btn') || 'Upload'}
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
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t('preview_validation_title') || 'Preview & Validation'}</h2>
                    </div>
                    <button 
                      onClick={() => setPreviewProducts([])}
                      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors"
                    >
                      {t('cancel') || 'Cancel'}
                    </button>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="mb-8 p-6 bg-red-50/50 rounded-3xl border border-red-500/20">
                      <h3 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} /> 
                        {t('found') || 'Found'} {validationErrors.length} {t('issues') || `Issue${validationErrors.length > 1 ? 's' : ''}`}
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
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">{t('row') || 'Row'}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">{t('image') || 'Image'}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">{t('product_code_label') || 'Code'}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">{t('product_name_en') || 'Name (EN)'}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">{t('category') || 'Category'}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">{t('stock') || 'Stock'}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">{t('price') || 'Price'}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">{t('status') || 'Status'}</th>
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
                            <td className="px-6 py-4 text-sm font-bold text-zinc-800">{p.code || <span className="text-red-400">{t('missing') || 'Missing'}</span>}</td>
                            <td className="px-6 py-4 text-sm font-medium text-zinc-600">{p.name || <span className="text-red-400">{t('missing') || 'Missing'}</span>}</td>
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
                    >{t('reupload') || 'Re-upload'}</button>
                    <button 
                      onClick={handleConfirmImport}
                      disabled={isLoading || previewProducts.filter(p => p.hasImage && p.name && p.code).length === 0}
                      className="w-2/3 py-5 bg-yellow-500 text-zinc-950 rounded-[24px] font-bold text-sm hover:brightness-110 transition-all shadow-2xl shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                          <span className="opacity-80">{t('importing') || 'Importing'} ({progress}%)...</span>
                        </>
                      ) : (
                        `${t('confirm_import') || 'Confirm Import'} (${previewProducts.filter(p => p.hasImage && p.name && p.code).length} ${t('products_text') || 'Products'})`
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
