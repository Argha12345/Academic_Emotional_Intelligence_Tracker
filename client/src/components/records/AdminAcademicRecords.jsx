import { useState, useEffect } from 'react';
import './AdminRecords.css';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

const SEMESTERS = [
    'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
    'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
];

const defaultForm = { semester: '', gpa: '', assignmentScore: '', attendancePercentage: '' };

function AdminAcademicRecords({ studentId }) {
    const [records, setRecords] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecords();
    }, [studentId]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/academic/${studentId}`);
            const data = await res.json();
            setRecords(data || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const gpaVal = parseFloat(formData.gpa);
        if (!formData.semester) { setFormError('Please select a semester'); return; }
        if (isNaN(gpaVal) || gpaVal < 0 || gpaVal > 10) { setFormError('CGPA must be between 0 and 10'); return; }

        const payload = {
            studentId,
            semester: formData.semester,
            gpa: gpaVal,
            assignmentScore: formData.assignmentScore ? parseFloat(formData.assignmentScore) : null,
            attendancePercentage: formData.attendancePercentage ? parseFloat(formData.attendancePercentage) : null
        };

        try {
            if (editId) {
                await fetch(`${API_URL}/academic/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                setEditId(null);
            } else {
                await fetch(`${API_URL}/academic`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            setFormData(defaultForm);
            setShowForm(false);
            setFormError('');
            fetchRecords();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (record) => {
        setFormData({
            semester: record.semester || '',
            gpa: record.gpa !== null ? String(record.gpa) : '',
            assignmentScore: record.assignmentScore !== null ? String(record.assignmentScore) : '',
            attendancePercentage: record.attendancePercentage !== null ? String(record.attendancePercentage) : ''
        });
        setEditId(record.id);
        setShowForm(true);
        setFormError('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this academic record?')) return;
        try {
            await fetch(`${API_URL}/academic/${id}`, { method: 'DELETE' });
            setRecords(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditId(null);
        setFormData(defaultForm);
        setFormError('');
    };

    const getGpaColor = (gpa) => {
        if (gpa >= 8) return '#10b981';
        if (gpa >= 6) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="admin-records">
            <div className="admin-records-header">
                <h3>📚 Academic Records (CGPA)</h3>
                <button className="btn-add-admin" onClick={() => { handleCancel(); setShowForm(true); }}>
                    <FaPlus style={{ marginRight: '6px' }} /> Add Record
                </button>
            </div>

            {showForm && (
                <div className="admin-form-card">
                    <h4>{editId ? '✏️ Edit Academic Record' : '➕ Add Academic Record'}</h4>
                    {formError && <div className="admin-form-error">{formError}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="admin-form-group">
                                <label>Semester *</label>
                                <select name="semester" value={formData.semester} onChange={handleChange} required>
                                    <option value="">Select Semester</option>
                                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label>CGPA * (0 – 10)</label>
                                <input type="number" step="0.01" min="0" max="10" name="gpa"
                                    value={formData.gpa} onChange={handleChange} placeholder="e.g. 7.50" required />
                            </div>
                            <div className="admin-form-group">
                                <label>Assignment Marks (%)</label>
                                <input type="number" step="0.01" min="0" max="100" name="assignmentScore"
                                    value={formData.assignmentScore} onChange={handleChange} placeholder="0 – 100" />
                            </div>
                            <div className="admin-form-group">
                                <label>Attendance (%)</label>
                                <input type="number" step="0.01" min="0" max="100" name="attendancePercentage"
                                    value={formData.attendancePercentage} onChange={handleChange} placeholder="0 – 100" />
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="submit" className="btn-save-admin">
                                <FaSave style={{ marginRight: '6px' }} /> {editId ? 'Update' : 'Save'}
                            </button>
                            <button type="button" className="btn-cancel-admin" onClick={handleCancel}>
                                <FaTimes style={{ marginRight: '6px' }} /> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="admin-records-empty">Loading records...</div>
            ) : records.length === 0 ? (
                <div className="admin-records-empty">No academic records yet. Add one above.</div>
            ) : (
                <div className="admin-records-list">
                    {records.map(record => (
                        <div key={record.id} className="admin-record-item">
                            <div className="admin-record-left">
                                <div className="semester-badge">{record.semester || record.subject || 'N/A'}</div>
                                <div className="record-badges">
                                    <span className="badge-gpa" style={{ background: getGpaColor(record.gpa) + '22', color: getGpaColor(record.gpa), border: `1px solid ${getGpaColor(record.gpa)}44` }}>
                                        CGPA: {record.gpa !== null ? Number(record.gpa).toFixed(2) : 'N/A'}
                                    </span>
                                    <span className="badge-info">
                                        Assignment: {record.assignmentScore !== null ? `${Number(record.assignmentScore).toFixed(1)}%` : 'N/A'}
                                    </span>
                                    <span className="badge-info">
                                        Attendance: {record.attendancePercentage !== null ? `${Number(record.attendancePercentage).toFixed(1)}%` : 'N/A'}
                                    </span>
                                </div>
                                <div className="record-date-admin">{new Date(record.recordDate).toLocaleDateString()}</div>
                            </div>
                            <div className="admin-record-actions">
                                <button className="btn-edit-admin" onClick={() => handleEdit(record)}>
                                    <FaEdit />
                                </button>
                                <button className="btn-delete-admin" onClick={() => handleDelete(record.id)}>
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminAcademicRecords;
