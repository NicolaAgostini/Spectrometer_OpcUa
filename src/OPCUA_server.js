
/** @module 2rz opcua server for optimizination 1-D */

const { OPCUAServer, Variant, DataType, VariantArrayType, StatusCodes } = require("node-opcua");

class OPCUAServerWrapper {


    /**
     * Create a server.
     * @param {object} options - The options for the server.
     */
    constructor(options) {
        this.server = new OPCUAServer(options);

        //varibles from plc to pc
        this.LunghezzaPezzo = 1500; // Length of the piece
        this.ScartoIntestatura = 30; // Waste of the head    
        this.SpessoreLama = 10; // Thickness of the blade
        this.MaxLenScarto = 100; // Maximum length for waste cut
        this.PcsTD = new Float64Array(300).fill(0); // Pieces to do 
        this.PcsLC = new Float64Array(300).fill(0); // Measures for the pieces to do
        this.PcsB = new Float64Array(300).fill(0); // Box of discharge
        this.BitStart = false; // Bit for starting the optimization calculations

        //varibles from pc to plc
        this.OutLc = new Float64Array(300).fill(0); // array of lengths to be cut
        this.OutPc = new Float64Array(300).fill(0); // array of pieces to be cut
        this.OutB = new Float64Array(300).fill(0); // array of boxes where to put the pieces
        this.OutEnd = false; // Flag for completion of the optimization process
        this.OutError = false; // Flag for error in optimization process

        //inizializzazioni per test
        this.PcsTD[0] = 5;
        this.PcsTD[1] = 2;
        this.PcsLC[0]=90;
        this.PcsLC[1]=40;
        this.PcsB[0]=1; // box for 90
        this.PcsB[1]=3; // box for 40


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
     * It defines several variables related to cutting optimization, such as piece length, waste, blade thickness, maximum waste length, 
     * pieces to do, measures for pieces to do, discharge box, and a bit for starting calculations.
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

        // Variable 1: piece length
        namespace.addVariable({
            componentOf: PLCToDevice,
            browseName: "LunghezzaPezzo",
            nodeId: "ns=1;s=LunghezzaPezzo",
            minimumSamplingInterval: 1000,
            dataType: "Double",
            value: {
                            get: () => new Variant({ dataType: DataType.Double, value: self.LunghezzaPezzo }),
            set: (variant) => {
                self.LunghezzaPezzo = variant.value;
                return StatusCodes.Good; 
            }
        }
        });

        console.log("Created variable LunghezzaPezzo");
        // Variable 2: first scrap
        namespace.addVariable({
            componentOf: PLCToDevice,
            browseName: "ScartoIntestatura",
            nodeId: "ns=1;s=ScartoIntestatura",
            minimumSamplingInterval: 1000,
            dataType: "Double",
            value: {
                            get: () => new Variant({ dataType: DataType.Double, value: self.ScartoIntestatura }),
            set: (variant) => {
                self.ScartoIntestatura = variant.value;
                return StatusCodes.Good; 
            }
        }
        });

        // Variable 3: blade thickness
        namespace.addVariable({
            componentOf: PLCToDevice,
            browseName: "SpessoreLama",
            nodeId: "ns=1;s=SpessoreLama",
            minimumSamplingInterval: 1000,
            dataType: "Double",
            value: {
                            get: () => new Variant({ dataType: DataType.Double, value: self.SpessoreLama }),
            set: (variant) => {
                self.SpessoreLama = variant.value;
                return StatusCodes.Good; 
            }
        }
        });

        // Variable 4: Max length for waste cut
        namespace.addVariable({
            componentOf: PLCToDevice,
            browseName: "MaxLenScarto",
            nodeId: "ns=1;s=MaxLenScarto",
            minimumSamplingInterval: 1000,
            dataType: "Double",
            value: {
                            get: () => new Variant({ dataType: DataType.Double, value: self.MaxLenScarto }),
            set: (variant) => {
                self.MaxLenScarto = variant.value;
                return StatusCodes.Good; 
            }
        }
        });

        // Variable 5: Pieces to be cut
        //let PcsTD = new Array(300).fill(0);
        namespace.addVariable({
            componentOf: PLCToDevice,
            browseName: "PcsTD",
            nodeId: "ns=1;s=PcsTD",
            minimumSamplingInterval: 1000,
            dataType: "Double",
            value: {
            get: function () {
                return new Variant({
                    dataType: DataType.Double,
                    arrayType: VariantArrayType.Array,
                    value: self.PcsTD
                });
            },
            set: function (variant) {
                self.PcsTD = new Float64Array(variant.value);
                return StatusCodes.Good; 
            }
            }
        });

        // Variable 6: Measures for pieces to be cut
        //let PcsLC = new Array(300).fill(0);
        namespace.addVariable({
            componentOf: PLCToDevice,
            browseName: "PcsLC",
            nodeId: "ns=1;s=PcsLC",
            minimumSamplingInterval: 1000,
            dataType: "Double",
            value: {
            get: function () {
                return new Variant({
                    dataType: DataType.Double,
                    arrayType: VariantArrayType.Array,
                    value: self.PcsLC
                });
            },
            set: function (variant) {
                self.PcsLC = new Float64Array(variant.value);
                return StatusCodes.Good; 
            }
            }
        });

        // Variable 7: Box for output pieces
        namespace.addVariable({
            componentOf: PLCToDevice,
            browseName: "PcsB",
            nodeId: "ns=1;s=PcsB",
            minimumSamplingInterval: 1000,
            dataType: "Double",
            value: {
            get: function () {
                return new Variant({
                    dataType: DataType.Double,
                    arrayType: VariantArrayType.Array,
                    value: self.PcsB
                });
            },
            set: function (variant) {
                self.PcsB = new Float64Array(variant.value);
                return StatusCodes.Good; 
            }
            }
        });

        // Variable 8: Bit to execute optimization process
        namespace.addVariable({
            componentOf: PLCToDevice,
            browseName: "BitStart",
            nodeId: "ns=1;s=BitStart",
            minimumSamplingInterval: 1000,
            dataType: "Boolean",
            value: {
                            get: () => new Variant({ dataType: DataType.Boolean, value: self.BitStart }),
            set: (variant) => {
                self.BitStart = variant.value;
                return StatusCodes.Good; 
            }
        }
        });

        //variables TOPLC
        const deviceToPLC = namespace.addObject({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "ToPLC"
        });

        // Variable 9: Output of lengths to be cut
        namespace.addVariable({
            componentOf: deviceToPLC,
            browseName: "OutLc",
            nodeId: "ns=1;s=OutLc",
            minimumSamplingInterval: 1000,
            dataType: "Double",
            value: {
            get: function () {
                return new Variant({
                    dataType: DataType.Double,
                    arrayType: VariantArrayType.Array,
                    value: self.OutLc
                });
            },
            set: function (variant) {
                self.OutLc = new Float64Array(variant.value);
                return StatusCodes.Good; 
            }
            }
        });

        // Variable 10: Output of pieces to be cut for each length
        namespace.addVariable({
            componentOf: deviceToPLC,
            browseName: "OutPc",
            nodeId: "ns=1;s=OutPc",
            minimumSamplingInterval: 1000,
            dataType: "Double",
            value: {
            get: function () {
                return new Variant({
                    dataType: DataType.Double,
                    arrayType: VariantArrayType.Array,
                    value: self.OutPc
                });
            },
            set: function (variant) {
                self.OutPc = new Float64Array(variant.value);
                return StatusCodes.Good; 
            }
            }
        });


        // Variable 11: Boxes where to put pieces for each lengths
        namespace.addVariable({
            componentOf: deviceToPLC,
            browseName: "OutB",
            nodeId: "ns=1;s=OutB",
            minimumSamplingInterval: 1000,
            dataType: "Double",
            value: {
            get: function () {
                return new Variant({
                    dataType: DataType.Double,
                    arrayType: VariantArrayType.Array,
                    value: self.OutB
                });
            },
            set: function (variant) {
                self.OutB = new Float64Array(variant.value);
                return StatusCodes.Good; 
            }
            }
        });

        // Variable 12: Bit for optimization process done
        namespace.addVariable({
            componentOf: deviceToPLC,
            browseName: "OutEnd",
            nodeId: "ns=1;s=OutEnd",
            minimumSamplingInterval: 1000,
            dataType: "Boolean",
            value: {
                            get: () => new Variant({ dataType: DataType.Boolean, value: self.OutEnd }),
            set: (variant) => {
                self.OutEnd = variant.value;
                return StatusCodes.Good; 
            }
        }
        });

        // Variable 13: Error bit
        namespace.addVariable({
            componentOf: deviceToPLC,
            browseName: "OutError",
            nodeId: "ns=1;s=OutError",
            minimumSamplingInterval: 1000,
            dataType: "Boolean",
            value: {
                            get: () => new Variant({ dataType: DataType.Boolean, value: self.OutError }),
            set: (variant) => {
                self.OutError = variant.value;
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

