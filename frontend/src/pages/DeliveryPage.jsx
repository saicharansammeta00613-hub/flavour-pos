import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MdAdd, MdRefresh, MdCheckCircle, MdTwoWheeler, MdWarning
} from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/common/Modal';

export default function DeliveryPage() {
  const [executives, setExecutives] = useState([]);
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState({ name: '', phone: '', vehicleType: 'bike', vehicleNumber: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [execRes, orderRes] = await Promise.all([
        api.get('/delivery'),
        api.get('/orders?type=delivery&status=confirmed')
      ]);
      setExecutives(execRes.data.executives || []);
      setOrders(orderRes.data.orders || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const addExec = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return; }
    try {
      await api.post('/delivery', form);
      toast.success('Delivery executive added!');
      setModal(false);
      setForm({ name: '', phone: '', vehicleType: 'bike', vehicleNumber: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleAvailability = async (id, current) => {
    try {
      await api.patch(`/delivery/${id}/availability`, { isAvailable: !current });
      fetchData();
    } catch {}
  };

  const assignOrder = async (execId, orderId) => {
    if (!execId) return;
    try {
      await api.patch(`/delivery/${execId}/assign-order`, { orderId });
      toast.success('Order assigned!');
      fetchData();
    } catch { toast.error('Failed to assign'); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage delivery executives and orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary"><MdRefresh /></button>
          <button onClick={() => setModal(true)} className="btn-primary"><MdAdd /> Add Executive</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Executives */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">
            Delivery Executives ({executives.length})
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 shimmer rounded-xl" />)}
            </div>
          ) : executives.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No executives added yet</p>
          ) : (
            <div className="space-y-3">
              {executives.map((exec, i) => (
                <motion.div
                  key={exec._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${exec.isAvailable ? 'bg-green-500/20' : 'bg-slate-600'}`}>
                      <MdTwoWheeler className={exec.isAvailable ? 'text-green-400' : 'text-slate-400'} size={20} />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{exec.name}</p>
                      <p className="text-xs text-slate-400">{exec.phone} · {exec.vehicleType}</p>
                      {exec.vehicleNumber && <p className="text-xs text-slate-500">{exec.vehicleNumber}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${exec.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                      {exec.isAvailable ? 'Available' : 'Busy'}
                    </span>
                    <button
                      onClick={() => toggleAvailability(exec._id, exec.isAvailable)}
                      className="text-xs px-2 py-1 rounded-lg bg-slate-600 text-slate-300 hover:bg-slate-500 transition-colors"
                    >
                      Toggle
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Delivery Orders */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">
            Pending Delivery Orders ({orders.length})
          </h3>
          {orders.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No pending delivery orders</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order, i) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-xl bg-slate-700/50 border border-slate-700"
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-orange-400 font-semibold text-sm">#{order.orderNumber}</span>
                    <span className={`status-badge-${order.status}`}>{order.status}</span>
                  </div>
                  <p className="text-white font-medium text-sm">{order.customer?.name}</p>
                  <p className="text-xs text-slate-400 mb-2">{order.customer?.address || 'No address'}</p>
                  <p className="text-orange-400 font-bold text-sm mb-2">
                    ₹{order.pricing?.total?.toLocaleString('en-IN')}
                  </p>
                  <select
                    className="input-field text-sm py-1.5"
                    onChange={e => assignOrder(e.target.value, order._id)}
                    defaultValue=""
                  >
                    <option value="">Assign to executive...</option>
                    {executives.filter(e => e.isAvailable).map(e => (
                      <option key={e._id} value={e._id}>{e.name}</option>
                    ))}
                  </select>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Delivery Executive" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input-field" placeholder="Executive name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input-field" placeholder="+91 XXXXX XXXXX"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Vehicle Type</label>
            <select className="input-field" value={form.vehicleType}
              onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
              {['bike', 'scooter', 'bicycle', 'car'].map(v => (
                <option key={v} value={v} className="capitalize">{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vehicle Number</label>
            <input className="input-field" placeholder="TS09AB1234"
              value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={addExec} className="btn-primary flex-1"><MdAdd /> Add</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
