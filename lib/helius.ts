import { PublicKey } from '@solana/web3.js';

// --- NEW: Add known burn addresses ---
// 1nc1nerator11111111111111111111111111111111 is the main one
const BURN_ADDRESSES = new Set([
  '1nc1nerator11111111111111111111111111111111',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token Program (often holds burned LP)
]);

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
  holderDistribution: CheckResult & { holders: any[] }; 
  liquidity: CheckResult; 
  metadata: CheckResult;
  lpCheck: CheckResult; // <-- 1. ADD NEW LP CHECK
  // Token Info
  tokenInfo: {
    name: string;
    symbol: string;
    links: any; 
  };
  marketCap: number; 
  totalSupply: number; 
  // DexScreener Data
  dexScreenerPair: any; 
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
    return data.pairs?.[0] || null;
  } catch (error) {
    console.error("Failed to fetch DexScreener data:", error);
    return null;
  }
}

/**
 * Fetches and processes all token safety checks from Helius
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
  
  const holderDistribution = {
    ...checkHolderDistribution(largestHoldersData, totalSupply),
    holders: largestHoldersData,
  };

  const metadata = checkMetadata(assetData);
  const liquidity = checkLiquidity(dexScreenerPair, totalSupply);
  
  // --- 2. RUN THE NEW LP CHECK ---
  const lpCheck = await checkLpLock(dexScreenerPair);
  // -----------------------------
  
  const marketCap = assetData.supply?.market_cap || 0;

  // --- Compile Final Report ---
  return {
    mintAuthority,
    freezeAuthority,
    holderDistribution,
    liquidity,
    metadata,
    lpCheck: lpCheck, // <-- 3. ADD TO REPORT
    tokenInfo: {
      name: assetData.content.metadata.name || 'Unknown',
      symbol: assetData.content.metadata.symbol || 'Unknown',
      links: assetData.content.links || {},
    },
    marketCap,
    totalSupply: totalSupply, 
    dexScreenerPair: dexScreenerPair,
  };
}

// --- Individual Check Functions ---

function checkMintAuthority(assetData: any): CheckResult {
  if (assetData.ownership.mint_authority) {
    return {
      status: 'fail',
      message: '❌ Mint Authority Active: The creator can print infinite new tokens.',
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
      message: '❌ Freeze Authority Active: The creator can freeze this token in your wallet.',
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

function checkHolderDistribution(holders: any[], totalSupply: number): CheckResult {
  if (totalSupply === 0) {
    return {
      status: 'pass',
      message: '✅ Token has 0 supply. Holder distribution is not applicable.',
    };
  }
  if (!holders || holders.length === 0) {
    return { status: 'fail', message: '❌ Could not retrieve holder data.' };
  }
  const top10 = holders.slice(0, 10);
  const top10Balance = top10.reduce((sum, holder) => {
    const amount = parseFloat(holder.uiAmount); 
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  const top10Percentage = (top10Balance / totalSupply) * 100;
  if (isNaN(top10Percentage)) {
    return { status: 'fail', message: '❌ Failed to calculate holder distribution.' };
  }
  const top1HolderAmount = parseFloat(holders[0]?.uiAmount) || 0;
  const top1Percentage = (top1HolderAmount / totalSupply) * 100;

  if (top1Percentage > 10) {
     return {
      status: 'fail',
      message: `❌ Extreme Risk: The top wallet holds ${top1Percentage.toFixed(1)}% of the supply.`,
    };
  }
  if (top1Percentage > 5) {
     return {
      status: 'warn',
      message: `⚠️ High Risk: The top wallet holds ${top1Percentage.toFixed(1)}% of the supply.`,
    };
  }
  if (top10Percentage > 25) {
    return {
      status: 'warn',
      message: `⚠️ High Concentration: The top 10 wallets hold ${top10Percentage.toFixed(1)}% of the supply.`,
    };
  }
  return {
    status: 'pass',
    message: `✅ Healthy Distribution: Top wallet holds ${top1Percentage.toFixed(1)}% and top 10 hold ${top10Percentage.toFixed(1)}%.`,
  };
}

function checkLiquidity(pair: any, totalSupply: number): CheckResult {
  if (totalSupply === 0) {
    return {
      status: 'pass',
      message: '✅ Token has 0 supply. Liquidity is not applicable.',
    };
  }
  if (!pair || !pair.liquidity) {
    return {
      status: 'fail',
      message: '❌ No Liquidity: This token has no discoverable liquidity pool.',
    };
  }
  const lpValue = parseFloat(pair.liquidity.usd);
  if (lpValue < 10000) {
    return {
      status: 'fail',
      message: `❌ Dangerously Low Liquidity: Only $${lpValue.toLocaleString()} in the pool.`,
    };
  }
  if (lpValue < 50000) {
    return {
      status: 'warn',
      message: `⚠️ Low Liquidity: Only $${lpValue.toLocaleString()} in the pool.`,
    };
  }
  return {
    status: 'pass',
    message: `✅ Liquidity Found: $${lpValue.toLocaleString()} in the pool.`,
  };
}

// --- 4. THIS IS THE NEW LP LOCK CHECK FUNCTION ---
async function checkLpLock(pair: any): Promise<CheckResult> {
  if (!pair || !pair.lpToken) {
    return {
      status: 'fail',
      message: '❌ LP Check Failed: Could not find liquidity pool token.'
    };
  }

  const lpMintAddress = pair.lpToken.address;
  
  try {
    const holders = await fetchHeliusTokenLargestHolders(lpMintAddress);
    if (!holders || holders.length === 0) {
      return {
        status: 'fail',
        message: '❌ LP Check Failed: Could not fetch LP token holders.'
      };
    }
    
    // Check the #1 holder of the LP token
    const topHolder = holders[0];
    const topHolderAddress = topHolder.address;
    const topHolderAmount = parseFloat(topHolder.uiAmount);

    // Check if the LP tokens are in a known burn address
    if (BURN_ADDRESSES.has(topHolderAddress)) {
      return {
        status: 'pass',
        message: '✅ LP Burned: 100% of liquidity pool tokens are in a burn address.'
      };
    }
    
    // We can add more checks here later for known lock contracts (e.g., Streamflow)
    
    // If not burned, it's in a private wallet. This is a critical failure.
    return {
      status: 'fail',
      message: `❌ LP Not Locked: 100% of liquidity is held in a private wallet (${shortenAddress(topHolderAddress)}). Extreme rug pull risk.`
    };

  } catch (error) {
    console.error("Failed to check LP lock status:", error);
    return {
      status: 'fail',
      message: '❌ LP Check Failed: An error occurred while checking LP holders.'
    };
  }
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
  return data.result.value; 
}

// --- NEW: Helper function to shorten address (needed for new check) ---
function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
}