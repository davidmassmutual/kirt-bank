import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';
import img9 from '../images/WhatsApp Image 2025-10-17 at 16.15.27.jpeg';

function Navbar({ handleLogout, isAuthenticated }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) return null;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-home' },
    { path: '/account-summary', label: 'Account Summary', icon: 'fas fa-wallet' },
    { path: '/deposit-details', label: 'Deposit', icon: 'fas fa-exchange-alt' },
    { path: '/cards', label: 'Cards', icon: 'fas fa-credit-card' },
    { path: '/transactions', label: 'Transactions', icon: 'fas fa-history' },
    { path: '/notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { path: '/loans', label: 'Loan', icon: 'fas fa-hand-holding-usd' },
    { path: '/support', label: 'Support', icon: 'fas fa-headset' },
    { path: '/settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  return (
    <>
      <button className="hamburger" onClick={toggleMenu}>
        <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>
      <nav className={`navbar ${isMenuOpen ? 'active' : ''}`}>
        <div className="navbar-brand">
          <h1>Kirt Bank <img src={img9} alt="" className='navbar-brand-image' /></h1>
          <p>Strength. Security. Stability.</p>
          <button className="close-menu" onClick={toggleMenu}>
            <i className="fas fa-times"></i>
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
                <i className={item.icon}></i> {item.label}
              </Link>
            </li>
          ))}
          <li>
            {/* <DarkModeToggle/> */}
            <button onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
export default Navbar;
