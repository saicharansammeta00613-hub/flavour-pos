import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdTableBar, MdAdd, MdRefresh, MdPeople } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/common/Modal';

const STATUS_CFG = {
  available: { color:'#22c55e', border:'border-green-500/40', bg:'bg-green-500/10', dot:'bg-green-500', label:'Available' },
  occupied:  { color:'#ef4444', border:'border-red-500/40',   bg:'bg-red-500/10',   dot:'bg-red-500',   label:'Occupied'  },
  reserved:  { color:'#f59e0b', border:'border-amber-500/40', bg:'bg-amber-500/10', dot:'bg-amber-500', label:'Reserved'  },
  cleaning:  { color:'#64748b', border:'border-slate-600',    bg:'bg-slate-700/50', dot:'bg-slate-400', label:'Cleaning'  },
  blocked:   { color:'#6366f1', border:'border-indigo-500/40',bg:'bg-indigo-500/10',dot:'bg-indigo-500',label:'Blocked'   },
};

export default function TablesPage() {
  const [tables, setTables]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [section, setSection]       = useState('All');
  const [addModal, setAddModal]     = useState(false);
  const [form, setForm]             = useState({ tableNumber:'', name:'', capacity:4, section:'Main Hall' });

  useEffect(() => { fetchTables(); }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tables');
      setTables(data.tables || []);
    } catch {} finally { setLoading(false); }
  };

  const sections = ['All', ...new Set(tables.map(t => t.section).filter(Boolean))];
  const filtered = section === 'All' ? tables : tables.filter(t => t.section === section);

  const addTable = async () => {
    if (!form.tableNumber) { toast.error('Table number required'); return; }
    try {
      await api.post('/tables', form);
      toast.success('Table added!');
      setAddModal(false);
      setForm({ tableNumber:'', name:'', capacity:4, section:'Main Hall' });
      fetchTables();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const changeStatus = async (id, status, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/tables/${id}/status`, { status });
      fetchTables();
    } catch { toast.error('Failed to update status'); }
  };

  const callWaiter = (table, e) => {
    e.stopPropagation();
    toast(`🔔 Waiter called for ${table.tableNumber}!`, { icon:'🙋', duration:4000 });
  };

  const stats = {
    total:     tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied:  tables.filter(t => t.status === 'occupied').length,
    reserved:  tables.filter(t => t.status === 'reserved').length,
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MdTableBar className="text-purple-400" /> Tables & Floor Plan
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your restaurant floor</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTables} className="btn-secondary"><MdRefresh /></button>
          <button onClick={() => setAddModal(true)} className="btn-primary"><MdAdd /> Add Table</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'Total',     val: stats.total,     color:'#94a3b8' },
          { label:'Available', val: stats.available,  color:'#22c55e' },
          { label:'Occupied',  val: stats.occupied,   color:'#ef4444' },
          { label:'Reserved',  val: stats.reserved,   color:'#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-slate-400 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Section Filter */}
      <div className="flex gap-2 flex-wrap">
        {sections.map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${section === s ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => <div key={i} className="h-44 shimmer rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">🪑</p>
          <p>No tables found. Add your first table!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          <AnimatePresence>
            {filtered.map((table, i) => {
              const cfg = STATUS_CFG[table.status] || STATUS_CFG.available;
              return (
                <motion.div
                  key={table._id}
                  initial={{ opacity:0, scale:0.9 }}
                  animate={{ opacity:1, scale:1 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  className={`relative p-4 rounded-2xl border-2 cursor-default transition-all ${cfg.bg} ${cfg.border}`}
                >
                  {/* Status dot */}
                  <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${cfg.dot} ${table.status === 'occupied' ? 'animate-pulse' : ''}`} />

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background:`${cfg.color}20` }}>
                    <MdTableBar style={{ color: cfg.color }} className="text-2xl" />
                  </div>

                  <p className="text-center font-bold text-white text-lg">{table.tableNumber}</p>
                  {table.name && <p className="text-center text-xs text-slate-400 mt-0.5 truncate">{table.name}</p>}

                  <div className="flex items-center justify-center gap-1 mt-1">
                    <MdPeople className="text-slate-500 text-xs" />
                    <span className="text-slate-400 text-xs">{table.capacity} seats</span>
                  </div>

                  <p className="text-center text-xs font-semibold mt-2" style={{ color: cfg.color }}>
                    {cfg.label}
                  </p>

                  {table.status === 'occupied' && table.currentOrder && (
                    <div className="mt-2 pt-2 border-t border-slate-700/60">
                      <p className="text-xs text-slate-400 text-center truncate">#{table.currentOrder.orderNumber}</p>
                      <p className="text-xs text-orange-400 text-center font-semibold">
                        ₹{table.currentOrder.pricing?.total?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-1">
                    {table.status === 'available' && (
                      <button onClick={e => changeStatus(table._id, 'occupied', e)}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                        Occupy
                      </button>
                    )}
                    {table.status === 'occupied' && (
                      <>
                        <button onClick={e => changeStatus(table._id, 'cleaning', e)}
                          className="flex-1 text-xs py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
                          Clean
                        </button>
                        <button onClick={e => callWaiter(table, e)}
                          className="flex-1 text-xs py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors">
                          Waiter
                        </button>
                      </>
                    )}
                    {table.status === 'cleaning' && (
                      <button onClick={e => changeStatus(table._id, 'available', e)}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                        ✓ Done
                      </button>
                    )}
                    {table.status === 'reserved' && (
                      <button onClick={e => changeStatus(table._id, 'occupied', e)}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                        Seat
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Table Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Table" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Table Number *</label>
            <input className="input-field" placeholder="e.g. T01, A1, VIP1"
              value={form.tableNumber} onChange={e => setForm({ ...form, tableNumber: e.target.value })} />
          </div>
          <div>
            <label className="label">Table Name (optional)</label>
            <input className="input-field" placeholder="e.g. Window Table, Corner Booth"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Capacity (seats)</label>
            <input type="number" min={1} max={50} className="input-field"
              value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Section</label>
            <select className="input-field" value={form.section}
              onChange={e => setForm({ ...form, section: e.target.value })}>
              {['Main Hall','Window Side','Outdoor','Terrace','VIP','Private Dining'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={addTable} className="btn-primary flex-1"><MdAdd /> Add Table</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
