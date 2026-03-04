const db = require('../config/db');

exports.getStudentAnalytics = (req, res) => {
    const studentId = req.params.studentId;

    db.all(
        'SELECT AVG(gpa) as avgGpa, AVG(assignmentScore) as avgAssignment, AVG(attendancePercentage) as avgAttendance FROM academic_records WHERE studentId = ?',
        [studentId],
        (err, academicData) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            db.all(
                'SELECT AVG(selfAwareness) as avgSelfAwareness, AVG(selfRegulation) as avgSelfRegulation, AVG(motivation) as avgMotivation, AVG(empathy) as avgEmpathy, AVG(socialSkills) as avgSocialSkills FROM emotional_records WHERE studentId = ?',
                [studentId],
                (err, emotionalData) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                    } else {
                        res.json({
                            academic: academicData[0] || {},
                            emotional: emotionalData[0] || {}
                        });
                    }
                }
            );
        }
    );
};

// Feedback Logic
function generateStressFeedback(student, academic, latestEmotional, emotionalAvg) {
    const avgGpa = academic?.avgGpa || null;
    const avgOverall = emotionalAvg?.avgOverall || null;
    const hasAcademicData = academic?.recordCount > 0 && avgGpa !== null;
    const hasEmotionalData = emotionalAvg?.recordCount > 0 && avgOverall !== null;

    // If no data at all
    if (!hasAcademicData && !hasEmotionalData) {
        return {
            studentName: student.name,
            stressLevel: 'unknown',
            summary: 'Not enough data to generate feedback. Please add academic and emotional intelligence records first.',
            suggestions: [
                'Add academic records with CGPA scores',
                'Complete an emotional intelligence assessment',
                'Both data points are needed for accurate stress analysis'
            ],
            detailedAnalysis: {
                academic: null,
                emotional: null,
                remarks: null
            }
        };
    }

    let stressScore = 0; // 0-100 scale, higher = more stressed
    const suggestions = [];
    const analysisPoints = [];

    // ===== Analyze CGPA =====
    let academicAnalysis = null;
    if (hasAcademicData) {
        academicAnalysis = {
            avgGpa: parseFloat(avgGpa.toFixed(2)),
            avgAssignment: academic.avgAssignment ? parseFloat(academic.avgAssignment.toFixed(1)) : null,
            avgAttendance: academic.avgAttendance ? parseFloat(academic.avgAttendance.toFixed(1)) : null,
            status: ''
        };

        if (avgGpa < 4.0) {
            stressScore += 40;
            academicAnalysis.status = 'Critical — CGPA is very low';
            analysisPoints.push(`CGPA is critically low at ${avgGpa.toFixed(2)}/10. This is a major stress indicator.`);
            suggestions.push('Consider seeking academic tutoring or mentoring support');
            suggestions.push('Break study goals into smaller, achievable milestones');
            suggestions.push('Talk to your academic advisor about a recovery plan');
        } else if (avgGpa < 6.0) {
            stressScore += 25;
            academicAnalysis.status = 'Below Average — needs improvement';
            analysisPoints.push(`CGPA is below average at ${avgGpa.toFixed(2)}/10. This may be causing academic stress.`);
            suggestions.push('Create a structured study schedule with regular breaks');
            suggestions.push('Focus on weaker subjects and seek peer study groups');
        } else if (avgGpa < 7.5) {
            stressScore += 10;
            academicAnalysis.status = 'Average — room for growth';
            analysisPoints.push(`CGPA is at ${avgGpa.toFixed(2)}/10. Decent performance with potential for improvement.`);
            suggestions.push('Set slightly higher academic goals each semester');
        } else {
            stressScore += 0;
            academicAnalysis.status = 'Good — performing well';
            analysisPoints.push(`CGPA is strong at ${avgGpa.toFixed(2)}/10. Keep up the momentum!`);
        }

        // Attendance factor
        if (academic.avgAttendance !== null && academic.avgAttendance < 60) {
            stressScore += 10;
            suggestions.push('Improve class attendance — low attendance often correlates with poor performance');
        }
    }

    // ===== Analyze Emotional Intelligence =====
    let emotionalAnalysis = null;
    if (hasEmotionalData) {
        emotionalAnalysis = {
            avgOverall: parseFloat(avgOverall.toFixed(1)),
            avgSelfAwareness: emotionalAvg.avgSelfAwareness ? parseFloat(emotionalAvg.avgSelfAwareness.toFixed(1)) : null,
            avgSelfRegulation: emotionalAvg.avgSelfRegulation ? parseFloat(emotionalAvg.avgSelfRegulation.toFixed(1)) : null,
            avgMotivation: emotionalAvg.avgMotivation ? parseFloat(emotionalAvg.avgMotivation.toFixed(1)) : null,
            avgEmpathy: emotionalAvg.avgEmpathy ? parseFloat(emotionalAvg.avgEmpathy.toFixed(1)) : null,
            avgSocialSkills: emotionalAvg.avgSocialSkills ? parseFloat(emotionalAvg.avgSocialSkills.toFixed(1)) : null,
            status: ''
        };

        if (avgOverall < 3.5) {
            stressScore += 40;
            emotionalAnalysis.status = 'Critical — emotional well-being is very low';
            analysisPoints.push(`Emotional intelligence overall score is very low at ${avgOverall.toFixed(1)}/10. This strongly indicates high stress.`);
            suggestions.push('Consider speaking with a counselor or mental health professional');
            suggestions.push('Practice daily mindfulness or meditation exercises');
        } else if (avgOverall < 5.5) {
            stressScore += 25;
            emotionalAnalysis.status = 'Below Average — emotional support recommended';
            analysisPoints.push(`Emotional intelligence score is below average at ${avgOverall.toFixed(1)}/10. Emotional well-being needs attention.`);
            suggestions.push('Join peer support groups or wellness workshops');
            suggestions.push('Practice journaling to improve self-awareness');
        } else if (avgOverall < 7.0) {
            stressScore += 10;
            emotionalAnalysis.status = 'Moderate — generally stable';
            analysisPoints.push(`Emotional intelligence is at ${avgOverall.toFixed(1)}/10. Fairly stable but monitor regularly.`);
        } else {
            stressScore += 0;
            emotionalAnalysis.status = 'Good — emotionally resilient';
            analysisPoints.push(`Emotional intelligence is strong at ${avgOverall.toFixed(1)}/10. Great emotional resilience!`);
        }

        // Check specific weak dimensions
        if (emotionalAvg.avgMotivation !== null && emotionalAvg.avgMotivation < 4) {
            stressScore += 8;
            suggestions.push('Motivation is low — set small rewarding goals and celebrate small wins');
        }
        if (emotionalAvg.avgSelfRegulation !== null && emotionalAvg.avgSelfRegulation < 4) {
            stressScore += 8;
            suggestions.push('Self-regulation is low — try breathing exercises and structured routines');
        }
        if (emotionalAvg.avgSocialSkills !== null && emotionalAvg.avgSocialSkills < 4) {
            stressScore += 5;
            suggestions.push('Social skills need work — try joining clubs or group activities');
        }
    }

    // ===== Analyze Remarks/Notes =====
    let remarksAnalysis = null;
    if (latestEmotional && latestEmotional.notes) {
        const notes = latestEmotional.notes.toLowerCase();
        const stressKeywords = ['stress', 'anxious', 'anxiety', 'depressed', 'sad', 'lonely', 'overwhelmed', 'pressure', 'burnout', 'exhausted', 'tired', 'failing', 'hopeless', 'worried', 'frustrated', 'angry', 'scared', 'nervous', 'panic'];
        const positiveKeywords = ['happy', 'confident', 'motivated', 'excited', 'calm', 'peaceful', 'grateful', 'optimistic', 'focused', 'energetic', 'positive'];

        const foundStress = stressKeywords.filter(kw => notes.includes(kw));
        const foundPositive = positiveKeywords.filter(kw => notes.includes(kw));

        remarksAnalysis = {
            latestNotes: latestEmotional.notes,
            date: latestEmotional.recordDate,
            stressIndicators: foundStress,
            positiveIndicators: foundPositive
        };

        if (foundStress.length >= 3) {
            stressScore += 20;
            analysisPoints.push(`Recent remarks contain multiple stress indicators: "${foundStress.join(', ')}". This is concerning.`);
            suggestions.push('The student\'s own words indicate significant stress — immediate counseling is recommended');
        } else if (foundStress.length >= 1) {
            stressScore += 10;
            analysisPoints.push(`Recent remarks mention stress-related words: "${foundStress.join(', ')}". Worth monitoring.`);
            suggestions.push('Monitor the student closely and check in regularly');
        }

        if (foundPositive.length > 0) {
            stressScore = Math.max(0, stressScore - 5);
            analysisPoints.push(`Positive indicators found in remarks: "${foundPositive.join(', ')}". A good sign.`);
        }
    }

    // ===== Combined Analysis =====
    if (hasAcademicData && hasEmotionalData && avgGpa < 5.0 && avgOverall < 5.0) {
        stressScore += 10;
        analysisPoints.push('⚠️ Both CGPA and emotional scores are low — this combination strongly indicates the student is under significant stress.');
        suggestions.push('Urgent: Schedule a one-on-one meeting with the student to discuss support options');
    }

    // Cap stress score
    stressScore = Math.min(100, stressScore);

    // Determine stress level
    let stressLevel;
    if (stressScore >= 60) {
        stressLevel = 'high';
    } else if (stressScore >= 30) {
        stressLevel = 'moderate';
    } else {
        stressLevel = 'low';
    }

    // Generate summary
    let summary;
    if (stressLevel === 'high') {
        summary = `${student.name} appears to be under HIGH stress. ${hasAcademicData ? `Average CGPA is ${avgGpa.toFixed(2)}/10` : 'No academic data'}. ${hasEmotionalData ? `Emotional well-being score is ${avgOverall.toFixed(1)}/10` : 'No emotional data'}. Immediate support and intervention is recommended.`;
    } else if (stressLevel === 'moderate') {
        summary = `${student.name} shows MODERATE stress levels. ${hasAcademicData ? `Average CGPA is ${avgGpa.toFixed(2)}/10` : 'No academic data'}. ${hasEmotionalData ? `Emotional well-being score is ${avgOverall.toFixed(1)}/10` : 'No emotional data'}. Regular check-ins and targeted support would be beneficial.`;
    } else {
        summary = `${student.name} appears to be in a GOOD state. ${hasAcademicData ? `Average CGPA is ${avgGpa.toFixed(2)}/10` : 'No academic data'}. ${hasEmotionalData ? `Emotional well-being score is ${avgOverall.toFixed(1)}/10` : 'No emotional data'}. Continue monitoring and encouragement.`;
    }

    // Add general wellness suggestions if list is short
    if (suggestions.length < 3) {
        suggestions.push('Maintain a healthy sleep schedule of 7-8 hours per night');
        suggestions.push('Take regular breaks during study sessions to avoid burnout');
    }

    return {
        studentName: student.name,
        stressLevel,
        stressScore,
        summary,
        analysisPoints,
        suggestions,
        detailedAnalysis: {
            academic: academicAnalysis,
            emotional: emotionalAnalysis,
            remarks: remarksAnalysis
        }
    };
} exports.getStressFeedback = (req, res) => {
    const studentId = req.params.studentId;

    // Get student info
    db.get('SELECT * FROM students WHERE id = ?', [studentId], (err, student) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Get average academic data
        db.get(
            'SELECT AVG(gpa) as avgGpa, COUNT(*) as recordCount, AVG(assignmentScore) as avgAssignment, AVG(attendancePercentage) as avgAttendance FROM academic_records WHERE studentId = ?',
            [studentId],
            (err, academic) => {
                if (err) return res.status(500).json({ error: err.message });

                // Get latest emotional record
                db.get(
                    'SELECT * FROM emotional_records WHERE studentId = ? ORDER BY recordDate DESC LIMIT 1',
                    [studentId],
                    (err, latestEmotional) => {
                        if (err) return res.status(500).json({ error: err.message });

                        // Get average emotional data
                        db.get(
                            'SELECT AVG(overallScore) as avgOverall, AVG(selfAwareness) as avgSelfAwareness, AVG(selfRegulation) as avgSelfRegulation, AVG(motivation) as avgMotivation, AVG(empathy) as avgEmpathy, AVG(socialSkills) as avgSocialSkills, COUNT(*) as recordCount FROM emotional_records WHERE studentId = ?',
                            [studentId],
                            (err, emotionalAvg) => {
                                if (err) return res.status(500).json({ error: err.message });

                                // Generate feedback
                                const feedback = generateStressFeedback(student, academic, latestEmotional, emotionalAvg);
                                res.json(feedback);
                            }
                        );
                    }
                );
            }
        );
    });
};
