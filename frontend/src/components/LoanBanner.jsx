import '../styles/LoanBanner.css';

function LoanBanner() {
  return (
    <div className="loan-banner">
      <h2><i className="fas fa-hand-holding-usd"></i> You’re pre-approved for $15,000!</h2>
      <button><i className="fas fa-arrow-right"></i> Apply Now</button>
    </div>
  );
}

export default LoanBanner;