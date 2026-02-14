let logs = [];
const form = document.getElementById('tracker-form');
const logList = document.getElementById('log-list');
const avgMoodDisplay = document.getElementById('avg-mood');
const avgStressDisplay = document.getElementById('avg-stress');
const statusText = document.getElementById('status-text');
const alertBox = document.getElementById('alert-box');
form.addEventListener('submit', function(e) {
    e.preventDefault(); 
    const subject = document.getElementById('subject').value;
    const mood = parseInt(document.getElementById('mood').value);
    const stress = parseInt(document.getElementById('stress').value);
    const notes = document.getElementById('notes').value;
    const entry = {
        id: Date.now(),
        subject,
        mood,
        stress,
        notes,
        time: new Date().toLocaleTimeString()
    };
    logs.unshift(entry);
    renderLogs();
    updateStats();
    form.reset();
});
function renderLogs() {
    logList.innerHTML = '';
    
    logs.forEach(log => {
        const item = document.createElement('li');
        item.className = 'log-item';
        item.style.borderLeftColor = log.mood >= 5 ? '#2ecc71' : '#e74c3c'; 
        item.innerHTML = `
            <div class="log-details">
                <strong>${log.subject}</strong>
                <small>${log.notes} | ${log.time}</small>
            </div>
            <div class="log-scores">
                <div>Mood: ${log.mood}/10</div>
                <div>Stress: ${log.stress}/10</div>
            </div>
        `;
        logList.appendChild(item);
    });
}
function updateStats() {
    if (logs.length === 0) return;
    const totalMood = logs.reduce((sum, log) => sum + log.mood, 0);
    const totalStress = logs.reduce((sum, log) => sum + log.stress, 0);
    const avgMood = (totalMood / logs.length).toFixed(1);
    const avgStress = (totalStress / logs.length).toFixed(1);
    avgMoodDisplay.innerText = avgMood;
    avgStressDisplay.innerText = avgStress;
    if (avgStress > 7 || avgMood < 4) {
        statusText.innerText = "Burnout Risk ⚠️";
        alertBox.className = "stat-card warning";
    } else {
        statusText.innerText = "Balanced ✅";
        alertBox.className = "stat-card good";
    }
}