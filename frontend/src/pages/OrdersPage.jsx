import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MdRefresh, MdWhatsapp, MdCheckCircle, MdCancel, MdClose
} from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/common/Modal';

export default function OrdersPage() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]   = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [payModal, setPayModal]       = useState(null);
  const [paidAmount, setPaidAmount]   = useState('');

  useEffect(() => { fetchOrders(); }, [filterStatus, filterType]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType)   params.append('type',   filterType);
      params.append('limit', '50');
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success('Order status updated!');
      fetchOrders();
    } catch { toast.error('Failed to update status'); }
  };

  const processPayment = async () => {
    if (!paidAmount) { toast.error('Enter amount received'); return; }
    try {
      await api.post(`/orders/${payModal._id}/payment`, {
        method:        payModal.method || 'cash',
        paidAmount:    parseFloat(paidAmount),
        transactionId: ''
      });
      toast.success('Payment processed! 🎉');
      setPayModal(null);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Payment failed'); }
  };

  const sendWhatsAppBill = async (orderId, e) => {
    e.stopPropagation();
    try {
      await api.post(`/whatsapp/send-bill/${orderId}`);
      toast.success('Bill sent on WhatsApp! 📲');
    } catch { toast.error('WhatsApp not configured. Check Settings.'); }
  };

  const statusOptions = ['', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
  const typeOptions   = ['', 'dine_in', 'delivery', 'pickup'];

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <button onClick={fetchOrders} className="btn-secondary">
          <MdRefresh /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select
          className="input-field w-auto"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          {statusOptions.map(s => (
            <option key={s} value={s}>{s || 'All Status'}</option>
          ))}
        </select>
        <select
          className="input-field w-auto"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          {typeOptions.map(t => (
            <option key={t} value={t}>{t ? t.replace('_', ' ') : 'All Types'}</option>
          ))}
        </select>
        <span className="text-slate-400 text-sm self-center">
          {orders.length} orders found
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['Order #', 'Customer', 'Type', 'Items', 'Total', 'Payment', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-2">
                      <div className="h-8 shimmer rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-slate-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order, i) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-700/40 hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="table-cell">
                      <span className="font-mono text-orange-400 font-semibold text-sm">
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td className="table-cell">
                      <p className="text-white font-medium">{order.customer?.name || 'Walk-in'}</p>
                      {order.customer?.phone && (
                        <p className="text-xs text-slate-500">{order.customer.phone}</p>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`type-${order.type}`}>
                        {order.type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell text-slate-300">
                      {order.items?.length} items
                    </td>
                    <td className="table-cell font-bold text-orange-400">
                      ₹{order.pricing?.total?.toLocaleString('en-IN')}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${order.payment?.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {order.payment?.status || 'pending'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="table-cell" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        {order.payment?.status !== 'paid' && (
                          <button
                            onClick={() => {
                              setPayModal({ ...order, method: 'cash' });
                              setPaidAmount(String(order.pricing?.total || ''));
                            }}
                            title="Process Payment"
                            className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            <MdCheckCircle size={16} />
                          </button>
                        )}
                        {order.customer?.phone && (
                          <button
                            onClick={e => sendWhatsAppBill(order._id, e)}
                            title="Send WhatsApp Bill"
                            className="p-1.5 rounded-lg bg-green-600/20 text-green-500 hover:bg-green-600/30 transition-colors"
                          >
                            <MdWhatsapp size={16} />
                          </button>
                        )}
                        {!['completed', 'cancelled', 'delivered'].includes(order.status) && (
                          <button
                            onClick={() => updateStatus(order._id, 'cancelled')}
                            title="Cancel Order"
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <MdCancel size={16} />
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

      {/* Order Detail Modal */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order — #${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Customer',  selectedOrder.customer?.name || 'Walk-in'],
                ['Phone',     selectedOrder.customer?.phone || '—'],
                ['Type',      selectedOrder.type?.replace('_', ' ')],
                ['Table',     selectedOrder.table?.tableNumber || '—'],
                ['Waiter',    selectedOrder.waiter?.name || '—'],
                ['Status',    selectedOrder.status],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-slate-400 text-xs mb-0.5">{label}</p>
                  <p className="text-white font-medium capitalize">{val}</p>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 border-t border-slate-700 pt-4">
                Items Ordered
              </h4>
              <div className="space-y-2">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1.5 border-b border-slate-700/40">
                    <span className="text-slate-300">
                      {item.name} × {item.quantity}
                      {item.variant && <span className="text-slate-500 ml-1">({item.variant})</span>}
                    </span>
                    <span className="text-white font-medium">
                      ₹{item.total?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.pricing?.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>CGST + SGST</span>
                  <span>₹{((selectedOrder.pricing?.cgst || 0) + (selectedOrder.pricing?.sgst || 0)).toFixed(2)}</span>
                </div>
                {selectedOrder.pricing?.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-₹{selectedOrder.pricing.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white text-base border-t border-slate-700 pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-orange-400">₹{selectedOrder.pricing?.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {selectedOrder.payment?.status !== 'paid' && (
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setPayModal({ ...selectedOrder, method: 'cash' });
                    setPaidAmount(String(selectedOrder.pricing?.total || ''));
                  }}
                  className="btn-success flex-1"
                >
                  <MdCheckCircle /> Process Payment
                </button>
              )}
              {selectedOrder.customer?.phone && (
                <button
                  onClick={e => sendWhatsAppBill(selectedOrder._id, e)}
                  className="btn-secondary flex-1"
                >
                  <MdWhatsapp /> Send Bill
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title="Process Payment"
        size="sm"
      >
        {payModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-700/50 text-center">
              <p className="text-slate-400 text-sm">Order Total</p>
              <p className="text-4xl font-bold text-orange-400 mt-1">
                ₹{payModal.pricing?.total?.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="label">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['cash', 'card', 'upi'].map(m => (
                  <button
                    key={m}
                    onClick={() => setPayModal({ ...payModal, method: m })}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all uppercase ${payModal.method === m ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Amount Received (₹)</label>
              <input
                type="number"
                className="input-field text-xl text-center"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
              />
              {parseFloat(paidAmount) > (payModal.pricing?.total || 0) && (
                <p className="text-green-400 text-sm mt-1.5 text-center">
                  Change to return: ₹{(parseFloat(paidAmount) - payModal.pricing.total).toFixed(2)}
                </p>
              )}
            </div>

            <button onClick={processPayment} className="btn-success w-full py-3.5 text-base">
              <MdCheckCircle /> Confirm Payment
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
