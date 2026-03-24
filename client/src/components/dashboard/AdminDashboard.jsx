import { useState, useEffect } from 'react';
import './AdminDashboard.css';
import AdminAcademicRecords from '../records/AdminAcademicRecords';
import AdminEmotionalRecords from '../records/AdminEmotionalRecords';
import AcademicInsights from './AcademicInsights';
import CounsellingBooking from './CounsellingBooking';
import {
    FaUsers, FaBook, FaBrain, FaUserTie, FaSearch,
    FaUserShield, FaGraduationCap, FaChevronRight,
    FaPlus, FaTrash, FaTimes, FaUserPlus, FaKey, FaChalkboardTeacher,
    FaArrowLeft, FaReact, FaSave, FaCheckCircle, FaCommentDots, FaCalendarCheck
} from 'react-icons/fa';
import { capitalize } from '../../utils/stringUtils';
import ProfileSection from './ProfileSection';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ALLOWED_DOMAIN = '@bitsathy.ac.in';

const defaultAddForm = { name: '', email: '', rollNumber: '', department: '', mentorName: '' };

function AdminDashboard({ activeTab, user }) {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [detailTab, setDetailTab] = useState('academic');
    const [searchQuery, setSearchQuery] = useState('');
    const [mentorSearchQuery, setMentorSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Mentor assign state
    const [mentorName, setMentorName] = useState('');
    const [mentorSaving, setMentorSaving] = useState(false);
    const [mentorSuccess, setMentorSuccess] = useState('');

    // Add Student form
    const [showAddForm, setShowAddForm] = useState(false);
    const [addForm, setAddForm] = useState(defaultAddForm);
    const [addError, setAddError] = useState('');
    const [addLoading, setAddLoading] = useState(false);

    // Reset password (students)
    const [rpNew, setRpNew] = useState('');
    const [rpConfirm, setRpConfirm] = useState('');
    const [rpError, setRpError] = useState('');
    const [rpSuccess, setRpSuccess] = useState('');
    const [rpLoading, setRpLoading] = useState(false);

    // Mentors
    const [mentors, setMentors] = useState([]);
    const [showAddMentorForm, setShowAddMentorForm] = useState(false);
    const [mentorForm, setMentorForm] = useState({ name: '', email: '', department: '' });
    const [mentorError, setMentorError] = useState('');
    const [mentorLoading, setMentorLoading] = useState(false);

    // Selected Mentor (view assigned students)
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [mentorStudents, setMentorStudents] = useState([]);
    const [loadingMentorStudents, setLoadingMentorStudents] = useState(false);

    // Mentor password reset
    const [mrpNew, setMrpNew] = useState('');
    const [mrpConfirm, setMrpConfirm] = useState('');
    const [mrpError, setMrpError] = useState('');
    const [mrpSuccess, setMrpSuccess] = useState('');
    const [mrpLoading, setMrpLoading] = useState(false);

    // Mentor Feedback
    const [mentorFeedbacks, setMentorFeedbacks] = useState([]);
    const [loadingFeedback, setLoadingFeedback] = useState(false);

    // Main panel view: 'student' | 'mentor'
    const [panelView, setPanelView] = useState(null);

    // Sync sidebar activeTab with panelView
    useEffect(() => {
        if (activeTab === 'students' && panelView !== 'student') {
            setSelectedStudent(null);
            setSelectedMentor(null);
            setPanelView(null);
        }
        if (activeTab === 'mentors' && panelView !== 'mentor') {
            setSelectedStudent(null);
            setSelectedMentor(null);
            setPanelView(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => { fetchStudents(); fetchMentors(); }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/students`);
            const data = await res.json();
            setStudents(data || []);
        } catch (e) { console.error('Error fetching students:', e); }
        setLoading(false);
    };

    const fetchMentors = async () => {
        try {
            const res = await fetch(`${API_URL}/mentors`);
            const data = await res.json();
            setMentors(data || []);
        } catch (e) { console.error('Error fetching mentors:', e); }
    };

    // ===== Student Actions =====
    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setSelectedMentor(null);
        setPanelView('student');
        setMentorName(student.mentorName || '');
        setMentorSuccess('');
        setRpNew(''); setRpConfirm(''); setRpError(''); setRpSuccess('');
        setDetailTab('academic');

        fetchMentorFeedback(student.id);
    };

    const fetchMentorFeedback = async (studentId) => {
        setLoadingFeedback(true);
        try {
            const res = await fetch(`${API_URL}/mentors/feedback/${studentId}`);
            const data = await res.json();
            setMentorFeedbacks(data || []);
        } catch (e) { console.error('Error fetching mentor feedback:', e); }
        setLoadingFeedback(false);
    };

    const handleAddFormChange = (e) => {
        setAddForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setAddError('');
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setAddError('');
        if (!addForm.email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
            setAddError(`Email must end with ${ALLOWED_DOMAIN}`);
            return;
        }
        if (!addForm.name || !addForm.rollNumber) {
            setAddError('Name and Roll Number are required');
            return;
        }
        setAddLoading(true);
        try {
            const res = await fetch(`${API_URL}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addForm)
            });
            const data = await res.json();
            if (!res.ok) { setAddError(data.error || 'Failed to add student'); }
            else {
                setStudents(prev => [data, ...prev]);
                setAddForm(defaultAddForm);
                setShowAddForm(false);
                handleSelectStudent(data);
            }
        } catch (err) { setAddError('Server error. Please try again.'); }
        setAddLoading(false);
    };

    const handleRemoveStudent = async (student) => {
        if (!window.confirm(`Remove ${capitalize(student.name)} from the system? This will also delete all their records.`)) return;
        try {
            await fetch(`${API_URL}/students/${student.id}`, { method: 'DELETE' });
            setStudents(prev => prev.filter(s => s.id !== student.id));
            if (selectedStudent?.id === student.id) { setSelectedStudent(null); setPanelView(null); }
        } catch (e) { console.error('Error removing student:', e); }
    };

    const handleMentorSave = async () => {
        if (!selectedStudent) return;
        setMentorSaving(true);
        setMentorSuccess('');
        try {
            const res = await fetch(`${API_URL}/students/${selectedStudent.id}/mentor`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mentorName })
            });
            if (res.ok) {
                setMentorSuccess('Mentor name saved successfully!');
                setStudents(prev => prev.map(s =>
                    s.id === selectedStudent.id ? { ...s, mentorName } : s
                ));
                setSelectedStudent(prev => ({ ...prev, mentorName }));
            }
        } catch (e) { console.error('Error saving mentor:', e); }
        setMentorSaving(false);
    };

    const handleAdminResetPassword = async (e) => {
        e.preventDefault();
        setRpError(''); setRpSuccess('');
        if (rpNew.length < 6) { setRpError('Password must be at least 6 characters'); return; }
        if (rpNew !== rpConfirm) { setRpError('Passwords do not match'); return; }
        setRpLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/admin-change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: selectedStudent.email, newPassword: rpNew })
            });
            const data = await res.json();
            if (!res.ok) setRpError(data.error || 'Failed to reset password');
            else { setRpSuccess('Password reset successfully!'); setRpNew(''); setRpConfirm(''); }
        } catch { setRpError('Server error. Please try again.'); }
        setRpLoading(false);
    };

    // ===== Mentor Actions =====
    const handleAddMentor = async (e) => {
        e.preventDefault();
        setMentorError('');
        if (!mentorForm.name || !mentorForm.email) {
            setMentorError('Name and email are required');
            return;
        }
        setMentorLoading(true);
        try {
            const res = await fetch(`${API_URL}/mentors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mentorForm)
            });
            const data = await res.json();
            if (!res.ok) { setMentorError(data.error || 'Failed to add mentor'); }
            else {
                setMentors(prev => [data, ...prev]);
                setMentorForm({ name: '', email: '', department: '' });
                setShowAddMentorForm(false);
            }
        } catch (err) { setMentorError('Server error. Please try again.'); }
        setMentorLoading(false);
    };

    const handleRemoveMentor = async (mentor) => {
        if (!window.confirm(`Remove mentor ${capitalize(mentor.name)}? This will not affect assigned students.`)) return;
        try {
            await fetch(`${API_URL}/mentors/${mentor.id}`, { method: 'DELETE' });
            setMentors(prev => prev.filter(m => m.id !== mentor.id));
            if (selectedMentor?.id === mentor.id) { setSelectedMentor(null); setPanelView(null); }
        } catch (e) { console.error('Error removing mentor:', e); }
    };

    const handleSelectMentor = async (mentor) => {
        setSelectedMentor(mentor);
        setSelectedStudent(null);
        setPanelView('mentor');
        setMrpNew(''); setMrpConfirm(''); setMrpError(''); setMrpSuccess('');
        setLoadingMentorStudents(true);
        try {
            const res = await fetch(`${API_URL}/mentors/students/${encodeURIComponent(mentor.name)}`);
            const data = await res.json();
            setMentorStudents(data || []);
        } catch (e) { console.error(e); }
        setLoadingMentorStudents(false);
    };

    const handleMentorResetPassword = async (e) => {
        e.preventDefault();
        setMrpError(''); setMrpSuccess('');
        if (mrpNew.length < 6) { setMrpError('Password must be at least 6 characters'); return; }
        if (mrpNew !== mrpConfirm) { setMrpError('Passwords do not match'); return; }
        setMrpLoading(true);
        try {
            const res = await fetch(`${API_URL}/mentors/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: selectedMentor.email, newPassword: mrpNew })
            });
            const data = await res.json();
            if (!res.ok) setMrpError(data.error || 'Failed to reset password');
            else { setMrpSuccess('Mentor password reset successfully!'); setMrpNew(''); setMrpConfirm(''); }
        } catch { setMrpError('Server error. Please try again.'); }
        setMrpLoading(false);
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.rollNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMentors = mentors.filter(m =>
        m.name.toLowerCase().includes(mentorSearchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(mentorSearchQuery.toLowerCase())
    );

    return (
        <div className="admin-container">
            {/* ===== Single Sidebar (shows Students or Mentors based on global sidebar tab) ===== */}
            <div className="admin-single-sidebar">

                {/* --- Students Column --- */}
                {activeTab === 'students' && (
                <div className="admin-sidebar-col admin-sidebar-students">
                    <div className="sidebar-col-header">
                        <FaGraduationCap className="sidebar-col-icon" />
                        <div>
                            <h3>Students</h3>
                            <span>{students.length} enrolled</span>
                        </div>
                    </div>

                    <div className="sidebar-col-actions">
                        <button
                            className="btn-sidebar-action btn-add-green"
                            onClick={() => { setShowAddForm(v => !v); setAddError(''); setAddForm(defaultAddForm); }}
                        >
                            {showAddForm ? <><FaTimes size={10} /> Cancel</> : <><FaUserPlus size={10} /> Add</>}
                        </button>
                    </div>

                    {showAddForm && (
                        <div className="sidebar-mini-form">
                            {addError && <div className="sidebar-form-error">{addError}</div>}
                            <form onSubmit={handleAddStudent}>
                                <input type="text" name="name" placeholder="Full Name *" value={addForm.name} onChange={handleAddFormChange} required />
                                <input type="email" name="email" placeholder={`Email (${ALLOWED_DOMAIN}) *`} value={addForm.email} onChange={handleAddFormChange} required />
                                {addForm.email.length > 0 && !addForm.email.toLowerCase().endsWith(ALLOWED_DOMAIN) && (
                                    <span className="sidebar-email-hint">Must end with {ALLOWED_DOMAIN}</span>
                                )}
                                <input type="text" name="rollNumber" placeholder="Roll Number *" value={addForm.rollNumber} onChange={handleAddFormChange} required />
                                <input type="text" name="department" placeholder="Department" value={addForm.department} onChange={handleAddFormChange} />
                                <input type="text" name="mentorName" placeholder="Mentor Name" value={addForm.mentorName} onChange={handleAddFormChange} />
                                <button type="submit" className="btn-sidebar-submit" disabled={addLoading}>
                                    {addLoading ? '...' : <><FaPlus size={10} /> Add</>}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="sidebar-col-search">
                        <FaSearch className="sidebar-search-icon" />
                        <input
                            type="text" placeholder="Search students..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="sidebar-col-list">
                        {loading ? (
                            <div className="sidebar-empty">Loading...</div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="sidebar-empty">No students found</div>
                        ) : (
                            filteredStudents.map(student => (
                                <div
                                    key={student.id}
                                    className={`sidebar-list-item ${panelView === 'student' && selectedStudent?.id === student.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectStudent(student)}
                                >
                                    <div className="sidebar-item-avatar student-gradient">
                                        {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="sidebar-item-info">
                                        <span className="sidebar-item-name">{capitalize(student.name)}</span>
                                        <span className="sidebar-item-sub">{student.rollNumber}</span>
                                    </div>
                                    <button
                                        className="btn-sidebar-remove"
                                        title="Remove"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student); }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                )}

                {/* --- Mentors Column --- */}
                {activeTab === 'mentors' && (
                <div className="admin-sidebar-col admin-sidebar-mentors">
                    <div className="sidebar-col-header mentor-header">
                        <FaChalkboardTeacher className="sidebar-col-icon" />
                        <div>
                            <h3>Mentors</h3>
                            <span>{mentors.length} registered</span>
                        </div>
                    </div>

                    <div className="sidebar-col-actions">
                        <button
                            className="btn-sidebar-action btn-add-blue"
                            onClick={() => { setShowAddMentorForm(v => !v); setMentorError(''); setMentorForm({ name: '', email: '', department: '' }); }}
                        >
                            {showAddMentorForm ? <><FaTimes size={10} /> Cancel</> : <><FaPlus size={10} /> Add</>}
                        </button>
                    </div>

                    {showAddMentorForm && (
                        <div className="sidebar-mini-form">
                            {mentorError && <div className="sidebar-form-error">{mentorError}</div>}
                            <form onSubmit={handleAddMentor}>
                                <input type="text" placeholder="Mentor Name *" required value={mentorForm.name}
                                    onChange={e => setMentorForm(p => ({ ...p, name: e.target.value }))} />
                                <input type="email" placeholder="Mentor Email *" required value={mentorForm.email}
                                    onChange={e => setMentorForm(p => ({ ...p, email: e.target.value }))} />
                                <input type="text" placeholder="Department" value={mentorForm.department}
                                    onChange={e => setMentorForm(p => ({ ...p, department: e.target.value }))} />
                                <button type="submit" className="btn-sidebar-submit btn-submit-blue" disabled={mentorLoading}>
                                    {mentorLoading ? '...' : <><FaPlus size={10} /> Add</>}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="sidebar-col-search">
                        <FaSearch className="sidebar-search-icon" />
                        <input
                            type="text" placeholder="Search mentors..."
                            value={mentorSearchQuery} onChange={e => setMentorSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="sidebar-col-list">
                        {filteredMentors.length === 0 ? (
                            <div className="sidebar-empty">{mentors.length === 0 ? 'No mentors yet' : 'No match'}</div>
                        ) : (
                            filteredMentors.map(m => (
                                <div
                                    key={m.id}
                                    className={`sidebar-list-item ${panelView === 'mentor' && selectedMentor?.id === m.id ? 'selected-mentor' : ''}`}
                                    onClick={() => handleSelectMentor(m)}
                                >
                                    <div className="sidebar-item-avatar mentor-gradient">
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="sidebar-item-info">
                                        <span className="sidebar-item-name">{capitalize(m.name)}</span>
                                        <span className="sidebar-item-sub">{m.email}</span>
                                    </div>
                                    <button
                                        className="btn-sidebar-remove"
                                        title="Remove"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveMentor(m); }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                )}
            </div>

            {/* ===== Main Panel ===== */}
            <div className="admin-main">
                {/* --- Welcome / No Selection --- */}
                {!panelView && (
                    <div className="admin-welcome">
                        <div className="admin-welcome-icon">
                            <FaUserShield size={72} />
                        </div>
                        <h2>Admin Dashboard</h2>
                        <p>Select a <strong>student</strong> to manage records, or a <strong>mentor</strong> to view assigned students and manage their account.</p>
                        <div className="welcome-stats">
                            <div className="welcome-stat">
                                <FaUsers />
                                <span>{students.length}</span>
                                <label>Students</label>
                            </div>
                            <div className="welcome-stat stat-mentor">
                                <FaChalkboardTeacher />
                                <span>{mentors.length}</span>
                                <label>Mentors</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Student Panel --- */}
                {panelView === 'student' && selectedStudent && (
                    <>
                        <div className="admin-student-header">
                            <div className="admin-student-avatar-lg">
                                {selectedStudent.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="admin-student-info">
                                <h2>{capitalize(selectedStudent.name)}</h2>
                                <p>{selectedStudent.rollNumber} • {selectedStudent.department || 'N/A'}</p>
                                <p className="admin-student-email">{selectedStudent.email}</p>
                                {selectedStudent.mentorName && (
                                    <p className="admin-mentor-display">
                                        <FaUserTie style={{ marginRight: '6px' }} />
                                        Mentor: {selectedStudent.mentorName}
                                    </p>
                                )}
                            </div>
                            <button
                                className="btn-remove-header"
                                onClick={() => handleRemoveStudent(selectedStudent)}
                                title="Remove this student"
                            >
                                <FaTrash style={{ marginRight: '6px' }} /> Remove
                            </button>
                        </div>

                        <div className="admin-tabs">
                            <button className={`admin-tab ${detailTab === 'academic' ? 'active' : ''}`} onClick={() => setDetailTab('academic')}>
                                <FaBook style={{ marginRight: '8px' }} /> CGPA & Academic
                            </button>
                            <button className={`admin-tab ${detailTab === 'emotional' ? 'active' : ''}`} onClick={() => setDetailTab('emotional')}>
                                <FaBrain style={{ marginRight: '8px' }} /> EI Report
                            </button>
                            <button className={`admin-tab ${detailTab === 'mlinsights' ? 'active' : ''}`} onClick={() => setDetailTab('mlinsights')}>
                                <FaReact style={{ marginRight: '8px' }} /> Smart Analytics
                            </button>
                            <button className={`admin-tab ${detailTab === 'mentor' ? 'active' : ''}`} onClick={() => setDetailTab('mentor')}>
                                <FaUserTie style={{ marginRight: '8px' }} /> Assign Mentor
                            </button>
                            <button className={`admin-tab ${detailTab === 'mentorfeedback' ? 'active' : ''}`} onClick={() => setDetailTab('mentorfeedback')}>
                                <FaCommentDots style={{ marginRight: '8px' }} /> Mentor Feedback
                            </button>
                            <button className={`admin-tab ${detailTab === 'password' ? 'active' : ''}`} onClick={() => { setDetailTab('password'); setRpError(''); setRpSuccess(''); }}>
                                <FaKey style={{ marginRight: '8px' }} /> Reset Password
                            </button>
                            <button className={`admin-tab ${detailTab === 'counselling' ? 'active' : ''}`} onClick={() => setDetailTab('counselling')}>
                                <FaCalendarCheck style={{ marginRight: '8px' }} /> Counselling
                            </button>
                        </div>

                        <div className="admin-tab-content">
                            {detailTab === 'academic' && <AdminAcademicRecords studentId={selectedStudent.id} />}
                            {detailTab === 'emotional' && <AdminEmotionalRecords studentId={selectedStudent.id} />}
                            {detailTab === 'mlinsights' && <AcademicInsights studentId={selectedStudent.id} studentName={selectedStudent.name} />}
                            {detailTab === 'mentor' && (
                                <div className="mentor-section">
                                    <div className="mentor-card">
                                        <div className="mentor-card-header">
                                            <FaUserTie size={32} color="#7c3aed" />
                                            <div>
                                                <h3>Assign Mentor</h3>
                                                <p>Set or update the mentor name for {capitalize(selectedStudent.name)}</p>
                                            </div>
                                        </div>
                                        {mentorSuccess && <div className="mentor-success"><FaCheckCircle style={{ marginRight: '6px' }} /> {mentorSuccess}</div>}
                                        <div className="mentor-input-group">
                                            <label htmlFor="mentorName">Mentor Name</label>
                                            <input id="mentorName" type="text" value={mentorName}
                                                onChange={e => { setMentorName(e.target.value); setMentorSuccess(''); }}
                                                placeholder="Enter mentor's full name" />
                                        </div>
                                        <button className="btn-save-mentor" onClick={handleMentorSave} disabled={mentorSaving}>
                                            {mentorSaving ? 'Saving...' : <><FaSave style={{ marginRight: '6px' }} /> Save Mentor Name</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {detailTab === 'mentorfeedback' && (
                                <div className="mentor-section">
                                    <div className="mentor-card">
                                        <div className="mentor-card-header">
                                            <FaCommentDots size={32} color="#0ea5e9" />
                                            <div>
                                                <h3>Mentor Feedback</h3>
                                                <p>Feedback left by {selectedStudent.mentorName || 'mentors'} for {capitalize(selectedStudent.name)}.</p>
                                            </div>
                                        </div>
                                        
                                        {loadingFeedback ? (
                                            <div style={{ padding: '20px', color: '#64748b' }}>Loading feedback...</div>
                                        ) : mentorFeedbacks.length === 0 ? (
                                            <div style={{ padding: '20px', color: '#64748b', background: '#f0f7ff', borderRadius: '10px', marginTop: '16px', border: '1px solid #dbeafe' }}>No feedback given to this student yet.</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                                                {mentorFeedbacks.map(fb => (
                                                    <div key={fb.id} style={{ background: '#f0f7ff', padding: '16px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <strong style={{ color: '#0ea5e9' }}><FaUserTie style={{ marginRight: '6px' }} /> {fb.mentorName}</strong>
                                                            <span style={{ fontSize: '13px', color: '#64748b' }}>
                                                              {new Date(fb.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p style={{ margin: 0, color: '#334155', fontSize: '15px', lineHeight: '1.5' }}>{fb.feedback}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {detailTab === 'password' && (
                                <div className="mentor-section">
                                    <div className="mentor-card">
                                        <div className="mentor-card-header">
                                            <FaKey size={30} color="#4f46e5" />
                                            <div>
                                                <h3>Reset Student Password</h3>
                                                <p>Set a new password for {capitalize(selectedStudent.name)}.</p>
                                            </div>
                                        </div>
                                        {rpError && <div className="mentor-success" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>{rpError}</div>}
                                        {rpSuccess && <div className="mentor-success"><FaCheckCircle style={{ marginRight: '6px' }} /> {rpSuccess}</div>}
                                        <form onSubmit={handleAdminResetPassword}>
                                            <div className="mentor-input-group">
                                                <label>New Password</label>
                                                <input type="password" value={rpNew}
                                                    onChange={e => { setRpNew(e.target.value); setRpError(''); setRpSuccess(''); }}
                                                    placeholder="Min 6 characters" required minLength={6} />
                                            </div>
                                            <div className="mentor-input-group">
                                                <label>Confirm New Password</label>
                                                <input type="password" value={rpConfirm}
                                                    onChange={e => { setRpConfirm(e.target.value); setRpError(''); setRpSuccess(''); }}
                                                    placeholder="Re-enter new password" required />
                                                {rpConfirm.length > 0 && rpNew !== rpConfirm && (
                                                    <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>Passwords do not match</div>
                                                )}
                                            </div>
                                            <button type="submit" className="btn-save-mentor" disabled={rpLoading}>
                                                {rpLoading ? 'Resetting...' : <><FaKey style={{ marginRight: '6px' }} /> Reset Password</>}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                            {detailTab === 'counselling' && (
                                <div className="mentor-section">
                                    <CounsellingBooking
                                        studentId={selectedStudent.id}
                                        studentName={selectedStudent.name}
                                        studentEmail={selectedStudent.email}
                                        bookedByRole="admin"
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* --- Mentor Panel (view assigned students + reset password) --- */}
                {panelView === 'mentor' && selectedMentor && (
                    <div className="mentor-panel-view">
                        <div className="mentor-panel-header">
                            <div className="mentor-panel-avatar">
                                {selectedMentor.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="mentor-panel-info">
                                <h2>{capitalize(selectedMentor.name)}</h2>
                                <p>{selectedMentor.email} {selectedMentor.department ? `• ${selectedMentor.department}` : ''}</p>
                                <span className="mentor-panel-badge">
                                    <FaChalkboardTeacher style={{ marginRight: '6px' }} /> Mentor
                                </span>
                            </div>
                            <button className="btn-remove-header" onClick={() => handleRemoveMentor(selectedMentor)} title="Remove this mentor">
                                <FaTrash style={{ marginRight: '6px' }} /> Remove
                            </button>
                        </div>

                        <div className="mentor-panel-body">
                            {/* Assigned Students */}
                            <div className="mentor-panel-section">
                                <h3><FaUsers style={{ marginRight: '8px', color: '#0ea5e9' }} />
                                    Assigned Students
                                    <span className="mentor-panel-count">{mentorStudents.length}</span>
                                </h3>
                                {loadingMentorStudents ? (
                                    <div className="mentor-panel-loading">Loading students...</div>
                                ) : mentorStudents.length === 0 ? (
                                    <div className="mentor-panel-empty">
                                        No students assigned to {capitalize(selectedMentor.name)} yet.
                                        <br /><small>Assign students by editing their "Assign Mentor" field.</small>
                                    </div>
                                ) : (
                                    <div className="mentor-assigned-grid">
                                        {mentorStudents.map(s => (
                                            <div key={s.id} className="mentor-assigned-card"
                                                onClick={() => handleSelectStudent(s)}>
                                                <div className="assigned-avatar">{s.name.charAt(0).toUpperCase()}</div>
                                                <div className="assigned-info">
                                                    <span className="assigned-name">{capitalize(s.name)}</span>
                                                    <span className="assigned-roll">{s.rollNumber} • {s.department || 'N/A'}</span>
                                                    <span className="assigned-email">{s.email}</span>
                                                </div>
                                                <FaChevronRight className="assigned-chevron" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Reset Mentor Password */}
                            <div className="mentor-panel-section">
                                <h3><FaKey style={{ marginRight: '8px', color: '#7c3aed' }} />Reset Mentor Password</h3>
                                <div className="mentor-card">
                                    <div className="mentor-card-header">
                                        <FaKey size={26} color="#0ea5e9" />
                                        <div>
                                            <h3 style={{ fontSize: '16px' }}>Set New Password</h3>
                                            <p>Set a new password for {capitalize(selectedMentor.name)}.</p>
                                        </div>
                                    </div>
                                    {mrpError && <div className="mentor-success" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>{mrpError}</div>}
                                    {mrpSuccess && <div className="mentor-success"><FaCheckCircle style={{ marginRight: '6px' }} /> {mrpSuccess}</div>}
                                    <form onSubmit={handleMentorResetPassword}>
                                        <div className="mentor-input-group">
                                            <label>New Password</label>
                                            <input type="password" value={mrpNew}
                                                onChange={e => { setMrpNew(e.target.value); setMrpError(''); setMrpSuccess(''); }}
                                                placeholder="Min 6 characters" required minLength={6} />
                                        </div>
                                        <div className="mentor-input-group">
                                            <label>Confirm New Password</label>
                                            <input type="password" value={mrpConfirm}
                                                onChange={e => { setMrpConfirm(e.target.value); setMrpError(''); setMrpSuccess(''); }}
                                                placeholder="Re-enter new password" required />
                                            {mrpConfirm.length > 0 && mrpNew !== mrpConfirm && (
                                                <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>Passwords do not match</div>
                                            )}
                                        </div>
                                        <button type="submit" className="btn-save-mentor" style={{ background: 'linear-gradient(135deg, #0284c7, #0ea5e9)' }} disabled={mrpLoading}>
                                            {mrpLoading ? 'Resetting...' : <><FaKey style={{ marginRight: '6px' }} /> Reset Mentor Password</>}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- My Profile Panel (Admin) --- */}
            {activeTab === 'myprofile' && (
                <div className="admin-main" style={{ flex: 1, padding: '24px' }}>
                    <ProfileSection user={user} />
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
