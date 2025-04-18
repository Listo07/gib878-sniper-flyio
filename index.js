import 'dotenv/config';
import { ethers } from 'ethers';
import axios from 'axios';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const SWAP_ROUTER_ADDRESS = '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86';

const SWAP_ROUTER_ABI = [
  'function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) payable returns (uint256)'
];

async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
    });
  } catch (error) {
    console.error('Erreur Telegram:', error);
  }
}

function monsterScore(token) {
  let score = 0;
  if (token.volume?.h24 > 10000) score += 30;
  if (token.liquidity?.usd > 5000) score += 30;
  if (token.baseToken.name.toLowerCase().includes("ai")) score += 20;
  return score + Math.random() * 20; // bonus aléatoire
}

async function scanAndSnipe() {
  try {
    console.log("Scanning for tokens...");
    const response = await axios.get('https://api.dexscreener.com/latest/dex/pairs/base');
    const pairs = response.data.pairs;

    for (const token of pairs.slice(0, 5)) {
      const score = monsterScore(token);
      const name = token.baseToken.name;
      const price = parseFloat(token.priceUsd);

      if (score > 88 && price < 0.05) {
        console.log(`Sniping ${name} (score: ${score.toFixed(2)})`);

        const swapRouter = new ethers.Contract(SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI, wallet);
        const amountIn = ethers.parseEther("0.005");

        const params = {
          tokenIn: '0x4200000000000000000000000000000000000006', // WETH on Base
          tokenOut: token.baseToken.address,
          fee: 3000,
          recipient: wallet.address,
          deadline: Math.floor(Date.now() / 1000) + 600,
          amountIn,
          amountOutMinimum: 0,
          sqrtPriceLimitX96: 0,
        };

        const tx = await swapRouter.exactInputSingle(params, {
          value: amountIn,
          gasLimit: 300000,
        });

        console.log("Trade TX:", tx.hash);
        await sendTelegramMessage(`Sniped ${name}! Score: ${score.toFixed(2)} | TX: ${tx.hash}`);
      }
    }
  } catch (error) {
    console.error("Erreur scan:", error.message);
    await sendTelegramMessage(`Erreur bot: ${error.message}`);
  }
}

setInterval(scanAndSnipe, 60000);
