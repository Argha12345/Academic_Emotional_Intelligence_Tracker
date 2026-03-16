import { useState, useEffect } from 'react';
import './MentorDashboard.css';
import StressFeedback from './StressFeedback';
import AcademicInsights from './AcademicInsights';
import {
    FaUserTie, FaUsers, FaSearch, FaBook, FaBrain,
    FaHeartbeat, FaGraduationCap, FaChevronRight,
    FaKey, FaEye, FaEyeSlash, FaIdCard, FaCommentDots,
    FaPaperPlane, FaTrash, FaRobot, FaExclamationTriangle,
    FaBell, FaTimes, FaArrowUp
} from 'react-icons/fa';
import { capitalize } from '../../utils/stringUtils';

const API_URL = 'http://localhost:5000/api';

function MentorDashboard({ user }) {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Academic records
    const [academicRecords, setAcademicRecords] = useState([]);
    const [loadingAcademic, setLoadingAcademic] = useState(false);

    // Emotional records
    const [emotionalRecords, setEmotionalRecords] = useState([]);
    const [loadingEmotional, setLoadingEmotional] = useState(false);

    // Change password
    const [cpCurrent, setCpCurrent] = useState('');
    const [cpNew, setCpNew] = useState('');
    const [cpConfirm, setCpConfirm] = useState('');
    const [cpError, setCpError] = useState('');
    const [cpSuccess, setCpSuccess] = useState('');
    const [cpLoading, setCpLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    // Mentor Feedback
    const [feedbackList, setFeedbackList] = useState([]);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackSending, setFeedbackSending] = useState(false);

    // Sidebar view
    const [sidebarView, setSidebarView] = useState('students'); // 'students' | 'settings'

    // Stress Alerts
    const [stressAlerts, setStressAlerts] = useState([]);
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [alertsLoaded, setAlertsLoaded] = useState(false);

    useEffect(() => { fetchAssignedStudents(); }, [user.name]);
    useEffect(() => { if (user.name) fetchStressAlerts(); }, [user.name]);

    const fetchAssignedStudents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/mentors/students/${encodeURIComponent(user.name)}`);
            const data = await res.json();
            setStudents(data || []);
        } catch (e) {
            console.error('Error fetching assigned students:', e);
        }
        setLoading(false);
    };

    const fetchStressAlerts = async () => {
        try {
            const res = await fetch(`${API_URL}/ml/stress-alerts/${encodeURIComponent(user.name)}`);
            if (res.ok) {
                const data = await res.json();
                setStressAlerts(data.alerts || []);
                setAlertDismissed(false);
            }
        } catch (e) { console.error('Stress alerts error:', e); }
        setAlertsLoaded(true);
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setActiveTab('profile');
        fetchStudentAcademic(student.id);
        fetchStudentEmotional(student.id);
        fetchFeedback(student.id);
    };

    const fetchStudentAcademic = async (studentId) => {
        setLoadingAcademic(true);
        try {
            const res = await fetch(`${API_URL}/academic/${studentId}`);
            const data = await res.json();
            setAcademicRecords(data || []);
        } catch (e) { console.error(e); }
        setLoadingAcademic(false);
    };

    const fetchStudentEmotional = async (studentId) => {
        setLoadingEmotional(true);
        try {
            const res = await fetch(`${API_URL}/emotional/${studentId}`);
            const data = await res.json();
            setEmotionalRecords(data || []);
        } catch (e) { console.error(e); }
        setLoadingEmotional(false);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setCpError(''); setCpSuccess('');
        if (cpNew.length < 6) { setCpError('New password must be at least 6 characters'); return; }
        if (cpNew !== cpConfirm) { setCpError('New passwords do not match'); return; }

        setCpLoading(true);
        try {
            const res = await fetch(`${API_URL}/mentors/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    currentPassword: cpCurrent,
                    newPassword: cpNew
                })
            });
            const data = await res.json();
            if (!res.ok) { setCpError(data.error || 'Failed to change password'); }
            else {
                setCpSuccess('✅ Password changed successfully!');
                setCpCurrent(''); setCpNew(''); setCpConfirm('');
            }
        } catch { setCpError('Server error. Please try again.'); }
        setCpLoading(false);
    };

    // ===== Feedback =====
    const fetchFeedback = async (studentId) => {
        setFeedbackLoading(true);
        try {
            const res = await fetch(`${API_URL}/mentors/feedback/${studentId}`);
            const data = await res.json();
            setFeedbackList(data || []);
        } catch (e) { console.error(e); }
        setFeedbackLoading(false);
    };

    const handleSendFeedback = async () => {
        if (!feedbackText.trim() || !selectedStudent) return;
        setFeedbackSending(true);
        try {
            const res = await fetch(`${API_URL}/mentors/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent.id,
                    mentorName: user.name,
                    feedback: feedbackText.trim()
                })
            });
            const data = await res.json();
            if (res.ok) {
                setFeedbackList(prev => [data, ...prev]);
                setFeedbackText('');
            }
        } catch (e) { console.error(e); }
        setFeedbackSending(false);
    };

    const handleDeleteFeedback = async (id) => {
        try {
            await fetch(`${API_URL}/mentors/feedback/${id}`, { method: 'DELETE' });
            setFeedbackList(prev => prev.filter(f => f.id !== id));
        } catch (e) { console.error(e); }
    };

    const getGpaColor = (gpa) => {
        if (gpa >= 8) return '#10b981';
        if (gpa >= 6) return '#f59e0b';
        return '#ef4444';
    };

    const getEiColor = (score) => {
        if (score >= 7) return '#10b981';
        if (score >= 5) return '#f59e0b';
        return '#ef4444';
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.rollNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="mentor-container">
            {/* ===== Stress Alert Banner ===== */}
            {alertsLoaded && stressAlerts.length > 0 && !alertDismissed && (
                <div className={`mentor-alert-banner mentor-alert-${stressAlerts[0]?.riskLevel}`}>
                    <div className="mentor-alert-banner-left">
                        <FaExclamationTriangle className="mentor-alert-banner-icon" />
                        <div>
                            <strong>⚠️ Stress Alert — {stressAlerts.filter(a => a.riskLevel === 'high').length > 0 ? `${stressAlerts.filter(a => a.riskLevel === 'high').length} high-risk` : `${stressAlerts.length} at-risk`} student{stressAlerts.length > 1 ? 's' : ''} detected</strong>
                            <span> — {stressAlerts.slice(0, 3).map(a => capitalize(a.studentName)).join(', ')}{stressAlerts.length > 3 ? ` +${stressAlerts.length - 3} more` : ''}</span>
                        </div>
                    </div>
                    <div className="mentor-alert-banner-right">
                        <button className="mentor-alert-view-btn" onClick={() => {
                            setSidebarView('alerts');
                            setSelectedStudent(null);
                        }}>
                            <FaBell /> View Alerts
                        </button>
                        <button className="mentor-alert-dismiss" onClick={() => setAlertDismissed(true)} title="Dismiss">
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}

            {/* Sidebar + Main Row */}
            <div className="mentor-inner-body">
            {/* Sidebar */}
            <div className="mentor-sidebar">
                <div className="mentor-sidebar-header">
                    <FaUserTie className="mentor-sidebar-icon" />
                    <div>
                        <h2>Mentor Panel</h2>
                        <p className="mentor-name-display">{capitalize(user.name)}</p>
                        <p>{students.length} student{students.length !== 1 ? 's' : ''} assigned</p>
                    </div>
                </div>

                {/* Sidebar Nav */}
                <div className="mentor-sidebar-nav">
                    <button
                        className={`sidebar-nav-btn ${sidebarView === 'students' ? 'active' : ''}`}
                        onClick={() => setSidebarView('students')}
                    >
                        <FaUsers style={{ marginRight: '8px' }} /> My Students
                    </button>
                    <button
                        className={`sidebar-nav-btn sidebar-alert-btn ${sidebarView === 'alerts' ? 'alert-active' : ''}`}
                        onClick={() => { setSidebarView('alerts'); setSelectedStudent(null); }}
                    >
                        <FaBell style={{ marginRight: '6px' }} /> Alerts
                        {stressAlerts.length > 0 && (
                            <span className="mentor-alert-badge">{stressAlerts.length}</span>
                        )}
                    </button>
                    <button
                        className={`sidebar-nav-btn ${sidebarView === 'settings' ? 'active' : ''}`}
                        onClick={() => { setSidebarView('settings'); setSelectedStudent(null); }}
                    >
                        <FaKey style={{ marginRight: '8px' }} /> Settings
                    </button>
                </div>

                {sidebarView === 'students' && (
                    <>
                        {/* Search */}
                        <div className="mentor-search">
                            <FaSearch className="mentor-search-icon" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Student List */}
                        <div className="mentor-student-list">
                            {loading ? (
                                <div className="mentor-list-empty">Loading students...</div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="mentor-list-empty">
                                    {students.length === 0
                                        ? 'No students assigned yet. Contact admin.'
                                        : 'No matching students found'}
                                </div>
                            ) : (
                                filteredStudents.map(student => (
                                    <div
                                        key={student.id}
                                        className={`mentor-student-item ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                                        onClick={() => handleSelectStudent(student)}
                                    >
                                        <div className="mentor-student-avatar">
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="mentor-student-info">
                                            <span className="mentor-student-name">{capitalize(student.name)}</span>
                                            <span className="mentor-student-roll">{student.rollNumber} • {student.department || 'N/A'}</span>
                                        </div>
                                        <FaChevronRight className="mentor-chevron" />
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {sidebarView === 'settings' && (
                    <div className="mentor-settings-sidebar">
                        <div className="mentor-settings-card">
                            <h4><FaKey style={{ marginRight: '8px' }} />Change Password</h4>
                            {cpError && <div className="mentor-cp-error">{cpError}</div>}
                            {cpSuccess && <div className="mentor-cp-success">{cpSuccess}</div>}
                            <form onSubmit={handleChangePassword}>
                                <div className="mentor-cp-field">
                                    <label>Current Password</label>
                                    <div className="mentor-cp-input-wrap">
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            value={cpCurrent}
                                            onChange={e => { setCpCurrent(e.target.value); setCpError(''); setCpSuccess(''); }}
                                            placeholder="Enter current password"
                                            required
                                        />
                                        <button type="button" className="mentor-cp-eye" onClick={() => setShowCurrent(v => !v)}>
                                            {showCurrent ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>
                                <div className="mentor-cp-field">
                                    <label>New Password</label>
                                    <div className="mentor-cp-input-wrap">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={cpNew}
                                            onChange={e => { setCpNew(e.target.value); setCpError(''); setCpSuccess(''); }}
                                            placeholder="Min 6 characters"
                                            required minLength={6}
                                        />
                                        <button type="button" className="mentor-cp-eye" onClick={() => setShowNew(v => !v)}>
                                            {showNew ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>
                                <div className="mentor-cp-field">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={cpConfirm}
                                        onChange={e => { setCpConfirm(e.target.value); setCpError(''); setCpSuccess(''); }}
                                        placeholder="Re-enter new password"
                                        required
                                    />
                                    {cpConfirm.length > 0 && cpNew !== cpConfirm && (
                                        <div className="mentor-cp-hint-error">Passwords do not match</div>
                                    )}
                                    {cpConfirm.length > 0 && cpNew === cpConfirm && cpNew.length >= 6 && (
                                        <div className="mentor-cp-hint-ok">✓ Passwords match</div>
                                    )}
                                </div>
                                <button type="submit" className="mentor-cp-submit" disabled={cpLoading}>
                                    {cpLoading ? 'Updating...' : '🔐 Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Panel */}
            <div className="mentor-main">
                {/* ===== ALERTS PANEL — shown when sidebarView='alerts', fully separate ===== */}
                {sidebarView === 'alerts' && (
                    <div className="mentor-alerts-panel">
                        <div className="mentor-alerts-panel-header">
                            <div className="mentor-alerts-panel-title">
                                <FaBell className="map-icon" /> Student Stress &amp; Risk Alerts
                            </div>
                            <button className="mentor-alerts-refresh" onClick={fetchStressAlerts} title="Refresh">
                                🔄 Refresh
                            </button>
                        </div>
                        <p className="mentor-alerts-panel-sub">
                            Students with elevated emotional stress or declining academic performance that need your attention.
                        </p>

                        {stressAlerts.length === 0 ? (
                            <div className="mentor-alert-all-ok">
                                <span style={{ fontSize: 48 }}>✅</span>
                                <h4>All Students Are Doing Well!</h4>
                                <p>No elevated stress or risk detected among your assigned students right now.</p>
                            </div>
                        ) : (
                            <div className="mentor-alert-list">
                                {stressAlerts.map(alert => (
                                    <div key={alert.studentId} className={`mentor-alert-card mentor-alert-risk-${alert.riskLevel}`}>
                                        {/* Card Header */}
                                        <div className="mentor-alert-card-header">
                                            <div className="mentor-alert-student-info">
                                                <div className="mentor-alert-avatar" style={{ background: alert.riskColor }}>
                                                    {alert.studentName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="mentor-alert-name">{capitalize(alert.studentName)}</div>
                                                    <div className="mentor-alert-roll">{alert.rollNumber} • {alert.department || 'N/A'}</div>
                                                </div>
                                            </div>
                                            <div className="mentor-alert-right">
                                                <div className="mentor-alert-risk-badge"
                                                    style={{ background: `${alert.riskColor}22`, color: alert.riskColor, border: `1px solid ${alert.riskColor}55` }}>
                                                    <FaExclamationTriangle style={{ marginRight: 5 }} />{alert.riskLabel}
                                                </div>
                                                <button
                                                    className="mentor-alert-view-student"
                                                    onClick={() => {
                                                        const student = students.find(s => s.id === alert.studentId);
                                                        if (student) {
                                                            handleSelectStudent(student);
                                                            setSidebarView('students');
                                                            setActiveTab('profile');
                                                        }
                                                    }}
                                                >
                                                    View Full Profile →
                                                </button>
                                            </div>
                                        </div>

                                        {/* Quick Stats */}
                                        <div className="mentor-alert-metrics">
                                            {alert.avgEi !== null && (
                                                <div className="mentor-metric-chip">
                                                    <span className="mentor-metric-label">🧠 EI Score</span>
                                                    <span className="mentor-metric-val" style={{ color: alert.avgEi < 5 ? '#ef4444' : '#f59e0b' }}>{alert.avgEi}/10</span>
                                                </div>
                                            )}
                                            {alert.avgGpa !== null && (
                                                <div className="mentor-metric-chip">
                                                    <span className="mentor-metric-label">🎓 Avg CGPA</span>
                                                    <span className="mentor-metric-val" style={{ color: alert.avgGpa < 5 ? '#ef4444' : '#f59e0b' }}>{alert.avgGpa}/10</span>
                                                </div>
                                            )}
                                            {alert.eiTrend === 'declining' && (
                                                <div className="mentor-metric-chip trend-bad">
                                                    <FaArrowUp style={{ transform: 'rotate(180deg)', marginRight: 4 }} />
                                                    <span>Stress Increasing</span>
                                                </div>
                                            )}
                                            <div className="mentor-metric-chip">
                                                <span className="mentor-metric-label">⚠ Risk Score</span>
                                                <span className="mentor-metric-val" style={{ color: alert.riskColor }}>{alert.riskScore}/100</span>
                                            </div>
                                        </div>

                                        {/* Stress Reasons — highlighted section */}
                                        {alert.reasons.length > 0 && (
                                            <div className="mentor-alert-reasons-section">
                                                <div className="mentor-alert-reasons-title">📋 Stress &amp; Risk Factors:</div>
                                                <div className="mentor-alert-reasons">
                                                    {alert.reasons.map((r, i) => (
                                                        <span key={i} className={`mentor-alert-reason ${alert.riskLevel === 'high' ? 'reason-high' : 'reason-moderate'}`}>
                                                            ⚠ {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ===== Normal student/welcome view (only when not in alerts mode) ===== */}
                {sidebarView !== 'alerts' && !selectedStudent && (
                    <div className="mentor-welcome">
                        <div className="mentor-welcome-icon">
                            <FaUserTie size={72} />
                        </div>
                        <h2>Welcome, {capitalize(user.name)}</h2>
                        <p>Select a student from the sidebar to view their academic performance, emotional intelligence reports, and stress feedback.</p>
                        <div className="mentor-welcome-stats">
                            <div className="mentor-welcome-stat">
                                <FaUsers />
                                <span>{students.length}</span>
                                <label>Assigned Students</label>
                            </div>
                            <div className="mentor-welcome-stat">
                                <FaGraduationCap />
                                <span style={{ color: '#10b981' }}>📊</span>
                                <label>View Reports</label>
                            </div>
                        </div>
                        {students.length === 0 && (
                            <div className="mentor-no-students-notice">
                                <p>You don't have any students assigned yet. Ask your administrator to assign students to you via the Admin Panel.</p>
                            </div>
                        )}
                    </div>
                )}
                {sidebarView !== 'alerts' && selectedStudent && (
                    <>
                        {/* Student Header */}
                        <div className="mentor-student-header">
                            <div className="mentor-student-avatar-lg">
                                {selectedStudent.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="mentor-student-header-info">
                                <h2>{capitalize(selectedStudent.name)}</h2>
                                <p>{selectedStudent.rollNumber} • {selectedStudent.department || 'N/A'}</p>
                                <p className="mentor-student-email">{selectedStudent.email}</p>
                            </div>
                            <div className="mentor-student-role-badge">👨‍🎓 Student</div>
                        </div>

                        {/* Tabs — NO Stress Alerts tab here, alerts are a separate top-level view */}
                        <div className="mentor-tabs">
                            <button
                                className={`mentor-tab ${activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveTab('profile')}
                            >
                                <FaIdCard style={{ marginRight: '8px' }} /> Profile &amp; Academics
                            </button>
                            <button
                                className={`mentor-tab ${activeTab === 'emotional' ? 'active' : ''}`}
                                onClick={() => setActiveTab('emotional')}
                            >
                                <FaBrain style={{ marginRight: '8px' }} /> EI Records
                            </button>
                            <button
                                className={`mentor-tab ${activeTab === 'mlinsights' ? 'active' : ''}`}
                                onClick={() => setActiveTab('mlinsights')}
                            >
                                <FaRobot style={{ marginRight: '8px' }} /> AI Insights
                            </button>
                            <button
                                className={`mentor-tab ${activeTab === 'feedback' ? 'active' : ''}`}
                                onClick={() => setActiveTab('feedback')}
                            >
                                <FaHeartbeat style={{ marginRight: '8px' }} /> Stress Feedback
                            </button>
                            <button
                                className={`mentor-tab ${activeTab === 'mentorfeedback' ? 'active' : ''}`}
                                onClick={() => setActiveTab('mentorfeedback')}
                            >
                                <FaCommentDots style={{ marginRight: '8px' }} /> My Feedback
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="mentor-tab-content">
                            {/* Profile & Academic Records Tab */}
                            {activeTab === 'profile' && (
                                <div className="mentor-profile-view">
                                    {/* Personal info card */}
                                    <div className="mentor-info-card">
                                        <h3><FaIdCard style={{ marginRight: '8px', color: '#4f46e5' }} />Personal Information</h3>
                                        <div className="mentor-info-grid">
                                            <div className="mentor-info-field">
                                                <label>Full Name</label>
                                                <span>{capitalize(selectedStudent.name)}</span>
                                            </div>
                                            <div className="mentor-info-field">
                                                <label>Email Address</label>
                                                <span>{selectedStudent.email}</span>
                                            </div>
                                            <div className="mentor-info-field">
                                                <label>Roll Number</label>
                                                <span>{selectedStudent.rollNumber}</span>
                                            </div>
                                            <div className="mentor-info-field">
                                                <label>Department</label>
                                                <span>{selectedStudent.department || 'Not specified'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Academic records */}
                                    <div className="mentor-info-card">
                                        <h3><FaBook style={{ marginRight: '8px', color: '#7c3aed' }} />Academic Records</h3>
                                        {loadingAcademic ? (
                                            <div className="mentor-record-loading">Loading academic records...</div>
                                        ) : academicRecords.length === 0 ? (
                                            <div className="mentor-record-empty">No academic records available for this student.</div>
                                        ) : (
                                            <div className="mentor-academic-grid">
                                                {academicRecords.map(record => (
                                                    <div key={record.id} className="mentor-academic-card">
                                                        <div className="m-arc-semester">{record.semester || record.subject || 'N/A'}</div>
                                                        <div className="m-arc-stats">
                                                            <div className="m-arc-stat">
                                                                <span className="m-arc-label">CGPA</span>
                                                                <span className="m-arc-value" style={{ color: getGpaColor(record.gpa) }}>
                                                                    {record.gpa !== null ? Number(record.gpa).toFixed(2) : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className="m-arc-stat">
                                                                <span className="m-arc-label">Assignment</span>
                                                                <span className="m-arc-value">
                                                                    {record.assignmentScore !== null ? `${Number(record.assignmentScore).toFixed(1)}%` : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className="m-arc-stat">
                                                                <span className="m-arc-label">Attendance</span>
                                                                <span className="m-arc-value">
                                                                    {record.attendancePercentage !== null ? `${Number(record.attendancePercentage).toFixed(1)}%` : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="m-arc-date">{new Date(record.recordDate).toLocaleDateString()}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Emotional Records Tab */}
                            {activeTab === 'emotional' && (
                                <div className="mentor-emotional-view">
                                    <div className="mentor-info-card">
                                        <h3><FaBrain style={{ marginRight: '8px', color: '#7c3aed' }} />Emotional Intelligence Records</h3>
                                        {loadingEmotional ? (
                                            <div className="mentor-record-loading">Loading emotional records...</div>
                                        ) : emotionalRecords.length === 0 ? (
                                            <div className="mentor-record-empty">No emotional intelligence records available for this student.</div>
                                        ) : (
                                            <div className="mentor-ei-grid">
                                                {emotionalRecords.map(record => (
                                                    <div key={record.id} className="mentor-ei-card">
                                                        <div className="mentor-ei-header">
                                                            <span className="mentor-ei-date">
                                                                {new Date(record.recordDate).toLocaleDateString()}
                                                            </span>
                                                            <span className="mentor-ei-overall" style={{ color: getEiColor(record.overallScore) }}>
                                                                Overall: {record.overallScore !== null ? Number(record.overallScore).toFixed(1) : 'N/A'}/10
                                                            </span>
                                                        </div>
                                                        <div className="mentor-ei-bars">
                                                            {[
                                                                { label: 'Self Awareness', value: record.selfAwareness },
                                                                { label: 'Self Regulation', value: record.selfRegulation },
                                                                { label: 'Motivation', value: record.motivation },
                                                                { label: 'Empathy', value: record.empathy },
                                                                { label: 'Social Skills', value: record.socialSkills },
                                                            ].map((dim) => (
                                                                <div key={dim.label} className="mentor-ei-bar-row">
                                                                    <span className="mentor-ei-bar-label">{dim.label}</span>
                                                                    <div className="mentor-ei-bar-track">
                                                                        <div
                                                                            className="mentor-ei-bar-fill"
                                                                            style={{
                                                                                width: `${(dim.value || 0) * 10}%`,
                                                                                background: getEiColor(dim.value)
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <span className="mentor-ei-bar-value">{dim.value ?? 'N/A'}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {record.notes && (
                                                            <div className="mentor-ei-notes">
                                                                <strong>Notes:</strong> {record.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ML Insights Tab */}
                            {activeTab === 'mlinsights' && (
                                <AcademicInsights studentId={selectedStudent.id} studentName={selectedStudent.name} />
                            )}

                            {/* Stress Feedback Tab */}
                            {activeTab === 'feedback' && (
                                <StressFeedback studentId={selectedStudent.id} />
                            )}

                            {/* Stress Alerts Tab */}
                            {activeTab === 'stressalerts' && (
                                <div className="mentor-stress-alerts-view">
                                    <div className="mentor-info-card">
                                        <h3><FaBell style={{ marginRight: '8px', color: '#ef4444' }} />Student Stress &amp; Risk Alerts</h3>
                                        <p className="mentor-alert-subtitle">Students with elevated emotional stress or academic risk that require your attention.</p>
                                        {stressAlerts.length === 0 ? (
                                            <div className="mentor-alert-all-ok">
                                                <span style={{ fontSize: 36 }}>✅</span>
                                                <h4>All Students are Doing Well!</h4>
                                                <p>No elevated stress or risk detected among your assigned students at this time.</p>
                                            </div>
                                        ) : (
                                            <div className="mentor-alert-list">
                                                {stressAlerts.map(alert => (
                                                    <div key={alert.studentId} className={`mentor-alert-card mentor-alert-risk-${alert.riskLevel}`}>
                                                        <div className="mentor-alert-card-header">
                                                            <div className="mentor-alert-student-info">
                                                                <div className="mentor-alert-avatar" style={{ background: alert.riskColor }}>
                                                                    {alert.studentName.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="mentor-alert-name">{capitalize(alert.studentName)}</div>
                                                                    <div className="mentor-alert-roll">{alert.rollNumber} • {alert.department || 'N/A'}</div>
                                                                </div>
                                                            </div>
                                                            <div className="mentor-alert-right">
                                                                <div className="mentor-alert-risk-badge" style={{ background: `${alert.riskColor}22`, color: alert.riskColor, border: `1px solid ${alert.riskColor}55` }}>
                                                                    <FaExclamationTriangle style={{ marginRight: 5 }} />{alert.riskLabel}
                                                                </div>
                                                                <button
                                                                    className="mentor-alert-view-student"
                                                                    onClick={() => {
                                                                        const student = students.find(s => s.id === alert.studentId);
                                                                        if (student) { handleSelectStudent(student); setActiveTab('profile'); }
                                                                    }}
                                                                >
                                                                    View Student →
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="mentor-alert-metrics">
                                                            {alert.avgEi !== null && (
                                                                <div className="mentor-metric-chip">
                                                                    <span className="mentor-metric-label">EI Score</span>
                                                                    <span className="mentor-metric-val" style={{ color: alert.avgEi < 5 ? '#ef4444' : '#f59e0b' }}>{alert.avgEi}/10</span>
                                                                </div>
                                                            )}
                                                            {alert.avgGpa !== null && (
                                                                <div className="mentor-metric-chip">
                                                                    <span className="mentor-metric-label">Avg CGPA</span>
                                                                    <span className="mentor-metric-val" style={{ color: alert.avgGpa < 5 ? '#ef4444' : '#f59e0b' }}>{alert.avgGpa}/10</span>
                                                                </div>
                                                            )}
                                                            {alert.eiTrend === 'declining' && (
                                                                <div className="mentor-metric-chip trend-bad">
                                                                    <FaArrowUp style={{ transform: 'rotate(180deg)', marginRight: 4 }} />
                                                                    <span>Stress Increasing</span>
                                                                </div>
                                                            )}
                                                            <div className="mentor-metric-chip">
                                                                <span className="mentor-metric-label">Risk Score</span>
                                                                <span className="mentor-metric-val" style={{ color: alert.riskColor }}>{alert.riskScore}/100</span>
                                                            </div>
                                                        </div>
                                                        {alert.reasons.length > 0 && (
                                                            <div className="mentor-alert-reasons">
                                                                {alert.reasons.map((r, i) => (
                                                                    <span key={i} className="mentor-alert-reason">⚠ {r}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Mentor Feedback Tab */}
                            {activeTab === 'mentorfeedback' && (
                                <div className="mentor-feedback-view">
                                    <div className="mentor-info-card">
                                        <h3><FaCommentDots style={{ marginRight: '8px', color: '#0ea5e9' }} />Leave Feedback for {capitalize(selectedStudent.name)}</h3>
                                        <div className="mentor-feedback-compose">
                                            <textarea
                                                className="mentor-feedback-input"
                                                placeholder="Write a short feedback or note for this student..."
                                                value={feedbackText}
                                                onChange={e => setFeedbackText(e.target.value)}
                                                maxLength={500}
                                                rows={3}
                                            />
                                            <div className="mentor-feedback-compose-footer">
                                                <span className="mentor-feedback-charcount">{feedbackText.length}/500</span>
                                                <button
                                                    className="mentor-feedback-send"
                                                    onClick={handleSendFeedback}
                                                    disabled={feedbackSending || !feedbackText.trim()}
                                                >
                                                    {feedbackSending ? 'Sending...' : <><FaPaperPlane style={{ marginRight: '6px' }} /> Send Feedback</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mentor-info-card" style={{ marginTop: '18px' }}>
                                        <h3><FaCommentDots style={{ marginRight: '8px', color: '#7c3aed' }} />Previous Feedback</h3>
                                        {feedbackLoading ? (
                                            <div className="mentor-record-loading">Loading feedback...</div>
                                        ) : feedbackList.length === 0 ? (
                                            <div className="mentor-record-empty">No feedback given yet for this student.</div>
                                        ) : (
                                            <div className="mentor-feedback-list">
                                                {feedbackList.map(fb => (
                                                    <div key={fb.id} className="mentor-feedback-item">
                                                        <div className="mentor-feedback-item-header">
                                                            <span className="mentor-feedback-author">
                                                                <FaUserTie style={{ marginRight: '5px' }} />
                                                                {capitalize(fb.mentorName)}
                                                            </span>
                                                            <span className="mentor-feedback-date">
                                                                {new Date(fb.createdAt).toLocaleDateString()} • {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="mentor-feedback-text">{fb.feedback}</p>
                                                        {fb.mentorName.toLowerCase() === user.name.toLowerCase() && (
                                                            <button
                                                                className="mentor-feedback-delete"
                                                                onClick={() => handleDeleteFeedback(fb.id)}
                                                                title="Delete this feedback"
                                                            >
                                                                <FaTrash /> Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            </div>
        </div>
    );
}

export default MentorDashboard;
