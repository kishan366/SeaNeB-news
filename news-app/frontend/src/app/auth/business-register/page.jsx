"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Lottie from "lottie-react";
import animationData from "@/lottie/animation.json";
import Logo from '@/components/ui/Logo';
import LanguageSelect from '@/components/ui/LanguageSelect';
import { Building2, ShieldCheck, MapPin, Check, Zap, FileText } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import api from '@/lib/apiconfig';

import StepOne from '@/components/business/StepOne';
import StepTwo from '@/components/business/StepTwo';
import StepThree from '@/components/business/StepThree';
import StepFour from '@/components/business/StepFour';
import StepFive from '@/components/business/StepFive';

import en from "@/i18n/en";
import hi from "@/i18n/hi";
import gu from "@/i18n/gu";

const languages = { en, hi, gu };

const BusinessRegister = () => {
  const router = useRouter();
  const [lang, setLang] = useState('en');
  const t = languages[lang];
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Centralized State
  const [formData, setFormData] = useState({
    business_name: "",
    display_name: "",
    seaneb_id: "",
    primary_country_code: "+91",
    primary_number: "",
    whatsapp_country_code: "+91",
    whatsapp_number: "",
    business_email: "",
    website_url: "",
    address: "",
    landmark: "",
    place_id: "",
    pan_number: "",
    gstin: "",
    // Verification trackers
    isIdAvailable: null,
    touchedId: false,
    emailVerified: false,
    phoneVerified: false,
    whatsappVerified: false,
    sameAsPrimary: false
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [citySearch, setCitySearch] = useState('');
  const [stateName, setStateName] = useState('');

  const [businessImages, setBusinessImages] = useState([]);
  const [businessPlaceId, setBusinessPlaceId] = useState('');

  // Payment States
  const [paymentPreview, setPaymentPreview] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [registeredBranchId, setRegisteredBranchId] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [parentBusinessId, setParentBusinessId] = useState(null);

  // Logo States
  const [branch_logo, setBranchLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [initialStepDone, setInitialStepDone] = useState(false);
  const productKey = process.env.NEXT_PUBLIC_PRODUCT_KEY;
  const NEXT_PUBLIC_CASHFREE_MODE = process.env.NEXT_PUBLIC_CASHFREE_MODE;

  useEffect(() => {
    if (!initialStepDone && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('step') === 'payment') setStep(5);
      const bizId = urlParams.get('business_id');
      if (bizId) setParentBusinessId(bizId);
      setInitialStepDone(true);
    }
  }, [initialStepDone]);

  useEffect(() => {
    let cancelled = false;
    const urlParams = new URLSearchParams(window.location.search);
    const initialStep = urlParams.get('step');

    const checkRegistration = async () => {
      setCheckingStatus(true);
      try {
        let response = await api.user.getBusinesses();
        if (!response?.success) response = await api.user.getProfile();
        if (cancelled) return;

        if (response?.success && response.data) {
          const data = response.data;
          let branch = null;
          let isRegistered = false;

          if (Array.isArray(data)) {
            if (data.length > 0) {
              const firstBiz = data[0];
              const branches = firstBiz.branches || firstBiz.Branches || [];
              branch = branches[0];
              isRegistered = true;
            }
          } else {
            const branches = data.Branches || data.branches || [];
            const onboarding = data.onboarding || {};
            branch = branches[0] || onboarding.branch || data.branch;
            isRegistered = data.is_business_registered || branches.length > 0 || !!onboarding.branch_id || !!data.branch_id;
          }

          if (isRegistered) {
            const onboardingStatus = branch ? Number(branch.onboarding_status) : null;
            const isPaymentDone = (onboardingStatus === 1);
            const isNewMode = urlParams.get('mode') === 'new' || urlParams.get('mode') === 'new-biz';
            const hasBusinessId = urlParams.get('business_id');

            if (!isPaymentDone && !isNewMode && !hasBusinessId) {
              const branchId = branch?.branch_id || data.onboarding?.branch_id || data.branch_id || (Array.isArray(data) ? data[0]?.id : null);
              if (branchId) {
                setRegisteredBranchId(branchId);
                setStep(5);
                await fetchPaymentPreview(); 
              }
            } else if (isPaymentDone && !isNewMode && !hasBusinessId) {
              window.location.href = '/media-house/profile';
              return;
            }
          } else {
            setStep(1);
          }
        } else {
          if (initialStep === "payment") setStep(1);
        }
      } catch (e) {
        console.error("Check registration error:", e);
        if (initialStep === "payment") setStep(1);
      } finally {
        if (!cancelled) setCheckingStatus(false);
      }
    };

    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await api.category.getCategories(productKey);
        if (data && data.success) {
          setCategories(data.data || []);
          if (data.data && data.data.length > 0) setSelectedCategory(data.data[0]);
        }
      } catch (error) {
        showNotification('Error loading categories', 'error');
      } finally {
        setLoadingCategories(false);
      }
    };

    const timer = setTimeout(() => {
      if (cancelled) return;
      fetchCategories();
      checkRegistration();
    }, initialStep === "payment" ? 0 : 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [productKey, router]);

  const showNotification = (message, type = 'error') => {
    const messageStr = typeof message === 'object' ? (message?.message || message?.error || JSON.stringify(message)) : String(message);
    setNotification({ show: true, message: messageStr, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const fetchPaymentPreview = async () => {
    setLoadingPayment(true);
    setPaymentPreview(null);
    try {
      const response = await api.payment.getOnboardingChargePreview();
      if (response && response.success) {
        setPaymentPreview(response.data);
      } else {
        showNotification("Failed to fetch charges", "error");
      }
    } catch (error) {
      console.error("Error fetching payment preview:", error);
      showNotification("Could not load payment summary. Trying with manual default if available.", "warning");
      setPaymentPreview({ description: "Standard Onboarding", base_amount: 100, gst_percentage: 18 });
    } finally {
      setLoadingPayment(false);
    }
  };

  const startPayment = async (sessionId, orderId) => {
    try {
      const cashfree = window.Cashfree({ mode: NEXT_PUBLIC_CASHFREE_MODE });
      const result = await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_modal" });
      if (result && result.error) {
        showNotification(result.error.message || "Payment failed", "error");
        return;
      }
      setRegistrationSuccess(true);
      setLoading(true);
      showNotification("Registration successful! Setting up workspace...", "success");
      setTimeout(async () => {
        try {
          const response = await api.staff.getMe();
          if (response?.success && response?.data?.role) {
            localStorage.setItem('user_role', response.data.role.toLowerCase());
          }
        } catch (err) {
          console.error("Failed to fetch user role after payment:", err);
        }
        window.location.href = '/media-house/profile';
      }, 1500);
    } catch (err) {
      console.error("Payment error:", err);
      showNotification("Payment process interrupted", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let token = apiClient.getToken();
    if (!token) token = await apiClient.refreshToken();
    if (!token) {
      showNotification('Session expired. Please login again.', 'error');
      setTimeout(() => router.push("/auth/login"), 1500);
      return;
    }

    setLoading(true);

    if (registeredBranchId) {
      try {
        const response = await api.payment.payNow({ branch_id: registeredBranchId });
        const sessionId = response?.payment_session_id || response?.data?.payment_session_id;
        const orderId = response?.order_id || response?.data?.order_id;
        if (sessionId) {
          showNotification("Redirecting to payment...", "success");
          await startPayment(sessionId, orderId);
        } else {
          showNotification("Failed to initiate payment session", "error");
        }
      } catch (error) {
        console.error("Payment initiation error:", error);
        showNotification(error?.message || "Payment initiation failed", "error");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const fData = new FormData();
      if (parentBusinessId) fData.append('business_id', parentBusinessId);
      fData.append('business_name', formData.business_name.trim().substring(0, 30));
      fData.append('display_name', (formData.display_name || formData.business_name).trim().substring(0, 30));
      fData.append('main_category_id', selectedCategory.main_category_id);
      fData.append('seaneb_id', formData.seaneb_id.trim().substring(0, 20));
      fData.append('country_code', formData.primary_country_code);
      fData.append('primary_number', formData.primary_number.trim());
      
      if (formData.whatsapp_number && formData.whatsapp_number.trim() !== "") {
        fData.append('whatsapp_country_code', formData.whatsapp_country_code);
        fData.append('whatsapp_number', formData.whatsapp_number.trim());
      }
      
      fData.append('business_email', (formData.business_email || "").trim().substring(0, 50));
      fData.append('website_url', (formData.website_url || "").trim());
      fData.append('about_branch', "Head office branch");
      fData.append('address', (formData.address || "").trim().substring(0, 100));
      fData.append('landmark', (formData.landmark || "").trim().substring(0, 50));
      fData.append('place_id', formData.place_id);
      fData.append('business_place_id', businessPlaceId || formData.place_id);

      if (businessImages && businessImages.length > 0) {
        businessImages.forEach((img) => fData.append('photo_references', img));
      }
      if (branch_logo) fData.append('branch_logo', branch_logo);

      const response = await api.business.create(fData);

      if (response && response.success) {
        const branchId = response.data?.branch_id || response.data?.branch?.branch_id;
        if (branchId) setRegisteredBranchId(branchId);
        const sessionId = response.data?.payment_session_id;
        const orderId = response.data?.order_id;
        if (sessionId) {
          showNotification("Business created! Redirecting to payment...", "success");
          await fetchPaymentPreview();
          setStep(5);
          await startPayment(sessionId, orderId);
        } else {
          showNotification("Business created but payment session failed. Please retry payment.", "warning");
          await fetchPaymentPreview();
          setStep(5);
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error.status === 401) {
        showNotification("Session expired. Please login again.", "error");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        const errorMsg = error?.data?.error?.message || error?.data?.message || error?.message || "Registration failed";
        showNotification(errorMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOnboarding = async () => {
    const confirmMessage = "Are you sure you want to cancel your business registration? All your current setup progress will be cleared.";
    if (!window.confirm(confirmMessage)) return;
    const branchId = paymentPreview?.branch_id || registeredBranchId;
    const LISTING_URL = process.env.NEXT_PUBLIC_LISTING_URL || "/";

    setLoading(true);
    try {
      if (branchId) await api.payment.cancelOnboarding({ branch_id: branchId });
      showNotification("Registration cancelled successfully.", "error");
      setTimeout(() => { window.location.href = LISTING_URL; }, 1000);
    } catch (error) {
      const msg = error.data?.message || error.message || "Failed to cancel onboarding";
      showNotification(msg, "error");
      setTimeout(() => { window.location.href = LISTING_URL; }, 1000);
    } finally {
      if (mounted) setLoading(false);
    }
  };

  const steps = [
    { id: 1, icon: <Building2 size={20} />, label: t.business || "Business" },
    { id: 2, icon: <ShieldCheck size={20} />, label: t.legal || "Legal" },
    { id: 3, icon: <MapPin size={20} />, label: t.location || "Location" },
    { id: 4, icon: <FileText size={20} />, label: "Review" },
    { id: 5, icon: <Zap size={20} />, label: t.payment || "Payment" }
  ];

  if (loadingCategories || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{checkingStatus ? "Verifying status..." : "Loading categories..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-slate-50 to-white p-4 font-sans relative">
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-slide-in ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      {(loading || registrationSuccess) && (
        <div className="fixed inset-0 z-100 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-64 h-64 mb-4">
            <Lottie animationData={animationData} loop={true} />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {registrationSuccess ? "Registration Successful!" : "Processing Your Registration"}
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
            {registrationSuccess 
              ? "Your business profile is now active. Redirecting you to your new workspace..." 
              : "Please wait while we set up your business workspace. Scaling your brand to the next level..."}
          </p>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white px-8 py-6 md:px-10 md:py-7 rounded-[25px] shadow-xl border border-slate-100 my-2">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Logo width={36} height={36} />
          </div>
          <LanguageSelect value={lang} onChange={setLang} />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${step > s.id ? 'bg-green-500 border-green-500 text-white' : step === s.id ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>
                    {step > s.id ? <Check size={16} /> : React.cloneElement(s.icon, { size: 16 })}
                  </div>
                  <span className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${step >= s.id ? 'text-slate-900' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${step > index + 1 ? 'bg-green-500' : 'bg-slate-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <StepOne
              formData={formData}
              setFormData={setFormData}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              logoPreview={logoPreview}
              setLogoPreview={setLogoPreview}
              setBranchLogo={setBranchLogo}
              setBusinessImages={setBusinessImages}
              setBusinessPlaceId={setBusinessPlaceId}
              onNext={() => setStep(2)}
              handleCancelOnboarding={handleCancelOnboarding}
              t={t}
              showNotification={showNotification}
              registeredBranchId={registeredBranchId}
            />
          )}

          {step === 2 && (
            <StepTwo
              formData={formData}
              setFormData={setFormData}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              handleCancelOnboarding={handleCancelOnboarding}
              t={t}
              showNotification={showNotification}
            />
          )}

          {step === 3 && (
            <StepThree
              formData={formData}
              setFormData={setFormData}
              citySearch={citySearch}
              setCitySearch={setCitySearch}
              stateName={stateName}
              setStateName={setStateName}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
              handleCancelOnboarding={handleCancelOnboarding}
              t={t}
              showNotification={showNotification}
            />
          )}

          {step === 4 && (
            <StepFour
              formData={formData}
              citySearch={citySearch}
              stateName={stateName}
              selectedCategory={selectedCategory}
              onNext={async () => {
                await fetchPaymentPreview();
                setStep(5);
              }}
              onBack={() => setStep(3)}
              t={t}
              logoPreview={logoPreview}
            />
          )}

          {step === 5 && (
            <StepFive
              loadingPayment={loadingPayment}
              paymentPreview={paymentPreview}
              fetchPaymentPreview={fetchPaymentPreview}
              registeredBranchId={registeredBranchId}
              onBack={() => setStep(4)}
              handleCancelOnboarding={handleCancelOnboarding}
              loading={loading}
              lang={lang}
              t={t}
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default BusinessRegister;