// frontend/src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editBalance, setEditBalance] = useState(null);
  const [editTransactions, setEditTransactions] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    type: '', amount: '', method: '', status: 'Posted', date: '',
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
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error('Access denied');
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

  // Password Change
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
      toast.success('Password updated');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Edit Balances
  const handleBalanceEdit = (user) => {
    setEditBalance({
      userId: user._id,
      email: user.email,
      savingsBalance: user.savingsBalance || 0,
      checkingBalance: user.checkingBalance || 0,
      usdtBalance: user.usdtBalance || 0,
    });
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
      toast.success('Balances updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update balances');
    }
  };

  // Manage Transactions
  const handleTransactionEdit = async (user) => {
    setEditTransactions(user._id);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load transactions');
    }
  };

  const handleTransactionAction = async (txId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/transactions/admin/confirm/${txId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Transaction ${action}ed`);
      // Refresh transactions
      const userId = editTransactions;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
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
      toast.success('Transaction added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add transaction');
    }
  };

  const handleDeleteTransaction = async (txId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/transactions/${txId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(transactions.filter(tx => tx._id !== txId));
      toast.success('Transaction deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Kirt Bank Admin Dashboard</h2>

      {/* Password Section */}
      <div className="section password-section">
        <h3>Change Admin Password</h3>
        <form onSubmit={handlePasswordSubmit} className="form-grid">
          <input
            type="password"
            placeholder="New Password"
            value={passwordForm.newPassword}
            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={passwordForm.confirmPassword}
            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
            minLength={6}
          />
          <button type="submit" disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="section users-section">
        <h3>Registered Users</h3>
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <div className="table-container">
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
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>${(user.savingsBalance || 0).toLocaleString()}</td>
                    <td>${(user.checkingBalance || 0).toLocaleString()}</td>
                    <td>${(user.usdtBalance || 0).toLocaleString()}</td>
                    <td className="actions">
                      <button onClick={() => handleBalanceEdit(user)} className="edit">
                        Edit Balance
                      </button>
                      <button onClick={() => handleTransactionEdit(user)} className="view">
                        View Transactions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Balance Modal */}
      {editBalance && (
        <div className="modal-overlay" onClick={() => setEditBalance(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Balances - {editBalance.email}</h3>
            <form onSubmit={handleBalanceSubmit} className="form-grid">
              <label>
                Savings
                <input
                  type="number"
                  value={editBalance.savingsBalance}
                  onChange={e => setEditBalance({ ...editBalance, savingsBalance: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </label>
              <label>
                Checking
                <input
                  type="number"
                  value={editBalance.checkingBalance}
                  onChange={e => setEditBalance({ ...editBalance, checkingBalance: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </label>
              <label>
                USDT
                <input
                  type="number"
                  value={editBalance.usdtBalance}
                  onChange={e => setEditBalance({ ...editBalance, usdtBalance: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </label>
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditBalance(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {editTransactions && (
        <div className="modal-overlay" onClick={() => setEditTransactions(null)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <h3>Transactions - {users.find(u => u._id === editTransactions)?.email}</h3>

            <div className="add-transaction">
              <h4>Add New Transaction</h4>
              <form onSubmit={handleNewTransactionSubmit} className="form-grid">
                <input
                  type="text"
                  placeholder="Type (e.g., deposit)"
                  value={newTransaction.type}
                  onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={newTransaction.amount}
                  onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
                <input
                  type="text"
                  placeholder="Method"
                  value={newTransaction.method}
                  onChange={e => setNewTransaction({ ...newTransaction, method: e.target.value })}
                  required
                />
                <select
                  value={newTransaction.status}
                  onChange={e => setNewTransaction({ ...newTransaction, status: e.target.value })}
                >
                  <option value="Posted">Posted</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  required
                />
                <button type="submit">Add</button>
              </form>
            </div>

            <div className="table-container">
              <h4>Existing Transactions</h4>
              {transactions.length === 0 ? (
                <p>No transactions.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx._id}>
                        <td>{new Date(tx.date).toLocaleDateString()}</td>
                        <td>{tx.type}</td>
                        <td>${tx.amount.toLocaleString()}</td>
                        <td className={`status ${tx.status.toLowerCase()}`}>
                          {tx.status}
                        </td>
                        <td className="actions">
                          {tx.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleTransactionAction(tx._id, 'confirm')}
                                className="confirm"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleTransactionAction(tx._id, 'fail')}
                                className="fail"
                              >
                                Fail
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteTransaction(tx._id)}
                            className="delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <button className="close-modal" onClick={() => setEditTransactions(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;