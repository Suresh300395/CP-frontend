import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Transactions from './Transactions';
import {
    LogOut,
    CheckCircle2,
    XCircle,
    Clock,
    Wallet,
    Calendar,
    ChevronDown,
    KeyRound,
    Sun,
    Moon,
    Eye,
    EyeOff,
    AlertCircle,
    ShieldAlert,
    Loader2,
    Plus,
    UploadCloud,
    Download,
    Mail,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    Smartphone,
    CreditCard,
    X,
    Search,
    Database,
    Users,
    Trash2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Dashboard({ theme, toggleTheme }) {
    const { user, token, logout, changePassword, createAdminUser, fetchAdmins, deleteAdminUser } = useAuth();
    const isSuperAdmin = user?.role === 'superadmin' || user?.email?.toLowerCase() === 'prime@adityauniversity.in';
    const userDbName = isSuperAdmin ? 'Central Payments (Global)' : (user?.dbName || 'event_db');

    const [activeTab, setActiveTab] = useState('dashboard');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const dropdownRef = useRef(null);

    // Dynamic MongoDB data states
    const [dbPayments, setDbPayments] = useState([]);
    const [dbStats, setDbStats] = useState({ totalCollections: 0, successCount: 0, pendingCount: 0, failedCount: 0 });
    const [isDataLoading, setIsDataLoading] = useState(true);

    // Fetch dynamic payments & stats from MongoDB
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsDataLoading(true);
            try {
                const response = await fetch(`${API_URL}/payments`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                });

                const data = await response.json();
                if (response.ok && data.success) {
                    setDbStats(data.stats || { totalCollections: 0, successCount: 0, pendingCount: 0, failedCount: 0 });
                    setDbPayments((data.payments || []).map(p => ({
                        id: p.transactionId || p._id,
                        student: p.studentName || 'Student User',
                        amount: `₹${Number(p.amount).toLocaleString('en-IN')}`,
                        rawAmount: Number(p.amount) || 0,
                        method: p.paymentMethod || 'UPI',
                        status: p.status || 'Success',
                        date: new Date(p.createdAt || Date.now()).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        dbName: p.dbName || 'central_payments_db'
                    })));
                }
            } catch (err) {
                console.error('Fetch dashboard data error:', err);
            } finally {
                setIsDataLoading(false);
            }
        };

        fetchDashboardData();
    }, [token, user]);

    // Time range filter states for Payment Overview chart
    const [timeRange, setTimeRange] = useState('This Week');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const getFormattedDate = (daysAgo = 0) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState(getFormattedDate(6));
    const [endDate, setEndDate] = useState(getFormattedDate(0));
    const filterDropdownRef = useRef(null);

    // Transactions page filter states
    const [transactionStatusFilter, setTransactionStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Add Payment Admin form states
    const [adminName, setAdminName] = useState('');
    const [adminPhone, setAdminPhone] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [showAdminPass, setShowAdminPass] = useState(false);
    const [adminPassword, setAdminPassword] = useState('Aditya@123');
    const [dbName, setDbName] = useState('');

    const [adminSubmitLoading, setAdminSubmitLoading] = useState(false);
    const [adminSubmitError, setAdminSubmitError] = useState('');
    const [adminSubmitSuccess, setAdminSubmitSuccess] = useState('');

    // Existing Admins list states
    const [adminsList, setAdminsList] = useState([]);
    const [isAdminsLoading, setIsAdminsLoading] = useState(false);
    const [deleteAdminLoadingId, setDeleteAdminLoadingId] = useState(null);

    const loadAdmins = async () => {
        setIsAdminsLoading(true);
        const res = await fetchAdmins();
        if (res.success) {
            setAdminsList(res.admins || []);
        }
        setIsAdminsLoading(false);
    };

    useEffect(() => {
        if (isSuperAdmin && activeTab === 'add-payment') {
            loadAdmins();
        }
    }, [activeTab, isSuperAdmin]);

    const handleDeleteAdmin = async (adminId, name) => {
        if (!window.confirm(`Are you sure you want to delete admin '${name}'?`)) return;
        setDeleteAdminLoadingId(adminId);
        const res = await deleteAdminUser(adminId);
        setDeleteAdminLoadingId(null);
        if (res.success) {
            loadAdmins();
        } else {
            alert(res.message || 'Failed to delete admin');
        }
    };

    // Dynamic calculations from MongoDB for Payment Methods Donut Chart
    const totalCollAmount = dbStats.totalCollections || 0;

    const cardPayments = dbPayments.filter(p => (p.method === 'Card' || p.method === 'Credit / Debit Card') && p.status === 'Success');
    const upiPayments = dbPayments.filter(p => (p.method === 'UPI' || p.method === 'UPI / Net Banking') && p.status === 'Success');
    const netBankPayments = dbPayments.filter(p => p.method === 'Net Banking' && p.status === 'Success');
    const walletPayments = dbPayments.filter(p => p.method === 'Wallet' || p.method === 'Wallets' && p.status === 'Success');

    const cardSum = cardPayments.reduce((sum, p) => sum + p.rawAmount, 0);
    const upiSum = upiPayments.reduce((sum, p) => sum + p.rawAmount, 0);
    const netBankSum = netBankPayments.reduce((sum, p) => sum + p.rawAmount, 0);
    const walletSum = walletPayments.reduce((sum, p) => sum + p.rawAmount, 0);

    const cardPct = totalCollAmount > 0 ? Math.round((cardSum / totalCollAmount) * 100) : 0;
    const upiPct = totalCollAmount > 0 ? Math.round((upiSum / totalCollAmount) * 100) : 0;
    const netBankPct = totalCollAmount > 0 ? Math.round((netBankSum / totalCollAmount) * 100) : 0;
    const walletPct = totalCollAmount > 0 ? Math.max(0, 100 - (cardPct + upiPct + netBankPct)) : 0;

    const C = 345.5; // Circumference for r=55 circle
    const cardDash = Math.round((cardPct / 100) * C);
    const upiDash = Math.round((upiPct / 100) * C);
    const netBankDash = Math.round((netBankPct / 100) * C);
    const walletDash = Math.round((walletPct / 100) * C);

    const cardOffset = 0;
    const upiOffset = -cardDash;
    const netBankOffset = -(cardDash + upiDash);
    const walletOffset = -(cardDash + upiDash + netBankDash);

    // Dynamic chart data generator supporting Today, This Week, This Month, This Year, Custom Range
    const dynamicChartData = useMemo(() => {
        const days = [];
        const today = new Date();
        const xCoords = [20, 100, 180, 260, 340, 420, 500];

        if (timeRange === 'Today') {
            // 7 Hourly buckets for Today: 12 AM, 4 AM, 8 AM, 12 PM, 4 PM, 8 PM, 11 PM
            const hourLabels = ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM', '11 PM'];
            const hourRanges = [
                { start: 0, end: 4 },
                { start: 4, end: 8 },
                { start: 8, end: 12 },
                { start: 12, end: 16 },
                { start: 16, end: 20 },
                { start: 20, end: 23 },
                { start: 23, end: 24 }
            ];

            const todayIso = today.toISOString().split('T')[0];
            const todayDateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const todayPayments = dbPayments.filter(p => p.createdAt?.startsWith(todayIso) || p.date?.includes(todayDateStr));

            hourLabels.forEach((label, idx) => {
                const range = hourRanges[idx];
                const bucketSuccess = todayPayments
                    .filter(p => {
                        const h = new Date(p.createdAt || Date.now()).getHours();
                        return p.status === 'Success' && h >= range.start && h < range.end;
                    })
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                const bucketPending = todayPayments
                    .filter(p => {
                        const h = new Date(p.createdAt || Date.now()).getHours();
                        return p.status === 'Pending' && h >= range.start && h < range.end;
                    })
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                const bucketFailed = todayPayments
                    .filter(p => {
                        const h = new Date(p.createdAt || Date.now()).getHours();
                        return p.status === 'Failed' && h >= range.start && h < range.end;
                    })
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                days.push({ label, success: bucketSuccess, pending: bucketPending, failed: bucketFailed });
            });
        } else if (timeRange === 'This Month') {
            // Monthly date ranges
            const year = today.getFullYear();
            const month = today.getMonth();
            const monthName = today.toLocaleDateString('en-US', { month: 'short' });
            const intervals = [
                { label: `${monthName} 1-5`, start: 1, end: 6 },
                { label: `${monthName} 6-10`, start: 6, end: 11 },
                { label: `${monthName} 11-15`, start: 11, end: 16 },
                { label: `${monthName} 16-20`, start: 16, end: 21 },
                { label: `${monthName} 21-25`, start: 21, end: 26 },
                { label: `${monthName} 26-28`, start: 26, end: 29 },
                { label: `${monthName} 29-31`, start: 29, end: 32 }
            ];

            intervals.forEach(({ label, start, end }) => {
                const daySuccess = dbPayments
                    .filter(p => {
                        const dt = new Date(p.createdAt || Date.now());
                        return p.status === 'Success' && dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() >= start && dt.getDate() < end;
                    })
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                const dayPending = dbPayments
                    .filter(p => {
                        const dt = new Date(p.createdAt || Date.now());
                        return p.status === 'Pending' && dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() >= start && dt.getDate() < end;
                    })
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                const dayFailed = dbPayments
                    .filter(p => {
                        const dt = new Date(p.createdAt || Date.now());
                        return p.status === 'Failed' && dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() >= start && dt.getDate() < end;
                    })
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                days.push({ label, success: daySuccess, pending: dayPending, failed: dayFailed });
            });
        } else if (timeRange === 'This Year') {
            // Months of this year
            const months = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec'];
            const year = today.getFullYear();

            months.forEach((mName) => {
                const daySuccess = dbPayments
                    .filter(p => p.status === 'Success' && (p.date?.includes(mName) || new Date(p.createdAt || Date.now()).getFullYear() === year))
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                const dayPending = dbPayments
                    .filter(p => p.status === 'Pending' && (p.date?.includes(mName) || new Date(p.createdAt || Date.now()).getFullYear() === year))
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                const dayFailed = dbPayments
                    .filter(p => p.status === 'Failed' && (p.date?.includes(mName) || new Date(p.createdAt || Date.now()).getFullYear() === year))
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                days.push({ label: mName, success: daySuccess, pending: dayPending, failed: dayFailed });
            });
        } else if (timeRange === 'Custom Range' || timeRange === 'Custom Date' || timeRange.includes('to')) {
            // Calculate 7 dynamic step points between startDate and endDate
            const sDate = startDate ? new Date(startDate) : new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
            const eDate = endDate ? new Date(endDate) : today;
            const diffTime = Math.max(0, eDate.getTime() - sDate.getTime());
            const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            const stepDays = diffDays / 6;

            for (let i = 0; i < 7; i++) {
                const stepDate = new Date(sDate.getTime() + Math.round(i * stepDays) * 24 * 60 * 60 * 1000);
                const dateLabel = stepDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const isoKey = stepDate.toISOString().split('T')[0];

                const daySuccess = dbPayments
                    .filter(p => p.status === 'Success' && (p.date?.includes(dateLabel) || p.createdAt?.startsWith(isoKey)))
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                const dayPending = dbPayments
                    .filter(p => p.status === 'Pending' && (p.date?.includes(dateLabel) || p.createdAt?.startsWith(isoKey)))
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                const dayFailed = dbPayments
                    .filter(p => p.status === 'Failed' && (p.date?.includes(dateLabel) || p.createdAt?.startsWith(isoKey)))
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                days.push({ label: dateLabel, success: daySuccess, pending: dayPending, failed: dayFailed });
            }
        } else {
            // Default: 'This Week' starting from Sunday to Saturday (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
            const sunday = new Date(today);
            sunday.setDate(today.getDate() - today.getDay());

            for (let i = 0; i < 7; i++) {
                const d = new Date(sunday);
                d.setDate(sunday.getDate() + i);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const isoKey = d.toISOString().split('T')[0];

                const daySuccess = dbPayments
                    .filter(p => p.status === 'Success' && (p.date?.includes(dateLabel) || p.createdAt?.startsWith(isoKey)))
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                const dayPending = dbPayments
                    .filter(p => p.status === 'Pending' && (p.date?.includes(dateLabel) || p.createdAt?.startsWith(isoKey)))
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                const dayFailed = dbPayments
                    .filter(p => p.status === 'Failed' && (p.date?.includes(dateLabel) || p.createdAt?.startsWith(isoKey)))
                    .reduce((sum, p) => sum + p.rawAmount, 0);

                days.push({ label: `${dayName} ${d.getDate()}`, success: daySuccess, pending: dayPending, failed: dayFailed });
            }
        }

        const rawMax = Math.max(...days.flatMap(d => [d.success, d.pending, d.failed]), 10000);
        const maxVal = Math.ceil(rawMax / 1000) * 1000;
        const getY = (val) => 160 - (val / maxVal) * 140;

        const greenPts = days.map((d, i) => `${xCoords[i]},${getY(d.success)}`);
        const orangePts = days.map((d, i) => `${xCoords[i]},${getY(d.pending)}`);
        const redPts = days.map((d, i) => `${xCoords[i]},${getY(d.failed)}`);

        return {
            days,
            maxVal,
            xCoords,
            greenPath: `M ${greenPts[0]} L ${greenPts.slice(1).join(' L ')}`,
            greenArea: `M ${greenPts[0]} L ${greenPts.slice(1).join(' L ')} L 500,160 L 20,160 Z`,
            orangePath: `M ${orangePts[0]} L ${orangePts.slice(1).join(' L ')}`,
            orangeArea: `M ${orangePts[0]} L ${orangePts.slice(1).join(' L ')} L 500,160 L 20,160 Z`,
            redPath: `M ${redPts[0]} L ${redPts.slice(1).join(' L ')}`,
            greenY: days.map(d => getY(d.success)),
            orangeY: days.map(d => getY(d.pending)),
            redY: days.map(d => getY(d.failed))
        };
    }, [dbPayments, timeRange, startDate, endDate]);

    const handleAddAdminSubmit = async (e) => {
        e.preventDefault();
        setAdminSubmitError('');
        setAdminSubmitSuccess('');
        setAdminSubmitLoading(true);

        const res = await createAdminUser({
            name: adminName,
            phone: adminPhone,
            email: adminEmail,
            password: adminPassword,
            dbName: dbName
        });

        setAdminSubmitLoading(false);

        if (res.success) {
            const assignedDb = res.user?.dbName || dbName.toLowerCase().replace(/\s+/g, '_');
            setAdminSubmitSuccess(`Admin account created successfully! Dedicated database scope '${assignedDb}' initialized.`);
            setAdminName('');
            setAdminPhone('');
            setAdminEmail('');
            setAdminPassword('Aditya@123');
            loadAdmins();
            setTimeout(() => {
                setAdminSubmitSuccess('');
            }, 3000);
        } else {
            setAdminSubmitError(res.message || 'Failed to create admin account.');
        }
    };

    // Close chart filter dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Form states for password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setPasswordSuccess('');
        setShowCurrentPass(false);
        setShowNewPass(false);
        setShowConfirmPass(false);
    };

    const handleCloseModal = () => {
        setShowChangePasswordModal(false);
        resetForm();
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (!currentPassword) {
            setPasswordError('Please enter your current password.');
            return;
        }

        if (!newPassword) {
            setPasswordError('Please enter your new password.');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        const result = await changePassword(currentPassword, newPassword);
        setIsSubmitting(false);

        if (result.success) {
            setPasswordSuccess('Password updated successfully!');
            setTimeout(() => {
                handleCloseModal();
            }, 1800);
        } else {
            setPasswordError(result.message || 'Failed to update password.');
        }
    };

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    // Mock data for transactions
    const allTransactionsList = [
        { id: 'TXN12345678', student: 'Rahul Kumar', amount: '₹5,000', method: 'UPI', status: 'Success', date: 'Jun 28, 2026 10:45 AM' },
        { id: 'TXN12345677', student: 'Sneha Reddy', amount: '₹12,000', method: 'Card', status: 'Success', date: 'Jun 28, 2026 09:30 AM' },
        { id: 'TXN12345676', student: 'Arjun Singh', amount: '₹7,500', method: 'Card', status: 'Failed', date: 'Jun 27, 2026 05:15 PM' },
        { id: 'TXN12345675', student: 'Priya Sharma', amount: '₹3,200', method: 'Net Banking', status: 'Pending', date: 'Jun 27, 2026 02:20 PM' },
        { id: 'TXN12345674', student: 'Vikram Patel', amount: '₹9,800', method: 'UPI', status: 'Success', date: 'Jun 27, 2026 11:10 AM' },
        { id: 'TXN12345673', student: 'Ananya Rao', amount: '₹15,000', method: 'Net Banking', status: 'Success', date: 'Jun 26, 2026 04:30 PM' },
        { id: 'TXN12345672', student: 'Karan Verma', amount: '₹4,500', method: 'UPI', status: 'Pending', date: 'Jun 26, 2026 01:15 PM' },
        { id: 'TXN12345671', student: 'Divya Nair', amount: '₹8,200', method: 'Card', status: 'Failed', date: 'Jun 25, 2026 11:00 AM' },
    ];

    // Filter transactions based on status & search
    const filteredTransactions = allTransactionsList.filter((tx) => {
        const matchesStatus = transactionStatusFilter === 'All' || tx.status === transactionStatusFilter;
        const matchesSearch = searchQuery === '' ||
            tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.student.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="dashboard-container">
            {/* Top Navigation Header Component */}
            <Header
                theme={theme}
                toggleTheme={toggleTheme}
                onOpenChangePassword={() => {
                    resetForm();
                    setShowChangePasswordModal(true);
                }}
            />

            {/* Dashboard Main Layout */}
            <div className="dashboard-layout">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

                <main className="dashboard-main">
                    {activeTab === 'transactions' || activeTab === 'history' ? (
                        <Transactions initialStatusFilter={transactionStatusFilter} activeTab={activeTab} />
                    ) : activeTab === 'add-payment' ? (
                        <div className="add-payment-page-view">
                            <div className="dash-page-header">
                                <div className="dash-header-title">
                                    <h1>Admin Management</h1>
                                    <p>Enter details below to create and manage admin user accounts</p>
                                </div>
                            </div>

                            <div className="analytics-card" style={{ width: '100%' }}>
                                <form className="add-payment-form" onSubmit={handleAddAdminSubmit}>
                                    {adminSubmitError && (
                                        <div className="alert-banner error" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.9rem' }}>
                                            {adminSubmitError}
                                        </div>
                                    )}

                                    {adminSubmitSuccess && (
                                        <div className="alert-banner success" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.12)', border: '1px solid rgba(22, 163, 74, 0.3)', color: '#16a34a', fontSize: '0.9rem' }}>
                                            {adminSubmitSuccess}
                                        </div>
                                    )}

                                    <div className="form-grid-2">
                                        <div className="floating-input-group">
                                            <input
                                                type="text"
                                                id="admin-name"
                                                placeholder=" "
                                                value={adminName}
                                                onChange={(e) => setAdminName(e.target.value)}
                                                required
                                            />
                                            <label htmlFor="admin-name">Full Name <span className="required-star">*</span></label>
                                        </div>

                                        <div className="floating-input-group">
                                            <input
                                                type="tel"
                                                id="admin-phone"
                                                placeholder=" "
                                                value={adminPhone}
                                                onChange={(e) => setAdminPhone(e.target.value)}
                                                required
                                            />
                                            <label htmlFor="admin-phone">Phone Number <span className="required-star">*</span></label>
                                        </div>

                                        <div className="floating-input-group">
                                            <input
                                                type="email"
                                                id="admin-email"
                                                placeholder=" "
                                                value={adminEmail}
                                                onChange={(e) => setAdminEmail(e.target.value)}
                                                required
                                            />
                                            <label htmlFor="admin-email">Email Address <span className="required-star">*</span></label>
                                        </div>

                                        <div className="floating-input-group">
                                            <input
                                                type={showAdminPass ? 'text' : 'password'}
                                                id="admin-password"
                                                placeholder=" "
                                                value={adminPassword}
                                                onChange={(e) => setAdminPassword(e.target.value)}
                                                required
                                            />
                                            <label htmlFor="admin-password">Password <span className="required-star">*</span></label>
                                            <button
                                                type="button"
                                                className="toggle-password-btn"
                                                onClick={() => setShowAdminPass(!showAdminPass)}
                                                tabIndex={-1}
                                                title={showAdminPass ? 'Hide password' : 'Show password'}
                                            >
                                                {showAdminPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        <div className="floating-input-group" style={{ gridColumn: 'span 2' }}>
                                            <input
                                                type="text"
                                                id="admin-dbname"
                                                placeholder=" "
                                                value={dbName}
                                                onChange={(e) => setDbName(e.target.value)}
                                                required
                                            />
                                            <label htmlFor="admin-dbname">Database Name <span className="required-star">*</span></label>
                                        </div>
                                    </div>

                                    <div className="form-submit-row" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                        <button type="submit" className="submit-btn" disabled={adminSubmitLoading} style={{ padding: '0.75rem 2.2rem', width: 'auto' }}>
                                            {adminSubmitLoading ? 'Creating Admin...' : 'Create Admin Account'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Existing Admins List Section */}
                            <div className="analytics-card" style={{ width: '100%', marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Users size={20} style={{ color: 'var(--primary-color)' }} /> Existing Admin Accounts
                                        </h2>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                                            List of all registered admins and their allocated database scopes
                                        </p>
                                    </div>
                                    <span className="status-pill success" style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}>
                                        Total Admins: {adminsList.length}
                                    </span>
                                </div>

                                {isAdminsLoading ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                        <Loader2 className="animate-spin" size={22} style={{ marginRight: '0.6rem' }} /> Loading admin accounts...
                                    </div>
                                ) : adminsList.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        No admin accounts found.
                                    </div>
                                ) : (
                                    <div className="transactions-table-wrapper" style={{ boxShadow: 'none', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                        <table className="transactions-table">
                                            <thead>
                                                <tr>
                                                    <th>Admin User</th>
                                                    <th>Contact</th>
                                                    <th>Database Scope</th>
                                                    <th>Role</th>
                                                    <th>Created Date</th>
                                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {adminsList.map((admin) => {
                                                    const isSuper = admin.role === 'superadmin' || admin.email.toLowerCase() === 'prime@adityauniversity.in';
                                                    const initial = (admin.name || admin.email || 'A').charAt(0).toUpperCase();

                                                    return (
                                                        <tr key={admin._id || admin.email}>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                    <div className="profile-avatar-initial" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
                                                                        {initial}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{admin.name}</div>
                                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{admin.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ fontSize: '0.9rem' }}>{admin.phone || '—'}</td>
                                                            <td>
                                                                <span style={{
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '0.82rem',
                                                                    background: 'rgba(59, 130, 246, 0.12)',
                                                                    color: '#3b82f6',
                                                                    padding: '0.25rem 0.6rem',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid rgba(59, 130, 246, 0.25)'
                                                                }}>
                                                                    {admin.dbName}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`status-pill ${isSuper ? 'pending' : 'success'}`} style={{ fontSize: '0.78rem' }}>
                                                                    {isSuper ? 'Super Admin' : 'Admin'}
                                                                </span>
                                                            </td>
                                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                {!isSuper && (
                                                                    <button
                                                                        type="button"
                                                                        className="action-icon-btn"
                                                                        title="Delete Admin"
                                                                        disabled={deleteAdminLoadingId === admin._id}
                                                                        onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                                                                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                                                    >
                                                                        {deleteAdminLoadingId === admin._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Dashboard Main Overview View */
                        <>
                            {/* Page Header */}
                            <div className="dash-page-header">
                                <div className="dash-header-title">
                                    <h1>{isSuperAdmin ? 'Central Payments Dashboard' : `${userDbName.toUpperCase()} Dashboard`}</h1>
                                    <p>{isSuperAdmin ? 'Global system-wide payment statistics and multi-database overview' : `Dedicated payment dashboard for database scope '${userDbName}'`}</p>
                                </div>
                            </div>

                            {/* Metric Cards Row (All Clickable to navigate to Transactions) */}
                            <div className="metrics-grid-4">
                                {/* Card 1: Total Collections */}
                                <div
                                    className="metric-card-v2 clickable"
                                    onClick={() => {
                                        setTransactionStatusFilter('All');
                                        setActiveTab('transactions');
                                    }}
                                    title="Click to view all transactions"
                                >
                                    <div className="metric-icon-bubble orange">
                                        <Wallet size={22} />
                                    </div>
                                    <div className="metric-content-v2">
                                        <span className="metric-title">Total Collections</span>
                                        <h3 className="metric-num">₹{Number(dbStats.totalCollections || 0).toLocaleString('en-IN')}</h3>
                                    </div>
                                </div>

                                {/* Card 2: Successful Payments */}
                                <div
                                    className="metric-card-v2 clickable"
                                    onClick={() => {
                                        setTransactionStatusFilter('Success');
                                        setActiveTab('transactions');
                                    }}
                                    title="Click to view successful transactions"
                                >
                                    <div className="metric-icon-bubble green">
                                        <CheckCircle2 size={22} />
                                    </div>
                                    <div className="metric-content-v2">
                                        <span className="metric-title">Successful Payments</span>
                                        <h3 className="metric-num">{Number(dbStats.successCount || 0).toLocaleString('en-IN')}</h3>
                                    </div>
                                </div>

                                {/* Card 3: Pending Payments */}
                                <div
                                    className="metric-card-v2 clickable"
                                    onClick={() => {
                                        setTransactionStatusFilter('Pending');
                                        setActiveTab('transactions');
                                    }}
                                    title="Click to view pending transactions"
                                >
                                    <div className="metric-icon-bubble yellow">
                                        <Clock size={22} />
                                    </div>
                                    <div className="metric-content-v2">
                                        <span className="metric-title">Pending Payments</span>
                                        <h3 className="metric-num">{Number(dbStats.pendingCount || 0).toLocaleString('en-IN')}</h3>
                                    </div>
                                </div>

                                {/* Card 4: Failed Payments */}
                                <div
                                    className="metric-card-v2 clickable"
                                    onClick={() => {
                                        setTransactionStatusFilter('Failed');
                                        setActiveTab('transactions');
                                    }}
                                    title="Click to view failed transactions"
                                >
                                    <div className="metric-icon-bubble red">
                                        <XCircle size={22} />
                                    </div>
                                    <div className="metric-content-v2">
                                        <span className="metric-title">Failed Payments</span>
                                        <h3 className="metric-num">{Number(dbStats.failedCount || 0).toLocaleString('en-IN')}</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Analytics Row: Line Chart + Donut Chart */}
                            <div className="analytics-grid-2">
                                {/* Payment Overview Chart Card */}
                                <div className="analytics-card">
                                    <div className="analytics-card-header">
                                        <h3>Payment Overview</h3>
                                        <div className="chart-header-actions">
                                            <div className="chart-legend-row">
                                                <span className="legend-item"><span className="legend-dot green"></span> Successful</span>
                                                <span className="legend-item"><span className="legend-dot orange"></span> Pending</span>
                                                <span className="legend-item"><span className="legend-dot red"></span> Failed</span>
                                            </div>
                                            <div className="filter-dropdown-wrapper" ref={filterDropdownRef}>
                                                <button
                                                    type="button"
                                                    className="filter-dropdown-btn"
                                                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                                >
                                                    <span>{timeRange === 'Custom Range' ? `${startDate} to ${endDate}` : timeRange}</span>
                                                    <ChevronDown size={14} className={`dropdown-chevron ${isFilterDropdownOpen ? 'open' : ''}`} />
                                                </button>

                                                {isFilterDropdownOpen && (
                                                    <div className="filter-dropdown-menu">
                                                        <button
                                                            type="button"
                                                            className={`filter-menu-item ${timeRange === 'Today' ? 'active' : ''}`}
                                                            onClick={() => {
                                                                setTimeRange('Today');
                                                                setIsFilterDropdownOpen(false);
                                                                setShowCustomDatePicker(false);
                                                            }}
                                                        >
                                                            Today
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`filter-menu-item ${timeRange === 'This Week' ? 'active' : ''}`}
                                                            onClick={() => {
                                                                setTimeRange('This Week');
                                                                setIsFilterDropdownOpen(false);
                                                                setShowCustomDatePicker(false);
                                                            }}
                                                        >
                                                            This Week
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`filter-menu-item ${timeRange === 'This Month' ? 'active' : ''}`}
                                                            onClick={() => {
                                                                setTimeRange('This Month');
                                                                setIsFilterDropdownOpen(false);
                                                                setShowCustomDatePicker(false);
                                                            }}
                                                        >
                                                            This Month
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`filter-menu-item ${timeRange === 'Custom Range' ? 'active' : ''}`}
                                                            onClick={() => {
                                                                setTimeRange('Custom Range');
                                                                setIsFilterDropdownOpen(false);
                                                                setShowCustomDatePicker(true);
                                                            }}
                                                        >
                                                            Custom Range
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {showCustomDatePicker && (
                                        <div className="custom-date-inputs-row">
                                            <div className="date-input-field">
                                                <label htmlFor="chart-start-date">Start Date</label>
                                                <input
                                                    type="date"
                                                    id="chart-start-date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="date-input-field">
                                                <label htmlFor="chart-end-date">End Date</label>
                                                <input
                                                    type="date"
                                                    id="chart-end-date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="apply-date-btn"
                                                onClick={() => setShowCustomDatePicker(false)}
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    )}

                                    <div className="chart-container">
                                        <svg viewBox="0 0 500 180" className="area-chart-svg" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#16a34a" stopOpacity="0.25" />
                                                    <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
                                                </linearGradient>
                                                <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                                                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                                                </linearGradient>
                                                <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                                                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                                                </linearGradient>
                                            </defs>

                                            {/* Grid Lines */}
                                            <line x1="20" y1="20" x2="500" y2="20" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.5" />
                                            <line x1="20" y1="55" x2="500" y2="55" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.5" />
                                            <line x1="20" y1="90" x2="500" y2="90" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.5" />
                                            <line x1="20" y1="125" x2="500" y2="125" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.5" />
                                            <line x1="20" y1="160" x2="500" y2="160" stroke="var(--border-color)" opacity="0.8" />

                                            {/* Y Labels */}
                                            <text x="15" y="24" className="chart-axis-text" textAnchor="end">{dynamicChartData.maxVal >= 1000 ? Math.round(dynamicChartData.maxVal / 1000) + 'K' : dynamicChartData.maxVal}</text>
                                            <text x="15" y="59" className="chart-axis-text" textAnchor="end">{Math.round((dynamicChartData.maxVal * 0.8) / 1000)}K</text>
                                            <text x="15" y="94" className="chart-axis-text" textAnchor="end">{Math.round((dynamicChartData.maxVal * 0.6) / 1000)}K</text>
                                            <text x="15" y="129" className="chart-axis-text" textAnchor="end">{Math.round((dynamicChartData.maxVal * 0.2) / 1000)}K</text>
                                            <text x="15" y="164" className="chart-axis-text" textAnchor="end">0</text>

                                            {/* Gradient Area Fills */}
                                            <path d={dynamicChartData.greenArea} fill="url(#gradGreen)" />
                                            <path d={dynamicChartData.orangeArea} fill="url(#gradOrange)" />

                                            {/* Dynamic Paths */}
                                            <path d={dynamicChartData.greenPath} fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
                                            <path d={dynamicChartData.orangePath} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                                            <path d={dynamicChartData.redPath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />

                                            {/* Dynamic Interactive Dots on green curve */}
                                            {dynamicChartData.xCoords.map((x, idx) => (
                                                <circle key={idx} cx={x} cy={dynamicChartData.greenY[idx]} r="3.5" fill="#16a34a" />
                                            ))}

                                            {/* Dynamic X Axis Dates */}
                                            {dynamicChartData.days.map((d, idx) => (
                                                <text key={idx} x={dynamicChartData.xCoords[idx]} y="176" className="chart-axis-text" textAnchor={idx === 0 ? "start" : idx === 6 ? "end" : "middle"}>
                                                    {d.label}
                                                </text>
                                            ))}
                                        </svg>
                                    </div>
                                </div>

                                {/* Payment Methods Donut Chart Card */}
                                <div className="analytics-card">
                                    <div className="analytics-card-header">
                                        <h3>Payment Methods</h3>
                                    </div>

                                    <div className="donut-content-wrapper">
                                        <div className="donut-chart-container">
                                            <svg viewBox="0 0 160 160" className="donut-svg">
                                                <circle cx="80" cy="80" r="55" fill="none" stroke="#2563eb" strokeWidth="22" strokeDasharray={`${cardDash} ${C}`} strokeDashoffset={cardOffset} />
                                                <circle cx="80" cy="80" r="55" fill="none" stroke="#16a34a" strokeWidth="22" strokeDasharray={`${upiDash} ${C}`} strokeDashoffset={upiOffset} />
                                                <circle cx="80" cy="80" r="55" fill="none" stroke="#f97316" strokeWidth="22" strokeDasharray={`${netBankDash} ${C}`} strokeDashoffset={netBankOffset} />
                                                <circle cx="80" cy="80" r="55" fill="none" stroke="#9333ea" strokeWidth="22" strokeDasharray={`${walletDash} ${C}`} strokeDashoffset={walletOffset} />
                                            </svg>
                                        </div>

                                        <div className="donut-legend-list">
                                            <div className="donut-legend-row">
                                                <div className="legend-info">
                                                    <span className="dot blue"></span>
                                                    <span>Credit / Debit Card</span>
                                                </div>
                                                <div className="legend-val">
                                                    <span className="percent">{cardPct}%</span>
                                                    <span className="amt">₹{cardSum.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>

                                            <div className="donut-legend-row">
                                                <div className="legend-info">
                                                    <span className="dot green"></span>
                                                    <span>UPI Payments</span>
                                                </div>
                                                <div className="legend-val">
                                                    <span className="percent">{upiPct}%</span>
                                                    <span className="amt">₹{upiSum.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>

                                            <div className="donut-legend-row">
                                                <div className="legend-info">
                                                    <span className="dot orange"></span>
                                                    <span>Net Banking</span>
                                                </div>
                                                <div className="legend-val">
                                                    <span className="percent">{netBankPct}%</span>
                                                    <span className="amt">₹{netBankSum.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>

                                            <div className="donut-legend-row">
                                                <div className="legend-info">
                                                    <span className="dot purple"></span>
                                                    <span>Wallets & Other</span>
                                                </div>
                                                <div className="legend-val">
                                                    <span className="percent">{walletPct}%</span>
                                                    <span className="amt">₹{walletSum.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>

                                            <div className="donut-total-row">
                                                <span>Total</span>
                                                <span className="total-amt">₹{totalCollAmount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Section: Full Width Recent Transactions Table */}
                            <div className="analytics-card" style={{ width: '100%' }}>
                                <div className="analytics-card-header">
                                    <h3>Recent Transactions</h3>
                                    <button
                                        type="button"
                                        className="view-all-link"
                                        onClick={() => {
                                            setTransactionStatusFilter('All');
                                            setActiveTab('transactions');
                                        }}
                                    >
                                        View All
                                    </button>
                                </div>

                                <div className="table-responsive">
                                    {dbPayments.length === 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1rem', textAlign: 'center', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
                                            <ShieldAlert size={38} strokeWidth={1.5} style={{ color: 'var(--text-muted)', opacity: 0.8 }} />
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '300px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                No transactions found.
                                            </span>
                                        </div>
                                    ) : (
                                        <table className="transactions-table">
                                            <thead>
                                                <tr>
                                                    <th>Transaction ID</th>
                                                    <th>Student / User</th>
                                                    <th>Amount</th>
                                                    <th>Method</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dbPayments.slice(0, 5).map((tx) => (
                                                    <tr key={tx.id}>
                                                        <td className="tx-id">{tx.id}</td>
                                                        <td className="tx-student">{tx.student}</td>
                                                        <td className="tx-amount">{tx.amount}</td>
                                                        <td className="tx-method">
                                                            <span className="method-tag">
                                                                {tx.method === 'UPI' && <Smartphone size={14} className="method-icon" />}
                                                                {tx.method === 'Card' && <CreditCard size={14} className="method-icon" />}
                                                                {tx.method === 'Net Banking' && <Building2 size={14} className="method-icon" />}
                                                                {tx.method}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`status-pill ${tx.status.toLowerCase()}`}>
                                                                {tx.status}
                                                            </span>
                                                        </td>
                                                        <td className="tx-date">{tx.date}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Change Password Modal */}
            {showChangePasswordModal && (
                <div className="profile-modal-overlay" onClick={handleCloseModal}>
                    <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="profile-modal-header">
                            <div className="modal-title-with-icon">
                                <KeyRound size={20} className="modal-title-icon" />
                                <h3>Change Password</h3>
                            </div>
                            <button
                                type="button"
                                className="profile-close-btn"
                                onClick={handleCloseModal}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleChangePasswordSubmit} className="change-pass-form">
                            <div className="profile-modal-body">
                                {passwordError && (
                                    <div className="alert-banner alert-error" style={{ marginBottom: '1rem' }}>
                                        <AlertCircle size={18} />
                                        <span>{passwordError}</span>
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="alert-banner alert-success" style={{ marginBottom: '1rem' }}>
                                        <CheckCircle2 size={18} />
                                        <span>{passwordSuccess}</span>
                                    </div>
                                )}

                                <div className="floating-input-group">
                                    <input
                                        type={showCurrentPass ? 'text' : 'password'}
                                        id="modal-current-pass"
                                        placeholder=" "
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                    <label htmlFor="modal-current-pass">Current Password</label>
                                    <button
                                        type="button"
                                        className="toggle-password-btn"
                                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                                        tabIndex={-1}
                                    >
                                        {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <div className="floating-input-group">
                                    <input
                                        type={showNewPass ? 'text' : 'password'}
                                        id="modal-new-pass"
                                        placeholder=" "
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                    <label htmlFor="modal-new-pass">New Password</label>
                                    <button
                                        type="button"
                                        className="toggle-password-btn"
                                        onClick={() => setShowNewPass(!showNewPass)}
                                        tabIndex={-1}
                                    >
                                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <div className="floating-input-group">
                                    <input
                                        type={showConfirmPass ? 'text' : 'password'}
                                        id="modal-confirm-pass"
                                        placeholder=" "
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                    <label htmlFor="modal-confirm-pass">Confirm New Password</label>
                                    <button
                                        type="button"
                                        className="toggle-password-btn"
                                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="profile-modal-footer">
                                <button
                                    type="submit"
                                    className="submit-btn full-width"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="spinner" />
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <span>Update Password</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
