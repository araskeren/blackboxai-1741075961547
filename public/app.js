// DOM Elements
const meetingForm = document.getElementById('meetingForm');
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const statusDiv = document.getElementById('status');
const recordingsList = document.getElementById('recordingsList');

// State
let isRecording = false;

// Helper Functions
function updateStatus(message, type = 'info') {
    const statusMessage = document.createElement('div');
    statusMessage.className = `status-message p-4 rounded ${type === 'error' ? 'status-error' : type === 'success' ? 'status-success' : 'status-info'}`;
    statusMessage.textContent = message;
    
    // Clear previous status and add new one
    statusDiv.innerHTML = '';
    statusDiv.appendChild(statusMessage);
}

function setLoading(element, isLoading) {
    if (isLoading) {
        element.disabled = true;
        const loadingSpinner = document.createElement('span');
        loadingSpinner.className = 'loading mr-2';
        element.prepend(loadingSpinner);
    } else {
        element.disabled = false;
        const spinner = element.querySelector('.loading');
        if (spinner) spinner.remove();
    }
}

async function updateRecordingsList() {
    try {
        const response = await fetch('/recordings');
        const recordings = await response.json();
        
        recordingsList.innerHTML = '';
        
        if (recordings.length === 0) {
            recordingsList.innerHTML = '<p class="text-gray-500">No recordings available</p>';
            return;
        }

        recordings.forEach(recording => {
            const item = document.createElement('div');
            item.className = 'recording-item flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100';
            
            const date = new Date(recording.timestamp).toLocaleString();
            
            item.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-file-audio text-blue-500 mr-3"></i>
                    <div>
                        <div class="font-medium">${recording.name}</div>
                        <div class="text-sm text-gray-500">${date}</div>
                    </div>
                </div>
                <a href="/recordings/${recording.name}" download class="text-blue-500 hover:text-blue-700">
                    <i class="fas fa-download"></i>
                </a>
            `;
            
            recordingsList.appendChild(item);
        });
    } catch (error) {
        console.error('Error fetching recordings:', error);
        updateStatus('Failed to fetch recordings list', 'error');
    }
}

// Event Handlers
meetingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const meetingUrl = document.getElementById('meetingUrl').value;
    const meetingId = document.getElementById('meetingId').value;
    const password = document.getElementById('password').value;
    
    const submitBtn = meetingForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);
    
    try {
        const response = await fetch('/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ meetingUrl, meetingId, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus('Successfully joined the meeting', 'success');
            startRecordingBtn.disabled = false;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        updateStatus(`Failed to join meeting: ${error.message}`, 'error');
    } finally {
        setLoading(submitBtn, false);
    }
});

startRecordingBtn.addEventListener('click', async () => {
    setLoading(startRecordingBtn, true);
    
    try {
        const response = await fetch('/start-record', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            isRecording = true;
            updateStatus('Recording started', 'success');
            startRecordingBtn.disabled = true;
            stopRecordingBtn.disabled = false;
            startRecordingBtn.classList.add('recording-active');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        updateStatus(`Failed to start recording: ${error.message}`, 'error');
    } finally {
        setLoading(startRecordingBtn, false);
    }
});

stopRecordingBtn.addEventListener('click', async () => {
    setLoading(stopRecordingBtn, true);
    
    try {
        const response = await fetch('/stop-record', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            isRecording = false;
            updateStatus('Recording stopped and saved', 'success');
            startRecordingBtn.disabled = false;
            stopRecordingBtn.disabled = true;
            startRecordingBtn.classList.remove('recording-active');
            await updateRecordingsList();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        updateStatus(`Failed to stop recording: ${error.message}`, 'error');
    } finally {
        setLoading(stopRecordingBtn, false);
    }
});

// Initialize
window.addEventListener('load', () => {
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = true;
    updateRecordingsList();
});
