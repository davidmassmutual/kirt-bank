import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/DepositDetails.css';

function DepositDetails() {
  const { state } = useLocation(); // Get selected option and amount from DepositOptions
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload a payment receipt');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('amount', state?.amount || '');
      formData.append('method', state?.option?.method || '');

      await axios.post(`${import.meta.env.VITE_API_URL}/api/transactions`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Deposit submitted successfully');
      navigate('/transactions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit deposit');
    }
  };

  if (!state?.option) {
    return <div className="error">No deposit option selected</div>;
  }

  return (
    <div className="deposit-details">
      <h2>Deposit Details</h2>
      <div className="details-card">
        <h3>{state.option.method}</h3>
        <p><strong>Amount:</strong> ${state.amount}</p>
        <p><strong>Account Number:</strong> {state.option.accountNumber}</p>
        <p><strong>Bank Name:</strong> {state.option.bankName}</p>
        <p><strong>Routing Number:</strong> {state.option.routingNumber}</p>
        <button
          onClick={() => navigator.clipboard.writeText(state.option.accountNumber)}
          className="copy-button"
        >
          Copy Account Number
        </button>
      </div>
      <form onSubmit={handleSubmit} className="upload-form">
        <h3>Upload Payment Receipt</h3>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          required
        />
        <button type="submit">Submit Deposit</button>
      </form>
    </div>
  );
}

export default DepositDetails;