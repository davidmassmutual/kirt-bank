import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { FaEye, FaEyeSlash, FaLock, FaUnlock, FaTrash, FaCreditCard, FaCopy, FaPlus } from 'react-icons/fa';
import '../styles/VirtualCards.css';

function VirtualCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(null);
  const navigate = useNavigate();

  const fetch = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/virtual-cards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired');
        navigate('/login');
      } else toast.error(err.response?.data?.message || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/virtual-cards`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(prev => [...prev, res.data]);
      toast.success('Card created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async id => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/virtual-cards/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(prev => prev.filter(c => c._id !== id));
      toast.success('Card deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, cur) => {
    setSubmitting(true);
    const newStatus = cur === 'Active' ? 'Frozen' : 'Active';
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/virtual-cards/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCards(prev => prev.map(c => (c._id === id ? { ...c, status: newStatus } : c)));
      toast.success(`Card ${newStatus.toLowerCase()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="virtual-cards">
      <h2>
        <FaCreditCard /> Virtual Cards
      </h2>
      <button onClick={create} disabled={submitting} className="create-btn">
        <FaPlus /> {submitting ? 'Creating…' : 'Create New Card'}
      </button>

      <div className="cards-list">
        {cards.length === 0 ? (
          <p>No cards. Create one to start.</p>
        ) : (
          cards.map(c => (
            <div key={c._id} className="card-item">
              <div className="card-preview">
                <div className="visa-card">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="visa-logo" />
                  <div className="card-info">
                    <h3>Kirt Bank</h3>
                    <p className="card-number">
                      {showDetails === c._id ? c.cardNumber : `**** **** **** ${c.cardNumber.slice(-4)}`}
                      {showDetails === c._id && (
                        <button onClick={() => copyToClipboard(c.cardNumber)} className="copy-btn">
                          <FaCopy />
                        </button>
                      )}
                    </p>
                    <div className="card-details">
                      <p>CVV: {showDetails === c._id ? c.cvv : '***'}</p>
                      <p>Expiry: {c.expiryDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button onClick={() => setShowDetails(showDetails === c._id ? null : c._id)} disabled={submitting}>
                  {showDetails === c._id ? <FaEyeSlash /> : <FaEye />} {showDetails === c._id ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => toggleStatus(c._id, c.status)} disabled={submitting}>
                  {c.status === 'Active' ? <FaLock /> : <FaUnlock />} {c.status === 'Active' ? 'Freeze' : 'Unfreeze'}
                </button>
                <button onClick={() => remove(c._id)} disabled={submitting}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default VirtualCards;