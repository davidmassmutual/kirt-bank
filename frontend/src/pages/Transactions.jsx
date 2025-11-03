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

  const fetch = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/');
      else toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.description?.toLowerCase().includes(search.toLowerCase()) ||
                           tx.type.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || tx.status.toLowerCase() === filter;
      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, filter]);

  const getIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'deposit': return <FaArrowDown className="icon deposit" />;
      case 'withdrawal': return <FaArrowUp className="icon withdraw" />;
      case 'transfer': return <FaUniversity className="icon transfer" />;
      case 'payment': return <FaShoppingCart className="icon payment" />;
      default: return <FaMoneyBillWave className="icon default" />;
    }
  };

  const formatAmount = (amount, type) => {
    const sign = type === 'deposit' ? '+' : '-';
    const color = type === 'deposit' ? 'var(--success)' : 'var(--error)';
    return <span style={{ color, fontWeight: 600 }}>{sign}${Math.abs(amount).toLocaleString()}</span>;
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="transactions-page">
      <header className="page-header">
        <h1>Transactions</h1>
        <div className="header-actions">
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="filter-select">
            <option value="all">All</option>
            <option value="posted">Posted</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <CSVLink data={filtered} filename="transactions.csv" className="export-btn csv">
            <FaFileCsv /> CSV
          </CSVLink>
          <PDFDownloadLink document={<TransactionPDF transactions={filtered} />} fileName="transactions.pdf">
            <button className="export-btn pdf"><FaFilePdf /> PDF</button>
          </PDFDownloadLink>
        </div>
      </header>

      <div className="transactions-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <FaCreditCard className="empty-icon" />
            <p>No transactions found</p>
          </div>
        ) : (
          filtered.map(tx => (
            <div key={tx._id} className="transaction-card">
              <div className="transaction-icon">
                {getIcon(tx.type)}
              </div>
              <div className="transaction-details">
                <h3>{tx.description || tx.type}</h3>
                <p>{new Date(tx.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="transaction-amount">
                {formatAmount(tx.amount, tx.type)}
              </div>
              <div className={`status-badge ${tx.status.toLowerCase()}`}>
                {tx.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Transactions;