import { useState } from 'react';
import './StudentList.css';

function StudentList({ students, onSelectStudent, onDeleteStudent }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="student-list-container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name, email, or roll number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredStudents.length === 0 ? (
        <div className="empty-state">
          <p>No students found. Add a new student to get started!</p>
        </div>
      ) : (
        <div className="students-grid">
          {filteredStudents.map(student => (
            <div key={student.id} className="student-card">
              <div className="card-header">
                <h3>{student.name}</h3>
                <span className="roll-number">{student.rollNumber}</span>
              </div>
              <div className="card-body">
                <p><strong>Email:</strong> {student.email}</p>
                <p><strong>Department:</strong> {student.department || 'N/A'}</p>
                <p className="date"><strong>Joined:</strong> {new Date(student.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="card-actions">
                <button
                  className="btn-view"
                  onClick={() => onSelectStudent(student)}
                >
                  View Dashboard
                </button>
                <button
                  className="btn-delete"
                  onClick={() => onDeleteStudent(student.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentList;