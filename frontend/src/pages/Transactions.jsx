// src/pages/Transactions.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TransactionPDF from '../components/TransactionPDF';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  FaSearch, FaFilter, FaFileCsv, FaFilePdf, FaArrowDown, FaArrowUp,
  FaUniversity, FaShoppingCart, FaCreditCard, FaMoneyBillWave
} from 'react-icons/fa';
import '../styles/Transactions.css';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const API = import.meta.env.VITE_API_URL || 'https://kirt-bank.onrender.com';

  const fetchTransactions = useCallback(async () => {
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      // FIXED: WAS /api/transactions → NOW /api/transactions (or /user if needed)
      // But your backend returns user tx on /api/transactions
      const res = await axios.get(`${API}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Transaction fetch error:', err);
      toast.error('No transactions found or server error');
      setTransactions([]);
      if (err.response?.status === 401) navigate('/');
    } finally {
      setLoading(false);
    }
  }, [token, navigate, API]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const searchStr = `${tx.description || tx.type || ''} ${tx.method || ''}`.toLowerCase();
      const matchesSearch = searchStr.includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || tx.status?.toLowerCase() === filter;
      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, filter]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="transactions-page">
      <header className="page-header">
        <h1>Transactions</h1>
        <div className="header-actions">
          <div className="search-bar">
            <FaSearch />
            <input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <CSVLink data={filtered} filename="kirt-transactions.csv" className="export-btn csv">
            <FaFileCsv /> CSV
          </CSVLink>
          <PDFDownloadLink document={<TransactionPDF transactions={filtered} />} fileName="kirt-transactions.pdf">
            <button className="export-btn pdf"><FaFilePdf /> PDF</button>
          </PDFDownloadLink>
        </div>
      </header>

      <div className="transactions-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <FaCreditCard className="empty-icon" />
            <p>No transactions yet. Make your first deposit!</p>
          </div>
        ) : (
          filtered.map(tx => (
            <div key={tx._id} className="transaction-card">
              <div className="transaction-icon">
                {tx.type === 'deposit' ? <FaArrowDown className="icon deposit" /> : <FaArrowUp className="icon withdraw" />}
              </div>
              <div className="transaction-details">
                <h3>{tx.description || tx.type?.charAt(0).toUpperCase() + tx.type?.slice(1)}</h3>
                <p>{new Date(tx.date).toLocaleDateString()} • {tx.method || 'N/A'}</p>
              </div>
              <div className="transaction-amount">
                <span style={{ color: tx.type === 'deposit' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                  {tx.type === 'deposit' ? '+' : '-'} ${tx.amount.toLocaleString()}
                </span>
              </div>
              <div className={`status-badge ${tx.status?.toLowerCase()}`}>
                {tx.status || 'Pending'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Transactions;