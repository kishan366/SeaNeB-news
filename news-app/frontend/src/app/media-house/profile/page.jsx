"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Phone,
  Store,
  Loader2,
  AlertCircle,
  X,
  Eye,
  Building2,
  ShieldCheck,
  Users,
  Edit2,
  CheckCircle2,
  Save,
  Undo2,
  Mail,
  Camera
} from 'lucide-react';
import api, { getFullImageUrl, OTP_PURPOSE, EMAIL_OTP_PURPOSE } from '@/lib/apiconfig';
import { useBranch } from '@/context/BranchContext';
import OtpInputCard from '@/components/ui/OtpInputCard';
import CountrySelector from '@/components/ui/CountrySelector';
import GallerySection from '@/components/media-house/GallerySection';

const toast = {
  success: (msg) => alert(`SUCCESS: ${msg}`),
  error: (msg) => alert(`ERROR: ${msg}`),
  info: (msg) => alert(`INFO: ${msg}`)
};

const maskMobile = (mobile) => {
  if (!mobile) return "your account";
  const clean = mobile.replace(/\D/g, '');
  if (clean.length < 10) return mobile;

  const countryCode = clean.length > 10 ? clean.slice(0, clean.length - 10) : '91';
  const body = clean.slice(-10);
  const last2 = body.slice(-2);
  return `+${countryCode} ${body.slice(0, 2)}XXXXXX${last2}`;
};

export default function BusinessProfilePage() {
  const router = useRouter();
  const { selectedBranch, userProfile, loading: contextLoading } = useBranch();
  const [loading, setLoading] = useState(false);
  const [businessData, setBusinessData] = useState(null);
  const [error, setError] = useState(null);



  // Edit Mode & Contact Info States
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    primary_number: '',
    country_code: '+91',
    whatsapp_number: '',
    whatsapp_country_code: '+91',
    business_email: '',
    website_url: '',
    address: '',
    landmark: '',
    pan_number: '',
    gstin: '',
    branch_logo: null
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const branchLogoRef = useRef(null);

  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    whatsapp: false,
    primary: false
  });

  const [otpModal, setOtpModal] = useState({
    otp: ['', '', '', ''],
    target: '',
    countryCode: ''
  });

  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // OTP Timer Logic
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Sync formData with businessData
  useEffect(() => {
    if (businessData) {
      // If primary_number contains country code (starts with 91 or +91 and is > 10 digits), try to split
      let pNum = businessData.primary_number || '';
      let cCode = businessData.country_code || '+91';

      // Heuristic splitting if needed
      if (pNum.length > 10) {
        if (pNum.startsWith('91')) {
          cCode = '+91';
          pNum = pNum.slice(2);
        } else if (pNum.startsWith('+91')) {
          cCode = '+91';
          pNum = pNum.slice(3);
        }
      }

      let wNum = businessData.whatsapp_number || '';
      let wCode = businessData.whatsapp_country_code || '+91';

      if (wNum.length > 10) {
        if (wNum.startsWith('91')) {
          wCode = '+91';
          wNum = wNum.slice(2);
        } else if (wNum.startsWith('+91')) {
          wCode = '+91';
          wNum = wNum.slice(3);
        }
      }

      setFormData({
        primary_number: pNum,
        country_code: cCode.startsWith('+') ? cCode : `+${cCode}`,
        whatsapp_number: wNum,
        whatsapp_country_code: wCode.startsWith('+') ? wCode : `+${wCode}`,
        business_email: businessData.business_email || '',
        website_url: businessData.website_url || '',
        address: businessData.address || '',
        landmark: businessData.landmark || '',
        pan_number: businessData.pan_number || '',
        gstin: businessData.gstin || '',
        branch_logo: null
      });
      setLogoPreview(getFullImageUrl(businessData.branch_logo));
      setVerificationStatus({
        email: true,
        whatsapp: true,
        primary: true
      });
    }
  }, [businessData]);

  // Listen for global branch changes
  useEffect(() => {
    if (!selectedBranch) return;

    const fetchGalleryOnly = async () => {
      try {
        setLoading(true);
        // Start with basic branch details from context
        const branchWithGallery = { ...selectedBranch };

        // Fetch specific gallery images via dedicated endpoint
        const branchId = selectedBranch.branch_id || selectedBranch.id;
        if (branchId) {
          const galleryResponse = await api.gallery.getGallery(branchId);
          if (galleryResponse?.success) {
            branchWithGallery.BusinessGalleries = galleryResponse.data || [];
          }
        }

        setBusinessData(branchWithGallery);
      } catch (err) {
        console.error("Gallery Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryOnly();
  }, [selectedBranch]);

  // Combined loading state
  const isAllLoading = loading || contextLoading;

  const business = businessData?.Business;
  const galleries = businessData?.BusinessGalleries || [];

  // CONTACT INFO HANDLERS
  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edits
      setFormData({
        primary_number: businessData.primary_number || '',
        country_code: businessData.country_code || '+91',
        whatsapp_number: businessData.whatsapp_number || '',
        whatsapp_country_code: businessData.whatsapp_country_code || '+91',
        business_email: businessData.business_email || '',
        website_url: businessData.website_url || '',
        address: businessData.address || '',
        landmark: businessData.landmark || '',
        pan_number: businessData.pan_number || '',
        gstin: businessData.gstin || '',
        branch_logo: null
      });
      setLogoPreview(getFullImageUrl(businessData.branch_logo));
      setIsEditMode(false);
    } else {
      setIsEditMode(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Reset verification if field changed
    if (name === 'business_email' && value !== businessData.business_email) {
      setVerificationStatus(prev => ({ ...prev, email: false }));
    }
    if (name === 'whatsapp_number' && value !== businessData.whatsapp_number) {
      setVerificationStatus(prev => ({ ...prev, whatsapp: false }));
    }
    if (name === 'primary_number' && value !== businessData.primary_number) {
      setVerificationStatus(prev => ({ ...prev, primary: false }));
    }
  };

  const handleCountryChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, branch_logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const startOtpSequence = async (type, target = null) => {
    setOtpError('');
    setOtpLoading(true);
    try {
      let finalTarget = target || (type === 'email' ? formData.business_email : (type === 'whatsapp' ? formData.whatsapp_number : formData.primary_number));

      if (!finalTarget) {
        toast.error(`Please provide ${type} identifier first`);
        return;
      }

      let response;
      if (type === 'email') {
        response = await api.auth.sendEmailOtp({
          email: finalTarget,
          purpose: EMAIL_OTP_PURPOSE.BUSINESS_VERIFY
        });
      } else {
        // Primary or WhatsApp via new number
        const cleanMobile = finalTarget.replace(/\D/g, '');
        const finalCC = (type === 'primary' ? formData.country_code : formData.whatsapp_country_code).replace(/\D/g, '');

        response = await api.auth.sendOtp({
          identifier_type: 0,
          country_code: finalCC.startsWith('+') ? finalCC : `+${finalCC}`,
          mobile_number: cleanMobile,
          purpose: OTP_PURPOSE.BUSINESS_UPDATE,
          via: type === 'whatsapp' ? 'whatsapp' : 'sms',
          product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
        });
      }

      if (response?.success) {
        let finalCC = (type === 'primary' ? formData.country_code : formData.whatsapp_country_code);
        if (type === 'email') finalCC = '';

        setOtpModal({
          isOpen: true,
          type,
          otp: ['', '', '', ''],
          target: finalTarget,
          countryCode: finalCC.startsWith('+') || !finalCC ? finalCC : `+${finalCC}`
        });
        setOtpTimer(60);
      } else {
        toast.error(response?.message || "Failed to send OTP");
      }
    } catch (err) {
      toast.error(err.message || "Failed to trigger OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const otpValue = otpModal.otp.join('');
      let response;
      if (otpModal.type === 'email') {
        response = await api.auth.verifyEmailOtp({
          email: otpModal.target,
          otp: otpValue,
          purpose: EMAIL_OTP_PURPOSE.BUSINESS_VERIFY
        });
      } else {
        response = await api.auth.verifyOtp({
          identifier_type: 0,
          country_code: otpModal.countryCode,
          mobile_number: otpModal.target,
          otp: otpValue,
          purpose: OTP_PURPOSE.BUSINESS_UPDATE,
          product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
        });
      }

      if (response?.success) {
        setVerificationStatus(prev => ({ ...prev, [otpModal.type]: true }));
        setOtpModal(prev => ({ ...prev, isOpen: false }));
        toast.success(`${otpModal.type === 'email' ? 'Email' : 'Number'} verified!`);

        if (otpModal.type === 'primary') {
          finalizeUpdate();
        }
      } else {
        setOtpError(response?.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError(err.message || "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const finalizeUpdate = async () => {
    setIsUpdating(true);
    try {
      const data = new FormData();
      data.append('branch_id', businessData.id || businessData.branch_id);

      if (formData.primary_number !== businessData.primary_number) {
        data.append('primary_number', formData.primary_number);
        data.append('country_code', formData.country_code);
      }

      if (formData.whatsapp_number !== businessData.whatsapp_number && verificationStatus.whatsapp) {
        data.append('whatsapp_number', formData.whatsapp_number);
        data.append('whatsapp_country_code', formData.whatsapp_country_code);
      }

      if (formData.business_email !== businessData.business_email && verificationStatus.email) {
        data.append('business_email', formData.business_email);
      }

      if (formData.website_url !== businessData.website_url) data.append('website_url', formData.website_url);
      if (formData.address !== businessData.address) data.append('address', formData.address);
      if (formData.landmark !== businessData.landmark) data.append('landmark', formData.landmark);
      if (formData.pan_number !== businessData.pan_number) data.append('pan_number', formData.pan_number);
      if (formData.gstin !== businessData.gstin) data.append('gstin', formData.gstin);

      if (formData.branch_logo) {
        data.append('branch_logo', formData.branch_logo);
      }

      let count = 0;
      for (let pair of data.entries()) {
        if (pair[0] !== 'branch_id') count++;
      }

      if (count === 0) {
        toast.success("No changes detected or verified");
        setIsEditMode(false);
        return;
      }

      const response = await api.business.update(data);
      if (response?.success) {
        toast.success("Business updated successfully");
        setIsEditMode(false);
        window.location.reload();
      } else if (response?.otp_required) {
        toast.info("Security verification required for primary number");
        const meta = response.meta?.[0];
        const targetNum = meta?.mobile_number || formData.primary_number;
        // Call startOtpSequence to actually SEND the OTP
        startOtpSequence('primary', targetNum);
      } else {
        toast.error(response?.message || "Update failed");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateClick = () => {
    if (formData.business_email && formData.business_email !== businessData.business_email && !verificationStatus.email) {
      return toast.error("Please verify your new email first");
    }

    if (formData.whatsapp_number && formData.whatsapp_number !== businessData.whatsapp_number && !verificationStatus.whatsapp) {
      return toast.error("Please verify your new WhatsApp number first");
    }

    finalizeUpdate();
  };

  if (isAllLoading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-black animate-spin mb-4" />
        <p className="text-[#999999] font-medium tracking-widest text-[10px] uppercase">Refining Profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl border border-[#e5e5e5] shadow-sm max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-black mx-auto mb-4" />
          <h2 className="text-xl font-bold text-black mb-2">Notice</h2>
          <p className="text-[#999999] text-sm mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-black text-white rounded-lg font-bold hover:bg-black/90 transition-all uppercase text-[10px] tracking-[0.2em]"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-white border border-[#e5e5e5] rounded-full flex items-center justify-center mx-auto mb-6 text-[#999999]">
          <Store size={32} />
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">Entity Not Found</h2>
        <p className="text-[#999999] text-sm max-w-xs mx-auto mb-10 leading-relaxed">No registered business profile could be retrieved for this account.</p>
        <button
          onClick={() => router.push('/media-house')}
          className="px-10 py-4 bg-black text-white rounded-lg font-bold hover:bg-black/90 transition-all uppercase text-[10px] tracking-[0.2em]"
        >
          Back to Console
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-slate-50/20 dark:bg-slate-950 pb-10 md:pb-20">
      <main className="max-w-7xl mx-auto pt-1 md:pt-2 px-0 sm:px-4 md:px-0">

        {/* PAGE BREADCRUMB / TITLE */}
        <div className="mb-4 flex items-center gap-3 px-4 sm:px-0 opacity-80">
          <div className="w-1.5 h-5 bg-slate-900 dark:bg-white rounded-full"></div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400"><span className="text-slate-900 dark:text-white">Profile</span></h2>
        </div>

        {/* COMPACT BANNER SLIDER */}
        <div className="max-w-5xl mx-auto px-4 w-full mb-10">
          <div className="bg-white dark:bg-slate-900 sm:rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-sm relative group">

            <GallerySection businessData={businessData} setBusinessData={setBusinessData} />

            {/* PROFILE INFO - BELOW BANNER */}
            <div className="relative px-6 sm:px-10 pb-8">
              {/* CIRCULAR LOGO OVERLAPPING */}
              <div className="relative z-20 -mt-10 md:-mt-12 w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white dark:border-slate-900 bg-white shadow-lg overflow-hidden flex items-center justify-center shrink-0 group/logo pointer-events-auto">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="bg-[#f5f5f5] w-full h-full flex items-center justify-center text-[#999999]">
                    <Store size={32} className="md:w-10 md:h-10" />
                  </div>
                )}

                {isEditMode && (
                  <button
                    onClick={() => branchLogoRef.current?.click()}
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity text-white"
                  >
                    <Camera size={20} className="mb-1" />
                    <span className="text-[9px] font-black uppercase">Change Logo</span>
                  </button>
                )}
                <input
                  type="file"
                  ref={branchLogoRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoSelect}
                />
              </div>

              {/* BOLD IDENTITY */}
              <div className="mt-4">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-1 truncate">
                  {businessData?.branch_name || business?.business_name}
                </h1>
                <p className="text-sm text-slate-500 font-medium tracking-wide flex items-center gap-1.5 truncate">
                  <ShieldCheck size={16} className="text-indigo-500" />
                  {business?.display_name || "Official Identity"}
                </p>
              </div>
            </div>


          </div>
        </div>

        {/* ACTION CENTER: STATUS, ACTIONS */}
        <div className="bg-white dark:bg-slate-900 sm:rounded-3xl p-5 md:p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row gap-5 md:gap-8 items-start md:items-center">

          {/* STATUS & ROLE */}
          <div className="flex flex-wrap gap-4 shrink-0 w-full md:w-auto">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 flex-1 md:flex-none">
              <div className="w-6 h-6 rounded-full bg-emerald-500 shadow-sm flex items-center justify-center">
                <Eye size={10} className="text-white" />
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Node Status</p>
                <p className="text-[10px] font-bold text-slate-800 dark:text-white uppercase">Sync: Verified</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 flex-1 md:flex-none">
              <div className="w-6 h-6 rounded-full bg-indigo-500 shadow-sm flex items-center justify-center">
                <Users size={10} className="text-white" />
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Authority</p>
                <p className="text-[10px] font-bold text-slate-800 dark:text-white uppercase truncate max-w-20">{userProfile?.full_name}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 md:gap-4 w-full md:w-auto">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-black flex items-center justify-center shadow-lg shrink-0">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Tag</p>
                <p className="text-[10px] md:text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter truncate">{businessData.seaneb_id}</p>
              </div>
            </div>
          </div>

          {/* ACTION CENTER */}
          <div className="hidden md:block h-12 w-px bg-slate-100 dark:bg-slate-800 shrink-0"></div>

          <div className="flex flex-wrap gap-8 flex-1 items-center w-full">
            <div className="flex flex-col w-full md:w-auto">
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Entity Propagation</p>
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 md:w-32 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-1000"
                    style={{ width: (Number(businessData.branch_status) === 1 && Number(businessData.onboarding_status) === 1) ? '100%' : '65%' }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 shrink-0">
                  {(Number(businessData.branch_status) === 1 && Number(businessData.onboarding_status) === 1) ? '100% Sync' : '65% Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CORE DATA SECTIONS */}
        <div className="space-y-6 md:space-y-8 px-4 sm:px-0">

          {/* ABOUT SECTION */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-3 bg-black dark:bg-white rounded-full"></div>
              <h3 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Node Description</h3>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl flex items-center gap-4 border border-slate-100 dark:border-slate-700/50">
              <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm shrink-0 border border-slate-100 dark:border-slate-700">
                <MapPin size={14} className="text-slate-400" />
              </div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                Primary Node Location: {businessData.location?.city ? `${businessData.location.city}, ${businessData.location.area || ''}` : "Unspecified"}
              </p>
            </div>
          </div>

          {/* TWO COLUMN GRID FOR DETAILED SPECS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">

            {/* CONTACT INFORMATION */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-4xl p-6 md:p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col">
              <div className="flex items-center justify-between gap-4 mb-6 md:mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div>
                  <h3 className="text-[10px] md:text-[11px] font-black text-black dark:text-white uppercase tracking-[0.2em] md:tracking-[0.3em]">Contact Information</h3>
                </div>
                <button
                  onClick={handleEditToggle}
                  className={`p-2 rounded-lg transition-all ${isEditMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-400 hover:text-black hover:bg-slate-100'}`}
                >
                  {isEditMode ? <Undo2 size={16} /> : <Edit2 size={16} />}
                </button>
              </div>

              <div className="space-y-6">
                {/* Primary Number Row */}
                <div className="flex items-start group py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-black transition-all shadow-sm shrink-0 mt-1">
                    <Phone size={18} />
                  </div>
                  <div className="ml-5 flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Primary Number</p>
                    {isEditMode ? (
                      <div className="flex gap-2">
                        <CountrySelector
                          value={formData.country_code}
                          onChange={(val) => handleCountryChange('country_code', val)}
                        />
                        <input
                          type="text"
                          name="primary_number"
                          value={formData.primary_number}
                          onChange={handleInputChange}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-black outline-none transition-all"
                          placeholder="Enter primary number"
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-black truncate uppercase tracking-tight text-slate-900">
                        {formData.country_code} {formData.primary_number}
                      </p>
                    )}
                  </div>
                </div>

                {/* WhatsApp Row */}
                <div className="flex items-start group py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-black transition-all shadow-sm shrink-0 mt-1">
                    <Store size={18} />
                  </div>
                  <div className="ml-5 flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</p>
                      {isEditMode && formData.whatsapp_number && formData.whatsapp_number !== formData.primary_number && (
                        <button
                          onClick={() => startOtpSequence('whatsapp')}
                          disabled={verificationStatus.whatsapp}
                          className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-all flex items-center gap-1 ${verificationStatus.whatsapp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                        >
                          {verificationStatus.whatsapp ? <><CheckCircle2 size={10} /> Verified</> : "Verify"}
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <div className="flex gap-2">
                        <CountrySelector
                          value={formData.whatsapp_country_code}
                          onChange={(val) => handleCountryChange('whatsapp_country_code', val)}
                        />
                        <input
                          type="text"
                          name="whatsapp_number"
                          value={formData.whatsapp_number}
                          onChange={handleInputChange}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-black outline-none transition-all"
                          placeholder="Enter WhatsApp number"
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-black truncate uppercase tracking-tight text-slate-900">
                        {formData.whatsapp_country_code} {formData.whatsapp_number || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Row */}
                <div className="flex items-start group py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-black transition-all shadow-sm shrink-0 mt-1">
                    <Mail size={18} />
                  </div>
                  <div className="ml-5 flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                      {isEditMode && formData.business_email && formData.business_email !== businessData.business_email && (
                        <button
                          onClick={() => startOtpSequence('email')}
                          disabled={verificationStatus.email}
                          className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-all flex items-center gap-1 ${verificationStatus.email ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                        >
                          {verificationStatus.email ? <><CheckCircle2 size={10} /> Verified</> : "Verify"}
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <input
                        type="email"
                        name="business_email"
                        value={formData.business_email}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-black outline-none transition-all"
                        placeholder="Enter business email"
                      />
                    ) : (
                      <p className="text-sm font-black truncate uppercase tracking-tight text-slate-900">{businessData.business_email || "Not provided"}</p>
                    )}
                  </div>
                </div>

                {/* Logo/Avatar Row */}
                <div className="flex items-start group py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-black transition-all shadow-sm shrink-0 mt-1">
                    <Camera size={18} />
                  </div>
                  <div className="ml-5 flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Business Logo</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Store size={20} className="text-slate-200" />
                        )}
                      </div>
                      {isEditMode && (
                        <button
                          onClick={() => branchLogoRef.current?.click()}
                          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-slate-600"
                        >
                          Upload New
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isEditMode && (
                <div className="mt-10 pt-6 border-t border-slate-50 flex flex-col gap-4">
                  {/* Requirement 7: Show clear verification messages */}
                  <div className="space-y-2">
                    {formData.primary_number !== businessData.primary_number && !verificationStatus.primary && (
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight flex items-center gap-2">
                        <AlertCircle size={12} /> Primary number verification required
                      </p>
                    )}
                    {formData.business_email !== businessData.business_email && !verificationStatus.email && (
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight flex items-center gap-2">
                        <AlertCircle size={12} /> Email verification required
                      </p>
                    )}
                    {formData.whatsapp_number !== businessData.whatsapp_number && !verificationStatus.whatsapp && (
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight flex items-center gap-2">
                        <AlertCircle size={12} /> WhatsApp verification required
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleUpdateClick}
                      disabled={isUpdating}
                      className="flex-1 bg-black text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Update Node
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="flex-1 bg-slate-50 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BUSINESS INFORMATION */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-4xl p-6 md:p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col">
              <div className="flex items-center gap-4 mb-6 md:mb-10">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                <h3 className="text-[10px] md:text-[11px] font-black text-black dark:text-white uppercase tracking-[0.2em] md:tracking-[0.3em]">Business Information</h3>
              </div>

              <div className="space-y-6">
                <DetailRow icon={<Building2 size={18} />} label="Business Entity" value={business?.business_name} />
                <DetailRow icon={<Store size={18} />} label="Branch Name" value={businessData?.branch_name} />
                <DetailRow icon={<Eye size={18} />} label="SeaNeB ID" value={businessData?.seaneb_id} />
                <DetailRow icon={<Users size={18} />} label="Role" value="Administrator" />
                <DetailRow icon={<Users size={18} />} label="Account Owner" value={userProfile?.full_name} />
              </div>
            </div>

            {/* LOCATION INFORMATION */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-4xl p-6 md:p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col">
              <div className="flex items-center gap-4 mb-6 md:mb-10">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-[10px] md:text-[11px] font-black text-black dark:text-white uppercase tracking-[0.2em] md:tracking-[0.3em]">Location</h3>
              </div>

              <div className="space-y-6">
                <DetailRow
                  icon={<MapPin size={18} />}
                  label="City"
                  value={businessData.location?.city}
                />
                <DetailRow
                  icon={<MapPin size={18} />}
                  label="Address"
                  value={businessData.address}
                  isEditable={isEditMode}
                  name="address"
                  formDataValue={formData.address}
                  onChange={handleInputChange}
                />
                <DetailRow
                  icon={<MapPin size={18} />}
                  label="Landmark"
                  value={businessData.landmark}
                  isEditable={isEditMode}
                  name="landmark"
                  formDataValue={formData.landmark}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* STATUS & VERIFICATION */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-4xl p-6 md:p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col">
              <div className="flex items-center gap-4 mb-6 md:mb-10">
                <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div>
                <h3 className="text-[10px] md:text-[11px] font-black text-black dark:text-white uppercase tracking-[0.2em] md:tracking-[0.3em]">Status & Verification</h3>
              </div>

              <div className="space-y-6">
                <DetailRow
                  icon={<ShieldCheck size={18} />}
                  label="PAN Number"
                  value={businessData.pan_number}
                  isEditable={isEditMode}
                  name="pan_number"
                  formDataValue={formData.pan_number}
                  onChange={handleInputChange}
                />
                <DetailRow
                  icon={<ShieldCheck size={18} />}
                  label="GSTIN"
                  value={businessData.gstin}
                  isEditable={isEditMode}
                  name="gstin"
                  formDataValue={formData.gstin}
                  onChange={handleInputChange}
                />
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* OTP VERIFICATION MODAL */}
      {otpModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl p-10 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300 relative">
            <button
              onClick={() => setOtpModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-black transition-all"
            >
              <X size={20} />
            </button>

            <OtpInputCard
              otp={otpModal.otp}
              setOtp={(newOtp) => setOtpModal(prev => ({ ...prev, otp: newOtp }))}
              onVerify={handleVerifyOtp}
              onResend={() => startOtpSequence(otpModal.type)}
              timer={otpTimer}
              loading={otpLoading}
              error={otpError}
              title={`Verify ${otpModal.type === 'email' ? 'Email' : 'Connection'}`}
              description={`Enter the 4-digit code sent to ${otpModal.type === 'email' ? otpModal.target : maskMobile(otpModal.countryCode + otpModal.target)}`}
              buttonText="Authenticate"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// HELPER COMPONENTS FOR CLEANER CODE
function DetailRow({ icon, label, value, valueClass = "text-slate-900", isEditable, name, formDataValue, onChange }) {
  return (
    <div className="flex items-center group py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-all">
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-black transition-all shadow-sm shrink-0">
        {icon}
      </div>
      <div className="ml-5 flex-1 min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        {isEditable ? (
          <input
            type="text"
            name={name}
            value={formDataValue || ""}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold focus:border-black outline-none transition-all"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <p className={`text-sm font-black truncate uppercase tracking-tight ${valueClass}`}>{value || "—"}</p>
        )}
      </div>
    </div>
  );
}