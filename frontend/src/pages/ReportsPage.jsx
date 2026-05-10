import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdBarChart, MdRefresh, MdTrendingUp } from 'react-icons/md';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

const COLORS = ['#f97316','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899'];

export default function ReportsPage() {
  const [salesData, setSalesData] = useState([]);
  const [topItems, setTopItems]   = useState([]);
  const [pl, setPL]               = useState(null);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState('7d');

  useEffect(() => { fetchReports(); }, [period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      const [salesRes, itemsRes, plRes] = await Promise.all([
        api.get(`/reports/sales?startDate=${startDate}`),
        api.get('/reports/top-items?limit=8'),
        api.get('/reports/profit-loss')
      ]);
      setSalesData(salesRes.data.dailyData || []);
      setTopItems(itemsRes.data.items || []);
      setPL(plRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short' });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <MdBarChart className="text-purple-400" /> Reports & Analytics
        </h1>
        <div className="flex gap-2">
          <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
            {['7d','30d','90d'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${period === p ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={fetchReports} className="btn-secondary"><MdRefresh /></button>
        </div>
      </div>

      {/* P&L Summary */}
      {pl && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Revenue', val: pl.revenue, color: '#10b981' },
            { label: 'Expenses', val: pl.totalExpenses, color: '#ef4444' },
            { label: 'Net Profit', val: pl.profit, color: pl.profit >= 0 ? '#10b981' : '#ef4444' },
          ].map(s => (
            <div key={s.label} className="card p-5 text-center">
              <p className="text-slate-400 text-sm mb-1">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>
                {s.val >= 0 ? '' : '-'}₹{Math.abs(s.val || 0).toLocaleString('en-IN')}
              </p>
              {s.label === 'Net Profit' && pl.profitMargin && (
                <p className="text-xs text-slate-500 mt-1">Margin: {pl.profitMargin}%</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">Daily Revenue</h3>
          {loading ? <div className="h-48 shimmer rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={fmt} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'10px', color:'#f1f5f9' }}
                  formatter={v=>[`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={fmt}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">Orders per Day</h3>
          {loading ? <div className="h-48 shimmer rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={fmt} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} />
                <Tooltip
                  contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'10px', color:'#f1f5f9' }}
                  labelFormatter={fmt}
                />
                <Bar dataKey="orders" fill="#3b82f6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Items */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-4">Top Selling Items</h3>
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="h-8 shimmer rounded-lg"/>)}</div>
        ) : topItems.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No sales data yet</p>
        ) : (
          <div className="space-y-4">
            {topItems.map((item, i) => {
              const maxQty = topItems[0]?.totalQty || 1;
              return (
                <div key={item._id}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 flex justify-between text-sm">
                      <span className="text-white font-medium">{item._id}</span>
                      <span className="text-slate-400">{item.totalQty} sold · ₹{item.totalRevenue?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="ml-10 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.totalQty / maxQty) * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
