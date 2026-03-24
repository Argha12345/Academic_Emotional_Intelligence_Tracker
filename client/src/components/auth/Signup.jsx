import { useState } from 'react';
import './Login.css';
import { FaUserPlus, FaUser, FaEnvelope, FaKey, FaArrowRight, FaInfoCircle } from 'react-icons/fa';

const ALLOWED_DOMAIN = '@bitsathy.ac.in';

function Signup({ onLogin, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Domain validation
        if (!formData.email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
            setError(`Only ${ALLOWED_DOMAIN} email addresses are allowed`);
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Signup failed');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onLogin(data.user);
        } catch (err) {
            setError('Server connection failed. Make sure the backend is running.');
        }
        setLoading(false);
    };

    const emailValid = formData.email.length > 0 && formData.email.toLowerCase().endsWith(ALLOWED_DOMAIN);
    const emailTouched = formData.email.length > 0;

    return (
        <div className="auth-page signup-page">
            <div className="auth-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon"><FaUserPlus size={40} color="#667eea" /></div>
                    <h1>Create Account</h1>
                    <p>Join the Academic EI Tracker</p>
                </div>

                {/* Domain notice */}
                <div className="domain-notice">
                    <FaInfoCircle style={{ marginRight: '6px', flexShrink: 0 }} />
                    Only <strong>{ALLOWED_DOMAIN}</strong> emails are accepted
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <span className="input-icon"><FaUser /></span>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your full name"
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label>College Email</label>
                        <div className="input-wrapper">
                            <span className="input-icon"><FaEnvelope /></span>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder={`you${ALLOWED_DOMAIN}`}
                                required
                                className={emailTouched ? (emailValid ? 'input-valid' : 'input-invalid') : ''}
                            />
                        </div>
                        {emailTouched && !emailValid && (
                            <div className="field-hint error-hint">
                                Must end with {ALLOWED_DOMAIN}
                            </div>
                        )}
                        {emailTouched && emailValid && (
                            <div className="field-hint success-hint">✓ Valid college email</div>
                        )}
                    </div>

                    <div className="auth-field">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon"><FaKey /></span>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Min 6 characters"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label>Confirm Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon"><FaKey /></span>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter your password"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? (
                            <span className="spinner"></span>
                        ) : (
                            <>
                                Create Account <FaArrowRight style={{ marginLeft: '8px' }} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <button className="auth-link" onClick={onSwitchToLogin}>
                            Log In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;
