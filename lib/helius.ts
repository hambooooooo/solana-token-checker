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
 * --- NEW FUNCTION ---
 * Fetches market data from DexScreener
 * We add a try/catch block so if this fails, we still get the safety report.
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
    // We can enhance this later to show all pairs.
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
  
  // --- UPDATED ---
  // Run all our fetches in parallel
  const [heliusAssetResult, heliusHoldersResult, dexScreenerPair] = await Promise.all([
    fetchHeliusAsset(mintAddress),
    fetchHeliusTokenLargestHolders(mintAddress),
    fetchDexScreenerData(mintAddress), // Add new fetch
  ]);

  // Use the results from the Helius fetches
  const assetData = heliusAssetResult;
  const largestHoldersData = heliusHoldersResult;

  // --- Run All Checks ---
  const mintAuthority = checkMintAuthority(assetData);
  const freezeAuthority = checkFreezeAuthority(assetData);
  
  const totalSupply = assetData.supply?.supply || 0;
  // --- UPDATED: Pass holder data to frontend ---
  const holderDistribution = {
    ...checkHolderDistribution(largestHoldersData, totalSupply),
    holders: largestHoldersData,
  };

  const metadata = checkMetadata(assetData);
  const liquidity = checkLiquidity(); // This is still a stubbed check
  
  // --- NEW: Get Market Cap from Helius ---
  const marketCap = assetData.supply?.market_cap || 0;

  // --- Compile Final Report ---
  return {
    // Safety Checks
    mintAuthority,
    freezeAuthority,
    holderDistribution,
    liquidity,
    metadata,
    // Token Info
    tokenInfo: {
      name: assetData.content.metadata.name || 'Unknown',
      symbol: assetData.content.metadata.symbol || 'Unknown',
      links: assetData.content.links || {}, // Pass social links
    },
    marketCap,
    // Market Data
    dexScreenerPair: dexScreenerPair, // Pass all DexScreener data
  };
}

// --- Individual Check Functions (No Changes) ---

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
      message: "⚠️ Metadata is Mutable: The creator can change the token's name and image (e.g., to impersonate another token).",
    };
  }
  return {
    status: 'pass',
    message: "✅ Metadata is Immutable: The token's name and image are permanent.",
  };
}

function checkHolderDistribution(holders: any[], totalSupply: number): CheckResult {
  if (!holders || holders.length === 0) {
    return { status: 'fail', message: '❌ Could not retrieve holder data.' };
  }
  
  if (totalSupply === 0) {
    return {
      status: 'pass',
      message: '✅ Token has 0 supply. Holder distribution is not applicable.',
    };
  }

  const top10 = holders.slice(0, 10);
  const top10Balance = top10.reduce((sum, holder) => sum + parseFloat(holder.amount), 0);
  const top10Percentage = (top10Balance / totalSupply) * 100; 

  if (top10Percentage > 20) {
    return {
      status: 'warn',
      message: `⚠️ High Concentration: The top 10 wallets hold ${top10Percentage.toFixed(1)}% of the supply. A sell-off could crash the price.`,
    };
  }
  return {
    status: 'pass',
    message: `✅ Healthy Distribution: The top 10 wallets hold ${top10Percentage.toFixed(1)}% of the supply.`,
  };
}

function checkLiquidity(): CheckResult {
  return {
    status: 'warn',
    message: '⚠️ LP Check Not Implemented: This tool does not check for locked liquidity. Always DYOR.',
  };
}

// --- Helius API Fetcher Functions (No Changes) ---

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
  return data.result.value;
}