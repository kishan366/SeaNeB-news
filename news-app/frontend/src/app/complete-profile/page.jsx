"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '@/lib/apiconfig';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [businessData, setBusinessData] = useState(null);

  const [formData, setFormData] = useState({
    pan_number: '',
    gst_number: '',
    pan_doc: null,
    gst_doc: null,
    license_doc: null
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.user.getBusinesses();
        console.log("Businesses check:", response);
        if (response?.success && response.data?.length > 0) {
          const searchParams = new URLSearchParams(window.location.search);
          const targetBranchId = searchParams.get('branch_id');

          let activeBranch = null;

          // If a branch_id is provided, search all businesses for that specific branch
          if (targetBranchId) {
            for (const biz of response.data) {
              const branches = biz.branches || biz.Branches || [];
              const found = branches.find(b => 
                String(b.branch_id) === String(targetBranchId) || 
                String(b.id) === String(targetBranchId)
              );
              if (found) {
                activeBranch = found;
                break;
              }
            }
          }

          // Fallback to the first branch of the first business if no ID or no match found
          if (!activeBranch) {
            const biz = response.data[0];
            const branches = biz.branches || biz.Branches || [];
            if (branches.length > 0) {
              activeBranch = branches[0];
            }
          }

          // if (activeBranch) {
          //    setBusinessData(activeBranch);
          //    const branchId = activeBranch.branch_id || activeBranch.id;
          //    const localCompleted = branchId ? localStorage.getItem(`profile_completed_${branchId}`) === 'true' : false;

          //    if (activeBranch.is_profile_completed || localCompleted) {
          //       router.replace('/media-house');
          //    } else {
          //       setChecking(false);
          //    }
          // } 
          if (activeBranch) {
            const branchId = activeBranch.branch_id || activeBranch.id;

            // TEMP SKIP (no loop)
            localStorage.setItem(`profile_completed_${branchId}`, 'true');

            router.replace('/media-house');
            return;
          }
          else {
             setChecking(false);
          }
        } else {
          router.replace('/auth/business-register');
        }
      } catch (err) {
        console.error("Failed to check status:", err);
        setChecking(false);
      }
    };
    checkStatus();
  }, [router]);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.pan_number || !formData.pan_doc || !formData.license_doc) {
      alert("Please provide the mandatory documents (PAN number, PAN document, License document).");
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      
      // The backend expects exactly these file keys
      payload.append('pan', formData.pan_doc);
      if (formData.gst_doc) payload.append('gst', formData.gst_doc);
      payload.append('media_house_license', formData.license_doc);

      const response = await api.business.updateProfileCompletion(payload); // We will define this wrapper
      
      if (response?.success || response?.status === 1) {
        alert("Documents uploaded successfully! Profile complete.");
        
        // Persist locally so dashboard guard allows access immediately even if backend is out-of-sync
        const id = businessData.branch_id || businessData.id;
        if (id) localStorage.setItem(`profile_completed_${id}`, 'true');
        
        // Force a hard refresh to wipe stale context and reload BranchProvider with updated profile status
        window.location.href = '/media-house';
      } else {
        alert(response?.message || "Failed to complete profile.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-black animate-spin mb-4 dark:text-white" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Analyzing node compliance...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[28px] md:rounded-4xl shadow-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 animate-fade-in relative flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* GLOW EFFECT */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-rose-500 to-transparent opacity-50 shrink-0"></div>

        <div className="text-center mb-6 shrink-0">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100 dark:border-slate-700">
             <ShieldCheck size={24} className="text-slate-900 dark:text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-2">Complete Media House</h1>
          <p className="text-slate-500 font-medium text-xs leading-relaxed max-w-sm mx-auto">Upload statutory documents to authorize your node and securely access the dashboard.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-1 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PAN SECTION */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-1 shrink-0">PAN Details *</label>
                <input 
                  type="text" 
                  name="pan_number"
                  required
                  value={formData.pan_number}
                  onChange={handleInputChange}
                  className="w-full bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 focus:border-black outline-none transition-all mb-3 dark:text-white uppercase shrink-0"
                  placeholder="Enter PAN Number"
                />
                <FileInput 
                   label="Upload PAN PDF/Img" 
                   onChange={(e) => handleFileChange(e, 'pan_doc')}
                   file={formData.pan_doc}
                />
              </div>

              {/* GST SECTION */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-1 shrink-0">GST Details (Optional)</label>
                <input 
                  type="text" 
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={handleInputChange}
                  className="w-full bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 focus:border-black outline-none transition-all mb-3 dark:text-white uppercase shrink-0"
                  placeholder="Enter GST Number"
                />
                <FileInput 
                   label="Upload GST Cert" 
                   onChange={(e) => handleFileChange(e, 'gst_doc')}
                   file={formData.gst_doc}
                />
              </div>
            </div>

            {/* MEDIA LICENSE SECTION */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
               <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-1">Media License *</label>
               <FileInput 
                   label="Upload Media House License/Authorization Document" 
                   onChange={(e) => handleFileChange(e, 'license_doc')}
                   file={formData.license_doc}
               />
            </div>

            <div className="pt-2 shrink-0 pb-2">
               <button
                 type="submit"
                 disabled={loading}
                 className="w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                 {loading ? 'Authorizing Node...' : 'Submit & Complete'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FileInput({ label, onChange, file }) {
  return (
    <div className="relative group cursor-pointer flex-1 flex flex-col">
      <input 
        type="file" 
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        accept=".pdf,image/*"
      />
      <div className={`flex-1 w-full border-2 border-dashed ${file ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-black dark:hover:border-white'} rounded-xl p-3 flex flex-col items-center justify-center transition-all duration-300 gap-1.5 min-h-17.5`}>
        {file ? (
          <>
             <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0"><CheckCircle2 size={12} /></div>
             <p className="text-[9px] font-black uppercase text-emerald-600 truncate max-w-37.5">{file.name}</p>
          </>
        ) : (
          <>
             <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><Upload size={12} className="text-slate-400" /></div>
             <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 text-center px-2">{label}</p>
          </>
        )}
      </div>
    </div>
  );
}
