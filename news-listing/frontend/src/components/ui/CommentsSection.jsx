"use client";
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { newsAPI } from '@/lib/apiconfig';

export default function CommentsSection({ articleId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (articleId) {
      fetchComments();
    }
  }, [articleId]);

  const fetchComments = async () => {
    setFetching(true);
    try {
      const res = await newsAPI.getComments(articleId);
      
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res?.data?.comments)) list = res.data.comments;
      else if (Array.isArray(res?.comments)) list = res.comments;
      
      setComments(list);
    } catch (err) {
      if (err.status === 401 || err.message?.toLowerCase().includes("session") || err.message?.toLowerCase().includes("unauthorized")) {
        console.log("Comments view restricted to logged-in users.");
      } else {
        console.error("Failed to fetch comments:", err.message || err);
      }
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await newsAPI.addComment(articleId, { content: newComment.trim() });
      setNewComment("");
      await fetchComments();
    } catch (err) {
      if (err.status === 401 || err.message?.toLowerCase().includes("unauthorized") || err.message?.toLowerCase().includes("login") || err.message?.toLowerCase().includes("session")) {
        alert("Please login to post a comment.");
      } else {
        alert(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-800">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 tracking-tight">
        <MessageSquare size={20} /> Comments ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-8 flex gap-3 relative">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <User size={18} className="text-gray-400" />
        </div>
        <div className="flex-1 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-gray-50/50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none h-24 text-gray-900 dark:text-white placeholder-gray-400"
          />
          <button 
            type="submit" 
            disabled={loading || !newComment.trim()}
            className="absolute bottom-3 right-3 p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>

      {fetching ? (
        <div className="animate-pulse space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-4">
               <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800 shrink-0"></div>
               <div className="flex-1 space-y-2 py-1">
                 <div className="h-3 w-32 bg-gray-200 dark:bg-slate-800 rounded"></div>
                 <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded"></div>
               </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment, i) => (
            <div key={comment._id || comment.id || i} className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                {comment.user?.avatar ? (
                    <img src={comment.user.avatar} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                    <User size={18} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                    {comment.user?.name || comment.author_name || comment.user?.details?.first_name || "User"}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                     {new Date(comment.created_at || comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {comment.content || comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
