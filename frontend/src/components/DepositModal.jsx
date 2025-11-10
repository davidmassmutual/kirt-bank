// src/components/DepositModal.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaCopy, FaCheck, FaQrcode, FaUniversity, FaBitcoin, FaCreditCard, FaMobileAlt, FaArrowRight } from 'react-icons/fa';
import '../styles/DepositModal.css';

const DepositModal = ({ isOpen, onClose }) => {
  const [depositMethod, setDepositMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('checking');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const amountInputRef = useRef(null);
  const navigate = useNavigate();

  const currency = localStorage.getItem('currency') || 'USD';
  const symbol = currency === 'USD' ? '$' : currency;

  // ALL useEffect MOVED TO TOP — NO CONDITIONALS
  useEffect(() => {
    if (isOpen && depositMethod) {
      setTimeout(() => amountInputRef.current?.focus(), 300);
    }
  }, [depositMethod, isOpen]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (depositMethod === 'crypto') {
      handleCopy('0xa49a10d8F662A043243A2b66a922e5ebB1e05250');
    }
  }, [depositMethod]);

  if (!isOpen) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!depositMethod || !amount || parseFloat(amount) < 10) {
      toast.error('Minimum $10');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setSuccess(true);
      setTimeout(() => {
        navigate('/deposit-details', {
          state: { method: depositMethod, amount: parseFloat(amount), account, currency }
        });
        onClose();
        setLoading(false);
        setSuccess(false);
        setAmount('');
        setDepositMethod('');
      }, 1200);
    }, 600);
  };

  const methods = [
    { value: 'bank-transfer', label: 'Bank Transfer', icon: <FaUniversity />, color: '#4361ee' },
    { value: 'crypto', label: 'Crypto USDT', icon: <FaBitcoin />, color: '#f7931a' },
    { value: 'card', label: 'Card', icon: <FaCreditCard />, color: '#2d6a4f' },
    { value: 'mobile', label: 'Mobile Money', icon: <FaMobileAlt />, color: '#7209b7' },
  ];

  const cryptoAddress = '0xa49a10d8F662A043243A2b66a922e5ebB1e05250';

  if (success) {
    return (
      <div className="deposit-modal-overlay">
        <div className="deposit-modal success-mode">
          <div className="success-check"><FaCheck size={60} /></div>
          <h2>Ready!</h2>
          <p>Redirecting...</p>
          <div className="loader-bar"><div className="progress"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="deposit-modal-overlay" onClick={onClose}>
      <div className="deposit-modal glass" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><FaTimes /></button>

        <div className="modal-header">
          <h2>Deposit Funds</h2>
          <p className="subtitle">Fast • Secure • Instant</p>
        </div>

        <form onSubmit={handleSubmit} className="deposit-form">
          <div className="method-grid">
            {methods.map(m => (
              <button
                key={m.value}
                type="button"
                className={`method-btn ${depositMethod === m.value ? 'active' : ''}`}
                onClick={() => setDepositMethod(m.value)}
                style={{ '--method-color': m.color }}
              >
                <span className="method-icon">{m.icon}</span>
                <span className="method-label">{m.label}</span>
              </button>
            ))}
          </div>

          {depositMethod === 'crypto' && (
            <div className="crypto-info glass-card">
              <FaQrcode size={50} className="qr" />
              <p className="network">TRC20 Only</p>
              <p className="address">{cryptoAddress}</p>
              <button type="button" onClick={() => handleCopy(cryptoAddress)} className="copy-btn">
                {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy</>}
              </button>
            </div>
          )}

          <div className="form-group">
            <label>Amount</label>
            <div className="amount-input-wrapper">
              <span className="currency-symbol">{symbol}</span>
              <input
                ref={amountInputRef}
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="10.00"
                min="10"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>To</label>
            <select value={account} onChange={e => setAccount(e.target.value)}>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="usdt">USDT</option>
            </select>
          </div>

          <div className="modal-actions">
            <button 
              type="submit" 
              disabled={loading || !depositMethod || !amount || parseFloat(amount) < 10}
              className="proceed-btn"
            >
              {loading ? 'Processing...' : <>Proceed <FaArrowRight /></>}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;