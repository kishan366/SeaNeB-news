"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
  Trash2,
  Plus,
  ArrowLeft,
  Hash,
  Save,
  AlertCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';
import api, { getFullImageUrl } from '@/lib/apiconfig';

// Dynamically import TipTap to avoid SSR issues
const TipTapEditor = dynamic(() => import('@/components/media-house/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl h-[400px] flex items-center justify-center bg-white dark:bg-slate-900">
      <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
    </div>
  ),
});

const toast = {
  success: (msg) => alert(`SUCCESS: ${msg}`),
  error: (msg) => alert(`ERROR: ${msg}`),
  info: (msg) => alert(`INFO: ${msg}`)
};

export default function EditDraftPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id;
  
  const fileInputRef = useRef(null);

  // Form state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [positions, setPositions] = useState('');
  
  // existingMedia files from backend: { id, preview, url, original_name, isExisting: true }
  // new media files: { file, preview, id, isExisting: false }
  const [mediaFiles, setMediaFiles] = useState([]);
  
  const [errors, setErrors] = useState({});

  // Fetch the draft article details
  useEffect(() => {
    const fetchDraft = async () => {
      if (!articleId) return;
      setIsLoading(true);
      try {
        const response = await api.articles.getDraft(articleId);
        if (response?.success && response.data) {
          const draft = response.data;
          setTitle(draft.title || '');
          setContent(draft.content || '');
          
          if (draft.positions) {
             setPositions(typeof draft.positions === 'string' ? draft.positions : JSON.stringify(draft.positions));
          }

          if (draft.media && Array.isArray(draft.media)) {
             const existingMedia = draft.media.map((m, idx) => ({
               id: m.key || `existing-${idx}`,
               preview: (m.url || getFullImageUrl(m.key)),
               original_name: m.original_name || `image-${idx + 1}.jpg`,
               isExisting: true,
               raw: m // keeping original data if needed
             }));
             setMediaFiles(existingMedia);
          }
        } else {
          toast.error("Failed to load draft");
          router.back();
        }
      } catch (err) {
        console.warn("Fetch draft error:", err.message || err);
        toast.error(err.message || "Could not fetch draft");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDraft();
  }, [articleId, router]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach(m => {
        if (!m.isExisting) URL.revokeObjectURL(m.preview);
      });
    };
  }, [mediaFiles]);

  // Handle file selection
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      original_name: file.name,
      isExisting: false
    }));

    setMediaFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Remove a media file
  const removeFile = useCallback((id) => {
    setMediaFiles(prev => {
      const target = prev.find(m => m.id === id);
      if (target && !target.isExisting) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter(m => m.id !== id);
    });
  }, []);

  // Validate form
  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!content.trim() || content === '<p></p>') errs.content = "Content is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save changes via update endpoint (Assuming PUT `/news/articles/update/{id}`)
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content);

      if (positions.trim()) {
        try {
           JSON.parse(positions.trim());
           formData.append('positions', positions.trim());
        } catch {
           formData.append('positions', positions.trim()); // send as-is if fallback text
        }
      }

      // Add new files
      const newFiles = mediaFiles.filter(m => !m.isExisting);
      if (newFiles.length > 0) {
        newFiles.forEach(m => {
          formData.append('media_files', m.file);
        });
      }

      // Backend replaces all photos if 'files' is sent, or maybe it adds to them?
      // Since it's a PUT request and usually 'files' expects the standard `File` object.

      const response = await api.articles.updateDraft(articleId, formData);

      if (response?.success) {
        toast.success("Article draft updated successfully!");
        setTimeout(() => {
          router.push('/media-house/news/my-posts');
        }, 1000);
      } else {
         toast.error(response?.message || "Failed to update draft");
      }

    } catch (err) {
      toast.error(err.message || "An error occurred while updating the draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Draft...</p>
        </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight uppercase line-clamp-1">
              Edit Draft
            </h1>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              Review and update your drafted article.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-800/50 shadow-sm">
            Draft Mode
          </span>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Title */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <FileText size={12} />
              Article Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: '' })); }}
              placeholder="Enter a compelling headline..."
              className={`w-full bg-slate-50/50 dark:bg-slate-800/50 border rounded-xl px-5 py-3.5 text-lg font-bold outline-none transition-all focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 dark:text-white placeholder-slate-300 ${
                errors.title ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200'
              }`}
            />
            {errors.title && (
              <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 pl-1">
                <AlertCircle size={10} /> {errors.title}
              </p>
            )}
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
            <FileText size={12} />
            Article Content
          </label>
          <TipTapEditor
            content={content}
            onChange={(html) => { setContent(html); setErrors(prev => ({ ...prev, content: '' })); }}
            placeholder="Write your article here... Use the toolbar to format your content."
          />
          {errors.content && (
            <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 pl-1">
              <AlertCircle size={10} /> {errors.content}
            </p>
          )}
        </div>

        {/* Positions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
            <Hash size={12} />
            Positions
          </label>
          <input
            type="text"
            value={positions}
            onChange={(e) => setPositions(e.target.value)}
            placeholder="e.g. [2,1] — comma-separated position IDs"
            className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 dark:text-white placeholder-slate-300 hover:border-slate-200"
          />
        </div>

        {/* Media Upload */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <ImageIcon size={12} />
              Media Files
            </label>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} attached
            </span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={20} className="text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Click to add more files
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Preview Grid */}
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mediaFiles.map((media) => (
                <div key={media.id} className="relative group rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 aspect-square bg-slate-50 dark:bg-slate-800">
                  <img
                    src={media.preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => removeFile(media.id)}
                      className="p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all active:scale-95"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className={`text-[8px] font-bold text-white truncate flex items-center gap-1`}>
                      {media.isExisting ? <span className="bg-blue-500 px-1 py-0.5 rounded text-[6px] uppercase tracking-widest">Existing</span> : null}
                      {media.original_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
           <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto py-3.5 px-6 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black py-3.5 px-8 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 dark:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isSubmitting ? 'Saving...' : 'Update Draft'}
          </button>
        </div>
      </form>
    </div>
  );
}
