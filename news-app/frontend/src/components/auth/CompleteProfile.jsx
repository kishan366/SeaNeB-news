"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import LanguageSelect from "@/components/ui/LanguageSelect";
import DatePicker from "@/components/ui/DatePicker";
import Logo from "@/components/ui/Logo";
import HometownAutocomplete from "@/components/ui/HometownAutocomplete";
import OtpInputCard from "@/components/ui/OtpInputCard";
import apiClient from '@/lib/apiClient';
import { setAuthTokens } from '@/lib/auth';
import api, { EMAIL_OTP_PURPOSE } from '@/lib/apiconfig';
import Cookies from 'js-cookie';
import { ChevronDown, CheckCircle2, Camera, User, X, Loader2, Hash, Smartphone, Mail, Globe } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import en from "@/i18n/en";
import hi from "@/i18n/hi";
import gu from "@/i18n/gu";

const languages = { en, hi, gu };

export default function CompleteProfileForm() {
    const router = useRouter();

    const [userData, setUserData] = useState({ mobile_number: "", country_code: "91" });
    const [dataLoaded, setDataLoaded] = useState(false);
    const [lang, setLang] = useState("en");
    const t = languages[lang] || en;

    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", gender: "",
        dob: "", hometown: "", seanebId: "", agree: false, place_id: ""
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
    const [emailError, setEmailError] = useState("");
    const [isGenderOpen, setIsGenderOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    
    // Photo & Crop states
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [imageError, setImageError] = useState("");
    const fileInputRef = useRef(null);
    const genderRef = useRef(null);
    
    // Cropper specific states
    const [isCropping, setIsCropping] = useState(false);
    const [cropSource, setCropSource] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    useEffect(() => {
        const phone = sessionStorage.getItem('otp_phone');
        const cc = sessionStorage.getItem('otp_cc');
        if (phone && cc) {
            setUserData({ mobile_number: phone, country_code: cc });
            setDataLoaded(true);

            const csrf = Cookies.get('csrf_token_news');
            if (!csrf) {
                apiClient.refreshToken().catch(() => { });
            }
        } else {
            router.replace("/auth/login");
        }

        const handleClickOutside = (event) => {
            if (genderRef.current && !genderRef.current.contains(event.target)) {
                setIsGenderOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [router]);

    useEffect(() => {
        if (form.firstName && form.lastName && !touched.seanebId) {
            const randomNum = Math.floor(100 + Math.random() * 900);
            const generated = `${form.firstName.toLowerCase()}-${form.lastName.toLowerCase()}-${randomNum}`;
            setForm(prev => ({ ...prev, seanebId: generated.replace(/[^a-z0-9-]/g, "").substring(0, 20) }));
            setIsIdAvailable(null);
        }
    }, [form.firstName, form.lastName, touched.seanebId]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const validateEmail = (email) => {
        if (!email) return true;
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        const parts = email.split('.');
        if (parts[parts.length - 1] === parts[parts.length - 2]) return false;
        return re.test(email);
    };

    const handleEmailChange = (value) => {
        setForm({ ...form, email: value });
        setEmailVerified(false);
        if (value && !validateEmail(value)) {
            setEmailError("Invalid format");
        } else {
            setEmailError("");
        }
    };

    const verifySeanebId = async () => {
        if (!form.seanebId || form.seanebId.length < 3) return alert("Min 3 characters");
        setVerifyingId(true);
        try {
            const data = await api.user.verifySeanebId(form.seanebId);
            setIsIdAvailable(data.available);
        } catch (err) { alert("Error"); } finally { setVerifyingId(false); }
    };

    const handleSendEmailOtp = async () => {
        if (!form.email || emailError) return alert("Valid email required");
        try {
            await api.auth.sendEmailOtp({ email: form.email, purpose: EMAIL_OTP_PURPOSE.USER_SIGNUP });
            setShowEmailOtpCard(true); setResendTimer(30);
        } catch (err) { alert("Error"); }
    };

    const handleVerifyEmailOtp = async () => {
        const fullOtp = emailOtp.join("");
        if (fullOtp.length < 4) return setOtpError("4 digits required");
        setVerifyingEmailOtp(true);
        try {
            await api.auth.verifyEmailOtp({ email: form.email, otp: fullOtp, purpose: EMAIL_OTP_PURPOSE.USER_SIGNUP });
            setEmailVerified(true); setShowEmailOtpCard(false);
        } catch (err) { setOtpError("Invalid"); } finally { setVerifyingEmailOtp(false); }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return alert("Select an image file");
        if (file.size > 2 * 1024 * 1024) return alert("Maximum 2MB allowed");
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setCropSource(reader.result);
            setIsCropping(true);
        };
        reader.readAsDataURL(file);
    };

    const onCropComplete = useCallback((_area, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const saveCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(cropSource, croppedAreaPixels);
            setImageFile(croppedImage);
            setPreviewUrl(URL.createObjectURL(croppedImage));
            setIsCropping(false);
            setCropSource(null);
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        // 1. Reset and Validate
        const errors = {};
        if (!form.firstName?.trim()) errors.firstName = "First Name is required";
        if (!form.lastName?.trim()) errors.lastName = "Last Name is required";
        if (!form.dob) errors.dob = "Date of Birth is required";
        if (!form.gender) errors.gender = "Gender is required";
        if (!form.place_id) errors.place_id = "Hometown is required";
        if (!form.seanebId?.trim()) errors.seanebId = "SeaNeB ID is required";
        if (isIdAvailable === false) errors.seanebId = "This ID is already taken";
        if (!form.agree) errors.agree = "You must agree to the terms";

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('country_code', userData.country_code);
            formData.append('mobile_number', userData.mobile_number);
            formData.append('first_name', form.firstName.trim());
            formData.append('last_name', form.lastName.trim());
            formData.append('dob', form.dob);
            formData.append('seaneb_id', form.seanebId);
            formData.append('place_id', form.place_id);
            formData.append('gender', form.gender.toLowerCase());
            formData.append('identifier_type', "0");
            formData.append('product_key', process.env.NEXT_PUBLIC_PRODUCT_KEY);
            if (form.email) formData.append('email', form.email.trim());
            if (imageFile) formData.append('avatar', imageFile);

            const data = await api.user.signup(formData);
            if (data.access_token) setAuthTokens(data.access_token, data.csrf_token);
            
            sessionStorage.removeItem("otp_phone");
            sessionStorage.removeItem("otp_cc");
            
            setTimeout(() => {
                const targetAppUrl = process.env.NEXT_PUBLIC_LISTING_URL;
                const redirectUrl = data.bridge_token ? `${targetAppUrl}?bridge_token=${data.bridge_token}` : targetAppUrl;
                window.open(redirectUrl, '_blank');
                window.location.href = targetAppUrl;
            }, 300);
        } catch (err) { alert(err.message || "Error during registration"); } finally { setSubmitting(false); }
    };

    if (!dataLoaded) return <div className="h-screen flex items-center justify-center font-bold">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-['Noto_Sans']">
            
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                
                <header className="flex justify-between items-center mb-6">
                    <Logo className="scale-90 origin-left" />
                    <LanguageSelect value={lang} onChange={setLang} />
                </header>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.completeProfile}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t.profileDesc}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* PHOTO SECTION */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-50 shadow-inner flex items-center justify-center">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-gray-300" />
                                )}
                            </div>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:bg-gray-800 transition-colors"
                            >
                                <Camera size={14} />
                            </button>
                            {previewUrl && (
                                <button 
                                    type="button"
                                    onClick={() => { setPreviewUrl(null); setImageFile(null); }}
                                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 mt-2 tracking-wide uppercase">Profile Photo</p>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/png, image/jpeg, image/jpg" />
                    </div>

                    {/* FORM FIELDS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        
                        <FormInput 
                            label={t.firstName} 
                            name="firstName"
                            value={form.firstName} 
                            onChange={(v) => {
                                setForm({...form, firstName: v});
                                if (fieldErrors.firstName) setFieldErrors(p => ({...p, firstName: null}));
                            }} 
                            placeholder={t.firstNamePlaceholder} 
                            required 
                            error={fieldErrors.firstName}
                        />
                        
                        <FormInput 
                            label={t.lastName} 
                            name="lastName"
                            value={form.lastName} 
                            onChange={(v) => {
                                setForm({...form, lastName: v});
                                if (fieldErrors.lastName) setFieldErrors(p => ({...p, lastName: null}));
                            }} 
                            placeholder={t.lastNamePlaceholder} 
                            required 
                            error={fieldErrors.lastName}
                        />

                        <div className="flex flex-col relative z-20" ref={genderRef}>
                            <label className="text-[13px] font-bold text-gray-700 mb-1.5 ml-1">{t.gender} <span className="text-red-500">*</span></label>
                            <button 
                                type="button"
                                onClick={() => setIsGenderOpen(!isGenderOpen)} 
                                className={`w-full flex items-center justify-between border rounded-xl px-4 h-11 bg-white text-sm hover:border-black transition-all ${fieldErrors.gender ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                            >
                                <span className={form.gender ? "text-gray-900" : "text-gray-400"}>{form.gender || t.selectGender}</span>
                                <ChevronDown size={16} className={`transition-transform duration-200 ${isGenderOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isGenderOpen && (
                                <ul className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl z-30 py-1 mt-1 overflow-hidden">
                                    {['Male', 'Female', 'Other'].map(g => (
                                        <li key={g} onClick={() => { 
                                            setForm({...form, gender: g}); 
                                            setIsGenderOpen(false); 
                                            if (fieldErrors.gender) setFieldErrors(p => ({...p, gender: null}));
                                        }} className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm font-medium transition-colors">{t[g.toLowerCase()] || g}</li>
                                    ))}
                                </ul>
                            )}
                            {fieldErrors.gender && <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">{fieldErrors.gender}</p>}
                        </div>

                        <div className="flex flex-col relative z-10">
                            <DatePicker 
                                label={t.dob} 
                                required
                                value={form.dob} 
                                onChange={(e) => {
                                    setForm({ ...form, dob: e.target.value });
                                    if (fieldErrors.dob) setFieldErrors(p => ({...p, dob: null}));
                                }} 
                                errorText={fieldErrors.dob}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[13px] font-bold text-gray-700 mb-1.5 ml-1">{t.email}</label>
                            <div className="flex gap-2 h-11">
                                <div className="relative grow">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="email" 
                                        value={form.email} 
                                        onChange={(e) => handleEmailChange(e.target.value)} 
                                        placeholder={t.emailPlaceholder}
                                        className={`w-full h-full pl-11 pr-4 border rounded-xl text-sm outline-none transition-all ${emailVerified ? 'border-green-500 bg-green-50' : 'border-gray-200 focus:border-black'}`}
                                    />
                                </div>
                                {form.email && !emailVerified && (
                                    <button onClick={handleSendEmailOtp} type="button" className="px-4 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">{t.verify}</button>
                                )}
                                {emailVerified && <CheckCircle2 className="text-green-500 my-auto ml-1" size={18} />}
                            </div>
                        </div>

                        <FormInput 
                            label={t.mobileNumber || "Mobile Number"} 
                            name="mobile"
                            value={userData.mobile_number} 
                            disabled 
                            icon={<Smartphone size={16} />}
                        />

                        <div className="relative">
                            <HometownAutocomplete 
                                label={t.hometown} 
                                placeholder={t.hometownPlaceholder} 
                                value={form.hometown} 
                                onChange={(data) => {
                                    setForm({...form, hometown: data.label, place_id: data.place_id});
                                    if (fieldErrors.place_id) setFieldErrors(p => ({...p, place_id: null}));
                                }} 
                                error={fieldErrors.place_id}
                                touched={!!fieldErrors.place_id}
                            />
                        </div>

                        <FormInput 
                            label={t.seanebId} 
                            name="seanebId"
                            value={form.seanebId} 
                            onChange={(v) => {
                                setTouched({ ...touched, seanebId: true });
                                setForm({ ...form, seanebId: v.toLowerCase() });
                                setIsIdAvailable(null);
                                if (fieldErrors.seanebId) setFieldErrors(p => ({...p, seanebId: null}));
                            }} 
                            required 
                            icon={<Hash size={16} />}
                            showVerify={true}
                            verifyLabel={verifyingId ? "..." : (t.check || "Check")}
                            onVerify={verifySeanebId}
                            isVerified={isIdAvailable === true}
                            statusType="id"
                            error={fieldErrors.seanebId}
                        />

                    </div>

                    <div className="pt-4 border-t border-gray-50 flex flex-col gap-4">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" checked={form.agree} onChange={(e) => {
                                setForm({...form, agree: e.target.checked});
                                if (fieldErrors.agree) setFieldErrors(p => ({...p, agree: null}));
                            }} className={`mt-1 w-4 h-4 accent-black rounded border-gray-300 ${fieldErrors.agree ? 'ring-2 ring-red-500' : ''}`} />
                            <span className={`text-[13px] leading-snug ${fieldErrors.agree ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{t.agreeText} <span className="text-black font-bold underline">{t.terms}</span> and <span className="text-black font-bold underline">{t.privacy}</span>.</span>
                        </label>

                        <Button 
                            onClick={handleSubmit} 
                            disabled={submitting || !form.agree} 
                            className="w-full h-12 bg-black text-white rounded-xl font-bold text-sm tracking-wide shadow-xl shadow-black/5 hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {submitting ? "Finalizing..." : t.submit}
                        </Button>
                    </div>

                </form>

            </div>

            {/* Email OTP Overlay */}
            {showEmailOtpCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl">
                        <OtpInputCard otp={emailOtp} setOtp={setEmailOtp} onVerify={handleVerifyEmailOtp} onResend={handleSendEmailOtp} timer={resendTimer} loading={verifyingEmailOtp} error={otpError} title="Verify Email" />
                        <button onClick={() => setShowEmailOtpCard(false)} className="w-full mt-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cancel</button>
                    </div>
                </div>
            )}

            {/* Compact Image Editor Modal */}
            {isCropping && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Crop Photo</p>
                            <button onClick={() => setIsCropping(false)} className="text-gray-400 hover:text-black transition-colors"><X size={20} /></button>
                        </div>

                        {/* Cropper area with fixed height */}
                        <div className="h-72 relative bg-gray-50">
                            <Cropper
                                image={cropSource}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>

                        {/* Controls */}
                        <div className="p-6 space-y-5">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <span>Zoom</span>
                                    <span>{Math.round(zoom * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="w-full accent-black h-1 bg-gray-100 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button onClick={() => setIsCropping(false)} className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest">Cancel</button>
                                <button onClick={saveCroppedImage} className="flex-1 py-3 text-xs font-bold bg-black text-white rounded-xl hover:bg-gray-900 shadow-lg shadow-black/20 transition-all active:scale-95 uppercase tracking-widest">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

function FormInput({ label, value, onChange, placeholder, showVerify, verifyLabel, onVerify, isVerified, statusType, required, disabled, icon, error }) {
    return (
        <div className="flex flex-col w-full relative">
            <label className="text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative h-11">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</div>}
                <input 
                    type="text" 
                    value={value || ""} 
                    onChange={onChange ? (e) => onChange(e.target.value) : undefined} 
                    placeholder={placeholder} 
                    disabled={disabled}
                    className={`w-full h-full border rounded-xl px-4 text-sm outline-none transition-all ${
                        icon ? 'pl-11' : ''
                    } ${
                        error ? 'border-red-500 bg-red-50' : isVerified === true ? 'border-green-500 bg-green-50' : 'border-gray-200 focus:border-black'
                    } ${disabled ? 'bg-gray-50 text-gray-500 opacity-70 cursor-not-allowed' : 'bg-white text-gray-900'}`}
                />
                {showVerify && (
                    <button 
                        type="button" 
                        onClick={onVerify} 
                        disabled={isVerified}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-colors ${
                            isVerified ? 'text-green-600' : 'text-gray-400 hover:text-black'
                        }`}
                    >
                        {isVerified && statusType === 'id' ? "Available ✓" : verifyLabel}
                    </button>
                )}
            </div>
            {(error || (isVerified === false && statusType === 'id' && value)) && (
                <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">{error || "ID Already Taken"}</p>
            )}
        </div>
    );
}