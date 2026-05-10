import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { HiSparkles } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';

export default function LoginPage() {
  const [form, setForm] = useState({ email: 'admin@flavour.com', password: 'admin123' });
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success(result.message || 'Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen particle-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary-600/5 rounded-full blur-2xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-orange">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <HiSparkles className="text-white text-3xl" />
              </motion.div>
            </div>
            <h1 className="font-display font-bold text-3xl gradient-text">FLAVOUR</h1>
            <p className="text-dark-400 text-sm mt-1">Restaurant Management System</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h2 className="text-xl font-semibold text-white mb-1">Welcome back 👋</h2>
            <p className="text-dark-400 text-sm mb-6">Sign in to your POS dashboard</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <label className="label">Email Address</label>
              <div className="relative">
                <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-lg" />
                <input
                  type="email"
                  className="input-field pl-11"
                  placeholder="admin@flavour.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <label className="label">Password</label>
              <div className="relative">
                <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-lg" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pl-11 pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                >
                  {showPass ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-3.5 text-base mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Signing in...
                  </div>
                ) : 'Sign In →'}
              </motion.button>
            </motion.div>
          </form>

          {/* Demo credentials */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-5 p-3 rounded-xl bg-dark-800/60 border border-dark-700"
          >
            <p className="text-xs text-dark-400 text-center mb-2 font-medium">Demo Credentials</p>
            <div className="flex gap-2 text-xs text-dark-300 justify-center font-mono">
              <span>admin@flavour.com</span>
              <span className="text-dark-600">•</span>
              <span>admin123</span>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            className="text-center text-sm text-dark-400 mt-5"
          >
            New restaurant?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Register here →
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
