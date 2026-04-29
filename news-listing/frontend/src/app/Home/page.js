"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { newsAPI, getFullImageUrl } from "@/lib/apiconfig";
import { Newspaper, MessageSquare } from "lucide-react";
import LikeButton from "@/components/ui/LikeButton";

//  Lazy-load Ads component
const Ads = dynamic(() => import("@/components/ui/Ads"), {
  ssr: false,
  loading: () => null,
});

const CATEGORIES = ["All", "Business", "Technology", "Sports", "Entertainment", "Health", "Science"];



// Format relative time from a date string
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

//  Small sub-component for the date
function DateDisplay() {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    );
  }, []);

  if (!dateStr) return <span className="inline-block w-32 h-4 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />;

  return <>{dateStr}</>;
}

// Skeleton loaders for news
function NewsSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4 md:gap-6 p-4 rounded-2xl animate-pulse">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-slate-800" />
              <div className="w-20 h-3 bg-gray-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="w-full h-5 bg-gray-200 dark:bg-slate-800 rounded" />
            <div className="w-3/4 h-5 bg-gray-200 dark:bg-slate-800 rounded" />
            <div className="w-16 h-3 bg-gray-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 30 };
      if (selectedCategory !== "All") {
        params.category = selectedCategory;
      }
      const response = await newsAPI.getPublicFeed(params);

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

      setArticles(articleList);
    } catch (err) {
      console.warn("Failed to fetch public feed:", err);
      setError(err.message || "Unable to reach news server. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const mapArticle = (article) => {
    const authorDetails = article.author?.details;
    const authorName = authorDetails
      ? `${authorDetails.first_name || ""} ${authorDetails.last_name || ""}`.trim()
      : null;
    const sourceName = article.media_house_name || authorName || article.source || "SeaNeB News";

    const mediaArray = Array.isArray(article.media) ? article.media : (article.media ? [article.media] : []);
    const imageUrl = mediaArray[0]?.url
      || article.cover_image
      || article.featured_image
      || article.thumbnail
      || null;

    return {
      id: article.article_id || article._id || article.id,
      title: article.title || article.headline || "Untitled Article",
      source: sourceName,
      time: timeAgo(article.published_at || article.created_at || article.createdAt),
      category: article.category || article.category_name || "General",
      image: imageUrl ? (imageUrl.startsWith("http") ? imageUrl : getFullImageUrl(imageUrl)) : null,
      content: article.content || article.body || article.summary || "",
      slug: article.slug || "",
      likesCount: article.like_count || article.likes_count || article.likes || 0,
      isLiked: article.is_liked || false,
      commentsCount: article.comment_count || article.comments_count || article.comments?.length || 0,
    };
  };

  const displayArticles = articles.map(mapArticle);
  const featuredArticle = displayArticles.length > 0 ? displayArticles[0] : null;
  const topStoriesMini = displayArticles.slice(1, 4); // 3 small beside
  const feedArticles = displayArticles.slice(4);

  return (
    <div className="flex-1 bg-[#fcfcfc] dark:bg-slate-950 flex flex-col overflow-hidden font-sans transition-colors duration-300">

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT AD (Desktop) */}
        <aside className="hidden 2xl:block w-64 border-r border-gray-100 dark:border-slate-900 overflow-y-auto no-scrollbar">
          <Ads position="left" />
        </aside>

        {/* FEED */}
        <main className="flex-1 overflow-y-auto no-scrollbar transition-colors">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">

            {/* CATEGORY BAR - Simple & Normal */}
            <nav className="flex items-center justify-start md:justify-center gap-6 md:gap-14 text-sm font-medium text-gray-400 dark:text-gray-500 overflow-x-auto whitespace-nowrap mb-12 border-b border-gray-100 dark:border-slate-800 pb-4 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`${selectedCategory === cat
                    ? "text-black dark:text-white font-bold border-b-2 border-black dark:border-white"
                    : "text-black dark:text-white opacity-40"
                    } pb-1 px-1 shrink-0`}
                >
                  {cat}
                </button>
              ))}
            </nav>
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tight">
                  Briefing
                </h1>
                <p className="text-sm font-medium text-black dark:text-white opacity-40 uppercase tracking-widest mt-1">
                  <DateDisplay />
                </p>
              </div>
              {/* <div className="hidden md:flex items-center gap-2 px-4 py-2 border border-black dark:border-white rounded-full">
                 <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                 <span className="text-xs font-bold text-black dark:text-white">Live Updates</span>
              </div> */}
            </div>

            {loading ? (
              <NewsSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
                <p className="text-gray-500 mb-6 text-center px-4">{error}</p>
                <button
                  onClick={fetchArticles}
                  className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold"
                >
                  Reconnect
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-20 text-black dark:text-white opacity-40 font-medium">
                No news found in this category.
              </div>
            ) : (
              <div className="flex flex-col">
                
                {/* Top Stories Section (Featured + 3 Mini) */}
                <div className="flex flex-col lg:flex-row gap-8 mb-12 pb-12 border-b border-gray-100 dark:border-slate-800">
                  
                  {/* Big Featured Card */}
                  {featuredArticle && (
                    <div className="flex-3 flex flex-col relative group">
                      <Link href={`/Home/${featuredArticle.id}`} className="block h-full cursor-pointer group">
                        <div className="w-full aspect-16/10 md:aspect-2/1 rounded-3xl overflow-hidden bg-gray-100 dark:bg-slate-900 mb-6 relative">
                          {featuredArticle.image ? (
                            <img
                              src={featuredArticle.image}
                              alt={featuredArticle.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white dark:bg-black flex items-center justify-center">
                               <span className="text-black dark:text-white opacity-10 font-black text-4xl uppercase tracking-widest">News</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[11px] font-bold text-black dark:text-white opacity-40 tracking-widest uppercase">{featuredArticle.source} · {featuredArticle.time}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold leading-tight text-black dark:text-white">
                          {featuredArticle.title}
                        </h2>
                        <p className="mt-4 text-black dark:text-white opacity-60 line-clamp-3 text-lg leading-relaxed">
                          {featuredArticle.content.replace(/<[^>]*>?/gm, '')}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-black/5 dark:border-white/5 relative z-10">
                           <LikeButton articleId={featuredArticle.id} initialLikes={featuredArticle.likesCount} initialIsLiked={featuredArticle.isLiked} />
                           <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                             <MessageSquare size={16} />
                             <span className="text-xs md:text-sm font-semibold">{featuredArticle.commentsCount || "Comment"}</span>
                           </div>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Right Side: 3 Mini Headlines */}
                  <div className="flex-2 flex flex-col gap-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-black dark:text-white mb-2">More Top Stories</h3>
                    {topStoriesMini.map((item) => (
                      <Link href={`/Home/${item.id}`} key={item.id} className="block">
                        <div className="flex justify-between gap-4 py-3 border-b border-black/10 dark:border-white/10 last:border-0 -mx-3 px-3 rounded-2xl">
                          <div className="flex-1 flex flex-col justify-center min-w-0">
                             <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-xs font-semibold text-black dark:text-white opacity-40 truncate">{item.source} · {item.time}</span>
                             </div>
                             <h4 className="text-[15px] sm:text-[16px] font-medium leading-snug text-black dark:text-white line-clamp-3">
                               {item.title}
                             </h4>
                             <div className="flex items-center gap-3 mt-3 relative z-10 opacity-70">
                                <LikeButton articleId={item.id} initialLikes={item.likesCount} initialIsLiked={item.isLiked} />
                                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                   <MessageSquare size={14} />
                                   <span className="text-[11px] font-semibold">{item.commentsCount}</span>
                                </div>
                             </div>
                          </div>
                          {item.image ? (
                             <div className="w-21 h-21 shrink-0 rounded-[1.25rem] overflow-hidden bg-gray-100 dark:bg-slate-800 border border-black/5 mt-1">
                               <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                             </div>
                          ) : (
                             <div className="w-21 h-21 shrink-0 rounded-[1.25rem] overflow-hidden bg-white dark:bg-black flex items-center justify-center border border-black/5 mt-1">
                               <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white opacity-10">News</span>
                             </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Vertical Standard Feed List below */}
                <div className="max-w-4xl mx-auto w-full">
                  <h3 className="text-sm font-black uppercase tracking-widest text-black dark:text-white mb-8 border-b-2 border-black dark:border-white inline-block pb-1">Latest News</h3>
                  <div className="space-y-10">
                    {feedArticles.map((item) => (
                      <Link href={`/Home/${item.id}`} key={item.id} className="block">
                        <article className="flex flex-col sm:flex-row gap-5">
                          {item.image && (
                            <div className="w-full sm:w-55 h-50 sm:h-35 shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-900 border border-black/5">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[11px] font-bold text-black dark:text-white opacity-40 tracking-widest uppercase">{item.source} · {item.time}</span>
                            </div>
                            <h3 className="text-lg md:text-xl font-bold leading-tight text-black dark:text-white">
                              {item.title}
                            </h3>
                            <p className="mt-3 text-black dark:text-white opacity-60 line-clamp-2 text-sm leading-relaxed">
                              {item.content.replace(/<[^>]*>?/gm, '')}
                            </p>
                            <div className="flex items-center gap-4 mt-4 relative z-10">
                                <LikeButton articleId={item.id} initialLikes={item.likesCount} initialIsLiked={item.isLiked} />
                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                   <MessageSquare size={16} />
                                   <span className="text-xs font-semibold">{item.commentsCount || "Comment"}</span>
                                </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* MARQUEE */}
          <div className="w-full bg-gray-900 text-white py-3 overflow-hidden relative border-t border-white/5">
            <div className="animate-marquee whitespace-nowrap text-[11px] font-black uppercase tracking-[0.2em] opacity-80">
              {displayArticles.length > 0 ? (
                displayArticles.slice(0, 10).map((a, i) => (
                  <span key={i} className="mx-8 underline-offset-4 decoration-white">
                    {a.title} ·
                  </span>
                ))
              ) : (
                 <span>Loading latest headlines...</span>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT AD (Desktop) */}
        <aside className="hidden 2xl:block w-64 border-l border-gray-100 dark:border-slate-900 overflow-y-auto no-scrollbar">
          <Ads position="right" />
        </aside>
      </div>
    </div>
  );
}