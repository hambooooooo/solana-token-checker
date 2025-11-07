import { PublicKey } from '@solana/web3.js';

// Define the structure for a single check
type CheckResult = {
  status: 'pass' | 'fail' | 'warn';
  message: string;
};

// Define the structure for the final, full report
export type SafetyReport = {
  // Safety Checks
  mintAuthority: CheckResult;
  freezeAuthority: CheckResult;
  holderDistribution: CheckResult & { holders: any[] }; // Pass holders to frontend
  liquidity: CheckResult; 
  metadata: CheckResult;
  // Token Info
  tokenInfo: {
    name: string;
    symbol: string;
    links: any; // For social links
  };
  marketCap: number; // Helius Market Cap
  // DexScreener Data
  dexScreenerPair: any; // This will hold all the "jazz"
};

// Define the Helius API URL
const HELIUS_API_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

/**
 * Fetches market data from DexScreener
 */
async function fetchDexScreenerData(mintAddress: string) {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`DexScreener API request failed: ${response.status}`);
      return null;
    }
    const data = await response.json();
    // Return the first, most liquid pair.
    return data.pairs?.[0] || null;
  } catch (error) {
    console.error("Failed to fetch DexScreener data:", error);
    return null;
  }
}

/**
 * Fetches and processes all token safety checks from Helius
 * @param mintAddress The token mint address to check
 */
export async function getSafetyReport(mintAddress: string): Promise<SafetyReport> {
  
  const [heliusAssetResult, heliusHoldersResult, dexScreenerPair] = await Promise.all([
    fetchHeliusAsset(mintAddress),
    fetchHeliusTokenLargestHolders(mintAddress),
    fetchDexScreenerData(mintAddress),
  ]);

  const assetData = heliusAssetResult;
  const largestHoldersData = heliusHoldersResult;

  // --- Run All Checks ---
  const mintAuthority = checkMintAuthority(assetData);
  const freezeAuthority = checkFreezeAuthority(assetData);
  
  const totalSupply = assetData.supply?.supply || 0;
  
  // --- UPDATED ---
  // We now pass the 'totalSupply' (a float) into the holder check
  const holderDistribution = {
    ...checkHolderDistribution(largestHoldersData, totalSupply),
    holders: largestHoldersData,
  };
  // ---------------

  const metadata = checkMetadata(assetData);
  const liquidity = checkLiquidity(dexScreenerPair);
  
  const marketCap = assetData.supply?.market_cap || 0;

  // --- Compile Final Report ---
  return {
    mintAuthority,
    freezeAuthority,
    holderDistribution,
    liquidity,
    metadata,
    tokenInfo: {
      name: assetData.content.metadata.name || 'Unknown',
      symbol: assetData.content.metadata.symbol || 'Unknown',
      links: assetData.content.links || {},
    },
    marketCap,
    dexScreenerPair: dexScreenerPair,
  };
}

// --- Individual Check Functions ---

function checkMintAuthority(assetData: any): CheckResult {
  if (assetData.ownership.mint_authority) {
    return {
      status: 'fail',
      message: '❌ Mint Authority Active: The creator can print infinite new tokens, devaluing your position.',
    };
  }
  return {
    status: 'pass',
    message: '✅ Mint Authority Renounced: The creator cannot mint new tokens.',
  };
}

function checkFreezeAuthority(assetData: any): CheckResult {
  if (assetData.ownership.freeze_authority) {
    return {
      status: 'fail',
      message: '❌ Freeze Authority Active: The creator can freeze this token in your wallet, making it untradeable.',
    };
  }
  return {
    status: 'pass',
    message: '✅ Freeze Authority Renounced: The creator cannot freeze your tokens.',
  };
}

function checkMetadata(assetData: any): CheckResult {
  if (assetData.mutable) {
    return {
      status: 'warn',
      message: "⚠️ Metadata is Mutable: The creator can change the token's name and image.",
    };
  }
  return {
    status: 'pass',
    message: "✅ Metadata is Immutable: The token's name and image are permanent.",
  };
}

/**
 * --- THIS IS THE NEW, RELIABLE HOLDER CHECK ---
 */
function checkHolderDistribution(holders: any[], totalSupply: number): CheckResult {
  if (!holders || holders.length === 0) {
    return { status: 'fail', message: '❌ Could not retrieve holder data.' };
  }
  
  // This check is fine
  if (totalSupply === 0) {
    return {
      status: 'pass',
      message: '✅ Token has 0 supply. Holder distribution is not applicable.',
    };
  }

  // --- THIS IS THE BUG FIX ---
  // We MUST use 'uiAmount' (the float) to match the 'totalSupply' (also a float).
  // Using 'holder.amount' (a raw integer) caused a NaN error.
  const top10 = holders.slice(0, 10);
  const top10Balance = top10.reduce((sum, holder) => {
    const amount = parseFloat(holder.uiAmount); // Use uiAmount
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  // -----------------------

  // Guard against NaN division
  if (totalSupply === 0) {
     return { status: 'pass', message: '✅ Token has 0 supply.' };
  }

  const top10Percentage = (top10Balance / totalSupply) * 100;

  // Guard against NaN result (if calculations failed)
  if (isNaN(top10Percentage)) {
    return { status: 'fail', message: '❌ Failed to calculate holder distribution.' };
  }

  // --- NEW, STRICTER RUG PULL CHECK ---
  // We check the #1 holder *excluding* the LP
  // Note: Helius 'getTokenLargestAccounts' already excludes the LP, which is perfect for this.
  const top1HolderAmount = parseFloat(holders[0]?.uiAmount) || 0;
  const top1Percentage = (top1HolderAmount / totalSupply) * 100;

  if (top1Percentage > 20) {
     return {
      status: 'fail',
      message: `❌ Extreme Risk: The top wallet holds ${top1Percentage.toFixed(1)}% of the supply. This is a massive rug pull risk.`,
    };
  }
  
  if (top1Percentage > 10) {
     return {
      status: 'warn',
      message: `⚠️ High Risk: The top wallet holds ${top1Percentage.toFixed(1)}% of the supply.`,
    };
  }

  // Stricter check for the top 10 wallets
  if (top10Percentage > 40) {
    return {
      status: 'warn',
      message: `⚠️ High Concentration: The top 10 wallets hold ${top10Percentage.toFixed(1)}% of the supply. A sell-off could crash the price.`,
    };
  }
  
  return {
    status: 'pass',
    message: `✅ Healthy Distribution: Top wallet holds ${top1Percentage.toFixed(1)}% and top 10 hold ${top10Percentage.toFixed(1)}%.`,
  };
}


/**
 * --- THIS IS THE REAL LIQUIDITY CHECK (from last time) ---
 */
function checkLiquidity(pair: any): CheckResult {
  if (!pair || !pair.liquidity) {
    return {
      status: 'fail',
      message: '❌ No Liquidity: This token has no discoverable liquidity pool. It is untradeable.',
    };
  }

  const lpValue = parseFloat(pair.liquidity.usd);

  if (lpValue < 1000) {
    return {
      status: 'fail',
      message: `❌ Dangerously Low Liquidity: Only $${lpValue.toLocaleString()} in the pool. This is a high-risk rug pull.`,
    };
  }
  if (lpValue < 10000) {
    return {
      status: 'warn',
      message: `⚠️ Low Liquidity: Only $${lpValue.toLocaleString()} in the pool. Be cautious of high price impact (slippage).`,
    };
  }
  
  return {
    status: 'pass',
    message: `✅ Liquidity Found: $${lpValue.toLocaleString()} in the pool. (Note: This does not verify if LP is locked.)`,
  };
}


// --- Helius API Fetcher Functions (Unchanged) ---

async function fetchHeliusAsset(mintAddress: string): Promise<any> {
  const response = await fetch(HELIUS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'solana-token-checker',
      method: 'getAsset',
      params: {
        id: mintAddress,
      },
    }),
  });
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Helius getAsset error: ${data.error.message}`);
  }
  if (!data.result) {
    throw new Error('Failed to fetch asset data (no result)');
  }
  return data.result;
}

async function fetchHeliusTokenLargestHolders(mintAddress: string): Promise<any[]> {
  const response = await fetch(HELIUS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'solana-token-checker',
      method: 'getTokenLargestAccounts',
      params: [mintAddress],
    }),
  });
  const data = await response.json();

  if (data.error) {
    throw new Error(`Helius getTokenLargestAccounts error: ${data.error.message}`);
  }
  if (!data.result) {
    throw new Error('Failed to fetch holder data (no result)');
  }
  // This is the full list of holders
  return data.result.value; 
}