const express = require('express');
const cors = require('cors');
const path = require('path');
const { joinZoom } = require('./autoZoomBot');
const { startRecording, stopRecording } = require('./recordAudio');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Endpoints
app.post('/join', async (req, res) => {
    try {
        const { meetingUrl, meetingId, password } = req.body;
        await joinZoom(meetingUrl, meetingId, password);
        res.json({ success: true, message: 'Successfully joined the meeting' });
    } catch (error) {
        console.error('Error joining meeting:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/start-record', async (req, res) => {
    try {
        const recordingPath = await startRecording();
        res.json({ success: true, message: 'Recording started', path: recordingPath });
    } catch (error) {
        console.error('Error starting recording:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/stop-record', async (req, res) => {
    try {
        const filePath = await stopRecording();
        res.json({ success: true, message: 'Recording stopped', filePath });
    } catch (error) {
        console.error('Error stopping recording:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
