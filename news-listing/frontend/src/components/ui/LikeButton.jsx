"use client";
import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { newsAPI } from '@/lib/apiconfig';

export default function LikeButton({ articleId, initialLikes = 0, initialIsLiked = false, className = "" }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [loading, setLoading] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    setLoading(true);

    try {
      const res = await newsAPI.toggleLike(articleId);
      setIsLiked(!isLiked);
      
      // if backend returns exactly what the new like count is, use it
      if (res?.data?.likesCount !== undefined) setLikes(res.data.likesCount);
      else if (res?.data?.likes_count !== undefined) setLikes(res.data.likes_count);
      else setLikes(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
      
    } catch (err) {
      if (err.status === 401 || err.message?.toLowerCase().includes("unauthorized") || err.message?.toLowerCase().includes("login") || err.message?.toLowerCase().includes("session")) {
        alert("Please login to like this article.");
      } else {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLike} 
      className={`flex items-center gap-1.5 transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 ${
        isLiked 
          ? "text-red-500" 
          : "text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
      } ${className}`}
      title={isLiked ? "Unlike" : "Like"}
    >
      <Heart 
        size={18} 
        className={`transition-all ${loading ? 'scale-90 opacity-70' : ''} ${isLiked ? 'fill-current' : ''}`} 
      />
      <span className="text-xs md:text-sm font-semibold">{likes > 0 ? likes : "Like"}</span>
    </button>
  );
}
