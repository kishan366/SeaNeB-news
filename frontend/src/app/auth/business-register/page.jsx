// components/auth/BusinessRegister.jsx (complete updated file with token fix)
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import LanguageSelect from '@/components/ui/LanguageSelect';
import OtpInputCard from '@/components/ui/OtpInputCard';
import { Building2, ShieldCheck, MapPin, Check, Search, AlertCircle, Phone, ChevronDown } from 'lucide-react';
import Cookies from 'js-cookie';

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

  // Category States
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef(null);

  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCountryCode, setOtpCountryCode] = useState('91');
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  // Hardcoded product key
  const productKey = 'news';

  // Autocomplete States
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);
  
  // City Search States
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityRef = useRef(null);
  const [fetchingCities, setFetchingCities] = useState(false);

  // ID Validation States
  const [isIdAvailable, setIsIdAvailable] = useState(null);
  const [checkingId, setCheckingId] = useState(false);
  const [touchedId, setTouchedId] = useState(false);

  // ✅ Only these fields as per your requirement
  const [formData, setFormData] = useState({
    business_name: "",
    display_name: "",
    seaneb_id: "",
    primary_number: "",
    whatsapp_number: "",
    business_email: "",
    address: "",
    landmark: "",
    place_id: "",
    pan_number: "",
    gstin: ""
  });

  // Fetch Categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Click outside to close category dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('/api/external/v1/category/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-product-key': productKey
        },
        body: JSON.stringify({
          product_key: productKey
        })
      });

      const data = await response.json();
      console.log('📦 Categories response:', data);

      if (response.ok && data.success) {
        setCategories(data.data || []);
        // Auto-select first category if available
        if (data.data && data.data.length > 0) {
          setSelectedCategory(data.data[0]);
        }
      } else {
        console.error('Failed to fetch categories:', data);
        showNotification('Failed to load categories', 'error');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showNotification('Error loading categories', 'error');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Auto-generate Seaneb ID
  useEffect(() => {
    if (formData.business_name && !touchedId) {
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
      setIsIdAvailable(null);
    }
  }, [formData.business_name, touchedId]);

  // OTP Timer
  useEffect(() => {
    if (!showOtpModal || otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

  // City Autocomplete
  useEffect(() => {
    const fetchCitySuggestions = async () => {
      if (!citySearch || citySearch.length < 2) {
        setCitySuggestions([]);
        return;
      }

      setFetchingCities(true);
      try {
        const response = await fetch(
          `/api/external/v1/autocomplete-cities?input=${encodeURIComponent(citySearch)}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-product-key': productKey
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.cities) {
            setCitySuggestions(data.cities);
          }
        }
      } catch (error) {
        console.error('City autocomplete error:', error);
      } finally {
        setFetchingCities(false);
      }
    };

    const timeoutId = setTimeout(fetchCitySuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [citySearch]);

  // Click outside to close city suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Business Autocomplete
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!formData.business_name || formData.business_name.length < 2) return;
      
      try {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        
        const token = cookies.access_token;
        
        if (!token) {
          setSuggestions([]);
          return;
        }

        const response = await fetch(
          `/api/external/v1/business/autocomplete?input=${encodeURIComponent(formData.business_name)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'x-product-key': productKey
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) setSuggestions(data.businesses || []);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.business_name]);

  // Click outside to close business suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showNotification = (message, type = 'error') => {
    const messageStr = typeof message === 'object' 
      ? (message?.message || message?.error || JSON.stringify(message))
      : String(message);
    
    setNotification({ show: true, message: messageStr, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For phone number, automatically add +91
    if (name === "primary_number" || name === "whatsapp_number") {
      // Remove all non-digits
      let digits = value.replace(/\D/g, '');
      
      // If user is typing, let them type normally but ensure +91 prefix when displaying
      if (digits.length > 0) {
        // Store just the digits without +91 in formData
        setFormData({ ...formData, [name]: digits });
      } else {
        setFormData({ ...formData, [name]: '' });
      }
      
      if (name === "primary_number") {
        setPhoneVerified(false); // Reset verification when number changes
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    if (name === "business_name") {
      setShowSuggestions(true);
    }
    if (name === "seaneb_id") {
      setTouchedId(true);
      setIsIdAvailable(null);
    }
  };

  // Format phone number for display
  const getDisplayPhone = (number) => {
    if (!number) return '';
    return `+91 ${number}`;
  };

  const handleSelectBusiness = (item) => {
    setFormData({ 
      ...formData, 
      business_name: item.description || item.name,
      place_id: item.place_id || item.id
    });
    setShowSuggestions(false);
  };

  const handleSelectCity = (city) => {
    setFormData({
      ...formData,
      place_id: city.place_id
    });
    setCitySearch(city.city_name);
    setShowCitySuggestions(false);
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
  };

  // Check ID Availability
  const checkIdAvailability = async () => {
    if (!formData.seaneb_id || formData.seaneb_id.length < 3) {
      showNotification('ID must be at least 3 characters', 'warning');
      return;
    }
    
    setCheckingId(true);
    try {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      
      const token = cookies.access_token;

      const response = await fetch('/api/external/v1/seanebid/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-product-key': productKey
        },
        body: JSON.stringify({ seaneb_id: formData.seaneb_id })
      });
      
      if (response.status === 200) {
        setIsIdAvailable(true);
        showNotification('ID is available!', 'success');
      } else if (response.status === 409) {
        setIsIdAvailable(false);
        showNotification('ID already taken!', 'error');
      } else {
        setIsIdAvailable(null);
        showNotification('Error checking ID availability', 'error');
      }
    } catch (error) {
      console.error("ID Check Error:", error);
      setIsIdAvailable(null);
      showNotification('Network error', 'error');
    } finally {
      setCheckingId(false);
    }
  };

  // Send OTP for phone verification
  const sendOtp = async () => {
    if (!formData.primary_number || formData.primary_number.length < 10) {
      showNotification('Please enter valid mobile number', 'warning');
      return;
    }

    setVerifyingPhone(true);
    setOtpError('');

    try {
      const phone = formData.primary_number; // Already digits only
      const cc = '91'; // Default India code

      const requestBody = {
        identifier_type: 0,
        country_code: cc,
        mobile_number: phone,
        purpose: 2, // Login/Registration purpose
        via: 'sms', // Default to whatsapp
        product_key: productKey
      };

      console.log('📤 Sending OTP request:', requestBody);

      const response = await fetch('/api/external/v1/otp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setOtpPhone(phone);
        setOtpCountryCode(cc);
        setOtpTimer(60);
        setOtp(['', '', '', '']);
        setShowOtpModal(true);
      } else {
        setOtpError(data.message || 'Failed to send OTP');
        showNotification(data.message || 'Failed to send OTP', 'error');
      }
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      setOtpError('Network error. Please try again.');
      showNotification('Network error', 'error');
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 4 || otpLoading) return;

    setOtpLoading(true);
    setOtpError('');

    try {
      const requestBody = {
        identifier_type: 0,
        country_code: otpCountryCode,
        mobile_number: otpPhone,
        otp: fullOtp,
        purpose: 2,
        product_key: productKey
      };

      console.log('🔵 Verifying OTP:', requestBody);

      const response = await fetch('/api/external/v1/otp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      const data = await response.json();
      console.log('✅ Verify OTP response:', data);

      if (response.ok) {
        // Save tokens if provided
        if (data.access_token) {
          Cookies.set('access_token', data.access_token, { 
            path: '/', 
            secure: true, 
            sameSite: 'strict',
            expires: 7 
          });
          
          if (data.refresh_token) {
            Cookies.set('refresh_token', data.refresh_token, { 
              path: '/', 
              secure: true, 
              sameSite: 'strict',
              expires: 30 
            });
          }
        }

        // Check if user exists
        if (data.is_existing_user) {
          // User exists - just mark phone as verified
          setPhoneVerified(true);
          setShowOtpModal(false);
          showNotification('Phone number verified!', 'success');
        } else {
          // New user - redirect to user registration
          showNotification('New user! Please complete registration.', 'info');
          setTimeout(() => {
            router.push(`/auth/user-register?phone=${otpPhone}&cc=${otpCountryCode}`);
          }, 1500);
        }
      } else {
        setOtpError(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      setOtpError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError('');

    try {
      const requestBody = {
        identifier_type: 0,
        country_code: otpCountryCode,
        mobile_number: otpPhone,
        purpose: 2,
        via: 'sms',
        product_key: productKey
      };

      const response = await fetch('/api/external/v1/otp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setOtp(['', '', '', '']);
        setOtpTimer(60);
        setOtpError('');
      } else {
        setOtpError(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      setOtpError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

// Handle Form Submit - Fixed Version
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validations
  if (!formData.business_name) {
    return showNotification('Business name is required', 'warning');
  }
  
  if (!selectedCategory) {
    return showNotification('Please select a category', 'warning');
  }
  
  if (!formData.seaneb_id) {
    return showNotification('Seaneb ID is required', 'warning');
  }
  
  if (isIdAvailable === false) {
    return showNotification('Seaneb ID is already taken! Please choose another.', 'error');
  }

  if (!formData.primary_number) {
    return showNotification('Mobile number is required', 'warning');
  }

  if (!phoneVerified) {
    return showNotification('Please verify your mobile number first', 'warning');
  }

  setLoading(true);
  try {
    // Get token from cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    const token = cookies.access_token;
    
    if (!token) {
      throw new Error('No access token found. Please login again.');
    }

    console.log('🔑 Using token:', token.substring(0, 20) + '...');

    // Trim all fields to safe lengths
    const payload = {
      business_name: formData.business_name.trim().substring(0, 30),
      display_name: (formData.display_name || formData.business_name).trim().substring(0, 30),
      main_category_id: selectedCategory.main_category_id,
      seaneb_id: formData.seaneb_id.trim().substring(0, 20),
      primary_number: formData.primary_number.trim(),
      whatsapp_number: (formData.whatsapp_number || formData.primary_number).trim(),
      business_email: (formData.business_email || "").trim().substring(0, 50),
      about_branch: "Head office branch",
      address: (formData.address || "").trim().substring(0, 100),
      landmark: (formData.landmark || "").trim().substring(0, 50),
      place_id: formData.place_id,
      //  PAN and GST as objects
      ...(formData.pan_number && { 
        pan: { pan_number: formData.pan_number.toUpperCase().trim().substring(0, 10) } 
      }),
      ...(formData.gstin && { 
        gst: { gstin: formData.gstin.toUpperCase().trim().substring(0, 15) } 
      })
    };

    console.log(' Submitting payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('/api/external/v1/business/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-product-key': productKey
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    const responseText = await response.text();
    console.log('📦 Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Invalid server response');
    }

    console.log('📦 Business create response:', data);

    if (response.ok) {
      showNotification(t.success_msg || "Registration successful!", 'success');
      setTimeout(() => {
        router.push('http://localhost:3001/Home');
      }, 1500);
    } else {
      if (response.status === 401) {
        showNotification('Session expired. Please login again.', 'error');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else if (response.status === 500) {
        // Better error message for 500
        const errorMsg = data?.error?.message || data?.message || 'Server error. Please try again.';
        showNotification(errorMsg, 'error');
      } else {
        throw new Error(data?.message || data?.error || "Registration Failed");
      }
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    // Convert error object to string
    const errorMsg = typeof error === 'object' ? error.message || 'Registration failed' : error;
    showNotification(errorMsg, 'error');
  } finally {
    setLoading(false);
  }
};

  const steps = [
    { id: 1, icon: <Building2 size={20} />, label: "Business" },
    { id: 2, icon: <ShieldCheck size={20} />, label: "Legal" },
    { id: 3, icon: <MapPin size={20} />, label: "Location" }
  ];

  if (loadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-slate-50 to-white p-6 font-sans relative">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-slide-in ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`}>
          {notification.message}
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
            <OtpInputCard 
              otp={otp}
              setOtp={setOtp}
              onVerify={verifyOtp}
              onResend={handleResendOtp}
              timer={otpTimer}
              loading={otpLoading}
              error={otpError}
              title="Verify Mobile Number"
              description={`Enter OTP sent to +91 ${otpPhone}`}
              buttonText="Verify OTP"
            />
            <button 
              onClick={() => setShowOtpModal(false)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 w-full text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-100">
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Logo width={42} height={42} />
            <span className="text-xl font-bold text-slate-900 tracking-tighter italic">SEANEB</span>
          </div>
          <LanguageSelect value={lang} onChange={setLang} />
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                    step > s.id ? 'bg-green-500 border-green-500 text-white' :
                    step === s.id ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-lg' : 
                    'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {step > s.id ? <Check size={18} /> : s.icon}
                  </div>
                  <span className={`text-xs font-bold mt-2 uppercase tracking-wider ${
                    step >= s.id ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${
                    step > index + 1 ? 'bg-green-500' : 'bg-slate-100'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Category Selection Dropdown */}
              <div className="relative" ref={categoryRef}>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Select Category <span className="text-red-500">*</span>
                </label>
                <div 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer flex items-center justify-between"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <span className={selectedCategory ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedCategory ? selectedCategory.main_category_name : 'Choose a category...'}
                  </span>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </div>

                {showCategoryDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto">
                    {categories.map((category) => (
                      <div
                        key={category.main_category_id}
                        onClick={() => handleSelectCategory(category)}
                        className="p-4 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b last:border-b-0"
                      >
                        <Building2 size={18} className="text-slate-400" />
                        <span className="text-sm text-slate-700">{category.main_category_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={suggestionRef}>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    name="business_name" 
                    placeholder="Search or enter business name..." 
                    onChange={handleChange} 
                    value={formData.business_name} 
                    autoComplete="off"
                    className="w-full p-4 pl-12 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-all" 
                    required 
                  />
                  <Search className="absolute left-4 top-4 text-slate-400" size={20} />
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto">
                    {suggestions.map((item, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectBusiness(item)}
                        className="p-4 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b last:border-b-0"
                      >
                        <Building2 size={18} className="text-slate-400" />
                        <span className="text-sm text-slate-700">{item.description || item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Display Name
                </label>
                <input 
                  name="display_name" 
                  placeholder="How should we display your business?" 
                  onChange={handleChange} 
                  value={formData.display_name} 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-all" 
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Business Email
                </label>
                <input 
                  name="business_email" 
                  type="email"
                  placeholder="contact@business.com" 
                  onChange={handleChange} 
                  value={formData.business_email} 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-all" 
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Seaneb ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    name="seaneb_id" 
                    placeholder="unique-business-id" 
                    onChange={handleChange} 
                    value={formData.seaneb_id} 
                    className={`w-full p-4 pr-32 rounded-2xl bg-slate-50 border transition-all outline-none ${
                      isIdAvailable === true ? 'border-green-500 bg-green-50' : 
                      isIdAvailable === false ? 'border-red-500 bg-red-50' : 'border-slate-200'
                    }`} 
                    required 
                  />
                  <div className="absolute right-2 top-2 bottom-2 flex items-center">
                    {isIdAvailable === true && <Check size={20} className="text-green-500 mr-2" />}
                    {isIdAvailable === false && <AlertCircle size={20} className="text-red-500 mr-2" />}
                    <Button 
                      type="button" 
                      onClick={checkIdAvailability}
                      disabled={checkingId}
                      variant="secondary"
                      className="px-4 py-2 h-full rounded-xl whitespace-nowrap"
                    >
                      {checkingId ? 'Checking...' : 'Check'}
                    </Button>
                  </div>
                </div>
                {isIdAvailable === false && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                    <AlertCircle size={16} /> This ID is already taken
                  </p>
                )}
                {isIdAvailable === true && (
                  <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                    <Check size={16} /> ID is available!
                  </p>
                )}
              </div>

              <Button 
                type="button" 
                onClick={() => setStep(2)} 
                variant="primary"
                className="w-full py-4 rounded-2xl text-lg"
                disabled={!selectedCategory}
              >
                Continue →
              </Button>
            </div>
          )}

          {/* Step 2: Legal Info */}
          {step === 2 && (
            <div className="space-y-6">
              {/* PAN Number */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  PAN Number <span className="text-gray-400 text-xs font-normal">(Optional - Auto-verified)</span>
                </label>
                <input 
                  name="pan_number" 
                  placeholder="ABCDE1234F" 
                  onChange={handleChange} 
                  value={formData.pan_number || ''} 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-all font-mono uppercase" 
                  maxLength="10"
                />
              </div>

              {/* GST Number */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  GST Number <span className="text-gray-400 text-xs font-normal">(Optional - Auto-verified)</span>
                </label>
                <input 
                  name="gstin" 
                  placeholder="22AAAAA0000A1Z5" 
                  onChange={handleChange} 
                  value={formData.gstin || ''} 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-all font-mono uppercase" 
                  maxLength="15"
                />
              </div>

              {/* Mobile Number with Verification - Auto +91 */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-4 flex items-center gap-1">
                    <span className="text-slate-500 font-medium">+91</span>
                  </div>
                  <input 
                    name="primary_number" 
                    placeholder="98765 43210" 
                    onChange={handleChange} 
                    value={formData.primary_number} 
                    className={`w-full p-4 pl-16 pr-32 rounded-2xl bg-slate-50 border transition-all outline-none ${
                      phoneVerified 
                        ? 'border-green-500 bg-green-50 text-green-900' 
                        : 'border-slate-200'
                    }`} 
                    required 
                    disabled={phoneVerified}
                    maxLength="10"
                  />
                  <div className="absolute right-2 top-2 bottom-2 flex items-center">
                    {phoneVerified && <Check size={20} className="text-green-500 mr-2" />}
                    <Button 
                      type="button" 
                      onClick={sendOtp}
                      disabled={verifyingPhone || phoneVerified || !formData.primary_number || formData.primary_number.length < 10}
                      variant={phoneVerified ? "secondary" : "primary"}
                      className="px-4 py-2 h-full rounded-xl whitespace-nowrap"
                    >
                      {verifyingPhone ? 'Sending...' : phoneVerified ? 'Verified' : 'Verify'}
                    </Button>
                  </div>
                </div>
                {phoneVerified && (
                  <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                    <Check size={16} /> Phone number verified
                  </p>
                )}
              </div>

              {/* WhatsApp Number - Auto +91 */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-4 flex items-center gap-1">
                    <span className="text-slate-500 font-medium">+91</span>
                  </div>
                  <input 
                    name="whatsapp_number" 
                    placeholder="98765 43210 (Same as mobile if not specified)" 
                    onChange={handleChange} 
                    value={formData.whatsapp_number} 
                    className="w-full p-4 pl-16 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-all" 
                    maxLength="10"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  variant="secondary"
                  className="flex-1 py-4 rounded-2xl"
                >
                  ← Back
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setStep(3)} 
                  variant="primary"
                  className="flex-1 py-4 rounded-2xl"
                  disabled={!phoneVerified}
                >
                  Continue →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6">
              {/* City Search */}
              <div className="relative" ref={cityRef}>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Search City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    placeholder="Type city name (min. 2 characters)..."
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      setShowCitySuggestions(true);
                      if (formData.place_id) {
                        setFormData({
                          ...formData,
                          place_id: ''
                        });
                      }
                    }}
                    className="w-full p-4 pl-12 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-all" 
                  />
                  <Search className="absolute left-4 top-4 text-slate-400" size={20} />
                  {fetchingCities && (
                    <div className="absolute right-4 top-4">
                      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>

                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto">
                    {citySuggestions.map((city, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectCity(city)}
                        className="p-4 hover:bg-slate-50 cursor-pointer flex items-start gap-3 border-b last:border-b-0"
                      >
                        <MapPin size={18} className="text-slate-400 mt-1 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900">{city.city_name}</p>
                          <p className="text-sm text-slate-500">{city.state_name}, {city.country_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Business Address
                </label>
                <textarea 
                  name="address" 
                  placeholder="Street, building, area..." 
                  onChange={handleChange} 
                  value={formData.address} 
                  rows="3"
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none" 
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Landmark
                </label>
                <input 
                  name="landmark" 
                  placeholder="Near..." 
                  onChange={handleChange} 
                  value={formData.landmark} 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-all" 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setStep(2)} 
                  variant="secondary"
                  className="flex-1 py-4 rounded-2xl"
                >
                  ← Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !formData.place_id || !phoneVerified}
                  variant={(!formData.place_id || !phoneVerified) ? "secondary" : "primary"}
                  className={`flex-1 py-4 rounded-2xl text-lg ${
                    (!formData.place_id || !phoneVerified) ? 'opacity-50' : ''
                  }`}
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BusinessRegister;