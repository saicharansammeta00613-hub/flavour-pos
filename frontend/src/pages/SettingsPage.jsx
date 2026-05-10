import { useState, useEffect } from 'react';
import { MdSettings, MdSave } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data.settings);
    } catch {} finally { setLoading(false); }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const update = (path, value) => {
    setSettings(prev => {
      const parts = path.split('.');
      const updated = { ...prev };
      let cur = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = { ...cur[parts[i]] };
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return updated;
    });
  };

  const tabs = [
    { id:'general',    label:'⚙️ General' },
    { id:'tax',        label:'🧾 Tax & GST' },
    { id:'whatsapp',   label:'📲 WhatsApp' },
    { id:'facilities', label:'🏪 Facilities' },
    { id:'print',      label:'🖨️ Print' },
  ];

  if (loading) return <div className="h-60 shimmer rounded-2xl" />;
  if (!settings) return <p className="text-slate-500 text-center py-10">Failed to load settings</p>;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <MdSettings className="text-slate-400 animate-spin-slow" /> Settings
        </h1>
        <button onClick={saveSettings} disabled={saving} className="btn-primary">
          <MdSave /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 border-b border-slate-700 pb-3 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card p-6 space-y-6">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Restaurant Name</label>
                <input className="input-field" value={settings.name || ''} onChange={e => update('name', e.target.value)} /></div>
              <div><label className="label">Phone</label>
                <input className="input-field" value={settings.phone || ''} onChange={e => update('phone', e.target.value)} /></div>
              <div><label className="label">Email</label>
                <input className="input-field" value={settings.email || ''} onChange={e => update('email', e.target.value)} /></div>
              <div><label className="label">GSTIN</label>
                <input className="input-field" placeholder="22AAAAA0000A1Z5" value={settings.gstin || ''} onChange={e => update('gstin', e.target.value)} /></div>
              <div><label className="label">FSSAI Number</label>
                <input className="input-field" value={settings.fssaiNumber || ''} onChange={e => update('fssaiNumber', e.target.value)} /></div>
              <div><label className="label">Restaurant Type</label>
                <select className="input-field" value={settings.type || 'restaurant'} onChange={e => update('type', e.target.value)}>
                  {['restaurant','tiffin_center','cafeteria','fast_food','cloud_kitchen','bakery','juice_center'].map(t=>(
                    <option key={t} value={t}>{t.replace(/_/g,' ')}</option>
                  ))}
                </select>
              </div>
              <div><label className="label">Opening Time</label>
                <input type="time" className="input-field" value={settings.openingTime || '09:00'} onChange={e => update('openingTime', e.target.value)} /></div>
              <div><label className="label">Closing Time</label>
                <input type="time" className="input-field" value={settings.closingTime || '23:00'} onChange={e => update('closingTime', e.target.value)} /></div>
            </div>
            <div>
              <label className="label">Street Address</label>
              <input className="input-field mb-2" placeholder="Street" value={settings.address?.street || ''} onChange={e => update('address.street', e.target.value)} />
              <div className="grid grid-cols-3 gap-2">
                <input className="input-field" placeholder="City" value={settings.address?.city || ''} onChange={e => update('address.city', e.target.value)} />
                <input className="input-field" placeholder="State" value={settings.address?.state || ''} onChange={e => update('address.state', e.target.value)} />
                <input className="input-field" placeholder="Pincode" value={settings.address?.pincode || ''} onChange={e => update('address.pincode', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">CGST (%)</label>
              <input type="number" step="0.5" className="input-field" value={settings.taxSettings?.cgst || 2.5} onChange={e => update('taxSettings.cgst', parseFloat(e.target.value))} /></div>
            <div><label className="label">SGST (%)</label>
              <input type="number" step="0.5" className="input-field" value={settings.taxSettings?.sgst || 2.5} onChange={e => update('taxSettings.sgst', parseFloat(e.target.value))} /></div>
            <div><label className="label">IGST (%)</label>
              <input type="number" step="0.5" className="input-field" value={settings.taxSettings?.igst || 0} onChange={e => update('taxSettings.igst', parseFloat(e.target.value))} /></div>
            <div><label className="label">Service Charge (%)</label>
              <input type="number" step="0.5" className="input-field" value={settings.taxSettings?.serviceCharge || 0} onChange={e => update('taxSettings.serviceCharge', parseFloat(e.target.value))} /></div>
            <div className="col-span-2 flex items-center gap-3">
              <input type="checkbox" id="taxIncluded" className="w-4 h-4 accent-orange-500"
                checked={settings.taxSettings?.taxIncluded || false}
                onChange={e => update('taxSettings.taxIncluded', e.target.checked)} />
              <label htmlFor="taxIncluded" className="text-slate-300 text-sm">Tax included in menu prices</label>
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400">
              <p className="font-semibold mb-1">📲 WhatsApp Integration via Twilio</p>
              <p className="text-green-500/80">Configure Twilio credentials in <code className="font-mono bg-slate-700 px-1 rounded">backend/.env</code> to enable WhatsApp bills and confirmations.</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="waEnabled" className="w-4 h-4 accent-green-500"
                checked={settings.whatsappSettings?.enabled || false}
                onChange={e => update('whatsappSettings.enabled', e.target.checked)} />
              <label htmlFor="waEnabled" className="text-slate-300">Enable WhatsApp integration</label>
            </div>
            <div><label className="label">Admin WhatsApp Number</label>
              <input className="input-field" placeholder="+91 XXXXX XXXXX"
                value={settings.whatsappSettings?.adminNumber || ''}
                onChange={e => update('whatsappSettings.adminNumber', e.target.value)} /></div>
            {[
              { key:'sendBillToCustomer',     label:'Send bill to customer on WhatsApp after payment' },
              { key:'sendOrderConfirmation',  label:'Send order confirmation to customer' },
            ].map(opt => (
              <div key={opt.key} className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 accent-green-500"
                  checked={settings.whatsappSettings?.[opt.key] || false}
                  onChange={e => update(`whatsappSettings.${opt.key}`, e.target.checked)} />
                <label className="text-slate-300 text-sm">{opt.label}</label>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'facilities' && (
          <div className="space-y-3">
            {[
              { key:'dineIn',           label:'🍽️ Dine In',          desc:'Accept dine-in orders' },
              { key:'delivery',         label:'🛵 Delivery',          desc:'Accept home delivery orders' },
              { key:'pickup',           label:'📦 Pickup',            desc:'Accept self-pickup orders' },
              { key:'tableReservation', label:'📅 Table Reservation', desc:'Enable table booking system' },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/50 border border-slate-700">
                <div>
                  <p className="text-white font-medium">{f.label}</p>
                  <p className="text-slate-400 text-sm">{f.desc}</p>
                </div>
                <button
                  onClick={() => update(`facilities.${f.key}`, !(settings.facilities?.[f.key]))}
                  className={`w-12 h-6 rounded-full transition-all relative ${settings.facilities?.[f.key] ? 'bg-orange-500' : 'bg-slate-600'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.facilities?.[f.key] ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'print' && (
          <div className="space-y-4">
            <div><label className="label">Bill Header Text</label>
              <textarea className="input-field" rows={2} placeholder="Custom header on bills..."
                value={settings.printSettings?.billHeader || ''}
                onChange={e => update('printSettings.billHeader', e.target.value)} /></div>
            <div><label className="label">Bill Footer Text</label>
              <textarea className="input-field" rows={2}
                value={settings.printSettings?.billFooter || 'Thank you! Come again.'}
                onChange={e => update('printSettings.billFooter', e.target.value)} /></div>
            <div><label className="label">Number of Copies</label>
              <select className="input-field" value={settings.printSettings?.copies || 1}
                onChange={e => update('printSettings.copies', Number(e.target.value))}>
                {[1,2,3].map(n=><option key={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 accent-orange-500"
                checked={settings.printSettings?.showLogo || false}
                onChange={e => update('printSettings.showLogo', e.target.checked)} />
              <label className="text-slate-300 text-sm">Show logo on bill</label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
