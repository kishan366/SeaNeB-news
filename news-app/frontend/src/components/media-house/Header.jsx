"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Plus,
  Building2,
  Bell,
  ArrowRightLeft,
  Menu} from 'lucide-react';
import { getFullImageUrl } from '@/lib/apiconfig';
import { useBranch } from '@/context/BranchContext';

export default function Header({ onMenuToggle }) {
  const router = useRouter();
  const { businesses, selectedBranch, setSelectedBranch, userProfile, refreshBusinesses, loading } = useBranch();
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [expandedBizId, setExpandedBizId] = useState(null);

  const LISTING_URL = process.env.NEXT_PUBLIC_LISTING_URL || "/";



  // Auto-expand current business's branch list
  useEffect(() => {
    if (selectedBranch && !expandedBizId) {
       const parentBiz = businesses.find(biz => 
         (biz.branches || biz.Branches || []).some(b => b.branch_id === selectedBranch.branch_id)
       );
       if (parentBiz) setExpandedBizId(parentBiz.id || parentBiz.business_id);
    }
  }, [selectedBranch, businesses]);

  const currentBusinessName = selectedBranch?.branch_name || selectedBranch?.Business?.business_name || selectedBranch?.business_name || "Loading...";
  const currentBranchId = selectedBranch?.branch_id || selectedBranch?.id || "N/A";

  return (
    <header className="h-14 md:h-16 bg-white dark:bg-slate-900 px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-40 transition-all duration-300 rounded-b-2xl lg:rounded-b-[32px] border-b border-slate-200/60 dark:border-slate-800">
      
      {/* LEFT: MENU TOGGLE + BRANCH SELECTOR */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* MOBILE MENU TOGGLE */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
        >
          <Menu size={20} />
        </button>
        {/* BRANCH SELECTOR DROPDOWN (COMPACT) */}
        <div className="relative">
          <button
            onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
            className="flex items-center gap-2 md:gap-3 bg-slate-900 dark:bg-slate-800 text-white p-1.5 md:p-2 rounded-lg border border-white/5 hover:bg-black transition-all group"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 bg-white/10 rounded-md flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
              {selectedBranch?.branch_logo ? (
                <img src={getFullImageUrl(selectedBranch.branch_logo)} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-white text-xs font-black uppercase">{currentBusinessName.charAt(0)}</span>
              )}
            </div>
            <div className="text-left hidden lg:block pr-2">
              <h1 className="text-[11px] font-bold tracking-tight leading-none text-white mb-0.5 uppercase truncate max-w-32">{currentBusinessName}</h1>
              <p className="text-[8px] font-medium text-slate-400 uppercase tracking-wider leading-none">ID: {currentBranchId.substring(0, 8)}</p>
            </div>
            <ChevronDown size={12} className={`text-slate-500 transition-transform duration-300 mr-1 ${isBranchDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* DROPDOWN MENU */}
          {isBranchDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsBranchDropdownOpen(false)}></div>
              <div className="absolute top-full left-0 mt-3 w-85 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 py-3 overflow-hidden animate-in fade-in slide-in-from-top-4 border-t-4 border-t-black">
                <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Switch Business Identity</span>
                </div>

                <div className="max-h-96 overflow-y-auto custom-scrollbar px-3">
                  {businesses.length > 0 ? businesses.map((biz) => {
                    const bizId = biz.id || biz.business_id;
                    const isExpanded = expandedBizId === bizId;
                    const branches = biz.branches || biz.Branches || [];

                    return (
                      <div key={bizId} className="mb-2 last:mb-0">
                        {/* BUSINESS ROW (Header) */}
                        <div 
                          onClick={() => setExpandedBizId(isExpanded ? null : bizId)}
                          className={`px-4 py-4 cursor-pointer flex items-center justify-between rounded-2xl transition-all ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-[10px] font-black uppercase">
                                 {biz.business_name?.charAt(0) || "B"}
                              </div>
                              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white truncate max-w-45">
                                 {biz.business_name}
                              </h3>
                           </div>
                           <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>

                        {/* BRANCHES LIST (Expandable) */}
                        {isExpanded && (
                          <div className="mt-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800 pl-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
                             {branches.map((branch) => (
                               <div
                                 key={branch.branch_id}
                                 onClick={() => {
                                   setSelectedBranch(branch);
                                   setIsBranchDropdownOpen(false);
                                 }}
                                 className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all group ${selectedBranch?.branch_id === branch.branch_id ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                               >
                                  <div className="flex flex-col">
                                     <span className="text-[10px] font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">
                                        {branch.branch_name || "Main Terminal"}
                                     </span>
                                     <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                        ID: {branch.branch_id?.substring(0, 8)}
                                     </span>
                                  </div>
                                  <div className={`w-1.5 h-1.5 rounded-full ${Number(branch.branch_status) === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                               </div>
                             ))}
                             
                             {/* CREATE BRANCH ACTION */}
                             <button 
                               onClick={() => router.push(`/auth/business-register?business_id=${bizId}`)}
                               className="w-full p-3 rounded-xl flex items-center gap-3 text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-dashed border-2 border-slate-100 dark:border-slate-800 mt-2 group"
                             >
                                <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                   <Plus size={12} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest">Create Branch</span>
                             </button>
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="px-6 py-12 text-center text-slate-400">
                       <Building2 size={32} className="mx-auto mb-4 opacity-20" />
                       <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No Corporate Nodes Registered</p>
                    </div>
                  )}
                </div>

                {/* CREATE BUSINESS GLOBAL ACTION (ONLY WHEN NOTHING EXPANDED) */}
                {!expandedBizId && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 px-4">
                    <button
                      onClick={() => router.push('/auth/business-register?mode=new-biz')}
                      className="w-full p-3 rounded-xl flex items-center gap-3 text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-dashed border-2 border-slate-100 dark:border-slate-800 group"
                    >
                      <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                        <Plus size={12} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest">Register New Business</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>


      </div>

      {/* RIGHT: SEARCH + ACTIONS + PROFILE */}
      <div className="flex items-center gap-3 md:gap-6">
        
        {/* SEPARATOR & SWITCH HOME */}
        <div className="hidden xl:flex items-center gap-4">
          <button 
            onClick={() => window.location.href = LISTING_URL}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-black transition-all"
          >
            <ArrowRightLeft size={14} /> Home
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
        </div>

        {/* NOTIFICATIONS & SETTINGS */}
        <div className="flex items-center gap-3">
           <button className="p-3 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all relative">
             <Bell size={20} />
             <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"></span>
           </button>
        </div>
      </div>
    </header>
  );
}
