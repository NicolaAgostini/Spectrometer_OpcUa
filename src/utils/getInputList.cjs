

const {cut} = require("../cut.js");
/*
    * Function to get the input list from OPC-UA nodes
*/
function getInputList(opcPS)
{

    let cutList = [];	//list of cuts to be processed
        for(let i=0;i<opcPS.PcsTD.length;i++){
            //if(opcuaServer.PcsTD[i] != 0){ //add only if cut amount is not zero
                cutList[i] = new cut(opcPS.PcsLC[i] + opcPS.SpessoreLama,opcPS.PcsTD[i]); //ogni taglio è in quota + spessore lama
                //console.log('taglio' + opcPS.PcsLC[i] + ' quantità ' + opcPS.PcsTD[i]);
            //}
        };
    //cutList.unshift(new cut(opcuaServer.ScartoIntestatura + opcuaServer.SpessoreLama,1)); //add first cut as first element

    return cutList;
}

module.exports = {
  getInputList
};


