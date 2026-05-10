import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import useAuthStore from './context/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import OrdersPage from './pages/OrdersPage';
import TablesPage from './pages/TablesPage';
import KitchenPage from './pages/KitchenPage';
import ReservationsPage from './pages/ReservationsPage';
import DeliveryPage from './pages/DeliveryPage';
import InventoryPage from './pages/InventoryPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import StaffPage from './pages/StaffPage';
import CashRegisterPage from './pages/CashRegisterPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/common/Layout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const { isAuthenticated } = useAuthStore();
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/login"    element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard"     element={<DashboardPage />} />
            <Route path="pos"           element={<POSPage />} />
            <Route path="orders"        element={<OrdersPage />} />
            <Route path="tables"        element={<TablesPage />} />
            <Route path="kitchen"       element={<KitchenPage />} />
            <Route path="reservations"  element={<ReservationsPage />} />
            <Route path="delivery"      element={<DeliveryPage />} />
            <Route path="inventory"     element={<InventoryPage />} />
            <Route path="expenses"      element={<ExpensesPage />} />
            <Route path="reports"       element={<ReportsPage />} />
            <Route path="staff"         element={<StaffPage />} />
            <Route path="cash-register" element={<CashRegisterPage />} />
            <Route path="settings"      element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}
