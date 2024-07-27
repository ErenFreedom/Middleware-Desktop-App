const axios = require('axios');
const https = require('https');
require('dotenv').config();

exports.getLocalServerToken = async (req, res) => {
    const { username, password } = req.body;

    try {
        const response = await axios.post('http://localhost:3000/login', { username, password });

        if (response.data.token) {
            return res.json({ localToken: response.data.token });
        } else {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    } catch (error) {
        console.error('Error fetching local server token:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCloudToken = async (req, res) => {
    const { email, password, userType } = req.body; // Adding userType to determine if it's a staff or client

    let endpoint = '';
    if (userType === 'staff') {
        endpoint = 'https://ec2-3-109-41-79.ap-south-1.compute.amazonaws.com/api/backdoor-token';
    } else if (userType === 'client') {
        endpoint = 'https://ec2-3-109-41-79.ap-south-1.compute.amazonaws.com/api/backdoor-client-token';
    } else {
        return res.status(400).json({ error: 'Invalid user type' });
    }

    try {
        const response = await axios.post(
            endpoint, 
            { email, password },
            {
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            }
        );

        if (response.data.access_token) {
            return res.json({ token: response.data.access_token });
        } else {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    } catch (error) {
        console.error('Error fetching cloud token:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
