import { useState } from 'react';
import axios from 'axios';
import '../styles/CurrencyConverter.css';

function CurrencyConverter() {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState(null);

  const convert = async () => {
    try {
      const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const rate = res.data.rates[toCurrency];
      setResult((amount * rate).toFixed(2));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="currency-converter">
      <h2><i className="fas fa-exchange-alt"></i> Currency Converter</h2>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
      <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="BTC">BTC</option>
      </select>
      <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
        <option value="EUR">EUR</option>
        <option value="USD">USD</option>
        <option value="BTC">BTC</option>
      </select>
      <button onClick={convert}><i className="fas fa-calculator"></i> Convert</button>
      {result && <p>{amount} {fromCurrency} = {result} {toCurrency}</p>}
    </div>
  );
}

export default CurrencyConverter;
