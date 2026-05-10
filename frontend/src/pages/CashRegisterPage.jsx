import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdAccountBalanceWallet, MdAdd, MdCheckCircle } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/common/Modal';

export default function CashRegisterPage() {
  const [register, setRegister]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [openModal, setOpenModal]       = useState(false);
  const [closeModal, setCloseModal]     = useState(false);
  const [txModal, setTxModal]           = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [tx, setTx] = useState({ type: 'deposit', amount: '', description: '' });

  useEffect(() => { fetchRegister(); }, []);

  const fetchRegister = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cash-register/current');
      setRegister(data.register);
    } catch {} finally { setLoading(false); }
  };

  const openRegister = async () => {
    try {
      await api.post('/cash-register/open', { openingBalance: parseFloat(openingBalance) || 0 });
      toast.success('Cash register opened!');
      setOpenModal(false);
      setOpeningBalance('');
      fetchRegister();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const closeRegister = async () => {
    try {
      await api.post('/cash-register/close', { closingBalance: parseFloat(closingBalance) || 0 });
      toast.success('Cash register closed!');
      setCloseModal(false);
      setClosingBalance('');
      setRegister(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addTransaction = async () => {
    if (!tx.amount) { toast.error('Amount required'); return; }
    try {
      await api.post('/cash-register/transaction', { ...tx, amount: parseFloat(tx.amount) });
      toast.success('Transaction recorded!');
      setTxModal(false);
      setTx({ type: 'deposit', amount: '', description: '' });
      fetchRegister();
    } catch { toast.error('Failed'); }
  };

  const expected = register
    ? (register.openingBalance + register.totalCashIn - register.totalCashOut)
    : 0;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <MdAccountBalanceWallet className="text-yellow-400" /> Cash Register
        </h1>
        <div className="flex gap-2">
          {!register ? (
            <button onClick={() => setOpenModal(true)} className="btn-success">
              <MdCheckCircle /> Open Register
            </button>
          ) : (
            <>
              <button onClick={() => setTxModal(true)} className="btn-secondary">
                <MdAdd /> Add Transaction
              </button>
              <button onClick={() => setCloseModal(true)} className="btn-danger">
                Close Register
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-48 shimmer rounded-2xl" />
      ) : !register ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-5xl mb-4">💰</p>
          <p className="text-lg font-semibold text-slate-400">No register is open</p>
          <p className="text-sm mb-6">Open the cash register to start tracking transactions</p>
          <button onClick={() => setOpenModal(true)} className="btn-success mx-auto">
            <MdCheckCircle /> Open Register
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label:'Opening Balance', val: register.openingBalance, color:'#94a3b8' },
              { label:'Cash In',         val: register.totalCashIn,    color:'#22c55e' },
              { label:'Cash Out',        val: register.totalCashOut,   color:'#ef4444' },
              { label:'Total Sales',     val: register.totalSales,     color:'#f97316' },
            ].map(s => (
              <div key={s.label} className="card p-5 text-center">
                <p className="text-slate-400 text-sm mb-1">{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>
                  ₹{(s.val || 0).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          {/* Transactions */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">
                Transactions ({register.transactions?.length || 0})
              </h3>
              <p className="text-sm text-slate-400">
                Expected balance: <span className="text-white font-semibold">₹{expected.toLocaleString('en-IN')}</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    {['Type','Amount','Description','Time'].map(h=>(
                      <th key={h} className="table-header text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...(register.transactions || [])].reverse().slice(0,20).map((t, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="table-cell">
                        <span className={`badge capitalize ${['sale','deposit'].includes(t.type) ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`table-cell font-bold ${['sale','deposit'].includes(t.type) ? 'text-green-400' : 'text-red-400'}`}>
                        ₹{(t.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="table-cell text-slate-300">{t.description || '—'}</td>
                      <td className="table-cell text-slate-400 text-xs">
                        {new Date(t.time).toLocaleTimeString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {(!register.transactions || register.transactions.length === 0) && (
                    <tr><td colSpan={4} className="text-center py-8 text-slate-500">No transactions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Open Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Open Cash Register" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Opening Balance (₹)</label>
            <input type="number" min={0} className="input-field text-xl text-center"
              placeholder="0.00" value={openingBalance}
              onChange={e => setOpeningBalance(e.target.value)} />
            <p className="text-xs text-slate-500 mt-1">Enter cash in hand at start of shift</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setOpenModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={openRegister} className="btn-success flex-1">
              <MdCheckCircle /> Open Register
            </button>
          </div>
        </div>
      </Modal>

      {/* Close Modal */}
      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Close Cash Register" size="sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-700/50 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Opening</span><span>₹{(register?.openingBalance || 0).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-green-400"><span>Cash In</span><span>+₹{(register?.totalCashIn || 0).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-red-400"><span>Cash Out</span><span>-₹{(register?.totalCashOut || 0).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between font-bold text-white border-t border-slate-600 pt-2">
              <span>Expected</span><span>₹{expected.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div>
            <label className="label">Actual Closing Balance (₹)</label>
            <input type="number" min={0} className="input-field text-xl text-center"
              placeholder="Count cash and enter" value={closingBalance}
              onChange={e => setClosingBalance(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCloseModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={closeRegister} className="btn-danger flex-1">Close Register</button>
          </div>
        </div>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal open={txModal} onClose={() => setTxModal(false)} title="Add Transaction" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[{value:'deposit',label:'💵 Deposit'},{value:'withdrawal',label:'💸 Withdrawal'}].map(t=>(
                <button key={t.value} onClick={() => setTx({ ...tx, type: t.value })}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${tx.type === t.value ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input type="number" min={0} className="input-field" placeholder="0.00"
              value={tx.amount} onChange={e => setTx({ ...tx, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input-field" placeholder="Reason for transaction"
              value={tx.description} onChange={e => setTx({ ...tx, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setTxModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={addTransaction} className="btn-primary flex-1"><MdAdd /> Add</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
