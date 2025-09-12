

const {startOPCUA_Server, waitForTriggerTestScan} = require('./OPC_UA.js');

const OPCUAServerWrapper = require('./OPCUA_server.js');

const getLocalIPAddress = require('./utils/utils.js');

const os = require("os");

const cors = require('cors');


//ELECTRON APP (if want to use NODE START comment this code)

const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1100,
    height: 1200,
    minWidth: 400,
    minHeight: 500,
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

//end ELECTRON APP code

const express = require('express');
const fetch = require('node-fetch'); // oppure import fetch da 'node-fetch' se usi ES modules

const appExpress = express();
appExpress.use(cors()); //for cross call with different ip
const PORT = 3000;

appExpress.use(express.json());


//api from frontend
appExpress.get('/api/testScan', async (req, res) => {
    const name = req.query.name; //name of the matherial
    const ip = req.query.ip; //ip of the machine


    if (!name) {
        return res.status(400).json({ error: 'Missing name' });
    }
    if (!ip) {
        return res.status(400).json({ error: 'Missing ip' });
    }

    try {
    //const response = await fetch("http://"+ip+":8080/api/v2/config"); //get example

    const apiUrl = "http://"+ip+":8080/api/v2/test/final?mode="+name; // API for scanning
    console.log("test scan express api", apiUrl);


    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // empty json
    });

    //console.log("response", response );

    if (!response.ok) {
        console.log("response NOT ok", response );
        return res.status(response.status).json({ error: 'Error command, check API parameters' });
    }

    const data = await response.json();

    //console.log("data ", data );

    res.json({
        data
    });
    } catch (err) {
      console.log("response EXCEPTION", err );
      res.status(500).json({ error: 'Error in API request' });
    }  

});





appExpress.listen(PORT, () => {
  console.log(`Server listening on http://${getLocalIPAddress()}:${PORT}`);
});




//code for opcua

(async () => {

    const serverOptions = {
    port: 4334,
    resourcePath: "/2rz/Resources",   // opc.tcp://<hostname>:4334/2rz/Resources
    buildInfo: {
        productName: "2RZ Spectrometer OPCUA server",
        buildNumber: "1",
        buildDate: new Date()
      }
    };

    const opcuaServer = new OPCUAServerWrapper(serverOptions);

    await startOPCUA_Server(opcuaServer);

    waitForTriggerTestScan();

})();


