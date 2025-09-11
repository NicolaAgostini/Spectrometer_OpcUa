





async function makeTestScan() {

    const ip = document.getElementById('ipInput').value;
    const name = document.getElementById('input_Material').value;

    const params = new URLSearchParams({ ip, name });

    const response = await fetch(`/api/testScan?${params.toString()}`);

    const data = await response.json();

    const resultDiv = document.getElementById('test_result');
    const resultCode = document.getElementById('material_code');

    if (response.ok) {

        resultCode.innerHTML="<p>Material code: " + data.testData.firstGradeMacth + "</p>";

        resultDiv.innerHTML = "<p>Spectrometer response: " + data + "</p>";


    } else {
        resultDiv.innerHTML = `<p style="color:red;">${data.error}</p>`;
    }
    }



