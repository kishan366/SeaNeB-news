"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Building2,
  ClipboardCheck,
  FileText,
  Users,
  Settings,
  ArrowLeft,
  ChevronRight,
  X} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { useRBAC } from "@/context/RBACContext";

function SidebarItem({
  icon,
  label,
  active = false,
  hasSub = false,
  isCollapsed,
  onClick,
  isOpen = false
}) {
  return (
    <div
      onClick={onClick}
      title={isCollapsed ? label : ""}
      className={`
      flex items-center ${isCollapsed ? "justify-center" : "justify-between"}
      px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group
      ${
        active
          ? "bg-black text-white shadow-lg"
          : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
      }
    `}
    >
      <div className="flex items-center gap-3">
        {React.cloneElement(icon, { size: 18 })}

        {!isCollapsed && (
          <span className="text-[11px] font-bold uppercase tracking-wider">
            {label}
          </span>
        )}
      </div>

      {!isCollapsed && hasSub && (
        <ChevronRight
          size={12}
          className={`opacity-40 transition-transform ${
            isOpen || active ? "rotate-90" : "group-hover:translate-x-0.5"
          }`}
        />
      )}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(
    pathname.includes("news")
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(
    pathname.includes("settings")
  );
  
  const { isOwner, isEditor, isJournalist, loading: roleLoading } = useRBAC();

  return (
    <>
      {/* MOBILE BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-60 lg:relative lg:z-0
        ${isCollapsed ? "w-20" : "w-60 md:w-64"}
        border-r border-slate-200/60 dark:border-slate-800 
        bg-white dark:bg-slate-900 flex flex-col p-3
        transition-all duration-300 rounded-r-2xl lg:rounded-r-4xl
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
        h-full lg:h-screen shrink-0 overflow-y-auto
      `}
      >
        {/* MOBILE CLOSE */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-black dark:hover:text-white"
        >
          <X size={18} />
        </button>

        {/* TOGGLE BUTTON */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 self-end"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ArrowLeft size={18} />}
        </button>

        {/* LOGO */}
        <div className="flex items-center justify-center mb-6">
          {isCollapsed ? (
            <img src="/assets/logo.png" alt="logo" className="w-8 h-8" />
          ) : (
            <Logo size="sm" />
          )}
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-2">
          {isOwner && (
            <>
              <SidebarItem
                icon={<Building2 />}
                label="Profile / Branch"
                isCollapsed={isCollapsed}
                active={pathname === "/media-house/profile"}
                onClick={() => router.push("/media-house/profile")}
              />

              <SidebarItem
                icon={<ClipboardCheck />}
                label="Registration"
                isCollapsed={isCollapsed}
              />
            </>
          )}

          <SidebarItem
            icon={<FileText />}
            label="News Setup"
            isCollapsed={isCollapsed}
            hasSub
            isOpen={isNewsOpen}
            active={pathname.includes("/media-house/news")}
            onClick={() => setIsNewsOpen(!isNewsOpen)}
          />

          {!isCollapsed && isNewsOpen && (
            <div className="pl-12 space-y-1 mt-1">
              {(isOwner || isJournalist) && (
                <div
                  onClick={() => router.push("/media-house/news/create")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest transition-all ${
                    pathname === "/media-house/news/create"
                      ? "text-black dark:text-white"
                      : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                  Create Post
                </div>
              )}
              <div
                onClick={() => router.push("/media-house/news/my-posts")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest transition-all ${
                  pathname.includes("my-posts")
                    ? "text-black dark:text-white"
                    : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                {isEditor ? "Pending Articles" : "My Posts"}
              </div>
            </div>
          )}

          {isOwner && (
            <>
              <SidebarItem
                icon={<Users />}
                label="User Mgmt"
                isCollapsed={isCollapsed}
                active={pathname === "/media-house/users"}
                onClick={() => router.push("/media-house/users")}
              />

              {/* SETTINGS */}
              <div className="space-y-1">
                <SidebarItem
                  icon={<Settings />}
                  label="Settings"
                  isCollapsed={isCollapsed}
                  hasSub
                  isOpen={isSettingsOpen}
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                />

                {!isCollapsed && isSettingsOpen && (
                  <div className="pl-12 space-y-1 mt-1">
                    <div
                      onClick={() =>
                        router.push("/media-house/settings/invoices")
                      }
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest transition-all ${
                        pathname.includes("invoices")
                          ? "text-black dark:text-white"
                          : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                      Billing & Invoices
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}