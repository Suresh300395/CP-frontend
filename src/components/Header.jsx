import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    KeyRound,
    Sun,
    Moon,
    LogOut
} from 'lucide-react';

export default function Header({ theme, toggleTheme, onOpenChangePassword }) {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="dashboard-nav">
            <div className="nav-brand">
                <img
                    src="/ADITYA LOGO2.png"
                    alt="Aditya University Logo"
                    className="brand-logo-img logo-for-light"
                    style={{ height: '46px', width: 'auto' }}
                />
                <img
                    src="/Aditya University Gold Logo.png"
                    alt="Aditya University Logo"
                    className="brand-logo-img logo-for-dark"
                    style={{ height: '46px', width: 'auto' }}
                />
            </div>

            <div className="nav-user" ref={dropdownRef}>
                <button
                    type="button"
                    className="profile-dropdown-trigger"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    title="Profile Menu"
                >
                    <div className="profile-avatar-initial">
                        {userInitial}
                    </div>
                </button>

                {isDropdownOpen && (
                    <div className="profile-dropdown-menu">
                        <button
                            type="button"
                            className="dropdown-menu-item"
                            onClick={() => {
                                setIsDropdownOpen(false);
                                if (onOpenChangePassword) onOpenChangePassword();
                            }}
                        >
                            <KeyRound size={18} className="dropdown-menu-icon" />
                            <span>Change Password</span>
                        </button>

                        <button
                            type="button"
                            className="dropdown-menu-item"
                            onClick={(e) => {
                                setIsDropdownOpen(false);
                                if (toggleTheme) toggleTheme(e);
                            }}
                        >
                            {theme === 'dark' ? (
                                <Sun size={18} className="dropdown-menu-icon" />
                            ) : (
                                <Moon size={18} className="dropdown-menu-icon" />
                            )}
                            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>

                        <div className="dropdown-menu-divider"></div>

                        <button
                            type="button"
                            className="dropdown-menu-item logout-item"
                            onClick={logout}
                        >
                            <LogOut size={18} className="dropdown-menu-icon" />
                            <span>Log Out</span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
