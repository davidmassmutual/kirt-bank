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
        console.error('Fetch loan data error:', err.response?.status, err.response?.data);
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
    try {
      const token = localStorage.getItem('token');
      const amount = hasSubmittedIdSsn
        ? Math.floor(Math.random() * (15000 - 3000 + 1)) + 3000
        : Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/loans/apply`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLoanOffer(amount);
      toast.success('Loan offer generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate loan offer');
    }
  };

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      if (balance.checking < 200 && balance.savings < 200 && balance.usdt < 200) {
        toast.error('Minimum account balance of $200 required for a loan. Please contact customer care at support@kirtbank.com or 1-800-KIRT-BANK for more information.');
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
      toast.success('Loan application submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Loan application failed. Please try again.');
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
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      setLoanOffer(res.data.amount);
      setHasSubmittedIdSsn(true);
      setShowIdSsnForm(false);
      setIdFile(null);
      setSsn('');
      toast.success('ID and SSN submitted, loan offer updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update loan offer');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="loan-banner">
        <h2><i className="fas fa-hand-holding-usd"></i> Calculate Your Loan Offer</h2>
        <button onClick={handleCalculateOffer} disabled={submitting || loanOffer}>
          <i className="fas fa-calculator"></i> Calculate Now
        </button>
      </div>
      {loanOffer && (
        <>
          {!accepted ? (
            <div className="loan-offer">
              <h3>Your Loan Offer</h3>
              <p>Amount: ${loanOffer.toLocaleString()}</p>
              <p>Term: 36 months</p>
              <p>Interest Rate: 5.99% APR</p>
              <button onClick={handleAccept} disabled={submitting}>
                <i className="fas fa-check"></i> {submitting ? 'Submitting...' : 'Accept Offer'}
              </button>
              {!hasSubmittedIdSsn && (
                <button onClick={() => setShowIdSsnForm(true)} disabled={submitting}>
                  <i className="fas fa-arrow-up"></i> Increase Your Loan Offer
                </button>
              )}
            </div>
          ) : (
            <div className="loan-confirmation">
              <h3>Loan Application Submitted</h3>
              <p>Your application for a ${loanOffer.toLocaleString()} loan has been received. We'll notify you within 1-2 business days.</p>
            </div>
          )}
        </>
      )}
      {showIdSsnForm && !hasSubmittedIdSsn && (
        <div className="id-ssn-form">
          <h3>Submit ID and SSN to Increase Loan Offer</h3>
          <form onSubmit={handleIdSsnSubmit}>
            <label>
              ID Document (JPG, PNG, PDF)
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => setIdFile(e.target.files[0])}
                disabled={submitting}
              />
            </label>
            <label>
              SSN
              <input
                type="text"
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
                placeholder="XXX-XX-XXXX"
                disabled={submitting}
              />
            </label>
            <button type="submit" disabled={submitting}>
              <i className="fas fa-upload"></i> {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button type="button" onClick={() => setShowIdSsnForm(false)} disabled={submitting}>
              <i className="fas fa-times"></i> Cancel
            </button>
          </form>
        </div>
      )}
      <div className="loan-details">
        <h3>Loan Details</h3>
        <p>Repayment Terms: Flexible monthly payments.</p>
        <p>Eligibility: Minimum balance of $200 in any account.</p>
        <p>Contact: Reach out to support@kirtbank.com for assistance.</p>
      </div>
      <div className="repayment-calculator">
        <h3>Repayment Calculator</h3>
        <form>
          <label>
            Loan Amount
            <input type="number" value={loanOffer || 2000} disabled />
          </label>
          <label>
            Term (months)
            <select defaultValue="36">
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="36">36</option>
            </select>
          </label>
          <p>Estimated Monthly Payment: ${((loanOffer || 2000) / 36).toFixed(2)}</p>
        </form>
      </div>
      <div className="faq">
        <h3>Frequently Asked Questions</h3>
        <p><strong>Q:</strong> What are the eligibility criteria?</p>
        <p><strong>A:</strong> You need a minimum balance of $200 and a good credit score.</p>
        <p><strong>Q:</strong> How long does approval take?</p>
        <p><strong>A:</strong> Typically 1-2 business days.</p>
      </div>
    </div>
  );
};

export default Loans;