import { useState, useEffect, useRef, useCallback } from 'react';
import './StudyTimetable.css';
import {
    FaClock, FaBook, FaPlus, FaTrash, FaBell, FaBellSlash,
    FaPlay, FaStop, FaCheck, FaCalendarAlt, FaEdit, FaTimes, FaSave
} from 'react-icons/fa';

const SUBJECTS_BY_SEMESTER = {
    1: ['Engineering Mathematics I', 'Engineering Physics', 'Engineering Chemistry', 'Programming in C', 'Engineering Graphics'],
    2: ['Engineering Mathematics II', 'Data Structures', 'Digital Electronics', 'Environmental Science', 'Communication Skills'],
    3: ['Discrete Mathematics', 'Object Oriented Programming', 'Computer Organization', 'Database Systems', 'Probability & Statistics'],
    4: ['Design & Analysis of Algorithms', 'Operating Systems', 'Computer Networks', 'Theory of Computation', 'Software Engineering'],
    5: ['Artificial Intelligence', 'Machine Learning', 'Web Technologies', 'Compiler Design', 'Elective I'],
    6: ['Deep Learning', 'Cloud Computing', 'Information Security', 'Mobile Application Development', 'Elective II'],
    7: ['Big Data Analytics', 'Internet of Things', 'Project Phase I', 'Elective III', 'Professional Elective'],
    8: ['Project Phase II', 'Seminar', 'Entrepreneurship', 'Elective IV', 'Internship'],
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b',
    '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16'
];

const STORAGE_KEY = 'studyTimetable_sessions';

function StudyTimetable({ studentId }) {
    const [sessions, setSessions] = useState(() => {
        try {
            const raw = localStorage.getItem(`${STORAGE_KEY}_${studentId}`);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [notifPermission, setNotifPermission] = useState(Notification.permission);
    const [activeTimers, setActiveTimers] = useState({}); // sessionId -> { remaining, running }
    const [form, setForm] = useState({
        subject: '',
        customSubject: '',
        semester: '1',
        day: 'Monday',
        startTime: '09:00',
        duration: 60,
        color: COLORS[0],
        notes: ''
    });
    const [filterDay, setFilterDay] = useState('All');
    const intervalRefs = useRef({});

    // Persist sessions
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_${studentId}`, JSON.stringify(sessions));
    }, [sessions, studentId]);

    // Request notification permission
    const requestNotifPermission = async () => {
        if (!('Notification' in window)) return alert('This browser does not support notifications.');
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
    };

    const sendNotification = useCallback((title, body) => {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '📚',
                badge: '📚'
            });
        }
    }, []);

    // Schedule daily notifications for sessions
    useEffect(() => {
        if (notifPermission !== 'granted') return;
        // Check every minute if a session is about to start
        const checkInterval = setInterval(() => {
            const now = new Date();
            const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            sessions.forEach(session => {
                if (session.day === currentDay) {
                    // Notify 5 minutes before
                    const [h, m] = session.startTime.split(':').map(Number);
                    const sessionMins = h * 60 + m;
                    const nowMins = now.getHours() * 60 + now.getMinutes();
                    if (sessionMins - nowMins === 5) {
                        sendNotification(
                            `📚 Study Session Starting Soon!`,
                            `${session.subject} starts in 5 minutes. Get ready!`
                        );
                    }
                    if (sessionMins === nowMins) {
                        sendNotification(
                            `⏰ Study Session Started!`,
                            `Time to study ${session.subject}! Duration: ${session.duration} minutes.`
                        );
                    }
                }
            });
        }, 60000);
        return () => clearInterval(checkInterval);
    }, [sessions, notifPermission, sendNotification]);

    // Countdown timer management
    const startTimer = (session) => {
        if (intervalRefs.current[session.id]) return;
        const totalSeconds = session.duration * 60;
        setActiveTimers(prev => ({ ...prev, [session.id]: { remaining: totalSeconds, running: true } }));
        sendNotification('▶️ Study Timer Started', `${session.subject} - ${session.duration} min session started!`);
        intervalRefs.current[session.id] = setInterval(() => {
            setActiveTimers(prev => {
                const cur = prev[session.id];
                if (!cur || cur.remaining <= 0) {
                    clearInterval(intervalRefs.current[session.id]);
                    delete intervalRefs.current[session.id];
                    sendNotification('✅ Study Session Complete!', `Great job! You completed your ${session.subject} session.`);
                    return { ...prev, [session.id]: { remaining: 0, running: false, done: true } };
                }
                return { ...prev, [session.id]: { ...cur, remaining: cur.remaining - 1 } };
            });
        }, 1000);
    };

    const stopTimer = (sessionId) => {
        clearInterval(intervalRefs.current[sessionId]);
        delete intervalRefs.current[sessionId];
        setActiveTimers(prev => {
            const { [sessionId]: _, ...rest } = prev;
            return rest;
        });
    };

    const resetTimer = (sessionId) => {
        stopTimer(sessionId);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => { Object.values(intervalRefs.current).forEach(clearInterval); };
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const getSubjectList = () => SUBJECTS_BY_SEMESTER[form.semester] || [];

    const handleFormChange = (field, value) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'semester') { updated.subject = ''; updated.customSubject = ''; }
            if (field === 'subject' && value !== '__custom__') updated.customSubject = '';
            return updated;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const subjectName = form.subject === '__custom__' ? form.customSubject.trim() : form.subject;
        if (!subjectName) return alert('Please select or enter a subject name.');
        const session = {
            id: editingId || `ses_${Date.now()}`,
            subject: subjectName,
            semester: form.semester,
            day: form.day,
            startTime: form.startTime,
            duration: parseInt(form.duration),
            color: form.color,
            notes: form.notes,
            createdAt: new Date().toISOString()
        };
        if (editingId) {
            setSessions(prev => prev.map(s => s.id === editingId ? session : s));
        } else {
            setSessions(prev => [...prev, session]);
        }
        resetFormState();
    };

    const resetFormState = () => {
        setForm({ subject: '', customSubject: '', semester: '1', day: 'Monday', startTime: '09:00', duration: 60, color: COLORS[0], notes: '' });
        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (session) => {
        const isCustom = !SUBJECTS_BY_SEMESTER[session.semester]?.includes(session.subject);
        setForm({
            subject: isCustom ? '__custom__' : session.subject,
            customSubject: isCustom ? session.subject : '',
            semester: session.semester,
            day: session.day,
            startTime: session.startTime,
            duration: session.duration,
            color: session.color,
            notes: session.notes || ''
        });
        setEditingId(session.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id) => {
        stopTimer(id);
        setSessions(prev => prev.filter(s => s.id !== id));
    };

    const filteredSessions = filterDay === 'All'
        ? sessions
        : sessions.filter(s => s.day === filterDay);

    const sessionsByDay = DAYS.reduce((acc, day) => {
        acc[day] = filteredSessions.filter(s => s.day === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        return acc;
    }, {});

    const totalHoursPerWeek = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;

    return (
        <div className="timetable-root">
            {/* Header */}
            <div className="tt-header">
                <div className="tt-header-left">
                    <div className="tt-header-icon-wrap"><FaCalendarAlt /></div>
                    <div>
                        <h2>Study Timetable</h2>
                        <p>Plan your study sessions, set durations &amp; get reminder notifications</p>
                    </div>
                </div>
                <div className="tt-header-right">
                    <div className="tt-stats-mini">
                        <span>{sessions.length} sessions</span>
                        <span>{totalHoursPerWeek.toFixed(1)} hrs/week</span>
                    </div>
                    <button
                        className={`tt-notif-btn ${notifPermission === 'granted' ? 'active' : ''}`}
                        onClick={requestNotifPermission}
                        title={notifPermission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
                    >
                        {notifPermission === 'granted' ? <FaBell /> : <FaBellSlash />}
                        <span>{notifPermission === 'granted' ? 'Notifications On' : 'Enable Reminders'}</span>
                    </button>
                    <button className="tt-add-btn" onClick={() => { setShowForm(v => !v); setEditingId(null); }}>
                        <FaPlus /> Add Session
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {notifPermission === 'denied' && (
                <div className="tt-notif-denied">
                    🔔 Notifications are blocked. Please allow notifications in your browser settings to receive study reminders.
                </div>
            )}

            {/* Add / Edit Form */}
            {showForm && (
                <div className="tt-form-card">
                    <div className="tt-form-header">
                        <h3>{editingId ? <><FaEdit /> Edit Session</> : <><FaPlus /> New Study Session</>}</h3>
                        <button className="tt-form-close" onClick={resetFormState}><FaTimes /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="tt-form">
                        <div className="tt-form-row">
                            <div className="tt-form-field">
                                <label>Semester</label>
                                <select value={form.semester} onChange={e => handleFormChange('semester', e.target.value)} required>
                                    {Object.keys(SUBJECTS_BY_SEMESTER).map(s => (
                                        <option key={s} value={s}>Semester {s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="tt-form-field">
                                <label>Subject</label>
                                <select value={form.subject} onChange={e => handleFormChange('subject', e.target.value)} required>
                                    <option value="">-- Select Subject --</option>
                                    {getSubjectList().map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                    <option value="__custom__">+ Custom Subject</option>
                                </select>
                            </div>
                        </div>
                        {form.subject === '__custom__' && (
                            <div className="tt-form-field">
                                <label>Custom Subject Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter subject name"
                                    value={form.customSubject}
                                    onChange={e => handleFormChange('customSubject', e.target.value)}
                                    required
                                    maxLength={80}
                                />
                            </div>
                        )}
                        <div className="tt-form-row">
                            <div className="tt-form-field">
                                <label>Day</label>
                                <select value={form.day} onChange={e => handleFormChange('day', e.target.value)}>
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="tt-form-field">
                                <label>Start Time</label>
                                <input
                                    type="time"
                                    value={form.startTime}
                                    onChange={e => handleFormChange('startTime', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="tt-form-field">
                                <label>Duration (minutes)</label>
                                <input
                                    type="number"
                                    min={15}
                                    max={480}
                                    step={15}
                                    value={form.duration}
                                    onChange={e => handleFormChange('duration', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="tt-form-field">
                            <label>Color Tag</label>
                            <div className="tt-color-picker">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`tt-color-dot ${form.color === c ? 'selected' : ''}`}
                                        style={{ background: c }}
                                        onClick={() => handleFormChange('color', c)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="tt-form-field">
                            <label>Notes (optional)</label>
                            <textarea
                                placeholder="Topics to cover, chapter numbers, goals..."
                                value={form.notes}
                                onChange={e => handleFormChange('notes', e.target.value)}
                                rows={2}
                                maxLength={300}
                            />
                        </div>
                        <div className="tt-form-actions">
                            <button type="button" className="tt-btn-cancel" onClick={resetFormState}>
                                <FaTimes /> Cancel
                            </button>
                            <button type="submit" className="tt-btn-save">
                                <FaSave /> {editingId ? 'Update Session' : 'Add Session'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Day Filter */}
            {sessions.length > 0 && (
                <div className="tt-filter-row">
                    {['All', ...DAYS].map(d => (
                        <button
                            key={d}
                            className={`tt-filter-btn ${filterDay === d ? 'active' : ''}`}
                            onClick={() => setFilterDay(d)}
                        >
                            {d === 'All' ? '📅 All Days' : d.slice(0, 3)}
                        </button>
                    ))}
                </div>
            )}

            {/* Timetable Grid */}
            {sessions.length === 0 ? (
                <div className="tt-empty">
                    <div className="tt-empty-icon">📅</div>
                    <h3>No Study Sessions Yet</h3>
                    <p>Add your first study session by clicking <strong>"Add Session"</strong> above. Set the subject, semester, day, time, and duration.</p>
                    <button className="tt-add-btn" onClick={() => setShowForm(true)}>
                        <FaPlus /> Add Your First Session
                    </button>
                </div>
            ) : (
                <div className="tt-schedule">
                    {DAYS.map(day => {
                        const daySessions = sessionsByDay[day];
                        if (filterDay !== 'All' && filterDay !== day) return null;
                        if (daySessions.length === 0 && filterDay !== 'All') return null;
                        return (
                            <div key={day} className={`tt-day-block ${daySessions.length === 0 ? 'empty-day' : ''}`}>
                                <div className="tt-day-header">
                                    <span className="tt-day-name">{day}</span>
                                    <span className="tt-day-count">
                                        {daySessions.length > 0
                                            ? `${daySessions.length} session${daySessions.length > 1 ? 's' : ''} · ${(daySessions.reduce((s, x) => s + x.duration, 0) / 60).toFixed(1)}h`
                                            : 'Free day'}
                                    </span>
                                </div>
                                {daySessions.length === 0 ? (
                                    <div className="tt-no-sessions">Rest day - no sessions scheduled</div>
                                ) : (
                                    <div className="tt-sessions-list">
                                        {daySessions.map(session => {
                                            const timer = activeTimers[session.id];
                                            const isDone = timer?.done;
                                            const isRunning = timer?.running;
                                            const progress = timer
                                                ? ((session.duration * 60 - timer.remaining) / (session.duration * 60)) * 100
                                                : 0;
                                            return (
                                                <div key={session.id} className={`tt-session-card ${isDone ? 'done' : ''}`} style={{ borderLeft: `4px solid ${session.color}` }}>
                                                    <div className="tt-session-top">
                                                        <div className="tt-session-info">
                                                            <div className="tt-session-subject" style={{ color: session.color }}>
                                                                <FaBook style={{ marginRight: 6 }} />{session.subject}
                                                            </div>
                                                            <div className="tt-session-meta">
                                                                <span className="tt-sem-badge">Sem {session.semester}</span>
                                                                <span><FaClock style={{ marginRight: 4 }} />{session.startTime}</span>
                                                                <span>⏱ {session.duration} min</span>
                                                            </div>
                                                            {session.notes && <div className="tt-session-notes">{session.notes}</div>}
                                                        </div>
                                                        <div className="tt-session-actions">
                                                            {!isDone && !isRunning && (
                                                                <button className="tt-action-btn start" onClick={() => startTimer(session)} title="Start timer">
                                                                    <FaPlay />
                                                                </button>
                                                            )}
                                                            {isRunning && (
                                                                <button className="tt-action-btn stop" onClick={() => stopTimer(session.id)} title="Stop timer">
                                                                    <FaStop />
                                                                </button>
                                                            )}
                                                            {isDone && (
                                                                <button className="tt-action-btn reset" onClick={() => resetTimer(session.id)} title="Reset">
                                                                    <FaCheck />
                                                                </button>
                                                            )}
                                                            <button className="tt-action-btn edit" onClick={() => handleEdit(session)} title="Edit">
                                                                <FaEdit />
                                                            </button>
                                                            <button className="tt-action-btn delete" onClick={() => handleDelete(session.id)} title="Delete">
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {/* Timer display */}
                                                    {timer && (
                                                        <div className="tt-timer-wrap">
                                                            <div className="tt-timer-progress">
                                                                <div
                                                                    className="tt-timer-fill"
                                                                    style={{ width: `${progress}%`, background: isDone ? '#10b981' : session.color }}
                                                                />
                                                            </div>
                                                            <div className="tt-timer-display" style={{ color: isDone ? '#10b981' : session.color }}>
                                                                {isDone ? '✅ Session Complete!' : `⏱ ${formatTime(timer.remaining)} remaining`}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Weekly Summary */}
            {sessions.length > 0 && (
                <div className="tt-summary">
                    <h4>📊 Weekly Study Summary</h4>
                    <div className="tt-summary-grid">
                        {Object.entries(
                            sessions.reduce((acc, s) => {
                                acc[s.subject] = (acc[s.subject] || 0) + s.duration;
                                return acc;
                            }, {})
                        ).sort((a, b) => b[1] - a[1]).map(([subj, mins]) => (
                            <div key={subj} className="tt-summary-row">
                                <span className="tt-summary-subject">{subj}</span>
                                <div className="tt-summary-bar-wrap">
                                    <div
                                        className="tt-summary-bar"
                                        style={{
                                            width: `${Math.min(100, (mins / Math.max(...Object.values(sessions.reduce((acc, s) => { acc[s.subject] = (acc[s.subject] || 0) + s.duration; return acc; }, {})))) * 100)}%`,
                                            background: sessions.find(s => s.subject === subj)?.color || '#6366f1'
                                        }}
                                    />
                                </div>
                                <span className="tt-summary-mins">{(mins / 60).toFixed(1)}h</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudyTimetable;
