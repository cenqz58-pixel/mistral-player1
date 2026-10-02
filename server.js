const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));

// Zuordnung der 5-stelligen Codes aus Render Environment Variables
const codeDatabase = {
  "12345": process.env.M3U_CODE_12345,
  "99887": process.env.M3U_CODE_99887,
  "55555": process.env.M3U_CODE_55555
};

app.get('/', (req, res) => {
  res.send("M3U Code Server laeuft online!");
});

// Neuer Proxy-Endpunkt: Laedt M3U serverseitig herunter (Umgat CORS)
app.get('/api/get-m3u', async (req, res) => {
  const code = req.query.code;
  const targetUrl = codeDatabase[code];

  if (!targetUrl) {
    return res.status(404).json({ error: "Code nicht gefunden" });
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SmartIPTV/3.0.103 (TizenOS; SmartTV)',
        'Accept': '*/*',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      // Zeigt uns genau an, welchen Fehler der IPTV-Anbieter zurückgibt
      return res.status(response.status).json({ 
        error: `IPTV-Anbieter antwortet mit Status ${response.status} (${response.statusText})` 
      });
    }

    const m3uText = await response.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(m3uText);

  } catch (err) {
    console.error("Proxy-Fehler:", err.message);
    res.status(500).json({ error: "Netzwerkfehler zum IPTV-Server: " + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server laeuft auf Port ${PORT}`));
