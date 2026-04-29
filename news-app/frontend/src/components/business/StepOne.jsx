import React, { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Search, Globe, Check, AlertCircle, Camera, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import OtpInputCard from '@/components/ui/OtpInputCard';
import api, { EMAIL_OTP_PURPOSE } from '@/lib/apiconfig';

const StepOne = ({
  formData,
  setFormData,
  selectedCategory,
  setSelectedCategory,
  categories,
  logoPreview,
  setLogoPreview,
  setBranchLogo,
  setBusinessImages,
  setBusinessPlaceId,
  onNext,
  handleCancelOnboarding,
  t,
  showNotification,
  registeredBranchId
}) => {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSelectingBusiness, setIsSelectingBusiness] = useState(false);
  const [checkingId, setCheckingId] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Email OTP States
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '']);
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');

  const categoryRef = useRef(null);
  const suggestionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Click outside closures
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-generate Seaneb ID
  useEffect(() => {
    if (formData.business_name && !formData.touchedId) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const generated = formData.business_name
        .toLowerCase()
        .split(' ')[0]
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 8);

      setFormData(prev => ({
        ...prev,
        seaneb_id: generated ? `${generated}${randomNum}` : `user${randomNum}`
      }));
      setFormData(prev => ({ ...prev, isIdAvailable: null }));
    }
  }, [formData.business_name, formData.touchedId, setFormData]);

  // Business Autocomplete
  useEffect(() => {
    if (isSelectingBusiness) {
      setIsSelectingBusiness(false);
      return;
    }
    const fetchSuggestions = async () => {
      if (!formData.business_name || formData.business_name.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const data = await api.business.search(formData.business_name);
        if (data && data.success) {
          setSuggestions(data.businesses || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
      }
    };
    const timeoutId = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timeoutId);
  }, [formData.business_name]);

  // Check Display Name availability (Extraction from business name)
  useEffect(() => {
    if (!formData.business_name) return;
    const firstPart = formData.business_name.split(",")[0].split(" - ")[0].trim();
    if (firstPart !== formData.display_name) {
      setFormData(prev => ({ ...prev, display_name: firstPart }));
    }
  }, [formData.business_name, setFormData]);

  // Email Resend Timer
  useEffect(() => {
    if (emailResendTimer > 0) {
      const timer = setTimeout(() => setEmailResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailResendTimer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "business_name") setShowSuggestions(true);
    if (name === "seaneb_id") {
      setFormData(prev => ({ ...prev, touchedId: true, isIdAvailable: null }));
    }
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSelectBusiness = (item) => {
    setIsSelectingBusiness(true);
    const fullDescription = item.description || item.name || '';
    let extractedAddress = '';
    if (fullDescription.includes(',')) {
      const parts = fullDescription.split(',');
      extractedAddress = parts.slice(1).join(',').trim();
    }
    setFormData(prev => ({
      ...prev,
      business_name: fullDescription,
      address: extractedAddress || prev.address,
      place_id: item.place_id || item.id
    }));
    setBusinessImages(item.photo_references && item.photo_references.length > 0 ? item.photo_references : []);
    setBusinessPlaceId(item.business_place_id || item.place_id || item.id || '');
    setShowSuggestions(false);
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
    if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: false }));
  };

  const checkIdAvailability = async () => {
    if (!formData.seaneb_id || formData.seaneb_id.length < 3) {
      showNotification('ID must be at least 3 characters', 'warning');
      return;
    }
    setCheckingId(true);
    try {
      await api.user.verifySeanebId(formData.seaneb_id);
      setFormData(prev => ({ ...prev, isIdAvailable: true }));
      showNotification('ID is available!', 'success');
    } catch (error) {
      if (error?.status === 409) {
        setFormData(prev => ({ ...prev, isIdAvailable: false }));
        showNotification('ID already taken!', 'error');
      } else {
        setFormData(prev => ({ ...prev, isIdAvailable: null }));
        showNotification('Error checking ID availability', 'error');
      }
    } finally {
      setCheckingId(false);
    }
  };

  const handleLogoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setBranchLogo(file);
  };

  // Email logic
  const handleSendEmailOtp = async () => {
    if (!formData.business_email) return showNotification("Email is required", "warning");
    setSendingEmailOtp(true);
    setEmailOtpError('');
    try {
      await api.auth.sendEmailOtp({
        email: formData.business_email,
        purpose: EMAIL_OTP_PURPOSE.BUSINESS_VERIFY
      });
      setShowEmailOtpModal(true);
      setEmailResendTimer(60);
      setEmailOtp(['', '', '', '']);
      showNotification("OTP sent to your email", "success");
    } catch (err) {
      showNotification(err.data?.message || "Failed to send OTP", "error");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const fullOtp = emailOtp.join("");
    if (fullOtp.length < 4) return setEmailOtpError("4 digits required");
    setVerifyingEmailOtp(true);
    setEmailOtpError('');
    try {
      await api.auth.verifyEmailOtp({
        email: formData.business_email,
        otp: fullOtp,
        purpose: EMAIL_OTP_PURPOSE.BUSINESS_VERIFY
      });
      setFormData(prev => ({ ...prev, emailVerified: true }));
      setShowEmailOtpModal(false);
      showNotification("Email verified successfully!", "success");
    } catch (err) {
      setEmailOtpError(err.data?.message || "Invalid OTP");
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const resendEmailOtp = async () => {
    setSendingEmailOtp(true);
    setEmailOtpError('');
    try {
      await api.auth.sendEmailOtp({
        email: formData.business_email,
        purpose: EMAIL_OTP_PURPOSE.BUSINESS_VERIFY
      });
      setEmailResendTimer(60);
      setEmailOtp(['', '', '', '']);
      setEmailOtpError('');
      showNotification("OTP resent", "success");
    } catch (err) {
      setEmailOtpError(err.data?.message || "Failed to resend");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const validateAndNext = () => {
    const errors = {};
    if (!selectedCategory) {
      errors.category = true;
      showNotification('Please select a category', 'warning');
      return setFieldErrors(errors);
    }
    if (!formData.business_name || formData.business_name.trim() === '') {
      errors.business_name = true;
      showNotification('Business name is required', 'warning');
      return setFieldErrors(errors);
    }
    if (!formData.seaneb_id || formData.seaneb_id.trim() === '') {
      errors.seaneb_id = true;
      showNotification('Seaneb ID is required', 'warning');
      return setFieldErrors(errors);
    }
    if (formData.isIdAvailable === false) {
      errors.seaneb_id = true;
      showNotification('Seaneb ID is already taken! Please choose another.', 'error');
      return setFieldErrors(errors);
    }
    if (formData.isIdAvailable !== true) {
      errors.seaneb_id = true;
      showNotification('Please check Seaneb ID availability first', 'warning');
      return setFieldErrors(errors);
    }
    setFieldErrors({});
    onNext();
  };

  return (
    <div className="space-y-4">
      {/* Email OTP Modal */}
      {showEmailOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
            <OtpInputCard
              otp={emailOtp}
              setOtp={setEmailOtp}
              onVerify={handleVerifyEmailOtp}
              onResend={resendEmailOtp}
              timer={emailResendTimer}
              loading={verifyingEmailOtp}
              error={emailOtpError}
              title="Verify Email"
              description={`Enter code sent to ${formData.business_email}`}
              buttonText="Verify Email"
            />
            <button
              onClick={() => setShowEmailOtpModal(false)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 w-full text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Logo Upload Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className={`w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden flex items-center justify-center bg-slate-50 transition-all group-hover:scale-105 duration-300 ${!logoPreview ? 'border-dashed border-slate-200' : 'border-solid border-slate-100'}`}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-slate-300 flex flex-col items-center">
                <Building2 size={40} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-full">
              <Camera size={24} className="mb-1" />
              <span className="text-[10px] font-black uppercase tracking-widest">{logoPreview ? 'Change' : 'Add Logo'}</span>
            </div>
          </div>
          {!logoPreview && (
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110">
              <Plus size={16} />
            </div>
          )}
          {uploadingLogo && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Business Logo</p>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoSelect} />
      </div>

      {/* Category Selection */}
      <div className="relative" ref={categoryRef}>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.selectCategory || "Select Category"} <span className="text-red-500">*</span>
        </label>
        <div
          className={`w-full p-3 rounded-2xl bg-slate-50 border cursor-pointer flex items-center justify-between ${fieldErrors.category ? 'border-red-500' : 'border-slate-200'}`}
          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
        >
          <span className={`text-sm ${selectedCategory ? 'text-slate-900' : 'text-slate-400'}`}>
            {selectedCategory ? selectedCategory.main_category_name : (t?.chooseCategory || "Choose a category...")}
          </span>
          <ChevronDown size={18} className={`text-slate-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
        </div>
        {showCategoryDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <div
                key={category.main_category_id}
                onClick={() => handleSelectCategory(category)}
                className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b last:border-b-0"
              >
                <Building2 size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700">{category.main_category_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Company Name */}
      <div className="relative" ref={suggestionRef}>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.companyName || "Company Name"} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            name="business_name"
            placeholder="Search or enter business name..."
            onChange={handleChange}
            value={formData.business_name}
            autoComplete="off"
            className={`w-full p-3 pl-10 rounded-2xl bg-slate-50 border text-sm transition-all outline-none ${fieldErrors.business_name ? 'border-red-500' : 'border-slate-200 focus:border-blue-500 focus:bg-white'}`}
            required
          />
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
            {suggestions.map((item, i) => (
              <div
                key={i}
                onClick={() => handleSelectBusiness(item)}
                className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b last:border-b-0"
              >
                <Building2 size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700">{item.description || item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Display Name */}
      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.displayName || "Display Name"} <span className="text-red-500">*</span>
        </label>
        <input
          name="display_name"
          placeholder="How should we display your business?"
          onChange={handleChange}
          value={formData.display_name}
          className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all"
        />
      </div>

      {/* Business Email */}
      <div className="relative">
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.businessEmail || "Business Email"}
          {formData.emailVerified && <Check size={12} className="inline text-green-500 ml-1" />}
        </label>
        <div className="relative">
          <input
            name="business_email"
            type="email"
            placeholder="contact@business.com"
            onChange={(e) => {
              handleChange(e);
              setFormData(prev => ({ ...prev, emailVerified: false }));
            }}
            value={formData.business_email}
            className={`w-full p-3 pr-24 rounded-2xl bg-slate-50 border transition-all text-sm outline-none ${formData.emailVerified ? 'border-green-500 bg-green-50' : 'border-slate-200 focus:border-blue-500 focus:bg-white'}`}
          />
          {!formData.emailVerified && formData.business_email && (
            <button
              type="button"
              onClick={handleSendEmailOtp}
              disabled={sendingEmailOtp}
              className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-blue-600 text-white text-[10px] font-bold rounded-xl disabled:bg-slate-300"
            >
              {sendingEmailOtp ? '...' : 'Verify'}
            </button>
          )}
        </div>
      </div>

      {/* Website URL */}
      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.websiteUrl || "Website URL"} <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <Globe className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            name="website_url"
            placeholder={t?.websitePlaceholder || "https://www.yourbusiness.com"}
            onChange={handleChange}
            value={formData.website_url}
            className="w-full p-3 pl-10 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all"
          />
        </div>
      </div>

      {/* Seaneb ID */}
      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.seanebId || "Seaneb ID"} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            name="seaneb_id"
            placeholder="unique-business-id"
            onChange={handleChange}
            value={formData.seaneb_id}
            className={`w-full p-3 pr-32 rounded-2xl bg-slate-50 border transition-all text-sm outline-none ${fieldErrors.seaneb_id ? 'border-red-500' : formData.isIdAvailable === true ? 'border-green-500 bg-green-50' : formData.isIdAvailable === false ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
            required
          />
          <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center">
            {formData.isIdAvailable === true && <Check size={18} className="text-green-500 mr-2" />}
            {formData.isIdAvailable === false && <AlertCircle size={18} className="text-red-500 mr-2" />}
            <Button
              type="button"
              onClick={checkIdAvailability}
              disabled={checkingId}
              variant="secondary"
              className="px-3 py-1 h-full rounded-xl whitespace-nowrap text-xs"
            >
              {checkingId ? '...' : 'Check'}
            </Button>
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={validateAndNext}
        variant="primary"
        className="w-full py-3 rounded-2xl text-md"
        disabled={formData.isIdAvailable !== true}
      >
        {t?.continue || "Continue →"}
      </Button>
      <button
        type="button"
        onClick={handleCancelOnboarding}
        className="w-full py-2 text-[11px] font-bold text-slate-300 hover:text-slate-500 transition-colors"
      >
        Cancel Registration
      </button>
    </div>
  );
};
export default StepOne;
