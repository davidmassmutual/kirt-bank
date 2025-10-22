// frontend/src/pages/Transactions.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../styles/Transactions.css';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to view transactions');
          navigate('/login');
          return;
        }
        console.log('Fetching transactions from:', `${import.meta.env.VITE_API_URL}/api/transactions`);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Transactions received:', res.data);
        setTransactions(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err.response?.status, err.response?.data, err.message);
        if (err.response?.status === 401) {
          toast.error('Session expired, please log in again');
          localStorage.removeItem('token');
          navigate('/login');
        } else if (err.response?.status === 404) {
          toast.error('Transactions endpoint not found, please check backend');
        } else {
          toast.error(err.response?.data?.message || 'Failed to load transactions');
        }
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [navigate]);

  return (
    <div className="transactions">
      <h2><i className="fas fa-exchange-alt"></i> Kirt Bank Recent Transactions</h2>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>{tx.type}</td>
                  <td>{tx.method}</td>
                  <td>${tx.amount.toLocaleString()}</td>
                  <td>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Transactions;