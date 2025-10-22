// frontend/src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editBalance, setEditBalance] = useState(null);
  const [editTransactions, setEditTransactions] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    type: '',
    amount: '',
    method: '',
    status: 'Posted',
    date: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!token || !isAdmin) {
          toast.error('Please log in as admin');
          navigate('/admin');
          return;
        }
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch users error:', err.response?.status, err.response?.data);
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error('Access denied, please log in as admin');
          localStorage.removeItem('token');
          localStorage.removeItem('isAdmin');
          navigate('/admin');
        } else {
          toast.error(err.response?.data?.message || 'Failed to load users');
        }
        setLoading(false);
      }
    };
    fetchUsers();
  }, [navigate]);

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/password`,
        { password: passwordForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Password updated successfully');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Password update error:', err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleBalanceEdit = (user) => {
    setEditBalance({
      userId: user._id,
      email: user.email,
      savingsBalance: user.savingsBalance,
      checkingBalance: user.checkingBalance,
      usdtBalance: user.usdtBalance,
    });
  };

  const handleBalanceChange = (e) => {
    setEditBalance({ ...editBalance, [e.target.name]: Number(e.target.value) });
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/${editBalance.userId}/balances`,
        editBalance,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u => u._id === editBalance.userId ? { ...u, ...editBalance } : u));
      setEditBalance(null);
      toast.success('User balances updated successfully');
    } catch (err) {
      console.error('Balance update error:', err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to update balances');
    }
  };

  const handleTransactionEdit = async (user) => {
    setEditTransactions(user._id);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
    } catch (err) {
      console.error('Fetch transactions error:', err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to load transactions');
    }
  };

  const handleNewTransactionChange = (e) => {
    setNewTransaction({ ...newTransaction, [e.target.name]: e.target.value });
  };

  const handleNewTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/transactions/user/${editTransactions}`,
        { ...newTransaction, amount: Number(newTransaction.amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions([...transactions, res.data]);
      setNewTransaction({ type: '', amount: '', method: '', status: 'Posted', date: '' });
      toast.success('Transaction added successfully');
    } catch (err) {
      console.error('Add transaction error:', err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to add transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(transactions.filter(tx => tx._id !== transactionId));
      toast.success('Transaction deleted successfully');
    } catch (err) {
      console.error('Delete transaction error:', err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  return (
    <div className="admin-dashboard">
      <h2><i className="fas fa-tachometer-alt"></i> Kirt Bank Admin Dashboard</h2>
      <div className="dashboard-container">
        <div className="password-section">
          <h3>Change Password</h3>
          <form className="password-form" onSubmit={handlePasswordSubmit}>
            <label>
              New Password
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </label>
            <button type="submit" disabled={passwordLoading}>
              <i className="fas fa-lock"></i> {passwordLoading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
        <div className="users-section">
          <h3>Registered Users</h3>
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Savings</th>
                    <th>Checking</th>
                    <th>USDT</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>${user.savingsBalance.toLocaleString()}</td>
                      <td>${user.checkingBalance.toLocaleString()}</td>
                      <td>${user.usdtBalance.toLocaleString()}</td>
                      <td>
                        <button onClick={() => handleBalanceEdit(user)}>Edit Balances</button>
                        <button onClick={() => handleTransactionEdit(user)}>Manage Transactions</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Balances Modal */}
      {editBalance && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Balances for {editBalance.email}</h3>
            <form onSubmit={handleBalanceSubmit}>
              <label>
                Savings Balance
                <input
                  type="number"
                  name="savingsBalance"
                  value={editBalance.savingsBalance}
                  onChange={handleBalanceChange}
                  required
                  min="0"
                />
              </label>
              <label>
                Checking Balance
                <input
                  type="number"
                  name="checkingBalance"
                  value={editBalance.checkingBalance}
                  onChange={handleBalanceChange}
                  required
                  min="0"
                />
              </label>
              <label>
                USDT Balance
                <input
                  type="number"
                  name="usdtBalance"
                  value={editBalance.usdtBalance}
                  onChange={handleBalanceChange}
                  required
                  min="0"
                />
              </label>
              <div className="modal-buttons">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditBalance(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Transactions Modal */}
      {editTransactions && (
        <div className="modal">
          <div className="modal-content">
            <h3>Manage Transactions for {users.find(u => u._id === editTransactions)?.email}</h3>
            <h4>Add New Transaction</h4>
            <form onSubmit={handleNewTransactionSubmit}>
              <label>
                Type
                <input
                  type="text"
                  name="type"
                  value={newTransaction.type}
                  onChange={handleNewTransactionChange}
                  required
                />
              </label>
              <label>
                Amount
                <input
                  type="number"
                  name="amount"
                  value={newTransaction.amount}
                  onChange={handleNewTransactionChange}
                  required
                  min="0"
                />
              </label>
              <label>
                Method
                <input
                  type="text"
                  name="method"
                  value={newTransaction.method}
                  onChange={handleNewTransactionChange}
                  required
                />
              </label>
              <label>
                Status
                <select name="status" value={newTransaction.status} onChange={handleNewTransactionChange}>
                  <option value="Posted">Posted</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </label>
              <label>
                Date
                <input
                  type="date"
                  name="date"
                  value={newTransaction.date}
                  onChange={handleNewTransactionChange}
                  required
                />
              </label>
              <div className="modal-buttons">
                <button type="submit">Add Transaction</button>
                <button type="button" onClick={() => setEditTransactions(null)}>Close</button>
              </div>
            </form>
            <h4>Existing Transactions</h4>
            {transactions.length === 0 ? (
              <p>No transactions found.</p>
            ) : (
              <div className="transactions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td>{new Date(tx.date).toLocaleDateString()}</td>
                        <td>{tx.type}</td>
                        <td>{tx.method}</td>
                        <td>${tx.amount.toLocaleString()}</td>
                        <td>{tx.status}</td>
                        <td>
                          <button onClick={() => handleDeleteTransaction(tx._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;