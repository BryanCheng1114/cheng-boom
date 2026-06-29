import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useLanguage } from '../../context/LanguageContext';
import { 
  HelpCircle, Package, Settings as SettingsIcon, ShieldCheck, 
  ChevronRight, X, ArrowRight, UploadCloud, FileText, 
  ListOrdered, Award, Search, Star, Play, Clock, Check, Info, HeadphonesIcon, Grid,
  LayoutGrid, ArrowRightIcon,
  Activity, Truck, CheckCircle2, AlertCircle, ArrowDown
} from 'lucide-react';
import Link from 'next/link';
import SpotlightCard from '../../components/ui/SpotlightCard';

export default function HelpPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('status-flow');

  return (
    <AdminLayout title="Help & Tutorials" hideTitle>
      <div className="w-full mx-auto p-4 md:p-8 font-sans mt-4">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Help & Tutorials</h1>
            <p className="text-zinc-500 font-medium mt-1">Find guides, instructions, and answers to help you manage your store efficiently.</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search for help articles..." 
              className="w-full pl-10 pr-12 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 transition-all font-medium text-sm shadow-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded text-[10px] font-bold text-zinc-500 border border-zinc-200">
              ⌘ K
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="lg:w-[320px] shrink-0">
            <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 px-4 mb-3">Help Categories</h3>
              
              <div className="space-y-1">
                {/* Status Flow Tab */}
                <button
                  onClick={() => setActiveTab('status-flow')}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all ${activeTab === 'status-flow' ? 'bg-zinc-900 border border-zinc-900 text-white shadow-sm' : 'border border-transparent hover:bg-zinc-50 text-zinc-700'}`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${activeTab === 'status-flow' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                    <Package size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${activeTab === 'status-flow' ? 'text-white' : 'text-zinc-900'}`}>Order Status Flow</h4>
                    <p className={`text-xs mt-0.5 font-medium ${activeTab === 'status-flow' ? 'text-zinc-400' : 'text-zinc-500'}`}>Learn order process</p>
                  </div>
                </button>

                {/* Bulk Upload Tab */}
                <button
                  onClick={() => setActiveTab('bulk-upload')}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all ${activeTab === 'bulk-upload' ? 'bg-zinc-900 border border-zinc-900 text-white shadow-sm' : 'border border-transparent hover:bg-zinc-50 text-zinc-700'}`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${activeTab === 'bulk-upload' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                    <UploadCloud size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${activeTab === 'bulk-upload' ? 'text-white' : 'text-zinc-900'}`}>Bulk Upload Guide</h4>
                    <p className={`text-xs mt-0.5 font-medium ${activeTab === 'bulk-upload' ? 'text-zinc-400' : 'text-zinc-500'}`}>Upload products in bulk</p>
                  </div>
                </button>

                {/* Seller Setup Tab */}
                <button
                  onClick={() => setActiveTab('seller-setup')}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all ${activeTab === 'seller-setup' ? 'bg-zinc-900 border border-zinc-900 text-white shadow-sm' : 'border border-transparent hover:bg-zinc-50 text-zinc-700'}`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${activeTab === 'seller-setup' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                    <Award size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${activeTab === 'seller-setup' ? 'text-white' : 'text-zinc-900'}`}>Seller Setup Guide</h4>
                    <p className={`text-xs mt-0.5 font-medium ${activeTab === 'seller-setup' ? 'text-zinc-400' : 'text-zinc-500'}`}>Onboard and manage sellers</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">
            
            {activeTab === 'status-flow' && (
              <>
                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-[#FFF5F0] to-[#FFF0E6] border border-[#FFE4D6] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-sm">
                  <div className="relative z-10 max-w-lg">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#FFD5BC] rounded-full text-[#FF6B00] text-[10px] font-bold uppercase tracking-wider mb-6 shadow-sm">
                      <Star size={12} className="fill-[#FF6B00]" /> Most Popular
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight mb-4">
                      Order Status Flow Tutorial
                    </h2>
                    
                    <p className="text-zinc-600 font-medium mb-8 leading-relaxed text-sm md:text-base pr-4">
                      Understand how orders move through each stage from pending to completion.
                    </p>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold bg-white/50 px-3 py-1.5 rounded-lg border border-[#FFE4D6]">
                        <Clock size={16} /> 3 min read
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 md:w-1/2 pointer-events-none hidden sm:flex items-center justify-end pr-12">
                    <div className="relative w-64 h-64 scale-110">
                      {/* Fake 3D Box */}
                      <div className="absolute right-12 bottom-8 w-32 h-32 bg-[#E1A071] rounded-2xl shadow-xl flex flex-col p-4 border-b-[12px] border-r-[12px] border-[#C5804F]">
                         <div className="w-10 h-10 rounded-full bg-[#FFE4D6] mb-auto"></div>
                         <div className="w-16 h-3 bg-[#FFE4D6] rounded-full mt-2"></div>
                         <div className="w-20 h-3 bg-[#FFE4D6] rounded-full mt-2"></div>
                      </div>
                      
                      {/* Fake 3D Clipboard */}
                      <div className="absolute right-36 top-4 w-32 h-40 bg-white rounded-xl shadow-2xl border border-zinc-100 flex flex-col items-center pt-2">
                        <div className="w-14 h-5 bg-zinc-200 rounded-full mb-4 relative -top-5 shadow-sm border border-zinc-300"></div>
                        <div className="w-full px-5 space-y-4 -mt-2">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-500 shadow-sm"><Check size={12} strokeWidth={3} /></div>
                            <div className="h-2.5 w-12 bg-zinc-200 rounded-full"></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-500 shadow-sm"><Check size={12} strokeWidth={3} /></div>
                            <div className="h-2.5 w-14 bg-zinc-200 rounded-full"></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-500 shadow-sm"><Check size={12} strokeWidth={3} /></div>
                            <div className="h-2.5 w-10 bg-zinc-200 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Decorative Bar charts */}
                      <div className="absolute right-2 bottom-4 flex items-end gap-2">
                        <div className="w-5 h-16 bg-[#86EFac] rounded-t-sm shadow-md"></div>
                        <div className="w-5 h-10 bg-yellow-400 rounded-t-sm shadow-md"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Original Flow Section */}
                <div className="bg-white rounded-[32px] border border-zinc-200 p-8 md:p-10 shadow-sm">
                  <div className="flex items-center justify-between mb-12">
                    <h3 className="text-xl font-bold text-zinc-900">Order Status Flow Overview</h3>
                  </div>
                  
                  <div className="relative w-full overflow-x-auto bg-zinc-50 rounded-2xl p-10 border border-zinc-200">
                    <div className="min-w-[700px]">
                      {/* Main Flow (Grid) */}
                      <div className="grid grid-cols-4 gap-8 relative z-10">
                        
                        {/* 1. Pending */}
                        <div className="relative flex justify-center">
                          <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.2)" className="w-full py-6 px-4 bg-orange-500/5 text-orange-600 rounded-2xl border border-orange-500/20 flex flex-col items-center gap-3 relative z-20 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <Clock size={28} />
                            <div className="text-center">
                               <span className="font-black text-xs uppercase tracking-widest block">Pending</span>
                               <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed hidden sm:block">Order is received. Awaiting admin review or payment confirmation.</p>
                            </div>
                          </SpotlightCard>
                          {/* Horizontal Line connecting to next */}
                          <div className="absolute top-1/2 left-[50%] w-full h-[2px] bg-zinc-200 z-10 -translate-y-1/2"></div>
                          <ArrowRight size={24} className="absolute top-1/2 -translate-y-1/2 -right-5 text-zinc-400 z-30 bg-zinc-50 rounded-full p-1 border border-zinc-200" />
                        </div>

                        {/* 2. In Process */}
                        <div className="relative flex justify-center">
                          <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.2)" className="w-full py-6 px-4 bg-blue-500/5 text-blue-600 rounded-2xl border border-blue-500/20 flex flex-col items-center gap-3 relative z-20 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <Activity size={28} />
                            <div className="text-center">
                               <span className="font-black text-xs uppercase tracking-widest block">In Process</span>
                               <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed hidden sm:block">Order is confirmed. Items are being packed and prepared.</p>
                            </div>
                          </SpotlightCard>
                          <div className="absolute top-1/2 left-[50%] w-full h-[2px] bg-zinc-200 z-10 -translate-y-1/2"></div>
                          <ArrowRight size={24} className="absolute top-1/2 -translate-y-1/2 -right-5 text-zinc-400 z-30 bg-zinc-50 rounded-full p-1 border border-zinc-200" />
                        </div>

                        {/* 3. Delivering */}
                        <div className="relative flex justify-center">
                          <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.2)" className="w-full py-6 px-4 bg-purple-500/5 text-purple-600 rounded-2xl border border-purple-500/20 flex flex-col items-center gap-3 relative z-20 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <Truck size={28} />
                            <div className="text-center">
                               <span className="font-black text-xs uppercase tracking-widest block">Delivering</span>
                               <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed hidden sm:block">Package is out for delivery or ready for customer pickup.</p>
                            </div>
                          </SpotlightCard>
                          <div className="absolute top-1/2 left-[50%] w-full h-[2px] bg-zinc-200 z-10 -translate-y-1/2"></div>
                          <ArrowRight size={24} className="absolute top-1/2 -translate-y-1/2 -right-5 text-zinc-400 z-30 bg-zinc-50 rounded-full p-1 border border-zinc-200" />
                        </div>

                        {/* 4. Completed */}
                        <div className="relative flex justify-center">
                          <SpotlightCard spotlightColor="rgba(34, 197, 94, 0.2)" className="w-full py-6 px-4 bg-green-500/5 text-green-600 rounded-2xl border border-green-500/20 flex flex-col items-center gap-3 relative z-20 bg-white shadow-sm shadow-green-500/10 hover:shadow-md transition-shadow">
                            <CheckCircle2 size={28} />
                            <div className="text-center">
                               <span className="font-black text-xs uppercase tracking-widest block">Completed</span>
                               <p className="text-[10px] text-green-600/70 mt-2 font-bold leading-relaxed hidden sm:block">Successfully fulfilled. No further actions can be taken.</p>
                            </div>
                          </SpotlightCard>
                        </div>
                      </div>

                      {/* Downward Arrows Row */}
                      <div className="grid grid-cols-4 gap-8 h-12 mt-4 relative">
                        <div className="flex justify-center border-r-2 border-dashed border-red-200 w-1/2 relative">
                          <ArrowDown size={16} className="absolute bottom-0 -right-[9px] text-red-400 bg-zinc-50" />
                        </div>
                        <div className="flex justify-center border-r-2 border-dashed border-red-200 w-1/2 relative">
                          <ArrowDown size={16} className="absolute bottom-0 -right-[9px] text-red-400 bg-zinc-50" />
                        </div>
                        <div className="flex justify-center border-r-2 border-dashed border-red-200 w-1/2 relative">
                          <ArrowDown size={16} className="absolute bottom-0 -right-[9px] text-red-400 bg-zinc-50" />
                        </div>
                        <div></div>
                      </div>

                      {/* Cancelled Block */}
                      <div className="grid grid-cols-4 gap-8 mt-4">
                        <div className="col-span-3">
                          <SpotlightCard spotlightColor="rgba(239, 68, 68, 0.2)" className="w-full py-5 px-6 bg-red-500/5 text-red-600 rounded-2xl border border-red-500/20 flex flex-col sm:flex-row items-center justify-center gap-3 bg-white relative z-20 shadow-sm shadow-red-500/5 hover:shadow-md transition-shadow">
                            <AlertCircle size={24} />
                            <div className="text-center sm:text-left">
                               <span className="font-black text-xs uppercase tracking-widest block">Cancelled</span>
                               <p className="text-[10px] text-red-500/80 mt-1 font-medium hidden sm:block">Order was cancelled before fulfillment. Stock may be returned.</p>
                            </div>
                          </SpotlightCard>
                        </div>
                        <div className="flex flex-col justify-center pl-4 border-l-4 border-red-100 rounded-lg">
                          <p className="text-xs font-black text-red-500 uppercase tracking-widest leading-relaxed">
                            Important Note:
                          </p>
                          <p className="text-[10px] font-medium text-zinc-500 mt-1 leading-relaxed">
                            Orders <strong className="text-red-500">cannot</strong> be cancelled once they reach the Completed state.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Existing Tab Contents for Bulk Upload and Seller Setup... */}
            {activeTab === 'bulk-upload' && (
              <div className="bg-white rounded-[32px] border border-zinc-200 overflow-hidden shadow-sm p-8">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 text-yellow-600 rounded-xl">
                      <HelpCircle size={24} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tight text-zinc-900">
                      Bulk Upload Guidance
                    </h3>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="max-w-2xl text-zinc-600 font-medium">
                    <p>
                      Welcome to the Bulk Upload guide. Our bulk import system allows you to easily upload hundreds of products and their corresponding images simultaneously using a single ZIP archive. Follow these professional guidelines to ensure a flawless data import experience.
                    </p>
                  </div>
                  {/* Step 1 */}
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-1/2 bg-zinc-100 rounded-2xl border border-zinc-200 flex items-center justify-center relative overflow-hidden p-2 group">
                      <img src="/excel.png" alt="Excel Template Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 font-black text-xs mb-2 shadow-sm border border-blue-500/20">1</div>
                      <h4 className="text-2xl font-black italic text-zinc-900">Prepare the Excel Template</h4>
                      <div className="text-sm text-zinc-500 space-y-3 font-medium">
                        <p>Begin by downloading the official template from the Products page.</p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>Fill in all the required columns (marked with an asterisk <span className="text-red-500 font-bold">*</span>).</li>
                          <li>For the <span className="font-bold text-zinc-700">Image_Filename</span> column, input the exact filename of your image (e.g., <code className="bg-zinc-100 px-2 py-0.5 rounded text-xs text-pink-600 font-mono">firework-01.png</code>).</li>
                          <li>Ensure the spelling and file extension (.png, .jpg) matches your actual image file perfectly.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* Step 2 */}
                  <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                    <div className="w-full md:w-1/2 bg-zinc-100 rounded-2xl border border-zinc-200 flex items-center justify-center relative overflow-hidden p-2 group">
                      <img src="/zip.png" alt="Folder Structure Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-600 font-black text-xs mb-2 shadow-sm border border-yellow-500/20">2</div>
                      <h4 className="text-2xl font-black italic text-zinc-900">Package the ZIP Archive</h4>
                      <div className="text-sm text-zinc-500 space-y-3 font-medium">
                        <p>Consolidate your filled template and all product images into a single folder.</p>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-800">
                          <span className="font-bold">Note on Folders:</span> Our system utilizes a smart-scan engine. Folder names do not matter. We automatically search all directories within your ZIP archive to match filenames perfectly.
                        </div>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>Create a new folder on your computer.</li>
                          <li>Move your completed `.xlsx` template and all related image files into this folder.</li>
                          <li>Right-click the folder and select <span className="font-bold text-zinc-700">Compress to ZIP file</span>.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* Step 3 */}
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-1/2 bg-zinc-100 rounded-2xl border border-zinc-200 flex items-center justify-center relative overflow-hidden p-2 group">
                      <img src="/validation.png" alt="Validation Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-600 font-black text-xs mb-2 shadow-sm border border-green-500/20">3</div>
                      <h4 className="text-2xl font-black italic text-zinc-900">Upload and Verify</h4>
                      <div className="text-sm text-zinc-500 space-y-3 font-medium">
                        <p>Navigate to the Bulk Upload page and drop your newly created `.zip` package.</p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>The system will extract and analyze your ZIP package locally.</li>
                          <li>A preview table will appear showing exactly how your products will look.</li>
                          <li>Review any validation errors highlighted in red.</li>
                          <li>Click <span className="font-bold text-zinc-700">Confirm Import</span> to permanently save the products to the database.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seller-setup' && (
              <div className="bg-white rounded-[32px] border border-zinc-200 overflow-hidden shadow-sm p-8">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                      <Award size={24} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tight text-zinc-900">
                      {t('seller_setup_guide') || 'Seller Setup Guide'}
                    </h3>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Step 1 */}
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/2 bg-zinc-100 rounded-2xl border border-zinc-200 flex items-center justify-center relative overflow-hidden p-2 group">
                      <img src="/seller%20guide/silver.png" alt="Silver Tier Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 font-black text-xs mb-2">1</div>
                      <h4 className="text-lg font-bold text-zinc-900">{t('silver_tier') || 'Silver Tier'}</h4>
                      <p className="text-sm text-zinc-500">
                        {t('silver_tier_desc') || 'The standard tier for new sellers. Earn a'} <span className="font-bold text-green-500">{t('five_percent_discount') || '5% Commission'}</span> {t('on_all_products_without_fs') || 'on all standard product sales.'}
                      </p>
                    </div>
                  </div>
                  {/* Step 2 */}
                  <div className="flex flex-col md:flex-row-reverse gap-6 items-center">
                    <div className="w-full md:w-1/2 bg-zinc-100 rounded-2xl border border-zinc-200 flex items-center justify-center relative overflow-hidden p-2 group">
                      <img src="/seller%20guide/gold.png" alt="Gold Tier Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 font-black text-xs mb-2">2</div>
                      <h4 className="text-lg font-bold text-zinc-900">{t('gold_tier') || 'Gold Tier'}</h4>
                      <p className="text-sm text-zinc-500">
                        {t('gold_tier_desc') || 'For experienced sellers with higher volume. Earn a'} <span className="font-bold text-green-500">{t('ten_percent_discount') || '10% Commission'}</span> {t('on_all_products') || 'on all sales.'}
                      </p>
                    </div>
                  </div>
                  {/* Step 3 */}
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/2 bg-zinc-100 rounded-2xl border border-zinc-200 flex items-center justify-center relative overflow-hidden p-2 group">
                      <img src="/seller%20guide/platinum.png" alt="Platinum Tier Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 font-black text-xs mb-2">3</div>
                      <h4 className="text-lg font-bold text-zinc-900">{t('platinum_tier') || 'Platinum Tier'}</h4>
                      <p className="text-sm text-zinc-500">
                        {t('platinum_tier_desc') || 'The highest tier for our best sellers. Earn a'} <span className="font-bold text-green-500">{t('fifteen_percent_discount') || '15% Commission'}</span> {t('and_enable') || 'and enable'} <span className="font-bold text-blue-500">{t('free_shipping') || 'Free Shipping'}</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
