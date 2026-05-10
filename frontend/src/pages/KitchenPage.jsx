import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdOutdoorGrill, MdCheckCircle, MdRefresh, MdTimer, MdPriorityHigh } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

const statusColors = {
  pending:   { bg: 'bg-yellow-500/15 border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500' },
  preparing: { bg: 'bg-orange-500/15 border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500' },
  ready:     { bg: 'bg-green-500/15 border-green-500/30',  text: 'text-green-400',  badge: 'bg-green-500' },
};

const priorityColors = {
  normal: '',
  high:   'border-l-4 border-l-orange-500',
  urgent: 'border-l-4 border-l-red-500 animate-glow'
};

function KoTCard({ kot, onStatusUpdate }) {
  const elapsed = Math.floor((Date.now() - new Date(kot.createdAt)) / 60000);
  const isLate  = elapsed > 20;
  const colors  = statusColors[kot.status] || statusColors.pending;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className={`card p-4 ${colors.bg} border ${priorityColors[kot.priority] || ''} relative overflow-hidden`}
    >
      {/* Urgent pulse overlay */}
      {kot.priority === 'urgent' && (
        <div className="absolute inset-0 bg-red-500/5 animate-pulse-soft pointer-events-none rounded-2xl" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white text-lg">{kot.kotNumber}</span>
            {kot.priority !== 'normal' && (
              <span className={`badge text-white text-xs ${kot.priority === 'urgent' ? 'bg-red-500' : 'bg-orange-500'}`}>
                <MdPriorityHigh size={10} /> {kot.priority.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`badge ${kot.order?.type === 'delivery' ? 'bg-blue-500/20 text-blue-400' : kot.order?.type === 'pickup' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {kot.order?.type?.replace('_', ' ')?.toUpperCase() || 'DINE IN'}
            </span>
            {kot.table && <span className="text-dark-400 text-xs">Table {kot.table.tableNumber}</span>}
          </div>
        </div>
        {/* Timer */}
        <div className={`flex items-center gap-1 text-sm font-mono ${isLate ? 'text-red-400 animate-pulse-soft' : 'text-dark-400'}`}>
          <MdTimer size={16} /> {elapsed}m
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-4">
        {kot.items?.map((item, idx) => (
          <motion.div
            key={idx}
            className={`flex items-center justify-between px-3 py-2 rounded-xl ${
              item.status === 'ready' ? 'bg-green-500/10 line-through opacity-60' :
              item.status === 'preparing' ? 'bg-orange-500/10' : 'bg-dark-700/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {item.quantity}×
              </span>
              <div>
                <p className="text-white text-sm font-medium">{item.name}</p>
                {item.variant && <p className="text-xs text-dark-400">{item.variant}</p>}
                {item.specialInstructions && (
                  <p className="text-xs text-yellow-400 italic">⚠ {item.specialInstructions}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => onStatusUpdate(kot._id, item.status === 'ready' ? 'pending' : 'ready', idx)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                item.status === 'ready' ? 'bg-green-500 border-green-500 text-white' : 'border-dark-500 hover:border-green-500'
              }`}
            >
              {item.status === 'ready' && <MdCheckCircle size={14} />}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Waiter info */}
      {kot.waiter && (
        <p className="text-xs text-dark-500 mb-3">Waiter: {kot.waiter.name}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {kot.status === 'pending' && (
          <button
            onClick={() => onStatusUpdate(kot._id, 'preparing')}
            className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
          >
            🔥 Start Preparing
          </button>
        )}
        {kot.status === 'preparing' && (
          <button
            onClick={() => onStatusUpdate(kot._id, 'ready')}
            className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
          >
            ✅ Mark Ready
          </button>
        )}
        {kot.status === 'ready' && (
          <button
            onClick={() => onStatusUpdate(kot._id, 'served')}
            className="flex-1 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-green-400 text-sm font-semibold transition-colors"
          >
            🍽️ Served
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function KitchenPage() {
  const [kots, setKots] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => { fetchKots(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('kot_received', (data) => {
      setKots(prev => [data.kot, ...prev]);
      toast('🔔 New KoT received!', { icon: '🍳', duration: 5000 });
    });
    socket.on('kot_status_changed', (updatedKot) => {
      setKots(prev => prev.map(k => k._id === updatedKot._id ? updatedKot : k));
    });
    return () => { socket.off('kot_received'); socket.off('kot_status_changed'); };
  }, [socket]);

  const fetchKots = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/kot?status=pending,preparing,ready');
      setKots(data.kots || []);
    } catch {} finally { setLoading(false); }
  };

  const handleStatusUpdate = async (kotId, status, itemIndex) => {
    try {
      await api.patch(`/kot/${kotId}/status`, { status, itemIndex });
      setKots(prev => prev.map(k => {
        if (k._id !== kotId) return k;
        if (itemIndex !== undefined) {
          const items = [...k.items];
          items[itemIndex] = { ...items[itemIndex], status };
          const allReady = items.every(i => i.status === 'ready');
          return { ...k, items, status: allReady ? 'ready' : k.status };
        }
        return { ...k, status, items: k.items.map(i => ({ ...i, status })) };
      }));
      if (status === 'served') {
        setTimeout(() => setKots(prev => prev.filter(k => k._id !== kotId)), 1000);
      }
      toast.success(`KoT updated: ${status}`);
    } catch (err) {
      toast.error('Failed to update KoT');
    }
  };

  const filtered = filter === 'all' ? kots.filter(k => k.status !== 'served') : kots.filter(k => k.status === filter);
  const pendingCount   = kots.filter(k => k.status === 'pending').length;
  const preparingCount = kots.filter(k => k.status === 'preparing').length;
  const readyCount     = kots.filter(k => k.status === 'ready').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MdOutdoorGrill className="text-orange-400" /> Kitchen Display
          </h1>
          <p className="text-dark-400 text-sm mt-0.5">Real-time KoT management</p>
        </div>
        <button onClick={fetchKots} className="btn-secondary gap-2">
          <MdRefresh className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', count: pendingCount, color: '#f59e0b', bg: 'bg-yellow-500/10' },
          { label: 'Preparing', count: preparingCount, color: '#f97316', bg: 'bg-orange-500/10' },
          { label: 'Ready', count: readyCount, color: '#22c55e', bg: 'bg-green-500/10' },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.bg} text-center`}>
            <p className="text-3xl font-display font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-dark-400 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: '🍽️ All Active' },
          { value: 'pending', label: '⏳ Pending' },
          { value: 'preparing', label: '🔥 Preparing' },
          { value: 'ready', label: '✅ Ready' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === tab.value ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KoT Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-64 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-dark-500">
          <p className="text-5xl mb-4">🎉</p>
          <p className="text-lg font-semibold text-dark-400">Kitchen is clear!</p>
          <p className="text-sm">All orders are done. Great work team!</p>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(kot => (
              <KoTCard key={kot._id} kot={kot} onStatusUpdate={handleStatusUpdate} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
