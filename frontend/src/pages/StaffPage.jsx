import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdAdd, MdRefresh, MdPeople, MdToggleOn, MdToggleOff, MdPunchClock } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/common/Modal';

const ROLE_COLORS = {
  admin:'#f97316', manager:'#f59e0b', cashier:'#3b82f6',
  waiter:'#10b981', kitchen:'#ef4444', delivery:'#8b5cf6', staff:'#64748b'
};

export default function StaffPage() {
  const [staff, setStaff]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState({
    name:'', email:'', phone:'', role:'waiter',
    shift:'flexible', salary:'', designation:'', password:'flavour123'
  });

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/staff');
      setStaff(data.staff || []);
    } catch {} finally { setLoading(false); }
  };

  const addStaff = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    try {
      await api.post('/staff', form);
      toast.success(`${form.name} added to staff!`);
      setModal(false);
      setForm({ name:'', email:'', phone:'', role:'waiter', shift:'flexible', salary:'', designation:'', password:'flavour123' });
      fetchStaff();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleStaff = async (id) => {
    try {
      await api.patch(`/staff/${id}/toggle`);
      toast.success('Staff status updated');
      fetchStaff();
    } catch {}
  };

  const punchIn = async (staffId) => {
    try {
      await api.post('/staff/attendance/punch', { staffId, type: 'in' });
      toast.success('Punch in recorded!');
    } catch { toast.error('Failed to record'); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <MdPeople className="text-teal-400" /> Staff Management
        </h1>
        <div className="flex gap-2">
          <button onClick={fetchStaff} className="btn-secondary"><MdRefresh /></button>
          <button onClick={() => setModal(true)} className="btn-primary"><MdAdd /> Add Staff</button>
        </div>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['waiter','kitchen','cashier','delivery'].map(role => (
          <div key={role} className="card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: ROLE_COLORS[role] }}>
              {staff.filter(s => s.role === role).length}
            </p>
            <p className="text-slate-400 text-xs capitalize">{role}s</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 shimmer rounded-2xl" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">👥</p>
          <p>No staff members yet. Add your first staff member!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member, i) => (
            <motion.div key={member._id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                    style={{ background: `${ROLE_COLORS[member.role] || '#64748b'}25`, color: ROLE_COLORS[member.role] }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.designation || member.role}</p>
                  </div>
                </div>
                <button onClick={() => toggleStaff(member._id)}
                  className={`transition-colors ${member.isActive ? 'text-green-400' : 'text-slate-500'}`}>
                  {member.isActive ? <MdToggleOn size={26} /> : <MdToggleOff size={26} />}
                </button>
              </div>

              <div className="space-y-1.5 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Role</span>
                  <span className="badge capitalize"
                    style={{ background:`${ROLE_COLORS[member.role]}20`, color: ROLE_COLORS[member.role] }}>
                    {member.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone</span>
                  <span className="text-slate-300">{member.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shift</span>
                  <span className="text-slate-300 capitalize">{member.shift}</span>
                </div>
                {member.salary && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Salary</span>
                    <span className="text-orange-400 font-semibold">₹{Number(member.salary).toLocaleString('en-IN')}/mo</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <span className={`badge flex-1 justify-center ${member.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => punchIn(member._id)}
                  className="badge bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors cursor-pointer gap-1">
                  <MdPunchClock size={12} /> Punch In
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Staff Member">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Full Name *</label>
            <input className="input-field" placeholder="Employee full name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input-field" placeholder="staff@flavour.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input-field" placeholder="+91 XXXXX XXXXX"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Role *</label>
            <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {['manager','cashier','waiter','kitchen','delivery','staff'].map(r => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Shift</label>
            <select className="input-field" value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}>
              {['morning','afternoon','evening','night','flexible'].map(s => (
                <option key={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Designation</label>
            <input className="input-field" placeholder="e.g. Head Chef, Senior Waiter"
              value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
          </div>
          <div>
            <label className="label">Monthly Salary (₹)</label>
            <input type="number" min={0} className="input-field"
              value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Login Password</label>
            <input className="input-field" placeholder="Default: flavour123"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <p className="text-xs text-slate-500 mt-1">Staff will use email + this password to login</p>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={addStaff} className="btn-primary flex-1"><MdAdd /> Add Staff</button>
        </div>
      </Modal>
    </div>
  );
}
