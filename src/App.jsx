import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { Loader2, Sun, Moon } from 'lucide-react';
import './index.css';

function AppContent({ theme, toggleTheme }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-container">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Loader2 className="spinner" size={36} style={{ color: '#ea580c' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying session...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {!user && (
                <button
                    type="button"
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
            )}
            {user ? (
                <Dashboard theme={theme} toggleTheme={toggleTheme} />
            ) : (
                <LoginPage theme={theme} />
            )}
        </>
    );
}

export default function App() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('cp_theme') || 'dark';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem('cp_theme', theme);
    }, [theme]);

    const toggleTheme = (event) => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';

        if (document.startViewTransition) {
            const x = window.innerWidth / 2;
            const y = window.innerHeight / 2;

            const transition = document.startViewTransition(() => {
                setTheme(nextTheme);
            });

            transition.ready.then(() => {
                const maxSize = Math.max(window.innerWidth, window.innerHeight) * 3.5;

                document.documentElement.animate(
                    [
                        {
                            WebkitMaskImage: `url('/Cursor_Mask.svg')`,
                            maskImage: `url('/Cursor_Mask.svg')`,
                            WebkitMaskRepeat: `no-repeat`,
                            maskRepeat: `no-repeat`,
                            WebkitMaskPosition: `${x}px ${y}px`,
                            maskPosition: `${x}px ${y}px`,
                            WebkitMaskSize: `0px 0px`,
                            maskSize: `0px 0px`
                        },
                        {
                            WebkitMaskImage: `url('/Cursor_Mask.svg')`,
                            maskImage: `url('/Cursor_Mask.svg')`,
                            WebkitMaskRepeat: `no-repeat`,
                            maskRepeat: `no-repeat`,
                            WebkitMaskPosition: `${x - maxSize / 2}px ${y - maxSize / 2}px`,
                            maskPosition: `${x - maxSize / 2}px ${y - maxSize / 2}px`,
                            WebkitMaskSize: `${maxSize}px ${maxSize}px`,
                            maskSize: `${maxSize}px ${maxSize}px`
                        }
                    ],
                    {
                        duration: 1200,
                        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                        pseudoElement: '::view-transition-new(root)'
                    }
                );
            });
        } else {
            setTheme(nextTheme);
        }
    };

    return (
        <AuthProvider>
            <AppContent theme={theme} toggleTheme={toggleTheme} />
        </AuthProvider>
    );
}
