import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/auth/Login';
import StudentForm from './components/student/StudentForm';
import StudentDashboard from './components/dashboard/StudentDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import { FaGraduationCap, FaSignOutAlt, FaUserCircle, FaUserShield } from 'react-icons/fa';
import { capitalize } from './utils/stringUtils';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [view, setView] = useState('loading'); // 'loading' | 'dashboard' | 'form' | 'admin'

  // Restore session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
    }
  }, []);

  // Route based on role after user is set
  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      setView('admin');
    } else {
      fetchStudentProfile(user.email);
    }
  }, [user]);

  const fetchStudentProfile = async (email) => {
    try {
      const res = await fetch(`${API_URL}/students/email/${email}`);
      if (res.status === 404) {
        setSelectedStudent(null);
        setView('form');
      } else if (res.ok) {
        const student = await res.json();
        setSelectedStudent(student);
        setView('dashboard');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedStudent(null);
    setView('loading');
  };

  const handleAddStudent = async (studentData) => {
    try {
      const res = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      const newStudent = await res.json();
      setSelectedStudent(newStudent);
      setView('dashboard');
    } catch (err) {
      console.error('Error adding student:', err);
    }
  };

  // Not logged in → show Login only
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-top">
          <h1><FaGraduationCap /> Academic Emotional Intelligence Tracker</h1>
          <div className="user-section">
            <span className="user-greeting">
              {isAdmin
                ? <><FaUserShield style={{ marginRight: '8px', verticalAlign: 'middle' }} />Admin Panel</>
                : <><FaUserCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />Hi, {capitalize(user.name)}</>
              }
            </span>
            {isAdmin && <span className="admin-badge">ADMIN</span>}
            <button className="btn-logout" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {view === 'admin' && isAdmin && <AdminDashboard />}

        {view === 'form' && !isAdmin && (
          <StudentForm
            onSubmit={handleAddStudent}
            initialEmail={user.email}
            onCancel={() => { }}
          />
        )}

        {view === 'dashboard' && selectedStudent && !isAdmin && (
          <StudentDashboard
            student={selectedStudent}
            currentUserEmail={user.email}
          />
        )}

        {view === 'loading' && (
          <div className="loading-container">Loading your profile...</div>
        )}
      </main>
    </div>
  );
}

export default App;