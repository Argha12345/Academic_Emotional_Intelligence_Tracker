import { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function GradesChart({ studentId }) {
  const chartRef = useRef(null);
  const [records, setRecords] = useState([]);
  
  useEffect(() => {
    fetch(`http://localhost:5000/api/academic/${studentId}`)
      .then(r => r.json())
      .then(data => setRecords((data || []).slice().reverse()));
  }, [studentId]);

  const data = {
    labels: records.map(r => r.semester ? `Semester ${r.semester}` : new Date(r.recordDate).toLocaleDateString()),
    datasets: [{
      label: 'CGPA',
      data: records.map(r => Number(r.gpa)),
      borderColor: '#6366f1',
      borderWidth: 4,
      tension: 0.45,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#6366f1',
      pointBorderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 8,
      fill: true,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 240);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        return gradient;
      }
    }]
  };

  const options = {
    scales: { 
        y: { 
            min: 0, 
            max: 10, 
            ticks: { stepSize: 2, color: '#94a3b8', font: { weight: 700 } },
            grid: { color: 'rgba(0,0,0,0.04)' },
            border: { display: false }
        },
        x: {
            ticks: { color: '#64748b', font: { weight: 700 } },
            grid: { display: false },
            border: { display: false }
        }
    },
    plugins: { 
        legend: { display: false },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            titleColor: '#e2e8f0',
            titleFont: { size: 13, weight: 'bold' },
            bodyColor: '#38bdf8',
            bodyFont: { size: 15, weight: 'bold' },
            padding: 14,
            cornerRadius: 12,
            displayColors: false,
            callbacks: {
                label: function(context) { return `CGPA Score: ${context.parsed.y}`; }
            }
        }
    },
    interaction: { mode: 'index', intersect: false },
    maintainAspectRatio: false
  };

  return <div style={{ height: 260, padding: '10px 0' }}><Line ref={chartRef} data={data} options={options} /></div>;
}