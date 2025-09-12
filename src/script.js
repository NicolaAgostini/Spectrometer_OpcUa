







async function makeTestScan() {
    console.log("makeTestScan");
    const ip = document.getElementById('input_IP').value;
    const name = document.getElementById('input_Material').value;

    const params = new URLSearchParams({ ip, name });

    const port = 3000;

    var url = "http://localhost:"+port+`/api/testScan?${params.toString()}`;

    var response = await window.fetch(url);


    const data = await response.json();

    const resultForm = document.getElementById('results-area');
    const resultCode = document.getElementById('material_code');

    if (response.ok) {
        console.log("response.ok", data);

        resultCode.value = "Material code: " + data.data.testData.firstGradeMatch;

        resultForm.value = "Spectrometer response: " + JSON.stringify(data, null, 2);;

        var firstGradeMatch = data.data.testData.firstGradeMatch; //save important data


    } else {
        resultForm.value = data.error;
    }
} 

// event listener
document.getElementById('analyzeBtn').addEventListener('click', makeTestScan);

