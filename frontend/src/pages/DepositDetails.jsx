// src/pages/DepositDetails.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaCopy, FaUpload, FaQrcode } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner'; // NEW
import '../styles/DepositDetails.css';

function DepositDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('checking');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const state = location.state || {};
    setMethod(state.method || '');
    setAmount(state.amount || '');
    setAccount(state.account || 'checking');
  }, [location]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('method', method);
      formData.append('account', account);
      if (file) formData.append('receipt', file);

      await axios.post(`${import.meta.env.VITE_API_URL}/api/transactions/deposit`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      // INSTANT SUCCESS
      setSuccess(true);
      toast.success('Deposit submitted!');
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (success) {
    return (
      <div className="success-screen">
        <div className="success-card">
          <FaCheckCircle className="checkmark" />
          <h2>Success!</h2>
          <p>${amount} via {method} submitted.</p>
          <button onClick={() => navigate('/dashboard')} className="home-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!method) {
    return (
      <div className="deposit-details">
        <div className="error-card">
          <p>Please select a deposit method first.</p>
          <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
        </div>
      </div>
    );
  }

  const bankInfo = {
    name: 'Kirt Bank',
    account: '1234-5678-9012-3456',
    routing: '987654321',
    swift: 'KIRTUS33',
  };

  return (
    <div className="deposit-details">
      <h2>Complete Your Deposit</h2>

      <div className="summary-card">
        <div className="summary-row">
          <span>Method</span>
          <strong>{method.replace('-', ' ').toUpperCase()}</strong>
        </div>
        <div className="summary-row">
          <span>Amount</span>
          <strong>{currency === 'USD' ? '$' : currency}{amount}</strong>
        </div>
        <div className="summary-row">
          <span>To</span>
          <strong>{account.toUpperCase()} Account</strong>
        </div>
      </div>

      {method === 'bank-transfer' && (
        <div className="bank-info-card">
          <h3>Bank Transfer Details</h3>
          <div className="info-grid">
            <div>
              <label>Bank Name</label>
              <p>{bankInfo.name}</p>
            </div>
            <div>
              <label>Account Number</label>
              <p>{bankInfo.account}</p>
              <button onClick={() => handleCopy(bankInfo.account)} className="copy-btn">
                {copied ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
              </button>
            </div>
            <div>
              <label>Routing Number</label>
              <p>{bankInfo.routing}</p>
            </div>
            <div>
              <label>SWIFT</label>
              <p>{bankInfo.swift}</p>
            </div>
          </div>
        </div>
      )}

      {method === 'crypto' && (
        <div className="crypto-card">
          <h3>Send USDT (TRC20)</h3>
          <div className="qr-container">
            <FaQrcode size={100} />
          </div>
          <p className="address">0xa49a10d8F662A043243A2b66a922e5ebB1e05250</p>
          <button onClick={() => handleCopy('0xa49a10d8F662A043243A2b66a922e5ebB1e05250')} className="copy-btn large">
            {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy Address</>}
          </button>
          <p className="warning">Only send USDT on TRC20 network</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        <h3>Upload Proof (Optional)</h3>
        <div className="file-upload">
          <input type="file" id="receipt" accept="image/*,.pdf" onChange={handleFileChange} />
          <label htmlFor="receipt" className="upload-label">
            <FaUpload /> Upload Receipt
          </label>
        </div>
        {filePreview && (
          <div className="preview">
            <img src={filePreview} alt="Preview" />
          </div>
        )}
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Submitting...' : 'Confirm Deposit'}
        </button>
      </form>

      <div className="security-note">
        <p>All deposits are encrypted with 256-bit AES</p>
      </div>
    </div>
  );
}

export default DepositDetails;