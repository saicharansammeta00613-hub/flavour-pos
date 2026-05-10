// Real-time socket handler for KoT, Orders, Table updates, Waiter requests

const socketHandler = (io) => {
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── User joins with role ───────────────────────────────────────────────
    socket.on('join', ({ userId, role, restaurantId }) => {
      connectedUsers.set(socket.id, { userId, role, restaurantId });

      // Join role-based rooms
      socket.join(`restaurant_${restaurantId}`);
      socket.join(`role_${role}`);
      socket.join(`user_${userId}`);

      if (role === 'kitchen') socket.join('kitchen_display');
      if (role === 'waiter')  socket.join('waiters');
      if (role === 'cashier') socket.join('cashiers');
      if (role === 'delivery') socket.join('delivery_team');

      console.log(`👤 User ${userId} (${role}) joined restaurant ${restaurantId}`);
      socket.emit('joined', { message: 'Connected to FLAVOUR POS', socketId: socket.id });
    });

    // ─── New Order Placed ───────────────────────────────────────────────────
    socket.on('new_order', (orderData) => {
      // Notify kitchen immediately
      io.to('kitchen_display').emit('kot_received', {
        ...orderData,
        timestamp: new Date(),
        alert: true
      });
      // Notify cashiers
      io.to('cashiers').emit('order_update', orderData);
      // Notify all in restaurant
      io.to(`restaurant_${orderData.restaurantId}`).emit('dashboard_update', {
        type: 'new_order',
        data: orderData
      });
    });

    // ─── KoT Status Update ─────────────────────────────────────────────────
    socket.on('kot_status_update', (kotData) => {
      // Notify the waiter assigned
      if (kotData.waiterId) {
        io.to(`user_${kotData.waiterId}`).emit('kot_ready', kotData);
      }
      // Notify cashiers
      io.to('cashiers').emit('kot_status_changed', kotData);
      // Notify all staff
      io.to(`restaurant_${kotData.restaurantId}`).emit('dashboard_update', {
        type: 'kot_update',
        data: kotData
      });
    });

    // ─── Waiter Request from Table ──────────────────────────────────────────
    socket.on('waiter_request', (requestData) => {
      // Broadcast to all waiters
      io.to('waiters').emit('waiter_called', {
        ...requestData,
        timestamp: new Date(),
        sound: true
      });
      // Notify cashiers too
      io.to('cashiers').emit('waiter_request_alert', requestData);
    });

    // ─── Table Status Change ────────────────────────────────────────────────
    socket.on('table_status_change', (tableData) => {
      io.to(`restaurant_${tableData.restaurantId}`).emit('table_updated', tableData);
    });

    // ─── Order Status Update ────────────────────────────────────────────────
    socket.on('order_status_update', (orderData) => {
      // Notify customer-facing display if any
      io.to(`restaurant_${orderData.restaurantId}`).emit('order_status_changed', orderData);

      if (orderData.status === 'ready') {
        io.to('waiters').emit('order_ready_for_pickup', orderData);
      }
      if (orderData.status === 'out_for_delivery') {
        io.to('delivery_team').emit('delivery_assigned', orderData);
      }
    });

    // ─── Delivery Update ────────────────────────────────────────────────────
    socket.on('delivery_update', (deliveryData) => {
      io.to('cashiers').emit('delivery_status_updated', deliveryData);
      io.to(`restaurant_${deliveryData.restaurantId}`).emit('dashboard_update', {
        type: 'delivery_update',
        data: deliveryData
      });
    });

    // ─── Cash Register Event ────────────────────────────────────────────────
    socket.on('cash_register_event', (data) => {
      io.to('cashiers').emit('cash_register_updated', data);
    });

    // ─── Inventory Alert ────────────────────────────────────────────────────
    socket.on('inventory_alert', (alertData) => {
      io.to(`restaurant_${alertData.restaurantId}`).emit('low_stock_alert', alertData);
    });

    // ─── Reservation Reminder ───────────────────────────────────────────────
    socket.on('reservation_reminder', (data) => {
      io.to(`restaurant_${data.restaurantId}`).emit('upcoming_reservation', data);
    });

    // ─── Staff Attendance ───────────────────────────────────────────────────
    socket.on('staff_punch', (punchData) => {
      io.to(`restaurant_${punchData.restaurantId}`).emit('attendance_updated', punchData);
    });

    // ─── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        console.log(`🔌 Socket disconnected: ${socket.id} (${user.role})`);
        connectedUsers.delete(socket.id);
      }
    });
  });

  // Export emit helpers for use in controllers
  io.emitToKitchen = (event, data) => io.to('kitchen_display').emit(event, data);
  io.emitToWaiters = (event, data) => io.to('waiters').emit(event, data);
  io.emitToRestaurant = (restaurantId, event, data) =>
    io.to(`restaurant_${restaurantId}`).emit(event, data);
};

module.exports = socketHandler;
