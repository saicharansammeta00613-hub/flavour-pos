import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdAdd, MdRefresh, MdCheckCircle, MdWarning, MdInventory } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/common/Modal';

export default function InventoryPage() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [txModal, setTxModal] = useState(null);
  const [form, setForm]       = useState({ name: '', category: 'General', unit: 'kg', currentStock: 0, minStock: 0, costPerUnit: 0, supplier: '' });
  const [tx, setTx]           = useState({ type: 'in', quantity: '', reason: '' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory');
      setItems(data.items || []);
    } catch {} finally { setLoading(false); }
  };

  const addItem = async () => {
    if (!form.name) { toast.error('Item name required'); return; }
    try {
      await api.post('/inventory', form);
      toast.success('Item added!');
      setModal(false);
      setForm({ name: '', category: 'General', unit: 'kg', currentStock: 0, minStock: 0, costPerUnit: 0, supplier: '' });
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addTransaction = async () => {
    if (!tx.quantity) { toast.error('Quantity required'); return; }
    try {
      await api.post(`/inventory/${txModal._id}/transaction`, { ...tx, quantity: Number(tx.quantity) });
      toast.success('Stock updated!');
      setTxModal(null);
      setTx({ type: 'in', quantity: '', reason: '' });
      fetchItems();
    } catch { toast.error('Failed'); }
  };

  const lowStockItems = items.filter(i => i.currentStock <= i.minStock);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MdInventory className="text-orange-400" /> Inventory
          </h1>
          {lowStockItems.length > 0 && (
            <p className="text-red-400 text-sm flex items-center gap-1 mt-0.5">
              <MdWarning /> {lowStockItems.length} items low on stock
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="btn-secondary"><MdRefresh /></button>
          <button onClick={() => setModal(true)} className="btn-primary"><MdAdd /> Add Item</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['Item', 'Category', 'Current Stock', 'Min Stock', 'Cost/Unit', 'Supplier', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-2"><div className="h-8 shimmer rounded" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">No inventory items added yet</td></tr>
              ) : (
                items.map((item, i) => {
                  const isLow = item.currentStock <= item.minStock;
                  return (
                    <motion.tr key={item._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${isLow ? 'bg-red-500/5' : ''}`}
                    >
                      <td className="table-cell font-semibold text-white">{item.name}</td>
                      <td className="table-cell text-slate-400">{item.category}</td>
                      <td className="table-cell">
                        <span className={`font-bold ${isLow ? 'text-red-400' : 'text-green-400'}`}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="table-cell text-slate-400">{item.minStock} {item.unit}</td>
                      <td className="table-cell text-slate-300">₹{item.costPerUnit}</td>
                      <td className="table-cell text-slate-400">{item.supplier || '—'}</td>
                      <td className="table-cell">
                        <span className={`badge ${isLow ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          {isLow ? 'Low Stock' : 'OK'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button onClick={() => { setTxModal(item); setTx({ type: 'in', quantity: '', reason: '' }); }}
                          className="px-3 py-1 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 text-xs font-semibold transition-colors">
                          Update Stock
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Inventory Item">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Item Name *</label>
            <input className="input-field" placeholder="e.g. Chicken, Tomatoes, Rice"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input-field" placeholder="Vegetables, Meat, Dairy..."
              value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <label className="label">Unit</label>
            <select className="input-field" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              {['kg', 'g', 'ltr', 'ml', 'pcs', 'dozen', 'box', 'packet', 'bottle'].map(u => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Current Stock</label>
            <input type="number" min={0} className="input-field" value={form.currentStock}
              onChange={e => setForm({ ...form, currentStock: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Min Stock Alert</label>
            <input type="number" min={0} className="input-field" value={form.minStock}
              onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Cost per Unit (₹)</label>
            <input type="number" min={0} className="input-field" value={form.costPerUnit}
              onChange={e => setForm({ ...form, costPerUnit: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Supplier Name</label>
            <input className="input-field" placeholder="Supplier name"
              value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={addItem} className="btn-primary flex-1"><MdAdd /> Add Item</button>
        </div>
      </Modal>

      {/* Transaction Modal */}
      <Modal open={!!txModal} onClose={() => setTxModal(null)} title={`Update Stock — ${txModal?.name}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'in', label: '📦 Stock In' },
                { value: 'out', label: '📤 Stock Out' },
                { value: 'waste', label: '🗑️ Waste' },
                { value: 'adjustment', label: '⚖️ Adjustment' }
              ].map(t => (
                <button key={t.value} onClick={() => setTx({ ...tx, type: t.value })}
                  className={`py-2 rounded-xl text-sm font-semibold transition-all ${tx.type === t.value ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Quantity ({txModal?.unit})</label>
            <input type="number" min={0} className="input-field" value={tx.quantity}
              onChange={e => setTx({ ...tx, quantity: e.target.value })} />
          </div>
          <div>
            <label className="label">Reason / Note</label>
            <input className="input-field" placeholder="Reason for this transaction..."
              value={tx.reason} onChange={e => setTx({ ...tx, reason: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setTxModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={addTransaction} className="btn-primary flex-1">
              <MdCheckCircle /> Update
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
