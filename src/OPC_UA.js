

const {
    OPCUAClient,
    AttributeIds,
    TimestampsToReturn,
    MonitoringParametersOptions,
    ClientMonitoredItem,Variant, 
    DataType, 
    VariantArrayType
} = require("node-opcua");


const getLocalIPAddress = require('./utils/utils.js');


const OPCUAServerWrapper = require('./OPCUA_server.js');







/* 
const serverOptions = {
    port: 4334,
    resourcePath: "/Spectrometer/Resources",   // opc.tcp://<hostname>:4334/Spectrometer/Resources
    buildInfo: {
        productName: "Spectrometer OPCUA server",
        buildNumber: "1",
        buildDate: new Date()
    }
};

const opcuaServer = new OPCUAServerWrapper(serverOptions); */



async function startOPCUA_Server(opcuaServer) //start opcua server
{
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
}


/**
 * Create a client to connect to the OPC UA server.
 * 
 */

async function waitForTriggerTestScan(opcuaServer)
{
    console.log("waitForTriggerTestScan");
    const client = OPCUAClient.create({});
    const port = 4334;
    const ip = getLocalIPAddress();

    await client.connect("opc.tcp://"+ip+":"+port+"/Spectrometer/Resources");

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
        nodeId: "ns=1;s=bitStart",
        attributeId: AttributeIds.Value
    };

    const parameters = {
        samplingInterval: 100,  // every 100ms
        discardOldest: true,
        queueSize: 10
    };

    const monitoredBitStart = await subscription.monitor(
        bitStartMonitor,
        parameters,
        TimestampsToReturn.Both
    );

    monitoredBitStart.on("changed", async (dataValue) => {
        console.log("BitStart value has changed to:", dataValue.value.value);

       /*  console.log("Server opcua IP ", opcuaServer.ip);
        console.log("Server opcua NAME", opcuaServer.name);
        console.log("Server opcua BIT START", opcuaServer.bitStart); */


        //insert function here
        if(dataValue.value.value === true) {

            //handle error in analysis
            var error = false;


            console.log("Calling Api...");
            try
            {
                var data = await makeTestScan_OPCUA(opcuaServer.ip, opcuaServer.name);
                console.log("waitForTriggerTestScan - data material ", data.testData.firstGradeMatch);

                var nodesToWriteMaterialCode = [{
                nodeId: "ns=1;s=outMaterialCode",
                attributeId: AttributeIds.Value,
                indexRange: null,
                value: { 
                    value: { 
                            dataType: DataType.String,
                            value: data.testData.firstGradeMatch
                    }
                        }
                }];
                await session.write(nodesToWriteMaterialCode, function(err,statusCode,diagnosticInfo) {
                if (!err) {
                    /* console.log(" nodesToWriteLC ok" );
                    console.log(diagnosticInfo);
                    console.log(statusCode); */
                }

                });  

                var nodesToWriteOutResult = [{
                nodeId: "ns=1;s=outEnd",
                attributeId: AttributeIds.Value,
                indexRange: null,
                value: { 
                    value: { 
                            dataType: DataType.Boolean,
                            value: true
                    }
                        }
                }];
                await session.write(nodesToWriteOutResult, function(err,statusCode,diagnosticInfo) {
                if (!err) {
                    /* console.log(" nodesToWriteLC ok" );
                    console.log(diagnosticInfo);
                    console.log(statusCode);  */
                }
                
                });  

                var nodesToWriteOutError = [{
                nodeId: "ns=1;s=outError",
                attributeId: AttributeIds.Value,
                indexRange: null,
                value: { 
                    value: { 
                            dataType: DataType.Boolean,
                            value: false
                    }
                        }
                }];
                await session.write(nodesToWriteOutError, function(err,statusCode,diagnosticInfo) {
                if (!err) {
                    /* console.log(" nodesToWriteLC ok" );
                    console.log(diagnosticInfo);
                    console.log(statusCode); */
                }

                });                  




            }
            catch{

                var nodesToWriteOutError = [{
                nodeId: "ns=1;s=outError",
                attributeId: AttributeIds.Value,
                indexRange: null,
                value: { 
                    value: { 
                            dataType: DataType.Boolean,
                            value: true
                    }
                        }
                }];
                await session.write(nodesToWriteOutError, function(err,statusCode,diagnosticInfo) {
                if (!err) {
                    console.log("outError");
                    console.log(err);
                    console.log(diagnosticInfo);
                    console.log(statusCode); 
                }

                }); 
            }
            

        }
    });
}

async function makeTestScan_OPCUA(ip, name)
{

    
    if (name == "") {
        throw new Error("Name not specified");
    }
    if (ip == "") {
        throw new Error("Ip not specified");
    }

    try {
    //const response = await fetch("http://"+ip+":8080/api/v2/config"); //get example

    const apiUrl = "http://"+ip+":8080/api/v2/test/final?mode="+name; // API for scanning

    console.log("makeTestScan_OPCUA - Api url ", apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // empty json
    });

    if (!response.ok) {
        console.log("makeTestScan_OPCUA - OPCUA, response not ok ", response.status);
        return json({ error: 'Error command, check API parameters' });
    }

    const data = await response.json();
    console.log("makeTestScan_OPCUA - data ", data.testData.firstGradeMatch);

    return data;

    } catch (err) {
    var error = json({ error: 'Error in API request' });
    return error;
    }
}

module.exports = { startOPCUA_Server, waitForTriggerTestScan };
