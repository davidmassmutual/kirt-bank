// frontend/src/components/DepositModal.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DepositModal.css';

const DepositModal = ({ isOpen, onClose }) => {
  const [depositMethod, setDepositMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('checking');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!depositMethod) {
      alert('Please select a deposit method.');
      return;
    }
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    navigate(`/deposit-details?method=${depositMethod}&amount=${amount}&account=${account}`);
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Select Deposit Method</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Deposit Method
            <select
              value={depositMethod}
              onChange={(e) => setDepositMethod(e.target.value)}
              className="deposit-select"
            >
              <option value="">Choose a method</option>
              <option value="bank-transfer">Bank Transfer</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="card">Credit/Debit Card</option>
              <option value="mobile">Mobile Payment</option>
            </select>
          </label>
          <label>
            Amount
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0.01"
              step="0.01"
              required
            />
          </label>
          <label>
            Account
            <select value={account} onChange={(e) => setAccount(e.target.value)}>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="usdt">USDT</option>
            </select>
          </label>
          <div className="modal-buttons">
            <button type="submit">Proceed</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;