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

dotenv.config();

// Connexion à Solana
const connection = new Connection(process.env.RPC_URL, 'confirmed');
const secretKey = Uint8Array.from(Buffer.from(process.env.PRIVATE_KEY, 'base64'));
const wallet = Keypair.fromSecretKey(secretKey);

console.log("Wallet connecté:", wallet.publicKey.toBase58());

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

// Lancer une transaction automatique (optionnel)
await sendSol("6rnwNH6SazWjxYr9Pb7EVz8ehHWKXvhrDSGnos2RVzDp", 0.001);

// Serveur HTTP minimal pour Fly.io
const port = process.env.PORT || 3000;
http.createServer(async (req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Bot Solana actif.");
  } else if (req.url.startsWith("/send")) {
    // Exemple: /send?to=ADRESSE&amount=0.01
    const url = new URL(req.url, `http://${req.headers.host}`);
    const to = url.searchParams.get('to');
    const amount = parseFloat(url.searchParams.get('amount'));
    const tx = await sendSol(to, amount);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: !!tx, tx }));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`Serveur HTTP lancé sur le port ${port}`);
});
