// src/components/DepositModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCopy, FaCheck, FaQrcode, FaTimes } from 'react-icons/fa';
import '../styles/DepositModal.css';

const DepositModal = ({ isOpen, onClose }) => {
  const [depositMethod, setDepositMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('checking');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const currency = localStorage.getItem('currency') || 'USD';

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!isOpen) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!depositMethod || !amount || amount <= 0) return;

    navigate('/deposit-details', {
      state: { method: depositMethod, amount, account, currency }
    });
    onClose();
  };

  const methods = [
    { value: 'bank-transfer', emoji: 'Bank' },
    { value: 'crypto', emoji: 'Crypto' },
    { value: 'card', emoji: 'Credit Card' },
    { value: 'mobile', emoji: 'Mobile' },
  ];

  return (
    <div className="deposit-modal-overlay" onClick={onClose}>
      <div className="deposit-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <h2>Deposit</h2>
        <p className="subtitle">Choose method</p>

        <form onSubmit={handleSubmit} className="deposit-form">
          <div className="method-grid">
            {methods.map(m => (
              <button
                key={m.value}
                type="button"
                className={`method-btn ${depositMethod === m.value ? 'active' : ''}`}
                onClick={() => setDepositMethod(m.value)}
              >
                <span className="method-emoji">{m.emoji}</span>
              </button>
            ))}
          </div>

          {depositMethod === 'crypto' && (
            <div className="crypto-info">
              <FaQrcode size={60} />
              <p className="address">0xa49a10d8F662A043243A2b66a922e5ebB1e05250</p>
              <button type="button" onClick={() => handleCopy('0xa49a10d8F662A043243A2b66a922e5ebB1e05250')} className="copy-btn">
                {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy</>}
              </button>
            </div>
          )}

          <div className="form-group">
            <label>Amount ({currency})</label>
            <div className="amount-input">
              <span className="currency">{currency === 'USD' ? '$' : currency}</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
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
            <button type="submit" className="proceed-btn">Proceed</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;