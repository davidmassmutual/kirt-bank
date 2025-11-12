// src/pages/DepositDetails.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaCopy, FaUpload, FaQrcode } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
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
  const [showSuccess, setShowSuccess] = useState(false);

  const token = localStorage.getItem('token');
  const API = import.meta.env.VITE_API_URL || 'https://kirt-bank.onrender.com';
  const currency = localStorage.getItem('currency') || 'USD';
  const symbol = currency === 'USD' ? '$' : currency;

  // ----- initialise from modal state -----
  useEffect(() => {
    const s = location.state || {};
    setMethod(s.method || '');
    setAmount(s.amount?.toString() || '');
    setAccount(s.account || 'checking');
  }, [location]);

  // ----- copy helper -----
  const handleCopy = txt => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ----- file preview -----
  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result);
    reader.readAsDataURL(f);
  };

  // ----- SUBMIT -----
  const handleSubmit = async e => {
    e.preventDefault();
    if (!method || !amount || parseFloat(amount) < 10) {
      toast.error('Enter at least $10');
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append('amount', amount);
    form.append('method', method);
    form.append('account', account);
    if (file) form.append('receipt', file);

    try {
      // CORRECT ENDPOINT – same one the backend expects
      await axios.post(`${API}/api/transactions/deposit`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ---- INSTANT UI FEEDBACK (2-3 seconds) ----
      setShowSuccess(true);
      toast.success('Deposit submitted! Awaiting approval.');
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  // ----- SUCCESS SCREEN -----
  if (showSuccess) {
    return (
      <div className="success-screen">
        <div className="success-card">
          <FaCheckCircle className="checkmark" />
          <h2>Deposit Submitted</h2>
          <p>
            <strong>{symbol}{amount}</strong> via <strong>{method.replace('-', ' ').toUpperCase()}</strong>
          </p>
          <p>You’ll be notified when it’s approved.</p>
          <button onClick={() => navigate('/dashboard')} className="home-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ----- LOADING SPINNER -----
  if (loading) return <LoadingSpinner />;

  // ----- NO METHOD SELECTED -----
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

  // ----- MAIN FORM -----
  const bankInfo = {
    name: 'Kirt Bank',
    account: '1234-5678-9012-3456',
    routing: '987654321',
    swift: 'KIRTUS33',
  };

  return (
    <div className="deposit-details">
      <h2>Complete Your Deposit</h2>

      {/* SUMMARY */}
      <div className="summary-card">
        <div className="summary-row"><span>Method</span><strong>{method.replace('-', ' ').toUpperCase()}</strong></div>
        <div className="summary-row"><span>Amount</span><strong>{symbol}{amount}</strong></div>
        <div className="summary-row"><span>To</span><strong>{account.toUpperCase()} Account</strong></div>
      </div>

      {/* BANK TRANSFER INFO */}
      {method === 'bank-transfer' && (
        <div className="bank-info-card">
          <h3>Bank Transfer Details</h3>
          <div className="info-grid">
            <div><label>Bank Name</label><p>{bankInfo.name}</p></div>
            <div>
              <label>Account Number</label><p>{bankInfo.account}</p>
              <button onClick={() => handleCopy(bankInfo.account)} className="copy-btn">
                {copied ? <>Copied</> : <>Copy</>}
              </button>
            </div>
            <div><label>Routing Number</label><p>{bankInfo.routing}</p></div>
            <div><label>SWIFT</label><p>{bankInfo.swift}</p></div>
          </div>
        </div>
      )}

      {/* CRYPTO INFO */}
      {method === 'crypto' && (
        <div className="crypto-card">
          <h3>Send USDT (TRC20)</h3>
          <div className="qr-container"><FaQrcode size={100} /></div>
          <p className="address">0xa49a10d8F662A043243A2b66a922e5ebB1e05250</p>
          <button onClick={() => handleCopy('0xa49a10d8F662A043243A2b66a922e5ebB1e05250')} className="copy-btn large">
            {copied ? <>Copied!</> : <>Copy Address</>}
          </button>
          <p className="warning">Only TRC20 network</p>
        </div>
      )}

      {/* RECEIPT UPLOAD */}
      <form onSubmit={handleSubmit} className="upload-form">
        <h3>Upload Proof (Optional)</h3>
        <div className="file-upload">
          <input type="file" id="receipt" accept="image/*,.pdf" onChange={handleFile} />
          <label htmlFor="receipt" className="upload-label"><FaUpload /> Upload Receipt</label>
        </div>
        {filePreview && (
          <div className="preview"><img src={filePreview} alt="preview" /></div>
        )}
        <button type="submit" className="submit-btn">
          Confirm Deposit
        </button>
      </form>

      <div className="security-note"><p>All deposits are encrypted with 256-bit AES</p></div>
    </div>
  );
}

export default DepositDetails;