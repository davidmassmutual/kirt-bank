// src/pages/Transactions.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransactions(res.data);
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
        else toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [navigate]);

  const getStatusColor = (status) => {
    return status === 'Pending' ? 'orange' :
           status === 'Posted' ? 'green' : 'red';
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="transactions">
      <h2>Recent Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx._id}>
                <td>{new Date(tx.date).toLocaleDateString()}</td>
                <td>{tx.type}</td>
                <td>${tx.amount.toLocaleString()}</td>
                <td style={{ color: getStatusColor(tx.status) }}>
                  {tx.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Transactions;