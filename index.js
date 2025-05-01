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
import fs from 'fs';
import path from 'path';

dotenv.config();

// Connexion à Solana
const connection = new Connection(process.env.RPC_URL, 'confirmed');
const secretKey = bs58.decode(process.env.PRIVATE_KEY);
const wallet = Keypair.fromSecretKey(secretKey);
console.log("Wallet connecté:", wallet.publicKey.toBase58());

// Fonction d'envoi de SOL
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

// GOOGLE SHEETS SETUP
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SPREADSHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = 'COMMAND'; // nom de l’onglet

const auth = new google.auth.GoogleAuth({
  keyFile: path.join('./', 'credentials.json'), // ce fichier doit être dans ton repo
  scopes: SCOPES
});

async function readSheet() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:C50`
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('Aucune commande.');
    return;
  }

  for (const [command, amount, targetProfit] of rows) {
    if (command && amount) {
      console.log(`Commande: ${command} | Montant: ${amount} SOL | Target: ${targetProfit}%`);

      if (command.toLowerCase() === 'buy') {
        // Ici tu peux activer : await sendSol(destWallet, parseFloat(amount))
        console.log(`[SIMULATION] Achat ${amount} SOL`);
      }

      if (command.toLowerCase() === 'sell') {
        console.log(`[SIMULATION] Vente ${amount} SOL`);
      }
    }
  }
}

// Appelle le sheet toutes les 15 secondes
setInterval(readSheet, 15000);

// Serveur HTTP Fly.io
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Bot Solana actif + Google Sheets sync");
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`Serveur lancé sur le port ${port}`);
});
