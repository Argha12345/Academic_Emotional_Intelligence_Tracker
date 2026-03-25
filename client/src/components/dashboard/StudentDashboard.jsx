import { useState, useEffect } from 'react';
import './StudentDashboard.css';
import StressFeedback from './StressFeedback';
import AcademicInsights from './AcademicInsights';
import StudyTimetable from './StudyTimetable';
import ProfileSection from './ProfileSection';
import CounsellingBooking from './CounsellingBooking';
import {
  FaUserCircle, FaHeartbeat, FaIdCard,
  FaUserTie, FaKey, FaEye, FaEyeSlash, FaReact, FaCalendarAlt,
  FaEnvelope, FaGraduationCap, FaBook, FaClipboardList, FaCheckCircle, FaCommentDots
} from 'react-icons/fa';
import { capitalize } from '../../utils/stringUtils';

const API_URL = import.meta.env.VITE_API_URL || 'https://09j91kzt-5000.inc1.devtunnels.ms/api';

function StudentDashboard({ student, currentUserEmail, activeTab, setActiveTab, user }) {
  const [academicRecords, setAcademicRecords] = useState([]);
  const [loadingAcademic, setLoadingAcademic] = useState(true);

  const [mentorFeedbacks, setMentorFeedbacks] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Change password state
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { 
    fetchAcademicRecords(); 
    fetchMentorFeedback();
  }, [student.id]);

  const fetchMentorFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const res = await fetch(`${API_URL}/mentors/feedback/${student.id}`);
      const data = await res.json();
      setMentorFeedbacks(data || []);
    } catch (e) { console.error(e); }
    setLoadingFeedback(false);
  };

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
        setCpSuccess('Password changed successfully!');
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
        <div className="student-role-badge"><FaGraduationCap style={{ marginRight: '6px' }} /> Student</div>
      </div>


      {/* Tab Content */}
      <div className="tab-content">
        {/* ---- Dashboard (Academic Records) ---- */}
        {activeTab === 'profile' && (
          <div className="profile-view">
            <div className="profile-section">
              <h3><FaBook style={{ marginRight: '8px', color: '#10b981' }} /> Academic Records</h3>
              <div className="view-only-note">
                <FaClipboardList style={{ marginRight: '8px' }} /> Academic records are managed by your administrator
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

        {/* ---- Mentor Feedback ---- */}
        {activeTab === 'mentorfeedback' && (
          <div className="profile-view">
           <div className="profile-section">
               <h3><FaUserTie style={{ marginRight: '8px', color: '#0ea5e9' }} />Mentor Feedback</h3>
               <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>Feedback and notes left by your assigned mentor regarding your academic and emotional progress.</p>
               {loadingFeedback ? (
                   <div className="profile-loading">Loading feedback...</div>
               ) : mentorFeedbacks.length === 0 ? (
                   <div className="profile-empty">No feedback received from your mentor yet.</div>
               ) : (
                   <div className="mentor-feedback-list">
                       {mentorFeedbacks.map(fb => (
                           <div key={fb.id} className="academic-record-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                   <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center' }}>
                                       <FaUserTie style={{ marginRight: '8px', color: '#0ea5e9' }} />
                                       {capitalize(fb.mentorName)}
                                   </span>
                                   <span style={{ fontSize: '13px', color: '#64748b' }}>
                                       {new Date(fb.createdAt).toLocaleDateString()} • {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                               </div>
                               <p style={{ margin: 0, fontSize: '15px', color: '#334155', lineHeight: '1.6', background: '#f0f7ff', padding: '14px', borderRadius: '10px', width: '100%', border: '1px solid #dbeafe', boxSizing: 'border-box' }}>
                                  {fb.feedback}
                               </p>
                           </div>
                       ))}
                   </div>
               )}
           </div>
          </div>
        )}

        {/* ---- My Profile (with change password) ---- */}
        {activeTab === 'myprofile' && (
          <ProfileSection user={user} student={student} />
        )}

        {/* ---- Counselling Booking ---- */}
        {activeTab === 'counselling' && (
          <div className="counselling-page-layout">
            <CounsellingBooking
              studentId={student.id}
              studentName={student.name}
              studentEmail={student.email}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;