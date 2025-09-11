

const {
    OPCUAClient,
    AttributeIds,
    TimestampsToReturn,
    MonitoringParametersOptions,
    ClientMonitoredItem,Variant, 
    DataType, 
    VariantArrayType
} = require("node-opcua");




const OPCUAServerWrapper = require('./OPCUA_server.js');
const {handleCut} = require('./algorithm.js');

const {getInputList} = require('./utils/getInputList.cjs');

const {createLC, createPC, createBoxArray} = require("./utils/OPCUA_Arrays.cjs");



//ELECTRON APP (if want to use NODE START comment this code)

/* const { app, BrowserWindow } = require('electron')

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
}) */

//end ELECTRON APP code


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

(async () => {
    try {
        await opcuaServer.initialize();
        //create variables
        await opcuaServer.createVariables();
        await opcuaServer.start();

        

        // Graceful shutdown on process termination
        process.on("SIGINT", async () => {
            await opcuaServer.shutdown();
            process.exit(0);
        });
    } catch (err) {
        console.error("Error starting OPC UA Server:", err);
        process.exit(1);
    }
})();


/**
 * Create a client to connect to the OPC UA server.
 * 
 */
(async () => {
    const client = OPCUAClient.create({});
    await client.connect("opc.tcp://NB-NICOLA-N.2RZ.LOCAL:4840/2rz/Resources");

    const session = await client.createSession();

    const subscription = await session.createSubscription2({
        requestedPublishingInterval: 1000,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 10,
        publishingEnabled: true,
        priority: 10
    });

    const bitStartMonitor = {
        nodeId: "ns=1;s=BitStart",
        attributeId: AttributeIds.Value
    };

    const parameters = {
        samplingInterval: 100,  // ogni 100ms
        discardOldest: true,
        queueSize: 10
    };

    const monitoredBitStart = await subscription.monitor(
        bitStartMonitor,
        parameters,
        TimestampsToReturn.Both
    );
    let listOfCuts = [];
    monitoredBitStart.on("changed", (dataValue) => {
        console.log("BitStart value has changed to:", dataValue.value.value);
        //insert function here
        if(dataValue.value.value === true) {
            //handle error in optimization
            var error = false;


            console.log("Starting optimization process...");
            let cutList = getInputList(opcuaServer);
            //console.log("cutList: ", cutList);
            let LenghToCut = opcuaServer.LunghezzaPezzo;

            listOfCuts = handleCut(cutList,LenghToCut,false, opcuaServer.MaxLenScarto, opcuaServer.SpessoreLama, opcuaServer.ScartoIntestatura); //call Optimization algorithm
            console.log("list of cuts", listOfCuts);
            if(listOfCuts==0)
            {
                error = true;
            }

            var nodesToWriteOutError = [
                {
                nodeId: "ns=1;s=OutError",
                attributeId: AttributeIds.Value,
                value: /*new DataValue(*/{
                    value: {/* Variant */
                    dataType: DataType.Boolean,
                    value: error
                    }
                }
                }
            ];
            session.write(nodesToWriteOutError, function (err, statusCode, diagnosticInfo) {
                if (!err) 
                {

                }

            });

            //extract array OutLc, OutPc, OutB
            let OutLc = createLC(listOfCuts);
            let OutPc = createPC(listOfCuts);
            let OutB = createBoxArray(opcuaServer.PcsLC, opcuaServer.PcsB, OutLc, opcuaServer.SpessoreLama);

/*             console.log("OutLc: ", OutLc);
            console.log("OutPc: ", OutPc);  
            console.log("OutB: ", OutB); */
            
            //scrittura dei risultati in variabili opcua
            //OutLC
            var nodesToWriteLC = [{
                nodeId: "ns=1;s=OutLc",
                attributeId: AttributeIds.Value,
                indexRange: null,
                value: { 
                    value: { 
                         dataType: DataType.Double,
                        arrayType: VariantArrayType.Array,
                         value: OutLc
                    }
                        }
                }];
            session.write(nodesToWriteLC, function(err,statusCode,diagnosticInfo) {
                if (!err) {
                    /* console.log(" nodesToWriteLC ok" );
                    console.log(diagnosticInfo);
                    console.log(statusCode); */
                }
                
            });  

            //OutPc
            var nodesToWritePc = [{
                nodeId: "ns=1;s=OutPc",
                attributeId: AttributeIds.Value,
                indexRange: null,
                value: { 
                    value: { 
                         dataType: DataType.Double,
                        arrayType: VariantArrayType.Array,
                         value: OutPc
                    }
                        }
                }];
            session.write(nodesToWritePc, function(err,statusCode,diagnosticInfo) {
                if (!err) {
                    /* console.log(" nodesToWritePc ok" );
                    console.log(diagnosticInfo);
                    console.log(statusCode); */
                }
                
            });  


            //OutB
            var nodesToWriteB = [{
                nodeId: "ns=1;s=OutB",
                attributeId: AttributeIds.Value,
                indexRange: null,
                value: { 
                    value: { 
                         dataType: DataType.Double,
                        arrayType: VariantArrayType.Array,
                         value: OutB
                    }
                        }
                }];
            session.write(nodesToWriteB, function(err,statusCode,diagnosticInfo) {
                if (!err) {
                    /* console.log(" nodesToWriteB ok" );
                    console.log(diagnosticInfo);
                    console.log(statusCode); */
                }
                
            });  

            // set OutEnd
            var nodesToWriteOutEnd = [
                {
                nodeId: "ns=1;s=OutEnd",
                attributeId: AttributeIds.Value,
                value: /*new DataValue(*/{
                    value: {/* Variant */
                    dataType: DataType.Boolean,
                    value: true
                    }
                }
                }
            ];

            session.write(nodesToWriteOutEnd, function (err, statusCode, diagnosticInfo) {
                if (!err) 
                {
                    /* console.log(" nodesToWriteOutEnd ok" );
                    console.log(diagnosticInfo);
                    console.log(statusCode); */
                }

            });


            //reset del bit di start BitStart a false
            // set BitStart
            var nodesToWriteBitStart = [
                {
                nodeId: "ns=1;s=BitStart",
                attributeId: AttributeIds.Value,
                value: /*new DataValue(*/{
                    value: {/* Variant */
                    dataType: DataType.Boolean,
                    value: false
                    }
                }
                }
            ];

            session.write(nodesToWriteBitStart, function (err, statusCode,diagnosticInfo) {
                if (!err) 
                {
                    /* console.log(" nodesToWriteBitStart ok" );
                    console.log(diagnosticInfo);
                    console.log(statusCode); */
                }

            });


        }
    });
   
})();




