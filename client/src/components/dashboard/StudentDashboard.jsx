import { useState, useEffect } from 'react';
import './StudentDashboard.css';
import StressFeedback from './StressFeedback';
import AcademicInsights from './AcademicInsights';
import StudyTimetable from './StudyTimetable';
import {
  FaUserCircle, FaHeartbeat, FaIdCard,
  FaUserTie, FaKey, FaEye, FaEyeSlash, FaRobot, FaCalendarAlt
} from 'react-icons/fa';
import { capitalize } from '../../utils/stringUtils';

const API_URL = 'http://localhost:5000/api';

function StudentDashboard({ student, currentUserEmail }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [academicRecords, setAcademicRecords] = useState([]);
  const [loadingAcademic, setLoadingAcademic] = useState(true);

  // Change password state
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { fetchAcademicRecords(); }, [student.id]);

  const fetchAcademicRecords = async () => {
    setLoadingAcademic(true);
    try {
      const res = await fetch(`${API_URL}/academic/${student.id}`);
      const data = await res.json();
      setAcademicRecords(data || []);
    } catch (e) { console.error(e); }
    setLoadingAcademic(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');
    if (cpNew.length < 6) { setCpError('New password must be at least 6 characters'); return; }
    if (cpNew !== cpConfirm) { setCpError('New passwords do not match'); return; }

    setCpLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUserEmail || student.email,
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

  const getGpaColor = (gpa) => {
    if (gpa >= 8) return '#10b981';
    if (gpa >= 6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="student-info">
          <div className="student-avatar-display">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1>{capitalize(student.name)}</h1>
            <p className="student-meta">{student.rollNumber} • {student.department || 'N/A'}</p>
            <p className="student-email">{student.email}</p>
            {student.mentorName && (
              <p className="student-mentor">
                <FaUserTie style={{ marginRight: '6px' }} />
                Mentor: <strong>{student.mentorName}</strong>
              </p>
            )}
          </div>
        </div>
        <div className="student-role-badge">👨‍🎓 Student</div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <FaIdCard style={{ marginRight: '8px' }} /> My Profile
        </button>
        <button className={`tab ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
          <FaRobot style={{ marginRight: '8px' }} /> AI Insights
        </button>
        <button className={`tab ${activeTab === 'timetable' ? 'active' : ''}`} onClick={() => setActiveTab('timetable')}>
          <FaCalendarAlt style={{ marginRight: '8px' }} /> Study Timetable
        </button>
        <button className={`tab ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
          <FaHeartbeat style={{ marginRight: '8px' }} /> Stress Feedback
        </button>
        <button className={`tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
          <FaKey style={{ marginRight: '8px' }} /> Change Password
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* ---- Profile ---- */}
        {activeTab === 'profile' && (
          <div className="profile-view">
            <div className="profile-section">
              <h3><FaUserCircle style={{ marginRight: '8px', color: '#4f46e5' }} />Personal Information</h3>
              <div className="profile-grid">
                <div className="profile-field">
                  <label>Full Name</label>
                  <span>{capitalize(student.name)}</span>
                </div>
                <div className="profile-field">
                  <label>Email Address</label>
                  <span>{student.email}</span>
                </div>
                <div className="profile-field">
                  <label>Roll Number</label>
                  <span>{student.rollNumber}</span>
                </div>
                <div className="profile-field">
                  <label>Department</label>
                  <span>{student.department || 'Not specified'}</span>
                </div>
                {student.mentorName && (
                  <div className="profile-field full-width">
                    <label><FaUserTie style={{ marginRight: '4px' }} />Assigned Mentor</label>
                    <span className="mentor-highlight">{student.mentorName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-section">
              <h3><span style={{ marginRight: '8px' }}>📚</span>Academic Records</h3>
              <div className="view-only-note">
                📋 Academic records are managed by your administrator
              </div>
              {loadingAcademic ? (
                <div className="profile-loading">Loading records...</div>
              ) : academicRecords.length === 0 ? (
                <div className="profile-empty">No academic records yet. Contact your administrator.</div>
              ) : (
                <div className="academic-records-view">
                  {academicRecords.map(record => (
                    <div key={record.id} className="academic-record-card">
                      <div className="arc-semester">{record.semester || record.subject || 'N/A'}</div>
                      <div className="arc-stats">
                        <div className="arc-stat">
                          <span className="arc-label">CGPA</span>
                          <span className="arc-value" style={{ color: getGpaColor(record.gpa) }}>
                            {record.gpa !== null ? Number(record.gpa).toFixed(2) : 'N/A'}
                          </span>
                        </div>
                        <div className="arc-stat">
                          <span className="arc-label">Assignment</span>
                          <span className="arc-value">
                            {record.assignmentScore !== null ? `${Number(record.assignmentScore).toFixed(1)}%` : 'N/A'}
                          </span>
                        </div>
                        <div className="arc-stat">
                          <span className="arc-label">Attendance</span>
                          <span className="arc-value">
                            {record.attendancePercentage !== null ? `${Number(record.attendancePercentage).toFixed(1)}%` : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="arc-date">{new Date(record.recordDate).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- AI Insights ---- */}
        {activeTab === 'insights' && <AcademicInsights studentId={student.id} studentName={student.name} />}

        {/* ---- Study Timetable ---- */}
        {activeTab === 'timetable' && <StudyTimetable studentId={student.id} />}

        {/* ---- Stress Feedback ---- */}
        {activeTab === 'feedback' && <StressFeedback studentId={student.id} />}

        {/* ---- Change Password ---- */}
        {activeTab === 'password' && (
          <div className="change-password-section">
            <div className="cp-card">
              <div className="cp-card-header">
                <div className="cp-icon-wrap"><FaKey size={28} color="#4f46e5" /></div>
                <div>
                  <h3>Change Password</h3>
                  <p>Update your login password. Minimum 6 characters.</p>
                </div>
              </div>

              {cpError && <div className="cp-error">{cpError}</div>}
              {cpSuccess && <div className="cp-success">{cpSuccess}</div>}

              <form onSubmit={handleChangePassword} className="cp-form">
                <div className="cp-field">
                  <label>Current Password</label>
                  <div className="cp-input-wrap">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={cpCurrent}
                      onChange={e => { setCpCurrent(e.target.value); setCpError(''); setCpSuccess(''); }}
                      placeholder="Enter current password"
                      required
                    />
                    <button type="button" className="cp-eye" onClick={() => setShowCurrent(v => !v)}>
                      {showCurrent ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="cp-field">
                  <label>New Password</label>
                  <div className="cp-input-wrap">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={cpNew}
                      onChange={e => { setCpNew(e.target.value); setCpError(''); setCpSuccess(''); }}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                    />
                    <button type="button" className="cp-eye" onClick={() => setShowNew(v => !v)}>
                      {showNew ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="cp-field">
                  <label>Confirm New Password</label>
                  <div className="cp-input-wrap">
                    <input
                      type="password"
                      value={cpConfirm}
                      onChange={e => { setCpConfirm(e.target.value); setCpError(''); setCpSuccess(''); }}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                  {cpConfirm.length > 0 && cpNew !== cpConfirm && (
                    <div className="cp-hint-error">Passwords do not match</div>
                  )}
                  {cpConfirm.length > 0 && cpNew === cpConfirm && cpNew.length >= 6 && (
                    <div className="cp-hint-success">✓ Passwords match</div>
                  )}
                </div>

                <button type="submit" className="btn-cp-submit" disabled={cpLoading}>
                  {cpLoading ? 'Updating...' : '🔐 Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;