import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import Button from '@/components/ui/Button';
import CountrySelector from '@/components/ui/CountrySelector';
import OtpInputCard from '@/components/ui/OtpInputCard';
import api, { OTP_PURPOSE } from '@/lib/apiconfig';
import apiClient from '@/lib/apiClient';

const StepTwo = ({
  formData,
  setFormData,
  onNext,
  onBack,
  handleCancelOnboarding,
  t,
  showNotification
}) => {
  const [fieldErrors, setFieldErrors] = useState({});
  const productKey = process.env.NEXT_PUBLIC_PRODUCT_KEY;

  // Phone OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCountryCode, setOtpCountryCode] = useState('+91');
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [resendVia, setResendVia] = useState("sms");
  const [showResendOptions, setShowResendOptions] = useState(false);

  // WhatsApp OTP States
  const [showWhatsappOtpModal, setShowWhatsappOtpModal] = useState(false);
  const [whatsappOtp, setWhatsappOtp] = useState(['', '', '', '']);
  const [whatsappTimer, setWhatsappTimer] = useState(60);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState('');

  // OTP Timer
  useEffect(() => {
    if (!showOtpModal || otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

  // WhatsApp Timer
  useEffect(() => {
    if (!showWhatsappOtpModal || whatsappTimer <= 0) return;
    const interval = setInterval(() => setWhatsappTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [showWhatsappOtpModal, whatsappTimer]);

  // Auto-verify WhatsApp when number matches verified mobile
  useEffect(() => {
    if (formData.phoneVerified && formData.whatsapp_number && formData.whatsapp_number === formData.primary_number) {
      setFormData(prev => ({ ...prev, whatsappVerified: true }));
    }
  }, [formData.phoneVerified, formData.whatsapp_number, formData.primary_number, setFormData]);

  // Reset WhatsApp verification when number changes
  useEffect(() => {
    if (formData.whatsapp_number && formData.whatsapp_number !== formData.primary_number) {
      setFormData(prev => ({ ...prev, whatsappVerified: false }));
    }
  }, [formData.whatsapp_number, formData.primary_number, setFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "primary_number" || name === "whatsapp_number") {
      const digits = value.replace(/\D/g, '');
      if (name === "primary_number") {
        setFormData(prev => ({ ...prev, phoneVerified: false }));
        if (formData.sameAsPrimary) {
          setFormData(prev => ({ ...prev, primary_number: digits, whatsapp_number: digits }));
          return;
        }
        setFormData(prev => ({ ...prev, primary_number: digits }));
      } else if (name === "whatsapp_number") {
        setFormData(prev => ({ ...prev, sameAsPrimary: false, whatsapp_number: digits }));
        // Auto-verify if matches mobile and mobile is verified
        if (digits && digits === formData.primary_number && formData.phoneVerified) {
          setFormData(prev => ({ ...prev, whatsappVerified: true }));
        } else {
          setFormData(prev => ({ ...prev, whatsappVerified: false }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleCountryChange = (name, value) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'primary_country_code' && formData.sameAsPrimary) {
        newData.whatsapp_country_code = value;
      }
      return newData;
    });
  };

  const handleSameNumber = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({ ...prev, sameAsPrimary: checked }));
    if (checked) {
      setFormData(prev => ({
        ...prev,
        whatsapp_number: formData.primary_number,
        whatsapp_country_code: formData.primary_country_code
      }));
      if (formData.phoneVerified && formData.primary_number) {
        setFormData(prev => ({ ...prev, whatsappVerified: true }));
      }
    } else {
      setFormData(prev => ({ ...prev, whatsapp_number: '', whatsappVerified: false }));
    }
  };

  // SEND SMS OTP
  const sendOtp = async () => {
    if (!formData.primary_number || formData.primary_number.length < 10) {
      return showNotification('Please enter valid mobile number', 'warning');
    }
    setVerifyingPhone(true);
    setOtpError('');
    try {
      const phone = formData.primary_number;
      const cc = formData.primary_country_code;
      await api.auth.sendOtp({
        identifier_type: 0,
        country_code: cc,
        mobile_number: phone,
        purpose: OTP_PURPOSE.BUSINESS_VERIFY,
        via: 'sms',
        product_key: productKey
      });
      setOtpPhone(phone);
      setOtpCountryCode(cc);
      setOtpTimer(60);
      setOtp(['', '', '', '']);
      setShowOtpModal(true);
    } catch (error) {
      const msg = error.data?.message || 'Failed to send OTP';
      setOtpError(msg);
      showNotification(msg, 'error');
    } finally {
      setVerifyingPhone(false);
    }
  };

  // VERIFY SMS OTP
  const verifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 4 || otpLoading) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const data = await api.auth.verifyOtp({
        identifier_type: 0,
        country_code: otpCountryCode,
        mobile_number: otpPhone,
        otp: fullOtp,
        purpose: OTP_PURPOSE.BUSINESS_VERIFY,
        product_key: productKey
      });
      if (data && data.data?.access_token) {
        apiClient.setTokens(data.data.access_token, data.data.csrf_token || data.csrf_token);
      }
      setFormData(prev => ({ ...prev, phoneVerified: true }));
      setShowOtpModal(false);
      showNotification('Phone number verified!', 'success');
      if (formData.whatsapp_number === formData.primary_number) {
        setFormData(prev => ({ ...prev, whatsappVerified: true }));
      }
    } catch (error) {
      setOtpError(error.data?.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      await api.auth.sendOtp({
        identifier_type: 0,
        country_code: otpCountryCode,
        mobile_number: otpPhone,
        purpose: OTP_PURPOSE.BUSINESS_VERIFY,
        via: resendVia,
        product_key: productKey
      });
      setOtp(['', '', '', '']);
      setOtpTimer(60);
      setShowResendOptions(false);
    } catch (error) {
      setOtpError(error.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // WHATSAPP OTP
  const sendWhatsappOtp = async () => {
    if (!formData.whatsapp_number || formData.whatsapp_number.length < 10) {
      return showNotification("Enter valid WhatsApp number", "warning");
    }
    setWhatsappLoading(true);
    setWhatsappError('');
    try {
      await api.auth.sendOtp({
        identifier_type: 0,
        country_code: formData.whatsapp_country_code,
        mobile_number: formData.whatsapp_number,
        purpose: OTP_PURPOSE.BUSINESS_VERIFY,
        via: "whatsapp",
        product_key: productKey
      });
      setShowWhatsappOtpModal(true);
      setWhatsappTimer(60);
      setWhatsappOtp(['', '', '', '']);
    } catch (err) {
      showNotification(err.data?.message || "Network error", "error");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const verifyWhatsappOtp = async () => {
    const fullOtp = whatsappOtp.join('');
    if (fullOtp.length < 4) return;
    setWhatsappLoading(true);
    setWhatsappError('');
    try {
      await api.auth.verifyOtp({
        identifier_type: 0,
        country_code: formData.whatsapp_country_code,
        mobile_number: formData.whatsapp_number,
        otp: fullOtp,
        purpose: OTP_PURPOSE.BUSINESS_VERIFY,
        via: "whatsapp",
        product_key: productKey
      });
      setFormData(prev => ({ ...prev, whatsappVerified: true }));
      setShowWhatsappOtpModal(false);
      showNotification("WhatsApp verified!", "success");
    } catch (err) {
      setWhatsappError(err.data?.message || "Verification failed");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const resendWhatsappOtp = async () => {
    setWhatsappLoading(true);
    setWhatsappError('');
    try {
      await api.auth.sendOtp({
        identifier_type: 0,
        country_code: formData.whatsapp_country_code,
        mobile_number: formData.whatsapp_number,
        purpose: OTP_PURPOSE.BUSINESS_VERIFY,
        via: "whatsapp",
        product_key: productKey
      });
      setWhatsappTimer(60);
      setWhatsappOtp(['', '', '', '']);
      setWhatsappError('');
    } catch (err) {
      setWhatsappError(err.data?.message || "Failed to resend OTP");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const validateAndNext = () => {
    const errors = {};
    if (!formData.primary_number || formData.primary_number.length < 10) {
      errors.primary_number = true;
      showNotification('Valid mobile number is required', 'warning');
      return setFieldErrors(errors);
    }
    if (!formData.phoneVerified) {
      errors.primary_number = true;
      showNotification('Please verify your mobile number first', 'warning');
      return setFieldErrors(errors);
    }
    if (formData.whatsapp_number && formData.whatsapp_number.trim() !== '' &&
      formData.whatsapp_number !== formData.primary_number && !formData.whatsappVerified) {
      errors.whatsapp_number = true;
      showNotification('Please verify your WhatsApp number', 'warning');
      return setFieldErrors(errors);
    }
    setFieldErrors({});
    onNext();
  };

  return (
    <div className="space-y-4">
      {/* Phone OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
            <OtpInputCard
              otp={otp}
              setOtp={setOtp}
              onVerify={verifyOtp}
              onResend={() => setShowResendOptions(true)}
              timer={otpTimer}
              loading={otpLoading}
              error={otpError}
              title="Verify Mobile Number"
              description={`Enter OTP sent to ${otpCountryCode} ${otpPhone}`}
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

      {showResendOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-center">Choose OTP Delivery</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="sms" checked={resendVia === "sms"} onChange={(e) => setResendVia(e.target.value)} /> SMS
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="whatsapp" checked={resendVia === "whatsapp"} onChange={(e) => setResendVia(e.target.value)} /> WhatsApp
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowResendOptions(false)} className="flex-1 py-2 rounded-xl bg-gray-200">Cancel</button>
              <button onClick={handleResendOtp} className="flex-1 py-2 rounded-xl bg-black-600 text-white">Send OTP</button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp OTP Modal */}
      {showWhatsappOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
            <OtpInputCard
              otp={whatsappOtp}
              setOtp={setWhatsappOtp}
              onVerify={verifyWhatsappOtp}
              onResend={resendWhatsappOtp}
              onEditNumber={() => {
                setShowWhatsappOtpModal(false);
                setFormData(prev => ({ ...prev, whatsappVerified: false }));
              }}
              timer={whatsappTimer}
              loading={whatsappLoading}
              error={whatsappError}
              title="Verify WhatsApp Number"
              description={`Enter OTP sent to ${formData.whatsapp_country_code} ${formData.whatsapp_number}`}
              buttonText="Verify OTP"
            />
            <button
              onClick={() => setShowWhatsappOtpModal(false)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 w-full text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Inputs */}
      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.panNumber || "PAN Number"} <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
        </label>
        <input
          name="pan_number"
          placeholder="ABCDE1234F"
          onChange={handleChange}
          value={formData.pan_number || ''}
          className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none text-sm font-mono uppercase"
          maxLength="10"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.gstNumber || "GST Number"} <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
        </label>
        <input
          name="gstin"
          placeholder="22AAAAA0000A1Z5"
          onChange={handleChange}
          value={formData.gstin || ''}
          className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none text-sm font-mono uppercase"
          maxLength="15"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.mobileNumber || "Mobile Number"} <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 relative">
          <CountrySelector 
            value={formData.primary_country_code} 
            onChange={(val) => handleCountryChange('primary_country_code', val)} 
            disabled={formData.phoneVerified}
          />
          <div className="relative flex-1">
            <input
              name="primary_number"
              placeholder="98765 43210"
              onChange={handleChange}
              value={formData.primary_number}
              className={`w-full p-3 pr-28 rounded-2xl bg-slate-50 border text-sm outline-none ${fieldErrors.primary_number ? 'border-red-500' : formData.phoneVerified ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}
              required
              disabled={formData.phoneVerified}
              maxLength="10"
            />
            <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center">
              <Button
                type="button"
                onClick={sendOtp}
                disabled={verifyingPhone || formData.phoneVerified || !formData.primary_number || formData.primary_number.length < 10}
                variant={formData.phoneVerified ? "secondary" : "primary"}
                className="px-3 py-1 h-full rounded-xl text-xs"
              >
                {verifyingPhone ? '...' : formData.phoneVerified ? 'Verified' : 'Verify'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.whatsappNumber || "WhatsApp Number"} <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
        </label>
        <div className="flex items-center gap-2 mb-1">
          <input
            type="checkbox"
            id="sameAsPrimary"
            checked={formData.sameAsPrimary}
            onChange={handleSameNumber}
            className="w-3 h-3"
          />
          <label htmlFor="sameAsPrimary" className="text-[10px] text-slate-600">
            {t?.sameAsPrimary || "Same as primary number"}
          </label>
        </div>
        <div className="flex gap-2 relative">
          <CountrySelector 
            value={formData.whatsapp_country_code} 
            onChange={(val) => handleCountryChange('whatsapp_country_code', val)} 
            disabled={formData.sameAsPrimary || formData.whatsappVerified}
          />
          <div className="relative flex-1">
            <input
              name="whatsapp_number"
              placeholder="98765 43210"
              onChange={handleChange}
              value={formData.whatsapp_number}
              disabled={formData.sameAsPrimary}
              className={`w-full p-3 pr-28 rounded-2xl bg-slate-50 border text-sm outline-none ${fieldErrors.whatsapp_number ? 'border-red-500' : formData.whatsappVerified ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}
              maxLength="10"
            />
            {!formData.sameAsPrimary && !formData.whatsappVerified && formData.whatsapp_number && formData.whatsapp_number.length >= 10 && (
              <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center">
                <Button
                  type="button"
                  onClick={sendWhatsappOtp}
                  disabled={whatsappLoading}
                  variant="primary"
                  className="px-3 py-1 h-full rounded-xl text-xs"
                >
                  {whatsappLoading ? '...' : "Verify"}
                </Button>
              </div>
            )}
            {formData.whatsappVerified && (
              <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center gap-2">
                <span className="text-green-600 text-xs font-medium">✓ Verified</span>
                {!formData.sameAsPrimary && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, whatsappVerified: false, sameAsPrimary: false }))}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {formData.whatsappVerified && formData.whatsapp_number === formData.primary_number && (
          <p className="text-[10px] text-green-600 mt-1">✓ Auto-verified (same as mobile number)</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          className="flex-1 py-3 rounded-2xl"
        >
          ← Back
        </Button>
        <Button
          type="button"
          onClick={validateAndNext}
          variant="primary"
          className="flex-1 py-3 rounded-2xl"
          disabled={!formData.phoneVerified || (formData.whatsapp_number && formData.whatsapp_number !== formData.primary_number && !formData.whatsappVerified)}
        >
          Continue →
        </Button>
      </div>
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
export default StepTwo;
