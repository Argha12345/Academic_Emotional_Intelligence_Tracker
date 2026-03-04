import './Analytics.css';
import GradesChart from './GradesChart';

function Analytics({ student, data, onRefresh }) {
  const academicAvg = data.academic || {};
  const emotionalAvg = data.emotional || {};

  return (
    <div className="analytics-container">
      <div className="analytics-grid">

        {/* ===== Academic Analytics ===== */}
        <div className="analytics-card academic">
          <h3>📚 Academic Performance</h3>

          <div className="metric">
            <span>Average CGPA</span>
            <strong>
              {academicAvg.avgGpa !== null && academicAvg.avgGpa !== undefined
                ? academicAvg.avgGpa.toFixed(2)
                : 'N/A'}
            </strong>
          </div>

          <div className="metric">
            <span>Average Assignment Score</span>
            <strong>
              {academicAvg.avgAssignment !== null && academicAvg.avgAssignment !== undefined
                ? academicAvg.avgAssignment.toFixed(1)
                : 'N/A'}%
            </strong>
          </div>

          <div className="metric">
            <span>Average Attendance</span>
            <strong>
              {academicAvg.avgAttendance !== null && academicAvg.avgAttendance !== undefined
                ? academicAvg.avgAttendance.toFixed(1)
                : 'N/A'}%
            </strong>
          </div>

          {/* 📊 CGPA Trend Chart */}
          {student?.id && (
            <div style={{ marginTop: 12 }}>
              <GradesChart studentId={student.id} />
            </div>
          )}
        </div>

        {/* ===== Emotional Intelligence Analytics ===== */}
        <div className="analytics-card emotional">
          <h3>💭 Emotional Intelligence</h3>

          <div className="metric">
            <span>Self Awareness</span>
            <strong>
              {emotionalAvg.avgSelfAwareness !== null && emotionalAvg.avgSelfAwareness !== undefined
                ? emotionalAvg.avgSelfAwareness.toFixed(1)
                : 'N/A'}
              /10
            </strong>
          </div>

          <div className="metric">
            <span>Self Regulation</span>
            <strong>
              {emotionalAvg.avgSelfRegulation !== null && emotionalAvg.avgSelfRegulation !== undefined
                ? emotionalAvg.avgSelfRegulation.toFixed(1)
                : 'N/A'}
              /10
            </strong>
          </div>

          <div className="metric">
            <span>Motivation</span>
            <strong>
              {emotionalAvg.avgMotivation !== null && emotionalAvg.avgMotivation !== undefined
                ? emotionalAvg.avgMotivation.toFixed(1)
                : 'N/A'}
              /10
            </strong>
          </div>

          <div className="metric">
            <span>Empathy</span>
            <strong>
              {emotionalAvg.avgEmpathy !== null && emotionalAvg.avgEmpathy !== undefined
                ? emotionalAvg.avgEmpathy.toFixed(1)
                : 'N/A'}
              /10
            </strong>
          </div>

          <div className="metric">
            <span>Social Skills</span>
            <strong>
              {emotionalAvg.avgSocialSkills !== null && emotionalAvg.avgSocialSkills !== undefined
                ? emotionalAvg.avgSocialSkills.toFixed(1)
                : 'N/A'}
              /10
            </strong>
          </div>
        </div>

      </div>

      <button className="btn-refresh" onClick={onRefresh}>
        🔄 Refresh Analytics
      </button>
    </div>
  );
}

export default Analytics;
