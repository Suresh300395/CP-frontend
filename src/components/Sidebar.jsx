import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    UserPlus,
    CreditCard
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'superadmin' || user?.email?.toLowerCase() === 'prime@adityauniversity.in';

    // SuperAdmin gets 'Admin Management'
    // Regular Admins only see 'Dashboard' and 'Transactions' (scoped to their DB)
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ...(isSuperAdmin ? [{ id: 'add-payment', label: 'Admin Management', icon: UserPlus }] : []),
        { id: 'transactions', label: 'Transactions', icon: CreditCard }
    ];

    return (
        <>
            {/* Desktop Vertical Sidebar */}
            <aside className="dashboard-sidebar">
                <nav className="sidebar-nav">
                    {menuItems.map((item) => {
                        const IconComponent = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveTab && setActiveTab(item.id)}
                            >
                                <IconComponent size={20} className="sidebar-nav-icon" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Fixed Mobile Bottom Navigation Bar */}
            <nav className="mobile-bottom-nav">
                {menuItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setActiveTab && setActiveTab(item.id)}
                        >
                            <IconComponent size={20} className="mobile-nav-icon" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
}
