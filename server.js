const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));

// Codes & Zuordnungen aus Render Environment Variables
const codeDatabase = {
  "12345": process.env.M3U_CODE_12345,
  "99887": process.env.M3U_CODE_99887,
  "55555": process.env.M3U_CODE_55555
};

app.get('/api/get-m3u', (req, res) => {
  const code = req.query.code;
  const targetUrl = codeDatabase[code];
  
  if (targetUrl) {
    res.json({ url: targetUrl });
  } else {
    res.status(404).json({ error: "Code nicht gefunden" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server laeuft auf Port ${PORT}`);
});
