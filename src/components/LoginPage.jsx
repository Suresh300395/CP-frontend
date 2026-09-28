import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Lock,
    Unlock,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    ShieldCheck,
    Check
} from 'lucide-react';

export default function LoginPage() {
    const [viewState, setViewState] = useState('login'); // 'login' | 'enter_otp' | 'new_password'
    const [slideDirection, setSlideDirection] = useState('right'); // 'right' | 'left'
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOtpError, setIsOtpError] = useState(false);
    const [isOtpSuccess, setIsOtpSuccess] = useState(false);
    const [feedback, setFeedback] = useState({ type: null, message: '' });

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [otpDigits, setOtpDigits] = useState(['', '', '', '']);

    const { login, setError } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setFeedback({ type: null, message: '' });
        setError(null);
    };

    const handleOtpDigitChange = (index, value) => {
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otpDigits];
        newOtp[index] = value.slice(-1);
        setOtpDigits(newOtp);

        if (value && index < 3) {
            const nextInput = document.getElementById(`otp-box-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            const prevInput = document.getElementById(`otp-box-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{4}$/.test(pastedData)) {
            setOtpDigits(pastedData.split(''));
            const lastInput = document.getElementById(`otp-box-3`);
            if (lastInput) lastInput.focus();
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ type: null, message: '' });

        if (!formData.email || !formData.password) {
            setFeedback({ type: 'error', message: 'Please enter both email and password.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await login(formData.email, formData.password);

            if (!res.success) {
                setFeedback({ type: 'error', message: res.message });
            } else {
                setFeedback({ type: 'success', message: res.message || 'Authenticated successfully!' });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'An unexpected error occurred.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPasswordClick = (e) => {
        e.preventDefault();
        if (!formData.email) {
            setFeedback({ type: 'error', message: 'Please enter your registered email address first.' });
            return;
        }
        setSlideDirection('right');
        setViewState('enter_otp');
        setIsOtpSuccess(false);
        setOtpDigits(['', '', '', '']);
        setFeedback({
            type: 'success',
            message: `4-digit OTP sent to ${formData.email}. (Demo OTP: 1234)`
        });
    };

    const triggerOtpError = (errorMessage) => {
        setFeedback({ type: 'error', message: errorMessage });
        setIsOtpError(true);
        setOtpDigits(['', '', '', '']);

        setTimeout(() => {
            const firstInput = document.getElementById('otp-box-0');
            if (firstInput) firstInput.focus();
        }, 50);

        setTimeout(() => {
            setIsOtpError(false);
        }, 600);
    };

    const handleVerifyOtpSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ type: null, message: '' });

        const enteredOtp = otpDigits.join('');

        if (enteredOtp.length < 4) {
            triggerOtpError('Please enter all 4 digits of the OTP.');
            return;
        }

        // Demo valid OTP is '1234'
        if (enteredOtp !== '1234') {
            triggerOtpError('Invalid OTP! Please try again. (Hint: Use 1234)');
            return;
        }

        // Correct OTP! Trigger green merged check animation
        setIsOtpSuccess(true);

        setTimeout(() => {
            setIsOtpSuccess(false);
            setSlideDirection('right');
            setViewState('new_password');
            setFeedback({
                type: 'success',
                message: 'OTP Verified successfully! Please set your new password.'
            });
        }, 1100);
    };

    const handleNewPasswordSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ type: null, message: '' });

        if (!formData.newPassword || !formData.confirmPassword) {
            setFeedback({ type: 'error', message: 'Please enter both password fields.' });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setFeedback({ type: 'error', message: 'Passwords do not match! Please check and try again.' });
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            setIsSubmitting(false);
            setSlideDirection('left');
            setViewState('login');
            setFormData(prev => ({ ...prev, password: prev.newPassword, newPassword: '', confirmPassword: '' }));
            setOtpDigits(['', '', '', '']);
            setFeedback({
                type: 'success',
                message: 'Password updated successfully! Please sign in with your new password.'
            });
        }, 800);
    };

    return (
        <div className="auth-container">
            <div className="compact-auth-card">
                {/* Logo & Brand Header */}
                <div className="compact-brand-header">
                    <img
                        src="/ADITYA LOGO2.png"
                        alt="Aditya University Logo"
                        className="brand-logo-img logo-for-light"
                    />
                    <img
                        src="/Aditya University Gold Logo.png"
                        alt="Aditya University Logo"
                        className="brand-logo-img logo-for-dark"
                    />
                </div>

                {feedback.message && (
                    <div className={`alert-banner alert-${feedback.type}`}>
                        {feedback.type === 'error' ? (
                            <AlertCircle className="alert-icon" size={18} />
                        ) : (
                            <CheckCircle2 className="alert-icon" size={18} />
                        )}
                        <span>{feedback.message}</span>
                    </div>
                )}

                {/* VIEW 1: LOGIN */}
                {viewState === 'login' && (
                    <form onSubmit={handleLoginSubmit} className={`auth-form form-slide-${slideDirection}`}>
                        <div className="floating-input-group">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder=" "
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="email">Email Address</label>
                        </div>

                        <div className="floating-input-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                placeholder=" "
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="password">Password</label>
                            <button
                                type="button"
                                className="toggle-password-btn floating-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                title={showPassword ? 'Hide Password' : 'Show Password'}
                            >
                                {showPassword ? <Unlock size={18} /> : <Lock size={18} />}
                            </button>
                            <div className="forgot-password-row">
                                <a
                                    href="#forgot"
                                    className="forgot-password-link"
                                    onClick={handleForgotPasswordClick}
                                >
                                    Forgot Password?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="spinner" size={20} />
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                <span>Login</span>
                            )}
                        </button>
                    </form>
                )}

                {/* VIEW 2: STEP 1 - ENTER 4-DIGIT OTP ONLY */}
                {viewState === 'enter_otp' && (
                    <form onSubmit={handleVerifyOtpSubmit} className={`auth-form form-slide-${slideDirection}`}>
                        <div className="otp-boxes-container">
                            <span className="otp-boxes-label">Enter 4-Digit OTP</span>
                            
                            {isOtpSuccess ? (
                                <div className="otp-success-merged-container">
                                    <div className="otp-success-circle">
                                        <Check size={32} className="otp-success-check-icon" />
                                    </div>
                                    <span className="otp-success-text">OTP Verified</span>
                                </div>
                            ) : (
                                <div className={`otp-boxes-group ${isOtpError ? 'shake-error' : ''}`} onPaste={handleOtpPaste}>
                                    {otpDigits.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-box-${index}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="otp-box-input"
                                            required
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {!isOtpSuccess && (
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="spinner" size={20} />
                                        <span>Verifying OTP...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={18} />
                                        <span>Verify OTP</span>
                                    </>
                                )}
                            </button>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                className="back-to-login-btn"
                                onClick={() => {
                                    setSlideDirection('left');
                                    setViewState('login');
                                    setIsOtpSuccess(false);
                                    setFeedback({ type: null, message: '' });
                                }}
                            >
                                <ArrowLeft size={16} />
                                <span>Back to Login</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* VIEW 3: STEP 2 - NEW PASSWORD & CONFIRM NEW PASSWORD */}
                {viewState === 'new_password' && (
                    <form onSubmit={handleNewPasswordSubmit} className={`auth-form form-slide-${slideDirection}`}>
                        {/* New Password */}
                        <div className="floating-input-group">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                placeholder=" "
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="newPassword">New Password</label>
                            <button
                                type="button"
                                className="toggle-password-btn floating-toggle"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                tabIndex={-1}
                                title={showNewPassword ? 'Hide Password' : 'Show Password'}
                            >
                                {showNewPassword ? <Unlock size={18} /> : <Lock size={18} />}
                            </button>
                        </div>

                        {/* Confirm New Password */}
                        <div className="floating-input-group">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder=" "
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <button
                                type="button"
                                className="toggle-password-btn floating-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                                title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                            >
                                {showConfirmPassword ? <Unlock size={18} /> : <Lock size={18} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="spinner" size={20} />
                                    <span>Updating Password...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    <span>Update Password</span>
                                </>
                            )}
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                className="back-to-login-btn"
                                onClick={() => {
                                    setSlideDirection('left');
                                    setViewState('login');
                                    setIsOtpSuccess(false);
                                    setFeedback({ type: null, message: '' });
                                }}
                            >
                                <ArrowLeft size={16} />
                                <span>Back to Login</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
