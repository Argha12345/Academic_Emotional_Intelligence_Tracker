import { useState, useEffect } from 'react';
import './AdminDashboard.css';
import AdminAcademicRecords from '../records/AdminAcademicRecords';
import AdminEmotionalRecords from '../records/AdminEmotionalRecords';
import {
    FaUsers, FaBook, FaBrain, FaUserTie, FaSearch,
    FaUserShield, FaGraduationCap, FaChevronRight,
    FaPlus, FaTrash, FaTimes, FaUserPlus, FaKey
} from 'react-icons/fa';
import { capitalize } from '../../utils/stringUtils';

const API_URL = 'http://localhost:5000/api';
const ALLOWED_DOMAIN = '@bitsathy.ac.in';



const defaultAddForm = { name: '', email: '', rollNumber: '', department: '', mentorName: '' };

function AdminDashboard() {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('academic');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Mentor state
    const [mentorName, setMentorName] = useState('');
    const [mentorSaving, setMentorSaving] = useState(false);
    const [mentorSuccess, setMentorSuccess] = useState('');

    // Add Student form
    const [showAddForm, setShowAddForm] = useState(false);
    const [addForm, setAddForm] = useState(defaultAddForm);
    const [addError, setAddError] = useState('');
    const [addLoading, setAddLoading] = useState(false);

    // Reset password (admin)
    const [rpNew, setRpNew] = useState('');
    const [rpConfirm, setRpConfirm] = useState('');
    const [rpError, setRpError] = useState('');
    const [rpSuccess, setRpSuccess] = useState('');
    const [rpLoading, setRpLoading] = useState(false);

    useEffect(() => { fetchStudents(); }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/students`);
            const data = await res.json();
            setStudents(data || []);
        } catch (e) {
            console.error('Error fetching students:', e);
        }
        setLoading(false);
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setMentorName(student.mentorName || '');
        setMentorSuccess('');
        setRpNew(''); setRpConfirm(''); setRpError(''); setRpSuccess('');
        setActiveTab('academic');
    };

    // ===== Add Student =====
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
            if (!res.ok) {
                setAddError(data.error || 'Failed to add student');
            } else {
                setStudents(prev => [data, ...prev]);
                setAddForm(defaultAddForm);
                setShowAddForm(false);
                // Auto-select the newly added student
                handleSelectStudent(data);
            }
        } catch (err) {
            setAddError('Server error. Please try again.');
        }
        setAddLoading(false);
    };

    // ===== Remove Student =====
    const handleRemoveStudent = async (student) => {
        if (!window.confirm(`Remove ${capitalize(student.name)} from the system? This will also delete all their records.`)) return;
        try {
            await fetch(`${API_URL}/students/${student.id}`, { method: 'DELETE' });
            setStudents(prev => prev.filter(s => s.id !== student.id));
            if (selectedStudent?.id === student.id) setSelectedStudent(null);
        } catch (e) {
            console.error('Error removing student:', e);
        }
    };

    // ===== Mentor =====
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
        } catch (e) {
            console.error('Error saving mentor:', e);
        }
        setMentorSaving(false);
    };

    // Admin Reset Student Password
    const handleAdminResetPassword = async (e) => {
        e.preventDefault();
        setRpError(''); setRpSuccess('');
        if (rpNew.length < 6) { setRpError('Password must be at least 6 characters'); return; }
        if (rpNew !== rpConfirm) { setRpError('Passwords do not match'); return; }
        setRpLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/admin-change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: selectedStudent.email, newPassword: rpNew })
            });
            const data = await res.json();
            if (!res.ok) setRpError(data.error || 'Failed to reset password');
            else { setRpSuccess('✅ Password reset successfully!'); setRpNew(''); setRpConfirm(''); }
        } catch { setRpError('Server error. Please try again.'); }
        setRpLoading(false);
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.rollNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="admin-container">
            {/* ===== Sidebar ===== */}
            <div className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <FaUserShield className="sidebar-icon" />
                    <div>
                        <h2>Admin Panel</h2>
                        <p>{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
                    </div>
                </div>

                {/* Add Student Button */}
                <div className="sidebar-add-section">
                    <button
                        className="btn-add-student-sidebar"
                        onClick={() => { setShowAddForm(v => !v); setAddError(''); setAddForm(defaultAddForm); }}
                    >
                        {showAddForm
                            ? <><FaTimes style={{ marginRight: '6px' }} /> Cancel</>
                            : <><FaUserPlus style={{ marginRight: '6px' }} /> Add Student</>
                        }
                    </button>
                </div>

                {/* Add Student Mini-Form */}
                {showAddForm && (
                    <div className="add-student-form">
                        <h4><FaUsers style={{ marginRight: '6px' }} />New Student</h4>
                        {addError && <div className="add-form-error">{addError}</div>}
                        <form onSubmit={handleAddStudent}>
                            <div className="add-form-field">
                                <input
                                    type="text" name="name" placeholder="Full Name *"
                                    value={addForm.name} onChange={handleAddFormChange} required
                                />
                            </div>
                            <div className="add-form-field">
                                <input
                                    type="email" name="email"
                                    placeholder={`Email (${ALLOWED_DOMAIN}) *`}
                                    value={addForm.email} onChange={handleAddFormChange} required
                                />
                                {addForm.email.length > 0 && !addForm.email.toLowerCase().endsWith(ALLOWED_DOMAIN) && (
                                    <span className="email-domain-hint">Must end with {ALLOWED_DOMAIN}</span>
                                )}
                            </div>
                            <div className="add-form-field">
                                <input
                                    type="text" name="rollNumber" placeholder="Roll Number *"
                                    value={addForm.rollNumber} onChange={handleAddFormChange} required
                                />
                            </div>
                            <div className="add-form-field">
                                <input
                                    type="text" name="department" placeholder="Department (optional)"
                                    value={addForm.department} onChange={handleAddFormChange}
                                />
                            </div>
                            <div className="add-form-field">
                                <input
                                    type="text" name="mentorName" placeholder="Mentor Name (optional)"
                                    value={addForm.mentorName} onChange={handleAddFormChange}
                                />
                            </div>
                            <button type="submit" className="btn-submit-add" disabled={addLoading}>
                                {addLoading ? 'Adding...' : <><FaPlus style={{ marginRight: '5px' }} />Add Student</>}
                            </button>
                        </form>
                    </div>
                )}

                {/* Search */}
                <div className="student-search">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Student List */}
                <div className="student-list-admin">
                    {loading ? (
                        <div className="admin-loading">Loading students...</div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="admin-empty">No students found</div>
                    ) : (
                        filteredStudents.map(student => (
                            <div
                                key={student.id}
                                className={`student-list-item ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                                onClick={() => handleSelectStudent(student)}
                            >
                                <div className="student-avatar">
                                    {student.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="student-list-info">
                                    <span className="student-list-name">{capitalize(student.name)}</span>
                                    <span className="student-list-roll">{student.rollNumber}</span>
                                </div>
                                <button
                                    className="btn-remove-student"
                                    title="Remove student"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student); }}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ===== Main Panel ===== */}
            <div className="admin-main">
                {!selectedStudent ? (
                    <div className="admin-welcome">
                        <div className="admin-welcome-icon">
                            <FaGraduationCap size={80} />
                        </div>
                        <h2>Select a Student</h2>
                        <p>Choose a student from the left panel to view and edit their academic records, emotional intelligence reports, and mentor assignment.</p>
                        <div className="welcome-stats">
                            <div className="welcome-stat">
                                <FaUsers />
                                <span>{students.length}</span>
                                <label>Total Students</label>
                            </div>
                            <div className="welcome-stat">
                                <FaUserPlus />
                                <span style={{ color: '#10b981' }}>+</span>
                                <label>Use sidebar to add</label>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Student header */}
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
                                <FaTrash style={{ marginRight: '6px' }} /> Remove Student
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="admin-tabs">
                            <button
                                className={`admin-tab ${activeTab === 'academic' ? 'active' : ''}`}
                                onClick={() => setActiveTab('academic')}
                            >
                                <FaBook style={{ marginRight: '8px' }} /> CGPA & Academic
                            </button>
                            <button
                                className={`admin-tab ${activeTab === 'emotional' ? 'active' : ''}`}
                                onClick={() => setActiveTab('emotional')}
                            >
                                <FaBrain style={{ marginRight: '8px' }} /> EI Report
                            </button>
                            <button
                                className={`admin-tab ${activeTab === 'mentor' ? 'active' : ''}`}
                                onClick={() => setActiveTab('mentor')}
                            >
                                <FaUserTie style={{ marginRight: '8px' }} /> Assign Mentor
                            </button>
                            <button
                                className={`admin-tab ${activeTab === 'password' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('password'); setRpError(''); setRpSuccess(''); }}
                            >
                                <FaKey style={{ marginRight: '8px' }} /> Reset Password
                            </button>
                        </div>

                        {/* Tab content */}
                        <div className="admin-tab-content">
                            {activeTab === 'academic' && (
                                <AdminAcademicRecords studentId={selectedStudent.id} />
                            )}
                            {activeTab === 'emotional' && (
                                <AdminEmotionalRecords studentId={selectedStudent.id} />
                            )}
                            {activeTab === 'mentor' && (
                                <div className="mentor-section">
                                    <div className="mentor-card">
                                        <div className="mentor-card-header">
                                            <FaUserTie size={32} color="#7c3aed" />
                                            <div>
                                                <h3>Assign Mentor</h3>
                                                <p>Set or update the mentor name for {capitalize(selectedStudent.name)}</p>
                                            </div>
                                        </div>
                                        {mentorSuccess && (
                                            <div className="mentor-success">{mentorSuccess}</div>
                                        )}
                                        <div className="mentor-input-group">
                                            <label htmlFor="mentorName">Mentor Name</label>
                                            <input
                                                id="mentorName"
                                                type="text"
                                                value={mentorName}
                                                onChange={e => { setMentorName(e.target.value); setMentorSuccess(''); }}
                                                placeholder="Enter mentor's full name"
                                            />
                                        </div>
                                        <button
                                            className="btn-save-mentor"
                                            onClick={handleMentorSave}
                                            disabled={mentorSaving}
                                        >
                                            {mentorSaving ? 'Saving...' : '💾 Save Mentor Name'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'password' && (
                                <div className="mentor-section">
                                    <div className="mentor-card">
                                        <div className="mentor-card-header">
                                            <FaKey size={30} color="#4f46e5" />
                                            <div>
                                                <h3>Reset Student Password</h3>
                                                <p>Set a new password for {capitalize(selectedStudent.name)}. They will use it on next login.</p>
                                            </div>
                                        </div>
                                        {rpError && <div className="mentor-success" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>{rpError}</div>}
                                        {rpSuccess && <div className="mentor-success">{rpSuccess}</div>}
                                        <form onSubmit={handleAdminResetPassword}>
                                            <div className="mentor-input-group">
                                                <label>New Password</label>
                                                <input
                                                    type="password"
                                                    value={rpNew}
                                                    onChange={e => { setRpNew(e.target.value); setRpError(''); setRpSuccess(''); }}
                                                    placeholder="Min 6 characters"
                                                    required minLength={6}
                                                />
                                            </div>
                                            <div className="mentor-input-group">
                                                <label>Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={rpConfirm}
                                                    onChange={e => { setRpConfirm(e.target.value); setRpError(''); setRpSuccess(''); }}
                                                    placeholder="Re-enter new password"
                                                    required
                                                />
                                                {rpConfirm.length > 0 && rpNew !== rpConfirm && (
                                                    <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>Passwords do not match</div>
                                                )}
                                            </div>
                                            <button type="submit" className="btn-save-mentor" disabled={rpLoading}>
                                                {rpLoading ? 'Resetting...' : '🔐 Reset Password'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
