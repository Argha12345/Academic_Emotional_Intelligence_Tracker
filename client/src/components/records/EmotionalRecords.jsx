import { useState, useEffect } from 'react';
import './EmotionalRecords.css';
import { FaBrain, FaCog, FaBullseye, FaHeart, FaHandshake } from 'react-icons/fa';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

function EmotionalRecords({ studentId, onUpdate }) {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    selfAwareness: 5,
    selfRegulation: 5,
    motivation: 5,
    empathy: 5,
    socialSkills: 5,
    notes: ''
  });
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchRecords();
  }, [studentId]);

  const fetchRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/emotional/${studentId}`);
      const data = await response.json();
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching emotional records:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'notes' ? value : parseInt(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const response = await fetch(`${API_URL}/emotional/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            ...formData
          })
        });
        const updated = await response.json();
        setRecords(records.map(r => r.id === editId ? updated : r));
        setEditId(null);
      } else {
        const response = await fetch(`${API_URL}/emotional`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            ...formData
          })
        });
        const newRecord = await response.json();
        setRecords([newRecord, ...records]);
      }
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving emotional record:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      selfAwareness: 5,
      selfRegulation: 5,
      motivation: 5,
      empathy: 5,
      socialSkills: 5,
      notes: ''
    });
    setShowForm(false);
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
    try {
      await fetch(`${API_URL}/emotional/${id}`, { method: 'DELETE' });
      setRecords(records.filter(r => r.id !== id));
      onUpdate();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#4caf50';
    if (score >= 6) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="records-container">
      <div className="records-header">
        <h2>Emotional Intelligence Records</h2>
        <button 
          className="btn-add"
          onClick={() => editId ? resetForm() : setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Record'}
        </button>
      </div>

      <div className="ei-info">
        <p>Rate each dimension on a scale of 1-10</p>
      </div>

      {showForm && (
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="ei-scale-container">
              {[
                { name: 'selfAwareness', label: <><FaBrain style={{ marginRight: '6px' }} /> Self Awareness</> },
                { name: 'selfRegulation', label: <><FaCog style={{ marginRight: '6px' }} /> Self Regulation</> },
                { name: 'motivation', label: <><FaBullseye style={{ marginRight: '6px' }} /> Motivation</> },
                { name: 'empathy', label: <><FaHeart style={{ marginRight: '6px' }} /> Empathy</> },
                { name: 'socialSkills', label: <><FaHandshake style={{ marginRight: '6px' }} /> Social Skills</> }
              ].map(dimension => (
                <div key={dimension.name} className="scale-group">
                  <label>{dimension.label}</label>
                  <div className="scale-input">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      name={dimension.name}
                      value={formData[dimension.name]}
                      onChange={handleChange}
                    />
                    <span className="scale-value">{formData[dimension.name]}/10</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any observations or notes..."
                rows="3"
              />
            </div>

            <button type="submit" className="btn-submit">
              {editId ? 'Update Record' : 'Save Record'}
            </button>
          </form>
        </div>
      )}

      <div className="records-list">
        {records.length === 0 ? (
          <p className="empty-message">No emotional intelligence records yet.</p>
        ) : (
          records.map(record => (
            <div key={record.id} className="ei-record-item" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ flex: '1 1 60%', minWidth: '250px' }}>
                <div className="record-date">{new Date(record.recordDate).toLocaleDateString()}</div>
                <div className="ei-scores">
                <div className="score">
                  <span>Self Awareness</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${record.selfAwareness * 10}%`, backgroundColor: getScoreColor(record.selfAwareness) }}
                    >
                      {record.selfAwareness}
                    </div>
                  </div>
                </div>
                <div className="score">
                  <span>Self Regulation</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${record.selfRegulation * 10}%`, backgroundColor: getScoreColor(record.selfRegulation) }}
                    >
                      {record.selfRegulation}
                    </div>
                  </div>
                </div>
                <div className="score">
                  <span>Motivation</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${record.motivation * 10}%`, backgroundColor: getScoreColor(record.motivation) }}
                    >
                      {record.motivation}
                    </div>
                  </div>
                </div>
                <div className="score">
                  <span>Empathy</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${record.empathy * 10}%`, backgroundColor: getScoreColor(record.empathy) }}
                    >
                      {record.empathy}
                    </div>
                  </div>
                </div>
                <div className="score">
                  <span>Social Skills</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${record.socialSkills * 10}%`, backgroundColor: getScoreColor(record.socialSkills) }}
                    >
                      {record.socialSkills}
                    </div>
                  </div>
                </div>
              </div>
              </div>
              <div className="ei-pie-chart" style={{ width: '140px', height: '140px', flexShrink: 0, margin: '15px auto' }}>
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
                        cutout: '20%'
                    }} 
                />
              </div>
              <div className="record-overall">
                <strong>Overall Score: {record.overallScore.toFixed(1)}/10</strong>
              </div>
              {record.notes && <div className="record-notes">📝 {record.notes}</div>}
              <div className="record-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEdit(record)}
                >
                  Edit
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(record.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EmotionalRecords;