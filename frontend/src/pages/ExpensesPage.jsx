import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdAdd, MdRefresh, MdDelete, MdReceipt } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/common/Modal';

const CAT_COLORS = {
  rent:'#f59e0b', salaries:'#3b82f6', utilities:'#8b5cf6',
  ingredients:'#10b981', equipment:'#ef4444', maintenance:'#f97316',
  marketing:'#ec4899', licenses:'#06b6d4', other:'#64748b'
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({
    title: '', category: 'ingredients', amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash', vendor: '', notes: ''
  });

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data.expenses || []);
      setTotalAmount(data.totalAmount || 0);
    } catch {} finally { setLoading(false); }
  };

  const addExpense = async () => {
    if (!form.title || !form.amount) { toast.error('Title and amount required'); return; }
    try {
      await api.post('/expenses', form);
      toast.success('Expense recorded!');
      setModal(false);
      setForm({ title:'', category:'ingredients', amount:'', date: new Date().toISOString().split('T')[0], paymentMethod:'cash', vendor:'', notes:'' });
      fetchExpenses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MdReceipt className="text-pink-400" /> Expenses
          </h1>
          <p className="text-orange-400 font-semibold mt-0.5">
            Total: ₹{totalAmount.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchExpenses} className="btn-secondary"><MdRefresh /></button>
          <button onClick={() => setModal(true)} className="btn-primary"><MdAdd /> Add Expense</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['Title', 'Category', 'Amount', 'Date', 'Payment', 'Vendor', 'Action'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-2"><div className="h-8 shimmer rounded" /></td></tr>
                ))
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">No expenses recorded yet</td></tr>
              ) : (
                expenses.map((exp, i) => (
                  <motion.tr key={exp._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="table-cell font-medium text-white">{exp.title}</td>
                    <td className="table-cell">
                      <span className="badge capitalize"
                        style={{ background: `${CAT_COLORS[exp.category] || '#64748b'}20`, color: CAT_COLORS[exp.category] || '#94a3b8' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="table-cell font-bold text-red-400">₹{exp.amount?.toLocaleString('en-IN')}</td>
                    <td className="table-cell text-slate-400">{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                    <td className="table-cell text-slate-400 uppercase text-xs">{exp.paymentMethod}</td>
                    <td className="table-cell text-slate-400">{exp.vendor || '—'}</td>
                    <td className="table-cell">
                      <button onClick={() => deleteExpense(exp._id)}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                        <MdDelete size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Expense">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Title *</label>
            <input className="input-field" placeholder="e.g. Vegetable purchase, Electricity bill"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {['rent','salaries','utilities','ingredients','equipment','maintenance','marketing','licenses','other'].map(c => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount (₹) *</label>
            <input type="number" min={0} className="input-field" placeholder="0.00"
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input-field" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
              {['cash','card','upi','bank_transfer','cheque'].map(m => (
                <option key={m} value={m}>{m.replace('_',' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vendor / Supplier</label>
            <input className="input-field" placeholder="Vendor name"
              value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} placeholder="Additional notes..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={addExpense} className="btn-primary flex-1"><MdAdd /> Record Expense</button>
        </div>
      </Modal>
    </div>
  );
}
