
/** @module 2rz opcua server for OPCUA spectrometer command */

const { OPCUAServer, Variant, DataType, VariantArrayType, StatusCodes } = require("node-opcua");

class OPCUAServerWrapper {


    /**
     * Create a server.
     * @param {object} options - The options for the server.
     */
    constructor(options) {
        this.server = new OPCUAServer(options);

        //varibles from plc to pc
        this.ip = ""; // ip of the spectrometer
        this.name = ""; // name of the material (es: Alloy,...)  
        this.bitStart = false; // start spectrometer analysis

        //varibles from pc to plc
        this.outMaterial = "0";
        this.outResult = false;
        this.outError = false;


    }
    
    /**
     * Initialize the server.
     */
    async initialize() {
        await this.server.initialize();
        console.log("OPC UA Server initialized!!!");
    }

    /**
     * create and define the nodes.
     */
    /**
     * Asynchronously creates and adds OPC UA variables to the server's address space.
     * It defines several variables related to spectrometer
     * 
     * @async
     * @returns {Promise<void>} Resolves when all variables have been created.
     */
    async createVariables(){
        const addressSpace = this.server.engine.addressSpace;
        const namespace = addressSpace.getOwnNamespace();

        const PLCToDevice = namespace.addObject({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "FromPLC"
        });

        const self = this; // Preserve the context of 'this' for use in event handlers

        // Variable 1: ip
        namespace.addVariable({
            componentOf: PLCToDevice,
            browseName: "ipAddr",
            nodeId: "ns=1;s=ipAddr",
            minimumSamplingInterval: 1000,
            dataType: "String",
            value: {
                            get: () => new Variant({ dataType: DataType.String, value: self.ip }),
            set: (variant) => {
                self.ip = variant.value;
                return StatusCodes.Good; 
            }
        }
        });

        console.log("Created variable ip");
        // Variable 2: name
        namespace.addVariable({
            componentOf: PLCToDevice,
            browseName: "materialName",
            nodeId: "ns=1;s=materialName",
            minimumSamplingInterval: 1000,
            dataType: "String",
            value: {
                            get: () => new Variant({ dataType: DataType.String, value: self.name }),
            set: (variant) => {
                self.name = variant.value;
                return StatusCodes.Good; 
            }
        }
        });

        // Variable 3: bit start
        namespace.addVariable({
            componentOf: PLCToDevice,
            browseName: "bitStart",
            nodeId: "ns=1;s=bitStart",
            minimumSamplingInterval: 1000,
            dataType: "Boolean",
            value: {
                            get: () => new Variant({ dataType: DataType.Boolean, value: self.bitStart }),
            set: (variant) => {
                self.bitStart = variant.value;
                return StatusCodes.Good; 
            }
        }
        });

        //OUTPUT
        //variables TOPLC
        const deviceToPLC = namespace.addObject({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "ToPLC"
        });

        // Variable 4: material code
        namespace.addVariable({
            componentOf: deviceToPLC,
            browseName: "outMaterialCode",
            nodeId: "ns=1;s=outMaterialCode",
            minimumSamplingInterval: 1000,
            dataType: "String",
            value: {
            get: function () {
                return new Variant({
                    dataType: DataType.String,
                    value: self.outMaterial
                });
            },
            set: function (variant) {
                self.outMaterial = variant.value;
                return StatusCodes.Good; 
            }
            }
        });


        // Variable 5: Bit for request done
        namespace.addVariable({
            componentOf: deviceToPLC,
            browseName: "outEnd",
            nodeId: "ns=1;s=OutEnd",
            minimumSamplingInterval: 1000,
            dataType: "Boolean",
            value: {
                            get: () => new Variant({ dataType: DataType.Boolean, value: self.outResult }),
            set: (variant) => {
                self.outResult = variant.value;
                return StatusCodes.Good; 
            }
        }
        });

        // Variable 6: bit error
        namespace.addVariable({
            componentOf: deviceToPLC,
            browseName: "outError",
            nodeId: "ns=1;s=outError",
            minimumSamplingInterval: 1000,
            dataType: "Boolean",
            value: {
                            get: () => new Variant({ dataType: DataType.Boolean, value: self.outError }),
            set: (variant) => {
                self.outError = variant.value;
                return StatusCodes.Good; 
            }
        }
        });
        
    }

     /**
     * Start the server.
     */
    async start() {
        await this.server.start();
        console.log("OPC UA Server is now listening on", this.server.endpoints[0].endpointDescriptions()[0].endpointUrl);
    }

    /**
     * shoutdown the server gracefully.
     */
    async shutdown() {
        await this.server.shutdown(1000);
        console.log("OPC UA Server has been shut down");
    }

    /**
     * return the server instance.
     * @returns {OPCUAServer} The OPC UA server instance.
     */
    getServer() {
        return this.server;
    }
}

module.exports = OPCUAServerWrapper;

