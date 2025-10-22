// src/pages/Activity.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Transactions from '../components/Transactions';
import Footer from '../components/Footer';

function Activity() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransactions(res.data.transactions);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch transactions');
        setLoading(false);
        toast.error(err.message || 'Failed to fetch transactions');
      }
    };
    fetchTransactions();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <Transactions transactions={transactions} />
    </div>
  );
}

export default Activity;