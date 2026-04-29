"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Mail, 
  Phone, 
  Shield, 
  UserPlus, 
  Filter, 
  Download,
  Trash2,
  Edit2,
  X,
  Loader2,
  ChevronRight,
  ChevronDown,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import CountrySelector from '@/components/ui/CountrySelector';
import api, { getFullImageUrl, OTP_PURPOSE, EMAIL_OTP_PURPOSE } from '@/lib/apiconfig';
import OtpInputCard from '@/components/ui/OtpInputCard';
import Lottie from "lottie-react";
import successAnimation from "@/lottie/animation.json";

const toast = {
  success: (msg) => alert(`SUCCESS: ${msg}`),
  error: (msg) => alert(`ERROR: ${msg}`),
  info: (msg) => alert(`INFO: ${msg}`)
};

const ROLE_OPTIONS = [
  { value: 'journalist', label: 'Journalist' },
  { value: 'editor', label: 'Editor' }
];

const maskMobile = (mobile) => {
  if (!mobile) return "your account";
  const clean = mobile.replace(/\D/g, '');
  if (clean.length < 10) return mobile;

  const countryCode = clean.length > 10 ? clean.slice(0, clean.length - 10) : '+91';
  const body = clean.slice(-10);
  const last2 = body.slice(-2);
  return `+${countryCode} ${body.slice(0, 2)}XXXXXX${last2}`;
};

// Dummy data for users
const INITIAL_USERS = [
 
];

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState(INITIAL_USERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [registrationRedirectMode, setRegistrationRedirectMode] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const hasFetchedRef = useRef(false);

  // Inline role assignment state
  const [assigningRoleFor, setAssigningRoleFor] = useState(null);

  const fetchUsers = useCallback(async (force = false) => {
    if (hasFetchedRef.current && !force) return;
    setIsPageLoading(true);
    try {
      const response = await api.staff.list();
      if (response?.success) {
        const mappedUsers = (response.data || []).map((u, index) => {
          const details = u.user_details || {};
          return {
            id: u.local_user_id || details.user_id || `staff-${index}`,
            centralUserId: u.central_user_id || details.user_id,
            name: `${details.first_name || ''} ${details.last_name || ''}`.trim() || 'N/A',
            seanebId: details.seaneb_id || 'n/a',
            email: details.email || 'N/A',
            phone: details.mobile_number ? `${details.country_code || '+91'} ${details.mobile_number}` : 'N/A',
            role: u.role || 'N/A',
            status: 'Active', 
            avatar: details.avatar || null
          };
        });
        setUsers(mappedUsers);
        hasFetchedRef.current = true;
      }
    } catch (err) {
      console.warn("Failed to fetch users:", err.message || err);
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  const handleToggleMembers = () => {
    if (!showMembers) {
      fetchUsers();
    }
    setShowMembers(prev => !prev);
  };
  
  // OTP State
  const [otpModal, setOtpModal] = useState({
    isOpen: false,
    otp: ['', '', '', ''],
    target: '',
    countryCode: '',
    userId: null
  });
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Sync body lock with OTP modal
  useEffect(() => {
    const anyOpen = isAddModalOpen || otpModal.isOpen;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isAddModalOpen, otpModal.isOpen]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country_code: '+91'
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const cleanMobile = formData.phone.replace(/\D/g, '');
      const finalCC = formData.country_code.replace(/\D/g, '');

      // 1. Always send OTP first without checking existence here
      const sendResponse = await api.auth.sendOtp({
        identifier_type: 0,
        country_code: finalCC.startsWith('+') ? finalCC : `+${finalCC}`,
        mobile_number: cleanMobile,
        purpose: 10, 
        product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
      });

      if (sendResponse?.success) {
        // Trigger OTP Verification modal
        setOtpModal({
          isOpen: true,
          otp: ['', '', '', ''],
          target: cleanMobile,
          countryCode: finalCC.startsWith('+') ? finalCC : `+${finalCC}`,
          userId: null // We'll get this from verify-otp instead
        });
        setOtpTimer(60);
        setIsAddModalOpen(false);
      } else {
        toast.error(sendResponse?.message || "Failed to send verification code");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const otpValue = otpModal.otp.join('');
      // 2. Verify OTP and check the existence status in the response
      const response = await api.auth.verifyOtp({
        identifier_type: 0,
        country_code: otpModal.countryCode,
        mobile_number: otpModal.target,
        otp: otpValue,
        purpose: 10,
        product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
      });

      if (response?.success) {
        // Helper function for registration redirect
        const redirectToRegistration = () => {
          setOtpModal(prev => ({ ...prev, isOpen: false }));
          setRegistrationRedirectMode(true);
          
          setTimeout(() => {
            const ccStr = otpModal.countryCode.replace('+', '');
            sessionStorage.setItem('staff_registration', JSON.stringify({
              target: otpModal.target,
              cc: ccStr
            }));
            router.push('/media-house/registration');
          }, 1800);
        };

        // 1. If user doesn't exist in Central, they definitely need registration
        if (!response.is_existing_user) {
          redirectToRegistration();
          return;
        }

        // 2. User exists in Central, try to add them as staff directly
        try {
          const addResponse = await api.staff.add({
            target_central_user_id: response.user_id
          });

          if (addResponse?.success) {
            toast.success("Staff member added successfully!");
            
            fetchUsers();
            setOtpModal(prev => ({ ...prev, isOpen: false }));
            setFormData({ name: '', email: '', phone: '', country_code: '+91' });
          } else {
            // If backend can't find them in news database, redirect to registration
            if (addResponse?.message?.toLowerCase().includes("not found")) {
              redirectToRegistration();
            } else {
              setOtpError(addResponse?.message || "Failed to finalize staff addition");
            }
          }
        } catch (addErr) {
          // If the error is "User not found", it means they exist in central but not in this product
          if (addErr.message?.toLowerCase().includes("not found")) {
            redirectToRegistration();
          } else {
            setOtpError(addErr.message || "Verification failed");
          }
        }
      } else {
        setOtpError(response?.message || "Invalid OTP code");
      }
    } catch (err) {
      setOtpError(err.message || "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRemoveStaff = async (centralUserId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the media house?`)) return;
    
    try {
      const response = await api.staff.remove(centralUserId);
      if (response?.success) {
        toast.success(`${name} has been removed.`);
        hasFetchedRef.current = false;
        fetchUsers(true);
      } else {
        toast.error(response?.message || "Failed to remove member");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred during removal");
    }
  };

  const handleAssignOrUpdateRole = async (user, newRole) => {
    if (!newRole || newRole === user.role) return;
    setAssigningRoleFor(user.id);

    // Determine if this is a first-time assignment or an update
    const isFirstAssign = !user.role || ['n/a', 'member', ''].includes(user.role.toLowerCase());

    try {
      const response = isFirstAssign
        ? await api.staff.assignRole(user.centralUserId, newRole)
        : await api.staff.updateRole(user.centralUserId, newRole);

      if (response?.success) {
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, role: newRole } : u
        ));
        toast.success(`Role ${isFirstAssign ? 'assigned' : 'updated'} to ${newRole} successfully!`);
      } else {
        toast.error(response?.message || `Failed to ${isFirstAssign ? 'assign' : 'update'} role`);
      }
    } catch (err) {
      toast.error(err.message || "An error occurred while updating role");
    } finally {
      setAssigningRoleFor(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight uppercase mb-1">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage team permissions and access controls across your media nodes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggleMembers}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${
              showMembers 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' 
                : 'bg-white dark:bg-slate-900 text-black dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'
            }`}
          >
            {showMembers ? <EyeOff size={16} /> : <Eye size={16} />}
            {showMembers ? 'Hide Members' : 'View Members'}
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-[0.98]"
          >
            <UserPlus size={16} />
            Add Person
          </button>
        </div>
      </div>

      {showMembers && (<>
      {/* TABLE FILTERS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 ring-black/5 dark:ring-white/5 outline-none transition-all dark:text-white"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all dark:text-white">
            <Filter size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* USERS TABLE — only visible when toggled */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-200">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User Details</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {isPageLoading ? (
              <tr>
                <td colSpan="5" className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300 mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading team members...</p>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-slate-300" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">No users found</h3>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters.</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user.id || index} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-black text-xs shadow-sm overflow-hidden">
                        {user.avatar ? <img src={getFullImageUrl(user.avatar)} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{user.name}</p>
                        <p className="text-[10px] font-medium text-slate-400 lowercase">{user.seanebId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <InlineRoleSelector
                      currentRole={user.role}
                      userId={user.id}
                      isLoading={assigningRoleFor === user.id}
                      onRoleChange={(newRole) => handleAssignOrUpdateRole(user, newRole)}
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail size={12} />
                        <span className="text-[10px] font-bold tracking-tight">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone size={12} />
                        <span className="text-[10px] font-bold tracking-tight">{user.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      user.status === 'Active' ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                      <button 
                        onClick={() => handleRemoveStaff(user.centralUserId, user.name)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </>)}

      {/* ADD PERSON MODAL — rendered via portal to escape layout overflow-hidden */}
      {isAddModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
            {/* Full-screen blur overlay */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />

            {/* Card */}
            <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div>
                  <h2 className="text-lg font-black text-black dark:text-white tracking-tight uppercase">Add New Member</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Invite someone to collaborate on your media nodes.</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="ml-4 p-2 text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 px-6 py-5 overflow-visible">
                <form onSubmit={handleAddUser} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <div className="flex gap-2">
                      <div className="w-28 shrink-0">
                        <CountrySelector
                          value={formData.country_code}
                          onChange={(code) => setFormData({ ...formData, country_code: code })}
                        />
                      </div>
                      <Input
                        placeholder="10-digit number"
                        className="flex-1"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>



                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                      Send Invitation
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-500 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}



      {/* OTP VERIFICATION MODAL — portal */}
      {otpModal.isOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setOtpModal(prev => ({ ...prev, isOpen: false }))}
            />

            <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h2 className="text-base font-black text-black dark:text-white tracking-tight uppercase">Verify Connection</h2>
                <button
                  onClick={() => setOtpModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 px-6 py-5 overflow-hidden">
                <OtpInputCard
                  otp={otpModal.otp}
                  setOtp={(val) => setOtpModal(prev => ({ ...prev, otp: val }))}
                  onVerify={handleVerifyOtp}
                  timer={otpTimer}
                  loading={otpLoading}
                  error={otpError}
                  title=""
                  description={`Enter the 4-digit code sent to ${maskMobile(otpModal.countryCode + otpModal.target)}`}
                  buttonText="Authenticate"
                />
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* REGISTRATION REDIRECT LOTTIE OVERLAY */}
      {registrationRedirectMode && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"></div>
            <div className="relative z-10 flex flex-col items-center justify-center bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl w-[320px] animate-in zoom-in-95 duration-500 overflow-hidden border border-slate-100 dark:border-slate-800">
               <Lottie 
                 animationData={successAnimation} 
                 loop={false} 
                 className="w-40 h-40"
               />
               <p className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white mt-4 text-center">
                 Redirecting...
               </p>
               <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-2 text-center">
                 Initiating Profile Setup
               </p>
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

// Role Dropdown Component
function RoleDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = ROLE_OPTIONS.find(r => r.value === value)?.label || '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all focus:ring-4 ring-black/5 dark:ring-white/5 ${
          isOpen ? 'border-black dark:border-white ring-4' : 'border-slate-100 dark:border-slate-700/50 hover:border-slate-200'
        }`}
      >
        <span className={selectedLabel ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
          {selectedLabel || 'Select a role...'}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {ROLE_OPTIONS.map((role) => (
            <li
              key={role.value}
              onClick={() => { onChange(role.value); setIsOpen(false); }}
              className={`px-4 py-2.5 cursor-pointer text-sm font-bold transition-colors flex items-center justify-between ${
                value === role.value 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield size={12} />
                <span className="uppercase tracking-widest text-[10px] font-black">{role.label}</span>
              </div>
              {value === role.value && <Check size={14} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Inline Role Selector — uses portal so dropdown is never clipped by table overflow
// Two modes: unassigned (dropdown visible) vs assigned (badge + pencil to edit)
function InlineRoleSelector({ currentRole, userId, isLoading, onRoleChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Check if role is already assigned (not empty / N/A / member)
  const isRoleAssigned = currentRole && 
    !['n/a', 'member', ''].includes(currentRole.toLowerCase());

  // Admin/owner roles are not editable
  const isAdminRole = currentRole && 
    ['admin', 'owner'].includes(currentRole.toLowerCase());

  useEffect(() => { setMounted(true); }, []);

  // Calculate position when dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4 + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentLabel = ROLE_OPTIONS.find(r => r.value === currentRole)?.label || currentRole || 'Assign';

  // Dropdown portal
  const dropdownMenu = isOpen && mounted && createPortal(
    <ul
      ref={dropdownRef}
      style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="min-w-[140px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl py-1 overflow-hidden"
    >
      {ROLE_OPTIONS.map((role) => (
        <li
          key={role.value}
          onClick={() => {
            if (role.value !== currentRole) {
              onRoleChange(role.value);
            }
            setIsOpen(false);
          }}
          className={`px-3 py-2 cursor-pointer text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between gap-3 ${
            currentRole === role.value
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield size={10} />
            {role.label}
          </div>
          {currentRole === role.value && <Check size={12} />}
        </li>
      ))}
    </ul>,
    document.body
  );

  // MODE 1: Role NOT assigned — show dropdown button for first-time assignment
  if (!isRoleAssigned) {
    return (
      <>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
            isOpen
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Shield size={10} />
          )}
          Assign Role
          <ChevronDown size={10} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {dropdownMenu}
      </>
    );
  }

  // MODE 2: Role IS assigned — show static badge only (+ pencil if not admin/owner)
  return (
    <>
      <div className="inline-flex items-center gap-2" ref={buttonRef}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <Shield size={10} />
          {currentLabel}
        </span>
        {!isAdminRole && (
          <button
            type="button"
            onClick={() => !isLoading && setIsOpen(!isOpen)}
            disabled={isLoading}
            className={`p-1.5 rounded-lg transition-all ${
              isOpen
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Update role"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Edit2 size={13} />}
          </button>
        )}
      </div>
      {!isAdminRole && dropdownMenu}
    </>
  );
}

// Sub-components for cleaner code

function Label({ children }) {
  return (
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{children}</label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input 
      className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 ring-black/5 dark:ring-white/5 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-white ${className}`}
      {...props}
    />
  );
}