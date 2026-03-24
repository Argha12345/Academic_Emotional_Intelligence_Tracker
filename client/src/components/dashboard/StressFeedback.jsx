import { useState, useEffect } from 'react';
import './StressFeedback.css';
import { FaBook, FaBrain, FaClipboardList, FaSearch, FaCommentDots, FaLightbulb, FaExclamationTriangle } from 'react-icons/fa';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

function StressFeedback({ studentId }) {
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'https://academic-emotional-intelligence-tracker.onrender.com/api';

    useEffect(() => {
        fetchFeedback();
    }, [studentId]);

    const fetchFeedback = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/feedback/${studentId}`);
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || 'Failed to load feedback');
            } else {
                setFeedback(data);
            }
        } catch (err) {
            setError('Could not connect to server');
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="feedback-container">
                <div className="feedback-loading">
                    <div className="loading-pulse"></div>
                    <p>Analyzing student data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="feedback-container">
                <div className="feedback-error">
                    <FaExclamationTriangle style={{ fontSize: '24px', marginBottom: '8px' }} />
                    <p>{error}</p>
                    <button onClick={fetchFeedback} className="btn-retry">Retry</button>
                </div>
            </div>
        );
    }

    if (!feedback) return null;

    const stressConfig = {
        high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', icon: '🔴', label: 'High Stress' },
        moderate: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', icon: '🟡', label: 'Moderate Stress' },
        low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', icon: '🟢', label: 'Low Stress' },
        unknown: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.3)', icon: '⚪', label: 'Insufficient Data' }
    };

    const config = stressConfig[feedback.stressLevel] || stressConfig.unknown;

    return (
        <div className="feedback-container">
            {/* Stress Level Header */}
            <div className="stress-header" style={{ background: config.bg, borderColor: config.border }}>
                <div className="stress-indicator">
                    <span className="stress-icon">{config.icon}</span>
                    <div className="stress-info">
                        <h2 style={{ color: config.color }}>{config.label}</h2>
                        {feedback.stressScore !== undefined && (
                            <div className="stress-meter">
                                <div className="meter-track">
                                    <div
                                        className="meter-fill"
                                        style={{
                                            width: `${feedback.stressScore}%`,
                                            background: `linear-gradient(90deg, #10b981, #f59e0b, #ef4444)`
                                        }}
                                    ></div>
                                </div>
                                <span className="meter-label">Stress Score: {feedback.stressScore}/100</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="feedback-summary">
                <h3><FaClipboardList style={{ marginRight: '8px' }} /> Summary</h3>
                <p>{feedback.summary}</p>
            </div>

            {/* Detailed Analysis */}
            {feedback.analysisPoints && feedback.analysisPoints.length > 0 && (
                <div className="feedback-section analysis-section">
                    <h3><FaSearch style={{ marginRight: '8px' }} /> Detailed Analysis</h3>
                    <ul className="analysis-list">
                        {feedback.analysisPoints.map((point, index) => (
                            <li key={index} className="analysis-item">
                                <span className="analysis-bullet">•</span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Academic & Emotional Cards */}
            <div className="detail-cards">
                {feedback.detailedAnalysis?.academic && (
                    <div className="detail-card academic-detail">
                        <h4><FaBook style={{ marginRight: '8px', color: '#10b981' }} /> Academic Analysis</h4>
                        <div className="detail-metrics">
                            <div className="detail-metric">
                                <span className="metric-label">Avg CGPA</span>
                                <span className="metric-value">{feedback.detailedAnalysis.academic.avgGpa}/10</span>
                            </div>
                            {feedback.detailedAnalysis.academic.avgAssignment && (
                                <div className="detail-metric">
                                    <span className="metric-label">Avg Assignment</span>
                                    <span className="metric-value">{feedback.detailedAnalysis.academic.avgAssignment}%</span>
                                </div>
                            )}
                            {feedback.detailedAnalysis.academic.avgAttendance && (
                                <div className="detail-metric">
                                    <span className="metric-label">Avg Attendance</span>
                                    <span className="metric-value">{feedback.detailedAnalysis.academic.avgAttendance}%</span>
                                </div>
                            )}
                            <div className="detail-status">
                                <strong>Status:</strong> {feedback.detailedAnalysis.academic.status}
                            </div>
                        </div>
                    </div>
                )}

                {feedback.detailedAnalysis?.emotional && (
                    <div className="detail-card emotional-detail">
                        <h4><FaBrain style={{ marginRight: '8px', color: '#7c3aed' }} /> Emotional Analysis</h4>
                        <div className="detail-metrics">
                            <div className="detail-metric">
                                <span className="metric-label">Overall EI</span>
                                <span className="metric-value">{feedback.detailedAnalysis.emotional.avgOverall}/10</span>
                            </div>
                            <div className="ei-pie-chart" style={{ width: '100%', maxWidth: '300px', height: '240px', margin: '20px auto' }}>
                                <Pie 
                                    data={{
                                        labels: ['Self Awareness', 'Self Regulation', 'Motivation', 'Empathy', 'Social Skills'],
                                        datasets: [{
                                            data: [
                                                feedback.detailedAnalysis.emotional.avgSelfAwareness,
                                                feedback.detailedAnalysis.emotional.avgSelfRegulation,
                                                feedback.detailedAnalysis.emotional.avgMotivation,
                                                feedback.detailedAnalysis.emotional.avgEmpathy,
                                                feedback.detailedAnalysis.emotional.avgSocialSkills
                                            ],
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
                                        plugins: { 
                                            legend: { 
                                                display: true,
                                                position: 'right',
                                                labels: { 
                                                    boxWidth: 12,
                                                    font: { size: 11, weight: 'bold' } 
                                                }
                                            } 
                                        },
                                        maintainAspectRatio: false,
                                        cutout: '30%'
                                    }} 
                                />
                            </div>
                            <div className="detail-status">
                                <strong>Status:</strong> {feedback.detailedAnalysis.emotional.status}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Remarks Analysis */}
            {feedback.detailedAnalysis?.remarks && (
                <div className="feedback-section remarks-section">
                    <h3><FaCommentDots style={{ marginRight: '8px' }} /> Remarks Analysis</h3>
                    <div className="remarks-quote">
                        <blockquote>"{feedback.detailedAnalysis.remarks.latestNotes}"</blockquote>
                        <small>- Recorded on {new Date(feedback.detailedAnalysis.remarks.date).toLocaleDateString()}</small>
                    </div>
                    {feedback.detailedAnalysis.remarks.stressIndicators.length > 0 && (
                        <div className="keyword-tags stress-tags">
                            <span className="tag-label">⚠️ Stress Indicators:</span>
                            {feedback.detailedAnalysis.remarks.stressIndicators.map((kw, i) => (
                                <span key={i} className="tag stress-tag">{kw}</span>
                            ))}
                        </div>
                    )}
                    {feedback.detailedAnalysis.remarks.positiveIndicators.length > 0 && (
                        <div className="keyword-tags positive-tags">
                            <span className="tag-label">✅ Positive Indicators:</span>
                            {feedback.detailedAnalysis.remarks.positiveIndicators.map((kw, i) => (
                                <span key={i} className="tag positive-tag">{kw}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Suggestions */}
            {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="feedback-section suggestions-section">
                    <h3><FaLightbulb style={{ marginRight: '8px', color: '#f59e0b' }} /> Recommendations</h3>
                    <div className="suggestions-grid">
                        {feedback.suggestions.map((suggestion, index) => (
                            <div key={index} className="suggestion-card">
                                <span className="suggestion-number">{index + 1}</span>
                                <p>{suggestion}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button className="btn-refresh-feedback" onClick={fetchFeedback}>
                🔄 Refresh Feedback
            </button>
        </div>
    );
}

export default StressFeedback;
