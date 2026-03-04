import { useState, useEffect } from 'react';
import './StudentForm.css';

function StudentForm({ onSubmit, onCancel, initialEmail }) {
  const [formData, setFormData] = useState({
    name: '',
    email: initialEmail || '',
    rollNumber: '',
    department: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialEmail) {
      setFormData(prev => ({ ...prev, email: initialEmail }));
    }
  }, [initialEmail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.rollNumber) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    onSubmit(formData);
    // Only reset if we're not using a fixed initial email
    if (!initialEmail) {
      setFormData({ name: '', email: '', rollNumber: '', department: '' });
    }
    setError('');
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2>Add New Student</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Student Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
              readOnly={!!initialEmail}
              className={initialEmail ? 'input-readonly' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="rollNumber">Roll Number *</label>
            <input
              type="text"
              id="rollNumber"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              placeholder="Enter roll number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Enter department"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">Add Student</button>
            {!initialEmail && (
              <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentForm;