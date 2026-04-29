"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/apiconfig';

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshBusinesses = async () => {
    try {
      const response = await api.user.getBusinesses(true);
      if (response?.success && response.data) {
        // ENRICH DATA: Attach parent business to each branch
        const enrichedBizList = response.data.map(biz => {
           const branches = biz.branches || biz.Branches || [];
           const enrichedBranches = branches.map(b => ({
              ...b,
              Business: {
                 business_id: biz.business_id || biz.id,
                 business_name: biz.business_name,
                 display_name: biz.display_name,
                 business_status: biz.business_status
              }
           }));
           return { ...biz, branches: enrichedBranches, Branches: enrichedBranches };
        });
        
        setBusinesses(enrichedBizList);

        // Update selected branch if it exists in the new list
        if (selectedBranch) {
          let found = null;
          for (const biz of enrichedBizList) {
            const b = (biz.branches).find(br => 
              String(br.branch_id) === String(selectedBranch.branch_id) || 
              String(br.id) === String(selectedBranch.branch_id) ||
              String(br.branch_id) === String(selectedBranch.id)
            );
            if (b) {
              found = b;
              break;
            }
          }
          if (found) setSelectedBranch(found);
        }
      }
    } catch (err) {
      console.warn("Refresh Data Error:", err.message || err);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await api.user.getBusinesses();
        if (response?.success && response.data) {
          // ENRICH DATA: Attach parent business to each branch
          const enrichedBizList = response.data.map(biz => {
             const branches = biz.branches || biz.Branches || [];
             const enrichedBranches = branches.map(b => ({
                ...b,
                Business: {
                   business_id: biz.business_id || biz.id,
                   business_name: biz.business_name,
                   display_name: biz.display_name,
                   business_status: biz.business_status
                }
             }));
             return { ...biz, branches: enrichedBranches, Branches: enrichedBranches };
          });
          
          setBusinesses(enrichedBizList);

          // Attempt to extract user profile from first node if available
          if (enrichedBizList.length > 0) {
              const firstBiz = enrichedBizList[0];
              const profile = firstBiz.User || firstBiz;
              if (profile && !profile.full_name && profile.first_name) {
                profile.full_name = `${profile.first_name} ${profile.last_name}`;
              }
              setUserProfile(profile);
          }

          // Initial auto-selection logic
          if (enrichedBizList.length > 0) {
            let defaultBranch = null;
            for (const biz of enrichedBizList) {
               const activeBranch = (biz.branches).find(b => 
                 Number(b.branch_status) === 1 && Number(b.onboarding_status) === 1
               );
               if (activeBranch) {
                 defaultBranch = activeBranch;
                 break;
               }
            }
            if (!defaultBranch) {
               defaultBranch = enrichedBizList[0].branches?.[0];
            }
            if (defaultBranch) setSelectedBranch(defaultBranch);
          }
        }
      } catch (err) {
        console.warn("Context Data Error:", err.message || err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  return (
    <BranchContext.Provider value={{ 
      businesses, 
      selectedBranch, 
      setSelectedBranch, 
      userProfile, 
      loading,
      refreshBusinesses
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
