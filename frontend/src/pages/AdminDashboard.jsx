// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSearch, FaDownload, FaShieldAlt, FaUsers, FaDollarSign, FaCheck, FaTimes, FaEdit, FaEye, FaTrash, FaPlus, FaBell, FaMoneyBillWave } from 'react-icons/fa';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [editBal, setEditBal] = useState(null);
  const [editTxUser, setEditTxUser] = useState(null);
  const [showDepositPopup, setShowDepositPopup] = useState(null);
  const token = localStorage.getItem('token');
  const audioRef = useRef(new Audio('/notification.mp3'));

  // FETCH USERS (FIXED ENDPOINT)
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
      console.error(err);
    }
  };

  // FETCH PENDING DEPOSITS
  const fetchPendingDeposits = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pending = res.data.filter(tx => tx.status === 'Pending' && tx.type === 'deposit');
      setPendingDeposits(pending);
    } catch (err) {
      console.error(err);
    }
  };

  // FETCH AUDIT LOG
  const fetchNotifs = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/notifs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLog(res.data.adminNotifications || []);
    } catch (err) {
      console.error(err);
    }
  };

  // OPEN TRANSACTIONS
  const openTx = async (userId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
      setEditTxUser(userId);
    } catch (err) {
      toast.error('Failed to load transactions');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingDeposits();
    fetchNotifs();

    const interval = setInterval(() => {
      fetchPendingDeposits();
      fetchNotifs();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // POPUP + SOUND
  useEffect(() => {
    if (pendingDeposits.length > 0) {
      const latest = pendingDeposits[0];
      if (!showDepositPopup || showDepositPopup._id !== latest._id) {
        setShowDepositPopup(latest);
        audioRef.current.play().catch(() => {});
        setTimeout(() => setShowDepositPopup(null), 6000);
      }
    }
  }, [pendingDeposits]);

  // FIXED CONFIRM/REJECT (WORKS EVERYWHERE)
  const handleDepositAction = async (txId, action) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/transactions/admin/${txId}`,
        { action: action.toLowerCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Deposit ${action}ed!`);
      fetchPendingDeposits();
      fetchNotifs();
      fetchUsers(); // Refresh balances
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
      console.error(err);
    }
  };

  const confirmTx = async (id, action) => {
    await handleDepositAction(id, action);
    openTx(editTxUser);
  };

  // BALANCE EDIT
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
      toast.success('Balance updated');
      setEditBal(null);
      fetchUsers();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <ToastContainer />
      
      {/* Popup */}
      {showDepositPopup && (
        <div className="deposit-popup">
          <FaMoneyBillWave className="pulse" />
          <div>
            <strong>New Deposit!</strong><br />
            ${showDepositPopup.amount} from {showDepositPopup.userId?.name || 'User'}
          </div>
        </div>
      )}

      <div className="admin-header">
        <h1><FaShieldAlt /> Admin Dashboard</h1>
        <div className="header-actions">
          <div className="search-bar">
            <FaSearch />
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Pending Deposits */}
      {pendingDeposits.length > 0 && (
        <div className="pending-deposits-card">
          <h3><FaBell /> Pending Deposits ({pendingDeposits.length})</h3>
          <div className="deposit-list">
            {pendingDeposits.map(tx => (
              <div key={tx._id} className="deposit-item">
                <div>
                  <strong>{tx.userId?.name}</strong> • ${tx.amount} • {tx.method}
                  {tx.receipt && <a href={`${import.meta.env.VITE_API_URL}${tx.receipt}`} target="_blank">Receipt</a>}
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

      {/* Users Table */}
      <div className="table-card">
        <div className="table-header">
          <h3><FaUsers /> All Users ({filteredUsers.length})</h3>
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
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td className="user-name">
                    <div className="avatar">{user.name?.[0] || 'U'}</div>
                    <div>
                      <div>{user.name || 'No Name'}</div>
                      <small>{user.email}</small>
                    </div>
                  </td>
                  <td>
                    <div>Checking: ${user.balance?.checking || 0}</div>
                    <div>Savings: ${user.balance?.savings || 0}</div>
                    <div>USDT: ${user.balance?.usdt || 0}</div>
                  </td>
                  <td className="actions">
                    <button onClick={() => setEditBal({ userId: user._id, checking: user.balance.checking, savings: user.balance.savings, usdt: user.balance.usdt })} className="edit-btn">
                      <FaEdit />
                    </button>
                    <button onClick={() => openTx(user._id)} className="view-btn">
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Modal */}
      {editBal && (
        <div className="modal-overlay" onClick={() => setEditBal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Balance</h3>
              <button onClick={() => setEditBal(null)} className="close-btn">×</button>
            </div>
            <form onSubmit={submitBalance} className="balance-form">
              <div className="input-group">
                <label>Checking</label>
                <input type="number" value={editBal.checking} onChange={e => setEditBal({...editBal, checking: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Savings</label>
                <input type="number" value={editBal.savings} onChange={e => setEditBal({...editBal, savings: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>USDT</label>
                <input type="number" value={editBal.usdt} onChange={e => setEditBal({...editBal, usdt: e.target.value})} required />
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
              <h3>Transactions</h3>
              <button onClick={() => setEditTxUser(null)} className="close-btn">×</button>
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
                      <td>{new Date(t.date).toLocaleString()}</td>
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