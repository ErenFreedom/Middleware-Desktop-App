const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);

const getConfigPath = () => {
    return path.join(os.homedir(), '.config', 'middleware-app');
};

// New route to save sensor names
app.post('/api/saveSensorNames', (req, res) => {
    const sensorNames = req.body;
    console.log('Received sensorNames:', sensorNames);  // Log received sensor names

    const configPath = getConfigPath();
    const filePath = path.join(configPath, 'sensorApis.json');  // Update file path here

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ success: false, message: 'Error reading file' });
        }

        let sensorApis;
        try {
            sensorApis = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ success: false, message: 'Error parsing JSON' });
        }

        // Merge incoming sensorNames with existing data
        sensorApis.sensors = sensorNames.map(sensor => ({
            api: sensor.api,
            name: sensor.name
        }));

        const updatedData = JSON.stringify(sensorApis, null, 2);
        console.log('Writing to file:', updatedData);  // Log what is being written to the file

        fs.writeFile(filePath, updatedData, (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).json({ success: false, message: 'Error writing file' });
            }

            res.status(200).json({ success: true });
        });
    });
});

// New route to get sensor names
app.get('/api/getSensorNames', (req, res) => {
    const configPath = getConfigPath();
    const filePath = path.join(configPath, 'sensorApis.json');  // Update file path here

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ success: false, message: 'Error reading file' });
        }

        let sensorApis;
        try {
            sensorApis = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ success: false, message: 'Error parsing JSON' });
        }

        res.status(200).json(sensorApis);
    });
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
