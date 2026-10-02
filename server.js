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
    // Exakter User-Agent von Smart IPTV v3.0.103
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'SmartIPTV/3.0.103 (TizenOS; SmartTV)',
        'Accept': '*/*',
        'Connection': 'keep-alive'
      }
    });

    if (!response.ok) {
      // Notfall-Fallback mit alter SmartIPTV-Schreibweise
      const fallbackResponse = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'SIPTV/3.0.103',
          'Accept': '*/*'
        }
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Provider verweigert Zugriff (HTTP ${fallbackResponse.status})`);
      }

      const textFallback = await fallbackResponse.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(textFallback);
    }

    const m3uText = await response.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(m3uText);

  } catch (err) {
    console.error("Proxy-Fehler:", err.message);
    res.status(500).json({ error: "M3U-Liste konnte vom Provider nicht abgerufen werden." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server laeuft auf Port ${PORT}`));
