import { useState, useEffect } from 'react';
import './AdminRecords.css';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaBrain, FaCog, FaBullseye, FaHeart, FaHandshake } from 'react-icons/fa';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL = 'http://localhost:5000/api';

const defaultForm = {
    selfAwareness: 5, selfRegulation: 5, motivation: 5,
    empathy: 5, socialSkills: 5, notes: ''
};

const dimensions = [
    { name: 'selfAwareness', label: <><FaBrain style={{ marginRight: '6px' }} /> Self Awareness</> },
    { name: 'selfRegulation', label: <><FaCog style={{ marginRight: '6px' }} /> Self Regulation</> },
    { name: 'motivation', label: <><FaBullseye style={{ marginRight: '6px' }} /> Motivation</> },
    { name: 'empathy', label: <><FaHeart style={{ marginRight: '6px', color: '#ef4444' }} /> Empathy</> },
    { name: 'socialSkills', label: <><FaHandshake style={{ marginRight: '6px' }} /> Social Skills</> }
];

function AdminEmotionalRecords({ studentId }) {
    const [records, setRecords] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchRecords(); }, [studentId]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/emotional/${studentId}`);
            const data = await res.json();
            setRecords(data || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'notes' ? value : parseInt(value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { studentId, ...formData };
        try {
            if (editId) {
                await fetch(`${API_URL}/emotional/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                setEditId(null);
            } else {
                await fetch(`${API_URL}/emotional`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            setFormData(defaultForm);
            setShowForm(false);
            fetchRecords();
        } catch (err) { console.error(err); }
    };

    const handleEdit = (record) => {
        setFormData({
            selfAwareness: record.selfAwareness,
            selfRegulation: record.selfRegulation,
            motivation: record.motivation,
            empathy: record.empathy,
            socialSkills: record.socialSkills,
            notes: record.notes || ''
        });
        setEditId(record.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this EI record?')) return;
        try {
            await fetch(`${API_URL}/emotional/${id}`, { method: 'DELETE' });
            setRecords(prev => prev.filter(r => r.id !== id));
        } catch (e) { console.error(e); }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditId(null);
        setFormData(defaultForm);
    };

    const getColor = (score) => {
        if (score >= 8) return '#10b981';
        if (score >= 6) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="admin-records">
            <div className="admin-records-header">
                <h3><FaBrain style={{ marginRight: '6px' }} /> Emotional Intelligence Report</h3>
                <button className="btn-add-admin" onClick={() => { handleCancel(); setShowForm(true); }}>
                    <FaPlus style={{ marginRight: '6px' }} /> Add Record
                </button>
            </div>

            {showForm && (
                <div className="admin-form-card">
                    <h4>{editId ? '✏️ Edit EI Record' : '➕ Add EI Record'}</h4>
                    <p style={{ color: '#64748b', fontSize: '13px', marginTop: 0 }}>Rate each dimension on a scale of 1-10</p>
                    <form onSubmit={handleSubmit}>
                        <div className="ei-sliders-admin">
                            {dimensions.map(d => (
                                <div key={d.name} className="ei-slider-row">
                                    <label>{d.label}</label>
                                    <div className="ei-slider-input">
                                        <input
                                            type="range" min="1" max="10"
                                            name={d.name} value={formData[d.name]}
                                            onChange={handleChange}
                                        />
                                        <span className="ei-score-badge" style={{ background: getColor(formData[d.name]) }}>
                                            {formData[d.name]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label>Notes / Observations</label>
                            <textarea
                                name="notes" value={formData.notes} onChange={handleChange}
                                placeholder="Add notes or observations..." rows="3"
                                style={{ width: '100%', resize: 'vertical' }}
                            />
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
                <div className="admin-records-empty">No EI records yet. Add one above.</div>
            ) : (
                <div className="admin-records-list">
                    {records.map(record => (
                        <div key={record.id} className="admin-record-item ei-record" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div className="admin-record-left" style={{ flex: 1 }}>
                                <div className="ei-record-header">
                                    <span className="ei-overall-score" style={{ background: getColor(record.overallScore) }}>
                                        Overall: {record.overallScore ? record.overallScore.toFixed(1) : 'N/A'}/10
                                    </span>
                                    <span className="record-date-admin">{new Date(record.recordDate).toLocaleDateString()}</span>
                                </div>
                                <div className="ei-bars-admin">
                                    {dimensions.map(d => (
                                        <div key={d.name} className="ei-bar-row">
                                            <span className="ei-bar-label">{d.label}</span>
                                            <div className="ei-bar-bottom">
                                                <div className="ei-bar-track">
                                                    <div
                                                        className="ei-bar-fill"
                                                        style={{ width: `${record[d.name] * 10}%`, background: getColor(record[d.name]) }}
                                                    />
                                                </div>
                                                <span className="ei-bar-val">{record[d.name]}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {record.notes && <div className="ei-notes-admin">📝 {record.notes}</div>}
                            </div>
                            
                            {/* PIE CHART SECTION */}
                            <div className="ei-pie-chart" style={{ width: '160px', height: '160px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Pie 
                                    data={{
                                        labels: ['Self Awareness', 'Self Regulation', 'Motivation', 'Empathy', 'Social Skills'],
                                        datasets: [{
                                            data: [record.selfAwareness, record.selfRegulation, record.motivation, record.empathy, record.socialSkills],
                                            backgroundColor: [
                                                'rgba(99, 102, 241, 0.85)',
                                                'rgba(16, 185, 129, 0.85)', 
                                                'rgba(245, 158, 11, 0.85)',
                                                'rgba(239, 68, 68, 0.85)',
                                                'rgba(168, 85, 247, 0.85)'
                                            ],
                                            borderColor: '#ffffff',
                                            borderWidth: 2,
                                            hoverOffset: 6
                                        }]
                                    }} 
                                    options={{
                                        plugins: { legend: { display: false } },
                                        maintainAspectRatio: false,
                                        cutout: '20%' // slight doughnut feel
                                    }} 
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>

                            <div className="admin-record-actions" style={{ flexDirection: 'column' }}>
                                <button className="btn-edit-admin" onClick={() => handleEdit(record)}><FaEdit /></button>
                                <button className="btn-delete-admin" onClick={() => handleDelete(record.id)}><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminEmotionalRecords;
