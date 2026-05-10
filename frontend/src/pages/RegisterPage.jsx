import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSparkles } from 'react-icons/hi2';
import { MdRestaurant, MdPhone, MdEmail, MdLock, MdPerson } from 'react-icons/md';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';

const RESTAURANT_TYPES = [
  { value: 'restaurant',    label: '🍽️ Restaurant' },
  { value: 'tiffin_center', label: '🥘 Tiffin Center' },
  { value: 'cafeteria',     label: '☕ Cafeteria' },
  { value: 'fast_food',     label: '🍔 Fast Food' },
  { value: 'cloud_kitchen', label: '☁️ Cloud Kitchen' },
  { value: 'bakery',        label: '🎂 Bakery / Juice Center' },
];

const BLANK = {
  name: '', email: '', password: '', phone: '',
  restaurantName: '', restaurantType: 'restaurant',
  restaurantPhone: '', restaurantAddress: ''
};

export default function RegisterPage() {
  const [form, setForm]   = useState(BLANK);
  const [step, setStep]   = useState(1);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const goNext = () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error('Please fill all fields'); return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.restaurantName) { toast.error('Restaurant name is required'); return; }
    const result = await register(form);
    if (result.success) {
      toast.success('Restaurant registered! Welcome to FLAVOUR POS 🎉');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen particle-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'rgba(249,115,22,0.10)' }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'rgba(249,115,22,0.06)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              <HiSparkles className="text-white text-2xl" />
            </div>
            <h1 className="font-bold text-2xl gradient-text">FLAVOUR POS</h1>
            <p className="text-slate-400 text-sm">Register your restaurant</p>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2 mb-2">
            {[1, 2].map(s => (
              <div key={s}
                className="flex-1 h-1.5 rounded-full transition-all duration-500"
                style={{ background: step >= s ? '#f97316' : '#334155' }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Step {step} of 2 — {step === 1 ? 'Your Details' : 'Restaurant Info'}
          </p>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="label">Your Full Name *</label>
                    <div className="relative">
                      <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input-field pl-11" placeholder="John Doe"
                        value={form.name} onChange={e => set('name', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Email Address *</label>
                    <div className="relative">
                      <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="email" className="input-field pl-11" placeholder="you@restaurant.com"
                        value={form.email} onChange={e => set('email', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Phone Number *</label>
                    <div className="relative">
                      <MdPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input-field pl-11" placeholder="+91 XXXXX XXXXX"
                        value={form.phone} onChange={e => set('phone', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Password *</label>
                    <div className="relative">
                      <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="password" className="input-field pl-11" placeholder="Min. 6 characters"
                        value={form.password} onChange={e => set('password', e.target.value)} />
                    </div>
                  </div>
                  <button type="button" onClick={goNext} className="btn-primary w-full py-3.5 text-base">
                    Continue →
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="label">Restaurant Name *</label>
                    <div className="relative">
                      <MdRestaurant className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input-field pl-11" placeholder="My Restaurant"
                        value={form.restaurantName} onChange={e => set('restaurantName', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Restaurant Type</label>
                    <select className="input-field" value={form.restaurantType}
                      onChange={e => set('restaurantType', e.target.value)}>
                      {RESTAURANT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Restaurant Phone</label>
                    <div className="relative">
                      <MdPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input-field pl-11" placeholder="+91 XXXXX XXXXX"
                        value={form.restaurantPhone} onChange={e => set('restaurantPhone', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Restaurant Address</label>
                    <input className="input-field" placeholder="Street, City, State"
                      value={form.restaurantAddress} onChange={e => set('restaurantAddress', e.target.value)} />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
                      ← Back
                    </button>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-primary flex-1 py-3"
                    >
                      {isLoading ? 'Creating...' : '🚀 Launch POS'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            Already registered?{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
              Login →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
