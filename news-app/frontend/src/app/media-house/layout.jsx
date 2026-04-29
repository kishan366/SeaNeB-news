"use client";
import React from 'react';
import Sidebar from '@/components/media-house/Sidebar';
import Header from '@/components/media-house/Header';
import { BranchProvider, useBranch } from '@/context/BranchContext';
import { RBACProvider, useRBAC } from '@/context/RBACContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function DashboardGuard({ children }) {
  const { selectedBranch, loading } = useBranch();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && selectedBranch) {
      const branchId = selectedBranch.branch_id || selectedBranch.id;
      const localCompleted = branchId ? localStorage.getItem(`profile_completed_${branchId}`) === 'true' : false;
      
      const isCompleted = selectedBranch.is_profile_completed || localCompleted;
      
      if (!isCompleted) {
        router.replace(`/complete-profile?branch_id=${branchId}`);
      }
    }
  }, [loading, selectedBranch, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
         <Loader2 className="w-8 h-8 text-black animate-spin mb-4 dark:text-white" />
      </div>
    );
  }

  // Prevent flicker before redirect
  const branchId = selectedBranch?.branch_id || selectedBranch?.id;
  const localCompleted = branchId ? localStorage.getItem(`profile_completed_${branchId}`) === 'true' : false;
  
  if (selectedBranch && !(selectedBranch.is_profile_completed || localCompleted)) {
    return null;
  }

  return children;
}

export default function MediaHouseLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <BranchProvider>
      <RBACProvider>
        <div className="flex h-screen bg-[#F8F9FA] dark:bg-slate-950 font-sans transition-colors duration-500 overflow-hidden">
        {/* GLOBAL SIDEBAR */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* MAIN CONTENT AREA CONTAINER */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
          {/* GLOBAL HEADER */}
          <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

          {/* PAGE CONTENT WRAPPER */}
          <main className="flex-1 overflow-y-auto bg-slate-50/20 dark:bg-slate-900/40 transition-all duration-300">
            <div className="max-w-250 mx-auto px-4 md:px-1 py-1 md:py-1 lg:py-1"> 
               <DashboardGuard>{children}</DashboardGuard>
            </div>
          </main>
        </div>

        <style>{`
          /* Minimalist Scrollbar Design */
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
          .dark ::-webkit-scrollbar-thumb { background: #334155; }
          ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
          
          /* Modern UI Utilities */
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
          
          /* Animation Utility */
          @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>
        </div>
      </RBACProvider>
    </BranchProvider>
  );
}
