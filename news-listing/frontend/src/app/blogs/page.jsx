"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Clock, 
  Eye, 
  ArrowRight,
  User,
  TrendingUp,
  Newspaper,
  Laptop,
  Bot,
  BarChart3,
  Palette,
  Code2,
  Cloud,
  Smartphone
} from 'lucide-react';

import { useLang } from "@/context/LangContext";
// Import JSON data
import blogsData from '@/data/blogs.json';

const categoryIcons = {
  technology: <Laptop size={16} />,
  ai: <Bot size={16} />,
  business: <BarChart3 size={16} />,
  design: <Palette size={16} />,
  development: <Code2 size={16} />,
  cloud: <Cloud size={16} />,
  mobile: <Smartphone size={16} />,
  news: <Newspaper size={16} />
};

const BlogsPage = () => {
  const { t: langT } = useLang();
  const t = langT?.blogs || blogsData;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  
  const { page, categories, search, article, popular, newsletter, blogs } = t;

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularBlogsList = [...blogs].sort((a, b) => b.views - a.views).slice(0, 3);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white font-sans transition-colors duration-300">
      {/* Hero Section */}
      <section className="py-20 bg-[#0f172a] dark:bg-black text-white border-b border-transparent dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-normal tracking-tighter mb-6 font-bold">
            {page.title.includes(' ') ? page.title.split(' ')[0] : page.title} <span className="text-gray-400">{page.title.includes(' ') ? page.title.split(' ').slice(1).join(' ') : "SeaNeB News"}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-normal mb-10">
            {page.subtitle}
          </p>
          
          <div className="max-w-2xl mx-auto relative group">
            <input
              type="text"
              placeholder={search.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-8 py-5 rounded-full bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none border-4 border-transparent focus:border-gray-700 dark:focus:border-gray-600 transition-all shadow-2xl"
            />
            <Search className="absolute right-8 top-5 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" size={24} />
          </div>
        </div>
      </section>

      {/* Categories - Minimalist Filter */}
      <section className="py-8 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10 transition-colors duration-300">
        <div className="container mx-auto px-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2 rounded-full text-xs font-normal tracking-widest transition-all ${selectedCategory === 'all' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
          >
            {categories.all}
          </button>
          {Object.entries(categories).slice(1).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-6 py-2 rounded-full text-xs font-normal uppercase tracking-widest transition-all flex items-center gap-2 ${selectedCategory === key ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
            >
              <span>{categoryIcons[key]}</span> {value}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Blogs List */}
            <div className="lg:col-span-2">
              {filteredBlogs.length > 0 ? (
                <div className="space-y-10">
                  {filteredBlogs.map((blog) => (
                    <div key={blog.id} className="group border-b border-gray-100 dark:border-slate-800 pb-10 last:border-0">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-normal tracking-[0.2em] text-gray-400 border border-gray-200 dark:border-slate-700 px-3 py-1 rounded">
                          {categories[blog.category]}
                        </span>
                      </div>
                      <Link href={`/blogs/${blog.id}`}>
                        <h3 className="text-3xl font-normal mb-4 group-hover:underline decoration-black dark:decoration-white underline-offset-8 tracking-tight">
                          {blog.title}
                        </h3>
                      </Link>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 font-normal leading-relaxed">"{blog.excerpt}"</p>
                      
                      <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-6 text-[11px] font-normal text-gray-400 tracking-widest">
                          <span className="flex items-center gap-1.5"><User size={14} className="text-black dark:text-white" /> {blog.author.name}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-black dark:text-white" /> {blog.read_time} MINS</span>
                          <span className="flex items-center gap-1.5"><Eye size={14} className="text-black dark:text-white" /> {blog.views}</span>
                        </div>
                        <button className="text-black dark:text-white font-normal text-xs tracking-[0.2em] flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                          Read Full Article <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                  <Newspaper className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
                  <h3 className="text-xl font-normal uppercase tracking-tight text-gray-400">{search.no_results}</h3>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-12">
              {/* Popular Posts */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-normal mb-8 flex items-center gap-2 uppercase tracking-[0.2em]">
                  <TrendingUp size={18} /> {popular.title}
                </h3>
                <div className="space-y-8">
                  {popularBlogsList.map((blog) => (
                    <div key={blog.id} className="cursor-pointer group">
                      <h4 className="font-normal text-gray-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors leading-tight uppercase tracking-tight text-sm">
                        {blog.title}
                      </h4>
                      <p className="text-[10px] font-normal text-gray-400 mt-2 uppercase tracking-widest">{blog.views} Views</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter - High Contrast */}
              <div className="bg-black dark:bg-slate-900 rounded-3xl p-8 text-white shadow-2xl">
                <h3 className="text-xl font-normal mb-3 uppercase tracking-tighter">{newsletter.title}</h3>
                <p className="text-xs text-gray-400 mb-6 font-normal leading-relaxed">{newsletter.subtitle}</p>
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <input
                    type="email"
                    placeholder={newsletter.placeholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-3 rounded-xl bg-gray-900 dark:bg-slate-950 text-white border border-gray-800 dark:border-slate-800 focus:outline-none focus:border-white transition-all text-sm"
                    required
                  />
                  <button type="submit" className="w-full bg-white text-black py-3 rounded-xl font-normal uppercase text-xs tracking-widest hover:bg-gray-200 transition-all active:scale-95">
                    {newsletter.button}
                  </button>
                </form>
                {subscribed && <p className="text-[10px] font-normal text-gray-400 mt-4 text-center uppercase tracking-widest">{newsletter.success}</p>}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogsPage;