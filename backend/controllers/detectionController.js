// backend/controllers/detectionController.js
const { spawn } = require('child_process');

// This function will handle the API request and send the frame to the Python script
exports.analyzeFrame = (req, res) => {
    // Assuming you're sending the image as a base64 string in the request body
    const { image } = req.body; 

    // Spawn a Python child process
    const pythonProcess = spawn('python', ['path/to/your/python_script.py']);

    // Send the image data to the Python script's standard input
    pythonProcess.stdin.write(image);
    pythonProcess.stdin.end();

    let result = '';
    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python script error: ${data}`);
        res.status(500).send('Error analyzing frame');
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            try {
                const analysis = JSON.parse(result);
                res.json(analysis);
            } catch (e) {
                res.status(500).send('Invalid JSON response from script');
            }
        } else {
            res.status(500).send('Python script exited with error');
        }
    });
};