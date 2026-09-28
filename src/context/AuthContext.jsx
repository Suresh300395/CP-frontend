import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('cp_token') || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Verify token on initial app load
    useEffect(() => {
        const verifyUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setUser(data.user);
                } else {
                    // Token invalid or expired
                    logout();
                }
            } catch (err) {
                console.error('Auth verification error:', err);
                logout();
            } finally {
                setLoading(false);
            }
        };

        verifyUser();
    }, [token]);

    const login = async (email, password) => {
        setError(null);
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Login failed. Please try again.');
            }

            // Save token & user
            localStorage.setItem('cp_token', data.token);
            setToken(data.token);
            setUser(data.user);
            return { success: true, message: data.message };
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        }
    };

    const register = async (name, email, password) => {
        setError(null);
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Registration failed.');
            }

            localStorage.setItem('cp_token', data.token);
            setToken(data.token);
            setUser(data.user);
            return { success: true, message: data.message };
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        }
    };

    const createAdminUser = async ({ name, phone, email, password, dbName }) => {
        setError(null);
        try {
            const response = await fetch(`${API_URL}/auth/create-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ name, phone, email, password, dbName })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to create admin user.');
            }

            return { success: true, message: data.message, user: data.user };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        setError(null);
        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to change password.');
            }

            return { success: true, message: data.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const fetchAdmins = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/admins`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                return { success: true, admins: data.admins };
            }
            return { success: false, message: data.message || 'Failed to fetch admins.' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const deleteAdminUser = async (adminId) => {
        try {
            const response = await fetch(`${API_URL}/auth/admins/${adminId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                return { success: true, message: data.message };
            }
            return { success: false, message: data.message || 'Failed to delete admin.' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('cp_token');
        setToken(null);
        setUser(null);
        setError(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                error,
                setError,
                login,
                register,
                createAdminUser,
                fetchAdmins,
                deleteAdminUser,
                changePassword,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
