// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSearch, FaDownload, FaShieldAlt, FaUsers, FaDollarSign, FaCheck, FaTimes, FaEdit, FaEye, FaTrash, FaPlus, FaBell, FaMoneyBillWave, FaFilter } from 'react-icons/fa';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editBal, setEditBal] = useState(null);
  const [editTxUser, setEditTxUser] = useState(null);
  const [newTx, setNewTx] = useState({ type: 'deposit', amount: '', method: '', status: 'Posted', account: 'checking' });
  const [bulkAction, setBulkAction] = useState('');
  const [bulkBalance, setBulkBalance] = useState({ checking: '', savings: '', usdt: '' });
  const [showDepositPopup, setShowDepositPopup] = useState(null);
  const token = localStorage.getItem('token');
  const audioRef = useRef(new Audio('/notification.mp3'));

  // FETCH DATA
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchPendingDeposits = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pending = res.data.filter(tx => tx.status === 'Pending' && tx.type === 'deposit');
      setPendingDeposits(pending);
    } catch (err) { console.error(err); }
  };

  const fetchNotifs = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/notifs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLog(res.data.adminNotifications || []);
    } catch (err) { console.error(err); }
  };

  const openTx = async (user) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
      setEditTxUser(user._id);
    } catch (err) { toast.error('Failed to load transactions'); }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingDeposits();
    fetchNotifs();
    const interval = setInterval(() => {
      fetchPendingDeposits();
      fetchNotifs();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Play sound + popup
  useEffect(() => {
    if (pendingDeposits.length > 0) {
      const latest = pendingDeposits[0];
      if (!showDepositPopup || showDepositPopup._id !== latest._id) {
        setShowDepositPopup(latest);
        audioRef.current.play();
        setTimeout(() => setShowDepositPopup(null), 6000);
      }
    }
  }, [pendingDeposits]);

  // FIXED: Confirm/Reject (Pending Card & Modal)
  const handleDepositAction = async (txId, action) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/transactions/admin/${txId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Deposit ${action}ed!`);
      fetchPendingDeposits();
      fetchNotifs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
      console.error(err);
    }
  };

  const confirmTx = async (id, action) => {
    await handleDepositAction(id, action);
    openTx({ _id: editTxUser });
  };

  // Balance edit
  const submitBalance = async (e) => {
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
      setUsers(prev => prev.map(u => u._id === editBal.userId ? { ...u, balance: { checking: Number(editBal.checking), savings: Number(editBal.savings), usdt: Number(editBal.usdt) } } : u));
      setEditBal(null);
      toast.success('Balance updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="admin-dashboard">
      <ToastContainer />

      {/* Popup */}
      {showDepositPopup && (
        <div className="deposit-popup">
          <FaMoneyBillWave className="pulse" />
          <div>
            <strong>New Deposit!</strong><br />
            ${showDepositPopup.amount} from {showDepositPopup.userId?.name}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-header">
        <h1><FaShieldAlt /> Admin Dashboard</h1>
        <div className="header-actions">
          <div className="search-bar">
            <FaSearch />
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <a href="/api/export" className="export-btn"><FaDownload /> Export</a>
        </div>
      </div>

      {/* Pending Deposits */}
      <div className="pending-deposits-card">
        <h3><FaBell /> Pending Deposits ({pendingDeposits.length})</h3>
        <div className="deposit-list">
          {pendingDeposits.length === 0 ? <p className="empty">No pending deposits</p> : pendingDeposits.map(tx => (
            <div key={tx._id} className="deposit-item">
              <div>
                <strong>{tx.userId?.name || 'Unknown'}</strong> • ${tx.amount} • {tx.method}
                {tx.receipt && <a href={`${import.meta.env.VITE_API_URL}${tx.receipt}`} target="_blank">View Receipt</a>}
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

      {/* Table */}
      <div className="table-card">
        <div className="table-header">
          <h3><FaUsers /> All Users</h3>
        </div>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.name.toLowerCase().includes(search.toLowerCase())).map(user => (
                <tr key={user._id}>
                  <td className="user-name">
                    <div className="avatar">{user.name[0]}</div>
                    <div>
                      <div>{user.name}</div>
                      <small>{user.email}</small>
                    </div>
                  </td>
                  <td>
                    <div>Checking: ${user.balance.checking}</div>
                    <div>Savings: ${user.balance.savings}</div>
                    <div>USDT: ${user.balance.usdt}</div>
                  </td>
                  <td className="actions">
                    <button onClick={() => setEditBal({ userId: user._id, ...user.balance })} className="edit-btn"><FaEdit /></button>
                    <button onClick={() => openTx(user)} className="view-btn"><FaEye /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Balance Modal */}
      {editBal && (
        <div className="modal-overlay" onClick={() => setEditBal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Balance</h3>
              <button onClick={() => setEditBal(null)} className="close-btn">&times;</button>
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
                <button type="submit" className="save-btn">Save</button>
                <button type="button" onClick={() => setEditBal(null)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {editTxUser && (
        <div className="modal-overlay" onClick={() => setEditTxUser(null)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Transactions</h3>
              <button onClick={() => setEditTxUser(null)} className="close-btn">&times;</button>
            </div>
            <div className="tx-list">
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
                      <td className="amount">${t.amount}</td>
                      <td><span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span></td>
                      <td className="tx-actions">
                        {t.status === 'Pending' && (
                          <>
                            <button onClick={() => confirmTx(t._id, 'confirm')} className="confirm-btn"><FaCheck /></button>
                            <button onClick={() => confirmTx(t._id, 'reject')} className="fail-btn"><FaTimes /></button>
                          </>
                        )}
                        <button onClick={() => handleDepositAction(t._id, 'delete')} className="delete-btn"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;