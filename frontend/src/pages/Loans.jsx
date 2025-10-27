// frontend/src/pages/Loan.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Loans.css';

const Loans = () => {
  const [loanAmount, setLoanAmount] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
        // Generate random loan amount
        const randomAmount = Math.floor(Math.random() * (15000 - 6000 + 1)) + 6000;
        setLoanAmount(randomAmount);
      } catch (err) {
        setError('Failed to load user data.');
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleAccept = async () => {
    if (user.balance.checking < 200 && user.balance.savings < 200 && user.balance.investment < 200) {
      setError('Minimum account balance of $200 required for a loan. Please contact customer care at support@kirtbank.com or 1-800-KIRT-BANK for more information.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/loans/apply`,
        { amount: loanAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccepted(true);
      setError('');
    } catch (err) {
      setError('Loan application failed. Please try again.');
    }
  };

  if (!user || !loanAmount) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-message">Processing your request...</p>
      </div>
    );
  }

  return (
    <div className="loan-page">
      <h2>Pre-Approved Loan Offer</h2>
      {error && <div className="error">{error}</div>}
      {!accepted ? (
        <div className="loan-offer">
          <h3>Your Loan Offer</h3>
          <p>Amount: ${loanAmount.toLocaleString()}</p>
          <p>Term: 36 months</p>
          <p>Interest Rate: 5.99% APR</p>
          <button onClick={handleAccept}>Accept Offer</button>
        </div>
      ) : (
        <div className="loan-confirmation">
          <h3>Loan Application Submitted</h3>
          <p>Your application for a ${loanAmount.toLocaleString()} loan has been received. We'll notify you within 1-2 business days.</p>
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
            <input type="number" defaultValue={loanAmount} disabled />
          </label>
          <label>
            Term (months)
            <select>
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="36">36</option>
            </select>
          </label>
          <p>Estimated Monthly Payment: ${(loanAmount / 36).toFixed(2)}</p>
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