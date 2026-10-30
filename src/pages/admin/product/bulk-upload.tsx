import React, { useState, useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FolderOpen, Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';
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
        'Video_URL', 'Stock*', 'Seller_A_Single_Price*', 'Seller_B_Single_Price*',
        'Items_Per_Box', 'Seller_A_Box_Price', 'Seller_B_Box_Price',
        'Items_Per_Bundle', 'Seller_A_Bundle_Price', 'Seller_B_Bundle_Price',
        'Status', 'Image_Filename*'
      ];

      ws.addRow(headers);
      
      const sampleRow = [
        'FW001', 'Example Firework', '示例烟花', categoryNames[0] || 'Cakes', 'A beautiful 25 shot cake.', '美丽的25发烟花。',
        'https://youtube.com/watch?v=...', 100, 99.90, 89.90,
        24, 2000.00, 1800.00,
        4, 350.00, 300.00,
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

        ws.getCell(`Q${i}`).dataValidation = {
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
        const sellerAPrice = getValue('Seller_A_Single_Price');
        const sellerBPrice = getValue('Seller_B_Single_Price');
        const descriptionEN = getValue('Description_EN');
        
        if (!nameEN) errors.push(`Row ${rowNum}: Missing Product Name (EN)`);
        if (!code) errors.push(`Row ${rowNum}: Missing Product Code`);
        if (!category) errors.push(`Row ${rowNum}: Missing Category`);
        if (!descriptionEN) errors.push(`Row ${rowNum}: Missing Description (EN)`);
        if (stock === undefined) errors.push(`Row ${rowNum}: Missing Stock`);
        if (sellerAPrice === undefined || sellerAPrice === '') errors.push(`Row ${rowNum}: Missing Seller A single-item price`);
        if (sellerBPrice === undefined || sellerBPrice === '') errors.push(`Row ${rowNum}: Missing Seller B single-item price`);
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
          sellerAPrice: Number(sellerAPrice) || 0,
          sellerBPrice: Number(sellerBPrice) || 0,
          itemsPerBox: getValue('Items_Per_Box') ? Number(getValue('Items_Per_Box')) : null,
          sellerABoxPrice: getValue('Seller_A_Box_Price') ? Number(getValue('Seller_A_Box_Price')) : null,
          sellerBBoxPrice: getValue('Seller_B_Box_Price') ? Number(getValue('Seller_B_Box_Price')) : null,
          bundleQuantity: getValue('Items_Per_Bundle') ? Number(getValue('Items_Per_Bundle')) : null,
          sellerABundlePrice: getValue('Seller_A_Bundle_Price') ? Number(getValue('Seller_A_Bundle_Price')) : null,
          sellerBBundlePrice: getValue('Seller_B_Bundle_Price') ? Number(getValue('Seller_B_Bundle_Price')) : null,
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
    if (validationErrors.length > 0) return;
    
    setIsConfirmed(true);
    setIsLoading(true);
    setProgress(0);
    setErrorMsg('');
    
    try {
      // Create FormData to send all data at once
      const formData = new FormData();
      
      // Bulk imports are all-or-nothing: never omit invalid rows from the submitted file.
      const allRowsValid = previewProducts.every(p =>
        p.name && p.code && p.category && p.description && p.stock !== undefined && p.sellerAPrice !== undefined && p.sellerBPrice !== undefined && p.hasImage
      );

      if (previewProducts.length === 0 || !allRowsValid) {
        throw new Error('Every row must be valid before the file can be imported.');
      }
      
      formData.append('products', JSON.stringify(previewProducts));
      
      // Append required images
      previewProducts.forEach(p => {
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
        setImportResult({
          success: 0,
          failed: previewProducts.length,
          errors: Array.isArray(result.errors) && result.errors.length > 0
            ? result.errors
            : [result.error || 'The entire file was rejected. No products were imported.'],
        });
      }
      
    } catch (err: any) {
      console.error(err);
      setImportResult({
        success: 0,
        failed: previewProducts.length,
        errors: [err.message || 'Network error occurred during import.'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasImportFailures = Boolean(importResult && (importResult.failed > 0 || importResult.errors.length > 0));
  const importFullyFailed = Boolean(importResult && importResult.success === 0 && hasImportFailures);

  return (
    <AdminLayout title={t('bulk_upload')} hideTitle>
      <div className="w-full space-y-6 pb-8">
        <header className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{t('bulk_upload') || 'Bulk Upload'}</h1>
            <span className="text-xs font-normal text-slate-700">[ {t('inventory_import_screen')} ]</span>
          </div>
          <p className="text-xs text-slate-600">{t('inventory_list')} /</p>
        </header>
        <Link href="/admin/product" className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
          <ArrowLeft size={16} />{t('product_back_to_inventory')}
        </Link>

        {importResult ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-slate-200 bg-white p-6 shadow-sm md:p-10"
          >
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
              <div className={`shrink-0 ${hasImportFailures ? 'text-rose-700' : 'text-sky-700'}`}>
                {hasImportFailures ? <AlertTriangle size={23} /> : <CheckCircle size={23} />}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {importFullyFailed ? t('inventory_import_failed') : hasImportFailures ? t('inventory_import_issues') : (t('import_completed') || 'Import Completed')}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {importFullyFailed
                    ? t('inventory_import_failed_desc')
                    : hasImportFailures
                      ? t('inventory_import_partial_desc').replace('{success}', String(importResult.success)).replace('{failed}', String(importResult.failed))
                      : (t('bulk_upload_processed') || 'Your bulk upload has been processed successfully.')}
                </p>
              </div>
            </div>
            
            <div className="my-6 flex flex-wrap gap-x-12 gap-y-4">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('success_label') || 'Imported successfully'}</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-700">{importResult.success}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">{t('failed_label') || 'Failed'}</p>
                <p className={`mt-1 text-2xl font-semibold ${importResult.failed > 0 ? 'text-rose-700' : 'text-slate-700'}`}>{importResult.failed}</p>
              </div>
            </div>

            {importResult && importResult.errors && importResult.errors.length > 0 && (
              <div className="border-t border-slate-200 py-5 text-left">
                <p className="mb-3 text-sm font-semibold text-slate-800">{t('error_details') || 'Problems to fix'}</p>
                <ul className="max-h-56 space-y-2 overflow-y-auto text-sm text-slate-700">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="mt-0.5 text-rose-600">•</span><span>{err}</span></li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              {hasImportFailures && (
                <button type="button" onClick={() => { setImportResult(null); setIsConfirmed(false); setPreviewProducts([]); setValidationErrors([]); }} className="border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                  {t('reupload') || 'Review another file'}
                </button>
              )}
              <button
                onClick={() => router.push('/admin/product')}
                className="bg-sky-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-800"
              >{t('return_to_inventory') || 'Return to Inventory'}</button>
            </div>
          </motion.div>
        ) : isConfirmed && isLoading ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            role="status"
            aria-live="polite"
            className="flex min-h-[420px] flex-col items-center justify-center border border-slate-200 bg-white px-6 py-16 text-center shadow-sm md:px-12"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center border border-sky-200 bg-sky-50 text-sky-700">
              <Upload size={24} />
            </div>
            <div className="mb-8 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-700" />
            <div className="mb-8 max-w-lg">
              <h2 className="mb-2 text-xl font-semibold text-slate-900">{t('importing_products') || 'Importing Products'}</h2>
              <p className="text-sm leading-6 text-slate-600">{t('importing_products_desc') || 'Please wait while we upload your images and save the product data to the database. This may take a few moments.'}</p>
            </div>

            <div
              className="mb-3 h-2.5 w-full max-w-lg overflow-hidden bg-slate-100"
              role="progressbar"
              aria-label={t('importing_products') || 'Importing Products'}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div 
                className="h-full bg-sky-700 transition-all duration-300"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
            <p className="text-xs font-medium text-slate-500">{t('inventory_processing')} {progress}%</p>
          </motion.div>
        ) : (
          <>
            {/* Upload Zone */}
            {!previewProducts.length && (
              <section className="flex min-h-[360px] flex-col border border-slate-200 bg-white px-5 py-5 shadow-sm md:px-8">
                <div className="flex items-center gap-4 border-b border-slate-200 pb-4 text-xs text-slate-500">
                  <span><span className="text-rose-500">*</span> {t('inventory_required_field')}</span>
                  <span className="text-slate-300">|</span>
                  <span>{t('inventory_zip_help')}</span>
                </div>

                <div className="mt-5 max-w-3xl">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('inventory_file_source')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="flex min-h-10 min-w-0 items-center border border-slate-300 bg-white px-3 text-sm text-slate-600">
                      <span className="truncate">{file ? file.name : t('inventory_select_file')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isLoading && fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="inline-flex min-h-10 items-center justify-center gap-2 border border-emerald-600 bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <FolderOpen size={16} />{t('inventory_browse')}
                    </button>
                    <input type="file" accept=".zip" ref={fileInputRef} onChange={handleFilePick} className="hidden" />
                  </div>
                </div>

                <div className="mt-20">
                  <button type="button" onClick={downloadBulkTemplate} disabled={isLoading} className="text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline disabled:opacity-50">
                    {t('download_quick_import_template') || 'Download product import template'}
                  </button>
                </div>

                {errorMsg && (
                  <div className="mt-5 flex items-start gap-2 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <p>{errorMsg}</p>
                  </div>
                )}
                {isLoading && (
                  <div className="mt-4 h-1 w-full overflow-hidden bg-slate-100">
                    <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                )}

                <div className="mt-auto flex justify-end border-t border-slate-200 pt-4">
                  <button type="button" onClick={handleProcessFile} disabled={isLoading || !file} className="inline-flex items-center gap-2 bg-slate-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Upload size={15} />{t('upload_btn') || 'Upload'}
                  </button>
                </div>
              </section>
            )}

            {/* Preview Zone */}
            {previewProducts.length > 0 && !isConfirmed && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Validation Summary */}
                <div className="border border-slate-200 bg-white p-5 shadow-sm md:p-8">
                  <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="border border-sky-200 bg-sky-50 p-2 text-sky-700"><CheckCircle size={18} /></div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">{t('preview_validation_title') || 'Preview & Validation'}</h2>
                        <p className="mt-1 text-xs text-slate-500">{t('inventory_preview_help')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPreviewProducts([])}
                      className="border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      {t('reupload') || 'Choose another file'}
                    </button>
                  </div>

                  <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-500">{t('inventory_rows_found')}</p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">{previewProducts.length}</p>
                    </div>
                    <div className="border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-500">{t('inventory_rows_valid')}</p>
                      <p className="mt-1 text-xl font-semibold text-sky-800">{previewProducts.filter(p => p.hasImage && p.name && p.code && p.category && p.description && p.stock !== undefined && p.sellerAPrice !== undefined && p.sellerBPrice !== undefined).length}</p>
                    </div>
                    <div className={`border px-4 py-3 ${validationErrors.length ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
                      <p className={`text-xs ${validationErrors.length ? 'text-rose-700' : 'text-emerald-700'}`}>{t('inventory_validation_issues')}</p>
                      <p className={`mt-1 text-xl font-semibold ${validationErrors.length ? 'text-rose-800' : 'text-emerald-800'}`}>{validationErrors.length}</p>
                    </div>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="mb-6 border border-rose-200 bg-rose-50 p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-800">
                        <AlertTriangle size={16} /> 
                        {t('inventory_import_issues_block').replace('{count}', String(validationErrors.length))}
                      </h3>
                      <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-4 text-xs text-rose-700">
                        {validationErrors.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="overflow-x-auto border border-slate-200">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">{t('row') || 'Row'}</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">{t('image') || 'Image'}</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">{t('product_code_label') || 'Code'}</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">{t('product_name_en') || 'Name (EN)'}</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">{t('category') || 'Category'}</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">{t('stock') || 'Stock'}</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">{t('inventory_seller_a')}</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">{t('inventory_seller_b')}</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">{t('status') || 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {previewProducts.map((p, i) => (
                          <tr key={i} className={`transition-colors odd:bg-white even:bg-slate-50 hover:bg-sky-50 ${!p.hasImage || !p.name || !p.code || !p.category || !p.description || p.stock === undefined || p.sellerAPrice === undefined || p.sellerBPrice === undefined ? '!bg-rose-50' : ''}`}>
                            <td className="px-4 py-3 text-xs text-slate-500">{p.rowNum}</td>
                            <td className="px-4 py-3">
                              {p.hasImage && previewImages[p.imageFilename] ? (
                                <img src={previewImages[p.imageFilename].url} alt={p.name} className="h-10 w-10 border border-slate-200 object-cover" />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center border border-rose-200 bg-rose-50 text-rose-600" title={t('inventory_missing_image')}>
                                  <X size={14} />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.code || <span className="text-rose-600">{t('missing') || 'Missing'}</span>}</td>
                            <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-700">{p.name || <span className="text-rose-600">{t('missing') || 'Missing'}</span>}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{p.category || '-'}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{p.stock}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">RM {p.sellerAPrice.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">RM {p.sellerBPrice.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex border px-2 py-1 text-xs font-medium ${p.status === 'Hold' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                    <button 
                      onClick={() => setPreviewProducts([])}
                      disabled={isLoading}
                      className="border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >{t('reupload') || 'Re-upload'}</button>
                    <button 
                      onClick={handleConfirmImport}
                      disabled={isLoading || validationErrors.length > 0 || previewProducts.length === 0 || previewProducts.some(p => !p.hasImage || !p.name || !p.code || !p.category || !p.description || p.stock === undefined || p.sellerAPrice === undefined || p.sellerBPrice === undefined)}
                      className="inline-flex items-center justify-center gap-2 bg-sky-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <div className="h-5 w-5 animate-spin border-2 border-white/30 border-t-white" />
                          <span className="opacity-80">{t('importing') || 'Importing'} ({progress}%)...</span>
                        </>
                      ) : (
                        `${t('confirm_import') || 'Import Entire File'} (${previewProducts.length} ${t('products_text') || 'Products'})`
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
