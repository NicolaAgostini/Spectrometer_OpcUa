



//api from frontend
app.get('/api/testScan', async (req, res) => {
    const name = req.query.name?.toLowerCase(); //name of the matherial
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

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // empty json
    });

    if (!response.ok) {
        return res.status(response.status).json({ error: 'Error command, check API parameters' });
    }

    const data = await response.json();

    res.json({
        data
    });
    } catch (err) {
    res.status(500).json({ error: 'Error in API request' });
    }
});





app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
