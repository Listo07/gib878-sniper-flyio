import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';

import dotenv from 'dotenv';
import http from 'http';
import bs58 from 'bs58';
import { google } from 'googleapis';
import { readFile } from 'fs/promises';

dotenv.config();

// Connexion Solana
const connection = new Connection(process.env.RPC_URL, 'confirmed');
const secretKey = bs58.decode(process.env.PRIVATE_KEY);
const wallet = Keypair.fromSecretKey(secretKey);

console.log("Wallet connecté:", wallet.publicKey.toBase58());

// Fonction d’envoi de SOL
async function sendSol(destination, amountSol) {
  const to = new PublicKey(destination);
  const lamports = amountSol * 1e9;

  const tx = new Transaction().add(SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: to,
    lamports
  }));

  try {
    const signature = await sendAndConfirmTransaction(connection, tx, [wallet]);
    console.log("TX envoyée:", signature);
    return signature;
  } catch (err) {
    console.error("Erreur d'envoi:", err);
    return null;
  }
}

// Fonction lecture des commandes depuis Google Sheets
async function readCommandsFromSheet() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'google-key.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

  const sheetId = process.env.SHEET_ID;
  const range = 'Sheet1!A2:C';

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const rows = res.data.values;
  if (rows?.length) {
    for (const row of rows) {
      const [command, amount, target] = row;
      if (command?.toLowerCase() === 'send' && amount && target) {
        console.log(`Exécution : send ${amount} SOL à ${target}`);
        await sendSol(target, parseFloat(amount));
      }
    }
  }
}

// Boucle régulière pour checker le sheet
setInterval(() => {
  readCommandsFromSheet().catch(console.error);
}, 15000);

// Serveur HTTP Fly.io
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Bot Solana actif avec synchronisation Sheets.");
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`Serveur HTTP lancé sur le port ${port}`);
});
