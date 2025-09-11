


function createLC(listOfCuts) {
    let OutLc = [];
    let cut = listOfCuts[0];
    OutLc[0] = listOfCuts[0];
    let k = 0;
    for(let i=1; i<listOfCuts.length; i++) {

        if(listOfCuts[i] != cut)
            {
                k++;
                OutLc[k] = listOfCuts[i];
                cut = listOfCuts[i];
            } 
    }
    //pad array to defined size
    for (let i=OutLc.length; i<300; i++) {
        OutLc[i] = 0;
    }
    return OutLc;
}


function createPC(listOfCuts) {
    let OutPc = [];
    let cut = listOfCuts[0];
    OutPc[0] = 1;
    let k = 0;
    for(let i=1; i<listOfCuts.length; i++) {

        if(listOfCuts[i] == cut)
            {
                OutPc[k]++;
            }
            else{
                k++;
                OutPc[k] = 1;
                cut = listOfCuts[i];
            }
        
    }
    //pad array to defined size
    for (let i=OutPc.length; i<300; i++) {
        OutPc[i] = 0;
    }
    return OutPc;
}


function createBoxArray(PcsLC, PcsB, OutLc, SpessoreLama)
{
    let OutB = [];      
    let dictB = {};
    for(let i=0; i<PcsB.length; i++) { 
        dictB[PcsLC[i]] = PcsB[i]; //dictionary, key= length to cut, value= box where to put the cut
    }
    //console.log("dictB: ", dictB);

    for(let i=OutLc.length-1; i>=0; i--) {
        if(dictB[OutLc[i]-SpessoreLama] != undefined) {
            OutB[i] = dictB[OutLc[i]-SpessoreLama]; 
            //delete dictionary element
            delete dictB[OutLc[i]-SpessoreLama];
        } else {
            OutB[i] = -1; //box di scarto
        }
    }
    //pad array to defined size
    for (let i=OutB.length; i<300; i++) {
        OutB[i] = 0;
    }
    return OutB;
}



module.exports = { createLC, createPC, createBoxArray };


