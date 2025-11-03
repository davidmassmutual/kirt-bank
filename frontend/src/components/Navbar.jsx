import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaWallet, FaExchangeAlt, FaCreditCard, FaHistory, FaBell, FaHandHoldingUsd, FaHeadset, FaCog, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import '../styles/Navbar.css';
import img9 from '../images/WhatsApp Image 2025-10-17 at 16.15.27.jpeg';

function Navbar({ handleLogout, isAuthenticated }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) return null;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { path: '/account-summary', label: 'Account Summary', icon: <FaWallet /> },
    { path: '/deposit-details', label: 'Deposit', icon: <FaExchangeAlt /> },
    { path: '/cards', label: 'Cards', icon: <FaCreditCard /> },
    { path: '/transactions', label: 'Transactions', icon: <FaHistory /> },
    { path: '/notifications', label: 'Notifications', icon: <FaBell /> },
    { path: '/loans', label: 'Loan', icon: <FaHandHoldingUsd /> },
    { path: '/support', label: 'Support', icon: <FaHeadset /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> },
  ];

  return (
    <>
      <button className="hamburger" onClick={toggleMenu}>
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>
      <nav className={`navbar ${isMenuOpen ? 'active' : ''}`}>
        <div className="navbar-brand">
          <h1>Kirt Bank <img src={img9} alt="" className='navbar-brand-image' /></h1>
          <p>Strength. Security. Stability.</p>
          <button className="close-menu" onClick={toggleMenu}>
            <FaTimes />
          </button>
        </div>
        <ul className="navbar-menu">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon} {item.label}
              </Link>
            </li>
          ))}
          <li>
            <button onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
              <FaSignOutAlt /> Logout
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Navbar;