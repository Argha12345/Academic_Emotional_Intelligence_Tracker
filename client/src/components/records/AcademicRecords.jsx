import { useState, useEffect } from 'react';
import './AcademicRecords.css';

function AcademicRecords({ studentId, onUpdate }) {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    semester: '',
    gpa: '',
    assignmentScore: '',
    attendancePercentage: ''
  });

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchRecords();
  }, [studentId]);

  const fetchRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/academic/${studentId}`);
      const data = await response.json();
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching academic records:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const gpaVal = parseFloat(formData.gpa);

    // ✅ CGPA validation (0–10)
    if (isNaN(gpaVal) || gpaVal < 0 || gpaVal > 10) {
      setFormError('CGPA must be a number between 0 and 10');
      return;
    }

    setFormError('');

    try {
      await fetch(`${API_URL}/academic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          semester: formData.semester,
          gpa: gpaVal,
          assignmentScore: formData.assignmentScore
            ? parseFloat(formData.assignmentScore)
            : null,
          attendancePercentage: formData.attendancePercentage
            ? parseFloat(formData.attendancePercentage)
            : null
        })
      });

      setFormData({
        semester: '',
        gpa: '',
        assignmentScore: '',
        attendancePercentage: ''
      });

      setShowForm(false);
      fetchRecords();
      onUpdate();
    } catch (error) {
      console.error('Error adding academic record:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/academic/${id}`, { method: 'DELETE' });
      setRecords(records.filter(r => r.id !== id));
      onUpdate();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  return (
    <div className="records-container">
      <div className="records-header">
        <h2>Academic Records</h2>
        <button
          className="btn-add"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Record'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Semester *</label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  placeholder="e.g., Semester 1"
                  required
                />
              </div>

              <div className="form-group">
                <label>CGPA *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  name="gpa"
                  value={formData.gpa}
                  onChange={handleChange}
                  placeholder="0.00 - 10.00"
                  required
                />
                {formError && (
                  <div className="error-message">{formError}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Assignment Score</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="assignmentScore"
                  value={formData.assignmentScore}
                  onChange={handleChange}
                  placeholder="0 - 100"
                />
              </div>

              <div className="form-group">
                <label>Attendance %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="attendancePercentage"
                  value={formData.attendancePercentage}
                  onChange={handleChange}
                  placeholder="0 - 100"
                />
              </div>
            </div>

            <button type="submit" className="btn-submit">
              Save Record
            </button>
          </form>
        </div>
      )}

      <div className="records-list">
        {records.length === 0 ? (
          <p className="empty-message">No academic records yet.</p>
        ) : (
          records.map(record => (
            <div key={record.id} className="record-item">
              <div className="record-main">
                <div className="subject-name">{record.semester}</div>

                <div className="record-details">
                  <span className="badge gpa">
                    CGPA: {record.gpa != null ? parseFloat(record.gpa).toFixed(2) : 'N/A'}
                  </span>

                  <span className="badge assignment">
                    Assignment: {record.assignmentScore != null ? `${parseFloat(record.assignmentScore).toFixed(1)}%` : 'N/A'}
                  </span>

                  <span className="badge attendance">
                    Attendance: {record.attendancePercentage != null ? `${parseFloat(record.attendancePercentage).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>

                <div className="record-date">
                  {new Date(record.recordDate).toLocaleDateString()}
                </div>
              </div>

              <button
                className="btn-delete"
                onClick={() => handleDelete(record.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AcademicRecords;
