import { useState, useEffect } from 'react';
import './ProfileSection.css';
import {
    FaUserCircle, FaEnvelope, FaIdCard, FaBook, FaUserTie,
    FaKey, FaEye, FaEyeSlash, FaCheckCircle, FaShieldAlt,
    FaCalendarAlt, FaClock, FaChalkboardTeacher, FaUserShield,
    FaGraduationCap
} from 'react-icons/fa';
import { capitalize } from '../../utils/stringUtils';

const API_URL = 'http://localhost:5000/api';

function ProfileSection({ user, student }) {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Change password state
    const [cpCurrent, setCpCurrent] = useState('');
    const [cpNew, setCpNew] = useState('');
    const [cpConfirm, setCpConfirm] = useState('');
    const [cpError, setCpError] = useState('');
    const [cpSuccess, setCpSuccess] = useState('');
    const [cpLoading, setCpLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const isAdmin = user.role === 'admin';
    const isMentor = user.role === 'mentor';
    const isStudent = !isAdmin && !isMentor;

    useEffect(() => {
        fetchProfile();
    }, [user.email, user.role]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/profile?role=${user.role}&email=${encodeURIComponent(user.email)}`);
            if (res.ok) {
                const data = await res.json();
                setProfileData(data);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
        setLoading(false);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setCpError('');
        setCpSuccess('');
        if (cpNew.length < 6) { setCpError('New password must be at least 6 characters'); return; }
        if (cpNew !== cpConfirm) { setCpError('New passwords do not match'); return; }

        setCpLoading(true);
        try {
            let url = '';
            let body = {};

            if (isAdmin) {
                url = `${API_URL}/auth/admin-change-own-password`;
                body = { currentPassword: cpCurrent, newPassword: cpNew };
            } else if (isMentor) {
                url = `${API_URL}/mentors/change-password`;
                body = { email: user.email, currentPassword: cpCurrent, newPassword: cpNew };
            } else {
                url = `${API_URL}/auth/change-password`;
                body = { email: user.email || student?.email, currentPassword: cpCurrent, newPassword: cpNew };
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) { setCpError(data.error || 'Failed to change password'); }
            else {
                setCpSuccess('Password changed successfully!');
                setCpCurrent(''); setCpNew(''); setCpConfirm('');
            }
        } catch { setCpError('Server error. Please try again.'); }
        setCpLoading(false);
    };

    const getRoleIcon = () => {
        if (isAdmin) return <FaUserShield />;
        if (isMentor) return <FaChalkboardTeacher />;
        return <FaGraduationCap />;
    };

    const getRoleLabel = () => {
        if (isAdmin) return 'Administrator';
        if (isMentor) return 'Mentor';
        return 'Student';
    };

    const getRoleGradient = () => {
        if (isAdmin) return 'linear-gradient(135deg, #7c3aed, #a855f7)';
        if (isMentor) return 'linear-gradient(135deg, #0284c7, #22d3ee)';
        return 'linear-gradient(135deg, #6366f1, #818cf8)';
    };

    if (loading) {
        return <div className="profile-section-loading">Loading profile...</div>;
    }

    const displayName = capitalize(user.name || user.username || 'User');
    const displayEmail = user.email || 'N/A';
    const joinedDate = profileData?.joinedDate
        ? new Date(profileData.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

    return (
        <div className="profile-section-container">
            {/* Profile Hero Card */}
            <div className="profile-hero">
                <div className="profile-hero-bg" style={{ background: getRoleGradient() }} />
                <div className="profile-hero-content">
                    <div className="profile-hero-avatar" style={{ background: getRoleGradient() }}>
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-hero-info">
                        <h2>{displayName}</h2>
                        <p className="profile-hero-email">{displayEmail}</p>
                        <div className="profile-hero-badge" style={{ background: `${getRoleGradient().replace('linear-gradient', 'rgba').replace(/[^,]+,\s*/, '').replace(/[^,]+\)/, '0.2)')}` }}>
                            {getRoleIcon()}
                            <span>{getRoleLabel()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="profile-details-card">
                <h3 className="profile-details-title">
                    <FaUserCircle style={{ marginRight: '8px', color: '#6366f1' }} />
                    Personal Information
                </h3>
                <div className="profile-details-grid">
                    <div className="profile-detail-item">
                        <label><FaUserCircle style={{ marginRight: '6px' }} /> Full Name</label>
                        <span>{displayName}</span>
                    </div>
                    <div className="profile-detail-item">
                        <label><FaEnvelope style={{ marginRight: '6px' }} /> Email Address</label>
                        <span>{displayEmail}</span>
                    </div>
                    <div className="profile-detail-item">
                        <label><FaShieldAlt style={{ marginRight: '6px' }} /> Role</label>
                        <span>{getRoleLabel()}</span>
                    </div>
                    <div className="profile-detail-item">
                        <label><FaCalendarAlt style={{ marginRight: '6px' }} /> Joined</label>
                        <span>{joinedDate}</span>
                    </div>

                    {/* Student-specific details */}
                    {isStudent && student && (
                        <>
                            <div className="profile-detail-item">
                                <label><FaIdCard style={{ marginRight: '6px' }} /> Roll Number</label>
                                <span>{student.rollNumber || 'N/A'}</span>
                            </div>
                            <div className="profile-detail-item">
                                <label><FaBook style={{ marginRight: '6px' }} /> Department</label>
                                <span>{student.department || 'Not specified'}</span>
                            </div>
                            {student.mentorName && (
                                <div className="profile-detail-item profile-detail-full">
                                    <label><FaUserTie style={{ marginRight: '6px' }} /> Assigned Mentor</label>
                                    <span className="profile-mentor-name">{capitalize(student.mentorName)}</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* Mentor-specific details */}
                    {isMentor && profileData?.department && (
                        <div className="profile-detail-item">
                            <label><FaBook style={{ marginRight: '6px' }} /> Department</label>
                            <span>{profileData.department}</span>
                        </div>
                    )}

                    {/* Admin-specific details */}
                    {isAdmin && (
                        <div className="profile-detail-item">
                            <label><FaBook style={{ marginRight: '6px' }} /> Department</label>
                            <span>System Administration</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Change Password */}
            <div className="profile-password-card">
                <div className="profile-password-header">
                    <div className="profile-password-icon-wrap">
                        <FaKey size={22} color="#6366f1" />
                    </div>
                    <div>
                        <h3>Change Password</h3>
                        <p>Update your login password. Minimum 6 characters.</p>
                    </div>
                </div>

                {cpError && <div className="profile-cp-error">{cpError}</div>}
                {cpSuccess && (
                    <div className="profile-cp-success">
                        <FaCheckCircle style={{ marginRight: '6px' }} /> {cpSuccess}
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="profile-cp-form">
                    <div className="profile-cp-field">
                        <label>Current Password</label>
                        <div className="profile-cp-input-wrap">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={cpCurrent}
                                onChange={e => { setCpCurrent(e.target.value); setCpError(''); setCpSuccess(''); }}
                                placeholder="Enter current password"
                                required
                            />
                            <button type="button" className="profile-cp-eye" onClick={() => setShowCurrent(v => !v)}>
                                {showCurrent ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="profile-cp-field">
                        <label>New Password</label>
                        <div className="profile-cp-input-wrap">
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={cpNew}
                                onChange={e => { setCpNew(e.target.value); setCpError(''); setCpSuccess(''); }}
                                placeholder="Min 6 characters"
                                required
                                minLength={6}
                            />
                            <button type="button" className="profile-cp-eye" onClick={() => setShowNew(v => !v)}>
                                {showNew ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="profile-cp-field">
                        <label>Confirm New Password</label>
                        <div className="profile-cp-input-wrap">
                            <input
                                type="password"
                                value={cpConfirm}
                                onChange={e => { setCpConfirm(e.target.value); setCpError(''); setCpSuccess(''); }}
                                placeholder="Re-enter new password"
                                required
                            />
                        </div>
                        {cpConfirm.length > 0 && cpNew !== cpConfirm && (
                            <div className="profile-cp-hint-error">Passwords do not match</div>
                        )}
                        {cpConfirm.length > 0 && cpNew === cpConfirm && cpNew.length >= 6 && (
                            <div className="profile-cp-hint-success">
                                <FaCheckCircle style={{ marginRight: '4px' }} /> Passwords match
                            </div>
                        )}
                    </div>

                    <button type="submit" className="profile-cp-submit" disabled={cpLoading}>
                        {cpLoading ? 'Updating...' : <><FaKey style={{ marginRight: '6px' }} /> Update Password</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProfileSection;
