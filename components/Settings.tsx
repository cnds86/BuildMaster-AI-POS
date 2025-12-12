
import React, { useState, useEffect } from 'react';
import { SystemSettings, Language, Branch, PosMachine } from '../types';
import { 
  Save, 
  Globe, 
  Building, 
  Printer, 
  Percent, 
  Monitor, 
  Database, 
  LayoutList, 
  CheckCircle, 
  X, 
  ImageIcon, 
  QrCode, 
  Copy, 
  RefreshCw, 
  Activity, 
  Wifi, 
  Server, 
  Link,
  Tv
} from 'lucide-react';

interface SettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  branches?: Branch[];
  posMachines?: PosMachine[];
}

type SettingsTab = 'company' | 'receipt' | 'tax' | 'device' | 'database' | 'localization' | 'interface' | 'customer_display';

const TABS: { id: SettingsTab; label: string; icon: any }[] = [
  { id: 'company', label: 'Company Information', icon: Building },
  { id: 'receipt', label: 'Receipt & Print Settings', icon: Printer },
  { id: 'tax', label: 'Tax & VAT Configuration', icon: Percent },
  { id: 'customer_display', label: 'Customer Display Configuration', icon: Tv },
  { id: 'device', label: 'Device Configuration', icon: Monitor },
  { id: 'database', label: 'Local Database & Offline', icon: Database },
  { id: 'localization', label: 'Localization & Language', icon: Globe },
  { id: 'interface', label: 'Interface & Display', icon: LayoutList },
];

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, branches = [], posMachines = [] }) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Test Connection State
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [localDbStatus, setLocalDbStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Sync state when props change (e.g. data load from mock or API)
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLangChange = (lang: Language) => {
    setFormData({ ...formData, language: lang });
  };

  const handleTestConnection = () => {
    if (!formData.masterApiUrl) {
       setConnectionStatus('error');
       return;
    }
    setConnectionStatus('testing');
    setTimeout(() => {
       if (formData.masterApiUrl && (formData.masterApiUrl.includes('http') || formData.masterApiUrl.includes('192') || formData.masterApiUrl.includes('localhost'))) {
          setConnectionStatus('success');
       } else {
          setConnectionStatus('error');
       }
    }, 1500);
  };

  const handleTestLocalDb = () => {
    setLocalDbStatus('testing');
    setTimeout(() => {
      if (formData.localDatabase?.host) {
        setLocalDbStatus('success');
      } else {
        setLocalDbStatus('error');
      }
    }, 1500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, receiptLogoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
     setFormData({ ...formData, receiptLogoUrl: '' });
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, receiptQrCodeUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveQr = () => {
     setFormData({ ...formData, receiptQrCodeUrl: '' });
  };

  const availablePosMachines = posMachines.filter(p => p.branchId === formData.currentBranchId);

  const calculatePreviewTax = (price: number) => {
    if (!formData.tax.enabled) return { subtotal: price, tax: 0, total: price };
    const rate = formData.tax.rate / 100;
    if (formData.tax.calculationMode === 'excluded') {
      const tax = price * rate;
      return { subtotal: price, tax: tax, total: price + tax };
    } else {
      const tax = price - (price / (1 + rate));
      return { subtotal: price - tax, tax: tax, total: price };
    }
  };

  const taxPreview = calculatePreviewTax(100);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-slate-500">Manage configuration, preferences, and connections.</p>
        </div>
        {successMsg && (
          <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded-lg flex items-center shadow-sm animate-fade-in">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMsg}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 min-h-0">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal text-left
                  ${isActive 
                    ? 'bg-white text-construction-orange border-b-2 md:border-b-0 md:border-l-4 border-construction-orange shadow-sm md:shadow-none' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent'
                  }`}
              >
                <Icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-construction-orange' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white relative">
          <form onSubmit={handleSave} className="max-w-4xl mx-auto pb-20">
            
            {/* 1. Company Information */}
            {activeTab === 'company' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / Registration No.</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none h-24"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Customer Display & Ads */}
            {activeTab === 'customer_display' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Customer Facing Display Configuration</h3>
                
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-slate-800">Enable Customer Screen</h4>
                    <p className="text-xs text-slate-500">Allow customers to view cart and pay on a secondary screen</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.customerDisplay?.enabled} 
                      onChange={e => setFormData({ 
                        ...formData, 
                        customerDisplay: { ...formData.customerDisplay, enabled: e.target.checked } 
                      })} 
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {formData.customerDisplay?.enabled && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Welcome Message</label>
                      <input 
                        type="text" 
                        value={formData.customerDisplay.welcomeMessage}
                        onChange={e => setFormData({ 
                          ...formData, 
                          customerDisplay: { ...formData.customerDisplay, welcomeMessage: e.target.value } 
                        })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Slide Interval (Seconds)</label>
                      <input 
                        type="number" 
                        min="3"
                        max="60"
                        value={formData.customerDisplay.promotionInterval}
                        onChange={e => setFormData({ 
                          ...formData, 
                          customerDisplay: { ...formData.customerDisplay, promotionInterval: parseInt(e.target.value) || 5 } 
                        })}
                        className="w-full md:w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                       <strong>Note:</strong> To manage Promotional Images, please visit the dedicated <strong>Promotions</strong> page.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Receipt & Print Settings */}
            {activeTab === 'receipt' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Receipt & Print Settings</h3>
                <div className="flex flex-col xl:flex-row gap-8">
                  {/* Settings Column */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Paper & Assets</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Paper Size</label>
                          <select
                            value={formData.receiptPaperSize}
                            onChange={e => setFormData({ ...formData, receiptPaperSize: e.target.value as any })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                          >
                            <option value="58mm">Thermal 58mm</option>
                            <option value="80mm">Thermal 80mm (Standard)</option>
                            <option value="A4">A4 (Full Invoice)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Store Logo</label>
                          <div className="flex items-center space-x-3">
                            {formData.receiptLogoUrl ? (
                              <div className="relative group shrink-0">
                                <img src={formData.receiptLogoUrl} alt="Logo" className="h-10 w-10 object-contain border border-slate-200 rounded bg-white" />
                                <button type="button" onClick={handleRemoveLogo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                              </div>
                            ) : (
                              <div className="h-10 w-10 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 bg-slate-50 shrink-0"><ImageIcon className="w-5 h-5" /></div>
                            )}
                            <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50"><input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />{formData.receiptLogoUrl ? 'Change' : 'Upload'}</label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Messages & Content</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Header Message</label>
                          <input type="text" value={formData.receiptHeader} onChange={e => setFormData({ ...formData, receiptHeader: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Footer Message</label>
                          <input type="text" value={formData.receiptFooter} onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Bank QR Code</label>
                          <div className="flex items-center space-x-3">
                            {formData.receiptQrCodeUrl ? (
                              <div className="relative group shrink-0">
                                <img src={formData.receiptQrCodeUrl} alt="QR" className="h-10 w-10 object-contain border border-slate-200 rounded bg-white" />
                                <button type="button" onClick={handleRemoveQr} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                              </div>
                            ) : (
                              <div className="h-10 w-10 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 bg-slate-50 shrink-0"><QrCode className="w-5 h-5" /></div>
                            )}
                            <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50"><input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />{formData.receiptQrCodeUrl ? 'Change' : 'Upload'}</label>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={formData.receiptShowTaxId} onChange={e => setFormData({ ...formData, receiptShowTaxId: e.target.checked })} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                            <span className="text-sm text-slate-700">Show Tax ID</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={formData.receiptShowCashier} onChange={e => setFormData({ ...formData, receiptShowCashier: e.target.checked })} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                            <span className="text-sm text-slate-700">Show Cashier Name</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Print Behavior</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-sm font-medium text-slate-700">Auto-Print</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={formData.receiptAutoPrint} onChange={e => setFormData({ ...formData, receiptAutoPrint: e.target.checked })} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Copies</label>
                          <div className="relative">
                            <Copy className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input type="number" min="1" max="5" value={formData.receiptCopies} onChange={e => setFormData({ ...formData, receiptCopies: parseInt(e.target.value) })} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Column */}
                  <div className="w-full xl:w-[320px] shrink-0">
                    <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Live Preview</h4>
                    <div className="bg-slate-200 p-6 rounded-xl flex justify-center items-start min-h-[450px]">
                      <div className={`bg-white shadow-lg p-4 text-xs font-mono text-slate-800 flex flex-col items-center transition-all duration-300 ${formData.receiptPaperSize === '58mm' ? 'w-[200px]' : formData.receiptPaperSize === '80mm' ? 'w-[280px]' : 'w-full h-[380px]'}`} style={{ minHeight: '300px' }}>
                        {formData.receiptLogoUrl && <img src={formData.receiptLogoUrl} alt="Logo" className="h-12 w-auto mb-2 object-contain" />}
                        <h3 className="font-bold text-center text-sm">{formData.companyName || 'Company Name'}</h3>
                        <p className="text-center text-[10px] text-slate-500">{formData.address}</p>
                        <p className="text-center text-[10px] text-slate-500">{formData.phone}</p>
                        {formData.receiptShowTaxId && <p className="text-center text-[10px] text-slate-500">Tax ID: {formData.taxId}</p>}
                        <div className="w-full border-b border-dashed border-slate-300 my-3"></div>
                        <div className="w-full space-y-1 mb-2">
                          <div className="flex justify-between"><span>Cement Type 1</span><span>200.00</span></div>
                          <div className="flex justify-between text-[10px] text-slate-500 pl-2"><span>2 x 100.00</span></div>
                          <div className="flex justify-between"><span>Red Brick</span><span>500.00</span></div>
                          <div className="flex justify-between text-[10px] text-slate-500 pl-2"><span>500 x 1.00</span></div>
                        </div>
                        <div className="w-full border-b border-dashed border-slate-300 my-2"></div>
                        <div className="w-full space-y-1">
                          <div className="flex justify-between"><span>Subtotal</span><span>{formData.currencySymbol}{calculatePreviewTax(700).subtotal.toFixed(2)}</span></div>
                          {formData.tax.displayOnReceipt && formData.tax.enabled && <div className="flex justify-between text-[10px]"><span>VAT ({formData.tax.rate}%)</span><span>{formData.currencySymbol}{calculatePreviewTax(700).tax.toFixed(2)}</span></div>}
                          <div className="flex justify-between font-bold border-t border-slate-200 pt-1 mt-1"><span>TOTAL</span><span>{formData.currencySymbol}{calculatePreviewTax(700).total.toFixed(2)}</span></div>
                        </div>
                        <div className="w-full border-b border-dashed border-slate-300 my-3"></div>
                        <div className="flex items-end justify-between w-full">
                          <div className="flex-1 text-center pr-2">
                            <p className="italic mb-1">{formData.receiptHeader}</p>
                            <p>{formData.receiptFooter}</p>
                            {formData.receiptShowCashier && <p className="text-[9px] text-slate-400 mt-2">Cashier: Staff Name</p>}
                          </div>
                          {formData.receiptQrCodeUrl && <div className="flex flex-col items-center shrink-0"><img src={formData.receiptQrCodeUrl} alt="QR" className="h-14 w-14 object-contain border border-slate-100 p-0.5 rounded" /><span className="text-[8px] font-bold mt-1">Scan to Pay</span></div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Tax & VAT Configuration */}
            {activeTab === 'tax' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Tax & VAT Configuration</h3>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-700">Enable Tax Calculation</h4>
                        <p className="text-xs text-slate-500">Apply tax/VAT to sales automatically</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.tax.enabled} onChange={e => setFormData({ ...formData, tax: { ...formData.tax, enabled: e.target.checked } })} />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {formData.tax.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Tax Rate (%)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.tax.rate}
                            onChange={e => setFormData({...formData, tax: { ...formData.tax, rate: parseFloat(e.target.value) || 0 }})}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Calculation Mode</label>
                          <select
                            value={formData.tax.calculationMode}
                            onChange={e => setFormData({...formData, tax: { ...formData.tax, calculationMode: e.target.value as any }})}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                          >
                            <option value="excluded">Excluded (Price + Tax)</option>
                            <option value="included">Included (Price includes Tax)</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={formData.tax.displayOnReceipt}
                              onChange={e => setFormData({...formData, tax: { ...formData.tax, displayOnReceipt: e.target.checked }})}
                              className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700">Display tax breakdown on receipts</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.tax.enabled && (
                    <div className="w-full md:w-72 bg-slate-50 p-5 rounded-xl border border-slate-200 h-fit">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Calculation Preview ($100 Item)</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Net Price</span>
                          <span className="font-mono">{taxPreview.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>Tax ({formData.tax.rate}%)</span>
                          <span className="font-mono">{taxPreview.tax.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-3 mt-1 flex justify-between font-bold text-slate-800 text-lg">
                          <span>Total</span>
                          <span className="font-mono">{taxPreview.total.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-slate-500 bg-white p-3 rounded border border-slate-200">
                        {formData.tax.calculationMode === 'excluded' 
                          ? 'Customer pays tax ON TOP of shelf price (e.g. US Sales Tax).' 
                          : 'Shelf price ALREADY INCLUDES tax (e.g. VAT/GST).'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Device Configuration */}
            {activeTab === 'device' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Device Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Branch Location</label>
                    <select
                      value={formData.currentBranchId || ''}
                      onChange={e => setFormData({ ...formData, currentBranchId: e.target.value, currentPosId: '' })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">POS Terminal ID</label>
                    <select
                      value={formData.currentPosId || ''}
                      onChange={e => setFormData({ ...formData, currentPosId: e.target.value })}
                      disabled={!formData.currentBranchId}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white disabled:bg-slate-100"
                    >
                      <option value="">Select POS Machine</option>
                      {availablePosMachines.map(p => (
                        <option key={p.id} value={p.id}>{p.machineNumber} ({p.status})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-4">Device Role</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${formData.deviceRole === 'Master' ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="deviceRole" value="Master" checked={formData.deviceRole === 'Master'} onChange={() => setFormData({...formData, deviceRole: 'Master'})} className="mt-1 w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500" />
                      <div className="ml-3">
                        <div className="flex items-center"><Server className="w-5 h-5 text-purple-600 mr-2" /><span className="font-bold text-slate-800">Master Node</span></div>
                        <p className="text-xs text-slate-500 mt-1">Primary server. Stores data and syncs with other terminals.</p>
                      </div>
                    </label>
                    <label className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${formData.deviceRole === 'Slave' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="deviceRole" value="Slave" checked={formData.deviceRole === 'Slave'} onChange={() => setFormData({...formData, deviceRole: 'Slave'})} className="mt-1 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                      <div className="ml-3">
                        <div className="flex items-center"><Monitor className="w-5 h-5 text-blue-600 mr-2" /><span className="font-bold text-slate-800">Slave / Client</span></div>
                        <p className="text-xs text-slate-500 mt-1">Sales terminal. Connects to Master.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.deviceRole === 'Slave' && (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mt-6">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Link className="w-4 h-4 mr-2 text-blue-500" />Master Connection</h4>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Master IP / API URL</label>
                        <input
                          type="text"
                          value={formData.masterApiUrl || ''}
                          onChange={e => setFormData({ ...formData, masterApiUrl: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          placeholder="http://192.168.1.100:3000"
                        />
                      </div>
                      <div className="flex items-end">
                        <button 
                          type="button"
                          onClick={handleTestConnection}
                          disabled={connectionStatus === 'testing' || !formData.masterApiUrl}
                          className={`px-4 py-2 rounded-lg font-medium flex items-center transition-all ${connectionStatus === 'success' ? 'bg-green-600 text-white' : connectionStatus === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}
                        >
                          {connectionStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : connectionStatus === 'success' ? <Wifi className="w-4 h-4 mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                          {connectionStatus === 'testing' ? 'Testing...' : connectionStatus === 'success' ? 'Connected' : 'Test'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Auto-Sync Interval</label>
                        <select 
                          value={formData.autoSyncInterval || 0}
                          onChange={e => setFormData({...formData, autoSyncInterval: parseInt(e.target.value)})}
                          className="w-full md:w-auto px-4 py-2 border border-slate-300 rounded-lg bg-white"
                        >
                            <option value={0}>Manual Sync Only</option>
                            <option value={5}>Every 5 Minutes</option>
                            <option value={15}>Every 15 Minutes</option>
                            <option value={60}>Every Hour</option>
                        </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Local Database & Offline Storage */}
            {activeTab === 'database' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Local Database & Offline Storage</h3>
                
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-indigo-900">Enable Local Database</h4>
                    <p className="text-xs text-indigo-700">Cache data locally for offline operations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.localDatabase?.enabled} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, enabled: e.target.checked } })} />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {formData.localDatabase?.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Database Type</label>
                      <select
                        value={formData.localDatabase.type}
                        onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, type: e.target.value as any } })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="postgresql">PostgreSQL</option>
                        <option value="mysql">MySQL</option>
                        <option value="sqlite">SQLite</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Host</label>
                      <input type="text" value={formData.localDatabase.host} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, host: e.target.value } })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="localhost" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                      <input type="text" value={formData.localDatabase.port} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, port: e.target.value } })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="5432" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Database Name</label>
                      <input type="text" value={formData.localDatabase.databaseName} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, databaseName: e.target.value } })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                      <input type="text" value={formData.localDatabase.username} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, username: e.target.value } })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                      <input type="password" value={formData.localDatabase.password} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, password: e.target.value } })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="••••••" />
                    </div>
                    
                    <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end">
                       <button 
                          type="button"
                          onClick={handleTestLocalDb}
                          disabled={localDbStatus === 'testing'}
                          className={`px-4 py-2 rounded-lg font-medium flex items-center transition-all ${localDbStatus === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                       >
                          {localDbStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                          {localDbStatus === 'testing' ? 'Connecting...' : localDbStatus === 'success' ? 'Connected Successfully' : 'Test Connection'}
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. Localization & Language / ภาษา / ພາສາ */}
            {activeTab === 'localization' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Localization & Language / ภาษา / ພາສາ</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">System Language</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { code: 'en', flag: '🇺🇸', label: 'English' },
                        { code: 'th', flag: '🇹🇭', label: 'ไทย' },
                        { code: 'lo', flag: '🇱🇦', label: 'ລາວ' }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLangChange(lang.code as any)}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${formData.language === lang.code ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                        >
                          <span className="text-3xl mb-2">{lang.flag}</span>
                          <span className="text-sm font-bold">{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Currency Symbol</label>
                    <div className="relative">
                      {/* Using DollarSign as generic credit card icon not imported, or just standard text */}
                      <div className="absolute left-3 top-2.5 text-slate-400 font-bold">$</div>
                      <select
                        value={formData.currencySymbol}
                        onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        <option value="$">USD ($)</option>
                        <option value="฿">Thai Baht (฿)</option>
                        <option value="₭">Lao Kip (₭)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Interface & Display */}
            {activeTab === 'interface' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Interface & Display</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Default Items Per Page</label>
                  <select
                    value={formData.defaultItemsPerPage}
                    onChange={e => setFormData({ ...formData, defaultItemsPerPage: parseInt(e.target.value) })}
                    className="w-full md:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value={10}>10 items</option>
                    <option value={20}>20 items</option>
                    <option value={50}>50 items</option>
                    <option value={100}>100 items</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">Controls pagination size for lists (Inventory, Stock, Sales history).</p>
                </div>
              </div>
            )}

            {/* Floating Save Button */}
            <div className="fixed bottom-6 right-6 md:absolute md:bottom-0 md:right-0 md:p-8 md:bg-transparent pointer-events-none">
                <button
                  type="submit"
                  className="pointer-events-auto px-6 py-3 bg-construction-orange text-white font-bold rounded-full md:rounded-lg hover:bg-orange-600 transition-colors shadow-lg flex items-center transform hover:scale-105"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Settings
                </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
