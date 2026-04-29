import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, X, Trash2, Eye, EyeOff, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { getFullImageUrl } from '@/lib/apiconfig';

export default function GallerySection({ businessData, setBusinessData }) {
  // Gallery Management States
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(null);
  const fileInputRef = useRef(null);

  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const galleries = businessData?.BusinessGalleries || [];

  // Combine galleries with local previews for the slider
  const allSlides = [
    ...galleries,
    ...previews.map((src, idx) => ({
      id: `preview-${idx}`,
      media_url: src,
      isLocalPreview: true,
      fileIndex: idx
    }))
  ];

  // Auto-slide logic
  useEffect(() => {
    if (allSlides.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allSlides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [allSlides.length, isHovered]);

  const nextSlide = useCallback((e) => {
    if(e) e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % allSlides.length);
  }, [allSlides.length]);

  const prevSlide = useCallback((e) => {
    if(e) e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + allSlides.length) % allSlides.length);
  }, [allSlides.length]);

  // GALLERY ACTIONS
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert("Maximum 5 images allowed.");
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      selectedFiles.forEach(file => {
        // Switch to 'media' if 'media[]' was throwing unexpected field
        formData.append('media', file);
      });

      const response = await api.gallery.upload(businessData.id || businessData.branch_id, formData);
      if (response?.success) {
        setSelectedFiles([]);
        setPreviews([]);
        // Re-trigger the effect by updating a 
        const branchId = businessData.id || businessData.branch_id;
        if (branchId) {
          const galleryResponse = await api.gallery.getGallery(branchId);
          if (galleryResponse?.success) {
            setBusinessData(prev => ({
              ...prev,
              BusinessGalleries: galleryResponse.data || []
            }));
          }
        }
      } else {
        alert(response?.message || "Upload failed.");
      }
    } catch (err) {
      alert(err.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleStatus = async (galleryId, currentStatus) => {
    if (!galleryId) {
      console.error("Critical Profile Error: galleryId is missing for toggle action.");
      return;
    }
    try {
      setToggleLoading(galleryId);
      console.log(`[Gallery] Toggling status for ID: ${galleryId}`);
      const response = await api.gallery.updateStatus(galleryId, !currentStatus);
      if (response?.success || response?.status === 1 || response?.message?.includes("success")) {
        setBusinessData(prev => ({
          ...prev,
          BusinessGalleries: prev.BusinessGalleries.map(item =>
            (item.gallery_id === galleryId || item.id === galleryId) ? { ...item, is_active: !currentStatus } : item
          )
        }));
      } else {
        console.warn("Toggle response mismatch:", response);
        alert(response?.message || "Failed to update visibility.");
      }
    } catch (err) {
      console.error("Toggle Error:", err);
      alert("Failed to update status.");
    } finally {
      setToggleLoading(null);
    }
  };

  const handleDelete = async () => {
    const galleryId = deleteConfirm;
    if (!galleryId) {
      console.error("Decline: No galleryId provided for deletion.");
      setDeleteConfirm(null);
      return;
    }

    try {
      setToggleLoading(galleryId);
      console.log(`[Gallery] Initiating deletion for ID: ${galleryId}`);
      const response = await api.gallery.delete(galleryId);

      if (response?.success || response?.status === 1 || response === null || response?.message?.includes("success")) {
        setBusinessData(prev => ({
          ...prev,
          BusinessGalleries: prev.BusinessGalleries.filter(item => item.gallery_id !== galleryId && item.id !== galleryId)
        }));
        console.log(`[Gallery] Deletion completed for ID: ${galleryId}`);
        setDeleteConfirm(null);
      } else {
        console.warn("Delete response mismatch:", response);
        alert(response?.message || "Failed to finalize deletion.");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      alert(err.message || "Failed to delete image.");
    } finally {
      setToggleLoading(null);
    }
  };

  return (
    <>
      <div
        className="relative h-50 sm:h-60 md:h-70 lg:h-80 bg-slate-100 group overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {allSlides.length > 0 ? (
          <div className="w-full h-full relative overflow-hidden">
            {allSlides.map((item, idx) => (
              <div
                key={`slide-${item.id || idx}`}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <img
                  src={item.isLocalPreview ? item.media_url : getFullImageUrl(item.media_url)}
                  alt={`Asset ${idx}`}
                  className={`w-full h-full object-cover`}
                />
              </div>
            ))}

            {/* LEFT / RIGHT NAVIGATION */}
            {allSlides.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-2 md:px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <button onClick={prevSlide} className="w-8 h-8 md:w-10 md:h-10 bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={nextSlide} className="w-8 h-8 md:w-10 md:h-10 bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* TOP RIGHT ACTIONS (Current Slide Only) */}
            {allSlides.length > 0 && allSlides[currentSlide] && (
              <div className="absolute top-4 right-4 md:top-8 md:right-8 z-30 flex gap-2 md:gap-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                {allSlides[currentSlide].isLocalPreview ? (
                  <button
                    onClick={() => removeSelectedFile(allSlides[currentSlide].fileIndex)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-black backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10 transition-all shadow-xl"
                    title="Remove Preview"
                  >
                    <X size={16} className="md:w-5 md:h-5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggleStatus(allSlides[currentSlide]?.gallery_id || allSlides[currentSlide]?.id, allSlides[currentSlide]?.is_active)}
                      className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-black backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10 transition-all shadow-xl"
                      title="Toggle Visibility"
                    >
                      {allSlides[currentSlide]?.is_active ? <Eye size={16} className="md:w-5 md:h-5" /> : <EyeOff size={16} className="md:w-5 md:h-5" />}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(allSlides[currentSlide]?.gallery_id || allSlides[currentSlide]?.id)}
                      className="w-10 h-10 md:w-12 md:h-12 bg-rose-500/20 hover:bg-rose-600 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-rose-500/30 transition-all shadow-xl"
                      title="Delete Asset"
                    >
                      <Trash2 size={16} className="md:w-5 md:h-5" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* BOTTOM RIGHT ACTIONS & PAGINATION */}
            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-30 flex flex-col items-end gap-3 md:gap-8 opacity-100 transition-all duration-300">
              {/* PAGINATION DOTS */}
              {allSlides.length > 1 && (
                <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
                  {allSlides.map((_, idx) => (
                    <button
                      key={`dot-nav-${idx}`}
                      onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              )}

              {/* UPLOAD TRIGGER AND UPLOAD BUTTON */}
              <div className="flex gap-2">
                 {previews.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                      disabled={uploading}
                      className="h-10 md:h-12 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-all border border-emerald-400 font-bold text-[10px] tracking-widest uppercase disabled:opacity-50"
                    >
                       {uploading ? <Loader2 size={16} className="animate-spin mr-2"/> : null} 
                       {uploading ? 'Uploading...' : 'Save Uploads'}
                    </button>
                 )}
                 <button
                   onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                   className="w-10 h-10 md:w-12 md:h-12 bg-white text-black hover:bg-black hover:text-white rounded-xl flex items-center justify-center shadow-lg transition-all border border-slate-200/50 hover:scale-105 active:scale-95"
                 >
                   <Plus size={18} />
                 </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
              <Upload size={40} className="text-white/30" />
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs font-black uppercase tracking-[0.4em] mb-2">Initialize Visual Identity</p>
              <p className="text-white/20 text-[9px] font-medium uppercase tracking-[0.2em]">Click to upload gallery assets</p>
            </div>
          </div>
        )}
      </div>

      {/* HIDDEN FILE INPUT */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-6">
              <Trash2 size={24} />
            </div>
            <h4 className="text-xl font-bold text-black mb-2">Delete Media Asset?</h4>
            <p className="text-[#999999] text-sm leading-relaxed mb-8">This action is permanent. The image will be removed from your public business profile and the gallery slider.</p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg"
              >
                Delete File
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 border border-slate-200 text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
