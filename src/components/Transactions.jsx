import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Search,
    Smartphone,
    CreditCard,
    Building2,
    Download,
    ShieldAlert,
    Loader2,
    Filter,
    ChevronDown,
    Calendar
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getEventsForAdminScope = (dbName) => {
    const cleanDb = (dbName || '').toLowerCase();
    if (cleanDb.includes('vignan') || cleanDb.includes('vedha') || cleanDb.includes('fest')) {
        return ['Veda 2026 Tech Fest', 'Hackathon 2026', 'Robo Wars', 'Paper Presentation', 'Cultural Night'];
    } else if (cleanDb.includes('sport') || cleanDb.includes('athletics')) {
        return ['Cricket Championship', 'Volleyball Tournament', 'Athletics Meet', 'Badminton League'];
    } else if (cleanDb.includes('cultural') || cleanDb.includes('music')) {
        return ['Dance Competition', 'Music Night', 'Fashion Show', 'Drama & Skit'];
    } else if (cleanDb.includes('tech') || cleanDb.includes('code') || cleanDb.includes('computer')) {
        return ['Code Clash 2026', 'AI & ML Workshop', 'Project Expo', 'Cybersecurity Seminar'];
    }
    return ['General Event Registration', 'Workshop Registration', 'Technical Symposium', 'Guest Lecture'];
};

export default function Transactions({ initialStatusFilter = 'All', activeTab = 'transactions' }) {
    const { user, token } = useAuth();
    const [transactionStatusFilter, setTransactionStatusFilter] = useState(initialStatusFilter);
    const [selectedAdminFilter, setSelectedAdminFilter] = useState('All');
    const [selectedEventFilter, setSelectedEventFilter] = useState('All');
    const [adminsList, setAdminsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [transactionsList, setTransactionsList] = useState([]);
    const [loading, setLoading] = useState(true);

    const isSuperAdmin = user?.role === 'superadmin' || user?.email?.toLowerCase() === 'prime@adityauniversity.in';
    const userDbName = user?.dbName || 'central_payments_db';

    // Fetch dynamic payments from backend MongoDB
    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/payments`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                if (res.ok && data.success && Array.isArray(data.payments)) {
                    const formatted = data.payments.map((p, index) => {
                        const defaultEvents = getEventsForAdminScope(p.dbName);
                        const assignedEvent = p.eventName || defaultEvents[index % defaultEvents.length];
                        return {
                            id: p.transactionId || `TXN${p._id?.substring(0, 8)}`,
                            student: p.studentName || 'N/A',
                            eventName: assignedEvent,
                            amount: `₹${Number(p.amount || 0).toLocaleString('en-IN')}`,
                            rawAmount: Number(p.amount || 0),
                            method: p.paymentMethod || 'UPI',
                            status: p.status || 'Success',
                            date: p.createdAt ? new Date(p.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : 'N/A',
                            dbName: p.dbName || userDbName
                        };
                    });
                    setTransactionsList(formatted);
                } else {
                    setTransactionsList([]);
                }
            } catch (err) {
                console.error('Fetch payments error:', err);
                setTransactionsList([]);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchPayments();
        }
    }, [token, userDbName]);

    // Fetch dynamic list of Admins from MongoDB for Admin Wise dropdown filter
    useEffect(() => {
        const getAdminsList = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/admins`);
                const data = await res.json();
                if (res.ok && data.success && Array.isArray(data.admins)) {
                    setAdminsList(data.admins);
                }
            } catch (err) {
                console.error('Fetch admins list error:', err);
            }
        };
        getAdminsList();
    }, []);

    // Keep filter in sync when clicking metric cards on Dashboard
    useEffect(() => {
        if (initialStatusFilter) {
            setTransactionStatusFilter(initialStatusFilter);
        }
    }, [initialStatusFilter, activeTab]);

    // Available events corresponding to the selected admin
    const availableEvents = useMemo(() => {
        let list = transactionsList;
        if (selectedAdminFilter !== 'All') {
            list = transactionsList.filter(tx => tx.dbName === selectedAdminFilter);
        }
        const eventsSet = new Set();
        list.forEach(tx => {
            if (tx.eventName) {
                eventsSet.add(tx.eventName);
            }
        });

        // Fallback default events for admin if set is empty
        if (eventsSet.size === 0 && selectedAdminFilter !== 'All') {
            getEventsForAdminScope(selectedAdminFilter).forEach(e => eventsSet.add(e));
        }

        return Array.from(eventsSet);
    }, [transactionsList, selectedAdminFilter]);

    const filteredTransactions = transactionsList.filter((tx) => {
        const matchesStatus = transactionStatusFilter === 'All' || tx.status === transactionStatusFilter;
        const matchesAdmin = selectedAdminFilter === 'All' || tx.dbName === selectedAdminFilter;
        const matchesEvent = selectedEventFilter === 'All' || tx.eventName === selectedEventFilter;
        const matchesSearch = searchQuery === '' ||
            tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.eventName && tx.eventName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (tx.dbName && tx.dbName.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesAdmin && matchesEvent && matchesSearch;
    });

    return (
        <div className="transactions-view-container">
            {/* Transactions Header & Search Bar */}
            <div className="transactions-header-row">
                <div className="dash-header-title">
                    <h1>Payment Transactions</h1>
                    <p>
                        {isSuperAdmin
                            ? 'Viewing all system-wide payment transaction records across databases'
                            : `Filtered payment records for database scope: ${userDbName}`}
                    </p>
                </div>

                <div className="search-filter-box">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by Transaction ID, Student Name, or Event..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Dedicated Filter Card */}
            <div className="analytics-card filter-card" style={{ width: '100%', marginBottom: '1.25rem', padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Filter size={18} style={{ color: 'var(--primary-color)' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                        Filter
                    </h3>
                </div>

                {/* Status Filter Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: '95px' }}>
                        Status:
                    </span>
                    <div className="status-filter-pills">
                        {['All', 'Success', 'Pending', 'Failed'].map((status) => (
                            <button
                                key={status}
                                type="button"
                                className={`filter-pill ${transactionStatusFilter === status ? 'active' : ''} ${status.toLowerCase()}`}
                                onClick={() => setTransactionStatusFilter(status)}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Admin & Event Wise Dropdown Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                    {/* Admin Wise Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: '95px' }}>
                            Admin Wise:
                        </span>
                        <div style={{ position: 'relative', minWidth: '220px' }}>
                            <select
                                value={selectedAdminFilter}
                                onChange={(e) => {
                                    setSelectedAdminFilter(e.target.value);
                                    setSelectedEventFilter('All');
                                }}
                                className="admin-filter-select"
                                style={{
                                    padding: '0.5rem 2.2rem 0.5rem 1rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-heading)',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    width: '100%',
                                    appearance: 'none',
                                    WebkitAppearance: 'none'
                                }}
                            >
                                <option value="All">All Admins</option>
                                {adminsList.map((admin) => (
                                    <option key={admin._id || admin.dbName} value={admin.dbName}>
                                        {admin.name} ({admin.dbName})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                        </div>
                    </div>

                    {/* Dynamic Event Wise Dropdown - Appears when an Admin is selected */}
                    {selectedAdminFilter !== 'All' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.3s ease' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-color)', minWidth: '85px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Calendar size={15} /> Event Wise:
                            </span>
                            <div style={{ position: 'relative', minWidth: '230px' }}>
                                <select
                                    value={selectedEventFilter}
                                    onChange={(e) => setSelectedEventFilter(e.target.value)}
                                    className="admin-filter-select"
                                    style={{
                                        padding: '0.5rem 2.2rem 0.5rem 1rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        borderRadius: '10px',
                                        border: '1px solid var(--primary-color)',
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-heading)',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        width: '100%',
                                        appearance: 'none',
                                        WebkitAppearance: 'none',
                                        boxShadow: '0 0 12px rgba(99, 102, 241, 0.18)'
                                    }}
                                >
                                    <option value="All">All Events ({availableEvents.length})</option>
                                    {availableEvents.map((evt) => (
                                        <option key={evt} value={evt}>
                                            {evt}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--primary-color)' }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transactions Table Card */}
            <div className="analytics-card" style={{ width: '100%' }}>
                <div className="table-responsive">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', color: 'var(--text-muted)', gap: '0.6rem' }}>
                            <Loader2 size={24} className="spin-loader" />
                            <span>Loading payments from database...</span>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1rem', textAlign: 'center', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
                            <ShieldAlert size={42} strokeWidth={1.5} style={{ color: 'var(--text-muted)', opacity: 0.8 }} />
                            <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '300px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                No transactions found.
                            </span>
                        </div>
                    ) : (
                        <table className="transactions-table full-view">
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>Student / User</th>
                                    <th>Event Name</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Database Scope</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td className="tx-id">{tx.id}</td>
                                        <td className="tx-student">{tx.student}</td>
                                        <td className="tx-event">
                                            <span className="event-badge" style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary-color)', fontWeight: '600', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'inline-block' }}>
                                                {tx.eventName}
                                            </span>
                                        </td>
                                        <td className="tx-amount">{tx.amount}</td>
                                        <td className="tx-method">
                                            <span className="method-tag">
                                                {tx.method === 'UPI' && <Smartphone size={14} className="method-icon" />}
                                                {tx.method === 'Card' && <CreditCard size={14} className="method-icon" />}
                                                {tx.method === 'Net Banking' && <Building2 size={14} className="method-icon" />}
                                                {tx.method}
                                            </span>
                                        </td>
                                        <td className="tx-db">
                                            <span className="db-badge" style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '0.78rem', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-color)', fontWeight: '500' }}>
                                                {tx.dbName}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${tx.status.toLowerCase()}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="tx-date">{tx.date}</td>
                                        <td>
                                            <button type="button" className="action-icon-btn" title="Download Receipt">
                                                <Download size={16} />
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
    );
}

