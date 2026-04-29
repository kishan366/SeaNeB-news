"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import {
  Bell, Search, LogOut, ChevronDown,
  Sun, Moon, Menu, X, Building2, BadgeCheck, User, Pencil, CreditCard, Rocket, Loader2,
  FileText, CheckSquare, LayoutDashboard
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import api, { getFullImageUrl } from '@/lib/apiconfig';
import Cookies from 'js-cookie';
import LanguageSelect from "./LanguageSelect";
import { useLang } from "@/context/LangContext";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

export default function Navbar() {

  const pathname = usePathname();


  const AUTH_BASE = process.env.NEXT_PUBLIC_APP_URL;
  const LISTING_BASE = process.env.NEXT_PUBLIC_LISTING_URL;

  const { t, lang } = useLang();
  const { theme, setTheme } = useTheme();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [staffInfo, setStaffInfo] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const profileRef = useRef(null);

  // Set mounted immediately — don't wait for network
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth init runs in background, doesn't block render
  useEffect(() => {
    let cancelled = false;

    const initAuth = () => {
    
      const timerId = setTimeout(async () => {
        if (cancelled) return;

        try {
          //  First check if token is already in memory (e.g. from SsoHandler)
          let token = apiClient.getToken();

          //  Only try refresh if we have evidence of a prior session (csrf cookie exists)
          // This prevents unnecessary 401 errors for non-logged-in users
          if (!token) {
            const hasCsrfCookie = !!Cookies.get("csrf_token_news");
            if (hasCsrfCookie) {
              token = await apiClient.refreshToken();
            }
          }

          if (cancelled) return;

          if (token) {
            setIsLoggedIn(true);

            const profile = await api.user.getProfile();

            if (!cancelled && profile?.success && profile?.data) {
              setUserProfile(profile.data);
            }
          }
        } catch (err) {
          console.error("Auth init error:", err);
        } finally {
          if (!cancelled) {
            setIsCheckingAuth(false);
          }
        }
      }, 300);

      // Save the timer so we can clear it if needed
      return () => clearTimeout(timerId);
    };

    const cleanupTimeout = initAuth();



    //  Listen for SSO / auth-updated events to re-check auth
    const handleAuthUpdated = () => {
      if (!cancelled) initAuth();
    };
    window.addEventListener("auth-updated", handleAuthUpdated);

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      cancelled = true;
      cleanupTimeout();
      window.removeEventListener("auth-updated", handleAuthUpdated);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  useEffect(() => {
    if (mounted) {
      checkLoginStatus();
    }
  }, [lang]);

  const checkLoginStatus = async () => {
    const loggedIn = !!apiClient.getToken();
    if (loggedIn) {
      setIsLoggedIn(true);
      fetchUserProfile();
    }
  };

  const fetchUserProfile = async () => {
    setLoadingProfile(true);
    try {
      const data = await api.user.getProfile();
      if (data?.success && data?.data) {
        setUserProfile(data.data);
      }
      try {
        const mhRes = await apiClient.get('/news/media-house/me');
        if (mhRes.data?.success && mhRes.data?.data) {
          setStaffInfo(mhRes.data.data);
        }
      } catch (err) {
        // Might not be a registered staff member, safely catch and silently ignore
      }
    } catch (error) {
      console.error("Profile fetch failed", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = async () => {
    const confirmMessage = t?.navbar?.logout_confirm || "Are you sure you want to logout?";
    if (!window.confirm(confirmMessage)) return;

    try {
      await api.auth.logout();
    } catch (e) { console.warn("Logout notification:", e.message); }
    apiClient.clearTokens();
    setIsLoggedIn(false);
    setUserProfile(null);
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
  };

  const getUserInitials = () => {
    if (userProfile?.full_name) {
      const names = userProfile.full_name.split(' ');
      return names.length > 1 ? (names[0][0] + names[1][0]).toUpperCase() : names[0][0].toUpperCase();
    }
    return 'U';
  };

  const handlePayNow = () => {
    if (typeof window !== 'undefined' && AUTH_BASE) {
      window.location.href = `${AUTH_BASE}/auth/business-register?step=payment`;
    }
  };

  const handleCancelOnboarding = async () => {
    const branchId = userProfile?.onboarding?.branch?.branch_id ||
      userProfile?.onboarding?.branch_id ||
      userProfile?.branch_id;

    if (!branchId) return;

    if (!confirm("Are you sure you want to cancel your business registration? This will clear your current setup progress.")) {
      return;
    }

    try {
      await api.payment.cancelOnboarding({ branch_id: branchId });
      fetchUserProfile();
    } catch (error) {
      console.error("Cancel onboarding error:", error);
      alert("Failed to cancel registration");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const [isVisible, setIsVisible] = useState(true);
  const scrollTimeout = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Show navbar when scrolling
      setIsVisible(true);

      // Clear previous timeout
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

      // Hide after 2.5 seconds of no scrolling, only if not at the very top
      scrollTimeout.current = setTimeout(() => {
        if (window.scrollY > 100) {
          setIsVisible(false);
        }
      }, 2500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  const isActive = (path) => pathname === path;

  if (pathname === "/media-house" || pathname === "/profile/edit") return null;

  return (
    <>
      <div className={`sticky top-0 w-full bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 shrink-0 z-50 transition-all duration-500 transform ${isVisible || isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-360 mx-auto px-4 lg:px-8">
          <header className="py-3 flex items-center justify-between gap-4">

            {/* LEFT: Hamburger & Logo */}
            <div className="flex items-center gap-2 lg:gap-8">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 lg:hidden hover:bg-gray-100 dark:hover:bg-slate-900 rounded-full transition-colors"
              >
                <Menu size={24} className="text-gray-600 dark:text-gray-300" />
              </button>
              <Logo />
            </div>

            {/* CENTER: Search */}
            <div className="hidden md:block flex-1 max-w-2xl relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={20} />
              </span>
              <input
                type="text"
                placeholder={t?.navbar?.search_placeholder || "Search..."}
                className="w-full bg-[#f1f3f4] dark:bg-slate-900 border-none rounded-full py-2.5 pl-12 pr-4 outline-none text-[15px] text-gray-700 dark:text-gray-200 transition-all"
              />
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-2 lg:gap-6 shrink-0">
              <nav className="hidden xl:flex items-center gap-6 text-[14px] font-normal text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-800 pr-6 mr-2">
                <Link href="/about" className={`${isActive('/about') ? 'text-blue-600 font-normal' : 'hover:text-blue-600 dark:hover:text-blue-400'} transition-colors relative group`}>
                  {t?.navbar?.about || "About"}
                  {isActive('/about') && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 rounded-full animate-in fade-in duration-500"></span>}
                </Link>
                <Link href="/solutions" className={`${isActive('/solutions') ? 'text-blue-600 font-normal' : 'hover:text-blue-600 dark:hover:text-blue-400'} transition-colors relative group`}>
                  {t?.navbar?.solutions || "Solutions"}
                  {isActive('/solutions') && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 rounded-full animate-in fade-in duration-500"></span>}
                </Link>
                <Link href="/blogs" className={`${isActive('/blogs') ? 'text-blue-600 font-normal' : 'hover:text-blue-600 dark:hover:text-blue-400'} transition-colors relative group`}>
                  {t?.navbar?.blogs || "Blogs"}
                  {isActive('/blogs') && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 rounded-full animate-in fade-in duration-500"></span>}
                </Link>
                <Link href="/partner-with-us" className={`${isActive('/partner-with-us') ? 'text-blue-600 font-normal' : 'hover:text-blue-600 dark:hover:text-blue-400'} transition-colors relative group`}>
                  {t?.navbar?.partner || "Partner"}
                  {isActive('/partner-with-us') && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 rounded-full animate-in fade-in duration-500"></span>}
                </Link>
                <Link href="/contact" className={`${isActive('/contact') ? 'text-blue-600 font-normal' : 'hover:text-blue-600 dark:hover:text-blue-400'} transition-colors relative group`}>
                  {t?.navbar?.contact || "Contact"}
                  {isActive('/contact') && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 rounded-full animate-in fade-in duration-500"></span>}
                </Link>
              </nav>

              <div className="flex items-center gap-2">
                <div><LanguageSelect /></div>

                <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-full transition-colors group">
                  {mounted && (theme === "dark") ? (
                    <Sun size={20} className="text-amber-500" />
                  ) : (
                    <Moon size={20} className="text-gray-600 dark:text-gray-300" />
                  )}
                </button>

                {/* PROFILE/LOGIN (Desktop) */}
                <div className="hidden lg:flex items-center gap-4">
                  {isCheckingAuth || loadingProfile ? (
                    <div className="w-20 h-8 bg-gray-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
                  ) : isLoggedIn && userProfile ? (
                    <div className="relative" ref={profileRef}>
                      <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 p-1 pr-3 bg-gray-50 dark:bg-slate-900 rounded-full border border-gray-200 dark:border-slate-800"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-white text-xs font-normal overflow-hidden">
                          {userProfile.profile_photo && !imageError ? (
                            <img src={getFullImageUrl(userProfile.profile_photo)} onError={() => setImageError(true)} className="w-full h-full object-cover" alt="Profile" />
                          ) : getUserInitials()}
                        </div>
                        <span className="text-xs font-normal text-gray-700 dark:text-gray-200">{userProfile.full_name.split(' ')[0]}</span>
                        <ChevronDown size={14} className={showProfileMenu ? 'rotate-180' : ''} />
                      </button>

                      {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in duration-200">
                          <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-800">
                            <p className="text-sm font-normal text-gray-900 dark:text-white truncate">{userProfile.full_name}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{userProfile.seaneb_id}</p>
                          </div>

                          {/* BUSINESS STATUS SECTION */}
                          <div className="p-2">
                            {userProfile.is_business_registered ? (
                              (() => {
                                const branch = userProfile?.onboarding?.branches?.[0] || userProfile?.onboarding?.branch || userProfile?.Branches?.[0] || userProfile?.branch;
                                const isPaymentDone = (Number(branch?.branch_status) === 1 && Number(branch?.onboarding_status) === 1);

                                return isPaymentDone ? (
                                  <Link href={`${AUTH_BASE}/media-house/profile${branch?.order_id ? `?order_id=${branch.order_id}` : ""}`} className="flex items-center justify-between p-2 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20 group transition-all">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-green-500 rounded-lg text-white">
                                        <Building2 size={16} />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-normal text-green-700 dark:text-green-400 uppercase tracking-wider">Switch To Business Profile</p>
                                        <p className="text-[10px] text-green-600/70 dark:text-green-500/70 flex items-center gap-1"><BadgeCheck size={10} /> Business Active</p>
                                      </div>
                                    </div>
                                  </Link>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={handlePayNow}
                                      disabled={paymentLoading}
                                      className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 group transition-all"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500 rounded-lg text-white">
                                          {paymentLoading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                        </div>
                                        <div className="text-left">
                                          <p className="text-[11px] font-normal text-amber-700 dark:text-amber-400 uppercase tracking-wider">complete registration</p>
                                          <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70">Activate Media House</p>
                                        </div>
                                      </div>
                                      <Rocket size={14} className="text-amber-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                    {/* <button
                                      onClick={handleCancelOnboarding}
                                      className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors py-1 flex items-center justify-center gap-1"
                                    >
                                      Cancel Registration
                                    </button> */}
                                  </div>
                                );
                              })()
                            ) : staffInfo?.role ? (
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20">
                                <div className="p-2 bg-blue-600 rounded-lg text-white"><User size={16} /></div>
                                <div>
                                  <p className="text-[11px] font-normal text-blue-700 dark:text-blue-400 uppercase tracking-wider">Media House Staff</p>
                                  <p className="text-[9px] text-blue-500 font-bold uppercase">{staffInfo.role}</p>
                                </div>
                              </div>
                            ) : (
                              <Link href={`${AUTH_BASE}/auth/business-register`} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all">
                                <div className="p-2 bg-blue-600 rounded-lg text-white"><Building2 size={16} /></div>
                                <div>
                                  <p className="text-[11px] font-normal text-blue-700 dark:text-blue-400 uppercase tracking-wider">Register Your Business</p>
                                  <p className="text-[9px] text-blue-500">Scale your brand today</p>
                                </div>
                              </Link>
                            )}
                          </div>

                          <div className="pt-1">
                            <Link href="/profile/edit" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"><User size={16} /> {t?.navbar?.edit_profile || "Edit Profile"}</Link>
                            
                            {(staffInfo?.role?.toLowerCase() === 'editor' || staffInfo?.role?.toLowerCase() === 'admin') && (
                              <>
                                <Link href={`${AUTH_BASE}/media-house/news/my-posts?viewMode=all`} onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"><FileText size={16} /> All Articles</Link>
                                <Link href={`${AUTH_BASE}/media-house/news/pending-review`} onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"><CheckSquare size={16} /> Pending Review</Link>
                              </>
                            )}

                            <Link href={`${AUTH_BASE}/media-house/news/my-posts`} onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"><LayoutDashboard size={16} /> {staffInfo?.role?.toLowerCase() === 'journalist' ? 'My Posts' : 'Dashboard'}</Link>

                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1 border-t border-gray-50 dark:border-slate-800"><LogOut size={16} /> {t?.navbar?.logout || "Logout"}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link href={`${AUTH_BASE}/auth/login`} className="px-6 py-2 bg-blue-600 text-white rounded-full text-xs font-bold">{t?.navbar?.login || "Login"}</Link>
                  )}
                </div>
              </div>
            </div>
          </header>
        </div>

      </div>

      {/* --- MOBILE DRAWER (MOVED OUTSIDE) --- */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-100 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-950 z-101 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 rounded-r-[2.5rem] overflow-hidden border-r border-gray-100 dark:border-slate-800">
            <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <Logo />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-full">
                <X size={22} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {isCheckingAuth || loadingProfile ? (
                <div className="w-full py-6 flex justify-center">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : isLoggedIn && userProfile ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl flex items-center gap-4 border border-blue-100/50 dark:border-blue-800/20">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-normal text-xl overflow-hidden shrink-0">
                      {userProfile.profile_photo && !imageError ? (
                        <img src={getFullImageUrl(userProfile.profile_photo)} onError={() => setImageError(true)} className="w-full h-full object-cover" alt="Profile" />
                      ) : getUserInitials()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-normal text-gray-900 dark:text-white truncate">{userProfile.full_name}</p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-normal uppercase tracking-widest mt-0.5">{userProfile.seaneb_id || "Active"}</p>
                    </div>
                  </div>

                  {/* MOBILE BUSINESS STATUS CARD */}
                  {userProfile.is_business_registered ? (
                    (() => {
                      const branch = userProfile?.onboarding?.branch;
                      const isPaymentDone = (branch?.branch_status === 1 && branch?.onboarding_status === 1);

                      return isPaymentDone ? (
                        <Link href={`${AUTH_BASE}/media-house/profile`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-4 rounded-3xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-green-500 rounded-xl text-white"><Building2 size={20} /></div>
                            <div>
                              <p className="text-xs font-normal text-green-700 dark:text-green-400 uppercase tracking-widest">Switch To Business Profile</p>
                              <p className="text-[10px] text-green-600/60">Business Active</p>
                            </div>
                          </div>
                          <BadgeCheck size={20} className="text-green-500" />
                        </Link>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => { handlePayNow(); setIsMobileMenuOpen(false); }}
                            disabled={paymentLoading}
                            className="flex items-center justify-between w-full p-4 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 shadow-sm active:scale-95 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-amber-500 rounded-xl text-white">
                                {paymentLoading ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-normal text-amber-700 dark:text-amber-400 uppercase tracking-widest"></p>Complete your Registration
                                <p className="text-[10px] text-amber-600/60">Final step to activate</p>
                              </div>
                            </div>
                            <Rocket size={20} className="text-amber-500" />
                          </button>
                          <button
                            onClick={() => { handleCancelOnboarding(); setIsMobileMenuOpen(false); }}
                            className="w-full py-2 text-[11px] font-normal text-slate-400 active:text-red-500"
                          >
                            Cancel Onboarding
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <Link href={`${AUTH_BASE}/auth/business-register`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-3xl bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20">
                      <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md"><Building2 size={20} /></div>
                      <div>
                        <p className="text-xs font-normal uppercase tracking-widest">Register Media House</p>
                        <p className="text-[10px] text-blue-100">Click to start setup</p>
                      </div>
                    </Link>
                  )}
                </div>
              ) : (
                <Link
                  href={`${AUTH_BASE}/auth/login`}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-normal uppercase tracking-widest flex items-center justify-center shadow-lg shadow-blue-500/25"
                >
                  {t?.navbar?.login || "Login"}
                </Link>
              )}

              <div className="space-y-1">
                <p className="text-[10px] font-normal text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mb-3 px-4">{t?.navbar?.navigation || "Navigation"}</p>
                {[
                  { name: t?.navbar?.about || "About", href: "/about" },
                  { name: t?.navbar?.solutions || "Solutions", href: "/solutions" },
                  { name: t?.navbar?.blogs || "Blogs", href: "/blogs" },
                  { name: t?.navbar?.partner || "Partner", href: "/partner-with-us" },
                  { name: t?.navbar?.contact || "Contact", href: "/contact" },
                  ...(isLoggedIn ? [
                    { name: t?.navbar?.dashboard || "Dashboard", href: "/dashboard" },
                    { name: t?.navbar?.edit_profile || "Edit Profile", href: "/profile/edit" }
                  ] : [])
                ].map((link) => (
                  <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3.5 text-[15px] font-normal text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-900 rounded-2xl">
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="p-5 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800">
              {isLoggedIn && (
                <button onClick={handleLogout} className="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-normal uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
                  <LogOut size={16} /> {t?.navbar?.logout || "Logout"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}