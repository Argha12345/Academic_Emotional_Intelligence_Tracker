import { useState, useEffect } from 'react';
import './AcademicInsights.css';
import {
    FaBrain, FaChartLine, FaExclamationTriangle, FaCheckCircle,
    FaLightbulb, FaChartBar, FaGraduationCap, FaArrowUp, FaArrowDown,
    FaMinus, FaReact, FaStar, FaHeart
} from 'react-icons/fa';
import { capitalize } from '../../utils/stringUtils';

const API_URL = 'http://localhost:5000/api';

function AcademicInsights({ studentId, studentName }) {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (studentId) fetchInsights();
    }, [studentId]);

    const fetchInsights = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/ml/insights/${studentId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch insights');
            setInsights(data);
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="ml-loading">
                <div className="ml-loading-spinner"></div>
                <p>Running analysis...</p>
                <span>Analyzing academic data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ml-error">
                <FaExclamationTriangle size={32} />
                <p>{error}</p>
            </div>
        );
    }

    if (!insights || !insights.hasData) {
        return (
            <div className="ml-no-data">
                <FaReact size={48} />
                <h3>No Data for Analysis</h3>
                <p>Add academic records (CGPA, attendance, assignments) to unlock predictive analytics, performance trends, and personalized recommendations.</p>
            </div>
        );
    }

    const trendIcon = insights.gpaTrend?.direction === 'improving' ? <FaArrowUp /> :
        insights.gpaTrend?.direction === 'declining' ? <FaArrowDown /> : <FaMinus />;
    const trendColor = insights.gpaTrend?.direction === 'improving' ? '#10b981' :
        insights.gpaTrend?.direction === 'declining' ? '#ef4444' : '#f59e0b';

    const getGpaColor = (gpa) => {
        if (gpa >= 8) return '#10b981';
        if (gpa >= 6) return '#f59e0b';
        return '#ef4444';
    };

    // Find max GPA for bar heights
    const maxGpa = 10;

    return (
        <div className="ml-insights">
            {/* Header Banner */}
            <div className="ml-header-banner">
                <div className="ml-header-left">
                    <FaReact className="ml-header-icon" />
                    <div>
                        <h2>Smart Analytics</h2>
                        <p>Advanced academic analysis and performance predictions</p>
                    </div>
                </div>
                <div className="ml-header-badge">
                    <FaReact />
                    <span>{insights.recordCount} records analyzed</span>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="ml-stats-row">
                {/* Average CGPA */}
                <div className="ml-stat-card">
                    <div className="ml-stat-icon" style={{ background: `${getGpaColor(insights.averageGpa)}22`, color: getGpaColor(insights.averageGpa) }}>
                        <FaGraduationCap />
                    </div>
                    <div className="ml-stat-value" style={{ color: getGpaColor(insights.averageGpa) }}>
                        {insights.averageGpa?.toFixed(2)}
                    </div>
                    <div className="ml-stat-label">Average CGPA</div>
                    <div className="ml-stat-grade">Grade: {insights.performanceGrade}</div>
                </div>

                {/* Predicted CGPA */}
                <div className="ml-stat-card prediction">
                    <div className="ml-stat-icon" style={{ background: '#6366f122', color: '#6366f1' }}>
                        <FaChartLine />
                    </div>
                    <div className="ml-stat-value" style={{ color: '#6366f1' }}>
                        {insights.predictedNextGpa !== null ? insights.predictedNextGpa.toFixed(2) : 'N/A'}
                    </div>
                    <div className="ml-stat-label">Predicted Next CGPA</div>
                    {insights.predictionConfidence !== null && (
                        <div className="ml-stat-confidence">
                            <div className="ml-confidence-bar">
                                <div className="ml-confidence-fill" style={{ width: `${insights.predictionConfidence}%` }}></div>
                            </div>
                            <span>{insights.predictionConfidence}% confidence (R²)</span>
                        </div>
                    )}
                </div>

                {/* Trend */}
                <div className="ml-stat-card">
                    <div className="ml-stat-icon" style={{ background: `${trendColor}22`, color: trendColor }}>
                        {trendIcon}
                    </div>
                    <div className="ml-stat-value" style={{ color: trendColor }}>
                        {insights.gpaTrend?.direction ? capitalize(insights.gpaTrend.direction) : 'N/A'}
                    </div>
                    <div className="ml-stat-label">Performance Trend</div>
                    {insights.gpaTrend?.slope !== undefined && (
                        <div className="ml-stat-grade">
                            Slope: {insights.gpaTrend.slope > 0 ? '+' : ''}{insights.gpaTrend.slope}/sem
                        </div>
                    )}
                </div>

                {/* Risk Level */}
                <div className="ml-stat-card">
                    <div className="ml-stat-icon" style={{ background: `${insights.riskClassification?.color}22`, color: insights.riskClassification?.color }}>
                        {insights.riskClassification?.level === 'high' ? <FaExclamationTriangle /> :
                            insights.riskClassification?.level === 'excellent' ? <FaStar /> : <FaCheckCircle />}
                    </div>
                    <div className="ml-stat-value" style={{ color: insights.riskClassification?.color }}>
                        {insights.riskClassification?.label}
                    </div>
                    <div className="ml-stat-label">Risk Classification</div>
                    <div className="ml-risk-meter">
                        <div className="ml-risk-track">
                            <div className="ml-risk-fill" style={{
                                width: `${insights.riskClassification?.riskScore}%`,
                                background: insights.riskClassification?.color
                            }}></div>
                        </div>
                        <span>{insights.riskClassification?.riskScore}/100</span>
                    </div>
                </div>
            </div>

            {/* CGPA Chart */}
            <div className="ml-section">
                <h3><FaChartBar style={{ marginRight: '8px', color: '#6366f1' }} />CGPA Trend Analysis</h3>
                <div className="ml-chart-card">
                    <div className="ml-bar-chart">
                        {insights.chartData.gpaHistory.map((item, i) => (
                            <div key={i} className="ml-bar-col">
                                <div className="ml-bar-value" style={{ color: getGpaColor(item.gpa) }}>
                                    {item.gpa?.toFixed(1)}
                                </div>
                                <div className="ml-bar-wrapper">
                                    <div className="ml-bar" style={{
                                        height: `${(item.gpa / maxGpa) * 100}%`,
                                        background: `linear-gradient(180deg, ${getGpaColor(item.gpa)}, ${getGpaColor(item.gpa)}88)`
                                    }}></div>
                                </div>
                                <div className="ml-bar-label">{item.semester}</div>
                            </div>
                        ))}
                        {insights.predictedNextGpa !== null && (
                            <div className="ml-bar-col predicted">
                                <div className="ml-bar-value" style={{ color: '#6366f1' }}>
                                    {insights.predictedNextGpa.toFixed(1)}
                                </div>
                                <div className="ml-bar-wrapper">
                                    <div className="ml-bar predicted-bar" style={{
                                        height: `${(insights.predictedNextGpa / maxGpa) * 100}%`
                                    }}></div>
                                </div>
                                <div className="ml-bar-label">Predicted</div>
                            </div>
                        )}
                    </div>
                    {insights.gpaTrend && (
                        <div className="ml-trend-line-info">
                            <span style={{ color: trendColor }}>{trendIcon} {insights.gpaTrend.description}</span>
                            <span className="ml-r2">R² = {insights.gpaTrend.rSquared}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* EI-Academic Correlation */}
            {insights.eiCorrelation && (
                <div className="ml-section">
                    <h3><FaHeart style={{ marginRight: '8px', color: '#ec4899' }} />EI-Academic Correlation</h3>
                    <div className="ml-correlation-card">
                        <div className="ml-corr-visual">
                            <div className="ml-corr-circle" style={{
                                borderColor: insights.eiCorrelation.value > 0.3 ? '#10b981' :
                                    insights.eiCorrelation.value < -0.3 ? '#ef4444' : '#f59e0b'
                            }}>
                                <span className="ml-corr-value">r = {insights.eiCorrelation.value}</span>
                                <span className="ml-corr-strength">{capitalize(insights.eiCorrelation.strength)}</span>
                            </div>
                        </div>
                        <div className="ml-corr-info">
                            <p>{insights.eiCorrelation.description}</p>
                            {insights.weakDimensions.length > 0 && (
                                <div className="ml-weak-dims">
                                    <strong>Weak EI Dimensions:</strong>
                                    <div className="ml-dim-tags">
                                        {insights.weakDimensions.map(d => (
                                            <span key={d.key} className="ml-dim-tag weak">
                                                {d.label}: {d.average}/10
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {insights.strongDimensions.length > 0 && (
                                <div className="ml-strong-dims">
                                    <strong>Strong EI Dimensions:</strong>
                                    <div className="ml-dim-tags">
                                        {insights.strongDimensions.map(d => (
                                            <span key={d.key} className="ml-dim-tag strong">
                                                {d.label}: {d.average}/10
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Recommendations */}
            <div className="ml-section">
                <h3><FaLightbulb style={{ marginRight: '8px', color: '#f59e0b' }} />Smart Recommendations</h3>
                <div className="ml-recommendations">
                    {insights.recommendations.map((rec, i) => (
                        <div key={i} className={`ml-rec-card ml-rec-${rec.priority}`}>
                            <div className="ml-rec-icon">{rec.icon}</div>
                            <div className="ml-rec-content">
                                <h4>{rec.title}</h4>
                                <p>{rec.text}</p>
                            </div>
                            <div className={`ml-rec-badge ${rec.priority}`}>
                                {rec.priority}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="ml-summary-card">
                <FaReact className="ml-summary-icon" />
                <div>
                    <h4>Analysis Summary</h4>
                    <p>{insights.performanceSummary}</p>
                </div>
            </div>
        </div>
    );
}

export default AcademicInsights;
