// src/pages/Investment.jsx
import { useState } from 'react';
import '../styles/Investment.css';
import { FaChartLine, FaPiggyBank, FaLock, FaArrowRight, FaCheck } from 'react-icons/fa';

function Investment() {
  const [amount, setAmount] = useState('');
  const plans = [
    { name: 'Starter', apy: '8.5%', min: 100, term: '6 months', color: '#4361ee' },
    { name: 'Growth', apy: '12.0%', min: 1000, term: '12 months', color: '#7209b7' },
    { name: 'Premium', apy: '15.5%', min: 5000, term: '24 months', color: '#f7931a' },
  ];

  return (
    <div className="investment-page">
      <header className="inv-header">
        <h1>Grow Your Wealth</h1>
        <p>High-yield investment plans with guaranteed returns</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <FaChartLine />
          <h3>15.5%</h3>
          <p>Max APY</p>
        </div>
        <div className="stat-card">
          <FaPiggyBank />
          <h3>100K+</h3>
          <p>Active Investors</p>
        </div>
        <div className="stat-card">
          <FaLock />
          <h3>FDIC Insured</h3>
          <p>Up to $250K</p>
        </div>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.name} className="plan-card" style={{ '--plan-color': plan.color }}>
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="apy">{plan.apy} <span>APY</span></div>
            </div>
            <div className="plan-details">
              <p><FaCheck /> Min: ${plan.min}</p>
              <p><FaCheck /> Term: {plan.term}</p>
              <p><FaCheck /> Compounded Monthly</p>
            </div>
            <button className="invest-btn">Invest Now <FaArrowRight /></button>
          </div>
        ))}
      </div>

      <div className="calculator">
        <h2>Return Calculator</h2>
        <input type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} />
        <div className="results">
          <div><strong>After 12 months:</strong> ${(parseFloat(amount) * 1.12 || 0).toFixed(2)}</div>
          <div><strong>Profit:</strong> ${(parseFloat(amount) * 0.12 || 0).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

export default Investment;