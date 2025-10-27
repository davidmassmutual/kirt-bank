// frontend/src/pages/VirtualCards.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../styles/VirtualCards.css';

function VirtualCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to view virtual cards');
          navigate('/login');
          return;
        }
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/virtual-cards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCards(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch cards error:', err.response?.status, err.response?.data);
        if (err.response?.status === 401) {
          toast.error('Session expired, please log in again');
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          toast.error(err.response?.data?.message || 'Failed to load virtual cards');
        }
        setLoading(false);
      }
    };
    fetchCards();
  }, [navigate]);

  const createCard = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/virtual-cards`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCards([...cards, res.data]);
      toast.success('Virtual card created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create virtual card');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCard = async (cardId) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/virtual-cards/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(cards.filter((card) => card._id !== cardId));
      toast.success('Virtual card deleted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete virtual card');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCardStatus = async (cardId, currentStatus) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'Active' ? 'Frozen' : 'Active';
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/virtual-cards/${cardId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCards(cards.map((card) => (card._id === cardId ? { ...card, status: newStatus } : card)));
      toast.success(`Card ${newStatus.toLowerCase()} successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update card status');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDetails = (cardId) => {
    setShowDetails(showDetails === cardId ? null : cardId);
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
    <div className="virtual-cards">
      <h2><i className="fas fa-credit-card"></i> Virtual Cards</h2>
      <p>Create and manage your virtual cards for secure online transactions.</p>
      <button onClick={createCard} disabled={submitting} className="create-card-button">
        <i className="fas fa-plus"></i> {submitting ? 'Creating...' : 'Create New Card'}
      </button>
      <div className="cards-list">
        {cards.length > 0 ? (
          cards.map((card) => (
            <div key={card._id} className="card-item">
              <div className="card-preview">
                <div className="card-details">
                  <h3>Kirt Bank Virtual Card</h3>
                  <p>Card Number: {showDetails === card._id ? card.cardNumber : `**** **** **** ${card.cardNumber.slice(-4)}`}</p>
                  <p>CVV: {showDetails === card._id ? card.cvv : '***'}</p>
                  <p>Expiry: {card.expiryDate}</p>
                  <p>Status: {card.status}</p>
                </div>
                <div className="card-image">
                  {/* Placeholder image; replace with actual card image */}
                  <div className="card-placeholder" style={{ background: 'linear-gradient(135deg, var(--gold), var(--navy))' }}>
                    <span>Kirt Bank</span>
                  </div>
                </div>
              </div>
              <div className="card-actions">
                <button onClick={() => toggleDetails(card._id)} disabled={submitting}>
                  <i className={`fas ${showDetails === card._id ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  {showDetails === card._id ? 'Hide Details' : 'Show Details'}
                </button>
                <button onClick={() => toggleCardStatus(card._id, card.status)} disabled={submitting}>
                  <i className={`fas ${card.status === 'Active' ? 'fa-lock' : 'fa-unlock'}`}></i>
                  {card.status === 'Active' ? 'Freeze Card' : 'Unfreeze Card'}
                </button>
                <button onClick={() => deleteCard(card._id)} disabled={submitting}>
                  <i className="fas fa-trash"></i> Delete Card
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No virtual cards found. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}

export default VirtualCards;