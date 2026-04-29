"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronDown, 
  CheckCircle2, 
  Camera, 
  User, 
  X, 
  Loader2, 
  Mail, 
  AtSign} from 'lucide-react';
import Cropper from 'react-easy-crop';

// UI Components
import DatePicker from "@/components/ui/DatePicker";
import Logo from "@/components/ui/Logo";
import HometownAutocomplete from "@/components/ui/HometownAutocomplete";
import OtpInputCard from "@/components/ui/OtpInputCard";

// Logic & API
import api, { EMAIL_OTP_PURPOSE } from '@/lib/apiconfig';
import getCroppedImg from '@/lib/cropImage';

const toast = {
  success: (msg) => alert(`SUCCESS: ${msg}`),
  error: (msg) => alert(`ERROR: ${msg}`),
  info: (msg) => alert(`INFO: ${msg}`)
};

function OnboardingContent() {
  const router = useRouter();
  
  // Context from User Management (read from sessionStorage)
  const [targetPhone, setTargetPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('staff_registration');
      if (stored) {
        const data = JSON.parse(stored);
        setTargetPhone(data.target || '');
        setCountryCode(data.cc ? `+${data.cc}` : '+91');
      } else {
        router.replace('/media-house/users');
      }
    } catch {
      router.replace('/media-house/users');
    }
  }, [router]);

  // State Management
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

  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState(false);
  const [isIdAvailable, setIsIdAvailable] = useState(null);
  const [touched, setTouched] = useState({ seanebId: false });

  // Email Verification State
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState(["", "", "", ""]);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpError, setOtpError] = useState("");

  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const genderRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropSource, setCropSource] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);



  useEffect(() => {
      if (form.firstName && form.lastName && !touched.seanebId) {
          const randomNum = Math.floor(100 + Math.random() * 900);
          const generated = `${form.firstName.toLowerCase()}-${form.lastName.toLowerCase()}-${randomNum}`;
          setForm(prev => ({ ...prev, seanebId: generated.replace(/[^a-z0-9-]/g, "").substring(0, 20) }));
      }
  }, [form.firstName, form.lastName, touched.seanebId]);

  const verifySeanebId = async () => {
      if (!form.seanebId || form.seanebId.length < 3) return toast.error("ID too short");
      setVerifyingId(true);
      try {
          const data = await api.user.verifySeanebId(form.seanebId);
          setIsIdAvailable(data.available);
      } catch (err) { toast.error("Error checking ID"); } finally { setVerifyingId(false); }
  };

  const handleSendEmailOtp = async () => {
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error("Valid email required");
      try {
          await api.auth.sendEmailOtp({ email: form.email, purpose: EMAIL_OTP_PURPOSE.USER_SIGNUP });
          setShowEmailOtp(true); 
          setResendTimer(30);
      } catch (err) { toast.error("Failed to send OTP"); }
  };

  const handleVerifyEmail = async () => {
      const fullOtp = emailOtp.join("");
      if (fullOtp.length < 4) return setOtpError("4 digits required");
      setVerifyingEmail(true);
      try {
          await api.auth.verifyEmailOtp({ email: form.email, otp: fullOtp, purpose: EMAIL_OTP_PURPOSE.USER_SIGNUP });
          setEmailVerified(true); 
          setShowEmailOtp(false);
      } catch (err) { setOtpError("Invalid code"); } finally { setVerifyingEmail(false); }
  };

  const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => { setCropSource(reader.result); setIsCropping(true); };
      reader.readAsDataURL(file);
  };

  const saveCroppedImage = async () => {
      try {
          const croppedImage = await getCroppedImg(cropSource, croppedAreaPixels);
          setImageFile(croppedImage);
          setPreviewUrl(URL.createObjectURL(croppedImage));
          setIsCropping(false);
      } catch (e) { toast.error("Crop failed"); }
  };

  const handleSubmit = async (e) => {
      if (e) e.preventDefault();
      const errors = {};
      if (!form.firstName?.trim()) errors.firstName = "Required";
      if (!form.lastName?.trim()) errors.lastName = "Required";
      if (!form.dob) errors.dob = "Required";
      if (!form.gender) errors.gender = "Required";
      if (!form.place_id) errors.place_id = "Required";
      if (!form.seanebId?.trim()) errors.seanebId = "Required";
      if (isIdAvailable === false) errors.seanebId = "Already taken";
      if (form.email && !emailVerified) errors.email = "Verify email";

      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) return;

      setSubmitting(true);
      try {
          const payload = new FormData();
          payload.append('country_code', countryCode.replace('+', ''));
          payload.append('mobile_number', targetPhone);
          payload.append('first_name', form.firstName.trim());
          payload.append('last_name', form.lastName.trim());
          payload.append('dob', form.dob);
          payload.append('seaneb_id', form.seanebId);
          payload.append('place_id', form.place_id);
          payload.append('gender', form.gender.toLowerCase());
          payload.append('identifier_type', "0");
          payload.append('product_key', process.env.NEXT_PUBLIC_PRODUCT_KEY);
          if (form.email) payload.append('email', form.email.trim());
          if (imageFile) payload.append('avatar', imageFile);

          const signupData = await api.user.signup(payload);
          if (signupData?.success) {
            const addResponse = await api.staff.add({
                target_central_user_id: signupData.user_id
            });

            if (addResponse?.success) {
                toast.success("Identity established! Joining node...");
                setTimeout(() => { router.push('/media-house/users'); }, 1500);
            } else {
                toast.error("Account created, but role assignment failed.");
                router.push('/media-house/users');
            }
          } else {
            toast.error(signupData?.message || "Registration failed");
          }
      } catch (err) { toast.error(err.message || "Registration error"); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 md:p-8 animate-fade-in font-sans">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-2xl w-full max-h-[95vh] overflow-y-auto no-scrollbar bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 md:p-12">
        
        <div className="flex justify-center mb-10">
          <Logo size="sm" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border-2 border-slate-100 flex items-center justify-center transition-all group-hover:scale-105 shadow-sm">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-slate-300" />
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-7 h-7 bg-black text-white rounded-xl flex items-center justify-center border-2 border-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                >
                  <Camera size={12} />
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <InputLabel>First Name</InputLabel>
                <Input 
                  placeholder="Name"
                  value={form.firstName}
                  onChange={(e) => setForm({...form, firstName: e.target.value})}
                  required
                  error={fieldErrors.firstName}
                />
              </div>
              <div className="space-y-1">
                <InputLabel>Last Name</InputLabel>
                <Input 
                  placeholder="Surname"
                  value={form.lastName}
                  onChange={(e) => setForm({...form, lastName: e.target.value})}
                  required
                  error={fieldErrors.lastName}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1 relative" ref={genderRef}>
              <InputLabel>Gender</InputLabel>
              <button 
                type="button"
                onClick={() => setIsGenderOpen(!isGenderOpen)} 
                className={`w-full flex items-center justify-between border rounded-xl px-4 h-11 bg-slate-50/50 text-sm font-semibold tracking-tight transition-all focus:ring-2 focus:ring-black outline-none ${fieldErrors.gender ? 'border-rose-500' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <span className={form.gender ? "text-slate-900" : "text-slate-400"}>{form.gender || "Select Category"}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isGenderOpen ? 'rotate-180' : ''}`} />
              </button>
              {isGenderOpen && (
                <ul className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  {['Male', 'Female', 'Other'].map(g => (
                    <li key={g} onClick={() => { setForm({...form, gender: g}); setIsGenderOpen(false); }} className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-semibold text-slate-700 transition-colors uppercase tracking-tight">{g}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1">
              <DatePicker 
                label="Date of Birth"
                required
                value={form.dob} 
                onChange={(e) => setForm({ ...form, dob: e.target.value })} 
                errorText={fieldErrors.dob}
                className="compact-dp"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <HometownAutocomplete 
                label="Hometown (City)"
                placeholder="Search City..."
                value={form.hometown} 
                onChange={(data) => setForm({...form, hometown: data.label, place_id: data.place_id})} 
                error={fieldErrors.place_id}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1 relative">
              <InputLabel>SeaNeB Handle</InputLabel>
              <div className="relative h-11 group">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors" size={14} />
                <input 
                  type="text"
                  value={form.seanebId} 
                  onChange={(e) => {
                    setTouched({ ...touched, seanebId: true });
                    setForm({ ...form, seanebId: e.target.value.toLowerCase() });
                    setIsIdAvailable(null);
                  }} 
                  className={`w-full h-full pl-10 pr-20 bg-slate-50/50 border rounded-xl text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-black ${isIdAvailable === true ? 'border-emerald-500 ring-emerald-100' : fieldErrors.seanebId ? 'border-rose-500' : 'border-slate-100 hover:border-slate-200'}`}
                  placeholder="unique-handle"
                />
                <button 
                  type="button" 
                  onClick={verifySeanebId} 
                  disabled={verifyingId || isIdAvailable === true}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    isIdAvailable === true ? 'text-emerald-600 bg-emerald-50' : 'text-black bg-slate-100 hover:bg-slate-200 active:scale-95'
                  }`}
                >
                  {verifyingId ? "Checking..." : isIdAvailable === true ? "Verified" : "Verify"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-6 items-end">
            <div className="space-y-1">
              <InputLabel>Verified Mobile</InputLabel>
              <div className="h-11 bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 flex items-center justify-between shadow-sm">
                <span className="text-sm font-bold text-emerald-700">{countryCode} {targetPhone}</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
            </div>

            <div className="space-y-1 relative">
              <InputLabel>Business Email (Optional)</InputLabel>
              <div className="relative h-11 group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors" size={14} />
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setEmailVerified(false);
                  }} 
                  placeholder="name@business.com"
                  className={`w-full h-full pl-10 pr-20 bg-slate-50/50 border rounded-xl text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-black ${emailVerified ? 'border-emerald-500 ring-emerald-50' : fieldErrors.email ? 'border-rose-500' : 'border-slate-100 hover:border-slate-200'}`}
                />
                {!emailVerified && form.email && (
                  <button 
                    onClick={handleSendEmailOtp} 
                    type="button" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 active:scale-95"
                  >
                    Verify
                  </button>
                )}
                {emailVerified && <CheckCircle2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-3/4 bg-black hover:bg-slate-900 text-white h-12 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-200 flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : "Establish Identity"}
            </button>
            <button
              type="button"
              onClick={() => router.push('/media-house/users')}
              className="w-1/4 bg-slate-100 hover:bg-slate-200 text-slate-500 h-12 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
            >
              Abort
            </button>
          </div>

        </form>
      </div>

      {showEmailOtp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowEmailOtp(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
            <OtpInputCard 
              otp={emailOtp} 
              setOtp={setEmailOtp} 
              onVerify={handleVerifyEmail} 
              onResend={handleSendEmailOtp} 
              timer={resendTimer} 
              loading={verifyingEmail} 
              error={otpError} 
              title="Verify Email" 
              description={`Unlock ${form.email} domain.`}
              primaryColor="black"
            />
          </div>
        </div>
      )}

      {isCropping && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Scale Identity</p>
              <button onClick={() => setIsCropping(false)} className="text-slate-400 hover:text-slate-900"><X size={18} /></button>
            </div>
            <div className="h-64 relative bg-slate-100">
              <Cropper
                image={cropSource} crop={crop} zoom={zoom} aspect={1}
                onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom}
                cropShape="round" showGrid={false}
              />
            </div>
            <div className="p-6 space-y-4">
              <input
                type="range" value={zoom} min={1} max={3} step={0.1}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-black h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex gap-3">
                <button onClick={() => setIsCropping(false)} className="flex-1 py-3 text-[10px] font-bold text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 uppercase tracking-widest transition-all">Cancel</button>
                <button onClick={saveCroppedImage} className="flex-1 py-3 text-[10px] font-bold bg-black text-white rounded-xl uppercase tracking-widest shadow-lg shadow-slate-100 active:scale-95 transition-all">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .compact-dp div[class*="border"] { height: 2.75rem !important; border-radius: 0.75rem !important; background: rgba(248, 250, 252, 0.5) !important; border: 1px solid #F1F5F9 !important; }
        .compact-dp input { font-weight: 600 !important; font-size: 0.875rem !important; }
        .compact-dp div[class*="focus"] { ring: 2px solid #000000 !important; border-color: transparent !important; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}

function InputLabel({ children }) {
  return (
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{children}</label>
  );
}

function Input({ className = "", error, ...props }) {
  return (
    <input 
      className={`w-full bg-slate-50/50 border rounded-xl px-4 h-11 text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-black ${error ? 'border-rose-500' : 'border-slate-100 hover:border-slate-200'} ${className}`}
      {...props}
    />
  );
}

export default function RegistrationPage() {
  return <OnboardingContent />;
}