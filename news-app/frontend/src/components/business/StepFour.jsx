import React from 'react';
import { Building2, MapPin, Hash, Smartphone, Mail } from 'lucide-react';
import Button from '@/components/ui/Button';

const StepFour = ({
  formData,
  citySearch,
  stateName,
  selectedCategory,
  onNext,
  onBack,
  t,
  logoPreview
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-900">
            <Building2 size={18} />
          </div>
          <h3 className="font-bold text-slate-800 tracking-tight">Review Business Details</h3>
        </div>
        
        {logoPreview && (
          <div className="w-12 h-12 rounded-full border-2 border-slate-100 overflow-hidden bg-slate-50 shadow-md">
            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
          </div>
        )}
      </div>

      <div className="bg-slate-50/50 rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        <div className="p-4 bg-white/50">
          <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3 ml-1">Basic Information</h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <SummaryItem icon={<Building2 size={14} />} label="Business Name" value={formData.business_name} />
            <SummaryItem icon={<Hash size={14} />} label="Seaneb ID" value={formData.seaneb_id} color="text-slate-900 font-bold" />
            <SummaryItem icon={<Smartphone size={14} />} label="Contact" value={formData.primary_number} />
            <SummaryItem icon={<Mail size={14} />} label="Email" value={formData.business_email || "Not provided"} />
          </div>
        </div>

        <div className="p-4 bg-white/50">
          <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3 ml-1">Legal & Identification</h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <SummaryItem label="PAN" value={formData.pan_number || "Not provided"} />
            <SummaryItem label="GSTIN" value={formData.gstin || "Not provided"} />
            <SummaryItem label="Category" value={selectedCategory?.main_category_name} />
            <SummaryItem label="WhatsApp" value={formData.whatsapp_number} />
          </div>
        </div>

        <div className="p-4 bg-white/50">
          <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3 ml-1">Address & Location</h4>
          <div className="flex gap-4">
            <div className="shrink-0 mt-1"><MapPin size={16} className="text-slate-300" /></div>
            <div>
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                {formData.address}{formData.landmark ? `, ${formData.landmark}` : ''}
              </p>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                {citySearch} {stateName ? `| ${stateName}` : ''}
              </p>
            </div>
          </div>
        </div>
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
          onClick={onNext}
          variant="primary"
          className="flex-1 py-3 rounded-2xl shadow-lg shadow-slate-200 bg-slate-900 text-white"
        >
          Proceed to Payment →
        </Button>
      </div>
    </div>
  );
};

const SummaryItem = ({ icon, label, value, color = "text-slate-700" }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
      {icon && <span className="text-slate-300">{icon}</span>}
      {label}
    </span>
    <span className={`text-sm ${color} truncate`}>{value}</span>
  </div>
);

export default StepFour;
