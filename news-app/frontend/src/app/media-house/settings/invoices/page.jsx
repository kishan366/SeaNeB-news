"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  AlertCircle,
  Clock,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import api from '@/lib/apiconfig';
import { useBranch } from '@/context/BranchContext';

function InvoiceContent() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const response = await api.user.getBusinesses();
        if (response?.success) {
          setUserProfile(response.data);
        }
      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleDownloadInvoice = async () => {
    if (downloading) return;
    setDownloading(true);
    setErrorMessage(null);
    
    try {
      if (!selectedBranch) throw new Error("No branch selected. Please select a branch from the sidebar.");
      
      const branchId = selectedBranch.branch_id || selectedBranch.id;
      if (!branchId) throw new Error("Branch identity not verified.");

      const branchResp = await api.payment.getInvoiceByBranch(branchId);
      const mainData = Array.isArray(branchResp?.data) ? branchResp.data[0] : (branchResp?.data || branchResp);
      const targetInvoiceId = mainData?.invoice_id || mainData?.id || 
                              (Array.isArray(branchResp) ? branchResp[0]?.invoice_id || branchResp[0]?.id : null);
      
      if (!targetInvoiceId) throw new Error("Invoice record is being processed. Please try again shortly.");

      const pdfResp = await api.payment.downloadInvoicePdf(targetInvoiceId);
      if (!pdfResp.ok) throw new Error("PDF generation service unavailable.");
      
      const contentType = pdfResp.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await pdfResp.json();
        const downloadUrl = json.download_url || json.url || json.data?.download_url;
        if (downloadUrl) { window.location.href = downloadUrl; return; }
      }

      const blob = await pdfResp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${targetInvoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setErrorMessage(err.message || "Failed to download. Please retry.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <section className="flex-1 overflow-y-auto px-4 md:px-12 py-8 md:py-12 bg-white dark:bg-slate-950 animate-fade-in shadow-inner min-h-full">
      <div className="max-w-7xl mx-auto">
        
        {/* PAGE HEADER */}
        <div className="mb-10 md:mb-14">
           <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">Billing & Invoices</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-start">
           
           {/* DOWNLOAD TERMINAL */}
           <div className="w-full lg:max-w-110 bg-white dark:bg-slate-900 rounded-4xl md:rounded-[50px] p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-100/50 dark:shadow-none relative group">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-400"></div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Financial Core Registry</h3>
                </div>

                <div className="flex items-center gap-4 md:gap-6 mb-4">
                   <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-3xl text-slate-900 dark:text-white flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
                      <FileText size={24} className="md:w-8 md:h-8" />
                   </div>
                   <div>
                     <h4 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Onboarding Invoices</h4>
                     <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Tax-Compliant PDF</p>
                   </div>
                </div>
                
                <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed pr-8">
                  Generate digital receipts for your nodes.
                </p>

                {errorMessage && (
                  <div className="mb-8 p-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-4xl flex gap-5 items-start animate-fade-in shadow-sm shadow-rose-200/20">
                    <AlertCircle size={20} className="text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold leading-tight uppercase tracking-widest">{errorMessage}</p>
                  </div>
                )}

                <button 
                   onClick={handleDownloadInvoice}
                   disabled={downloading}
                   className={`w-full py-4 md:py-6 rounded-2xl md:rounded-4xl flex items-center justify-center gap-3 md:gap-5 font-black uppercase text-[10px] md:text-xs tracking-widest transition-all active:scale-[0.98] ${
                     downloading 
                     ? "bg-slate-50 text-slate-400 cursor-wait border border-slate-100" 
                     : "bg-black text-white hover:bg-slate-800 shadow-xl shadow-black/10"
                   }`}
                >
                  {downloading ? (
                    <>
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                      Encrypting PDF...
                    </>
                  ) : (
                    <>
                      <Download size={18} className="md:w-5 md:h-5" strokeWidth={2.5} />
                      Download Final Invoice
                    </>
                  )}
                </button>
              </div>
           </div>
        </div>

      </div>
    </section>
  );
}

export default function InvoicePage() {
  return (
    <React.Suspense fallback={<div className="h-screen flex items-center justify-center bg-white">Loading Financial Engine...</div>}>
      <InvoiceContent />
    </React.Suspense>
  );
}

// export default function InvoicesPage() {
//   return <div>Invoices Page</div>;
// }