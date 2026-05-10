import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from './authStore';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    socketRef.current = io('/', { withCredentials: true, transports: ['websocket', 'polling'] });

    const socket = socketRef.current;

    socket.on('connect', () => {
      socket.emit('join', {
        userId: user._id,
        role: user.role === 'admin' ? 'kitchen' : user.role,
        restaurantId: user.restaurant?._id
      });
    });

    // Global notifications
    socket.on('kot_received', (data) => {
      if (user.role === 'kitchen' || user.role === 'admin') {
        toast(`🔔 New KoT: ${data.kot?.kotNumber}`, {
          icon: '🍳', duration: 5000,
          style: { borderLeft: '4px solid #FF6B35' }
        });
      }
    });

    socket.on('kot_ready', (data) => {
      toast.success(`✅ KoT Ready! Table ${data.table}`, { duration: 6000 });
    });

    socket.on('waiter_called', (data) => {
      if (user.role === 'waiter' || user.role === 'admin') {
        toast(`🔔 Table ${data.tableNumber} needs attention!`, {
          icon: '🙋', duration: 8000,
          style: { borderLeft: '4px solid #f59e0b' }
        });
      }
    });

    socket.on('low_stock_alert', (data) => {
      if (['admin', 'manager'].includes(user.role)) {
        toast(`⚠️ Low stock: ${data.item} (${data.currentStock} ${data.unit} left)`, {
          icon: '📦', duration: 6000,
          style: { borderLeft: '4px solid #ef4444' }
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;