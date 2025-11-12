import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Investments() {
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    axios.get('/api/investments/plans').then(res => setPlans(res.data));
  }, []);

  const handleInvest = (plan) => {
    navigate('/invest', { state: { plan } });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-4">Investment Plans</h1>
      <p className="text-center text-secondary mb-12 max-w-2xl mx-auto">
        Grow your wealth with guaranteed returns. Choose a plan and start earning up to <strong>28% ROI</strong>.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map(plan => (
          <div key={plan.name} className="bg-card rounded-2xl p-8 text-center transform hover:scale-105 transition">
            <div className="text-6xl mb-4">{plan.rate * 100}%</div>
            <h3 className="text-2xl font-bold mb-2">{plan.name} Plan</h3>
            <p className="text-secondary mb-4">{plan.term}</p>
            <p className="text-sm mb-6">From ${plan.min} to ${plan.max}</p>
            <button onClick={() => handleInvest(plan)} className="btn-primary w-full">
              Invest Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}