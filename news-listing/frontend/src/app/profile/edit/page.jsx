"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import {
  ArrowLeft, Camera, User, Mail, Smartphone,
  Check, AlertCircle, Loader2, Save, Globe, Hash,
  Calendar, MapPin, Users, ChevronDown, Search, Pencil,
  CheckCircle2, X, LogOut
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import HometownAutocomplete from "@/components/ui/HometownAutocomplete";
import LanguageSelect from "@/components/ui/LanguageSelect";
import api, { getFullImageUrl } from "@/lib/apiconfig";

// Import translations
import en from "@/i18n/en";
import hi from "@/i18n/hi";
import gu from "@/i18n/gu";

const languages = { en, hi, gu };

import OtpInputCard from "@/components/ui/OtpInputCard";

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [lang, setLang] = useState('en');
  const t = languages[lang] || en;

  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    seaneb_id: "",
    profile_photo: "",
    gender: "",
    dob: "",
    hometown: "",
    place_id: ""
  });

  const [originalProfile, setOriginalProfile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState(false);
  const [isIdAvailable, setIsIdAvailable] = useState(null);

  const [otpTarget, setOtpTarget] = useState(""); // email or mobile_number
  const [otpVia, setOtpVia] = useState("sms"); // sms or whatsapp
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [mobileVerified, setMobileVerified] = useState(true);

  const fileInputRef = useRef(null);
  const genderRef = useRef(null);

  useEffect(() => {
    fetchProfile();

    const handleClickOutside = (event) => {
      if (genderRef.current && !genderRef.current.contains(event.target)) {
        setIsGenderOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.user.getProfileDetails();
      if (res?.success && res?.data) {
        const d = res.data;
        const mappedProfile = {
          first_name: d.first_name || "",
          last_name: d.last_name || "",
          email: d.email || "",
          mobile_number: d.mobile_number || "",
          seaneb_id: d.seaneb_id || "",
          profile_photo: d.avatar || d.profile_photo || "",
          gender: d.gender || "",
          dob: d.dob || "",
          hometown: d.City?.city_name || d.hometown || "",
          place_id: d.City?.city_id || d.place_id || ""
        };
        setProfile(mappedProfile);
        setOriginalProfile(mappedProfile);
        // Only set preview if not starting with data: (which handleImageChange uses)
        setPreviewImage(getFullImageUrl(mappedProfile.profile_photo));
        setEmailVerified(true);
        setMobileVerified(true);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      if (err.status === 401) {
        const AUTH_URL = process.env.NEXT_PUBLIC_APP_URL;
        if (AUTH_URL) window.location.href = `${AUTH_URL}/auth/login`;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const initiateOtpFlow = (target) => {
    if (target === 'mobile_number') {
      setShowMethodModal(true);
    } else {
      handleSendOtp('email', profile.email, 'email');
    }
  };

  const handleSendOtp = async (target, identifier, via) => {
    setOtpLoading(true);
    setOtpError("");
    setError(null);
    setShowMethodModal(false);

    try {
      const payload = {
        identifier: identifier,
        purpose: 4,
        product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
      };

      let res;
      if (target === 'email') {
        res = await api.auth.sendEmailOtp(payload);
      } else {
        res = await api.auth.sendOtp({
          ...payload,
          mobile_number: identifier,
          country_code: '+91',
          identifier_type: 0,
          via: via,
          product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
        });
      }

      if (res.success) {
        setOtpTimer(60);
        setOtpTarget(target);
        setOtpVia(via);
        setShowOtpModal(true);
      } else {
        throw new Error(res.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    try {
      const payload = {
        identifier: profile[otpTarget],
        otp: otp.join(""),
        purpose: 4,
        product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
      };

      let res;
      if (otpTarget === 'email') {
        res = await api.auth.verifyEmailOtp(payload);
      } else {
        res = await api.auth.verifyOtp({
          ...payload,
          mobile_number: profile[otpTarget],
          country_code: '+91',
          identifier_type: 0,
          via: otpVia
        });
      }

      if (res.success) {
        if (otpTarget === 'email') setEmailVerified(true);
        if (otpTarget === 'mobile_number') setMobileVerified(true);

        setShowOtpModal(false);
        setOtp(["", "", "", ""]);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        
      } else {
        setOtpError("Invalid OTP. Please check and try again.");
      }
    } catch (err) {
      setOtpError(err.message || "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }

    // Check if verification is pending
    if (profile.email !== originalProfile.email && !emailVerified) {
      setError("Please verify your new email address first.");
      return;
    }
    if (profile.mobile_number !== originalProfile.mobile_number && !mobileVerified) {
      setError("Please verify your new mobile number first.");
      return;
    }

    // If nothing changed, just close edit mode
    const isEmailChanged = profile.email !== originalProfile.email;
    const isMobileChanged = profile.mobile_number !== originalProfile.mobile_number;
    const isAvatarChanged = !!imageFile;

    if (!isEmailChanged && !isMobileChanged && !isAvatarChanged) {
        setIsEditMode(false);
        return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const data = new FormData();
      data.append("email", profile.email);
      data.append("mobile_number", profile.mobile_number);
      data.append("country_code", "+91");
      if (imageFile) {
          // Use 'avatar' field as per requirement Step 4
          data.append("avatar", imageFile);
      }
      data.append("product_key", process.env.NEXT_PUBLIC_PRODUCT_KEY);

      let res;
      try {
        res = await api.user.updateProfile(data);
      } catch (err) {
        console.error("Profile update error:", err);
        const errData = err.data?.error || err.data;
        
        // Handle Case: OTP Required from API
        if (errData?.code === 'UPDATE_OTP_REQUIRED') {
            const meta = errData.meta;
            if (meta?.type === 'email') {
                setEmailVerified(false);
                initiateOtpFlow('email');
            } else if (meta?.type === 'mobile') {
                setMobileVerified(false);
                initiateOtpFlow('mobile_number');
            }
            setIsSaving(false);
            return;
        }
        
        throw err;
      }

      if (res && res.success) {
        setSuccess(true);
        const updatedProfile = { 
            ...profile, 
            profile_photo: res.data?.profile_photo || res.data?.avatar || profile.profile_photo 
        };
        setProfile(updatedProfile);
        setOriginalProfile(updatedProfile);
        setIsEditMode(false);
        setImageFile(null);
        api.user.getProfileDetails(); // Refresh cache
        window.dispatchEvent(new Event("auth-updated"));
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Profile update critical error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const verifySeanebId = async () => {
    if (!profile.seaneb_id || profile.seaneb_id.length < 3) return;
    setVerifyingId(true);
    setIsIdAvailable(null);
    try {
      const data = await api.user.verifySeanebId(profile.seaneb_id);
      setIsIdAvailable(data.available);
    } catch (err) {
      console.error("ID verification error:", err);
      if (err.status === 409 || err.message?.includes("already taken")) {
        setIsIdAvailable(false);
      }
    } finally {
      setVerifyingId(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-inner"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-black animate-spin"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-normal text-lg animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col md:py-8 lg:py-12">
      <div className="w-full max-w-4xl mx-auto px-4">

        {/* MOBILE METHOD SELECTOR MODAL */}
        {showMethodModal && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full relative">
              <button
                onClick={() => setShowMethodModal(false)}
                className="absolute right-6 top-6 text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X size={20} />
              </button>
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="text-black dark:text-white" size={32} />
                </div>
                <h3 className="text-xl font-normal mb-2 text-slate-900 dark:text-white">Receive OTP</h3>
                <p className="text-sm text-slate-500 mb-8 font-normal">How would you like to receive your verification code?</p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleSendOtp('mobile_number', profile.mobile_number, 'sms')}
                    className="w-full py-4 bg-black text-white rounded-2xl font-normal text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                  >
                    Send via SMS
                  </button>
                  <button
                    onClick={() => handleSendOtp('mobile_number', profile.mobile_number, 'whatsapp')}
                    className="w-full py-4 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-normal text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                  >
                    Send via WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OTP MODAL */}
        {showOtpModal && (
          <div className="fixed inset-0 z-201 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full relative">
              <button
                onClick={() => setShowOtpModal(false)}
                className="absolute right-6 top-6 text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X size={20} />
              </button>
              <OtpInputCard
                otp={otp}
                setOtp={setOtp}
                onVerify={verifyOtp}
                onResend={() => {
                  if (otpTarget === 'mobile_number') {
                    setShowOtpModal(false);
                    setShowMethodModal(true);
                  } else {
                    handleSendOtp(otpTarget, profile[otpTarget], 'email');
                  }
                }}
                timer={otpTimer}
                loading={otpLoading}
                error={otpError}
                title={`Verify ${otpTarget === 'email' ? 'Email' : 'Mobile'}`}
                description={`Enter code sent to ${profile[otpTarget]} via ${otpVia.toUpperCase()}`}
                buttonText="Verify"
              />
            </div>
          </div>
        )}

        {/* TOP BAR */}
        <header className="flex justify-between items-center mb-8 px-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="group w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 hover:border-black transition-all active:scale-90"
            >
              <Link href="/">
                <ArrowLeft size={16} className="text-slate-600 dark:text-slate-400 group-hover:text-black group-hover:-translate-x-0.5 transition-all" />
              </Link>
            </button>
            <div className="hidden sm:block">
              <Logo />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelect value={lang} onChange={setLang} />
            <button
              onClick={() => router.back()}
              className="lg:hidden text-slate-400 hover:text-black dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT SIDE: Header & Photo */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl shadow-slate-200/30 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/10 dark:bg-slate-400/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-slate-200/10 transition-colors"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`relative mb-6 ${isEditMode ? "cursor-pointer group/avatar" : ""}`}
                  onClick={() => isEditMode && fileInputRef.current?.click()}
                >
                  <div className="w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-slate-50 dark:ring-slate-800 shadow-xl transition-all duration-300">
                    {previewImage ? (
                      <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <User size={40} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  {isEditMode && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                      <Camera className="text-white" size={24} />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                    {isEditMode ? <Camera size={14} /> : <Check size={14} className="text-green-500" />}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-normal text-slate-900 dark:text-white">{profile.first_name || "Profile"} {profile.last_name}</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal uppercase tracking-[0.2em] mt-0.5">{profile.seaneb_id || "@username"}</p>
                </div>

                <div className="mt-8 w-full space-y-2.5">
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800/30 opacity-70">
                    <Mail size={14} className="text-slate-400" />
                    <span className="text-[11px] font-normal text-slate-600 dark:text-slate-400 truncate flex-1">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800/30 opacity-70">
                    <Smartphone size={14} className="text-slate-400" />
                    <span className="text-[11px] font-normal text-slate-600 dark:text-slate-400 truncate flex-1">{profile.mobile_number}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block bg-black rounded-2xl p-7 text-white shadow-xl shadow-black/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-8 -mt-8"></div>
              <h4 className="text-base font-normal mb-1.5 text-white">Need Help?</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">Only email and mobile can be updated. Other details are read-only.</p>
              <button className="text-[10px] font-normal uppercase tracking-widest px-6 py-2.5 bg-white text-black rounded-lg shadow-lg active:scale-95 transition-all">Support Desk</button>
            </div>

          </div>

          {/* RIGHT SIDE: Form Layout */}
          <div className="lg:col-span-8 space-y-6 pb-12">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 md:p-10 shadow-xl shadow-slate-200/30 dark:shadow-none border border-slate-100 dark:border-slate-800">

              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">Profile Information</h2>
                  <div className="h-0.5 w-8 bg-black dark:bg-white rounded-full mt-1.5"></div>
                </div>
                {isEditMode && (
                  <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[9px] font-normal uppercase tracking-widest animate-pulse">
                    Editing Enabled
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* PERSONAL SECTION - DISABLED ALWAYS */}
                <section className="space-y-6 opacity-60">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <User size={14} />
                    </div>
                    <h4 className="text-[9px] font-normal text-slate-400 dark:text-slate-500 uppercase tracking-widest">Personal Details (Read Only)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput label="First Name" value={profile.first_name} disabled isVerified={true} />
                    <FormInput label="Last Name" value={profile.last_name} disabled isVerified={true} />
                    <FormInput label="Gender" value={profile.gender} disabled isVerified={true} />
                    <FormInput label="Date of Birth" value={profile.dob} disabled isVerified={true} />
                  </div>
                </section>

                <div className="h-px w-full bg-slate-50 dark:bg-slate-800/10"></div>

                {/* CONTACT SECTION - EDITABLE ONLY IN EDIT MODE */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <Smartphone size={14} />
                    </div>
                    <h4 className="text-[9px] font-normal text-slate-400 dark:text-slate-500 uppercase tracking-widest">Update Contact Info</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-10">
                    <FormInput
                      label="Email Address"
                      value={profile.email}
                      onChange={(v) => {
                        setProfile({ ...profile, email: v });
                        setEmailVerified(v === originalProfile.email);
                      }}
                      required
                      disabled={!isEditMode}
                      icon={<Mail size={14} />}
                      showVerify={isEditMode && profile.email !== originalProfile.email}
                      verifyLabel={emailVerified ? "Verified " : "Verify Email"}
                      isVerified={emailVerified}
                      onVerify={() => initiateOtpFlow('email')}
                    />

                    <FormInput
                      label="Mobile Number"
                      value={profile.mobile_number}
                      onChange={(v) => {
                        setProfile({ ...profile, mobile_number: v });
                        setMobileVerified(v === originalProfile.mobile_number);
                      }}
                      required
                      disabled={!isEditMode}
                      icon={<Smartphone size={14} />}
                      showVerify={isEditMode && profile.mobile_number !== originalProfile.mobile_number}
                      verifyLabel={mobileVerified ? "Verified " : "Verify Mobile"}
                      isVerified={mobileVerified}
                      onVerify={() => initiateOtpFlow('mobile_number')}
                    />
                  </div>
                </section>

                <div className="h-px w-full bg-slate-50 dark:bg-slate-800/10"></div>

                {/* ACCOUNT SECTION - DISABLED ALWAYS */}
                <section className="space-y-6 opacity-60">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <Globe size={14} />
                    </div>
                    <h4 className="text-[9px] font-normal text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location & ID (Read Only)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput label="Hometown" value={profile.hometown} disabled isVerified={true} />
                    <FormInput label="SeaNeB ID" value={profile.seaneb_id} disabled isVerified={true} icon={<Hash size={14} />} />
                  </div>
                </section>

                {/* SUBMIT SECTION */}
                <div className="pt-6 border-t border-slate-50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    {success ? (
                      <div className="flex items-center gap-2.5 text-green-600 bg-green-50/50 dark:bg-green-900/10 px-4 py-2.5 rounded-xl border border-green-100 dark:border-green-800/20 animate-in fade-in slide-in-from-left-2">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-normal uppercase tracking-wider">Successfully Updated!</span>
                      </div>
                    ) : error ? (
                      <div className="flex items-center gap-2.5 text-red-500 bg-red-50/50 dark:bg-red-900/10 px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-800/20">
                        <AlertCircle size={16} />
                        <span className="text-[9px] font-normal uppercase truncate max-w-60">{error}</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-normal uppercase tracking-widest italic">{!isEditMode ? "Click 'Update Profile' to enable email/mobile editing" : "Complete verification to save changes"}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                        if (!isEditMode) {
                            setIsEditMode(true);
                        } else {
                            handleSubmit(e);
                        }
                    }}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-10 h-11 bg-black text-white rounded-lg font-normal text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2.5"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        {isEditMode ? <Check size={14} /> : <Pencil size={14} />}
                        <span>{isEditMode ? "Save Changes" : "Update Profile"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder, showVerify, verifyLabel, onVerify, isVerified, statusType, required, disabled, icon }) {
  return (
    <div className="flex flex-col w-full relative group">
      <label className="text-[11px] font-normal text-gray-700 dark:text-gray-300 mb-1 ml-1 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        <input
          type="text"
          value={value || ""}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          disabled={disabled}
          className={`grow w-full border rounded-xl px-3 h-11 text-sm outline-none transition-all ${icon ? 'pl-10' : ''
            } ${isVerified === true ? 'border-green-500 bg-white dark:bg-slate-900/50' : 'border-slate-200 bg-white dark:bg-slate-900 focus:border-black'
            } ${disabled ? 'bg-slate-50/50 dark:bg-slate-900/10 cursor-not-allowed text-slate-400 font-normal' : 'text-slate-900 dark:text-white font-normal'}`}
        />
      </div>

      {showVerify && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onVerify}
            disabled={isVerified}
            className={`w-full py-3 rounded-xl text-[9px] font-normal uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${isVerified === true
                ? "bg-green-50 text-green-600 border border-green-100 cursor-default"
                : "bg-black text-white hover:bg-slate-800 shadow-xl shadow-black/10"
              }`}
          >
            {verifyLabel}
          </button>
        </div>
      )}

      {isVerified === false && statusType === 'id' && value && (
        <div className="mt-1.5 flex items-center gap-1.5 text-red-500 ml-1 animate-in slide-in-from-top-1">
          <AlertCircle size={10} />
          <p className="text-[9px] uppercase font-normal tracking-tight">ID already taken</p>
        </div>
      )}
    </div>
  );
}
