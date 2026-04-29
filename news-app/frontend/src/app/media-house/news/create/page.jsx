"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
  Trash2,
  Plus,
  ArrowLeft,
  Hash,
  Send,
  AlertCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';
import api from '@/lib/apiconfig';

// Dynamically import TipTap to avoid SSR issues
const TipTapEditor = dynamic(() => import('@/components/media-house/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl h-100 flex items-center justify-center bg-white dark:bg-slate-900">
      <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
    </div>
  ),
});

const toast = {
  success: (msg) => alert(`SUCCESS: ${msg}`),
  error: (msg) => alert(`ERROR: ${msg}`),
  info: (msg) => alert(`INFO: ${msg}`)
};

export default function CreateNewsPostPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [positions, setPositions] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]); // { file, preview, id }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach(m => URL.revokeObjectURL(m.preview));
    };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    setMediaFiles(prev => [...prev, ...newFiles]);
    // Clear to allow re-selecting same file
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Remove a media file
  const removeFile = useCallback((id) => {
    setMediaFiles(prev => {
      const target = prev.find(m => m.id === id);
      if (target) URL.revokeObjectURL(target.preview);
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

  // Submit article
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content);

      // Parse positions as array
      if (positions.trim()) {
        formData.append('positions', positions.trim());
      }

      // Attach media files
      mediaFiles.forEach(m => {
        formData.append('media_files', m.file);
      });

      const response = await api.articles.create(formData);

      if (response?.success) {
        toast.success("Article published successfully!");
        setTimeout(() => {
          router.push('/media-house/news/my-posts');
        }, 1000);
      } else {
        toast.error(response?.message || "Failed to create article");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred while publishing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight uppercase">
              Create Article
            </h1>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              Compose and publish a new news article.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <p className="text-[9px] text-slate-400 pl-1">
            Enter category positions as a JSON array, e.g. [2,1]
          </p>
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

          {/* Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={20} className="text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Click to upload files
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">
                JPG, PNG, GIF, WEBP — max 10MB per file
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
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => removeFile(media.id)}
                      className="p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all active:scale-95"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* File name */}
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2">
                    <p className="text-[8px] font-bold text-white truncate">
                      {media.file.name}
                    </p>
                  </div>
                </div>
              ))}

              {/* Add More Button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
              >
                <Plus size={20} className="text-slate-300" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Add More</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 md:flex-none bg-black dark:bg-white text-white dark:text-black py-3.5 px-8 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 dark:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {isSubmitting ? 'Publishing...' : 'Publish Article'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="py-3.5 px-6 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
