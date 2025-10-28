// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';
import img9 from '../images/WhatsApp Image 2025-10-17 at 16.15.27.jpeg';
import DepositModal from './DepositModal';   // <-- NEW
import axios from 'axios';
import { toast } from 'react-toastify';

function Navbar({ handleLogout, isAuthenticated }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);   // <-- NEW
  const location = useLocation();

  if (!isAuthenticated) return null;

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // ---------- Deposit handling ----------
  const openDeposit = (e) => {
    e.preventDefault();               // stop navigation
    setShowDepositModal(true);
    setIsMenuOpen(false);             // close hamburger on mobile
  };

  const closeDeposit = () => setShowDepositModal(false);

  const performDeposit = async (amount) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/transactions/deposit`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`$${amount} deposited successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deposit failed');
    }
  };
  // ------------------------------------

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-home' },
    { path: '/account-summary', label: 'Account Summary', icon: 'fas fa-wallet' },
    // Deposit is now a button, not a Link
    { path: '/loans', label: 'Loan', icon: 'fas fa-hand-holding-usd' },
    { path: '/cards', label: 'Cards', icon: 'fas fa-credit-card' },
    { path: '/transactions', label: 'Transactions', icon: 'fas fa-history' },
    { path: '/notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { path: '/support', label: 'Support', icon: 'fas fa-headset' },
    { path: '/settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  return (
    <>
      {/* Hamburger */}
      <button className="hamburger" onClick={toggleMenu}>
        <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      {/* Navigation */}
      <nav className={`navbar ${isMenuOpen ? 'active' : ''}`}>
        <div className="navbar-brand">
          <h1>
            Kirt Bank <img src={img9} alt="" className="navbar-brand-image" />
          </h1>
          <p>Strength. Security. Stability.</p>
          <button className="close-menu" onClick={toggleMenu}>
            X
          </button>
        </div>

        <ul className="navbar-menu">
          {/* Regular links */}
          {navItems.map((item) => {
            if (item.label === 'Deposit') {
              return (
                <li key={item.path}>
                  <button
                    className={`deposit-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={openDeposit}
                  >
                    <i className={item.icon}></i> {item.label}
                  </button>
                </li>
              );
            }
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className={item.icon}></i> {item.label}
                </Link>
              </li>
            );
          })}

          {/* Logout */}
          <li>
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={closeDeposit}
        onDeposit={performDeposit}
      />
    </>
  );
}

export default Navbar;