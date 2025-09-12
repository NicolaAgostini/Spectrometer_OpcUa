

const os = require("os");

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

module.exports = getLocalIPAddress;