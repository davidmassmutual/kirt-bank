// src/App.jsx
import { useState, useEffect, Suspense, lazy } from 'react';
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
import AdminLogin from './pages/AdminLogin';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/App.css';
import NotFound from './pages/NotFound';
import LoadingSkeleton from './components/LoadingSkeleton';
import { DepositProvider } from './context/DepositContext';
import Profile from './pages/Profile';
import Investment from './pages/Investment';

// Lazy load heavy admin page
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

let idleTimer;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetIdleTimer = () => {
    setLastActivity(Date.now());
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      handleLogout();
    }, 15 * 60 * 1000); // 15 minutes
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    setIsAuthenticated(false);
    setIsAdmin(false);
    clearTimeout(idleTimer);
    window.location.href = '/';
  };

  // Validate token on load
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
          handleLogout();
        }
      }
    };
    validateToken();
  }, []);

  // Idle timeout
  useEffect(() => {
    if (isAuthenticated) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => window.addEventListener(event, resetIdleTimer));
      resetIdleTimer();
      return () => {
        events.forEach(event => window.removeEventListener(event, resetIdleTimer));
        clearTimeout(idleTimer);
      };
    }
  }, [isAuthenticated]);

  // Determine if Navbar should be shown
  const showNavbar = () => {
    const path = window.location.pathname;
    return isAuthenticated && path !== '/' && !path.startsWith('/admin');
  };

  return (
    <Router>
      <DepositProvider>
      <ErrorBoundary>
        <div className="app" onMouseMove={resetIdleTimer} onKeyDown={resetIdleTimer}>
          <ScrollToTop />
          
          {/* CONDITIONAL NAVBAR */}
          {showNavbar() && <Navbar handleLogout={handleLogout} isAuthenticated={isAuthenticated} isAdmin={isAdmin} />}

          <div className="main-content">
            <Routes>
              {/* PUBLIC */}
              <Route path="/" element={<Home setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/admin" element={<AdminLogin setIsAuthenticated={setIsAuthenticated} setIsAdmin={setIsAdmin} />} />

              {/* PROTECTED USER PAGES */}
              <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
              <Route path="/account-summary" element={isAuthenticated ? <AccountSummary /> : <Navigate to="/" />} />
              <Route path="/transfer" element={isAuthenticated ? <TransferPayment /> : <Navigate to="/" />} />
              <Route path="/cards" element={isAuthenticated ? <VirtualCards /> : <Navigate to="/" />} />
              <Route path="/transactions" element={isAuthenticated ? <Transactions /> : <Navigate to="/" />} />
              <Route path="/notifications" element={isAuthenticated ? <NotificationsPage /> : <Navigate to="/" />} />
              <Route path="/loans" element={isAuthenticated ? <Loans /> : <Navigate to="/" />} />
              <Route path="/support" element={isAuthenticated ? <Support /> : <Navigate to="/" />} />
              <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/" />} />
              <Route path="/deposit-details" element={isAuthenticated ? <DepositDetails /> : <Navigate to="/" />} />
              <Route path="/investment" element={isAuthenticated ? <Investment/> : <Navigate to="/" />} />
              <Route path="/profile" element={isAuthenticated ? < Profile/> : <Navigate to="/" />} />

              {/* ADMIN DASHBOARD */}
              <Route
                path="/admin/dashboard"
                element={
                  isAuthenticated && isAdmin ? (
                    <Suspense fallback={<LoadingSkeleton />}>
                      <AdminDashboard />
                    </Suspense>
                  ) : (
                    <Navigate to="/admin" />
                  )
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>

          {/* FOOTER */}
          <Footer />

          {/* TOAST */}
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </ErrorBoundary>
      </DepositProvider>
    </Router>
  );
}

export default App;