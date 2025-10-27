// frontend/src/pages/DepositDetails.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/DepositDetails.css';

function DepositDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('checking');
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setMethod(params.get('method') || '');
    setAmount(params.get('amount') || '');
    setAccount(params.get('account') || 'checking');

    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransactions(res.data.filter(tx => tx.type === 'deposit').slice(0, 5));
      } catch (err) {
        setError('Failed to load transaction history.');
      }
    };
    fetchTransactions();
  }, [location]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!method) {
      setError('Please select a deposit method.');
      toast.error('Please select a deposit method.');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      toast.error('Please enter a valid amount.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('method', method);
      formData.append('account', account);
      if (file) formData.append('receipt', file);

      await axios.post(`${import.meta.env.VITE_API_URL}/api/transactions/deposit`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Deposit submitted successfully');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit deposit';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="deposit-details">
      <h2>Make a Deposit</h2>
      {error && <div className="error">{error}</div>}
      <div className="details-card">
        <h3>Deposit Details</h3>
        <p><strong>Method:</strong> {method || 'Not selected'}</p>
        <p><strong>Bank Name:</strong> Kirt Bank</p>
        <p><strong>Account Number:</strong> 1234-5678-9012-3456</p>
        <p><strong>Routing Number:</strong> 987654321</p>
        <button
          onClick={() => navigator.clipboard.writeText('1234-5678-9012-3456')}
          className="copy-button"
        >
          Copy Account Number
        </button>
      </div>
      <form onSubmit={handleSubmit} className="upload-form">
        <h3>Deposit Form</h3>
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
        <label>
          Payment Receipt (Optional)
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
        </label>
        <button type="submit">Confirm Deposit</button>
      </form>
      <div className="details-card">
        <h3>Recent Deposits</h3>
        {transactions.length > 0 ? (
          transactions.map((tx, index) => (
            <p key={index}>
              {tx.method}: ${tx.amount.toFixed(2)} to {tx.account} on {new Date(tx.date).toLocaleDateString()}
            </p>
          ))
        ) : (
          <p>No recent deposits.</p>
        )}
        <p className="security-note">🔒 All transactions are secured with 256-bit AES encryption.</p>
      </div>
    </div>
  );
}

export default DepositDetails;