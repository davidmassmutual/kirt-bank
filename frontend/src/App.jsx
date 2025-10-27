// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AccountSummary from './pages/AccountSummary';
import Transactions from './pages/Transactions';
import Loans from './pages/Loans';
import Support from './pages/Support';
import Settings from './pages/Settings';
import TransferPayment from './pages/TransferPayment';
import VirtualCards from './pages/VirtualCards';
import NotificationsPage from './pages/NotificationsPage';
import DepositDetails from './pages/DepositDetails';
import AdminLogin from './pages/AdminLogin'; // Import AdminLogin
import AdminDashboard from './pages/AdminDashboard'; // Import AdminDashboard
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAuthenticated(true);
          const adminStatus = res.data.isAdmin || false;
          setIsAdmin(adminStatus);
          localStorage.setItem('isAdmin', adminStatus.toString());
        } catch (err) {
          console.error('Token validation failed:', err.response?.status, err.response?.data);
          localStorage.removeItem('token');
          localStorage.removeItem('isAdmin');
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      }
    };
    validateToken();
  }, []);

  return (
    <Router>
      <ErrorBoundary>
        <div className="app">
          <ScrollToTop />
          <Navbar handleLogout={handleLogout} isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Home setIsAuthenticated={setIsAuthenticated} />} />
              <Route
                path="/dashboard"
                element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
              />
              <Route
                path="/account-summary"
                element={isAuthenticated ? <AccountSummary /> : <Navigate to="/" />}
              />
              <Route
                path="/transfer"
                element={isAuthenticated ? <TransferPayment /> : <Navigate to="/" />}
              />
              <Route
                path="/cards"
                element={isAuthenticated ? <VirtualCards /> : <Navigate to="/" />}
              />
              <Route
                path="/transactions"
                element={isAuthenticated ? <Transactions /> : <Navigate to="/" />}
              />
              <Route
                path="/notifications"
                element={isAuthenticated ? <NotificationsPage /> : <Navigate to="/" />}
              />
              <Route
                path="/loans"
                element={isAuthenticated ? <Loans/> : <Navigate to="/" />}
              />
              <Route
                path="/support"
                element={isAuthenticated ? <Support /> : <Navigate to="/" />}
              />
              <Route
                path="/settings"
                element={isAuthenticated ? <Settings /> : <Navigate to="/" />}
              />
              <Route
                path="/deposit-details"
                element={isAuthenticated ? <DepositDetails /> : <Navigate to="/" />}
              />
              <Route
                path="/admin"
                element={<AdminLogin setIsAuthenticated={setIsAuthenticated} setIsAdmin={setIsAdmin} />}
              />
              <Route
                path="/admin/dashboard"
                element={isAuthenticated && isAdmin ? <AdminDashboard /> : <Navigate to="/admin" />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          <Footer />
          <ToastContainer />
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;