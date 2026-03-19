import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import EmotionalRecord from '../models/EmotionalRecord.js';
// ---- Linear Regression (Ordinary Least Squares) ----
function linearRegression(points) {
    const n = points.length;
    if (n < 2) return null;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (const { x, y } of points) {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    }

    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    // R² (coefficient of determination)
    const yMean = sumY / n;
    let ssTot = 0, ssRes = 0;
    for (const { x, y } of points) {
        ssTot += (y - yMean) ** 2;
        ssRes += (y - (slope * x + intercept)) ** 2;
    }
    const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

    return { slope, intercept, rSquared };
}

// ---- Standard Deviation ----
function stdDev(values) {
    const n = values.length;
    if (n < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1);
    return Math.sqrt(variance);
}

// ---- Pearson Correlation ----
function pearsonCorrelation(x, y) {
    const n = x.length;
    if (n < 2 || n !== y.length) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
    }

    const denom = Math.sqrt(denX * denY);
    return denom === 0 ? 0 : num / denom;
}

// ---- Moving Average ----
function movingAverage(values, window = 3) {
    if (values.length <= window) return values;
    const result = [];
    for (let i = 0; i <= values.length - window; i++) {
        const slice = values.slice(i, i + window);
        result.push(slice.reduce((a, b) => a + b, 0) / window);
    }
    return result;
}

// ---- Classify Risk Level ----
function classifyRisk(avgGpa, gpaSlope, avgAttendance, avgAssignment, eiScore) {
    let riskScore = 0; // 0-100, higher = more at risk

    // GPA contribution (40% weight)
    if (avgGpa < 4) riskScore += 40;
    else if (avgGpa < 5.5) riskScore += 30;
    else if (avgGpa < 6.5) riskScore += 18;
    else if (avgGpa < 7.5) riskScore += 8;
    else riskScore += 0;

    // Trend contribution (20% weight) - declining trend is risky
    if (gpaSlope !== null) {
        if (gpaSlope < -0.5) riskScore += 20;
        else if (gpaSlope < -0.2) riskScore += 14;
        else if (gpaSlope < 0) riskScore += 6;
        else if (gpaSlope > 0.2) riskScore -= 5; // improving = lower risk
    }

    // Attendance contribution (20% weight)
    if (avgAttendance !== null) {
        if (avgAttendance < 50) riskScore += 20;
        else if (avgAttendance < 65) riskScore += 14;
        else if (avgAttendance < 75) riskScore += 8;
        else riskScore += 0;
    }

    // Assignment contribution (10% weight)
    if (avgAssignment !== null) {
        if (avgAssignment < 40) riskScore += 10;
        else if (avgAssignment < 60) riskScore += 6;
        else riskScore += 0;
    }

    // EI score contribution (10% weight)
    if (eiScore !== null) {
        if (eiScore < 4) riskScore += 10;
        else if (eiScore < 6) riskScore += 5;
    }

    riskScore = Math.max(0, Math.min(100, riskScore));

    let level, label, color;
    if (riskScore >= 60) { level = 'high'; label = 'High Risk'; color = '#ef4444'; }
    else if (riskScore >= 35) { level = 'moderate'; label = 'Moderate Risk'; color = '#f59e0b'; }
    else if (riskScore >= 15) { level = 'low'; label = 'Low Risk'; color = '#10b981'; }
    else { level = 'excellent'; label = 'Excellent'; color = '#0ea5e9'; }

    return { riskScore, level, label, color };
}

// ---- Generate Smart Recommendations ----
function generateRecommendations(data) {
    const { avgGpa, gpaSlope, avgAttendance, avgAssignment, eiScore, weakDimensions, riskLevel, predictedGpa, academicRecords } = data;
    const recs = [];

    // CGPA-based
    if (avgGpa < 5) {
        recs.push({ icon: '📉', title: 'Critical CGPA Alert', text: `Your average CGPA is ${avgGpa.toFixed(2)}. Consider intensive tutoring, focus on weak subjects, and create a daily study plan with at least 3 hours of focused study.`, priority: 'high' });
    } else if (avgGpa < 7) {
        recs.push({ icon: '📊', title: 'Room for Improvement', text: `CGPA of ${avgGpa.toFixed(2)} shows potential. Focus on understanding concepts deeply rather than memorization. Use past papers and group study sessions.`, priority: 'medium' });
    } else {
        recs.push({ icon: '🌟', title: 'Strong Academic Performance', text: `Excellent CGPA of ${avgGpa.toFixed(2)}! Maintain your study habits and consider mentoring peers to reinforce your own understanding.`, priority: 'low' });
    }

    // Trend-based
    if (gpaSlope !== null) {
        if (gpaSlope < -0.3) {
            recs.push({ icon: '⚠️', title: 'Declining Performance Detected', text: `Your CGPA has been declining by approximately ${Math.abs(gpaSlope).toFixed(2)} points per semester. Identify new challenges early and don't hesitate to seek help.`, priority: 'high' });
        } else if (gpaSlope > 0.2) {
            recs.push({ icon: '📈', title: 'Positive Upward Trend', text: `Great news! Your grades are improving by ~${gpaSlope.toFixed(2)} points per semester. Your study strategy is working - keep it up!`, priority: 'low' });
        }
    }

    // Attendance-based
    if (avgAttendance !== null && avgAttendance < 70) {
        recs.push({ icon: '🎯', title: 'Improve Attendance', text: `Attendance at ${avgAttendance.toFixed(1)}% is below ideal. Research shows strong correlation between attendance and grades. Set alarms and plan your commute.`, priority: 'medium' });
    }

    // Assignment-based
    if (avgAssignment !== null && avgAssignment < 60) {
        recs.push({ icon: '📝', title: 'Assignment Scores Need Attention', text: `Average assignment score of ${avgAssignment.toFixed(1)}% needs improvement. Start assignments early, use office hours, and review grading rubrics carefully.`, priority: 'medium' });
    }

    // EI-based recommendations
    if (weakDimensions && weakDimensions.length > 0) {
        const dimMap = {
            'selfAwareness': 'Practice daily journaling and reflection to better understand your emotions and triggers.',
            'selfRegulation': 'Try breathing exercises (4-7-8 technique) and establish structured daily routines.',
            'motivation': 'Set SMART goals, break them into weekly milestones, and reward yourself for completing them.',
            'empathy': 'Active listening exercises and volunteering can help develop empathy naturally.',
            'socialSkills': 'Join study groups, clubs, or team activities to build collaborative skills.'
        };
        for (const dim of weakDimensions.slice(0, 2)) {
            recs.push({ icon: '🧠', title: `Strengthen ${dim.label}`, text: dimMap[dim.key] || 'Work on developing this emotional intelligence dimension.', priority: 'medium' });
        }
    }

    // Prediction-based
    if (predictedGpa !== null && avgGpa !== null) {
        if (predictedGpa < avgGpa - 0.5) {
            recs.push({ icon: '🔮', title: 'Predicted Dip - Act Now', text: `Our model predicts a possible CGPA of ${predictedGpa.toFixed(2)} next semester. Take proactive steps: review fundamentals, increase study time, and seek academic counseling.`, priority: 'high' });
        } else if (predictedGpa > avgGpa + 0.3) {
            recs.push({ icon: '🔮', title: 'Predicted Improvement', text: `The trend suggests your next semester CGPA could reach ${predictedGpa.toFixed(2)}. Stay on your current trajectory and push a little harder!`, priority: 'low' });
        }
    }

    // Consistency analysis
    if (academicRecords && academicRecords.length >= 3) {
        const gpas = academicRecords.map(r => r.gpa).filter(g => g != null);
        const sd = stdDev(gpas);
        if (sd > 1.5) {
            recs.push({ icon: '🎢', title: 'Inconsistent Performance', text: `Your CGPA varies significantly (std dev: ${sd.toFixed(2)}). Build consistent study habits rather than cramming before exams.`, priority: 'medium' });
        } else if (sd < 0.5 && avgGpa >= 7) {
            recs.push({ icon: '💎', title: 'Consistently Strong', text: `Very consistent performance (std dev: ${sd.toFixed(2)}) with a strong average. You have excellent academic discipline!`, priority: 'low' });
        }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recs;
}


// =========================================================
// Main API Endpoint
// =========================================================
export const getAcademicInsights = async (req, res) => {
    const studentId = req.params.studentId;

    try {
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const academicRecords = await AcademicRecord.find({ studentId }).sort({ recordDate: 1 });
        const emotionalRecords = await EmotionalRecord.find({ studentId }).sort({ recordDate: 1 });

        const insights = computeInsights(student, academicRecords, emotionalRecords);
        res.json(insights);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =========================================================
// Mentor Stress Alert API
// Returns high-risk students for a given mentor
// =========================================================
export const getMentorStressAlerts = async (req, res) => {
    const mentorName = decodeURIComponent(req.params.mentorName);

    try {
        // Get all students assigned to this mentor
        const students = await Student.find({ mentorName: { $regex: new RegExp('^' + mentorName + '$', 'i') } });
        if (!students || students.length === 0) return res.json({ alerts: [] });

        const alerts = [];

        for (const student of students) {
            // Fetch latest 5 emotional records
            const eiRecords = await EmotionalRecord.find({ studentId: student.id }).sort({ recordDate: -1 }).limit(5);
            const academicRecords = await AcademicRecord.find({ studentId: student.id }).sort({ recordDate: 1 });

            const hasAcademicData = academicRecords && academicRecords.length > 0;
            const hasEiData = eiRecords && eiRecords.length > 0;

            // ── Skip entirely if this student has no records at all ──
            if (!hasAcademicData && !hasEiData) {
                continue;
            }

            // Compute risk for this student
            const gpas = hasAcademicData ? academicRecords.map(r => r.gpa).filter(g => g != null) : [];
            const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : null;

            const eiScores = hasEiData ? eiRecords.map(r => r.overallScore).filter(s => s != null) : [];
            const avgEi = eiScores.length > 0 ? eiScores.reduce((a, b) => a + b, 0) / eiScores.length : null;
            const latestEi = hasEiData ? eiRecords[0] : null;

            // Detect declining EI trend (stress increasing)
            let eiTrend = 'stable';
            let eiDrop = 0;
            if (eiScores.length >= 2) {
                const latest2 = eiScores.slice(0, 2);
                eiDrop = latest2[1] - latest2[0]; // latest[0] is most recent
                if (eiDrop < -0.5) eiTrend = 'declining';
                else if (eiDrop > 0.5) eiTrend = 'improving';
            }

            // Classify risk
            let gpaSlope = null;
            if (gpas.length >= 2) {
                const n = gpas.length;
                let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
                gpas.forEach((g, i) => { sumX += i; sumY += g; sumXY += i * g; sumX2 += i * i; });
                const denom = n * sumX2 - sumX * sumX;
                if (denom !== 0) gpaSlope = (n * sumXY - sumX * sumY) / denom;
            }

            const risk = classifyRisk(avgGpa, gpaSlope, null, null, avgEi);

            // Determine specific stress indicators
            const reasons = [];
            if (avgEi !== null && avgEi < 4.5) reasons.push(`Very low EI score (${avgEi.toFixed(1)}/10)`);
            else if (avgEi !== null && avgEi < 6) reasons.push(`Below average EI score (${avgEi.toFixed(1)}/10)`);
            if (eiTrend === 'declining') reasons.push(`Stress increasing - EI dropped by ${Math.abs(eiDrop).toFixed(1)} points recently`);
            if (avgGpa !== null && avgGpa < 5) reasons.push(`Critical CGPA (${avgGpa.toFixed(2)}/10)`);
            else if (avgGpa !== null && avgGpa < 6.5) reasons.push(`Below average CGPA (${avgGpa.toFixed(2)}/10)`);
            if (gpaSlope !== null && gpaSlope < -0.3) reasons.push(`CGPA declining by ${Math.abs(gpaSlope).toFixed(2)}/sem`);

            // Check weak dimensions from latest EI
            if (latestEi) {
                const dims = [
                    { label: 'Self Regulation', val: latestEi.selfRegulation },
                    { label: 'Motivation', val: latestEi.motivation },
                    { label: 'Self Awareness', val: latestEi.selfAwareness },
                ];
                dims.forEach(d => {
                    if (d.val !== null && d.val < 4) reasons.push(`${d.label} critically low (${d.val}/10)`);
                });
            }

            // Only alert if there is actual data-backed evidence of risk
            const hasRealRiskData = avgGpa !== null || avgEi !== null;
            const shouldAlert = hasRealRiskData && (
                risk.level === 'high' ||
                risk.level === 'moderate' ||
                eiTrend === 'declining' ||
                reasons.length > 0
            );

            if (shouldAlert) {
                alerts.push({
                    studentId: student.id,
                    studentName: student.name,
                    rollNumber: student.rollNumber,
                    department: student.department,
                    riskLevel: risk.level,
                    riskLabel: risk.label,
                    riskColor: risk.color,
                    riskScore: risk.riskScore,
                    eiTrend,
                    avgEi: avgEi !== null ? parseFloat(avgEi.toFixed(1)) : null,
                    avgGpa: avgGpa !== null ? parseFloat(avgGpa.toFixed(2)) : null,
                    reasons,
                    latestEiDate: latestEi ? latestEi.recordDate : null,
                    recordsCount: eiRecords ? eiRecords.length : 0
                });
            }
        }

        alerts.sort((a, b) => {
            const order = { high: 0, moderate: 1, low: 2, excellent: 3 };
            return (order[a.riskLevel] - order[b.riskLevel]) || (b.riskScore - a.riskScore);
        });

        res.json({ alerts, totalStudents: students.length });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

function computeInsights(student, academicRecords, emotionalRecords) {
    const result = {
        studentName: student.name,
        hasData: academicRecords.length > 0,
        recordCount: academicRecords.length,
        eiRecordCount: emotionalRecords.length,

        // CGPA Analysis
        averageGpa: null,
        gpaValues: [],
        gpaTrend: null,           // { slope, direction, description }
        predictedNextGpa: null,
        predictionConfidence: null,

        // Attendance & Assignment Analysis
        averageAttendance: null,
        averageAssignment: null,
        attendanceTrend: null,

        // Risk Classification
        riskClassification: null,

        // EI-Academic Correlation
        eiCorrelation: null,

        // Weak dimensions
        weakDimensions: [],
        strongDimensions: [],

        // Performance Summary
        performanceSummary: '',
        performanceGrade: '',

        // Smart Recommendations
        recommendations: [],

        // Chart data
        chartData: {
            gpaHistory: [],
            attendanceHistory: [],
            eiHistory: [],
            movingAvgGpa: []
        }
    };

    if (academicRecords.length === 0) {
        result.performanceSummary = 'No academic records available yet. Add CGPA data to get ML-powered insights.';
        result.recommendations = [
            { icon: '📋', title: 'Add Academic Data', text: 'Contact your administrator to add academic records (CGPA, attendance, assignment scores) to unlock AI-powered insights and predictions.', priority: 'high' }
        ];
        return result;
    }

    // ---- Extract GPA values ----
    const gpas = academicRecords.map(r => r.gpa).filter(g => g != null);
    const attendances = academicRecords.map(r => r.attendancePercentage).filter(a => a != null);
    const assignments = academicRecords.map(r => r.assignmentScore).filter(a => a != null);

    result.gpaValues = gpas;
    result.averageGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : null;
    result.averageAttendance = attendances.length > 0 ? attendances.reduce((a, b) => a + b, 0) / attendances.length : null;
    result.averageAssignment = assignments.length > 0 ? assignments.reduce((a, b) => a + b, 0) / assignments.length : null;

    // ---- Chart Data ----
    result.chartData.gpaHistory = academicRecords.map((r, i) => ({
        semester: r.semester || `Sem ${i + 1}`,
        gpa: r.gpa,
        attendance: r.attendancePercentage,
        assignment: r.assignmentScore,
        date: r.recordDate
    }));

    if (gpas.length >= 3) {
        result.chartData.movingAvgGpa = movingAverage(gpas, 3).map((v, i) => ({
            index: i + 2,
            value: parseFloat(v.toFixed(2))
        }));
    }

    // ---- Linear Regression on GPAs ----
    if (gpas.length >= 2) {
        const gpaPoints = gpas.map((g, i) => ({ x: i, y: g }));
        const lr = linearRegression(gpaPoints);

        if (lr) {
            result.gpaTrend = {
                slope: parseFloat(lr.slope.toFixed(4)),
                rSquared: parseFloat(lr.rSquared.toFixed(4)),
                direction: lr.slope > 0.1 ? 'improving' : lr.slope < -0.1 ? 'declining' : 'stable',
                description: lr.slope > 0.1
                    ? `CGPA is improving by ~${lr.slope.toFixed(2)} per semester`
                    : lr.slope < -0.1
                        ? `CGPA is declining by ~${Math.abs(lr.slope).toFixed(2)} per semester`
                        : 'CGPA is relatively stable across semesters'
            };

            // Predict next semester with dampening for few data points
            const nextX = gpas.length;
            let rawPredicted = lr.slope * nextX + lr.intercept;

            // Dampening: with few records, blend prediction toward the current mean
            // This prevents wild extrapolation from just 2 data points
            const avgGpaVal = gpas.reduce((a, b) => a + b, 0) / gpas.length;
            const lastGpa = gpas[gpas.length - 1];
            const dampeningFactor = Math.min(1, (gpas.length - 1) / 5); // 0 at 1pt, 1 at 6+ pts
            let predicted = dampeningFactor * rawPredicted + (1 - dampeningFactor) * avgGpaVal;

            // Max allowed single-semester change: ±1.5 CGPA from the last recorded value
            const maxChange = 1.5;
            predicted = Math.max(lastGpa - maxChange, Math.min(lastGpa + maxChange, predicted));

            // Hard clamp to valid CGPA range [0, 10]
            predicted = Math.max(0, Math.min(10, predicted));

            result.predictedNextGpa = parseFloat(predicted.toFixed(2));
            result.predictionConfidence = parseFloat((lr.rSquared * 100).toFixed(1));
        }
    }

    // ---- Attendance trend ----
    if (attendances.length >= 2) {
        const attPoints = attendances.map((a, i) => ({ x: i, y: a }));
        const attLr = linearRegression(attPoints);
        if (attLr) {
            result.attendanceTrend = {
                slope: parseFloat(attLr.slope.toFixed(2)),
                direction: attLr.slope > 1 ? 'improving' : attLr.slope < -1 ? 'declining' : 'stable'
            };
        }
    }

    // ---- EI Analysis ----
    if (emotionalRecords.length > 0) {
        const eiScores = emotionalRecords.map(r => r.overallScore).filter(s => s != null);
        const avgEi = eiScores.length > 0 ? eiScores.reduce((a, b) => a + b, 0) / eiScores.length : null;

        // Find weak and strong dimensions
        const dimensions = [
            { key: 'selfAwareness', label: 'Self Awareness' },
            { key: 'selfRegulation', label: 'Self Regulation' },
            { key: 'motivation', label: 'Motivation' },
            { key: 'empathy', label: 'Empathy' },
            { key: 'socialSkills', label: 'Social Skills' }
        ];

        for (const dim of dimensions) {
            const vals = emotionalRecords.map(r => r[dim.key]).filter(v => v != null);
            if (vals.length > 0) {
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                const entry = { ...dim, average: parseFloat(avg.toFixed(1)) };
                if (avg < 5) result.weakDimensions.push(entry);
                else if (avg >= 7) result.strongDimensions.push(entry);
            }
        }
        result.weakDimensions.sort((a, b) => a.average - b.average);
        result.strongDimensions.sort((a, b) => b.average - a.average);

        // ---- EI-Academic Correlation ----
        if (gpas.length >= 2 && eiScores.length >= 2) {
            const minLen = Math.min(gpas.length, eiScores.length);
            const gpaSlice = gpas.slice(-minLen);
            const eiSlice = eiScores.slice(-minLen);
            const corr = pearsonCorrelation(gpaSlice, eiSlice);

            result.eiCorrelation = {
                value: parseFloat(corr.toFixed(3)),
                strength: Math.abs(corr) > 0.7 ? 'strong' : Math.abs(corr) > 0.4 ? 'moderate' : 'weak',
                description: corr > 0.4
                    ? 'Higher emotional intelligence is positively correlated with better academic performance.'
                    : corr < -0.4
                        ? 'Interestingly, there is an inverse relationship between EI scores and academic performance.'
                        : 'No strong correlation found between emotional intelligence and academic performance.'
            };
        }

        result.chartData.eiHistory = emotionalRecords.map((r, i) => ({
            date: r.recordDate,
            overall: r.overallScore,
            selfAwareness: r.selfAwareness,
            selfRegulation: r.selfRegulation,
            motivation: r.motivation,
            empathy: r.empathy,
            socialSkills: r.socialSkills
        }));

        // Risk classification with EI
        result.riskClassification = classifyRisk(
            result.averageGpa,
            result.gpaTrend?.slope || null,
            result.averageAttendance,
            result.averageAssignment,
            avgEi
        );
    } else {
        // Risk without EI
        result.riskClassification = classifyRisk(
            result.averageGpa,
            result.gpaTrend?.slope || null,
            result.averageAttendance,
            result.averageAssignment,
            null
        );
    }

    // ---- Performance Grade ----
    if (result.averageGpa >= 9) result.performanceGrade = 'A+';
    else if (result.averageGpa >= 8) result.performanceGrade = 'A';
    else if (result.averageGpa >= 7) result.performanceGrade = 'B+';
    else if (result.averageGpa >= 6) result.performanceGrade = 'B';
    else if (result.averageGpa >= 5) result.performanceGrade = 'C';
    else result.performanceGrade = 'D';

    // ---- Performance Summary ----
    const trendWord = result.gpaTrend?.direction || 'stable';
    const riskWord = result.riskClassification?.label || 'Unknown';
    result.performanceSummary = `${student.name} has an average CGPA of ${result.averageGpa.toFixed(2)}/10 (Grade: ${result.performanceGrade}). Performance trend is ${trendWord}. Risk classification: ${riskWord}.${result.predictedNextGpa ? ` Predicted next semester CGPA: ${result.predictedNextGpa}/10 (confidence: ${result.predictionConfidence}%).` : ''}`;

    // ---- Generate Recommendations ----
    result.recommendations = generateRecommendations({
        avgGpa: result.averageGpa,
        gpaSlope: result.gpaTrend?.slope || null,
        avgAttendance: result.averageAttendance,
        avgAssignment: result.averageAssignment,
        eiScore: emotionalRecords.length > 0
            ? emotionalRecords.map(r => r.overallScore).filter(v => v != null).reduce((a, b) => a + b, 0) / emotionalRecords.filter(r => r.overallScore != null).length
            : null,
        weakDimensions: result.weakDimensions,
        riskLevel: result.riskClassification?.level,
        predictedGpa: result.predictedNextGpa,
        academicRecords
    });

    return result;
}
