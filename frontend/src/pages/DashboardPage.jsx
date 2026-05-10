import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  MdTrendingUp, MdRestaurantMenu, MdTableBar, MdDeliveryDining,
  MdPointOfSale, MdPeople, MdOutdoorGrill, MdInventory, MdArrowForward
} from 'react-icons/md';
import api from '../utils/api';
import useAuthStore from '../context/authStore';

const StatCard = ({ title, value, icon: Icon, color, subtitle, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className="card-hover p-5 relative overflow-hidden"
  >
    <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }} />
    <div className="flex items-start justify-between mb-3">
      <div className="p-2.5 rounded-xl" style={{ background: `${color}20` }}>
        <Icon className="text-xl" style={{ color }} />
      </div>
      <span className="text-xs text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">
        <MdTrendingUp /> +12%
      </span>
    </div>
    <p className="text-dark-400 text-sm mb-1">{title}</p>
    <p className="text-3xl font-bold font-display text-white">{value}</p>
    {subtitle && <p className="text-xs text-dark-500 mt-1">{subtitle}</p>}
  </motion.div>
);

const QuickAction = ({ to, icon: Icon, label, color, delay }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }}>
    <Link to={to} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-600 transition-all group">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform" style={{ background: `${color}20` }}>
        <Icon style={{ color }} />
      </div>
      <span className="text-xs text-dark-300 font-medium text-center leading-tight">{label}</span>
    </Link>
  </motion.div>
);

const COLORS = ['#FF6B35', '#3b82f6', '#10b981', '#f59e0b'];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, salesRes, itemsRes, ordersRes] = await Promise.all([
        api.get('/orders/summary/today'),
        api.get('/reports/sales?startDate=' + new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
        api.get('/reports/top-items?limit=5'),
        api.get('/orders?limit=5')
      ]);
      setSummary(summaryRes.data.summary);
      setSalesData(salesRes.data.dailyData || []);
      setTopItems(itemsRes.data.items || []);
      setRecentOrders(ordersRes.data.orders || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  };

  const pieData = summary ? [
    { name: 'Dine In', value: summary.byType?.dineIn || 0 },
    { name: 'Delivery', value: summary.byType?.delivery || 0 },
    { name: 'Pickup', value: summary.byType?.pickup || 0 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #f97316 50%, #ea580c 100%)' }}
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)'
        }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-1">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-orange-100 text-sm">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-orange-100 text-sm mt-1">
              {user?.restaurant?.name} • {user?.role?.toUpperCase()}
            </p>
          </div>
          <div className="text-6xl opacity-30 select-none">🍽️</div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Revenue" value={`₹${(summary?.totalRevenue || 0).toLocaleString('en-IN')}`} icon={MdTrendingUp} color="#FF6B35" subtitle="All payments" delay={0.05} />
        <StatCard title="Total Orders" value={summary?.totalOrders || 0} icon={MdRestaurantMenu} color="#3b82f6" subtitle={`${summary?.completedOrders || 0} completed`} delay={0.1} />
        <StatCard title="Pending Orders" value={summary?.pendingOrders || 0} icon={MdOutdoorGrill} color="#f59e0b" subtitle="In kitchen" delay={0.15} />
        <StatCard title="Cancelled" value={summary?.cancelledOrders || 0} icon={MdTableBar} color="#ef4444" subtitle="Today" delay={0.2} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="card p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Revenue — Last 7 Days</h3>
            <Link to="/reports" className="text-xs text-primary-400 flex items-center gap-1 hover:text-primary-300">
              View all <MdArrowForward />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }}
                formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#FF6B35', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Order Type Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card p-5"
        >
          <h3 className="font-semibold text-white mb-4">Order Types</h3>
          {pieData.every(d => d.value === 0) ? (
            <div className="flex items-center justify-center h-40 text-dark-500 text-sm">No orders today</div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1.5 mt-2">
            {[['Dine In', '#FF6B35', summary?.byType?.dineIn], ['Delivery', '#3b82f6', summary?.byType?.delivery], ['Pickup', '#10b981', summary?.byType?.pickup]]
              .map(([label, color, val]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-dark-400">{label}</span>
                  </div>
                  <span className="font-semibold text-white">{val || 0}</span>
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Orders</h3>
            <Link to="/orders" className="text-xs text-primary-400 flex items-center gap-1 hover:text-primary-300">View all <MdArrowForward /></Link>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 && <p className="text-dark-500 text-sm text-center py-6">No orders today yet</p>}
            {recentOrders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50 hover:bg-dark-700 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-white">#{order.orderNumber}</p>
                  <p className="text-xs text-dark-400">{order.customer?.name} • {order.type?.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary-400">₹{order.pricing?.total?.toLocaleString('en-IN')}</p>
                  <span className={`status-badge-${order.status}`}>{order.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Top Selling Items</h3>
            <Link to="/reports" className="text-xs text-primary-400 flex items-center gap-1">View all <MdArrowForward /></Link>
          </div>
          <div className="space-y-3">
            {topItems.length === 0 && <p className="text-dark-500 text-sm text-center py-6">No sales data yet</p>}
            {topItems.map((item, i) => {
              const maxQty = topItems[0]?.totalQty || 1;
              const pct = (item.totalQty / maxQty) * 100;
              return (
                <div key={item._id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-200 font-medium">{item._id}</span>
                    <span className="text-dark-400">{item.totalQty} sold</span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card p-5">
        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          <QuickAction to="/pos"          icon={MdPointOfSale}        label="New Order"   color="#FF6B35" delay={0.5} />
          <QuickAction to="/tables"       icon={MdTableBar}           label="Tables"      color="#8b5cf6" delay={0.52} />
          <QuickAction to="/kitchen"      icon={MdOutdoorGrill}       label="Kitchen"     color="#ef4444" delay={0.54} />
          <QuickAction to="/delivery"     icon={MdDeliveryDining}     label="Delivery"    color="#10b981" delay={0.56} />
          <QuickAction to="/reservations" icon={MdTableBar}           label="Reservations" color="#06b6d4" delay={0.58} />
          <QuickAction to="/inventory"    icon={MdInventory}          label="Inventory"   color="#f97316" delay={0.60} />
          <QuickAction to="/staff"        icon={MdPeople}             label="Staff"       color="#14b8a6" delay={0.62} />
          <QuickAction to="/reports"      icon={MdTrendingUp}         label="Reports"     color="#a855f7" delay={0.64} />
        </div>
      </motion.div>
    </div>
  );
}
