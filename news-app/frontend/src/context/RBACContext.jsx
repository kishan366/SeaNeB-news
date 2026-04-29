"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/apiconfig';
import { useBranch } from '@/context/BranchContext';

const RBACContext = createContext();

export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  JOURNALIST: 'journalist'
};

export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: {
    canCreate: true,
    canEditDraft: true,
    canEditPending: true,
    canPublishReject: true,
    canReturnToDraft: true,
    canDelete: true,
    canManageUsers: true,
    canManageSettings: true,
    canViewAllArticles: true,
    allowedRoutes: [
      "/media-house",
      "/media-house/profile",
      "/media-house/users",
      "/media-house/businesses",
      "/media-house/settings/invoices",
      "/media-house/news/create",
      "/media-house/news/my-posts",
      "/media-house/news/edit",
      "/media-house/registration" // For empty state scenario
    ],
    defaultRoute: "/media-house/news/my-posts"
  },
  [ROLES.EDITOR]: {
    canCreate: false,
    canEditDraft: false, // Editors usually only edit pending/published global posts
    canEditPending: true,
    canPublishReject: true,
    canReturnToDraft: true,
    canDelete: false,
    canManageUsers: false,
    canManageSettings: false,
    canViewAllArticles: true,
    allowedRoutes: [
      "/media-house",
      "/media-house/news/my-posts",
      "/media-house/news/edit"
    ],
    defaultRoute: "/media-house/news/my-posts"
  },
  [ROLES.JOURNALIST]: {
    canCreate: true,
    canEditDraft: true,
    canEditPending: false, // Journalists cannot edit posts they sent for review
    canPublishReject: false,
    canReturnToDraft: false,
    canDelete: false,
    canManageUsers: false,
    canManageSettings: false,
    canViewAllArticles: false, // Strictly view own posts
    allowedRoutes: [
      "/media-house",
      "/media-house/news/create",
      "/media-house/news/my-posts",
      "/media-house/news/edit"
    ],
    defaultRoute: "/media-house/news/my-posts"
  }
};

export function RBACProvider({ children }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { businesses, loading: branchLoading } = useBranch();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    
    if (branchLoading) return;
    
    const fetchRole = async () => {
      try {


        const response = await api.staff.getMe();
        
        if (mounted && response?.success && response?.data) {
          setRole(response.data.role?.toLowerCase());
        } else if (mounted) {
          setRole(null);
        }
      } catch (error) {
        if (mounted) setRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRole();
    return () => { mounted = false; };
  }, [branchLoading, businesses]);

  const isOwner = role === ROLES.OWNER;
  const isEditor = role === ROLES.EDITOR;
  const isJournalist = role === ROLES.JOURNALIST;

  // Global Route Guard Effect
  useEffect(() => {
    if (!loading && !branchLoading) {
      if (role) {
        // Redirection logic for ROOT media-house path to bypass blank screen
        if (pathname === '/media-house' || pathname === '/media-house/') {
           const perms = ROLE_PERMISSIONS[role];
           if (perms) router.replace(perms.defaultRoute);
           return;
        }

        const perms = ROLE_PERMISSIONS[role];
        if (perms) {
          // Check route prefix to allow parameterized routes like /news/edit/[id]
          const isAllowed = perms.allowedRoutes.some(route => 
             pathname === route || pathname.startsWith(route + '/')
          );
          if (!isAllowed) {
            console.warn(`[RBAC] Access denied for role: ${role} at route: ${pathname}`);
            router.replace(perms.defaultRoute);
          }
        }
      } else if (businesses?.length > 0 && !role) {
         // Default root owner fallback if role is missing but business is active.
         if (pathname === '/media-house' || pathname === '/media-house/') {
           router.replace('/media-house/news/my-posts');
         }
      }
    }
  }, [pathname, role, loading, branchLoading, businesses, router]);

  const permissions = ROLE_PERMISSIONS[role] || {};

  return (
    <RBACContext.Provider value={{
      role,
      isOwner,
      isEditor,
      isJournalist,
      permissions,
      loading
    }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
}
