"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button"; 
import LanguageSelect from "@/components/ui/LanguageSelect";
import DatePicker from "@/components/ui/DatePicker";
import Logo from "@/components/ui/Logo";
import HometownAutocomplete from "@/components/ui/HometownAutocomplete";
import OtpInputCard from "@/components/ui/OtpInputCard"; 
import { setAuthTokens } from "@/lib/auth";
import en from "@/i18n/en";
import hi from "@/i18n/hi";
import gu from "@/i18n/gu";

const languages = { en, hi, gu };
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CompleteProfileForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mobile_number = (searchParams.get("phone") || "").replace(/\D/g, "");
    const country_code = (searchParams.get("cc") || "91").replace(/\D/g, "");

    const [lang, setLang] = useState("en");
    const t = languages[lang] || en;

    const [form, setForm] = useState({
        firstName: "", 
        lastName: "", 
        email: "", 
        gender: "",
        dob: "", 
        hometown: "", 
        seanebId: "", 
        agree: false,
        place_id: ""
    });

    const [touched, setTouched] = useState({ seanebId: false });
    const [submitting, setSubmitting] = useState(false);
    const [verifyingId, setVerifyingId] = useState(false);
    const [isIdAvailable, setIsIdAvailable] = useState(null);

    const [showEmailOtpCard, setShowEmailOtpCard] = useState(false);
    const [emailOtp, setEmailOtp] = useState(["", "", "", ""]); 
    const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [otpError, setOtpError] = useState("");

    // Email validation state
    const [emailError, setEmailError] = useState("");

    // Redirect if no phone number
    useEffect(() => {
        if (!mobile_number) {
            router.replace("/auth/login");
        }
    }, [mobile_number, router]);

    // Auto-generate Seaneb ID
    useEffect(() => {
        if (form.firstName && form.lastName && !touched.seanebId) {
            const randomNum = Math.floor(100 + Math.random() * 900);
            const generated = `${form.firstName.toLowerCase()}-${form.lastName.toLowerCase()}-${randomNum}`;
            setForm(prev => ({ 
                ...prev, 
                seanebId: generated.replace(/[^a-z0-9-]/g, "").substring(0, 20)
            }));
            setIsIdAvailable(null); 
        }
    }, [form.firstName, form.lastName, touched.seanebId]);

    // Timer for resend OTP
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    // Validate email format
    const validateEmail = (email) => {
        if (!email) return true; // Empty email is valid (optional)
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Handle email change
    const handleEmailChange = (value) => {
        setForm({...form, email: value});
        setEmailVerified(false); // Reset verification when email changes
        
        if (value && !validateEmail(value)) {
            setEmailError("Please enter a valid email address");
        } else {
            setEmailError("");
        }
    };

    // Verify Seaneb ID
    const verifySeanebId = async () => {
        if (!form.seanebId || form.seanebId.length < 3) {
            alert("Please enter a valid Seaneb ID (minimum 3 characters)");
            return;
        }
        
        setVerifyingId(true);
        setIsIdAvailable(null);
        try {
            const res = await fetch(`${API_BASE}/api/v1/seanebid/check`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seaneb_id: form.seanebId }),
            });
            const data = await res.json();
            
            if (res.ok) {
                setIsIdAvailable(data.available === true);
            } else {
                setIsIdAvailable(false);
            }
        } catch (err) { 
            console.error("ID Check failed", err);
            alert("Error checking ID availability");
        } finally { 
            setVerifyingId(false); 
        }
    };

    // Send Email OTP
    const handleSendEmailOtp = async () => {
        if (!form.email) {
            alert("Please enter an email address");
            return;
        }
        
        if (!validateEmail(form.email)) {
            alert("Please enter a valid email address");
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE}/api/v1/auth/email/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: form.email,
                    purpose: 1 // 1 = User signup email verification
                }),
            });
            
            if (res.ok) {
                setShowEmailOtpCard(true);
                setResendTimer(30);
                setOtpError("");
                setEmailOtp(["", "", "", ""]);
            } else {
                const data = await res.json();
                alert(data.message || "Error sending OTP");
            }
        } catch (err) { 
            alert("Error sending OTP"); 
        }
    };

    // Verify Email OTP
    const handleVerifyEmailOtp = async () => {
        const fullOtp = emailOtp.join("");
        if (fullOtp.length < 4) {
            setOtpError("Please enter complete OTP");
            return;
        }
        
        setVerifyingEmailOtp(true);
        setOtpError("");
        
        try {
            const res = await fetch(`${API_BASE}/api/v1/auth/email/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: form.email, 
                    otp: fullOtp 
                }),
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setEmailVerified(true);
                setShowEmailOtpCard(false);
                
                // If email already registered, show message but continue
                if (data.is_registered || data.user_exists) {
                    alert("This email is already registered. You can continue with your profile.");
                }
            } else { 
                setOtpError(data.message || "Invalid verification code"); 
            }
        } catch (err) { 
            setOtpError("Verification failed"); 
        } finally { 
            setVerifyingEmailOtp(false); 
        }
    };

    // Form Submit
    const handleSubmit = async () => {
        // Basic Validation Checks
        if (!form.firstName || !form.lastName) {
            return alert("First & Last name are required");
        }
        
        // Email validation - if provided, must be verified
        if (form.email && !emailVerified) {
            return alert("Please verify your email first!");
        }
        
        if (form.email && !validateEmail(form.email)) {
            return alert("Please enter a valid email address");
        }
        
        if (isIdAvailable === false) {
            return alert("Seaneb ID is already taken!");
        }
        
        if (!form.place_id) {
            return alert("Please select your hometown from the search list!");
        }
        
        if (!form.dob) {
            return alert("Please select your Date of Birth");
        }
        
        if (!form.agree) {
            return alert("Please accept Terms & Conditions");
        }

        setSubmitting(true);
        
        try {
            // Prepare payload - email optional
            const payload = {
                country_code: country_code,
                mobile_number: mobile_number,
                first_name: form.firstName.trim(),
                last_name: form.lastName.trim(),
                dob: form.dob,
                seaneb_id: form.seanebId,
                place_id: form.place_id,
                product_key: "news",
                gender: (form.gender || "other").toLowerCase()
            };
            
            // Add email only if provided
            if (form.email) {
                payload.email = form.email.trim();
            }

            console.log("Submitting form:", payload);

            // API_BASE हटाएँ, सीधे fetch करें
          const res = await fetch('/api/external/v1/user/signup', { 
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-product-key": "news"
            },
            body: JSON.stringify(payload)
          });
            const data = await res.json();
            console.log("Signup response:", data);

            // Handle successful registration
            if (res.status === 201 || res.status === 200) {
                // Save tokens if provided
                if (data.access_token) {
                    setAuthTokens(
                        data.access_token, 
                        data.refresh_token, 
                        data.csrf_token
                    );
                }
                
                // Redirect to success page
                router.push("/auth/success");
            } 
            // Handle user already exists
            else if (res.status === 409) {
                console.log("User already exists");
                router.push("/auth/success");
            }
            // Handle other errors
            else {
                const errorMsg = data?.error?.message || data?.message || "Signup failed";
                alert(errorMsg);
            }
        } catch (err) { 
            alert("Connection error. Please try again."); 
            console.error("Signup Error:", err);
        } finally { 
            setSubmitting(false); 
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-50/30 flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl p-8 md:p-14 border border-gray-100">
                <header className="flex justify-between items-center mb-10">
                    <Logo />
                    <LanguageSelect value={lang} onChange={setLang} />
                </header>

                <div className="mb-10 text-center md:text-left">
                    <h3 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                        {t.completeProfile || "Complete Your Profile"}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        <p className="text-gray-500 font-bold tracking-wide">
                            Verified: +{country_code} {mobile_number}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    {/* First Name */}
                    <FormInput 
                        label={t.firstName || "First Name"} 
                        value={form.firstName} 
                        onChange={(v) => setForm({...form, firstName: v})} 
                        placeholder="John"
                        required
                    />
                    
                    {/* Last Name */}
                    <FormInput 
                        label={t.lastName || "Last Name"} 
                        value={form.lastName} 
                        onChange={(v) => setForm({...form, lastName: v})} 
                        placeholder="Doe"
                        required
                    />
                    
                    {/* Email with Verification - OPTIONAL */}
                    <div className="flex flex-col w-full group">
                        <label className="text-sm font-black text-gray-700 mb-2 ml-1 transition-colors group-focus-within:text-black">
                            {t.email || "Email"} <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <div className="flex gap-3 items-center w-full">
                            <div className="relative grow"> 
                                <input 
                                    type="email" 
                                    value={form.email} 
                                    onChange={(e) => handleEmailChange(e.target.value)} 
                                    placeholder="you@email.com" 
                                    className={`w-full border-2 rounded-2xl px-5 py-3 bg-gray-50/50 font-bold text-gray-900 focus:bg-white focus:border-black outline-none transition-all h-14 
                                    ${emailVerified ? 'border-green-500 bg-green-50/20' : 
                                      emailError ? 'border-red-300' : 'border-gray-50'}`}
                                />
                            </div>
                            
                            {form.email && !emailVerified && (
                                <div className="shrink-0">
                                    <Button 
                                        onClick={handleSendEmailOtp} 
                                        disabled={!form.email || !!emailError}
                                        className="px-6 rounded-2xl font-black text-[11px] h-14 flex items-center justify-center whitespace-nowrap active:scale-95 transition-all bg-black text-white hover:bg-gray-800"
                                    >
                                        Verify
                                    </Button>
                                </div>
                            )}
                            
                            {emailVerified && (
                                <div className="shrink-0">
                                    <span className="px-6 rounded-2xl font-black text-[11px] h-14 flex items-center justify-center bg-green-500 text-white">
                                        ✓ Verified
                                    </span>
                                </div>
                            )}
                        </div>
                        {emailError && (
                            <p className="text-xs text-red-500 mt-1 ml-2">{emailError}</p>
                        )}
                        {form.email && !emailVerified && !emailError && (
                            <p className="text-xs text-amber-600 mt-1 ml-2">
                                ⚠️ Please verify your email
                            </p>
                        )}
                    </div>

                    {/* Seaneb ID with Availability Check */}
                    <FormInput 
                        label={t.seanebId || "Seaneb ID"} 
                        value={form.seanebId} 
                        onChange={(v) => {
                            setTouched({...touched, seanebId: true}); 
                            setForm({...form, seanebId: v.toLowerCase().replace(/[^a-z0-9-]/g, "")});
                            setIsIdAvailable(null);
                        }}
                        placeholder="your-unique-id"
                        showVerify={true}
                        verifyLabel={verifyingId ? "Checking..." : "Check"}
                        onVerify={verifySeanebId}
                        isVerified={isIdAvailable === true}
                        statusType="id"
                        required
                    />

                    {/* Gender Select */}
                    <div className="flex flex-col">
                        <label className="text-sm font-black text-gray-700 mb-2 ml-1">
                            {t.gender || "Gender"} <span className="text-red-500">*</span>
                        </label>
                        <select 
                            value={form.gender} 
                            onChange={(e) => setForm({...form, gender: e.target.value})}
                            className="w-full border-2 border-gray-50 rounded-2xl px-6 py-3 bg-gray-50/50 focus:bg-white focus:border-black outline-none transition-all h-14 font-bold text-gray-900 appearance-none"
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Hometown Autocomplete */}
                    <HometownAutocomplete 
                        label={t.hometown || "Hometown"} 
                        value={form.hometown} 
                        onChange={(data) => {
                            setForm({
                                ...form, 
                                hometown: data.label, 
                                place_id: data.place_id
                            });
                        }} 
                        required
                    />
                    
                    {/* Date of Birth */}
                    <div className="md:col-span-2">
                        <DatePicker
                            label={t.dob || "Date of Birth"}
                            value={form.dob}
                            required={true}
                            onChange={(e) => setForm({ ...form, dob: e.target.value })}
                        />                   
                    </div>
                </div>

                {/* Terms and Conditions */}
                <div className="mt-8 p-6 bg-gray-50/80 rounded-3xl border-2 border-dashed border-gray-200 hover:border-black/20 transition-colors">
                    <label className="flex gap-4 cursor-pointer items-start">
                        <input 
                            type="checkbox" 
                            checked={form.agree} 
                            onChange={(e) => setForm({...form, agree: e.target.checked})} 
                            className="w-6 h-6 accent-black rounded-lg mt-0.5 shrink-0" 
                        />
                        <span className="text-sm text-gray-500 font-bold leading-relaxed">
                            By checking this, I agree to the <span className="text-black underline">Terms of Service</span> and <span className="text-black underline">Privacy Policy</span>.
                        </span>
                    </label>
                </div>

                {/* Submit Button */}
                <Button 
                    onClick={handleSubmit} 
                    disabled={submitting || (form.email && !emailVerified) || !form.agree} 
                    className={`w-full py-6 mt-10 text-2xl font-black rounded-3xl shadow-xl active:scale-[0.98] transition-all
                        ${(submitting || (form.email && !emailVerified) || !form.agree) ? 'opacity-50 grayscale' : 'hover:shadow-2xl bg-black text-white'}`}
                >
                    {submitting ? "Processing..." : (t.submit || "Complete Registration")}
                </Button>
            </div>

            {/* Email OTP Modal */}
            {showEmailOtpCard && (
                <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
                        <OtpInputCard 
                            otp={emailOtp} 
                            setOtp={setEmailOtp}
                            onVerify={handleVerifyEmailOtp} 
                            onResend={handleSendEmailOtp}
                            timer={resendTimer} 
                            loading={verifyingEmailOtp}
                            error={otpError} 
                            title="Verify Email"
                            description={`We've sent a 4-digit code to ${form.email}`}
                            buttonText="Verify Email"
                        />
                        <button 
                            onClick={() => setShowEmailOtpCard(false)} 
                            className="w-full mt-6 text-sm text-gray-400 font-bold hover:text-black transition-colors"
                        >
                            Cancel & Edit Email
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// FormInput Sub-component (unchanged)
function FormInput({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    type = "text", 
    showVerify, 
    verifyLabel, 
    onVerify, 
    disabled, 
    isVerified, 
    statusType,
    required = false 
}) {
    return (
        <div className="flex flex-col w-full group">
            <label className="text-sm font-black text-gray-700 mb-2 ml-1 transition-colors group-focus-within:text-black">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-3 items-center w-full">
                <div className="relative grow"> 
                    <input 
                        type={type} 
                        value={value || ""} 
                        onChange={(e) => onChange(e.target.value)} 
                        placeholder={placeholder} 
                        disabled={disabled}
                        className={`w-full border-2 rounded-2xl px-5 py-3 bg-gray-50/50 font-bold text-gray-900 focus:bg-white focus:border-black outline-none transition-all h-14 
                        ${isVerified ? 'border-green-500 bg-green-50/20' : 'border-gray-50 focus:ring-4 focus:ring-black/5'}`}
                    />
                </div>
                
                {showVerify && (
                    <div className="shrink-0">
                        <Button 
                            onClick={onVerify} 
                            disabled={disabled || !value}
                            className={`px-6 rounded-2xl font-black text-[11px] h-14 flex items-center justify-center whitespace-nowrap active:scale-95 transition-all 
                            ${isVerified 
                                ? 'bg-green-500 text-white cursor-default' 
                                : 'bg-black text-white hover:bg-gray-800'}`}
                        >
                            {isVerified && statusType === 'id' ? "Available ✓" : verifyLabel}
                        </Button>
                    </div>
                )}
            </div>
            {isVerified === false && statusType === 'id' && value && (
                <p className="text-[10px] text-red-500 font-bold mt-2 ml-2 tracking-tight flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> ID already taken, try another.
                </p>
            )}
        </div>
    );
}