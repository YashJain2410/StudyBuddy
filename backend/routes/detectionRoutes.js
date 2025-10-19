import { spawn } from 'child_process';
import express from "express";

const router = express.Router();

export const setupDetectionSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected for detection');

        // === CHANGE HERE ===
        // Point to the new script and use 'python3 -u' for better real-time data flow.
       // Correct the filename to match your actual script
const pythonProcess = spawn('python', ['-u', 'detector/face_detector.py']);

        // Handle data from the Python script
        pythonProcess.stdout.on('data', (data) => {
            const result = data.toString().trim();
            if (result) {
                // Emit the analysis result back to the client
                socket.emit('analysis', result);
            }
        });

        // Handle errors from the Python script
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data.toString()}`);
            socket.emit('analysis', JSON.stringify({ error: data.toString() }));
        });

        // Handle client disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected from detection');
            pythonProcess.kill(); // Terminate the Python script
        });

        // Listen for frames from the client
        socket.on('frame', (frame) => {
            // Send the frame data to the Python script via stdin
            // console.log('Received frame from client'); // This is good for debugging
            pythonProcess.stdin.write(frame + '\n');
        });
    });
};

export default router;