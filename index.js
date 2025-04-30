import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';

import dotenv from 'dotenv';
dotenv.config();

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
  } catch (err) {
    console.error("Erreur:", err);
  }
}

// TEST D’ENVOI (à modifier selon ta cible)
await sendSol("6rnwNH6SazWjxYr9Pb7EVz8ehHWKXvhrDSGnos2RVzDp", 0.001);
