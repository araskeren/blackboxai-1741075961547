const recorder = require('node-record-lpcm16');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

let recordingProcess = null;
let currentRecordingPath = null;

// Ensure recordings directory exists
const recordingsDir = path.join(__dirname, 'recordings');
fs.ensureDirSync(recordingsDir);

function startRecording() {
    return new Promise((resolve, reject) => {
        try {
            // Generate filename with timestamp
            const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
            const fileName = `recording_${timestamp}.wav`;
            currentRecordingPath = path.join(recordingsDir, fileName);

            // Start recording
            recordingProcess = recorder.record({
                sampleRate: 44100,
                channels: 2,
                audioType: 'wav'
            });

            // Pipe the recording to a file
            const fileStream = fs.createWriteStream(currentRecordingPath);
            recordingProcess.stream().pipe(fileStream);

            console.log(`Started recording: ${fileName}`);
            resolve(currentRecordingPath);

        } catch (error) {
            reject(new Error(`Failed to start recording: ${error.message}`));
        }
    });
}

function stopRecording() {
    return new Promise((resolve, reject) => {
        try {
            if (!recordingProcess) {
                throw new Error('No active recording to stop');
            }

            // Stop the recording process
            recordingProcess.stop();
            
            // Wait briefly to ensure file is written
            setTimeout(() => {
                const filePath = currentRecordingPath;
                recordingProcess = null;
                currentRecordingPath = null;
                
                console.log(`Stopped recording: ${filePath}`);
                resolve(filePath);
            }, 1000);

        } catch (error) {
            reject(new Error(`Failed to stop recording: ${error.message}`));
        }
    });
}

// Get list of recordings
function getRecordings() {
    try {
        const files = fs.readdirSync(recordingsDir);
        return files.map(file => ({
            name: file,
            path: path.join(recordingsDir, file),
            timestamp: fs.statSync(path.join(recordingsDir, file)).mtime
        })).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Error getting recordings:', error);
        return [];
    }
}

module.exports = {
    startRecording,
    stopRecording,
    getRecordings
};
