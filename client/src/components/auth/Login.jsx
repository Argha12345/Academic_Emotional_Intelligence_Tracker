import { useState } from 'react';
import './Login.css';
import bitLogo from '../../assets/bit-logo.png';
import {
    FaGraduationCap, FaUserShield, FaEnvelope,
    FaKey, FaUser, FaArrowRight, FaLock, FaUserTie
} from 'react-icons/fa';

const ALLOWED_DOMAIN = '@bitsathy.ac.in';
const API_URL = import.meta.env.VITE_API_URL || 'https://academic-emotional-intelligence-tracker.onrender.com/api';

function Login({ onLogin }) {
    const [role, setRole] = useState('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [adminPass, setAdminPass] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const emailTouched = email.length > 0;
    const emailValid = emailTouched && email.toLowerCase().endsWith(ALLOWED_DOMAIN);
    const emailInvalid = emailTouched && !email.toLowerCase().endsWith(ALLOWED_DOMAIN);

    const handleRoleSwitch = (r) => {
        setRole(r);
        setError('');
        setEmail('');
        setPassword('');
        setUsername('');
        setAdminPass('');
    };

    const handleStudentLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
            setError(`Only ${ALLOWED_DOMAIN} email addresses are allowed`);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase(), password })
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
            document.cookie = `token=${data.token}; path=/; max-age=604800; Secure; SameSite=Strict`;
            onLogin(data.user);
        } catch {
            setError('Server connection failed. Make sure the backend is running.');
        }
        setLoading(false);
    };

    const handleMentorLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/mentors/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase(), password })
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
            document.cookie = `token=${data.token}; path=/; max-age=604800; Secure; SameSite=Strict`;
            onLogin(data.user);
        } catch {
            setError('Server connection failed. Make sure the backend is running.');
        }
        setLoading(false);
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: adminPass })
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Admin login failed'); setLoading(false); return; }
            document.cookie = `token=${data.token}; path=/; max-age=604800; Secure; SameSite=Strict`;
            onLogin(data.user);
        } catch {
            setError('Server connection failed. Make sure the backend is running.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            <div className="auth-wrapper">
                {/* ===== White Login Card ===== */}
                <div className="auth-card">
                    {/* BIT Logo inside card */}
                    <div className="auth-logo-wrap">
                        <img src={bitLogo} alt="Bannari Amman Institute of Technology" className="auth-logo-img" />
                    </div>

                    {/* Role Title */}
                    <div className="auth-header">
                        <h1>{role === 'admin' ? 'Admin Login' : role === 'mentor' ? 'Mentor Login' : 'Student Login'}</h1>
                        <p>{role === 'admin' ? 'Access the administration panel' : role === 'mentor' ? 'Access your mentor dashboard' : 'Log in to your EI Tracker'}</p>
                    </div>

                    {/* Role Toggle */}
                    <div className="role-toggle">
                        <button
                            className={`role-btn ${role === 'student' ? 'active' : ''}`}
                            onClick={() => handleRoleSwitch('student')}
                            type="button"
                        >
                            <FaGraduationCap style={{ marginRight: '7px' }} /> Student
                        </button>
                        <button
                            className={`role-btn mentor ${role === 'mentor' ? 'mentor-active' : ''}`}
                            onClick={() => handleRoleSwitch('mentor')}
                            type="button"
                        >
                            <FaUserTie style={{ marginRight: '7px' }} /> Mentor
                        </button>
                        <button
                            className={`role-btn admin ${role === 'admin' ? 'admin-active' : ''}`}
                            onClick={() => handleRoleSwitch('admin')}
                            type="button"
                        >
                            <FaUserShield style={{ marginRight: '7px' }} /> Admin
                        </button>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    {/* Student Form */}
                    {role === 'student' && (
                        <form className="auth-form" onSubmit={handleStudentLogin}>
                            <div className="auth-field">
                                <label>College Email</label>
                                <div className="input-wrapper">
                                    <span className="input-icon"><FaEnvelope /></span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setError(''); }}
                                        placeholder={`you${ALLOWED_DOMAIN}`}
                                        className={emailValid ? 'input-valid' : emailInvalid ? 'input-invalid' : ''}
                                        required
                                    />
                                </div>
                                {emailInvalid && <div className="field-hint error-hint">Must end with {ALLOWED_DOMAIN}</div>}
                                {emailValid && <div className="field-hint success-hint">✓ Valid college email</div>}
                            </div>

                            <div className="auth-field">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon"><FaKey /></span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(''); }}
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="auth-submit" disabled={loading}>
                                {loading ? <span className="spinner"></span> : <>Log In <FaArrowRight style={{ marginLeft: '8px' }} /></>}
                            </button>
                        </form>
                    )}

                    {/* Mentor Form */}
                    {role === 'mentor' && (
                        <form className="auth-form" onSubmit={handleMentorLogin}>
                            <div className="auth-field">
                                <label>Mentor Email</label>
                                <div className="input-wrapper">
                                    <span className="input-icon"><FaEnvelope /></span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setError(''); }}
                                        placeholder="mentor@college.edu"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="auth-field">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon"><FaKey /></span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(''); }}
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="auth-submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #0284c7, #0ea5e9)' }}>
                                {loading ? <span className="spinner"></span> : <>Log In as Mentor <FaArrowRight style={{ marginLeft: '8px' }} /></>}
                            </button>
                        </form>
                    )}

                    {/* Admin Form */}
                    {role === 'admin' && (
                        <form className="auth-form" onSubmit={handleAdminLogin}>
                            <div className="auth-field">
                                <label>Admin Username</label>
                                <div className="input-wrapper">
                                    <span className="input-icon"><FaUser /></span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => { setUsername(e.target.value); setError(''); }}
                                        placeholder="Enter admin username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="auth-field">
                                <label>Admin Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon"><FaKey /></span>
                                    <input
                                        type="password"
                                        value={adminPass}
                                        onChange={e => { setAdminPass(e.target.value); setError(''); }}
                                        placeholder="Enter admin password"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="auth-submit admin-submit" disabled={loading}>
                                {loading ? <span className="spinner"></span> : <>Login as Admin <FaArrowRight style={{ marginLeft: '8px' }} /></>}
                            </button>

                            <div className="admin-note">
                                <FaLock style={{ marginRight: '6px' }} />
                                Admin access is restricted. Contact your system administrator if you need help.
                            </div>
                        </form>
                    )}
                </div>

                {/* ===== College Info - BELOW the card ===== */}
                <div className="auth-college-footer">
                    <div className="auth-college-footer-name">BANNARI AMMAN INSTITUTE OF TECHNOLOGY</div>
                    <div className="auth-college-footer-sub">Stay Ahead</div>
                    <div className="auth-college-footer-strip">
                        <span>Accredited by NAAC</span>
                        <span className="auth-dot">•</span>
                        <span>Recognized by UGC</span>
                        <span className="auth-dot">•</span>
                        <span>BIT, Sathyamangalam</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
