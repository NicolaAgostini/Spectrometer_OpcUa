
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require("os");


const app = express();
const PORT = 8080;

// Middleware per parsing del body (opzionale, se ti serve il body della POST)
app.use(express.json());


function getLocalIPAddress() //function to get local ip address
{
    const interfaces = os.networkInterfaces();
    for (const ifaceName of Object.keys(interfaces)) {
        for (const iface of interfaces[ifaceName]) {
            // Ignore internal address and IPv6 (es. 127.0.0.1) and IPv6
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    throw new Error("No local ip address v4 found.");
}

app.post('/api/v2/test/final', (req, res) => {
    const mode = req.query.mode;

    if (mode !== 'Alloy') {
        return res.status(400).json({ error: "Parameter 'mode=Alloy' required" });
    }

    const filePath = path.join(__dirname, 'data', 'XRF.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON:', err);
            return res.status(500).json({ error: 'Server error while reading JSON file' });
        }

        try {
            const json = JSON.parse(data);
            res.json(json);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            res.status(500).json({ error: 'Error parsing JSON file' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`API server listening on http://${getLocalIPAddress()}:${PORT}`);
});