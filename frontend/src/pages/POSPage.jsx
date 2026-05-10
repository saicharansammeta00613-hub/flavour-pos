import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdSearch, MdAdd, MdRemove, MdDelete, MdSend,
  MdTableBar, MdDeliveryDining, MdShoppingBag,
  MdPerson, MdPhone, MdHome, MdClose
} from 'react-icons/md';
import { HiSparkles } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ORDER_TYPES = [
  { value: 'dine_in',  label: 'Dine In',  icon: MdTableBar,      color: '#f97316' },
  { value: 'delivery', label: 'Delivery', icon: MdDeliveryDining, color: '#3b82f6' },
  { value: 'pickup',   label: 'Pickup',   icon: MdShoppingBag,   color: '#10b981' },
];

export default function POSPage() {
  const [categories, setCategories]     = useState([]);
  const [menuItems, setMenuItems]       = useState([]);
  const [cart, setCart]                 = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch]             = useState('');
  const [orderType, setOrderType]       = useState('dine_in');
  const [tables, setTables]             = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [customer, setCustomer]         = useState({ name: '', phone: '', address: '' });
  const [discountType, setDiscountType] = useState('flat');
  const [discount, setDiscount]         = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isPlacing, setIsPlacing]       = useState(false);
  const searchRef = useRef();

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => { loadMenuItems(); }, [activeCategory, search]);

  const loadInitialData = async () => {
    try {
      const [catRes, tableRes] = await Promise.all([
        api.get('/categories'),
        api.get('/tables?status=available')
      ]);
      const cats = catRes.data.categories || [];
      setCategories(cats);
      setTables(tableRes.data.tables || []);
      if (cats.length > 0) setActiveCategory(cats[0]._id);
    } catch (err) { console.error(err); }
  };

  const loadMenuItems = async () => {
    try {
      const params = new URLSearchParams({ available: 'true' });
      if (activeCategory) params.append('category', activeCategory);
      if (search)         params.append('search', search);
      const res = await api.get(`/menu?${params}`);
      setMenuItems(res.data.items || []);
    } catch (err) { console.error(err); }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c._id === item._id);
      if (existing) {
        return prev.map(c => c._id === item._id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1, specialInstructions: '' }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(c => c._id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c)
      .filter(c => c.qty > 0)
    );
  };

  const removeItem = (id) => setCart(prev => prev.filter(c => c._id !== id));

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomer({ name: '', phone: '', address: '' });
    setSelectedTable(null);
  };

  // Pricing calculations
  const subtotal    = cart.reduce((s, i) => s + (i.discountedPrice || i.price) * i.qty, 0);
  const discAmt     = discountType === 'percentage' ? subtotal * (discount / 100) : Number(discount);
  const taxable     = Math.max(0, subtotal - discAmt);
  const cgst        = taxable * 0.025;
  const sgst        = taxable * 0.025;
  const deliveryCharge = orderType === 'delivery' ? 40 : 0;
  const total       = taxable + cgst + sgst + deliveryCharge;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { toast.error('Add items to cart first!'); return; }
    if (orderType === 'dine_in' && !selectedTable) {
      toast.error('Please select a table for dine-in!'); return;
    }
    if (orderType === 'delivery' && !customer.phone) {
      toast.error('Customer phone is required for delivery!'); return;
    }

    setIsPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        type:     orderType,
        tableId:  selectedTable,
        customer,
        items: cart.map(i => ({
          menuItem:            i._id,
          quantity:            i.qty,
          specialInstructions: i.specialInstructions
        })),
        pricing: { subtotal, cgst, sgst, discount: discAmt, discountType, deliveryCharge, total }
      });
      toast.success(`✅ Order #${data.order.orderNumber} placed! KoT sent to kitchen.`);
      clearCart();
      loadInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 overflow-hidden">

      {/* ── LEFT: Menu Panel ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Order Type Selector */}
        <div className="flex gap-2 mb-3 flex-shrink-0">
          {ORDER_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => { setOrderType(t.value); setSelectedTable(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                orderType === t.value ? 'text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              style={orderType === t.value ? { background: t.color } : {}}
            >
              <t.icon size={18} /> {t.label}
            </button>
          ))}
        </div>

        {/* Table selection (dine-in) */}
        <AnimatePresence>
          {orderType === 'dine_in' && tables.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex-shrink-0"
            >
              <p className="text-xs text-slate-400 mb-1.5">Select Table</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tables.map(t => (
                  <button
                    key={t._id}
                    onClick={() => setSelectedTable(t._id === selectedTable ? null : t._id)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedTable === t._id
                        ? 'bg-orange-500 border-orange-400 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-orange-500'
                    }`}
                  >
                    {t.tableNumber} · {t.capacity}p
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Customer info (delivery/pickup) */}
          {orderType !== 'dine_in' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex-shrink-0"
            >
              <div className={`grid gap-2 ${orderType === 'delivery' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="relative">
                  <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input className="input-field pl-8 py-2 text-sm" placeholder="Customer name"
                    value={customer.name}
                    onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                </div>
                <div className="relative">
                  <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input className="input-field pl-8 py-2 text-sm" placeholder="Phone (for WhatsApp bill)"
                    value={customer.phone}
                    onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
                </div>
                {orderType === 'delivery' && (
                  <div className="relative">
                    <MdHome className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input className="input-field pl-8 py-2 text-sm" placeholder="Delivery address"
                      value={customer.address}
                      onChange={e => setCustomer({ ...customer, address: e.target.value })} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative mb-3 flex-shrink-0">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            ref={searchRef}
            className="input-field pl-11"
            placeholder="Search menu items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
              <MdClose size={18} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 flex-shrink-0">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              !activeCategory ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id === activeCategory ? null : cat._id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === cat._id ? 'text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              style={activeCategory === cat._id ? { background: cat.color || '#f97316' } : {}}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto">
          {menuItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-4xl mb-3">🍽️</p>
              <p>No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {menuItems.map((item, i) => {
                const inCart = cart.find(c => c._id === item._id);
                return (
                  <motion.button
                    key={item._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addToCart(item)}
                    className={`relative p-3 rounded-2xl text-left transition-all border ${
                      inCart
                        ? 'bg-orange-500/10 border-orange-500/40'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {/* Veg/Non-veg dot */}
                    <div className={`absolute top-2.5 right-2.5 w-3 h-3 rounded-sm border-2 flex items-center justify-center ${
                      item.isVeg ? 'border-green-500' : 'border-red-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>

                    {/* Bestseller tag */}
                    {item.tags?.includes('bestseller') && (
                      <span className="inline-flex items-center gap-0.5 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full mb-1.5">
                        <HiSparkles size={10} /> Best
                      </span>
                    )}

                    <p className="font-semibold text-white text-sm leading-tight pr-5">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.category?.name}</p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-orange-400 font-bold text-sm">
                        ₹{item.discountedPrice || item.price}
                      </span>
                      {inCart && (
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                          {inCart.qty}
                        </span>
                      )}
                    </div>

                    {item.prepTime && (
                      <p className="text-xs text-slate-500 mt-1">~{item.prepTime} min</p>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart Panel ── */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 xl:w-96 flex flex-col bg-slate-900 rounded-2xl border border-slate-700 flex-shrink-0"
      >
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-white">
            Cart <span className="text-slate-400 font-normal text-sm">({cart.length} items)</span>
          </h3>
          {cart.length > 0 && (
            <button onClick={clearCart}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors">
              <MdDelete size={14} /> Clear
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 text-slate-500">
                <p className="text-4xl mb-3">🛒</p>
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs text-slate-600 mt-1">Tap items to add</p>
              </motion.div>
            ) : (
              cart.map(item => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-slate-800 rounded-xl p-3 border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-white flex-1 pr-2 leading-tight">
                      {item.name}
                    </p>
                    <button onClick={() => removeItem(item._id)}
                      className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                      <MdDelete size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item._id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors">
                        <MdRemove size={14} />
                      </button>
                      <span className="text-white font-bold text-sm w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item._id, 1)}
                        className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-colors">
                        <MdAdd size={14} />
                      </button>
                    </div>
                    <span className="text-orange-400 font-bold text-sm">
                      ₹{((item.discountedPrice || item.price) * item.qty).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <input
                    className="w-full bg-slate-700/60 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    placeholder="Special instructions..."
                    value={item.specialInstructions}
                    onChange={e => setCart(prev => prev.map(c =>
                      c._id === item._id ? { ...c, specialInstructions: e.target.value } : c
                    ))}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Pricing & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-700 space-y-3 flex-shrink-0">
            {/* Discount row */}
            <div className="flex gap-2">
              <select
                className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                value={discountType}
                onChange={e => setDiscountType(e.target.value)}
              >
                <option value="flat">₹ Off</option>
                <option value="percentage">% Off</option>
              </select>
              <input
                type="number" min={0}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                placeholder="Discount"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
              />
            </div>

            {/* Price breakdown */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discAmt > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span><span>-₹{discAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>CGST (2.5%)</span><span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST (2.5%)</span><span>₹{sgst.toFixed(2)}</span>
              </div>
              {deliveryCharge > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Delivery</span><span>₹{deliveryCharge}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-white text-base border-t border-slate-700 pt-2">
                <span>Total</span>
                <span className="text-orange-400">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="grid grid-cols-3 gap-1.5">
              {['cash', 'card', 'upi'].map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                    paymentMethod === m ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Place Order Button */}
            <motion.button
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full py-3.5 text-base"
            >
              {isPlacing ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Placing Order...
                </span>
              ) : (
                <><MdSend size={18} /> Place Order · ₹{total.toFixed(2)}</>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
