"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Loader2
} from 'lucide-react';
import api, { getFullImageUrl } from '@/lib/apiconfig';

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const response = await api.user.getBusinesses();
      if (response?.success) {
        const branchList = response.data?.Branches || response.data?.[0]?.branches || [];
        setBranches(branchList);
        
        let activeBranch = branchList.find(b => 
           Number(b.branch_status) === 1 && Number(b.onboarding_status) === 1
        ) || branchList[0];

        if (activeBranch) {
           setSelectedBranch(activeBranch);
        }
      } else {
        setError("Failed to fetch business data.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-black dark:text-white animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Node Systems...</p>
      </div>
    );
  }

  return (
    <section className="flex-1 overflow-y-auto p-12 bg-white dark:bg-slate-950 animate-fade-in shadow-inner h-full min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* PAGE HEADER */}
        <div className="mb-12">
           <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">Node Intelligence</h2>
           <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">Detailed technical and operational metrics for the selected business node.</p>
        </div>

        {/* DATA LISTING */}
        {selectedBranch ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[50px] p-12 shadow-xl shadow-slate-100/50 dark:shadow-none max-w-5xl">

            {/* IDENTITY SUB-HEADER */}
            <div className="flex items-center gap-8 mb-12">
              <div className="w-24 h-24 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                {selectedBranch.branch_logo ? (
                  <img src={getFullImageUrl(selectedBranch.branch_logo)} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Building2 size={32} className="text-slate-200" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2 flex-wrap">
                   <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                     {selectedBranch.Business?.business_name || selectedBranch.business_name}
                   </h2>
                   <span
                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${Number(selectedBranch.branch_status) === 1
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white"
                      }`}
                  >
                    {Number(selectedBranch.branch_status) === 1 ? "Active Node" : "Offline"}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                  {selectedBranch.display_name || "Primary Terminal"} — ID: {selectedBranch.branch_id || selectedBranch.id}
                </p>
              </div>
            </div>

            {/* DETAILS GRID  */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-4xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-slate-200 rounded-full group-hover:bg-black transition-colors"></div>
                   Primary Network
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white tracking-widest">
                  {selectedBranch.primary_number || "No Data"}
                </p>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-4xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-slate-200 rounded-full group-hover:bg-emerald-500 transition-colors"></div>
                   Verification Sync
                </div>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-widest">
                  {selectedBranch.whatsapp_number || "Sync Pending"}
                </p>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-4xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group md:col-span-2 lg:col-span-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-slate-200 rounded-full group-hover:bg-black transition-colors"></div>
                   Core Registry
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {selectedBranch.business_email || "Not Configured"}
                </p>
              </div>

            </div>

            <div className="mt-12 flex justify-end">
               <button 
                  onClick={() => router.push('/media-house/profile')}
                  className="px-10 py-5 bg-black text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-800 shadow-xl shadow-black/20 transition-all active:scale-95"
               >
                 View Comprehensive Profile
               </button>
            </div>

          </div>
        ) : (
          <div className="py-20 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[50px] border-2 border-dashed border-slate-100 dark:border-slate-800">
            <Building2 size={64} className="text-slate-100 dark:text-slate-800 mx-auto mb-6" />
            <p className="text-slate-400 font-black uppercase tracking-[0.3em]">{error || "No node identity found"}</p>
          </div>
        )}
      </div>
    </section>
  );
}