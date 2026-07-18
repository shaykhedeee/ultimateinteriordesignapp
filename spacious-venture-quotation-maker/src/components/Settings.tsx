import React, { useState } from 'react';
import { CloudUpload } from 'lucide-react';
import { CompanyProfile } from '../types';

interface SettingsProps {
  profile: CompanyProfile;
  onSave: (updatedProfile: CompanyProfile) => void;
  onCancel: () => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, onSave, onCancel }) => {
  const [localProfile, setLocalProfile] = useState<CompanyProfile>(() => JSON.parse(JSON.stringify(profile)));

  const handleInputChange = (field: keyof CompanyProfile, value: string) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleBankChange = (field: keyof typeof profile.bankDetails, value: string) => {
    setLocalProfile(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value
      }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLocalProfile(prev => ({ ...prev, [field]: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mb-6">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 bg-stone-50/50">
          <h2 className="text-xl font-serif font-bold text-stone-800">Company & Bank Settings</h2>
          <p className="text-stone-500 text-xs mt-1">Configure company credentials, logos, signatures, and payment destinations. These are automatically attached to generated PDFs.</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section 1: Company Profile */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#1f352b] uppercase tracking-wider border-b border-stone-100 pb-2">Studio Details</h3>
            
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Company Name</span>
              <input
                type="text"
                value={localProfile.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Tagline</span>
              <input
                type="text"
                value={localProfile.tagline}
                onChange={e => handleInputChange('tagline', e.target.value)}
                className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Full Address</span>
              <textarea
                value={localProfile.address}
                onChange={e => handleInputChange('address', e.target.value)}
                rows={2}
                className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Contact Number</span>
                <input
                  type="text"
                  value={localProfile.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Email Address</span>
                <input
                  type="text"
                  value={localProfile.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Website URL</span>
                <input
                  type="text"
                  value={localProfile.website}
                  onChange={e => handleInputChange('website', e.target.value)}
                  className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">GSTIN Number (Optional)</span>
                <input
                  type="text"
                  value={localProfile.gstNo || ''}
                  onChange={e => handleInputChange('gstNo', e.target.value)}
                  className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Bank Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#1f352b] uppercase tracking-wider border-b border-stone-100 pb-2">Bank Remittance Accounts</h3>
            
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Beneficiary Account Name</span>
              <input
                type="text"
                value={localProfile.bankDetails.accountName}
                onChange={e => handleBankChange('accountName', e.target.value)}
                className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Bank Name</span>
                <input
                  type="text"
                  value={localProfile.bankDetails.bankName}
                  onChange={e => handleBankChange('bankName', e.target.value)}
                  className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Account Number</span>
                <input
                  type="text"
                  value={localProfile.bankDetails.accountNumber}
                  onChange={e => handleBankChange('accountNumber', e.target.value)}
                  className="border border-stone-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-[#b8873b] bg-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">IFSC Code</span>
                <input
                  type="text"
                  value={localProfile.bankDetails.ifscCode}
                  onChange={e => handleBankChange('ifscCode', e.target.value)}
                  className="border border-stone-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-[#b8873b] bg-white"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">UPI Address (Optional)</span>
                <input
                  type="text"
                  value={localProfile.bankDetails.upiId || ''}
                  onChange={e => handleBankChange('upiId', e.target.value)}
                  className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Bank Branch</span>
              <input
                type="text"
                value={localProfile.bankDetails.branch}
                onChange={e => handleBankChange('branch', e.target.value)}
                className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>
          </div>

          {/* Section 3: Brand Assets Upload */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
            <div>
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Company Logo</h4>
              <div className="flex items-center gap-4 border border-dashed border-stone-200 p-4 rounded-xl">
                <div className="w-16 h-16 bg-stone-50 border border-stone-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {localProfile.logo ? (
                    <img src={localProfile.logo} alt="Company Logo" className="object-contain w-full h-full p-1.5" />
                  ) : (
                    <span className="text-xs text-stone-300">No Logo</span>
                  )}
                </div>
                <label className="flex-1 flex flex-col items-center justify-center py-2.5 px-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer text-xs font-semibold text-stone-600 gap-1.5">
                  <CloudUpload size={16} className="text-[#b8873b]" />
                  <span>Upload Logo (PNG/JPG)</span>
                  <input type="file" accept="image/*" onChange={e => handleLogoUpload(e, 'logo')} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Authorized Signature</h4>
              <div className="flex items-center gap-4 border border-dashed border-stone-200 p-4 rounded-xl">
                <div className="w-16 h-16 bg-stone-50 border border-stone-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {localProfile.signature ? (
                    <img src={localProfile.signature} alt="Signature" className="object-contain w-full h-full p-1" />
                  ) : (
                    <span className="text-xs text-stone-300">No Signature</span>
                  )}
                </div>
                <label className="flex-1 flex flex-col items-center justify-center py-2.5 px-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer text-xs font-semibold text-stone-600 gap-1.5">
                  <CloudUpload size={16} className="text-[#b8873b]" />
                  <span>Upload Signature</span>
                  <input type="file" accept="image/*" onChange={e => handleLogoUpload(e, 'signature')} className="hidden" />
                </label>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Global Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          onClick={onCancel}
          className="px-5 py-2 border border-stone-200 bg-white rounded-lg text-xs font-bold hover:bg-stone-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(localProfile)}
          className="px-5 py-2 bg-[#1f352b] text-white rounded-lg text-xs font-bold hover:bg-[#2c493c] shadow-sm"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
