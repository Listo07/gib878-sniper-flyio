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
import './sheetBot.js'; // INTÉGRATION GOOGLE SHEETS

dotenv.config();

// Setup Solana
const connection = new Connection(process.env.RPC_URL, 'confirmed');
const secretKey = bs58.decode(process.env.PRIVATE_KEY);
const wallet = Keypair.fromSecretKey(secretKey);

console.log("Wallet prêt:", wallet.publicKey.toBase58());

// Envoi SOL simple
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
    console.log("Transaction confirmée:", signature);
    return signature;
  } catch (err) {
    console.error("Erreur d'envoi:", err);
    return null;
  }
}

// Serveur HTTP Fly.io
const port = process.env.PORT || 3000;
http.createServer(async (req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Bot Sniper Solana ACTIF");
  } else if (req.url.startsWith("/send")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const to = url.searchParams.get('to');
    const amount = parseFloat(url.searchParams.get('amount'));
    const tx = await sendSol(to, amount);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: !!tx, tx }));
  } else {
    res.writeHead(404);
    res.end("404 Not Found");
  }
}).listen(port, () => {
  console.log(`Serveur prêt sur port ${port}`);
});
