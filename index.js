const http = require('http');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

// === CONFIGURATION ===
const PORT = process.env.PORT || 3000;
const SPREADSHEET_ID = '1-SBY6gTLpY7AQEqqT8fJ-XxOAiwRDyStk4NovzaVVZk'; // Ton Sheet
const SHEET_NAME = 'Sheet1'; // Change si tu as renommé

// === SETUP SERVEUR DE STATUS ===
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot actif et connecté à Google Sheets.');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur http://0.0.0.0:${PORT}`);
  syncCommands();
});

// === LECTURE GOOGLE SHEETS ===
async function syncCommands() {
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:C2`, // Lecture ligne 2 pour test
    });

    const rows = result.data.values;
    if (!rows || rows.length === 0) {
      console.log('Aucune commande trouvée.');
      return;
    }

    const [command, amount, target] = rows[0];
    console.log(`Commande détectée: ${command}, Montant: ${amount}, Cible: ${target}`);

    // === EXÉCUTION DE BASE ===
    if (command.toLowerCase() === 'buy') {
      console.log(`>>> Achat simulé de ${amount} USDC avec target de ${target}%`);
      // ICI tu peux appeler ton vrai bot trading
    }

  } catch (error) {
    console.error('Erreur de synchro Google Sheets:', error.message);
  }

  // Re-scan toutes les 30 secondes
  setTimeout(syncCommands, 30000);
}
