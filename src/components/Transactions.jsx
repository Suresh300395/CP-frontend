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
    Calendar,
    Mail,
    Phone,
    FileText,
    X,
    Wallet,
    CheckCircle2,
    XCircle,
    Clock,
    RotateCcw,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export default function Transactions({ initialStatusFilter = 'All', activeTab = 'transactions' }) {
    const { user, token } = useAuth();

    // Default to today (2026-09-28)
    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [fromDate, setFromDate] = useState(getTodayString());
    const [toDate, setToDate] = useState(getTodayString());
    const [activePreset, setActivePreset] = useState('today');

    const [transactionStatusFilter, setTransactionStatusFilter] = useState(initialStatusFilter);
    const [selectedAdminFilter, setSelectedAdminFilter] = useState('All');
    const [adminsList, setAdminsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const [transactionsList, setTransactionsList] = useState([]);
    const [summary, setSummary] = useState({
        totalTransactions: 0,
        totalAmount: 0,
        totalFee: 0,
        totalTax: 0,
        totalRefunds: 0,
        netAmount: 0
    });
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [selectedJsonModal, setSelectedJsonModal] = useState(null);

    const isSuperAdmin = user?.role === 'superadmin' || user?.email?.toLowerCase() === 'prime@adityauniversity.in';

    // Fetch Razorpay statement for given date range
    const fetchRazorpayStatement = async (start = fromDate, end = toDate) => {
        setLoading(true);
        setErrorMsg(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const res = await fetch(`${API_URL}/payments/razorpay?fromDate=${start}&toDate=${end}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await res.json();
            if (res.ok && data.success) {
                setTransactionsList(data.payments || []);
                if (data.summary) {
                    setSummary(data.summary);
                }
            } else {
                setErrorMsg(data.message || 'Failed to fetch Razorpay transactions');
                setTransactionsList([]);
                setSummary({
                    totalTransactions: 0,
                    totalAmount: 0,
                    totalFee: 0,
                    totalTax: 0,
                    totalRefunds: 0,
                    netAmount: 0
                });
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('Fetch statement error:', err);
            if (err.name === 'AbortError') {
                setErrorMsg('Request timed out. Please select a shorter date range or retry.');
            } else {
                setErrorMsg('Network error connecting to backend API');
            }
            setTransactionsList([]);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (token) {
            fetchRazorpayStatement(fromDate, toDate);
        }
    }, [token]);

    // Fetch Admins list for scope filter
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

    // Quick Date Presets
    const handlePresetChange = (preset) => {
        setActivePreset(preset);
        const today = new Date();
        let start = new Date();
        let end = new Date();

        if (preset === 'today') {
            // start & end are today
        } else if (preset === 'yesterday') {
            start.setDate(today.getDate() - 1);
            end.setDate(today.getDate() - 1);
        } else if (preset === '7days') {
            start.setDate(today.getDate() - 6);
        } else if (preset === 'month') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
        }

        const formatD = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const startStr = formatD(start);
        const endStr = formatD(end);

        setFromDate(startStr);
        setToDate(endStr);
        setCurrentPage(1);
        fetchRazorpayStatement(startStr, endStr);
    };

    // Reset pagination to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, transactionStatusFilter, fromDate, toDate, selectedAdminFilter, rowsPerPage]);

    // Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactionsList.filter((tx) => {
            // Status match
            let matchesStatus = true;
            if (transactionStatusFilter !== 'All') {
                const filterUpper = transactionStatusFilter.toUpperCase();
                const txStatusUpper = (tx.status || '').toUpperCase();
                if (filterUpper === 'SUCCESS' || filterUpper === 'CAPTURED') {
                    matchesStatus = txStatusUpper === 'CAPTURED' || txStatusUpper === 'SUCCESS';
                } else if (filterUpper === 'PENDING') {
                    matchesStatus = txStatusUpper === 'PENDING' || txStatusUpper === 'AUTHORIZED';
                } else if (filterUpper === 'FAILED') {
                    matchesStatus = txStatusUpper === 'FAILED';
                } else if (filterUpper === 'REFUNDED') {
                    matchesStatus = txStatusUpper === 'REFUNDED';
                }
            }

            // Search match
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = q === '' ||
                (tx.paymentId && tx.paymentId.toLowerCase().includes(q)) ||
                (tx.orderId && tx.orderId.toLowerCase().includes(q)) ||
                (tx.customerEmail && tx.customerEmail.toLowerCase().includes(q)) ||
                (tx.customerPhone && tx.customerPhone.toLowerCase().includes(q)) ||
                (tx.description && tx.description.toLowerCase().includes(q)) ||
                (tx.rrn && tx.rrn.toLowerCase().includes(q)) ||
                (tx.vpa && tx.vpa.toLowerCase().includes(q));

            return matchesStatus && matchesSearch;
        });
    }, [transactionsList, transactionStatusFilter, searchQuery]);

    // Recalculate dynamic summary if filtered by search or status
    const displaySummary = useMemo(() => {
        if (transactionStatusFilter === 'All' && searchQuery === '') {
            return summary;
        }
        let totalAmt = 0;
        let totalF = 0;
        let totalT = 0;
        let totalR = 0;
        filteredTransactions.forEach(tx => {
            totalAmt += tx.amount || 0;
            totalF += tx.fee || 0;
            totalT += tx.tax || 0;
            totalR += tx.refundAmount || 0;
        });
        const net = totalAmt - totalF;
        return {
            totalTransactions: filteredTransactions.length,
            totalAmount: Number(totalAmt.toFixed(2)),
            totalFee: Number(totalF.toFixed(2)),
            totalTax: Number(totalT.toFixed(2)),
            totalRefunds: Number(totalR.toFixed(2)),
            netAmount: Number(net.toFixed(2))
        };
    }, [filteredTransactions, summary, transactionStatusFilter, searchQuery]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / rowsPerPage));
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const startIndex = (safeCurrentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredTransactions.length);
    const paginatedTransactions = useMemo(() => {
        return filteredTransactions.slice(startIndex, endIndex);
    }, [filteredTransactions, startIndex, endIndex]);

    // Page navigation helper
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    // CSV / Excel Export Handler (exports ALL filtered transactions matching date range)
    const exportData = (format) => {
        if (filteredTransactions.length === 0) return;

        const headers = [
            'S.NO',
            'DATE & TIME',
            'PAYMENT ID',
            'ORDER ID',
            'CUSTOMER EMAIL',
            'CUSTOMER PHONE',
            'DESCRIPTION',
            'AMOUNT (INR)',
            'STATUS',
            'METHOD',
            'METHOD DETAIL',
            'FEE (INR)',
            'TAX (INR)',
            'NET AMOUNT (INR)',
            'RRN'
        ];

        const rows = filteredTransactions.map((tx, idx) => [
            idx + 1,
            `"${tx.createdAt}"`,
            `"${tx.paymentId}"`,
            `"${tx.orderId}"`,
            `"${tx.customerEmail}"`,
            `"${tx.customerPhone}"`,
            `"${tx.description}"`,
            tx.amount.toFixed(2),
            tx.status,
            tx.method,
            `"${tx.methodDetail}"`,
            tx.fee.toFixed(2),
            tx.tax.toFixed(2),
            tx.netAmount.toFixed(2),
            `"${tx.rrn}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const ext = format === 'excel' ? 'xlsx' : 'csv';
        link.setAttribute('download', `Razorpay_Statement_${fromDate}_to_${toDate}.${ext}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="transactions-view-container">
            {/* Header Row */}
            <div className="transactions-header-row">
                <div className="dash-header-title">
                    <h1>Payment Transactions</h1>
                    <p>
                        Viewing live Razorpay gateway statement and payment transaction records
                    </p>
                </div>

                <div className="search-filter-box">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by Payment ID, Order ID, Customer, or RRN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Select Date Range & Filter Card */}
            <div className="date-range-card">
                <div className="date-range-header">
                    <h3>
                        <Calendar size={18} style={{ color: '#38bdf8' }} />
                        Select Date Range
                    </h3>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className={`btn-preset-date ${activePreset === 'today' ? 'active' : ''}`}
                            onClick={() => handlePresetChange('today')}
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            className={`btn-preset-date ${activePreset === 'yesterday' ? 'active' : ''}`}
                            onClick={() => handlePresetChange('yesterday')}
                        >
                            Yesterday
                        </button>
                        <button
                            type="button"
                            className={`btn-preset-date ${activePreset === '7days' ? 'active' : ''}`}
                            onClick={() => handlePresetChange('7days')}
                        >
                            Last 7 Days
                        </button>
                        <button
                            type="button"
                            className={`btn-preset-date ${activePreset === 'month' ? 'active' : ''}`}
                            onClick={() => handlePresetChange('month')}
                        >
                            This Month
                        </button>
                    </div>
                </div>

                <div className="date-range-controls">
                    <div className="date-input-group">
                        <label>From Date</label>
                        <input
                            type="date"
                            className="date-picker-input"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setActivePreset('custom');
                            }}
                        />
                    </div>

                    <div className="date-input-group">
                        <label>To Date</label>
                        <input
                            type="date"
                            className="date-picker-input"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setActivePreset('custom');
                            }}
                        />
                    </div>

                    <button
                        type="button"
                        className="btn-get-statement"
                        disabled={loading}
                        style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1 }}
                        onClick={() => {
                            setCurrentPage(1);
                            fetchRazorpayStatement(fromDate, toDate);
                        }}
                    >
                        {loading ? <Loader2 size={16} className="spin-loader" /> : <FileText size={16} />}
                        {loading ? 'Fetching...' : 'Get Statement'}
                    </button>
                </div>

                {/* Status & Scope Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Status:
                        </span>
                        <div className="status-filter-pills">
                            {['All', 'Captured', 'Pending', 'Failed', 'Refunded'].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    className={`filter-pill ${transactionStatusFilter.toLowerCase() === status.toLowerCase() ? 'active' : ''} ${status.toLowerCase()}`}
                                    onClick={() => setTransactionStatusFilter(status)}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isSuperAdmin && adminsList.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                Scope:
                            </span>
                            <div style={{ position: 'relative', minWidth: '180px' }}>
                                <select
                                    value={selectedAdminFilter}
                                    onChange={(e) => setSelectedAdminFilter(e.target.value)}
                                    className="admin-filter-select"
                                    style={{
                                        padding: '0.45rem 2rem 0.45rem 0.85rem',
                                        fontSize: '0.84rem',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-dark)',
                                        color: 'var(--text-heading)',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        width: '100%',
                                        appearance: 'none'
                                    }}
                                >
                                    <option value="All">All Scope</option>
                                    {adminsList.map((admin) => (
                                        <option key={admin._id || admin.dbName} value={admin.dbName}>
                                            {admin.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Stat Cards Grid */}
            <div className="statement-stats-grid">
                <div className="statement-stat-card">
                    <span className="statement-stat-label">Transactions</span>
                    <span className="statement-stat-value">{displaySummary.totalTransactions}</span>
                </div>
                <div className="statement-stat-card">
                    <span className="statement-stat-label">Total Amount</span>
                    <span className="statement-stat-value highlight-total">
                        ₹{displaySummary.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="statement-stat-card">
                    <span className="statement-stat-label">Razorpay Fee</span>
                    <span className="statement-stat-value highlight-fee">
                        ₹{displaySummary.totalFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="statement-stat-card">
                    <span className="statement-stat-label">Tax</span>
                    <span className="statement-stat-value">
                        ₹{displaySummary.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="statement-stat-card">
                    <span className="statement-stat-label">Refunds</span>
                    <span className="statement-stat-value">
                        ₹{displaySummary.totalRefunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="statement-stat-card">
                    <span className="statement-stat-label">Net Amount</span>
                    <span className="statement-stat-value highlight-net">
                        ₹{displaySummary.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {/* Table Header & Download Actions */}
            <div className="analytics-card" style={{ width: '100%', padding: '1.5rem' }}>
                <div className="table-action-header">
                    <div className="table-title-box">
                        <h2>Transactions & Raw Data ({filteredTransactions.length})</h2>
                        <p>Includes all fields: Description, Customer Info, RRN, Acquirer Data & Raw JSON</p>
                    </div>

                    <div className="export-btn-group">
                        <button
                            type="button"
                            className="btn-download-excel"
                            onClick={() => exportData('excel')}
                            disabled={filteredTransactions.length === 0}
                        >
                            <Download size={15} /> Download Excel
                        </button>
                        <button
                            type="button"
                            className="btn-download-csv"
                            onClick={() => exportData('csv')}
                            disabled={filteredTransactions.length === 0}
                        >
                            <Download size={15} /> Download CSV
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="table-responsive">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3.5rem', color: 'var(--text-muted)', gap: '0.6rem' }}>
                            <Loader2 size={24} className="spin-loader" />
                            <span>Fetching live Razorpay statement transactions...</span>
                        </div>
                    ) : errorMsg ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1rem', textAlign: 'center', gap: '0.75rem' }}>
                            <ShieldAlert size={42} strokeWidth={1.5} style={{ color: '#f87171' }} />
                            <span style={{ fontSize: '0.95rem', color: '#f87171', fontWeight: 600 }}>
                                {errorMsg}
                            </span>
                            <button
                                type="button"
                                className="btn-get-statement"
                                style={{ marginTop: '0.5rem', height: '36px', fontSize: '0.82rem' }}
                                onClick={() => fetchRazorpayStatement(fromDate, toDate)}
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1rem', textAlign: 'center', gap: '0.75rem', width: '100%' }}>
                            <ShieldAlert size={42} strokeWidth={1.5} style={{ color: 'var(--text-muted)', opacity: 0.8 }} />
                            <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                No transactions found for selected date range ({fromDate} to {toDate}).
                            </span>
                        </div>
                    ) : (
                        <table className="transactions-table full-view">
                            <thead>
                                <tr>
                                    <th>S.NO</th>
                                    <th>DATE & TIME</th>
                                    <th>PAYMENT ID</th>
                                    <th>ORDER ID / INVOICE</th>
                                    <th>CUSTOMER INFO</th>
                                    <th>DESCRIPTION</th>
                                    <th>AMOUNT</th>
                                    <th>STATUS</th>
                                    <th>METHOD & REF (RRN)</th>
                                    <th>FEE & TAX</th>
                                    <th>NET AMOUNT</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTransactions.map((tx, idx) => (
                                    <tr key={tx.paymentId || idx}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                                            {startIndex + idx + 1}
                                        </td>
                                        <td className="tx-date" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                            {tx.createdAt}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="table-code-id"
                                                onClick={() => setSelectedJsonModal(tx)}
                                                title="Click to view Raw JSON"
                                                style={{ border: 'none', cursor: 'pointer' }}
                                            >
                                                {tx.paymentId}
                                            </button>
                                        </td>
                                        <td className="table-code-order">
                                            {tx.orderId !== 'N/A' ? `order: ${tx.orderId}` : 'N/A'}
                                        </td>
                                        <td>
                                            <div className="customer-info-box">
                                                {tx.customerEmail !== 'N/A' && (
                                                    <div className="customer-info-item">
                                                        <Mail size={13} style={{ color: '#38bdf8' }} />
                                                        <span>{tx.customerEmail}</span>
                                                    </div>
                                                )}
                                                {tx.customerPhone !== 'N/A' && (
                                                    <div className="customer-info-item">
                                                        <Phone size={13} style={{ color: '#34d399' }} />
                                                        <span>{tx.customerPhone}</span>
                                                    </div>
                                                )}
                                                {tx.customerEmail === 'N/A' && tx.customerPhone === 'N/A' && (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>N/A</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                            {tx.description}
                                        </td>
                                        <td style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)' }}>
                                            ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            {tx.status === 'CAPTURED' && (
                                                <span className="status-badge-captured">
                                                    <CheckCircle2 size={13} /> CAPTURED
                                                </span>
                                            )}
                                            {tx.status === 'FAILED' && (
                                                <span className="status-badge-failed">
                                                    <XCircle size={13} /> FAILED
                                                </span>
                                            )}
                                            {tx.status === 'PENDING' && (
                                                <span className="status-badge-pending">
                                                    <Clock size={13} /> PENDING
                                                </span>
                                            )}
                                            {tx.status === 'REFUNDED' && (
                                                <span className="status-badge-refunded">
                                                    <RotateCcw size={13} /> REFUNDED
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span className="method-tag" style={{ width: 'fit-content' }}>
                                                    {tx.method === 'UPI' && <Smartphone size={13} className="method-icon" />}
                                                    {tx.method === 'CARD' && <CreditCard size={13} className="method-icon" />}
                                                    {tx.method === 'WALLET' && <Wallet size={13} className="method-icon" />}
                                                    {tx.method === 'NETBANKING' && <Building2 size={13} className="method-icon" />}
                                                    {tx.method}
                                                </span>
                                                {tx.methodDetail && (
                                                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                                        {tx.methodDetail}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fee-tax-box">
                                                <span>Fee: ₹{tx.fee.toFixed(2)}</span>
                                                <span>Tax: ₹{tx.tax.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 700, fontSize: '0.9rem', color: '#38bdf8' }}>
                                            ₹{tx.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="action-icon-btn"
                                                onClick={() => setSelectedJsonModal(tx)}
                                                title="View Raw JSON Details"
                                            >
                                                <FileText size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Footer */}
                {!loading && !errorMsg && filteredTransactions.length > 0 && (
                    <div className="table-pagination-footer">
                        <div className="pagination-info-text">
                            Showing <strong>{filteredTransactions.length === 0 ? 0 : startIndex + 1}</strong> to{' '}
                            <strong>{endIndex}</strong> of <strong>{filteredTransactions.length}</strong> entries
                        </div>

                        <div className="pagination-controls-group">
                            <div className="rows-per-page-box">
                                <span>Rows per page:</span>
                                <select
                                    className="rows-select-input"
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <div className="page-nav-buttons">
                                <button
                                    type="button"
                                    className="page-num-btn"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={safeCurrentPage === 1}
                                    title="First Page"
                                >
                                    <ChevronsLeft size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="page-num-btn"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={safeCurrentPage === 1}
                                    title="Previous Page"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {getPageNumbers().map((pg) => (
                                    <button
                                        key={pg}
                                        type="button"
                                        className={`page-num-btn ${pg === safeCurrentPage ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(pg)}
                                    >
                                        {pg}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className="page-num-btn"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={safeCurrentPage === totalPages}
                                    title="Next Page"
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="page-num-btn"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={safeCurrentPage === totalPages}
                                    title="Last Page"
                                >
                                    <ChevronsRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Raw JSON Details Modal */}
            {selectedJsonModal && (
                <div className="modal-backdrop" onClick={() => setSelectedJsonModal(null)}>
                    <div className="modal-content-json" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-json">
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={18} style={{ color: '#38bdf8' }} />
                                Transaction Raw Payload ({selectedJsonModal.paymentId})
                            </h3>
                            <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                onClick={() => setSelectedJsonModal(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body-json">
                            <pre>{JSON.stringify(selectedJsonModal.rawJson || selectedJsonModal, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
