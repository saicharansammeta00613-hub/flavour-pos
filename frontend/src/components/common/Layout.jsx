import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../context/authStore';
import {
  MdDashboard, MdPointOfSale, MdRestaurantMenu, MdTableBar,
  MdOutdoorGrill, MdEventSeat, MdDeliveryDining, MdInventory,
  MdReceipt, MdBarChart, MdPeople, MdAccountBalanceWallet,
  MdSettings, MdLogout, MdMenu, MdClose, MdNotifications,
  MdChevronRight
} from 'react-icons/md';
import { HiSparkles } from 'react-icons/hi2';

const navItems = [
  { path: '/dashboard',     label: 'Dashboard',      icon: MdDashboard,          color: '#FF6B35' },
  { path: '/pos',           label: 'POS',             icon: MdPointOfSale,        color: '#f59e0b' },
  { path: '/orders',        label: 'Orders',          icon: MdRestaurantMenu,     color: '#3b82f6' },
  { path: '/tables',        label: 'Tables',          icon: MdTableBar,           color: '#8b5cf6' },
  { path: '/kitchen',       label: 'Kitchen / KoT',  icon: MdOutdoorGrill,       color: '#ef4444' },
  { path: '/reservations',  label: 'Reservations',   icon: MdEventSeat,          color: '#06b6d4' },
  { path: '/delivery',      label: 'Delivery',        icon: MdDeliveryDining,     color: '#10b981' },
  { path: '/inventory',     label: 'Inventory',       icon: MdInventory,          color: '#f97316' },
  { path: '/expenses',      label: 'Expenses',        icon: MdReceipt,            color: '#ec4899' },
  { path: '/reports',       label: 'Reports',         icon: MdBarChart,           color: '#a855f7' },
  { path: '/staff',         label: 'Staff',           icon: MdPeople,             color: '#14b8a6' },
  { path: '/cash-register', label: 'Cash Register',  icon: MdAccountBalanceWallet, color: '#eab308' },
  { path: '/settings',      label: 'Settings',        icon: MdSettings,           color: '#94a3b8' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = navItems.find(i => location.pathname.startsWith(i.path));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 72 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 flex flex-col
          bg-dark-900 border-r border-dark-700/60
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 lg:transition-none
        `}
        style={{ width: mobileOpen ? 240 : undefined }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-dark-700/60">
          <AnimatePresence>
            {(sidebarOpen || mobileOpen) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-glow-orange">
                  <HiSparkles className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-white text-lg leading-none">FLAVOUR</h1>
                  <p className="text-dark-400 text-xs">POS System</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!sidebarOpen && !mobileOpen && (
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center mx-auto shadow-glow-orange">
              <HiSparkles className="text-white text-lg" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex text-dark-400 hover:text-white p-1 rounded-lg hover:bg-dark-700 transition-colors"
          >
            {sidebarOpen ? <MdClose size={18} /> : <MdMenu size={18} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <motion.button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span
                  className="text-xl flex-shrink-0 transition-colors"
                  style={{ color: isActive ? item.color : undefined }}
                >
                  <Icon />
                </span>
                <AnimatePresence>
                  {(sidebarOpen || mobileOpen) && (
                    <motion.span
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-sm whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-2 w-1.5 h-5 bg-primary-500 rounded-full"
                />}
              </motion.button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-dark-700/60">
          <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-dark-700 transition-colors ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <AnimatePresence>
              {(sidebarOpen || mobileOpen) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-dark-400 capitalize">{user?.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={handleLogout}
              className="text-dark-400 hover:text-red-400 transition-colors p-1 flex-shrink-0"
              title="Logout"
            >
              <MdLogout size={18} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-dark-900/80 backdrop-blur border-b border-dark-700/60 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-dark-400 hover:text-white p-1"
            >
              <MdMenu size={22} />
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-dark-500">FLAVOUR</span>
              <MdChevronRight className="text-dark-600" />
              <span className="text-white font-medium">{currentPage?.label || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Restaurant name */}
            <div className="hidden md:block text-right">
              <p className="text-xs text-dark-400">Restaurant</p>
              <p className="text-sm font-semibold text-white truncate max-w-[150px]">
                {user?.restaurant?.name || 'FLAVOUR'}
              </p>
            </div>
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl hover:bg-dark-700 text-dark-400 hover:text-white transition-colors">
              <MdNotifications size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full notification-pulse" />
            </button>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
