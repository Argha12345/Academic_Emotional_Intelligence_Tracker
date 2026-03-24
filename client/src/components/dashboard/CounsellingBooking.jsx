import { useState, useEffect } from 'react';
import './CounsellingBooking.css';
import {
    FaCalendarCheck, FaExclamationTriangle, FaCheckCircle,
    FaClock, FaTimesCircle, FaCalendarAlt, FaHeartbeat,
    FaSpinner, FaChevronRight, FaBan, FaPlus
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function CounsellingBooking({ studentId, studentName, studentEmail, bookedByRole }) {
    const [checkData, setCheckData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [bookingError, setBookingError] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [pastSessions, setPastSessions] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showBookingForm, setShowBookingForm] = useState(false);

    const isSelf = !bookedByRole || bookedByRole === 'student';

    useEffect(() => {
        if (studentId) {
            checkStress();
            fetchPastSessions();
        }
    }, [studentId]);

    // Auto-show booking form when stress > 70 (for students viewing their own panel)
    useEffect(() => {
        if (checkData && checkData.stressScore > 70 && isSelf && !checkData.existingSession) {
            setShowBookingForm(true);
        }
    }, [checkData]);

    const checkStress = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/counselling/check/${studentId}`);
            const data = await res.json();
            setCheckData(data);
        } catch (err) {
            console.error('Error checking stress:', err);
        }
        setLoading(false);
    };

    const fetchPastSessions = async () => {
        try {
            const res = await fetch(`${API_URL}/counselling/student/${studentId}`);
            const data = await res.json();
            setPastSessions(data || []);
        } catch (err) {
            console.error('Error fetching sessions:', err);
        }
    };

    const handleBookSession = async () => {
        if (!selectedDate || !selectedSlot) {
            setBookingError('Please select both a date and a time slot');
            return;
        }
        setBookingLoading(true);
        setBookingError('');
        try {
            const res = await fetch(`${API_URL}/counselling/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    studentName,
                    studentEmail,
                    stressScore: checkData?.stressScore || 0,
                    date: selectedDate,
                    slot: selectedSlot,
                    notes: bookedByRole && bookedByRole !== 'student'
                        ? `Booked by ${bookedByRole}. Stress score: ${checkData?.stressScore || 'N/A'}/100`
                        : `${checkData?.stressScore > 70 ? 'Auto-recommended due to' : 'Self-booked.'} stress score: ${checkData?.stressScore || 0}/100`
                })
            });
            const data = await res.json();
            if (!res.ok) {
                setBookingError(data.error || 'Failed to book session');
            } else {
                setBookingSuccess(data);
                setSelectedDate(null);
                setSelectedSlot(null);
                setShowBookingForm(false);
                checkStress();
                fetchPastSessions();
            }
        } catch (err) {
            setBookingError('Server error. Please try again.');
        }
        setBookingLoading(false);
    };

    const handleConfirm = async (sessionId) => {
        setConfirming(true);
        try {
            const res = await fetch(`${API_URL}/counselling/confirm/${sessionId}`, { method: 'PATCH' });
            if (res.ok) {
                checkStress();
                fetchPastSessions();
                setBookingSuccess(null);
            }
        } catch (err) { console.error(err); }
        setConfirming(false);
    };

    const handleCancel = async (sessionId) => {
        setCancelling(true);
        try {
            const res = await fetch(`${API_URL}/counselling/cancel/${sessionId}`, { method: 'PATCH' });
            if (res.ok) {
                checkStress();
                fetchPastSessions();
                setBookingSuccess(null);
            }
        } catch (err) { console.error(err); }
        setCancelling(false);
    };

    if (loading) {
        return (
            <div className="counselling-panel">
                <div className="counselling-loading">
                    <FaSpinner className="counselling-spinner" />
                    <span>Analyzing stress levels...</span>
                </div>
            </div>
        );
    }

    if (!checkData) return null;

    const { stressScore, existingSession, availableSlots } = checkData;
    const needsUrgent = stressScore > 70;

    // Group available slots by date
    const slotsByDate = {};
    (availableSlots || []).forEach(s => {
        if (!slotsByDate[s.date]) slotsByDate[s.date] = { dayName: s.dayName, slots: [] };
        slotsByDate[s.date].slots.push(s.slot);
    });

    const getStressColor = (score) => {
        if (score > 70) return '#ef4444';
        if (score > 40) return '#f59e0b';
        return '#10b981';
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Pending Confirmation', icon: <FaClock /> };
            case 'confirmed': return { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Confirmed', icon: <FaCheckCircle /> };
            case 'cancelled': return { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Cancelled', icon: <FaTimesCircle /> };
            case 'completed': return { color: '#6366f1', bg: 'rgba(99,102,241,0.15)', label: 'Completed', icon: <FaCheckCircle /> };
            default: return { color: '#64748b', bg: 'rgba(136,146,164,0.15)', label: status, icon: <FaClock /> };
        }
    };

    return (
        <div className="counselling-panel">
            {/* Header */}
            <div className="counselling-header">
                <div className="counselling-header-icon">
                    <FaHeartbeat />
                </div>
                <div>
                    <h3>Counselling Support {!isSelf && <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>- for {studentName}</span>}</h3>
                    <p>{needsUrgent ? '⚠️ High stress detected - session recommended' : 'Book & manage counselling sessions'}</p>
                </div>
            </div>

            {/* Stress Score Meter */}
            <div className="counselling-stress-card">
                <div className="stress-score-header">
                    <span className="stress-score-label">Current Stress Level</span>
                    <span className="stress-score-value" style={{ color: getStressColor(stressScore) }}>
                        {stressScore}/100
                    </span>
                </div>
                <div className="stress-score-bar">
                    <div
                        className="stress-score-fill"
                        style={{
                            width: `${stressScore}%`,
                            background: `linear-gradient(90deg, #10b981, #f59e0b ${Math.min(stressScore * 1.4, 100)}%, #ef4444)`
                        }}
                    />
                </div>
                <div className="stress-score-labels">
                    <span>Low</span>
                    <span>Moderate</span>
                    <span>High</span>
                </div>
            </div>

            {/* Urgent Alert for stress > 70 */}
            {needsUrgent && !existingSession && isSelf && (
                <div className="recommendation-alert">
                    <FaExclamationTriangle className="recommendation-icon" />
                    <div>
                        <strong>Counselling Recommended</strong>
                        <p>Your stress score is above 70. A counselling session has been recommended for your well-being. Please select a date and time below.</p>
                    </div>
                </div>
            )}

            {/* Existing Session */}
            {existingSession && (
                <div className="counselling-existing">
                    <div className="existing-badge" style={{
                        background: getStatusBadge(existingSession.status).bg,
                        color: getStatusBadge(existingSession.status).color,
                        border: `1px solid ${getStatusBadge(existingSession.status).color}33`
                    }}>
                        {getStatusBadge(existingSession.status).icon}
                        <span>{getStatusBadge(existingSession.status).label}</span>
                    </div>
                    <div className="existing-details">
                        <div className="existing-date">
                            <FaCalendarAlt /> {new Date(existingSession.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="existing-time">
                            <FaClock /> {existingSession.slot}
                        </div>
                    </div>
                    <div className="existing-actions">
                        {existingSession.status === 'pending' && (
                            <>
                                <button
                                    className="btn-confirm-session"
                                    onClick={() => handleConfirm(existingSession.id)}
                                    disabled={confirming}
                                >
                                    <FaCheckCircle /> {confirming ? 'Confirming...' : 'Confirm Session'}
                                </button>
                                <button
                                    className="btn-cancel-session"
                                    onClick={() => handleCancel(existingSession.id)}
                                    disabled={cancelling}
                                >
                                    <FaBan /> {cancelling ? 'Cancelling...' : 'Cancel'}
                                </button>
                            </>
                        )}
                        {existingSession.status === 'confirmed' && (
                            <button
                                className="btn-cancel-session"
                                onClick={() => handleCancel(existingSession.id)}
                                disabled={cancelling}
                            >
                                <FaBan /> {cancelling ? 'Cancelling...' : 'Cancel Session'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Booking Success */}
            {bookingSuccess && !existingSession && (
                <div className="counselling-success-card">
                    <FaCheckCircle className="success-icon" />
                    <h4>Session Booked Successfully!</h4>
                    <p>Date: <strong>{new Date(bookingSuccess.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong></p>
                    <p>Time: <strong>{bookingSuccess.slot}</strong></p>
                    <p className="success-hint">Please confirm or reschedule your session above.</p>
                </div>
            )}

            {/* Book Session Button (shown when no existing session and not auto-expanded) */}
            {!existingSession && !bookingSuccess && !showBookingForm && (
                <button className="btn-start-booking" onClick={() => setShowBookingForm(true)}>
                    <FaPlus /> Book a Counselling Session
                </button>
            )}

            {/* Booking Form */}
            {!existingSession && !bookingSuccess && showBookingForm && (
                <div className="counselling-recommendation">
                    {bookingError && (
                        <div className="counselling-error">{bookingError}</div>
                    )}

                    {/* Date Selection */}
                    <div className="slot-selection">
                        <h4><FaCalendarAlt style={{ marginRight: '8px' }} />Select a Date</h4>
                        <div className="date-grid">
                            {Object.entries(slotsByDate).map(([date, info]) => (
                                <button
                                    key={date}
                                    className={`date-btn ${selectedDate === date ? 'selected' : ''}`}
                                    onClick={() => { setSelectedDate(date); setSelectedSlot(null); setBookingError(''); }}
                                >
                                    <span className="date-day">{info.dayName}</span>
                                    <span className="date-value">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Slot Selection */}
                    {selectedDate && slotsByDate[selectedDate] && (
                        <div className="slot-selection">
                            <h4><FaClock style={{ marginRight: '8px' }} />Select a Time Slot</h4>
                            <div className="time-grid">
                                {slotsByDate[selectedDate].slots.map(slot => (
                                    <button
                                        key={slot}
                                        className={`time-btn ${selectedSlot === slot ? 'selected' : ''}`}
                                        onClick={() => { setSelectedSlot(slot); setBookingError(''); }}
                                    >
                                        <FaClock className="time-icon" />
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Book Button */}
                    {selectedDate && selectedSlot && (
                        <div className="booking-summary">
                            <div className="booking-summary-info">
                                <span><FaCalendarAlt /> {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                <span><FaClock /> {selectedSlot}</span>
                            </div>
                            <button
                                className="btn-book-session"
                                onClick={handleBookSession}
                                disabled={bookingLoading}
                            >
                                {bookingLoading ? (
                                    <><FaSpinner className="counselling-spinner" /> Booking...</>
                                ) : (
                                    <><FaCalendarCheck /> Book Counselling Session</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Cancel button to hide form */}
                    {!needsUrgent && (
                        <button className="btn-cancel-booking-form" onClick={() => { setShowBookingForm(false); setSelectedDate(null); setSelectedSlot(null); setBookingError(''); }}>
                            Cancel
                        </button>
                    )}
                </div>
            )}

            {/* Session History */}
            {pastSessions.length > 0 && (
                <div className="session-history">
                    <button
                        className="history-toggle"
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        <FaCalendarAlt />
                        Session History ({pastSessions.length})
                        <FaChevronRight className={`history-chevron ${showHistory ? 'open' : ''}`} />
                    </button>
                    {showHistory && (
                        <div className="history-list">
                            {pastSessions.map(session => {
                                const badge = getStatusBadge(session.status);
                                return (
                                    <div key={session.id} className="history-item">
                                        <div className="history-item-left">
                                            <span className="history-date">
                                                {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="history-slot">{session.slot}</span>
                                        </div>
                                        <div className="history-badge" style={{
                                            background: badge.bg,
                                            color: badge.color,
                                            border: `1px solid ${badge.color}44`
                                        }}>
                                            {badge.icon} {badge.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CounsellingBooking;
