import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdEventSeat, MdAdd, MdEdit, MdCheckCircle, MdCancel, MdRefresh } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/common/Modal';

const STATUS_COLORS = {
  pending:   'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  seated:    'bg-green-500/20 text-green-400',
  completed: 'bg-slate-700 text-slate-400',
  cancelled: 'bg-red-500/20 text-red-400',
  no_show:   'bg-slate-700 text-slate-500',
};

const BLANK_FORM = {
  customer: { name:'', phone:'', email:'' },
  date: new Date().toISOString().split('T')[0],
  time: '19:00',
  guestCount: 2,
  table: '',
  specialRequests: '',
  occasion: ''
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(BLANK_FORM);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, tblRes] = await Promise.all([
        api.get('/reservations'),
        api.get('/tables')
      ]);
      setReservations(resRes.data.reservations || []);
      setTables(tblRes.data.tables || []);
    } catch {} finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK_FORM);
    setModal(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({ ...r, date: new Date(r.date).toISOString().split('T')[0], table: r.table?._id || '' });
    setModal(true);
  };

  const save = async () => {
    if (!form.customer.name || !form.customer.phone) {
      toast.error('Customer name and phone are required'); return;
    }
    try {
      if (editing) {
        await api.put(`/reservations/${editing._id}`, form);
        toast.success('Reservation updated!');
      } else {
        await api.post('/reservations', form);
        toast.success('Reservation created! WhatsApp confirmation sent 📲');
      }
      setModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      toast.success(`Reservation ${status}`);
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const fc = (key, val) => setForm(p => ({ ...p, customer: { ...p.customer, [key]: val } }));
  const ff = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MdEventSeat className="text-cyan-400" /> Reservations
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Table reservation management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary"><MdRefresh /></button>
          <button onClick={openAdd}   className="btn-primary"><MdAdd /> New Reservation</button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['#', 'Customer', 'Date & Time', 'Guests', 'Table', 'Occasion', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-2"><div className="h-8 shimmer rounded" /></td></tr>
                ))
              ) : reservations.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-14 text-slate-500">No reservations yet</td></tr>
              ) : (
                reservations.map((r, i) => (
                  <motion.tr key={r._id}
                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-700/40 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="table-cell font-mono text-orange-400 text-sm">{r.reservationNumber}</td>
                    <td className="table-cell">
                      <p className="text-white font-medium">{r.customer?.name}</p>
                      <p className="text-xs text-slate-500">{r.customer?.phone}</p>
                    </td>
                    <td className="table-cell">
                      <p className="text-white">{new Date(r.date).toLocaleDateString('en-IN')}</p>
                      <p className="text-xs text-slate-400">{r.time}</p>
                    </td>
                    <td className="table-cell text-slate-300">{r.guestCount} pax</td>
                    <td className="table-cell text-slate-300">{r.table?.tableNumber || '—'}</td>
                    <td className="table-cell text-slate-400 capitalize">{r.occasion || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_COLORS[r.status] || 'bg-slate-700 text-slate-400'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(r)}
                          className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-white transition-colors">
                          <MdEdit size={14} />
                        </button>
                        {r.status === 'pending' && (
                          <button onClick={() => updateStatus(r._id, 'confirmed')}
                            className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                            <MdCheckCircle size={14} />
                          </button>
                        )}
                        {!['completed','cancelled'].includes(r.status) && (
                          <button onClick={() => updateStatus(r._id, 'cancelled')}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                            <MdCancel size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Reservation' : 'New Reservation'}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Customer Name *</label>
            <input className="input-field" placeholder="Full name"
              value={form.customer.name} onChange={e => fc('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Phone (WhatsApp) *</label>
            <input className="input-field" placeholder="+91 XXXXX XXXXX"
              value={form.customer.phone} onChange={e => fc('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input-field"
              value={form.date} onChange={e => ff('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Time *</label>
            <input type="time" className="input-field"
              value={form.time} onChange={e => ff('time', e.target.value)} />
          </div>
          <div>
            <label className="label">Number of Guests</label>
            <input type="number" min={1} className="input-field"
              value={form.guestCount} onChange={e => ff('guestCount', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Assign Table</label>
            <select className="input-field" value={form.table} onChange={e => ff('table', e.target.value)}>
              <option value="">Auto-assign later</option>
              {tables.map(t => (
                <option key={t._id} value={t._id}>
                  {t.tableNumber} — {t.capacity} seats ({t.section})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Occasion</label>
            <select className="input-field" value={form.occasion} onChange={e => ff('occasion', e.target.value)}>
              <option value="">None</option>
              {['birthday','anniversary','business','date','family','other'].map(o => (
                <option key={o} value={o} className="capitalize">{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Email (optional)</label>
            <input type="email" className="input-field" placeholder="customer@email.com"
              value={form.customer.email || ''} onChange={e => fc('email', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Special Requests</label>
            <textarea className="input-field" rows={2}
              placeholder="Dietary needs, seating preferences, decor requests..."
              value={form.specialRequests} onChange={e => ff('specialRequests', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} className="btn-primary flex-1">
            {editing ? <><MdEdit /> Update</> : <><MdAdd /> Create</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
