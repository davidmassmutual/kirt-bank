import Footer from '../components/Footer';
import '../styles/VirtualCards.css';

function VirtualCards() {
  return (
    <div className="virtual-cards">
      <h2><i className="fas fa-credit-card"></i> Virtual Cards</h2>
      <p>Create and manage your virtual cards here.</p>
      <button><i className="fas fa-plus"></i> Create New Card</button>
    </div>
  );
}

export default VirtualCards;