// frontend/src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkBalance, setBulkBalance] = useState({ checking: '', savings: '', usdt: '' });
  const [adminNotifications, setAdminNotifications] = useState([]);

  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editBalance, setEditBalance] = useState(null);
  const [editTransactions, setEditTransactions] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    type: '', amount: '', method: '', status: 'Posted', date: '',
  });

  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────────────
  // Fetch Users with Search & Pagination
  // ──────────────────────────────────────────────────────────────
  const fetchUsers = async (query = '', pageNum = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/user/search?q=${query}&page=${pageNum}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data.users);
      setTotalPages(res.data.pagination.pages);
      setPage(res.data.pagination.page);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        navigate('/admin');
      } else {
        toast.error(err.response?.data?.message || 'Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Fetch Admin Notifications
  // ──────────────────────────────────────────────────────────────
  const fetchAdminNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdminNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications');
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Initial Load
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!token || !isAdmin) {
      toast.error('Please log in as admin');
      navigate('/admin');
      return;
    }
    fetchUsers();
    fetchAdminNotifications();
  }, [navigate]);

  // ──────────────────────────────────────────────────────────────
  // Search Handler
  // ──────────────────────────────────────────────────────────────
  const handleSearch = () => {
    setPage(1);
    fetchUsers(searchQuery, 1);
  };

  // ──────────────────────────────────────────────────────────────
  // Bulk Action Handler
  // ──────────────────────────────────────────────────────────────
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) {
      toast.error('Select users and action');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = { action: bulkAction, userIds: selectedUsers };

      if (bulkAction === 'updateBalance') {
        const checking = Number(bulkBalance.checking) || 0;
        const savings = Number(bulkBalance.savings) || 0;
        const usdt = Number(bulkBalance.usdt) || 0;
        payload.data = { balance: { checking, savings, usdt } };
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/api/user/bulk`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Bulk action completed');
      setSelectedUsers([]);
      setBulkAction('');
      setBulkBalance({ checking: '', savings: '', usdt: '' });
      fetchUsers(searchQuery, page);
      fetchAdminNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk action failed');
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Password Change
  // ──────────────────────────────────────────────────────────────
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

  // ──────────────────────────────────────────────────────────────
  // Edit Balance Modal
  // ──────────────────────────────────────────────────────────────
  const handleBalanceEdit = (user) => {
    setEditBalance({
      userId: user._id,
      email: user.email,
      savingsBalance: user.balance?.savings || 0,
      checkingBalance: user.balance?.checking || 0,
      usdtBalance: user.balance?.usdt || 0,
    });
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/${editBalance.userId}/balances`,
        {
          savingsBalance: Number(editBalance.savingsBalance),
          checkingBalance: Number(editBalance.checkingBalance),
          usdtBalance: Number(editBalance.usdtBalance),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u =>
        u._id === editBalance.userId
          ? {
              ...u,
              balance: {
                savings: Number(editBalance.savingsBalance),
                checking: Number(editBalance.checkingBalance),
                usdt: Number(editBalance.usdtBalance),
              },
            }
          : u
      ));
      setEditBalance(null);
      toast.success('Balances updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update balances');
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Manage Transactions
  // ──────────────────────────────────────────────────────────────
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
      <h2>Admin Dashboard</h2>

      {/* Admin Notifications */}
      {adminNotifications.length > 0 && (
        <div className="notifications">
          <h4>Notifications</h4>
          {adminNotifications.map((n, i) => (
            <div key={i} className="notif-item">
              {n.message} — {new Date(n.date).toLocaleTimeString()}
            </div>
          ))}
        </div>
      )}

      {/* Password Change */}
      <div className="section">
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

      {/* Search & Bulk Actions */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>Search</button>

        <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
          <option value="">Bulk Action</option>
          <option value="delete">Delete</option>
          <option value="updateBalance">Update Balance</option>
        </select>

        {bulkAction === 'updateBalance' && (
          <div className="bulk-balance">
            <input placeholder="Checking" value={bulkBalance.checking} onChange={e => setBulkBalance({ ...bulkBalance, checking: e.target.value })} />
            <input placeholder="Savings" value={bulkBalance.savings} onChange={e => setBulkBalance({ ...bulkBalance, savings: e.target.value })} />
            <input placeholder="USDT" value={bulkBalance.usdt} onChange={e => setBulkBalance({ ...bulkBalance, usdt: e.target.value })} />
          </div>
        )}

        <button onClick={handleBulkAction} disabled={!bulkAction || selectedUsers.length === 0}>
          Apply ({selectedUsers.length})
        </button>
      </div>

      {/* Users Table */}
      <div className="section">
        <h3>Registered Users</h3>
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        setSelectedUsers(e.target.checked ? users.map(u => u._id) : []);
                      }}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Savings</th>
                  <th>Checking</th>
                  <th>USDT</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const savings = Number(user.balance?.savings) || 0;
                  const checking = Number(user.balance?.checking) || 0;
                  const usdt = Number(user.balance?.usdt) || 0;

                  return (
                    <tr key={user._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={(e) => {
                            setSelectedUsers(prev =>
                              e.target.checked
                                ? [...prev, user._id]
                                : prev.filter(id => id !== user._id)
                            );
                          }}
                        />
                      </td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>${savings.toLocaleString()}</td>
                      <td>${checking.toLocaleString()}</td>
                      <td>${usdt.toLocaleString()}</td>
                      <td className="actions">
                        <button onClick={() => handleBalanceEdit(user)} className="edit">Edit</button>
                        <button onClick={() => handleTransactionEdit(user)} className="view">Tx</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <button onClick={() => fetchUsers(searchQuery, page - 1)} disabled={page === 1}>Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button onClick={() => fetchUsers(searchQuery, page + 1)} disabled={page === totalPages}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Balance Modal */}
      {editBalance && (
        <div className="modal-overlay" onClick={() => setEditBalance(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Balances - {editBalance.email}</h3>
            <form onSubmit={handleBalanceSubmit} className="form-grid">
              <label>Savings <input type="number" value={editBalance.savingsBalance} onChange={e => setEditBalance({ ...editBalance, savingsBalance: e.target.value })} /></label>
              <label>Checking <input type="number" value={editBalance.checkingBalance} onChange={e => setEditBalance({ ...editBalance, checkingBalance: e.target.value })} /></label>
              <label>USDT <input type="number" value={editBalance.usdtBalance} onChange={e => setEditBalance({ ...editBalance, usdtBalance: e.target.value })} /></label>
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
                <input type="text" placeholder="Type" value={newTransaction.type} onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value })} required />
                <input type="number" placeholder="Amount" value={newTransaction.amount} onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })} required />
                <input type="text" placeholder="Method" value={newTransaction.method} onChange={e => setNewTransaction({ ...newTransaction, method: e.target.value })} required />
                <select value={newTransaction.status} onChange={e => setNewTransaction({ ...newTransaction, status: e.target.value })}>
                  <option value="Posted">Posted</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
                <input type="date" value={newTransaction.date} onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })} required />
                <button type="submit">Add</button>
              </form>
            </div>

            <div className="table-container">
              <h4>Transactions</h4>
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
                        <td className={`status ${tx.status.toLowerCase()}`}>{tx.status}</td>
                        <td className="actions">
                          {tx.status === 'Pending' && (
                            <>
                              <button onClick={() => handleTransactionAction(tx._id, 'confirm')} className="confirm">Confirm</button>
                              <button onClick={() => handleTransactionAction(tx._id, 'fail')} className="fail">Fail</button>
                            </>
                          )}
                          <button onClick={() => handleDeleteTransaction(tx._id)} className="delete">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <button className="close-modal" onClick={() => setEditTransactions(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;