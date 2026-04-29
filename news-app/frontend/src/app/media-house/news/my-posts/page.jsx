"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Loader2,
  Calendar,
  Clock,
  Image as ImageIcon,
  RefreshCw,
  X,
  Pencil,
  Send,
  Filter,
  ChevronDown,
  Check,
  Ban,
  Trash2,
  Undo2,
  Heart,
  MessageCircle
} from 'lucide-react';
import api, { getFullImageUrl } from '@/lib/apiconfig';
import { useBranch } from '@/context/BranchContext';
import { useRBAC } from '@/context/RBACContext';

const getStatusText = (status) => {
  if (status === 0 || status === '0') return 'Draft';
  if (status === 1 || status === '1') return 'Pending';
  if (status === 2 || status === '2') return 'Published';
  if (status === 3 || status === '3') return 'Rejected';
  return typeof status === 'string' ? status : 'Published';
};

export default function MyPostsPage() {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('my'); // 'my' | 'all'
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const { businesses, loading: branchLoading } = useBranch();
  const { role, isOwner, isEditor, isJournalist, permissions, loading: roleLoading } = useRBAC();

  // Set initial viewMode based on RBAC role
  useEffect(() => {
    if (!roleLoading) {
      if (isEditor) {
        setViewMode('pending');
      } else if (isJournalist) {
        setViewMode('my');
      }
    }
  }, [roleLoading, isEditor, isJournalist]);

  const fetchArticles = useCallback(async () => {
    if (roleLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      let modeToFetch = viewMode;
      // If Journalist isn't looking at 'published', lock to 'my'
      if (isJournalist && modeToFetch !== 'published') modeToFetch = 'my';

      let response;
      if (modeToFetch === 'all' || modeToFetch === 'published') response = await api.articles.mediaHouseArticles();
      else if (modeToFetch === 'pending') response = await api.articles.pendingReview();
      else response = await api.articles.myArticles();

      console.log(`${modeToFetch} Articles API response:`, response);
      if (response?.success) {
        // Handle different response shapes
        const data = response.data;
        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data?.articles && Array.isArray(data.articles)) {
          list = data.articles;
        } else if (data && typeof data === 'object') {
          // Try to find any array in the response data
          const arrayKey = Object.keys(data).find(k => Array.isArray(data[k]));
          list = arrayKey ? data[arrayKey] : [];
        }
        setArticles(list);
      } else {
        setArticles([]);
      }
    } catch (err) {
      console.warn("Failed to fetch articles:", err.message);
      setError(err.message || "Failed to load articles");
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [viewMode, roleLoading, isJournalist]);

  const handleSendForReview = async (articleId) => {
    if (!window.confirm("Are you sure you want to completely finish your draft and send this article for review?")) return;
    
    try {
      const response = await api.articles.sendForReview(articleId);
      if (response?.success) {
        alert("Success: Article has been successfully sent for review!");
        setSelectedArticle(null);
        fetchArticles(); // refresh the listing view
      } else {
        alert("Error: " + (response?.message || "Failed to send article for review."));
      }
    } catch (error) {
      alert("Error: " + (error.message || "An error occurred while sending for review."));
    }
  };

  const handlePublish = async (articleId) => {
    if (!window.confirm("Are you sure you want to publish this article?")) return;
    try {
      const response = await api.articles.publish(articleId);
      if (response?.success) {
        alert("Success: Article has been successfully published!");
        setSelectedArticle(null);
        fetchArticles();
      } else {
        alert("Error: " + (response?.message || "Failed to publish article."));
      }
    } catch (error) {
       alert("Error: " + (error.message || "An error occurred while publishing."));
    }
  };

  const handleReject = async (articleId) => {
    if (!window.confirm("Are you sure you want to reject this article?")) return;
    try {
      const response = await api.articles.reject(articleId);
      if (response?.success) {
        alert("Success: Article has been rejected.");
        setSelectedArticle(null);
        fetchArticles();
      } else {
        alert("Error: " + (response?.message || "Failed to reject article."));
      }
    } catch (error) {
       alert("Error: " + (error.message || "An error occurred while rejecting."));
    }
  };

  const handleReturnToDraft = async (articleId) => {
    if (!window.confirm("Are you sure you want to return this article to draft status?")) return;
    try {
      const response = await api.articles.returnToDraft(articleId);
      if (response?.success) {
        alert("Success: Article returned to draft.");
        setSelectedArticle(null);
        fetchArticles();
      } else {
        alert("Error: " + (response?.message || "Failed to return to draft."));
      }
    } catch (error) {
       alert("Error: " + (error.message || "An error occurred."));
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm("Are you absolutely sure you want to completely delete this article? This action cannot be undone.")) return;
    try {
      const response = await api.articles.deleteArticle(articleId);
      if (response?.success) {
        alert("Success: Article has been permanently deleted.");
        setSelectedArticle(null);
        fetchArticles();
      } else {
        alert("Error: " + (response?.message || "Failed to delete article."));
      }
    } catch (error) {
       alert("Error: " + (error.message || "An error occurred during deletion."));
    }
  };

  useEffect(() => {
    if (!roleLoading) {
      fetchArticles();
    }
  }, [fetchArticles, roleLoading]);

  // Fetch comments when an article is selected AND user is owner
  useEffect(() => {
    if (selectedArticle && isOwner) {
      const fetchComments = async () => {
        setLoadingComments(true);
        try {
          const response = await api.articles.getComments(selectedArticle.article_id || selectedArticle.id);
          if (response?.success) {
            const data = response.data;
            let list = [];
            if (Array.isArray(data)) list = data;
            else if (data?.comments && Array.isArray(data.comments)) list = data.comments;
            setComments(list);
          } else {
            setComments([]);
          }
        } catch (err) {
          console.error('Failed to load comments:', err);
          setComments([]);
        } finally {
          setLoadingComments(false);
        }
      };
      fetchComments();
    } else {
      setComments([]);
    }
  }, [selectedArticle, isOwner]);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = (article.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const articleStatus = getStatusText(article.status ?? article.article_status);

    if (isEditor) {
      if (viewMode === 'pending' && articleStatus !== 'Pending') return false;
    }
    
    // Both Editor and Journalist can use the 'published' tab to strictly view Published global articles
    if ((isEditor || isJournalist) && viewMode === 'published' && articleStatus !== 'Published') {
      return false;
    }

    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && articleStatus === statusFilter;
  });

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Get first image from article media
  const getArticleImage = (article) => {
    if (article.media && article.media.length > 0) {
      return article.media[0]?.url || getFullImageUrl(article.media[0]?.key);
    }
    if (article.media_files && article.media_files.length > 0) {
      return getFullImageUrl(article.media_files[0]?.file_path || article.media_files[0]);
    }
    if (article.thumbnail) return getFullImageUrl(article.thumbnail);
    if (article.cover_image) return getFullImageUrl(article.cover_image);
    return null;
  };



  // Get status badge color
  const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'published' || s === 'active') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (s === 'draft') return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400';
    if (s === 'pending' || s === 'review') return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
    if (s === 'rejected') return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400';
    return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400';
  };

  // Strip HTML for content preview
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').substring(0, 120);
  };

  if (!branchLoading && (!businesses || businesses.length === 0)) {
    if (!roleLoading && (isEditor || isJournalist)) {
      // Staff bypass: Staff typically don't 'own' businesses in context, so allow them through.
    } else {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[60vh]">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
            <FileText size={32} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">
            Start your Media House with SeaNeB
          </h2>
          <p className="text-slate-400 text-sm font-medium max-w-md mx-auto mb-8 leading-relaxed">
            You currently don't have an active media house or business associated with your account. Create your first business to start publishing and managing news articles.
          </p>
          <button
            onClick={() => router.push('/auth/business-register')}
            className="flex items-center gap-2 px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-[0.98]"
          >
            <Plus size={16} />
            Create Business
          </button>
        </div>
      );
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight uppercase mb-1">
            {isEditor 
              ? (viewMode === 'published' ? 'Published Articles' : 'Pending Articles') 
              : isJournalist 
                ? (viewMode === 'published' ? 'Published Articles' : 'My Posts')
                : (viewMode === 'all' ? 'All Articles' : 'My Posts')}
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Manage and track {isEditor || (isJournalist && viewMode === 'published')
              ? (viewMode === 'published' ? 'published articles' : 'pending articles for review') 
              : (viewMode === 'all' && !isJournalist ? 'all published articles in the media house' : 'your published articles')}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle View Mode for Owner */}
          {isOwner && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl hidden sm:flex">
              <button
                onClick={() => setViewMode('my')}
                className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'my' ? 'bg-white dark:bg-slate-900 shadow-sm text-black dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                My Posts
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'all' ? 'bg-white dark:bg-slate-900 shadow-sm text-black dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                All Articles
              </button>
            </div>
          )}
          {/* Toggle View Mode for Editor */}
          {isEditor && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl hidden sm:flex">
              <button
                onClick={() => setViewMode('pending')}
                className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'pending' ? 'bg-white dark:bg-slate-900 shadow-sm text-black dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setViewMode('published')}
                className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'published' ? 'bg-white dark:bg-slate-900 shadow-sm text-black dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                Published
              </button>
            </div>
          )}
          {/* Toggle View Mode for Journalist */}
          {isJournalist && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl hidden sm:flex">
              <button
                onClick={() => setViewMode('my')}
                className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'my' ? 'bg-white dark:bg-slate-900 shadow-sm text-black dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                My Posts
              </button>
              <button
                onClick={() => setViewMode('published')}
                className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'published' ? 'bg-white dark:bg-slate-900 shadow-sm text-black dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                Published
              </button>
            </div>
          )}

          <button
            onClick={fetchArticles}
            disabled={isLoading || roleLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {(isOwner || isJournalist) && (
            <button
              onClick={() => router.push('/media-house/news/create')}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-[0.98]"
            >
              <Plus size={14} />
              New Article
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            placeholder="Search articles by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 ring-black/5 dark:ring-white/5 outline-none transition-all dark:text-white"
          />
        </div>
        
        {/* Status Dropdown Filter */}
        {!isEditor && (
        <div className="relative min-w-[170px]">
          <button 
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            onBlur={() => setTimeout(() => setIsFilterOpen(false), 200)}
            className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              <Filter size={14} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                {statusFilter === 'All' ? 'All Statuses' : statusFilter}
              </span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isFilterOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-20 flex flex-col py-1.5 animate-fade-in origin-top">
              {['All', 'Draft', 'Pending', 'Published', 'Rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setIsFilterOpen(false);
                  }}
                  className={`px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${statusFilter === status ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {status === 'All' ? 'All Statuses' : status}
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-4" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading articles...</p>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm py-20 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4">
            <FileText size={24} className="text-rose-400" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
            {error?.includes("associated") ? "Access Denied" : "Error Loading"}
          </h3>
          <p className="text-xs text-slate-400 mt-2 mb-6 max-w-sm leading-relaxed">
            {error?.includes("associated") 
              ? "Your account is not linked to any active Media House. You must either create a Media House or be added as a staff member by an administrator to view this page."
              : error}
          </p>
          {error?.includes("associated") ? (
            <button
              onClick={() => router.push('/auth/business-register')}
              className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-[1.02] transition-transform"
            >
              Create Media House
            </button>
          ) : (
            <button
              onClick={fetchArticles}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-bold uppercase tracking-wider"
            >
              Try Again
            </button>
          )}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm py-20 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <FileText size={24} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
            {searchQuery ? 'No results found' : 'No articles yet'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            {searchQuery ? 'Try adjusting your search query.' : 'Create your first article to get started.'}
          </p>
          {!searchQuery && (permissions.canCreate) && (
            <button
              onClick={() => router.push('/media-house/news/create')}
              className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg"
            >
              <Plus size={14} />
              Create Article
            </button>
          )}
        </div>
      ) : (
        /* Articles Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((article, index) => {
            const image = getArticleImage(article);
            const statusText = getStatusText(article.status ?? article.article_status);
            const mediaLength = article.media?.length || article.media_files?.length || 0;

            return (
              <article
                key={article.article_id || article.id || index}
                onClick={() => setSelectedArticle(article)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {image ? (
                    <img
                      src={image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={32} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusStyle(statusText)}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      {statusText}
                    </span>
                  </div>

                  {/* Media count */}
                  {mediaLength > 1 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1">
                      <ImageIcon size={10} />
                      {mediaLength}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-snug line-clamp-2 group-hover:text-black dark:group-hover:text-white">
                    {article.title || 'Untitled'}
                  </h2>

                  {article.content && (
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {stripHtml(article.content)}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={11} />
                        <span className="text-[9px] font-bold">{formatDate(article.created_at || article.published_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={11} />
                        <span className="text-[9px] font-bold">{formatTime(article.created_at || article.published_at)}</span>
                      </div>
                    </div>
                    {/* Engagement Counts */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full">
                        <Heart size={10} className="fill-current" />
                        <span className="text-[9px] font-bold">{article.like_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                        <MessageCircle size={10} className="fill-current" />
                        <span className="text-[9px] font-bold">{article.comment_count || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Positions */}
                  {article.positions && (
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(article.positions) ? article.positions : [article.positions]).map((pos, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-[8px] font-bold uppercase tracking-wider">
                          Pos {pos}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Article count footer */}
      {!isLoading && filteredArticles.length > 0 && (
        <div className="text-center py-4">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {filteredArticles.length} of {articles.length} article{articles.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Full View Article Modal */}
      {selectedArticle && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-full md:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1 pr-4">
                  {selectedArticle.title || 'Untitled Article'}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusStyle(getStatusText(selectedArticle.status ?? selectedArticle.article_status))}`}>
                    {getStatusText(selectedArticle.status ?? selectedArticle.article_status)}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar size={10} />
                    <span className="text-[9px] font-bold">{formatDate(selectedArticle.created_at || selectedArticle.published_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock size={10} />
                    <span className="text-[9px] font-bold">{formatTime(selectedArticle.created_at || selectedArticle.published_at)}</span>
                  </div>
                  
                  {/* Engagement Counts */}
                  <div className="flex items-center gap-2 ml-2">
                    <div className="flex items-center gap-1 text-rose-500">
                      <Heart size={10} className="fill-current" />
                      <span className="text-[9px] font-bold">{selectedArticle.like_count || 0} Likes</span>
                    </div>
                    <button 
                      onClick={() => isOwner && setShowCommentsModal(true)}
                      className={`flex items-center gap-1 text-blue-500 ${isOwner ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1 py-0.5 rounded transition-all cursor-pointer' : ''}`}
                    >
                      <MessageCircle size={10} className="fill-current" />
                      <span className="text-[9px] font-bold">{selectedArticle.comment_count || 0} Comments</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start">
                {/* Draft Actions */}
                {getStatusText(selectedArticle.status ?? selectedArticle.article_status) === 'Draft' && (
                  <>
                    <button
                      onClick={() => handleSendForReview(selectedArticle.article_id || selectedArticle.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Send size={12} /> Send for Review
                    </button>
                  </>
                )}

                {/* Edit Action */}
                {(permissions.canEditDraft && getStatusText(selectedArticle.status ?? selectedArticle.article_status) === 'Draft' || 
                  (permissions.canEditPending && getStatusText(selectedArticle.status ?? selectedArticle.article_status) === 'Pending')) && (
                  <button
                    onClick={() => router.push(`/media-house/news/edit/${selectedArticle.article_id || selectedArticle.id}`)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                )}

                {/* pending/review Actions */}
                {permissions.canPublishReject && getStatusText(selectedArticle.status ?? selectedArticle.article_status) === 'Pending' && (
                  <>
                    <button
                      onClick={() => handlePublish(selectedArticle.article_id || selectedArticle.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-600/20"
                    >
                      <Check size={12} /> Publish
                    </button>
                    <button
                      onClick={() => handleReject(selectedArticle.article_id || selectedArticle.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Ban size={12} /> Reject
                    </button>
                  </>
                )}

                {/* Return to Draft Action - strictly constrained to Pending items */}
                {permissions.canReturnToDraft && getStatusText(selectedArticle.status ?? selectedArticle.article_status) === 'Pending' && (
                  <button
                    onClick={() => handleReturnToDraft(selectedArticle.article_id || selectedArticle.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Undo2 size={12} /> Make Draft
                  </button>
                )}

                {/* Completely Delete Action */}
                {permissions.canDelete && (
                  <button
                    onClick={() => handleDelete(selectedArticle.article_id || selectedArticle.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}

                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
              
              {/* Media Gallery (Sorted by Position) */}
              {(selectedArticle.media?.length > 0 || selectedArticle.media_files?.length > 0) && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <ImageIcon size={12} />
                    Gallery
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...(selectedArticle.media || selectedArticle.media_files || [])]
                      .sort((a, b) => {
                        const posA = typeof a === 'object' ? parseInt(a.position || 0) : 0;
                        const posB = typeof b === 'object' ? parseInt(b.position || 0) : 0;
                        return posA - posB;
                      })
                      .map((mediaItem, idx) => {
                        const isObject = typeof mediaItem === 'object';
                        const url = isObject ? (mediaItem.url || getFullImageUrl(mediaItem.key || mediaItem.file_path)) : getFullImageUrl(mediaItem);
                        const pos = isObject && mediaItem.position !== undefined ? mediaItem.position : 'N/A';
                        return (
                          <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 group aspect-video">
                            {url ? (
                              <img src={url} alt={`Article media ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                <ImageIcon size={32} className="mb-2" />
                                <span className="text-[9px] font-bold uppercase">Image Error</span>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1">
                                <FileText size={10} />
                                Pos: {pos}
                            </div>
                          </div>
                        );
                    })}
                  </div>
                </div>
              )}

              {/* Rich Text Content */}
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <FileText size={12} />
                    Article Content
                  </h3>
                  <div 
                    className="prose prose-sm sm:prose-base max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content || '<p class="text-slate-400 italic">No content available.</p>' }}
                  />
              </div>

              {/* Position Category Tags */}
              {selectedArticle.positions && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-800 pb-2 inline-block">
                    Positions / Categories
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(Array.isArray(selectedArticle.positions) ? selectedArticle.positions : [selectedArticle.positions]).map((pos, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        POSITION {pos}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Embedded Comments Modal */}
      {showCommentsModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCommentsModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[80vh] rounded-2xl shadow-2xl flex flex-col relative border border-slate-200 dark:border-slate-800 z-10 animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <MessageCircle size={16} /> Comments
              </h3>
              <button
                onClick={() => setShowCommentsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {loadingComments ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                        {comment.user?.avatar || comment.user?.details?.avatar ? (
                          <img src={getFullImageUrl(comment.user?.avatar || comment.user?.details?.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-slate-500 uppercase">
                            {(comment.user?.first_name || comment.user?.details?.first_name || 'U')[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {comment.user?.first_name || comment.user?.details?.first_name || 'User'} {comment.user?.last_name || comment.user?.details?.last_name || ''}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                          {comment.content || comment.comment || comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <MessageCircle size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="text-sm text-slate-500 font-medium">No comments yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}

// Portal wrapper — mounts modal at document.body to escape layout overflow-hidden
function ModalPortal({ children }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
