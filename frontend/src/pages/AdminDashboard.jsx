// src/pages/AdminDashboard.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CSVLink } from 'react-csv';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  FaSearch, FaEdit, FaTrash, FaEye, FaFileCsv, FaCheck, FaTimes,
  FaDollarSign, FaHistory, FaPlus, FaBell
} from 'react-icons/fa';
import '../styles/AdminDashboard.css';

// Sound file
const depositSound = new Audio('/sounds/deposit.mp3');

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkBalance, setBulkBalance] = useState({ checking: '', savings: '', usdt: '' });
  const [adminNotifs, setAdminNotifs] = useState([]);
  const [editBal, setEditBal] = useState(null);
  const [editTxUser, setEditTxUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newTx, setNewTx] = useState({ type: '', amount: '', method: '', status: 'Posted', date: '' });
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const pollRef = useRef(null);
  const prevCount = useRef(0);

  // ───── FETCH USERS ─────
  const fetchUsers = useCallback(async (q = '', p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/user/search?q=${q}&page=${p}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data.users.map(u => ({ ...u, selected: false })));
      setTotalPages(res.data.pagination.pages);
      setPage(res.data.pagination.page);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Session expired');
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        navigate('/admin');
      } else toast.error(err.response?.data?.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  // ───── FETCH NOTIFICATIONS ─────
  const fetchNotifs = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdminNotifs(res.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // ───── FETCH PENDING DEPOSITS (REAL-TIME) ─────
  const fetchPendingDeposits = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pending = res.data.filter(tx => tx.status === 'Pending' && tx.type === 'deposit');
      setPendingDeposits(pending);

      // Real-time popup + sound
      if (pending.length > prevCount.current) {
        const latest = pending[0];
        const msg = `New deposit: $${latest.amount} from ${latest.userId.name}`;
        if (msg !== popupMsg) {
          setPopupMsg(msg);
          setShowPopup(true);
          depositSound.play().catch(() => {});
          setTimeout(() => setShowPopup(false), 6000);
        }
      }
      prevCount.current = pending.length;
    } catch (err) {
      console.error(err);
    }
  }, [token, popupMsg]);

  // POLLING every 5s
  useEffect(() => {
    fetchPendingDeposits();
    pollRef.current = setInterval(fetchPendingDeposits, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchPendingDeposits]);

// ───── CONFIRM / REJECT (FIXED ENDPOINT) ─────
const handleDepositAction = async (txId, action) => {
  try {
    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/transactions/admin/${txId}`,
      { action: action.toLowerCase() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success(`Deposit ${action}ed`);
    fetchPendingDeposits();
    fetchNotifs();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Action failed');
    console.error('Confirm/Reject error:', err.response?.data);
  }
};

// ───── BALANCE EDIT (FIXED FIELD NAMES) ─────
const submitBalance = async e => {
  e.preventDefault();
  try {
    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/user/${editBal.userId}/balances`,
      {
        checkingBalance: Number(editBal.checking),
        savingsBalance: Number(editBal.savings),
        usdtBalance: Number(editBal.usdt),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setUsers(prev =>
      prev.map(u =>
        u._id === editBal.userId
          ? {
              ...u,
              balance: {
                checking: Number(editBal.checking),
                savings: Number(editBal.savings),
                usdt: Number(editBal.usdt),
              },
            }
          : u
      )
    );
    setEditBal(null);
    toast.success('Balances updated');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Update failed');
  }
};

  // ───── INITIAL LOAD ─────
  useEffect(() => {
    const isAdm = localStorage.getItem('isAdmin') === 'true';
    if (!token || !isAdm) {
      toast.error('Admin login required');
      navigate('/admin');
      return;
    }
    fetchUsers();
    fetchNotifs();
  }, [token, navigate, fetchUsers, fetchNotifs]);

  // ───── SEARCH ─────
  const handleSearch = () => {
    setPage(1);
    fetchUsers(search, 1);
  };

  // ───── BULK ACTIONS ─────
  const handleBulk = async () => {
    if (!bulkAction || selected.length === 0) return toast.error('Select users & action');
    try {
      const payload = { action: bulkAction, userIds: selected };
      if (bulkAction === 'updateBalance') {
        payload.data = {
          balance: {
            checking: Number(bulkBalance.checking) || 0,
            savings: Number(bulkBalance.savings) || 0,
            usdt: Number(bulkBalance.usdt) || 0,
          },
        };
      }
      await axios.post(`${import.meta.env.VITE_API_URL}/api/user/bulk`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Bulk ${bulkAction} completed`);
      setSelected([]);
      setBulkAction('');
      setBulkBalance({ checking: '', savings: '', usdt: '' });
      fetchUsers(search, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk failed');
    }
  };

  // ───── BALANCE EDIT ─────
  const openBalanceEdit = user => {
    setEditBal({
      userId: user._id,
      email: user.email,
      checking: user.balance?.checking || 0,
      savings: user.balance?.savings || 0,
      usdt: user.balance?.usdt || 0,
    });
  };


  // ───── TRANSACTIONS MODAL ─────
  const openTx = async user => {
    setEditTxUser(user._id);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Load failed');
    }
  };

  const addTx = async e => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/transactions/user/${editTxUser}`,
        { ...newTx, amount: Number(newTx.amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions(prev => [...prev, res.data]);
      setNewTx({ type: '', amount: '', method: '', status: 'Posted', date: '' });
      toast.success('Transaction added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Add failed');
    }
  };

  const deleteTx = async id => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(prev => prev.filter(t => t._id !== id));
      toast.success('Deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };
const confirmTx = async (id, action) => {
  try {
    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/transactions/admin/${id}`,
      { action: action.toLowerCase() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success(`Transaction ${action}ed`);
    openTx({ _id: editTxUser });
    fetchPendingDeposits();
    fetchNotifs();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Action failed');
    console.error('Modal action error:', err.response?.data);
  }
};

  // ───── CSV DATA ─────
  const csvData = useMemo(
    () =>
      users.map(u => ({
        Name: u.name,
        Email: u.email,
        Checking: u.balance?.checking || 0,
        Savings: u.balance?.savings || 0,
        USDT: u.balance?.usdt || 0,
      })),
    [users]
  );

  // ───── SELECT ALL ─────
  const toggleSelectAll = () => {
    const allSelected = users.every(u => selected.includes(u._id));
    setSelected(allSelected ? [] : users.map(u => u._id));
  };

  const toggleSelect = id => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="admin-dashboard">

      {/* REAL-TIME POPUP */}
      {showPopup && (
        <div className="deposit-popup">
          <FaBell className="pulse" /> {popupMsg}
        </div>
      )}

      {/* PENDING DEPOSITS CARD */}
      {pendingDeposits.length > 0 && (
        <div className="pending-deposits-card">
          <h3>Pending Deposits ({pendingDeposits.length})</h3>
          <div className="deposit-list">
            {pendingDeposits.map(tx => (
              <div key={tx._id} className="deposit-item">
                <div>
                  <strong>{tx.userId.name}</strong> • ${tx.amount.toLocaleString()} • {tx.method}
                  {tx.receipt && (
                    <a href={`${import.meta.env.VITE_API_URL}${tx.receipt}`} target="_blank" rel="noopener noreferrer">
                      View Receipt
                    </a>
                  )}
                </div>
   <div className="deposit-actions">
  <button onClick={() => handleDepositAction(tx._id, 'confirm')} className="confirm-btn">
    <FaCheck /> Confirm
  </button>
  <button onClick={() => handleDepositAction(tx._id, 'reject')} className="reject-btn">
    <FaTimes /> Reject
  </button>
</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <div className="search-bar">
            <FaSearch />
            <input
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <CSVLink data={csvData} filename="kirtbank-users.csv" className="export-btn">
            <FaFileCsv /> Export CSV
          </CSVLink>
        </div>
      </header>

      {/* AUDIT LOG */}
      {adminNotifs.length > 0 && (
        <div className="audit-log">
          <h3><FaHistory /> Recent Activity</h3>
          <div className="log-list">
            {adminNotifs.map((n, i) => (
              <div key={i} className="log-item">
                <span className="log-msg">{n.message}</span>
                <span className="log-time">{new Date(n.date).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BULK ACTIONS */}
      <div className="bulk-controls">
        <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
          <option value="">Bulk Action</option>
          <option value="delete">Delete Users</option>
          <option value="updateBalance">Update Balance</option>
        </select>

        {bulkAction === 'updateBalance' && (
          <div className="balance-inputs">
            <input placeholder="Checking" value={bulkBalance.checking} onChange={e => setBulkBalance({ ...bulkBalance, checking: e.target.value })} />
            <input placeholder="Savings" value={bulkBalance.savings} onChange={e => setBulkBalance({ ...bulkBalance, savings: e.target.value })} />
            <input placeholder="USDT" value={bulkBalance.usdt} onChange={e => setBulkBalance({ ...bulkBalance, usdt: e.target.value })} />
          </div>
        )}

        <button onClick={handleBulk} disabled={!bulkAction || selected.length === 0} className="apply-btn">
          Apply to {selected.length}
        </button>
      </div>

      {/* USERS TABLE */}
      <div className="table-card">
        <div className="table-header">
          <h3>Registered Users</h3>
          <div className="select-all">
            <input type="checkbox" checked={selected.length === users.length && users.length > 0} onChange={toggleSelectAll} />
            <span>Select All</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Email</th>
                <th>Savings</th>
                <th>Checking</th>
                <th>USDT</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className={selected.includes(u._id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(u._id)}
                      onChange={() => toggleSelect(u._id)}
                    />
                  </td>
                  <td className="user-name">
                    <div className="avatar">{u.name.charAt(0)}</div>
                    {u.name}
                  </td>
                  <td>{u.email}</td>
                  <td className="amount">${(u.balance?.savings || 0).toLocaleString()}</td>
                  <td className="amount">${(u.balance?.checking || 0).toLocaleString()}</td>
                  <td className="amount">${(u.balance?.usdt || 0).toLocaleString()}</td>
                  <td className="actions">
                    <button onClick={() => openBalanceEdit(u)} className="edit-btn" title="Edit Balance">
                      <FaEdit />
                    </button>
                    <button onClick={() => openTx(u)} className="view-btn" title="View Transactions">
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="pagination">
          <button onClick={() => fetchUsers(search, page - 1)} disabled={page === 1}>
            Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => fetchUsers(search, page + 1)} disabled={page === totalPages}>
            Next
          </button>
        </div>
      </div>

      {/* BALANCE MODAL */}
      {editBal && (
        <div className="modal-overlay" onClick={() => setEditBal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Balances – {editBal.email}</h3>
              <button onClick={() => setEditBal(null)} className="close-btn"><FaTimes /></button>
            </div>
            <form onSubmit={submitBalance} className="balance-form">
              <div className="input-group">
                <label>Checking</label>
                <input type="number" value={editBal.checking} onChange={e => setEditBal({ ...editBal, checking: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Savings</label>
                <input type="number" value={editBal.savings} onChange={e => setEditBal({ ...editBal, savings: e.target.value })} />
              </div>
              <div className="input-group">
                <label>USDT</label>
                <input type="number" value={editBal.usdt} onChange={e => setEditBal({ ...editBal, usdt: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">Save Changes</button>
                <button type="button" onClick={() => setEditBal(null)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTIONS MODAL */}
      {editTxUser && (
        <div className="modal-overlay" onClick={() => setEditTxUser(null)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transactions – {users.find(u => u._id === editTxUser)?.email}</h3>
              <button onClick={() => setEditTxUser(null)} className="close-btn"><FaTimes /></button>
            </div>

            {/* ADD NEW */}
            <div className="add-tx-card">
              <h4><FaPlus /> Add Transaction</h4>
              <form onSubmit={addTx} className="tx-form">
                <input placeholder="Type (e.g. Deposit)" value={newTx.type} onChange={e => setNewTx({ ...newTx, type: e.target.value })} required />
                <input type="number" placeholder="Amount" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} required />
                <input placeholder="Method (e.g. Wire)" value={newTx.method} onChange={e => setNewTx({ ...newTx, method: e.target.value })} required />
                <select value={newTx.status} onChange={e => setNewTx({ ...newTx, status: e.target.value })}>
                  <option value="Posted">Posted</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
                <input type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} required />
                <button type="submit" className="add-btn">Add</button>
              </form>
            </div>

            {/* LIST */}
            <div className="tx-list">
              {transactions.length === 0 ? (
                <p className="empty">No transactions yet.</p>
              ) : (
                <table className="tx-table">
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
                    {transactions.map(t => (
                      <tr key={t._id}>
                        <td>{new Date(t.date).toLocaleDateString()}</td>
                        <td>{t.type}</td>
                        <td className="amount">${t.amount.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${t.status.toLowerCase()}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="tx-actions">
   { t.status === 'Pending' && (
  <>
    <button onClick={() => confirmTx(t._id, 'confirm')} className="confirm-btn">
      <FaCheck />
    </button>
    <button onClick={() => confirmTx(t._id, 'reject')} className="fail-btn">
      <FaTimes />
    </button>
  </>
)}
                          <button onClick={() => deleteTx(t._id)} className="delete-btn">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;