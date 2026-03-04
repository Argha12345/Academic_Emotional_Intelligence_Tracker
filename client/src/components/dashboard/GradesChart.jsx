import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function GradesChart({ studentId }) {
  const [records, setRecords] = useState([]);
  useEffect(() => {
    fetch(`http://localhost:5000/api/academic/${studentId}`)
      .then(r => r.json())
      .then(data => setRecords((data || []).slice().reverse())); // oldest → newest
  }, [studentId]);

  const data = {
    labels: records.map(r => new Date(r.recordDate).toLocaleDateString()),
    datasets: [{
      label: 'CGPA',
      data: records.map(r => Number(r.gpa)),
      borderColor: '#2196f3',
      backgroundColor: 'rgba(33,150,243,0.1)',
      tension: 0.25,
      pointRadius: 4
    }]
  };

  const options = {
    scales: { y: { min: 0, max: 10, ticks: { stepSize: 1 } } },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false
  };

  return <div style={{ height: 240 }}><Line data={data} options={options} /></div>;
}