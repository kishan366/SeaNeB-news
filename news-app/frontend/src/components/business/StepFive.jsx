import React from 'react';
import { Zap } from 'lucide-react';
import Button from '@/components/ui/Button';

const StepFive = ({
  loadingPayment,
  paymentPreview,
  fetchPaymentPreview,
  registeredBranchId,
  onBack,
  handleCancelOnboarding,
  loading,
  lang,
  t
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-[30px] p-6 border border-slate-100">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <Zap size={18} className="text-black-600" />
          {t?.paymentSummary || "Payment Summary"}
        </h3>

        {loadingPayment ? (
          <div className="py-8 text-center">
            <div className="animate-spin h-8 w-8 border-3 border-black-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Calculating charges...</p>
          </div>
        ) : paymentPreview ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">{paymentPreview.description || "Onboarding Charges"}</span>
              <span className="font-bold text-slate-900 text-base">₹ {(paymentPreview.base_amount || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">GST ({paymentPreview.gst_percentage || 18}%)</span>
              <span className="font-bold text-slate-700">
                + ₹ {((paymentPreview.base_amount || 0) * (paymentPreview.gst_percentage || 18) / 100).toFixed(2)}
              </span>
            </div>

            <div className="h-px bg-slate-200/60 my-2"></div>

            <div className="flex justify-between items-center pt-1">
              <div>
                <span className="font-black text-slate-900 block text-lg uppercase tracking-tight">Total Amount</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Incl. all taxes</p>
              </div>
              <span className="font-black text-black-600 text-3xl tracking-tighter">
                ₹ {((paymentPreview.base_amount || 0) * (1 + (paymentPreview.gst_percentage || 18) / 100)).toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-red-500">Failed to load payment info.</p>
            <button
              type="button"
              onClick={fetchPaymentPreview}
              className="text-xs text-black-600 underline mt-2"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
        <p className="text-[10px] text-black-700 leading-relaxed font-medium">
          {lang === 'hi'
            ? "पंजीकरण सफल होने के बाद, आपका व्यवसाय हमारे प्लेटफार्म पर सक्रिय हो जाएगा। भुगतान प्रक्रिया अगली स्क्रीन पर होगी।"
            : "After successful registration, your business will be active on our platform. The payment process will follow on the next screen."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          onClick={handleCancelOnboarding}
          variant="secondary"
          className="flex-1 py-3 rounded-2xl text-red-500 font-bold bg-red-50 border-none hover:bg-red-100"
        >
          Cancel Onboarding
        </Button>

        <Button
          type="submit"
          variant="primary"
          className="flex-3 py-3 rounded-2xl shadow-lg shadow-blue-200"
          disabled={loading || loadingPayment || !paymentPreview}
        >
          {loading ? (t?.registering || "Registering...") : (registeredBranchId ? "Pay Now" : (t?.payAndRegister || "Pay & Complete Registration"))}
        </Button>
      </div>
    </div>
  );
};

export default StepFive;
