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
    // Render laedt die M3U-Datei direkt vom IPTV-Provider herunter
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VLC/3.0.18'
      }
    });

    if (!response.ok) {
      throw new Error(`IPTV Server Antwort: ${response.status}`);
    }

    const m3uText = await response.text();
    
    // Sendet den Inhalt sauber an den Smart TV zurück
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(m3uText);

  } catch (err) {
    console.error("Proxy-Fehler:", err.message);
    res.status(500).json({ error: "M3U-Liste konnte nicht vom Provider geladen werden." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server laeuft auf Port ${PORT}`));
