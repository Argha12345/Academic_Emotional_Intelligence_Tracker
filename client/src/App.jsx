import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './components/auth/Login';
import StudentForm from './components/student/StudentForm';
import StudentDashboard from './components/dashboard/StudentDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import MentorDashboard from './components/dashboard/MentorDashboard';
import {
  FaGraduationCap, FaSignOutAlt, FaUserShield, FaUserTie,
  FaHome, FaBrain, FaBook, FaCalendarAlt, FaHeartbeat,
  FaKey, FaUsers, FaChalkboardTeacher, FaReact, FaBell, FaCommentDots,
  FaUserCircle, FaCalendarCheck
} from 'react-icons/fa';
import { capitalize } from './utils/stringUtils';

const API_URL = import.meta.env.VITE_API_URL || 'https://09j91kzt-5000.inc1.devtunnels.ms/api';

function App() {
  const [user, setUser] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentFetchAttempted, setStudentFetchAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [pendingNav, setPendingNav] = useState(null);
  const navigate = useNavigate();

  // Restore session on mount
  useEffect(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
    const token = match ? match[1] : null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (e) {
        console.error('Invalid token payload');
      }
    }
    setLoading(false);
  }, []);

  // Fetch student profile when user is a student
  useEffect(() => {
    if (!user || user.role === 'admin' || user.role === 'mentor') {
      setStudentFetchAttempted(true);
      return;
    }
    const fetchStudentProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/students/email/${user.email}`);
        if (res.ok) {
          const student = await res.json();
          setSelectedStudent(student);
        } else if (res.status === 404) {
          setSelectedStudent(null);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setStudentFetchAttempted(true);
      }
    };
    fetchStudentProfile();
  }, [user]);

  // Navigate once pending nav is set AND loading gate is clear
  useEffect(() => {
    if (pendingNav && !loading) {
      navigate(pendingNav);
      setPendingNav(null);
    }
  }, [pendingNav, loading, navigate]);

  const handleLogin = (userData) => {
    const isAdminOrMentor = userData.role === 'admin' || userData.role === 'mentor';
    setUser(userData);
    // Admin/mentor don't need student profile fetch - mark as done immediately
    if (isAdminOrMentor) setStudentFetchAttempted(true);
    else setStudentFetchAttempted(false);

    if (userData.role === 'admin') { setActiveTab('students'); navigate('/admin'); }
    else if (userData.role === 'mentor') { setActiveTab('students'); navigate('/mentor'); }
    else { setActiveTab('profile'); navigate('/'); }
  };

  const handleLogout = () => {
    document.cookie = 'token=; Max-Age=0; path=/;';
    localStorage.removeItem('user');
    setUser(null);
    setSelectedStudent(null);
    setStudentFetchAttempted(false);
    navigate('/');
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
      navigate('/student/dashboard');
    } catch (err) {
      console.error('Error adding student:', err);
    }
  };

  if (loading || (user && !studentFetchAttempted)) {
    return <div className="loading-container">Loading your profile…</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
    );
  }

  const isAdmin = user.role === 'admin';
  const isMentor = user.role === 'mentor';
  const isStudent = !isAdmin && !isMentor;

  /* ---- Build sidebar nav items per role ---- */
  const studentNavSections = [
    {
      label: 'Overview',
      items: [
        { id: 'profile', icon: <FaHome />, label: 'Dashboard' },
      ]
    },
    {
      label: 'Analytics',
      items: [
        { id: 'insights', icon: <FaReact />, label: 'Smart Analytics' },
        { id: 'timetable', icon: <FaCalendarAlt />, label: 'Study Timetable' },
        { id: 'feedback', icon: <FaHeartbeat />, label: 'Stress Feedback' },
      ]
    },
    {
      label: 'Support',
      items: [
        { id: 'counselling', icon: <FaCalendarCheck />, label: 'Counselling' },
      ]
    },
    {
      label: 'Feedback',
      items: [
        { id: 'mentorfeedback', icon: <FaCommentDots />, label: 'Mentor Feedback' }
      ]
    },
    {
      label: 'Account',
      items: [
        { id: 'myprofile', icon: <FaUserCircle />, label: 'My Profile' },
      ]
    }
  ];

  const adminNavSections = [
    {
      label: 'Overview',
      items: [
        { id: 'students', icon: <FaUsers />, label: 'Students' },
        { id: 'mentors', icon: <FaChalkboardTeacher />, label: 'Mentors' },
      ]
    },
    {
      label: 'Account',
      items: [
        { id: 'myprofile', icon: <FaUserCircle />, label: 'My Profile' },
      ]
    }
  ];

  const mentorNavSections = [
    {
      label: 'Navigation',
      items: [
        { id: 'students', icon: <FaUsers />, label: 'My Students' },
        { id: 'alerts', icon: <FaBell />, label: 'Alerts' },
      ]
    },
    {
      label: 'Account',
      items: [
        { id: 'myprofile', icon: <FaUserCircle />, label: 'My Profile' },
      ]
    }
  ];

  const navSections = isAdmin ? adminNavSections : isMentor ? mentorNavSections : studentNavSections;

  const topbarTitles = {
    profile: isAdmin ? 'Admin Dashboard' : 'My Dashboard',
    dashboard: 'Mentor Dashboard',
    students: isMentor ? 'My Students' : 'Students',
    alerts: 'Stress Alerts',
    settings: 'Account Settings',
    mentors: 'Mentors',
    insights: 'Smart Analytics',
    timetable: 'Study Timetable',
    feedback: 'Stress Feedback',
    emotional: 'EI Records',
    mlinsights: 'Smart Analytics',
    mentorfeedback: 'My Feedback',
    password: 'Change Password',
    myprofile: 'My Profile',
    counselling: 'Counselling Support',
  };

  const topbarSubtitles = {
    profile: 'View and manage your academic profile',
    dashboard: 'Manage your assigned students',
    students: isMentor ? 'Your assigned students' : 'Manage all enrolled students',
    alerts: 'Review student stress alerts',
    settings: 'Change your account password',
    mentors: 'Manage mentors and assignments',
    insights: 'ML-powered academic performance insights',
    timetable: 'Plan your weekly study schedule',
    feedback: 'AI-generated stress and wellbeing analysis',
    emotional: 'Emotional intelligence dimension records',
    mlinsights: 'Machine learning academic insights',
    mentorfeedback: 'Feedback notes for your student',
    password: 'Update your account password',
    myprofile: 'View your profile & change password',
    counselling: 'Book & manage counselling sessions',
  };

  const userInitial = (user.name || user.username || 'U').charAt(0).toUpperCase();
  const userName = capitalize(user.name || user.username || '');

  return (
    <div className="app-container">
      {/* ===== Sidebar ===== */}
      <aside className="app-sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <FaGraduationCap />
          </div>
          <div className="sidebar-brand-name">EI Tracker</div>
          <div className="sidebar-brand-sub">Academic Intelligence Platform</div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navSections.map(section => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map(item => (
                <button
                  key={item.id}
                  className={`sidebar-nav-btn ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && <span className="sidebar-nav-badge">{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{userInitial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role">
              {isAdmin ? 'Administrator' : isMentor ? 'Mentor' : 'Student'}
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
            <FaSignOutAlt />
          </button>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <div className="app-main">
        {/* Topbar */}
        <div className="app-topbar">
          <div>
            <div className="topbar-title">{topbarTitles[activeTab] || 'Dashboard'}</div>
            <div className="topbar-subtitle">{topbarSubtitles[activeTab] || ''}</div>
          </div>
          <div className="topbar-right">
            <span className={`topbar-role-badge ${isAdmin ? 'role-badge-admin' : isMentor ? 'role-badge-mentor' : 'role-badge-student'}`}>
              {isAdmin ? <><FaUserShield style={{ marginRight: 5 }} />Admin</> : isMentor ? <><FaUserTie style={{ marginRight: 5 }} />Mentor</> : <><FaGraduationCap style={{ marginRight: 5 }} />Student</>}
            </span>
          </div>
        </div>

        {/* Page Content */}
        <main className="app-page">
          <Routes>
            {isAdmin && (
              <>
                <Route path="/admin" element={
                  <AdminDashboard
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    user={user}
                  />
                } />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </>
            )}

            {isMentor && (
              <>
                <Route path="/mentor" element={<MentorDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />} />
                <Route path="*" element={<Navigate to="/mentor" replace />} />
              </>
            )}

            {isStudent && (
              <>
                <Route path="/student/setup" element={
                  !selectedStudent ? (
                    <StudentForm
                      onSubmit={handleAddStudent}
                      initialEmail={user.email}
                      onCancel={() => { }}
                    />
                  ) : (
                    <Navigate to="/student/dashboard" replace />
                  )
                } />

                <Route path="/student/dashboard" element={
                  selectedStudent ? (
                    <StudentDashboard
                      student={selectedStudent}
                      currentUserEmail={user.email}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      user={user}
                    />
                  ) : (
                    <Navigate to="/student/setup" replace />
                  )
                } />

                <Route path="*" element={
                  <Navigate to={selectedStudent ? "/student/dashboard" : "/student/setup"} replace />
                } />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;