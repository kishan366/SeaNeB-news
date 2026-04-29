"use client";

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { newsAPI, getFullImageUrl } from '@/lib/apiconfig';
import { ArrowLeft, Clock, User, Building2, MessageSquare } from 'lucide-react';
import dynamic from 'next/dynamic';
import LikeButton from '@/components/ui/LikeButton';
import CommentsSection from '@/components/ui/CommentsSection';

const Ads = dynamic(() => import('@/components/ui/Ads'), {
  ssr: false,
  loading: () => null,
});

export default function ArticleDetailPage({ params }) {
  // Unwrap params promise using use() for Next.js 15+
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetailedArticle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Safely fetch public feed without a specific separate API endpoint 
      const response = await newsAPI.getPublicFeed({ limit: 100 });
      let articleList = [];
      if (Array.isArray(response)) {
        articleList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        articleList = response.data;
      } else if (response?.articles && Array.isArray(response.articles)) {
        articleList = response.articles;
      } else if (response?.data?.articles && Array.isArray(response.data.articles)) {
        articleList = response.data.articles;
      }

      const found = articleList.find(a => String(a.article_id || a._id || a.id) === String(id));
      if (found) {
        setArticle(found);
      } else {
        setError("Article not found or has been removed.");
      }
    } catch (err) {
      console.warn("Failed to fetch article:", err);
      setError("Unable to reach news server. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
       fetchDetailedArticle();
    }
  }, [id, fetchDetailedArticle]);

  if (loading) {
     return (
       <div className="flex-1 min-h-[100dvh] bg-[#fcfcfc] dark:bg-slate-950 flex justify-center pt-24 pb-20 px-4">
         <div className="animate-pulse space-y-6 w-full max-w-4xl">
            <div className="w-16 h-8 bg-gray-200 dark:bg-slate-800 rounded mb-12"></div>
            <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-1/4"></div>
            <div className="w-full aspect-[21/9] bg-gray-200 dark:bg-slate-800 rounded-[2rem]"></div>
            <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-full"></div>
            <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-5/6"></div>
         </div>
       </div>
     );
  }

  if (error || !article) {
     return (
       <div className="flex-1 min-h-[100dvh] bg-[#fcfcfc] dark:bg-slate-950 flex flex-col justify-center items-center text-center px-4">
         <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Content Not Found</h1>
         <p className="text-gray-500 mb-8">{error}</p>
         <button onClick={() => router.push('/Home')} className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors">
            Return Home
         </button>
       </div>
     );
  }

  const authorDetails = article.author?.details;
  const authorName = authorDetails
    ? `${authorDetails.first_name || ""} ${authorDetails.last_name || ""}`.trim()
    : null;
  const sourceName = article.media_house_name || authorName || article.source || "SeaNeB News";
  const mediaArray = Array.isArray(article.media) ? article.media : (article.media ? [article.media] : []);
  let imageUrl = mediaArray[0]?.url || article.cover_image || article.featured_image || article.thumbnail || null;
  if (imageUrl && !imageUrl.startsWith('http')) imageUrl = getFullImageUrl(imageUrl);

  const title = article.title || article.headline || "Untitled Article";
  const content = article.content || article.body || article.summary || "";
  const publishDate = article.published_at || article.created_at || article.createdAt;

  return (
    <div className="flex-1 bg-[#fcfcfc] dark:bg-slate-950 font-sans transition-colors duration-300 min-h-[100dvh] flex flex-col">
       <div className="flex flex-1 overflow-hidden relative">
        {/* Left Ad */}
        <aside className="hidden 2xl:block w-64 border-r border-gray-100 dark:border-slate-900 overflow-y-auto no-scrollbar pt-8">
           <Ads position="left" />
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-[#020617] rounded-tl-3xl shadow-sm">
           <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:py-16">
             <button 
               onClick={() => router.back()} 
               className="flex items-center gap-1 hover:text-blue-600 transition-colors mb-10 group border border-gray-100 dark:border-slate-900 rounded-full px-2 py-1"
             >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
             </button>

             {/* Header */}
             <header className="mb-10 space-y-6">
                {/* <div className="flex items-center gap-3">
                   <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-black uppercase tracking-widest">
                     {article.category || article.category_name || "General"}
                   </span>
                </div> */}
                
                <h1 className="text-2xl md:text-3xl lg:text-3xl text-gray-800 dark:text-white leading-[1] tracking-tight">
                  {title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 md:gap-8 pt-6 border-t border-gray-100 dark:border-slate-800/50">
                   <div className="flex items-center gap-2">
                     <Building2 size={16} className="text-gray-400" />
                     <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{sourceName}</span>
                   </div>
                   {authorName && (
                     <div className="flex items-center gap-2">
                       <User size={16} className="text-gray-400" />
                       <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{authorName}</span>
                     </div>
                   )}
                   {publishDate && (
                     <div className="flex items-center gap-2">
                       <Clock size={16} className="text-gray-400" />
                       <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                         {new Date(publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                       </span>
                     </div>
                   )}
                </div>
             </header>

             {/* Cover Image */}
             {imageUrl ? (
                <div className="w-full aspect-[10/7] md:aspect-[15/7] bg-gray-100 dark:bg-slate-900 rounded-[2rem] overflow-hidden mb-12 shadow-2xl shadow-gray-200/20 dark:shadow-none">
                  <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                </div>
             ) : (
                <div className="w-full aspect-[21/9] bg-linear-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center p-8 rounded-[2rem] mb-12">
                   <span className="text-gray-300 dark:text-white/10 text-6xl font-black">SeaNeB News</span>
                </div>
             )}

             <div className="w-full max-w-full overflow-x-hidden">
               <article 
                 className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-[1.5rem] prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300 break-words [word-break:break-word] whitespace-pre-line sm:whitespace-normal"
                 dangerouslySetInnerHTML={{ __html: content }}
               />
             </div>

             {/* Engagement Area */}
             <div className="mt-12 pt-6 border-t border-gray-100 dark:border-slate-800">
               <div className="flex gap-4">
                 {/* Fixed missing letter 's' based on backend API property names like_count and comment_count */}
                 <LikeButton articleId={article.id || article.article_id || article._id} initialLikes={article.like_count || article.likes_count || article.likes || 0} initialIsLiked={article.is_liked || false} className="!text-lg" />
               </div>
             </div>

             {/* Comments Section */}
             <CommentsSection articleId={article.id || article.article_id || article._id} />
           </div>
        </main>

        {/* Right Ad */}
        <aside className="hidden 2xl:block w-64 border-l border-gray-100 dark:border-slate-900 overflow-y-auto no-scrollbar pt-8">
           <Ads position="right" />
        </aside>
       </div>
    </div>
  );
}
